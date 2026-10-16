/**
 * ETERNAL STUDIO — UNIVERSE CIRCLE
 * Shared renderer for the orbital "universe" used on the opening screen and in About:
 * tilted concentric orbits with drifting dashes, dust carried along each ring,
 * comets with light trails, twinkling stars and a soft core glow.
 * Rings are drawn in two halves (behind / in front of the centre) for real depth.
 */

const TAU = Math.PI * 2;

// RGB triplets so alpha can be applied per draw call
export const UNIVERSE_PALETTES = {
  dark: { line: '255,255,255', accent: '255,86,54', warm: '255,217,196', star: '255,255,255', glow: '255,86,54', core: '255,241,230' },
  light: { line: '24,22,20', accent: '255,86,54', warm: '138,74,44', star: '44,38,34', glow: '255,86,54', core: '255,86,54' },
  orange: { line: '255,255,255', accent: '70,20,6', warm: '255,226,206', star: '255,255,255', glow: '255,226,206', core: '255,255,255' }
};

// Ring radius as a fraction of R; speeds in radians per second (opposite directions alternate)
const DEFAULT_RINGS = [
  { r: 0.32, width: 1, tone: 'warm', alpha: 0.55, speed: 0.22, dash: null, dust: 30, comets: 1 },
  { r: 0.46, width: 1.5, tone: 'accent', alpha: 0.85, speed: -0.14, dash: [2, 7], dust: 60, comets: 1 },
  { r: 0.6, width: 1, tone: 'line', alpha: 0.35, speed: 0.09, dash: null, dust: 70, comets: 0 },
  { r: 0.74, width: 1.2, tone: 'accent', alpha: 0.6, speed: -0.07, dash: [24, 10, 2, 10], dust: 90, comets: 1 },
  { r: 0.88, width: 0.8, tone: 'line', alpha: 0.24, speed: 0.05, dash: [1, 9], dust: 110, comets: 1 },
  { r: 1, width: 1, tone: 'warm', alpha: 0.3, speed: -0.035, dash: null, dust: 120, comets: 0 }
];

