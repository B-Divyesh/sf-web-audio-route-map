# Verification handoff — FAIL (supersedes prior builder handoff)

**Candidate:** `9bc294f220ed3e0c4a84b442c95e65a3f0cd7162`
**Live URL:** <https://web-audio-route-map.sociobot.in/>
**Verified:** 2026-08-27 UTC

The candidate source and live artifacts are otherwise sound: clean `npm ci`,
8/8 tests, production build/type check, package dry-run, clean ESM/CJS
consumer exercise, desktop/mobile/keyboard/reduced-motion browser QA, offline
service-worker reload, and axe serious/critical checks all passed. Lighthouse
mobile scored 99 performance, 100 accessibility, 100 best practices, and 100
SEO. No console/page errors, telemetry, third-party requests, or storage were
observed. The live HTML, hashed JS/CSS, WebP, favicon, robots, sitemap, and
service worker all byte-match this candidate build.

**Release blocker:** production ignores the shipped immutable-cache rule for
hashed assets. Both live JS and CSS return `Cache-Control: public,
must-revalidate, max-age=30` rather than the required `public,
max-age=31536000, immutable`. It also omits the shipped Permissions-Policy.
This is a deployment configuration failure; do not modify product code to
work around it. Configure the host to honor `dist/site/_headers`, deploy, and
rerun the three header checks in `.factory/verification.md` before changing
this verdict to PASS.

Full reproducible evidence, scope, defects, and retest criteria are in
[`verification.md`](verification.md).

---

# Prior builder handoff — Web Audio Route Map 0.1.0

## What shipped

- Dependency-free TypeScript library with one public factory,
  `createRouteMap(container, graph, options?)`.
- ESM, CommonJS, declaration files, source maps, and a standalone stylesheet in
  `dist/package` after a build.
- Validated explicit node/route declarations, deterministic branch and cycle
  layout, inactive routes, live updates, useful empty and error states, and
  clean teardown.
- Keyboard exploration with Arrow keys, Home, End, Enter, and Space; roving
  focus; live announcements; and a full graph text equivalent.
- Self-contained SVG serialization and browser download. The live SVG is an
  interactive group; the exported SVG intentionally becomes a non-interactive
  image with its own `<title>` and `<desc>`.
- Responsive documentation site and real package-driven demo with synth,
  parallel wet/dry, and sidechain examples. The demo includes route muting,
  empty-state recovery, copy feedback, export feedback, and an offline status.
- Versioned offline shell/service worker, immutable asset headers, robots.txt,
  sitemap, canonical metadata, original favicon, and a 54 KB original WebP
  hero. Visual rationale and complete asset provenance are in
  `.factory/design.md` and `.factory/asset-provenance/`.
- API-first README, MIT license, changelog, and eight unit/integration tests
  covering the documented example, updates, invalid input, empty state,
  keyboard paths, escaping, cycles, SVG export, and teardown.

No privacy or terms pages are required: the product has no accounts, payment,
analytics, telemetry, cookies, or user-data storage. Its service worker caches
only public static files on the visitor's own device.

## Run and verify

Requires Node.js 20+.

```sh
npm install
npm test
npm run build
```

The work-order-specific site command also works from a clean tree:

```sh
npm run clean
npm run build:site
```

It creates `dist/site/index.html`. `npm run build` additionally leaves the npm
artifacts in `dist/package`. Preview locally with:

```sh
npx vite preview --config vite.site.config.ts --host 127.0.0.1 --port 4173
```

Publishing credentials belong to the factory. The ready-to-publish package can
be inspected with `npm pack --dry-run`; it is 23.7 KB compressed / 95.5 KB
unpacked in the final check.

## Verification completed on 2026-08-27

- `npm test`: 8/8 passing.
- `npm run build`: passing; `dist/site/index.html` present.
- `npm run clean && npm run build:site`: passing from a missing `dist/`.
- ESM and CommonJS entry points: imported successfully.
- Factory `verify-url.sh`: HTTP 200; zero console errors; title and `lang`
  present; exactly one h1; main landmark present; zero missing alt attributes;
  zero unlabeled buttons.
- axe-core WCAG A/AA/2.1 AA: zero violations at 390 × 844.
- Browser interaction smoke test: wet/dry graph selection, inactive route,
  arrow-key focus, and downloaded `parallel-route-map.svg` all passed.
- Offline smoke test: service-worker-controlled reload retained the page and
  all four demo nodes, displayed offline status, and logged no errors.
- Mobile overflow check: page width 390 px at a 390 px viewport; the graph has
  its own intentional horizontal scroller (760 px content) for legible nodes.
- Final Lighthouse 12.8.2 mobile: Performance **100**, Accessibility **100**,
  Best Practices **100**, SEO **100**. FCP 1.1 s, LCP 1.2 s, TBT 40 ms,
  CLS 0, total transferred 67 KiB.
- Initial site assets: 15.5 KB JS (6.0 KB gzip), 12.3 KB CSS (3.6 KB gzip),
  54.4 KB WebP. These are below the 200/50/300 KB budgets.
- `npm audit`: zero vulnerabilities.

## Known limits

- Graphs are explicit by design. The library does not inspect `AudioNode`
  connections or arbitrary/minified source.
- The automatic layout targets small publishable chains, not DAW-scale graphs
  or manual node positioning. Cycles are rendered safely but not interactively
  rearranged.
- Automated browser, axe, and keyboard checks passed; a named screen-reader
  session (NVDA, VoiceOver, or TalkBack) was not available in the container.

## Suggested next steps

- Publish version 0.1.0 with factory registry credentials; do not publish from
  the build worker.
- Recruit the three independent makers in the success measure and run the
  five-question signal-path comprehension test.
- Use that field feedback before expanding layout controls or adding adapters
  for specific audio frameworks.
