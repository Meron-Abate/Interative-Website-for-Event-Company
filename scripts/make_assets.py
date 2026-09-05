import os

def write_svg(filepath, content):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content.strip())

# 1. Hero Poster
hero_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="100%" height="100%">
  <defs>
    <radialGradient id="heroGrad" cx="50%" cy="45%" r="70%">
      <stop offset="0%" stop-color="#ff5a36" stop-opacity="0.45"/>
      <stop offset="35%" stop-color="#8b2510" stop-opacity="0.2"/>
      <stop offset="70%" stop-color="#140804" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="#080808" stop-opacity="1"/>
    </radialGradient>
    <linearGradient id="beam1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.15"/>
      <stop offset="50%" stop-color="#ff5a36" stop-opacity="0.05"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="beam2" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffaa40" stop-opacity="0.18"/>
      <stop offset="60%" stop-color="#ff5a36" stop-opacity="0.03"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </linearGradient>
    <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
      <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#ffffff" stroke-width="0.5" stroke-opacity="0.04"/>
    </pattern>
  </defs>

  <rect width="1920" height="1080" fill="#080808"/>
  <rect width="1920" height="1080" fill="url(#heroGrad)"/>
  <rect width="1920" height="1080" fill="url(#grid)"/>

  <!-- Monumental Scenographic Geometry -->
  <circle cx="960" cy="540" r="420" fill="none" stroke="#ff5a36" stroke-width="1.5" stroke-opacity="0.25" stroke-dasharray="4 8"/>
  <circle cx="960" cy="540" r="320" fill="none" stroke="#ffffff" stroke-width="1" stroke-opacity="0.15"/>
  <circle cx="960" cy="540" r="160" fill="#ff5a36" fill-opacity="0.08" stroke="#ff5a36" stroke-width="1" stroke-opacity="0.4"/>

  <!-- Light Beams -->
  <polygon points="960,120 400,1080 1520,1080" fill="url(#beam1)"/>
  <polygon points="400,0 1200,1080 800,1080" fill="url(#beam2)"/>
  <polygon points="1520,0 720,1080 1120,1080" fill="url(#beam1)"/>

  <!-- Horizon Stage Line and Silhouettes -->
  <line x1="200" y1="780" x2="1720" y2="780" stroke="#ff5a36" stroke-width="2" stroke-opacity="0.5"/>
  <path d="M 760 780 C 820 740, 880 730, 960 730 C 1040 730, 1100 740, 1160 780 Z" fill="#0e0e12" stroke="#ff5a36" stroke-width="1" stroke-opacity="0.3"/>

  <!-- Floating Cinematic Typography and Metadata -->
  <text x="160" y="180" fill="#ff5a36" font-family="sans-serif" font-size="14" font-weight="600" letter-spacing="6">ETERNAL STUDIO // SPATIAL ARCHITECTURE</text>
  <text x="1760" y="180" text-anchor="end" fill="#858585" font-family="monospace" font-size="12" letter-spacing="3">9°01'48"N 38°45'28"E - PAN-AFRICAN</text>
  <text x="160" y="940" fill="#ffffff" fill-opacity="0.3" font-family="monospace" font-size="12" letter-spacing="2">ATMOSPHERE // LIGHT // RITUAL // KINETICS</text>
  <text x="1760" y="940" text-anchor="end" fill="#ff5a36" font-family="monospace" font-size="12" letter-spacing="4">EST. 2020 - ADDIS ABABA / NAIROBI / LONDON</text>
