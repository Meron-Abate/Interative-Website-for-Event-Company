#!/usr/bin/env node
/**
 * ETERNAL — build the website's CMS-managed content from Payload.
 *
 * Generates / updates:
 *   - work/<slug>/index.html      one case-study page per published project (from templates/case-study.html)
 *   - work/index.html             project grid + category filter buttons
 *   - index.html                  "How We Can Help" service panels, "Selected Work" cards, project counts
 *   - sitemap.xml                 home, work, contact + every project page
 *   - assets/cms/                 optimised WebP images downloaded from Payload
 *
 * Only regions between <!-- cms:name --> ... <!-- /cms:name --> markers are replaced; the rest of
 * each page is left exactly as it is. Everything is generated in memory first: if the CMS is
 * unreachable or returns bad data, no file is touched and the script exits with code 1.
 *
 * Usage:   node scripts/build-from-cms.mjs
 * Env:     CMS_URL   (default http://localhost:3000)   Payload server
 *          SITE_KEY  (default eternal-events)          which site's content to build
 *          SITE_URL  (default https://eternalstudio.com) public address, for canonical URLs + sitemap
 *          DRY_RUN=1 prints what would change without writing
 */
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CMS_URL = (process.env.CMS_URL || 'http://localhost:3000').replace(/\/$/, '')
const SITE_KEY = process.env.SITE_KEY || 'eternal-events'
const SITE_URL = (process.env.SITE_URL || 'https://eternalstudio.com').replace(/\/$/, '')
const DRY_RUN = process.env.DRY_RUN === '1'
const ASSET_DIR = 'assets/cms'
const MANIFEST = path.join(ROOT, 'work', '.cms-generated.json')
const LOCK = path.join(ROOT, '.cms-build.lock')

// Must match eternal-cms/src/shared/options.ts
const CATEGORIES = [
  { value: 'corporate-events', label: 'Corporate Events' },
  { value: 'international-conferences', label: 'International Conferences' },
  { value: 'concerts', label: 'Concerts' },
  { value: 'private-events', label: 'Private Events' },
  { value: 'cultural-events', label: 'Cultural Events' },
]
const categoryLabel = (v) => CATEGORIES.find((c) => c.value === v)?.label || ''

/* ------------------------------------------------------------------ helpers */

const esc = (v) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
const pad = (n) => String(n).padStart(2, '0')
const log = (...a) => console.log('[cms-build]', ...a)

async function api(pathAndQuery, attempts = 3) {
  let lastErr
  for (let i = 1; i <= attempts; i += 1) {
    try {
      const res = await fetch(`${CMS_URL}/api/${pathAndQuery}`, { signal: AbortSignal.timeout(60_000) })
      if (!res.ok) throw new Error(`HTTP ${res.status} for /api/${pathAndQuery}`)
      return await res.json()
    } catch (err) {
      lastErr = err
      if (i < attempts) await new Promise((r) => setTimeout(r, 1500 * i))
    }
  }
  throw lastErr
}

const q = (obj) =>
  Object.entries(obj)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&')

/* ------------------------------------------------------------------ images */

const neededImages = new Map() // local filename -> remote url

/**
 * Returns <img> attributes for a Payload media doc, using its WebP sizes as a srcset.
 * prefix is the relative path from the page to the site root ('' | '../' | '../../').
 */
function imageAttrs(media, prefix, sizes, { eager = false, alt } = {}) {
  if (!media || typeof media !== 'object' || !media.url) return null
  const variants = ['thumbnail', 'card', 'hero']
    .map((name) => media.sizes?.[name])
    .filter((s) => s?.url && s.width)
    .sort((a, b) => a.width - b.width)
    .filter((s, i, arr) => i === arr.findIndex((o) => o.width === s.width))
  const pick = variants.length ? variants : [{ url: media.url, width: media.width, height: media.height }]
  const local = (url) => {
    const name = decodeURIComponent(url.split('/').pop().split('?')[0])
    neededImages.set(name, url.startsWith('http') ? url : `${CMS_URL}${url}`)
    return `${prefix}${ASSET_DIR}/${encodeURIComponent(name)}`
  }
  const fallback = pick.find((v) => v.width >= 960) || pick[pick.length - 1]
  const srcset = pick.map((v) => `${local(v.url)} ${v.width}w`).join(', ')
  const width = fallback.width || media.width
  const height = fallback.height || media.height
  return [
    `srcset="${srcset}"`,
    `sizes="${sizes}"`,
    eager ? 'fetchpriority="high"' : '',
    'decoding="async"',
    width ? `width="${width}" height="${height}"` : '',
    `src="${local(fallback.url)}"`,
    `alt="${esc(alt ?? media.alt ?? '')}"`,
    `loading="${eager ? 'eager' : 'lazy'}"`,
  ]
    .filter(Boolean)
    .join(' ')
}