export function createUniverse({ rings = DEFAULT_RINGS, starCount = 140, dustScale = 1 } = {}) {
  const state = rings.map((ring) => ({
    ...ring,
    angle: Math.random() * TAU,
    dust: Array.from({ length: Math.round(ring.dust * dustScale) }, () => ({
      a: Math.random() * TAU,
      off: (Math.random() - 0.5) * 0.035,
      size: 0.6 + Math.random() * 1.5,
      alpha: 0.3 + Math.random() * 0.7
    })),
    comets: Array.from({ length: ring.comets }, () => ({
      a: Math.random() * TAU,
      mult: 2.2 + Math.random() * 1.6
    }))
  }));

  const stars = Array.from({ length: starCount }, () => ({
    r: 0.2 + Math.pow(Math.random(), 0.7) * 1.55,
    a: Math.random() * TAU,
    size: 0.6 + Math.random() * 1.4,
    alpha: 0.25 + Math.random() * 0.75,
    speed: 0.6 + Math.random() * 2,
    phase: Math.random() * TAU
  }));

  let time = 0;

  function update(dt) {
    time += dt;
    state.forEach((ring) => {
      ring.angle += ring.speed * dt;
      ring.comets.forEach((c) => { c.a += ring.speed * c.mult * dt; });
    });
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {object} o  cx, cy, R, tilt (rad, 0 = face-on), rot (plane rotation), palette,
   *                    alpha, reveal (0..1 rings drawing in), safe {x0,y0,x1,y1}, coreAlpha
   * @param {'back'|'front'|'all'} layer
   */
  function draw(ctx, o, layer = 'all') {
    const pal = o.palette;
    const alpha = o.alpha ?? 1;
    if (alpha <= 0.002 || o.R <= 1) return;
    const squash = Math.cos(o.tilt);
    const cosR = Math.cos(o.rot);
    const sinR = Math.sin(o.rot);
    const reveal = o.reveal ?? 1;
    const scaleUnit = o.R / 420;
    const safe = o.safe;
    const doBack = layer !== 'front';
    const doFront = layer !== 'back';

    const project = (a, rr) => {
      const x = Math.cos(a) * rr;
      const y = Math.sin(a) * rr * squash;
      return [o.cx + x * cosR - y * sinR, o.cy + x * sinR + y * cosR, Math.sin(a)];
    };
    const dim = (x, y) => (safe && x > safe.x0 && x < safe.x1 && y > safe.y0 && y < safe.y1 ? 0.25 : 1);

    // Stars (behind everything)
    if (doBack && stars.length) {
      ctx.fillStyle = `rgb(${pal.star})`;
      stars.forEach((s) => {
        const x = o.cx + Math.cos(s.a) * s.r * o.R;
        const y = o.cy + Math.sin(s.a) * s.r * o.R * (0.55 + squash * 0.45);
        const tw = 0.55 + Math.sin(time * s.speed + s.phase) * 0.45;
        const a = s.alpha * tw * alpha * dim(x, y) * (o.starAlpha ?? 1);
        if (a < 0.02) return;
        ctx.globalAlpha = a;
        ctx.fillRect(x - s.size / 2, y - s.size / 2, s.size, s.size);
      });
    }

    // Core glow sits between the back and front halves of the rings
    const drawCore = () => {
      const ca = (o.coreAlpha ?? 0.5) * alpha;
      if (ca <= 0.01) return;
      ctx.globalAlpha = 1;
      const g = ctx.createRadialGradient(o.cx, o.cy, 0, o.cx, o.cy, o.R * 0.55);
      g.addColorStop(0, `rgba(${pal.core}, ${ca})`);
      g.addColorStop(0.18, `rgba(${pal.glow}, ${ca * 0.45})`);
      g.addColorStop(1, `rgba(${pal.glow}, 0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(o.cx, o.cy, o.R * 0.55, 0, TAU);
      ctx.fill();
    };

    const ringCount = state.length;
    const halves = [];
    if (doBack) halves.push('back');
    if (doFront) halves.push('front');

    halves.forEach((half) => {
      if (half === 'front' && o.drawCore !== false && layer === 'all') drawCore();
      state.forEach((ring, k) => {
        const rv = Math.max(0, Math.min(1, reveal * ringCount - k * 0.75));
        if (rv <= 0) return;
        const rr = ring.r * o.R;
        const depthAlpha = half === 'back' ? 0.5 : 1;
        const a = ring.alpha * alpha * rv * depthAlpha;

        // Ring stroke: back half = upper arc (PI..2PI), front half = lower arc (0..PI)
        ctx.globalAlpha = 1;
        ctx.strokeStyle = `rgba(${pal[ring.tone]}, ${a})`;
        ctx.lineWidth = ring.width * (half === 'back' ? 0.75 : 1) * Math.max(0.8, scaleUnit);
        if (ring.dash) {
          ctx.setLineDash(ring.dash.map((d) => d * Math.max(0.6, scaleUnit)));
          ctx.lineDashOffset = -ring.angle * rr;
        } else {
          ctx.setLineDash([]);
        }
        ctx.beginPath();
        if (rv < 1) {
          // Drawing in: a growing arc that sweeps around the orbit
          if (half === 'front') {
            ctx.ellipse(o.cx, o.cy, rr, rr * squash, o.rot, ring.angle, ring.angle + rv * TAU);
          }
        } else {
          const start = half === 'back' ? Math.PI : 0;
          ctx.ellipse(o.cx, o.cy, rr, rr * squash, o.rot, start, start + Math.PI);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Dust carried along the ring
        ctx.fillStyle = `rgb(${pal[ring.tone === 'line' ? 'star' : ring.tone]})`;
        for (let i = 0; i < ring.dust.length; i += 1) {
          const d = ring.dust[i];
          const ang = d.a + ring.angle;
          const front = Math.sin(ang) >= 0;
          if ((half === 'front') !== front) continue;
          const [x, y, depth] = project(ang, rr * (1 + d.off));
          const da = d.alpha * alpha * rv * (0.45 + 0.55 * (depth + 1) / 2) * dim(x, y) * (o.dustAlpha ?? 1);
          if (da < 0.02) continue;
          const size = d.size * (0.8 + 0.4 * (depth + 1) / 2) * Math.max(0.8, scaleUnit);
          ctx.globalAlpha = da;
          ctx.fillRect(x - size / 2, y - size / 2, size, size);
        }

        // Comets: a bright head with a fading trail along the orbit
        if (half === 'front') {
          ring.comets.forEach((c) => {
            const dir = Math.sign(ring.speed) || 1;
            for (let t = 14; t >= 0; t -= 1) {
              const ang = c.a - dir * t * 0.035;
              const [x, y] = project(ang, rr);
              const ta = (1 - t / 15) * alpha * rv * dim(x, y) * (o.cometAlpha ?? 1);
              if (ta < 0.02) continue;
              const size = (t === 0 ? 3.2 : 2.2 - t * 0.1) * Math.max(0.8, scaleUnit);
              ctx.globalAlpha = ta * (t === 0 ? 1 : 0.55);
              ctx.fillStyle = t === 0 ? `rgb(${pal.core})` : `rgb(${pal[ring.tone]})`;
              ctx.fillRect(x - size / 2, y - size / 2, size, size);
            }
            const [hx, hy] = project(c.a, rr);
            const ga = 0.55 * alpha * rv * dim(hx, hy) * (o.cometAlpha ?? 1);
            if (ga > 0.02) {
              const g = ctx.createRadialGradient(hx, hy, 0, hx, hy, 14 * Math.max(0.8, scaleUnit));
              g.addColorStop(0, `rgba(${pal.core}, ${ga})`);
              g.addColorStop(1, `rgba(${pal.glow}, 0)`);
              ctx.globalAlpha = 1;
              ctx.fillStyle = g;
              ctx.fillRect(hx - 16 * scaleUnit - 2, hy - 16 * scaleUnit - 2, 32 * scaleUnit + 4, 32 * scaleUnit + 4);
            }
          });
        }
      });
    });
    ctx.globalAlpha = 1;
  }

  return { update, draw };
}
