# Repair handoff — Web Audio Route Map 0.1.0

**Repair base:** `b455a19a62e32ff0512648f32246ef679fcdfa74`
**Repaired application commit:** `446c4511d786f1b5ae9ad5a595ab16b6c00a3f26`
**Live URL:** <https://web-audio-route-map.sociobot.in/>
**Verified locally:** 2026-08-28 UTC

## Release-blocking repair

The independent verifier correctly identified that Azure Static Web Apps does
not consume the portable `dist/site/_headers` manifest. Because no native
Azure configuration existed, the deployment helper generated only minimal
headers and production served immutable hashed JS/CSS with a 30-second cache
and omitted `Permissions-Policy`.

`site/public/staticwebapp.config.json` now supplies the native deployment
configuration that Azure reads and Vite copies to `dist/site`. It preserves the
existing navigation fallback and adds:

- `Cache-Control: public, max-age=31536000, immutable` for `/assets/*`.
- `Cache-Control: no-cache` for `/sw.js`, so updates remain discoverable.
- `Permissions-Policy: camera=(), microphone=(), geolocation=()` along with
  the existing nosniff and referrer policies.

The portable `_headers` policy was kept and aligned with this configuration.
`npm run build` now fails if the required Azure policy is absent or changed in
the built `dist/site/staticwebapp.config.json`. Unit regression coverage also
asserts the immutable cache, service-worker cache, privacy header, and fallback
manifest policy.

## Verification

Run from a clean checkout with Node 20+:

```sh
npm ci
npm test
npm run build
npm run test:browser
npm pack --dry-run
```

Evidence from this repair:

- `npm ci`: 96 packages audited, 0 vulnerabilities.
- `npm test`: 2 files, **10/10** tests passing (including two new deployment
  policy regressions).
- `npm run build`: library type-check (`tsc -p tsconfig.lib.json`), ESM/CJS
  library build, production site build, and built-policy check all passed.
  Site output includes `dist/site/staticwebapp.config.json`; initial JS is
  15.50 kB (6.00 kB gzip), CSS 12.26 kB (3.63 kB gzip), and the original hero
  WebP remains 54.4 kB.
- `npm run test:browser` against the production build: desktop interaction
  (wet/dry muting), keyboard Arrow navigation, axe WCAG A/AA serious/critical
  scan, service-worker offline cached reload, offline notice, and 390 × 844
  mobile overflow all passed with no browser errors.
- `npm pack --dry-run`: package contains ESM, CommonJS, declarations, and CSS;
  a clean temporary consumer resolved the ESM factory, CommonJS factory, and
  `web-audio-route-map/style.css` export.
- Lighthouse 12.8.2 against the live mobile URL: **100** performance,
  **100** accessibility, **100** best practices, **100** SEO; FCP 0.9 s,
  LCP 1.2 s, TBT 30 ms, CLS 0.

## Deployment and live retest

Deployed `dist/site` to the work-order Azure Static Web App on 2026-08-28 UTC
(deployment `50cf2ed5-8c80-4135-8681-33ce26925807`). Azure reported that it
used `site/public/staticwebapp.config.json` for configuration.

The live HTML byte-matches the local production build:
`48273d129bd7acf618a8d7b1f8f42638c9a1552d0d957684ac031703c7dabba1`.
Live asset names are `assets/index-DKKqOpOW.js` and
`assets/index-Dc5jNrQe.css`; both now return:

```text
Cache-Control: public, max-age=31536000, immutable
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

The root returns the configured Permissions-Policy, nosniff, and strict
referrer policy; `sw.js` is configured to revalidate. A browser smoke against
the live HTTPS URL passed desktop interaction, keyboard navigation, axe
serious/critical checks, offline service-worker reload, and 390 × 844 mobile
layout with no console or page errors.

## Known limits

- Graph declarations remain explicit by design; the library does not inspect
  arbitrary or minified Web Audio code.
- The automatic layout targets small publishable chains rather than
  DAW-scale/manual positioning.
- No account, payment, analytics, telemetry, cookie, or user-data storage is
  present. The service worker stores only public static shell assets locally.
- A restrictive `style-src 'self'` CSP was deliberately not shipped because
  the accessibility-preserving SVG renderer uses inline style attributes; the
  live browser test confirms the final response policy produces no CSP errors.
