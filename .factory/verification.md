# Independent verification — FAIL

**Candidate:** `9bc294f220ed3e0c4a84b442c95e65a3f0cd7162` (`main`)

**URL tested:** <https://web-audio-route-map.sociobot.in/>

**Date:** 2026-08-27 UTC

## Verdict

**FAIL.** The library, demo, package, accessibility checks, and PWA offline
reload all work. The live deployment is an exact candidate artifact match.
However, production does not apply the repository's required long-lived,
immutable cache policy for hashed assets, so the release does not meet the
factory performance/caching acceptance contract. This is a deployment
configuration failure, not a source-code or build failure.

## Clean-checkout and package evidence

The worktree was clean and at the candidate SHA before installation.

| Check | Evidence | Result |
| --- | --- | --- |
| Install | `npm ci`; 94 packages audited, 0 vulnerabilities | PASS |
| Unit/integration | `npm test` | PASS — 1 file, 8/8 tests |
| Type check / exact production build | `npm run build` (`vite` library build plus `tsc -p tsconfig.lib.json`, then site build) | PASS |
| Publish contents | `npm pack --dry-run` | PASS — 23.7 kB tarball, 95.5 kB unpacked, ESM/CJS/types/CSS included |
| Fresh consumer | packed artifact installed into a new temporary npm project | PASS — ESM `createRouteMap`, CommonJS entry, and `style.css` export resolve |
| Consumer public API | normal graph, empty graph, cyclic graph, invalid unknown-route input and subsequent recovery, `focusNode`, keyboard Arrow navigation, `destroy` | PASS |

No separate lint or type-check script is defined. The only repository type
check is the `tsc` invocation in the passing production build.

The production build reported 15.50 kB JS (6.00 kB gzip) and 12.26 kB CSS
(3.63 kB gzip). The original WebP is 54.4 kB. All are within the stated
200 kB JS, 50 kB CSS, and 300 kB hero-image budgets.

## End-to-end browser QA

Using Playwright Chromium 143 against the live HTTPS deployment:

- Desktop (1440 px): page has the expected title, `lang=en`, exactly one h1,
  and one main landmark. It loaded one live map with four nodes and no page or
  console errors.
- Normal flows passed: selected the wet/dry example; muted its dry route
  (`aria-pressed=true`, one dashed route, correct live status); showed the
  empty state; restored it; and downloaded `parallel-route-map.svg`.
- Boundary and recovery coverage passed through the clean consumer: zero
  nodes, cyclic routes, invalid unknown route, error callback/rendering, then
  a valid replacement graph.
- Keyboard-only use passed: Tab reaches the skip link, controls, and first
  map node; arrow navigation reaches the next node; Home/End work; map-node
  keyboard focus renders a 4 px `#0c426f` plate stroke. Visible page focus is
  a 3 px cobalt outline.
- Mobile (390 x 844): no document horizontal overflow; workbench controls
  stack, all tested buttons are at least 44 px high, and the map remains
  legible in its intended internal horizontal scroller.
- With `prefers-reduced-motion: reduce`, canvas animation was `none` and
  button transitions were effectively instant (`0.00001 s`).
- `axe-core` found **0 serious or critical violations**. The exported SVG was
  downloaded successfully and includes its title and description; exported
  nodes are non-interactive.
- Browser requests were first-party only. Source scan found no analytics,
  telemetry, storage API, CDN, or third-party script/font. The service worker
  was active, `registration.update()` completed with no waiting worker, and a
  fresh-context offline reload retained the interactive four-node map, showed
  the offline notice, and logged no errors.

Lighthouse 12.8.2, live URL, mobile defaults:

| Performance | Accessibility | Best Practices | SEO | FCP | LCP | TBT | CLS | Transfer |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 99 | 100 | 100 | 100 | 0.9 s | 1.2 s | 110 ms | 0 | 66 KiB |

## Production identity and response-policy evidence

SHA-256 values of every published candidate artifact matched the live URL:
`index.html`, hashed JS, hashed CSS, WebP, favicon, robots.txt, sitemap.xml,
and `sw.js`.

Live root response policies observed: HSTS, `Referrer-Policy:
strict-origin-when-cross-origin`, and `X-Content-Type-Options: nosniff`.
There were no response cookies and no third-party requests.

## Defects

### High — required immutable asset caching is absent in production

`site/public/_headers` declares:

```
/assets/*
  Cache-Control: public, max-age=31536000, immutable
```

Yet fresh live `HEAD` responses for both
`/assets/index-DKKqOpOW.js` and `/assets/index-Dc5jNrQe.css` return:

```
cache-control: public, must-revalidate, max-age=30
```

The same 30-second policy is returned for `/` and `/sw.js`. The hashed assets
are immutable by construction, so this violates the explicit factory caching
requirement and prevents the intended repeat-visit performance. The `_headers`
file is included in `dist/site`, therefore the evidence points to the static
host not consuming that configuration. Deploy configuration must be fixed and
the live headers rechecked; no product source change is needed.

### Medium — configured Permissions-Policy is not present live

The same `_headers` file declares camera, microphone, and geolocation denied.
The live response omits `Permissions-Policy` entirely. This does not expose a
current capture feature, but it is a response-policy deployment mismatch and
should be applied alongside the cache rule. Live responses also lack CSP and a
frame-ancestors/X-Frame-Options policy; these are recommended hardening items.

## Retest command outline

After the host is configured to honor the distributed headers, rerun:

```sh
curl -sSIL https://web-audio-route-map.sociobot.in/assets/index-DKKqOpOW.js
curl -sSIL https://web-audio-route-map.sociobot.in/assets/index-Dc5jNrQe.css
curl -sSIL https://web-audio-route-map.sociobot.in/
```

The two assets must show `Cache-Control: public, max-age=31536000, immutable`;
responses must include the configured `Permissions-Policy`. Re-run the live
browser and offline smoke checks after the deployment change.