</svg>'''

write_svg('assets/images/hero/hero-poster.svg', hero_svg)
write_svg('assets/videos/hero-poster.svg', hero_svg)

# 2. Services SVGs
services_meta = [
    ('service-01.svg', 'EVENT STRATEGY & PRODUCTION', '01', '#ff5a36', 'Master Planning // Structural Engineering // Spatial Routing', '<circle cx="400" cy="300" r="180" fill="none" stroke="#ff5a36" stroke-width="2" stroke-opacity="0.4"/>'),
    ('service-02.svg', 'CREATIVE & EXPERIENCE DESIGN', '02', '#ff7a45', 'Monumental Scenography // Sensory Chambers // Kinetic Art', '<polygon points="400,140 560,420 240,420" fill="none" stroke="#ff7a45" stroke-width="2" stroke-opacity="0.5"/>'),
    ('service-03.svg', 'BRAND ACTIVATIONS', '03', '#ff8b54', 'Cultural Relevance // Ephemeral Architecture // VIP Salons', '<rect x="260" y="160" width="280" height="280" rx="8" fill="none" stroke="#ff8b54" stroke-width="2" stroke-opacity="0.5" transform="rotate(15 400 300)"/>'),
    ('service-04.svg', 'DIGITAL & IMMERSIVE EXPERIENCES', '04', '#ff4d29', 'Projection Mapping // Spatial Audio // Generative GLSL', '<path d="M 200 300 Q 400 120 600 300 T 1000 300" fill="none" stroke="#ff4d29" stroke-width="2" stroke-opacity="0.6"/>'),
    ('service-05.svg', 'TALENT & ARTIST MANAGEMENT', '05', '#ff946e', 'African Vanguard // Visionary Keynotes // Master Performers', '<circle cx="400" cy="240" r="90" fill="none" stroke="#ff946e" stroke-width="2" stroke-opacity="0.5"/><path d="M 280 440 C 280 340, 520 340, 520 440" fill="none" stroke="#ff946e" stroke-width="2" stroke-opacity="0.5"/>'),
    ('service-06.svg', 'CONTENT & MOTION', '06', '#ff5a36', '4K Cinematic Documentaries // Screen Scenography // Broadcast', '<rect x="240" y="200" width="320" height="200" rx="4" fill="none" stroke="#ff5a36" stroke-width="2" stroke-opacity="0.5"/><polygon points="375,270 445,300 375,330" fill="#ff5a36" fill-opacity="0.8"/>')
]

for filename, title, num, accent, sub, geo in services_meta:
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
  <defs>
    <radialGradient id="grad_{num}" cx="50%" cy="50%" r="60%">
      <stop offset="0%" stop-color="{accent}" stop-opacity="0.28"/>
      <stop offset="60%" stop-color="#110906" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#080808" stop-opacity="1"/>
    </radialGradient>
  </defs>
  <rect width="800" height="600" fill="#080808"/>
  <rect width="800" height="600" fill="url(#grad_{num})"/>
  <!-- Geometry -->
  <g>{geo}</g>
  <!-- Concentric Rings -->
  <circle cx="400" cy="300" r="240" fill="none" stroke="#ffffff" stroke-width="0.75" stroke-opacity="0.08" stroke-dasharray="6 6"/>
  <!-- Typography -->
  <text x="60" y="80" fill="{accent}" font-family="monospace" font-size="14" letter-spacing="4">SERVICE ARCHIVE // {num}</text>
  <text x="60" y="510" fill="#ffffff" font-family="sans-serif" font-size="24" font-weight="700" letter-spacing="2">{title}</text>
  <text x="60" y="545" fill="#858585" font-family="monospace" font-size="12" letter-spacing="1">{sub}</text>
</svg>'''
    write_svg(f'assets/images/services/{filename}', svg)

# 3. Project SVGs
projects_meta = [
    ('africa-creative-summit', 'AFRICA CREATIVE SUMMIT', 'EVENT PRODUCTION / EXPERIENCE', 'ADDIS ABABA, 2026', '#ff5a36', 'Kinetic 360 Living Agora'),
    ('night-of-culture', 'NIGHT OF CULTURE', 'BRAND EXPERIENCE', 'NAIROBI, 2026', '#ff7a45', 'Nocturnal Light & Sensory Chambers'),
    ('future-of-business', 'THE FUTURE OF BUSINESS', 'CORPORATE EXPERIENCE', 'KIGALI, 2025', '#ff946e', 'Monumental Circular Agora & Real-Time Data'),
    ('city-of-light', 'CITY OF LIGHT', 'IMMERSIVE EXPERIENCE', 'CAPE TOWN, 2025', '#ff4520', '32-Laser Monumental Silo Projection Mapping'),
    ('africa-in-motion', 'AFRICA IN MOTION', 'CULTURAL EVENT', 'DAKAR, 2025', '#ff6b3d', 'Coastal Volcanic Stone Scenography & Kinetic Sails')
]

for slug, title, cat, loc, accent, feature in projects_meta:
    # Hero SVG
    hero_p = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" width="100%" height="100%">
  <defs>
    <radialGradient id="pgrad_{slug}" cx="50%" cy="45%" r="65%">
      <stop offset="0%" stop-color="{accent}" stop-opacity="0.4"/>
      <stop offset="40%" stop-color="#180a06" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#080808" stop-opacity="1"/>
    </radialGradient>
    <linearGradient id="beam_{slug}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="1600" height="1000" fill="#080808"/>
  <rect width="1600" height="1000" fill="url(#pgrad_{slug})"/>
  
  <!-- Architectural Vector Grid & Laser Arrays -->
  <circle cx="800" cy="500" r="380" fill="none" stroke="{accent}" stroke-width="1.5" stroke-opacity="0.3" stroke-dasharray="4 8"/>
  <circle cx="800" cy="500" r="220" fill="none" stroke="#ffffff" stroke-width="1" stroke-opacity="0.15"/>
  <polygon points="800,150 450,900 1150,900" fill="url(#beam_{slug})"/>
  <line x1="150" y1="750" x2="1450" y2="750" stroke="{accent}" stroke-width="1.5" stroke-opacity="0.5"/>
  
  <!-- Content Tags -->
  <text x="100" y="120" fill="{accent}" font-family="monospace" font-size="14" letter-spacing="4">ETERNAL CASE STUDY // {cat}</text>
  <text x="1500" y="120" text-anchor="end" fill="#858585" font-family="monospace" font-size="12" letter-spacing="2">{loc}</text>
  
  <text x="100" y="840" fill="#ffffff" font-family="sans-serif" font-size="42" font-weight="800" letter-spacing="2">{title}</text>
  <text x="100" y="885" fill="#858585" font-family="monospace" font-size="16" letter-spacing="2">{feature}</text>