async function downloadImages() {
  const dir = path.join(ROOT, ASSET_DIR)
  await fsp.mkdir(dir, { recursive: true })
  const queue = [...neededImages.entries()]
  let fetched = 0
  const worker = async () => {
    while (queue.length) {
      const [name, url] = queue.shift()
      const dest = path.join(dir, name)
      if (fs.existsSync(dest) && fs.statSync(dest).size > 0) continue // filenames are unique per upload
      const res = await fetch(url, { signal: AbortSignal.timeout(120_000) })
      if (!res.ok) throw new Error(`image ${url} -> HTTP ${res.status}`)
      const buf = Buffer.from(await res.arrayBuffer())
      await fsp.writeFile(`${dest}.tmp`, buf)
      await fsp.rename(`${dest}.tmp`, dest)
      fetched += 1
    }
  }
  await Promise.all(Array.from({ length: 4 }, worker))
  // Remove images no longer referenced by any published content
  let removed = 0
  for (const f of await fsp.readdir(dir)) {
    if (!neededImages.has(f)) {
      await fsp.unlink(path.join(dir, f))
      removed += 1
    }
  }
  return { fetched, removed }
}

/* ------------------------------------------------------------------ rich text (Lexical JSON -> HTML) */

function lexicalToHtml(node) {
  if (!node) return ''
  const kids = (n) => (n.children || []).map(lexicalToHtml).join('')
  switch (node.type) {
    case 'root':
      return kids(node)
    case 'paragraph': {
      const inner = kids(node)
      return inner.trim() ? `<p>${inner}</p>` : ''
    }
    case 'heading': {
      const tag = /^h[2-6]$/.test(node.tag) ? node.tag : 'h3'
      return `<${tag}>${kids(node)}</${tag}>`
    }
    case 'list':
      return node.listType === 'number' ? `<ol>${kids(node)}</ol>` : `<ul>${kids(node)}</ul>`
    case 'listitem':
      return `<li>${kids(node)}</li>`
    case 'quote':
      return `<blockquote>${kids(node)}</blockquote>`
    case 'linebreak':
      return '<br>'
    case 'horizontalrule':
      return '<hr>'
    case 'link':
    case 'autolink': {
      const url = node.fields?.url || node.url || '#'
      const safe = /^(https?:|mailto:|tel:|\/|#)/i.test(url) ? url : '#'
      const ext = node.fields?.newTab ? ' target="_blank" rel="noopener"' : ''
      return `<a href="${esc(safe)}"${ext}>${kids(node)}</a>`
    }
    case 'upload': {
      const attrs = imageAttrs(node.value, '../../', '(max-width: 767px) 100vw, 60vw')
      return attrs ? `<figure class="case-richtext-figure"><img ${attrs}></figure>` : ''
    }
    case 'text': {
      let t = esc(node.text)
      const f = node.format || 0
      if (f & 16) t = `<code>${t}</code>`
      if (f & 1) t = `<strong>${t}</strong>`
      if (f & 2) t = `<em>${t}</em>`
      if (f & 8) t = `<u>${t}</u>`
      if (f & 4) t = `<s>${t}</s>`
      return t
    }
    default:
      return kids(node)
  }
}

/* ------------------------------------------------------------------ renderers */

const ARROW_NE =
  '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg>'
const ARROW_R =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'

const cardImageOf = (p) => (p.cardImage && typeof p.cardImage === 'object' ? p.cardImage : p.cover)

function renderWorkFilters(projects) {
  const all = `          <button class="filter-btn is-active" data-filter="all">ALL (${pad(projects.length)})</button>`
  const cats = CATEGORIES.map(
    (c) => `          <button class="filter-btn" data-filter="${c.value}">${esc(c.label)}</button>`,
  )
  return [all, ...cats].join('\n')
}

function renderWorkGrid(projects) {
  return projects
    .map((p, i) => {
      const img = imageAttrs(cardImageOf(p), '../', '(max-width: 767px) 100vw, 50vw', { alt: cardImageOf(p)?.alt || p.title })
      return `          <!-- ${pad(i + 1)} -->
          <article class="work-archive-card" data-category="${esc(p.category)}" data-cursor="view">
            <a href="/work/${esc(p.slug)}/" style="display: block;">
              <div class="portfolio-card-media" style="aspect-ratio: 16 / 10;">
                <div class="portfolio-card-action" aria-hidden="true">
                  ${ARROW_NE}
                </div>
                ${img ? `<img ${img}>` : ''}
              </div>
              <div class="portfolio-card-info">
                <div class="portfolio-card-header">
                  <h2 class="portfolio-card-title">${esc(p.title)}</h2>
                  <span class="portfolio-card-year">${esc(p.year)}</span>
                </div>
                <p class="portfolio-card-category">${esc(p.location || categoryLabel(p.category))}</p>
              </div>
            </a>
          </article>`
    })
    .join('\n\n')
}

function renderSelectedWork(projects) {
  return projects
    .map((p) => {
      const img = imageAttrs(cardImageOf(p), '', '(max-width: 640px) 46vw, 260px', { alt: '' })
      return `          <li class="work-card" data-year="${esc(p.year)}" data-meta="${esc(p.location || '')}" data-cursor="view">
            <a class="work-card-link" href="/work/${esc(p.slug)}/">
              <span class="work-card-media">${img ? `<img ${img} draggable="false">` : ''}</span>
              <span class="work-card-title">${esc(p.title)}</span>
            </a>
          </li>`
    })
    .join('\n')
}

function renderServices(services) {
  return services
    .map((s, i) => {
      const active = i === 0
      const peek = imageAttrs(s.icon, '', '(max-width: 767px) 64px, 22vw', { alt: '' })
      const media = imageAttrs(s.icon, '', '(max-width: 767px) 100vw, 40vw', { alt: '' })
      const caps = (s.capabilities || [])
        .map((c) => `                <li>${esc(c.label)}</li>`)
        .join('\n')
      return `        <article class="svp${active ? ' is-active' : ''}" data-index="${i}">
          <button class="svp-trigger" type="button" aria-expanded="${active}" aria-controls="svp-body-${i}" id="svp-trigger-${i}">
            <span class="svp-peek" aria-hidden="true">${peek ? `<img ${peek} draggable="false">` : ''}</span>
            <span class="svp-label">${esc(s.title)}</span>
            <span class="svp-explore" aria-hidden="true"><span>Explore</span><span class="svp-explore-arrow">${ARROW_R}</span></span>
          </button>
          <div class="svp-media" aria-hidden="true">${media ? `<img ${media} draggable="false">` : ''}</div>
          <div class="svp-body" id="svp-body-${i}" role="region" aria-labelledby="svp-trigger-${i}">
            <h3 class="svp-title">${esc(s.title)}</h3>
            <p class="svp-desc">${esc(s.description)}</p>
${caps ? `            <div class="svp-caps-wrap">
              <h4 class="svp-eyebrow">Capabilities</h4>
              <ul class="svp-caps">
${caps}
              </ul>
            </div>
` : ''}            <a href="${esc(s.ctaLink || '#contact')}" class="svp-cta" data-cursor="link">${esc(s.ctaLabel || 'INQUIRE THIS SERVICE')} <span aria-hidden="true">&rarr;</span></a>
          </div>
        </article>`
    })
    .join('\n')
}

function renderCaseHead(p) {
  const url = `${SITE_URL}/work/${p.slug}/`
  const title = p.metaTitle || `${p.title} — Case Study | ETERNAL Events`
  const description = (p.metaDescription || p.summary || '').trim()
  const og = p.ogImage && typeof p.ogImage === 'object' ? p.ogImage : p.cover
  const ogUrl = og?.sizes?.hero?.url || og?.url
  let ogLocal = ''
  if (ogUrl) {
    const name = decodeURIComponent(ogUrl.split('/').pop().split('?')[0])
    neededImages.set(name, ogUrl.startsWith('http') ? ogUrl : `${CMS_URL}${ogUrl}`)
    ogLocal = `${SITE_URL}/${ASSET_DIR}/${encodeURIComponent(name)}`
  }
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: p.title,
    description,
    url,
    dateCreated: p.year ? String(p.year) : undefined,
    image: ogLocal || undefined,
    creator: { '@type': 'Organization', name: 'ETERNAL Events', url: `${SITE_URL}/` },
    ...(p.client ? { sponsor: { '@type': 'Organization', name: p.client } } : {}),
    ...(p.venue || p.location ? { locationCreated: { '@type': 'Place', name: p.venue || p.location } } : {}),
  }
  return [
    `  <title>${esc(title)}</title>`,
    `  <meta name="description" content="${esc(description)}">`,
    `  <link rel="canonical" href="${esc(url)}">`,
    '',
    '  <meta property="og:type" content="article">',
    `  <meta property="og:title" content="${esc(p.title)} — ETERNAL Case Study">`,
    `  <meta property="og:description" content="${esc(description)}">`,
    `  <meta property="og:url" content="${esc(url)}">`,
    ogLocal ? `  <meta property="og:image" content="${esc(ogLocal)}">` : '',
    '  <meta name="twitter:card" content="summary_large_image">',
    `  <script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`,
  ]
    .filter((l) => l !== '')
    .join('\n')
}

