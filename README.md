# Premium Construction Demo — Cinematic 3D Experience

A luxury, minimal construction-company website with a real-time 3D hero scene and a cinematic scroll-driven camera zoom. **Unbranded by design** — all names, logos and contact details are placeholders, ready for branding to be added later.

## The experience

- **3D hero scene (Three.js)** — a procedurally built high-rise under construction: glazed floors, exposed structure, safety rails, a rotating tower crane, floating dust particles, lit windows and a pulsing aviation beacon.
- **Cinematic scroll zoom** — scrolling from the landing page smoothly dollies the camera into the building along a spline path (damped for fluidity), with staged captions, then hands off seamlessly into the content sections.
- **Scroll-triggered animation (GSAP ScrollTrigger)** — staggered reveals, animated stat counters, parallax mouse sway, elegant hover states throughout.

## Sections

About · Services · Featured Projects · Portfolio · Process · Safety & Quality · Equipment & Technology · Sustainability · Why Choose Us · Testimonials · FAQ · Team · Contact

## Tech

- **Three.js** (vendored, `vendor/three.module.min.js`) — WebGL scene, no external model files; the building is generated in code.
- **GSAP + ScrollTrigger** (vendored) — scroll choreography and reveals.
- **Self-hosted fonts** (Space Grotesk + Inter, `fonts/`) — no external requests at all; the site is fully self-contained.
- No build step. Plain HTML/CSS/JS modules.

## Performance

- Instanced meshes for slabs, glazing, mullions, columns and window panes.
- Capped device-pixel-ratio, reduced particle counts on mobile.
- Render loop pauses when the tab is hidden or the hero is scrolled past.
- `prefers-reduced-motion` respected (idle animation and reveals disabled).

## Run it locally

ES modules require a server (not `file://`):

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

> Demo website. All content is realistic placeholder copy; branding, identity and contact details are intentionally omitted.