</svg>'''
    write_svg(f'assets/images/projects/{slug}/hero.svg', hero_p)
    write_svg(f'assets/images/projects/{slug}/poster.svg', hero_p)

    # Gallery 1, 2, 3
    for g_i, g_name in enumerate(['gallery-1.svg', 'gallery-2.svg', 'gallery-3.svg'], 1):
        g_svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="100%" height="100%">
  <defs>
    <linearGradient id="ggrad_{slug}_{g_i}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#18100d"/>
      <stop offset="50%" stop-color="{accent}" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#080808"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="800" fill="url(#ggrad_{slug}_{g_i})"/>
  <circle cx="{300 * g_i}" cy="400" r="200" fill="none" stroke="{accent}" stroke-width="1.5" stroke-opacity="0.35" stroke-dasharray="6 4"/>
  <rect x="100" y="100" width="1000" height="600" fill="none" stroke="#ffffff" stroke-width="1" stroke-opacity="0.1"/>
  <text x="140" y="160" fill="{accent}" font-family="monospace" font-size="14" letter-spacing="3">PERSPECTIVE 0{g_i} // SCENOGRAPHIC CAPTURE</text>
  <text x="140" y="690" fill="#ffffff" font-family="sans-serif" font-size="24" font-weight="700">{title} — ARCHIVE 0{g_i}</text>
  <text x="140" y="720" fill="#858585" font-family="monospace" font-size="13">Curated Environmental Detail // 35mm Equivalent</text>
</svg>'''
        write_svg(f'assets/images/projects/{slug}/{g_name}', g_svg)

# 4. Talent SVGs
talents = [
    ('alex-tesfaye.svg', 'ALEX TESFAYE', 'Creative Director & Spatial Architect', '#ff5a36'),
    ('maya-kebede.svg', 'MAYA KEBEDE', 'Executive Producer & Cultural Curator', '#ff7a45'),
    ('daniel-worku.svg', 'DANIEL WORKU', 'Technical Director & Lighting Designer', '#ff946e'),
    ('nati-bekele.svg', 'NATI BEKELE', 'Sound Designer & Creative Technologist', '#ff4d29')
]

for t_file, t_name, t_role, t_color in talents:
    t_svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 750" width="100%" height="100%">
  <defs>
    <radialGradient id="tgrad_{t_file}" cx="50%" cy="40%" r="55%">
      <stop offset="0%" stop-color="{t_color}" stop-opacity="0.3"/>
      <stop offset="60%" stop-color="#140b07" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="#080808" stop-opacity="1"/>
    </radialGradient>
  </defs>
  <rect width="600" height="750" fill="#080808"/>
  <rect width="600" height="750" fill="url(#tgrad_{t_file})"/>
  
  <!-- Silhouette Portrait -->
  <circle cx="300" cy="280" r="100" fill="none" stroke="{t_color}" stroke-width="1.5" stroke-opacity="0.5"/>
  <path d="M 180 500 C 180 370, 420 370, 420 500 Z" fill="none" stroke="{t_color}" stroke-width="1.5" stroke-opacity="0.5"/>
  <circle cx="300" cy="280" r="140" fill="none" stroke="#ffffff" stroke-width="0.5" stroke-opacity="0.15" stroke-dasharray="3 5"/>

  <!-- Talent Typography -->
  <text x="60" y="80" fill="{t_color}" font-family="monospace" font-size="12" letter-spacing="3">ETERNAL COLLECTIVE // LEADERSHIP</text>
  <text x="60" y="640" fill="#ffffff" font-family="sans-serif" font-size="24" font-weight="800" letter-spacing="2">{t_name}</text>
  <text x="60" y="675" fill="#858585" font-family="monospace" font-size="13" letter-spacing="1">{t_role}</text>
</svg>'''
    write_svg(f'assets/images/talent/{t_file}', t_svg)

print('All bespoke visual media generated successfully!')