function renderCaseMain(p, index, all) {
  const hero = imageAttrs(p.cover, '../../', '100vw', { eager: true, alt: p.cover?.alt || p.title })
  // Hero shows a short "City, Country" line: the last two parts of the venue, else the card location
  const city = p.venue && p.venue.includes(',') ? p.venue.split(',').slice(-2).map((s) => s.trim()).join(', ') : p.location
  const meta = [p.tagline || categoryLabel(p.category), city, p.year].filter(Boolean)
  const services = (p.servicesDelivered || []).map((s) => s.label).filter(Boolean)
  const facts = [
    p.client && ['CLIENT', p.client],
    (p.venue || p.location) && ['LOCATION', p.venue || p.location],
    p.year && ['YEAR', p.year],
    services.length && ['SERVICES', services.join(', ')],
    ...(p.info || []).map((f) => [String(f.label).toUpperCase(), f.value]),
  ].filter(Boolean)
  const next = all[(index + 1) % all.length]
  const parts = []

  parts.push(`    <!-- 1. HERO -->
    <section class="case-hero" aria-label="Case Study Hero">
      <div class="case-hero-media">
        ${hero ? `<img ${hero}>` : ''}
      </div>
      <div class="hero-overlay" aria-hidden="true"></div>

      <div class="container case-hero-content">
        <span class="meta-label">${pad(index + 1)} CASE STUDY</span>
        <h1 class="case-hero-title">
          ${esc(p.title.toUpperCase())}
        </h1>
        <div class="case-hero-meta">
${meta.map((m) => `          <span>${esc(String(m).toUpperCase())}</span>`).join('\n')}
        </div>
      </div>
    </section>`)

  if (facts.length) {
    parts.push(`    <!-- 2. PROJECT INFORMATION -->
    <section class="case-info-section" aria-label="Project Information">
      <div class="container">
        <div class="case-info-grid">
${facts
  .map(
    ([label, value]) => `          <div class="case-info-block">
            <span class="case-info-label">${esc(label)}</span>
            <span class="case-info-value">${esc(value)}</span>
          </div>`,
  )
  .join('\n')}
        </div>
      </div>
    </section>`)
  }

  const narrative = [
    p.challenge && ['01 CONTEXT', 'THE CHALLENGE', p.challenge],
    p.solution && ['02 STRATEGY', 'THE SOLUTION', p.solution],
  ].filter(Boolean)
  if (narrative.length) {
    parts.push(`    <!-- 3 & 4. THE CHALLENGE & THE SOLUTION -->
    <section class="case-narrative-section">
      <div class="container">
        <div class="narrative-grid">
${narrative
  .map(
    ([label, heading, text]) => `          <div class="narrative-col">
            <span class="meta-label">${label}</span>
            <h3>${heading}</h3>
            <p>
              ${esc(text)}
            </p>
          </div>`,
  )
  .join('\n\n')}
        </div>
      </div>
    </section>`)
  }

  const body = p.body?.root ? lexicalToHtml(p.body.root).trim() : ''
  if (body) {
    parts.push(`    <!-- DETAILED CASE STUDY -->
    <section class="case-narrative-section case-story-section">
      <div class="container">
        <div class="case-richtext">
          ${body}
        </div>
      </div>
    </section>`)
  }

  if ((p.approach || []).length) {
    parts.push(`    <!-- 5. OUR APPROACH -->
    <section class="case-approach-section">
      <div class="container">
        <span class="meta-label">EXECUTION PHASES</span>
        <h2 style="font-size: clamp(2rem, 4vw, 3.5rem); text-transform: uppercase; margin-top: 1rem;">
          OUR APPROACH
        </h2>

        <div class="approach-steps-grid">
${p.approach
  .map(
    (s, i) => `          <div class="approach-card">
            <span class="approach-step-num">${pad(i + 1)}</span>
            <h4 class="approach-step-title">${esc(s.title)}</h4>
            <p class="approach-step-desc">${esc(s.description)}</p>
          </div>`,
  )
  .join('\n')}
        </div>
      </div>
    </section>`)
  }

  const gallery = (p.gallery || []).filter((g) => g?.image && typeof g.image === 'object')
  if (gallery.length) {
    const layout = ['gallery-item--left', 'gallery-item--right', 'gallery-item--full']
    parts.push(`    <!-- 8. VISUAL GALLERY -->
    <section class="case-gallery-section">
      <div class="container">
        <h2 style="font-size: clamp(2rem, 3.5vw, 3.2rem); text-transform: uppercase; margin: 1rem 0 3.5rem;">
          PRODUCTION ARCHIVE
        </h2>

        <div class="gallery-editorial-grid">
${gallery
  .map((g, i) => {
    const attrs = imageAttrs(g.image, '../../', '(max-width: 767px) 100vw, 60vw', { alt: g.caption || g.image.alt })
    return `          <div class="gallery-item ${layout[i % 3]}" data-cursor="image">
            ${attrs ? `<img ${attrs}>` : ''}
          </div>`
  })
  .join('\n')}
        </div>
      </div>
    </section>`)
  }

  if (next && next.slug !== p.slug) {
    parts.push(`    <!-- 11. NEXT PROJECT -->
    <a href="/work/${esc(next.slug)}/" class="case-next-project" data-cursor="view">
      <div class="container next-project-inner">
        <span class="meta-label">NEXT CASE STUDY ${pad(((index + 1) % all.length) + 1)}</span>
        <h2 class="next-project-title">${esc(next.title)} →</h2>
      </div>
    </a>`)
  }

  return parts.join('\n\n')
}

