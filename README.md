# Web Audio Route Map

A tiny, dependency-free TypeScript library for publishing an understandable
map beside a Web Audio project. Give it an explicit node-and-route declaration;
it renders a responsive SVG, exposes keyboard navigation and a text equivalent,
updates live, and exports a self-contained accessible SVG.

It is for browser-audio makers who want visitors and collaborators to answer
“where does this signal go?” without reading source. It is not an audio engine
and does not claim to inspect arbitrary Web Audio code.

[Live documentation and demo](https://web-audio-route-map.sociobot.in)

## Install

```sh
npm install web-audio-route-map
```

## Usage

```ts
import { createRouteMap, type RouteGraph } from 'web-audio-route-map';
import 'web-audio-route-map/style.css';

const graph: RouteGraph = {
  nodes: [
    { id: 'osc', label: 'Oscillator', kind: 'source' },
    { id: 'filter', label: 'Low-pass', kind: 'effect', detail: '900 Hz' },
    { id: 'gain', label: 'Master gain', kind: 'control' },
    { id: 'out', label: 'Speakers', kind: 'output' }
  ],
  routes: [
    { from: 'osc', to: 'filter' },
    { from: 'filter', to: 'gain', label: 'filtered signal' },
    { from: 'gain', to: 'out' }
  ]
};

const map = createRouteMap(document.querySelector('#route-map')!, graph, {
  label: 'Synth signal path'
});

map.update({ ...graph, nodes: [...graph.nodes] });
const svgText = map.toSVG();
map.download('synth-route.svg');
map.destroy();
```

The container receives an SVG plus a visually hidden text description. Nodes
are keyboard navigable with Arrow keys, Home, End, Enter, and Space. The map
never connects to audio nodes itself: keep your audio setup and this explicit
declaration together in your own code.

## API

### `createRouteMap(container, graph, options?)`

Returns a `RouteMapInstance` with:

- `update(graph)` — validate and replace the graph.
- `toSVG()` — return a standalone SVG string with `<title>` and `<desc>`.
- `download(filename?)` — download that SVG in the browser.
- `focusNode(id)` — focus a rendered node.
- `destroy()` — remove rendered output and listeners.

`RouteGraph` contains `nodes` and `routes`. Node IDs must be unique; every route
must reference existing nodes; cycles are supported and laid out safely. Invalid
graphs render an actionable error and are also reported through `options.onError`.
See the exported TypeScript declarations for the complete, deliberately small
surface.

## Develop

Requires Node.js 20 or newer.

```sh
npm install
npm run dev
npm test
npm run build
npm pack --dry-run
```

`npm run build` produces the publishable ESM, CommonJS, declarations, and CSS
under `dist/package`, then builds the static documentation site into
`dist/site` (with `index.html` at that root). `npm run build:site` builds only
the site after the library exists.

There is no telemetry, account, storage, third-party script, or CDN dependency.

## Deploy

Deploy `dist/site/` as a static directory. The factory owns deployment and npm
credentials; repository workers should not publish or change infrastructure.

## License

[MIT](LICENSE) © 2026 Sociobot (Param Factory)
