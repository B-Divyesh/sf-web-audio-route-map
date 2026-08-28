# Independent verification 2 — PASS

**Candidate:** `386c14213101536efd523ddbedfe4f242afdfd40` (`main`)

**Live URL:** <https://web-audio-route-map.sociobot.in/>

**Verified:** 2026-08-28 UTC, independently from a clean detached checkout at
the exact SHA, using Node `v22.23.2` (the candidate requires Node 20+).

## Verdict

**PASS.** This candidate meets the researched brief and factory acceptance
contract for a dependency-free, explicit Web Audio route-map library with an
accessible live demo. The prior cache-policy failure is repaired in production:
hashed JS and CSS have one-year immutable caching and the configured privacy
permissions policy. Published runtime artifacts byte-match the candidate build.

## Clean-checkout quality gates

`npm ci` installed 95 packages, audited 96 packages, and reported **0
vulnerabilities**.

| Check | Evidence | Result |
| --- | --- | --- |
| Unit/integration | `npm test` | PASS — 2 files, 10/10 tests |
| Type/exact production build | `npm run build` | PASS — ESM/CJS library, `tsc -p tsconfig.lib.json`, site build, Azure policy verification |
| Repository browser suite | `npm run test:browser` | PASS — desktop, keyboard, axe serious/critical, offline reload, 390 px smoke |
| Package contents | `npm pack --dry-run` | PASS — 23.9 kB tarball / 95.9 kB unpacked; ESM, CJS, declarations, CSS, README, CHANGELOG, MIT license |
| Fresh consumer | packed tarball in a new temporary npm project | PASS — ESM/CJS factories and CSS export resolve |

No separate lint script exists. The available type check is the `tsc`
invocation in the passing production build. The consumer exercised a normal
two-node graph and accessible SVG export; zero-node empty state; invalid
unknown-route error/callback; recovery with a valid graph; a cycle; CommonJS;
and the CSS subpath export.

Production output is within budget: JS **15.50 kB** (**6.00 kB gzip**), CSS
**12.26 kB** (**3.63 kB gzip**), hero WebP **54.4 kB**.

## Live end-to-end, accessibility, and performance

Playwright Chromium 143 tested live HTTPS at desktop 1440 × 900 and mobile
390 × 844. Title, `lang="en"`, one `h1`, and one `main` are present; there
were **no console or page errors**.

- Keyboard-only use passed: initial Tab reaches the skip link (visible 3 px
  outline); map nodes accept Arrow, End, and Enter; focused-node plate stroke
  is 4 px.
- Selected **Wet / dry**, muted the dry route (`aria-pressed="true"` plus
  visible dashed route), showed the empty state, restored it, and downloaded
  `parallel-route-map.svg`.
- Axe WCAG A/AA scan found **0 serious or critical violations**. The library
  tests confirm title/description text equivalents and non-interactive nodes in
  the exported SVG.
- At 390 px there is no document horizontal overflow (`390 == 390`); tested
  Wet / dry and Export SVG controls are 44 px high. The wide graph uses its
  intended internal scroll rather than crushing labels.
- Reduced motion produces graph animation `none`, effectively instant
  transitions (`0.00001 s`), and `scroll-behavior: auto`.
- Service worker is active with no waiting update. A fresh offline reload
  renders the bundled interactive four-node map. Demo selection is transient,
  so reload intentionally restores the default example.

Lighthouse 12.8.2, live mobile defaults: **99 performance, 100 accessibility,
100 best practices, 100 SEO**; FCP 1.0 s, LCP 1.2 s, TBT 140 ms, CLS 0, 66 KiB
transfer.

## Privacy, response policy, and deployment identity

- Browser request capture observed **no outbound runtime origins**; source
  review found no analytics, telemetry, cookie/storage, or third-party CDN
  integration. The candidate package has no runtime dependencies.
- A fresh context had no cookies, `localStorage`, or `sessionStorage`. Its only
  Cache Storage entry was the expected public static shell `warm-shell-v1`.
- Root, JS, CSS, and service-worker responses include HSTS,
  `Referrer-Policy: strict-origin-when-cross-origin`,
  `X-Content-Type-Options: nosniff`, and
  `Permissions-Policy: camera=(), microphone=(), geolocation=()`.
- Root is revalidated (`public, must-revalidate, max-age=30`), `sw.js` is
  `no-cache`, and both hashed assets have
  `Cache-Control: public, max-age=31536000, immutable`.
- SHA-256 comparison passed for every public runtime artifact: HTML, hashed
  JS/CSS, hero WebP, favicon, robots.txt, sitemap.xml, and `sw.js`. Local/live
  HTML both equal `48273d129bd7acf618a8d7b1f8f42638c9a1552d0d957684ac031703c7dabba1`;
  JS both equal `0be91c0513ca6dd998d25b67a33c1819b1998264deafa2299f71983e77ce6d2b`;
  CSS both equal `b12201f6b188dea42656cd3c992565a3ac65730133e3d2f04047dc7dfd33be93`.

## Defects

None found. No high, medium, low, or release-blocking defects remain.

## Reproduction

```sh
npm ci
npm test
npm run build
npm run test:browser
npm pack --dry-run
curl -sSIL https://web-audio-route-map.sociobot.in/assets/index-DKKqOpOW.js
curl -sSIL https://web-audio-route-map.sociobot.in/assets/index-Dc5jNrQe.css
```

The two asset responses must remain immutable for one year. Do not publish from
this repository; the factory owns registry credentials.