function renderSitemap(projects) {
  const today = new Date().toISOString().slice(0, 10)
  const urls = [
    { loc: `${SITE_URL}/`, lastmod: today, freq: 'weekly', pri: '1.0' },
    { loc: `${SITE_URL}/work/`, lastmod: today, freq: 'weekly', pri: '0.9' },
    { loc: `${SITE_URL}/contact/`, lastmod: today, freq: 'monthly', pri: '0.8' },
    ...projects.map((p) => ({
      loc: `${SITE_URL}/work/${p.slug}/`,
      lastmod: (p.updatedAt || '').slice(0, 10) || today,
      freq: 'monthly',
      pri: '0.8',
    })),
  ]
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${esc(u.loc)}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.freq}</changefreq>
    <priority>${u.pri}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`
}

/* ------------------------------------------------------------------ marker replacement */

function replaceRegion(html, name, content, file) {
  const re = new RegExp(`(<!-- cms:${name} -->)([\\s\\S]*?)(<!-- /cms:${name} -->)`, 'g')
  if (!re.test(html)) throw new Error(`marker <!-- cms:${name} --> not found in ${file}`)
  const inline = !content.includes('\n')
  return html.replace(re, (_, open, old, close) => {
    if (inline) return `${open}${content}${close}`
    const indent = /\n([ \t]*)$/.exec(old)?.[1] ?? ''
    return `${open}\n${content}\n${indent}${close}`
  })
}

/** Keeps the file's own line endings so diffs stay clean. */
function readText(file) {
  const raw = fs.readFileSync(file, 'utf8')
  return { text: raw.replace(/\r\n/g, '\n'), crlf: raw.includes('\r\n') }
}

/* ------------------------------------------------------------------ main */

async function main() {
  // Avoid two builds writing at once (e.g. a publish while a cron build runs)
  if (fs.existsSync(LOCK) && Date.now() - fs.statSync(LOCK).mtimeMs < 10 * 60 * 1000) {
    log('another build is running; skipping')
    return
  }
  if (!DRY_RUN) fs.writeFileSync(LOCK, String(process.pid))

  try {
    log(`fetching content for "${SITE_KEY}" from ${CMS_URL}`)
    // The API only returns published documents to anonymous requests.
    const [projRes, svcRes, homeRes] = await Promise.all([
      api(`projects?${q({ 'where[site][equals]': SITE_KEY, 'where[_status][equals]': 'published', depth: 1, limit: 500, sort: 'order' })}`),
      api(`services?${q({ 'where[site][equals]': SITE_KEY, 'where[_status][equals]': 'published', depth: 1, limit: 100, sort: 'order' })}`),
      api(`homepages?${q({ 'where[site][equals]': SITE_KEY, depth: 0, limit: 1 })}`),
    ])
    for (const [name, r] of [['projects', projRes], ['services', svcRes], ['homepages', homeRes]]) {
      if (!Array.isArray(r?.docs)) throw new Error(`unexpected response for ${name}`)
    }

    const projects = projRes.docs
      .filter((p) => p.slug && p.title && p.cover)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || (b.year ?? 0) - (a.year ?? 0))
    const services = svcRes.docs
    const home = homeRes.docs[0] || {}
    const ids = (list) => (list || []).map((x) => (typeof x === 'object' ? x.id : x))

    const homeServices = ids(home.featuredServices).length
      ? ids(home.featuredServices).map((id) => services.find((s) => s.id === id)).filter(Boolean)
      : services.filter((s) => s.isFeatured !== false)
    const homeProjects = ids(home.featuredProjects).length
      ? ids(home.featuredProjects).map((id) => projects.find((p) => p.id === id)).filter(Boolean)
      : projects.filter((p) => p.featured)

    if (!projects.length) log('warning: no published projects — the Work page grid will be empty')

    const writes = new Map() // absolute path -> content

    // Case-study pages
    const template = fs.readFileSync(path.join(ROOT, 'templates', 'case-study.html'), 'utf8').replace(/\r\n/g, '\n')
    projects.forEach((p, i) => {
      const page = template.replace('{{HEAD_META}}', () => renderCaseHead(p)).replace('{{MAIN}}', () => renderCaseMain(p, i, projects))
      writes.set(path.join(ROOT, 'work', p.slug, 'index.html'), page)
    })

    // Work page
    const workFile = path.join(ROOT, 'work', 'index.html')
    let work = readText(workFile)
    let workHtml = replaceRegion(work.text, 'work-filters', renderWorkFilters(projects), workFile)
    workHtml = replaceRegion(workHtml, 'work-grid', renderWorkGrid(projects), workFile)
    writes.set(workFile, work.crlf ? workHtml.replace(/\n/g, '\r\n') : workHtml)

    // Homepage
    const homeFile = path.join(ROOT, 'index.html')
    const idx = readText(homeFile)
    let homeHtml = replaceRegion(idx.text, 'services-heading', esc(home.servicesHeading || 'HOW WE CAN HELP'), homeFile)
    homeHtml = replaceRegion(homeHtml, 'services', renderServices(homeServices), homeFile)
    homeHtml = replaceRegion(homeHtml, 'selected-work-heading', esc(home.selectedWorkHeading || 'SELECTED WORK'), homeFile)
    homeHtml = replaceRegion(homeHtml, 'selected-work', renderSelectedWork(homeProjects), homeFile)
    homeHtml = replaceRegion(homeHtml, 'project-count', pad(projects.length), homeFile)
    writes.set(homeFile, idx.crlf ? homeHtml.replace(/\n/g, '\r\n') : homeHtml)

    // Sitemap
    writes.set(path.join(ROOT, 'sitemap.xml'), renderSitemap(projects))

    if (DRY_RUN) {
      for (const f of writes.keys()) log('would write', path.relative(ROOT, f))
      log(`would download ${neededImages.size} images`)
      return
    }

    // 1) images first — if any download fails, no page is changed
    const img = await downloadImages()

    // 2) pages (written to a temp file, then renamed, so visitors never see a half-written page)
    for (const [file, content] of writes) {
      await fsp.mkdir(path.dirname(file), { recursive: true })
      await fsp.writeFile(`${file}.tmp`, content)
      await fsp.rename(`${file}.tmp`, file)
    }

    // 3) remove case-study pages for projects that were unpublished or deleted
    const previous = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) : []
    const current = projects.map((p) => p.slug)
    for (const slug of previous) {
      if (!current.includes(slug) && /^[a-z0-9-]+$/.test(slug)) {
        await fsp.rm(path.join(ROOT, 'work', slug), { recursive: true, force: true })
        log('removed page for', slug)
      }
    }
    await fsp.writeFile(MANIFEST, JSON.stringify(current, null, 2))

    log(
      `done: ${projects.length} projects (${homeProjects.length} on homepage), ${homeServices.length} services, ` +
        `${neededImages.size} images (${img.fetched} downloaded, ${img.removed} removed)`,
    )
  } finally {
    if (!DRY_RUN && fs.existsSync(LOCK)) fs.unlinkSync(LOCK)
  }
}

main().catch((err) => {
  console.error('[cms-build] FAILED — the website was not changed.')
  console.error(err?.stack || err)
  process.exit(1)
})
