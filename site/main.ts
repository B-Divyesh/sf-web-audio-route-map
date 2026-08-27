import { createRouteMap, type RouteGraph, type RouteMapInstance } from '../dist/package/index.js';
import '../dist/package/style.css';

type ExampleName = 'synth' | 'parallel' | 'sidechain';

const examples: Record<ExampleName, { graph: RouteGraph; reading: string }> = {
  synth: {
    graph: {
      nodes: [
        { id: 'osc', label: 'Oscillator', kind: 'source', detail: 'saw' },
        { id: 'filter', label: 'Low-pass', kind: 'effect', detail: '900 Hz' },
        { id: 'gain', label: 'Master gain', kind: 'control', detail: '−6 dB' },
        { id: 'out', label: 'Speakers', kind: 'output' }
      ],
      routes: [
        { from: 'osc', to: 'filter' },
        { from: 'filter', to: 'gain' },
        { from: 'gain', to: 'out' }
      ]
    },
    reading: 'Oscillator → Low-pass → Master gain → Speakers'
  },
  parallel: {
    graph: {
      nodes: [
        { id: 'mic', label: 'Microphone', kind: 'source' },
        { id: 'dry', label: 'Dry level', kind: 'control', detail: '−3 dB' },
        { id: 'verb', label: 'Convolver', kind: 'effect', detail: '1.8 s' },
        { id: 'mix', label: 'Mix bus', kind: 'control' },
        { id: 'out', label: 'Speakers', kind: 'output' }
      ],
      routes: [
        { from: 'mic', to: 'dry', label: 'dry', active: true },
        { from: 'mic', to: 'verb', label: 'wet' },
        { from: 'dry', to: 'mix' },
        { from: 'verb', to: 'mix' },
        { from: 'mix', to: 'out' }
      ]
    },
    reading: 'Microphone splits to Dry level and Convolver; both rejoin at Mix bus → Speakers'
  },
  sidechain: {
    graph: {
      nodes: [
        { id: 'music', label: 'Music bus', kind: 'source' },
        { id: 'voice', label: 'Voice', kind: 'source' },
        { id: 'compressor', label: 'Compressor', kind: 'effect', detail: '4:1' },
        { id: 'out', label: 'Stream out', kind: 'output' }
      ],
      routes: [
        { from: 'music', to: 'compressor', label: 'audio' },
        { from: 'voice', to: 'compressor', label: 'sidechain' },
        { from: 'compressor', to: 'out' }
      ]
    },
    reading: 'Music bus feeds Compressor; Voice controls its sidechain → Stream out'
  }
};

const codeExample = `import { createRouteMap } from 'web-audio-route-map';
import 'web-audio-route-map/style.css';

const map = createRouteMap(document.querySelector('#map'), {
  nodes: [
    { id: 'osc', label: 'Oscillator', kind: 'source' },
    { id: 'filter', label: 'Low-pass', kind: 'effect', detail: '900 Hz' },
    { id: 'gain', label: 'Master gain', kind: 'control' },
    { id: 'out', label: 'Speakers', kind: 'output' }
  ],
  routes: [
    { from: 'osc', to: 'filter' },
    { from: 'filter', to: 'gain' },
    { from: 'gain', to: 'out' }
  ]
}, { label: 'Synth signal path' });

map.download('synth-route.svg');`;

const mapContainer = document.querySelector('#route-map');
const status = document.querySelector<HTMLElement>('#bench-status');
const reading = document.querySelector<HTMLElement>('#route-reading');
const toggleRoute = document.querySelector<HTMLButtonElement>('#toggle-route');
const clearMap = document.querySelector<HTMLButtonElement>('#clear-map');
const exportButton = document.querySelector<HTMLButtonElement>('#export-svg');
const exampleCode = document.querySelector<HTMLElement>('#example-code');

if (!mapContainer || !status || !reading || !toggleRoute || !clearMap || !exportButton || !exampleCode) {
  throw new Error('The demo could not start because a required element is missing.');
}

exampleCode.textContent = codeExample;
let activeExample: ExampleName = 'synth';
let activeGraph = structuredClone(examples.synth.graph);
let map: RouteMapInstance = createRouteMap(mapContainer, activeGraph, {
  label: 'Interactive Web Audio signal route',
  onError(error) {
    status.textContent = error.message;
  }
});

function loadExample(name: ExampleName): void {
  activeExample = name;
  activeGraph = structuredClone(examples[name].graph);
  map.update(activeGraph);
  document.querySelectorAll<HTMLButtonElement>('[data-example]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.example === name));
  });
  const isParallel = name === 'parallel';
  toggleRoute.disabled = !isParallel;
  toggleRoute.setAttribute('aria-pressed', 'false');
  toggleRoute.textContent = 'Mute dry route';
  reading.textContent = examples[name].reading;
  status.textContent = `${name === 'synth' ? 'Basic synth' : name === 'parallel' ? 'Wet / dry' : 'Sidechain'} loaded: ${activeGraph.nodes.length} nodes, ${activeGraph.routes.length} routes.`;
  clearMap.textContent = 'Show empty';
}

document.querySelectorAll<HTMLButtonElement>('[data-example]').forEach((button) => {
  button.addEventListener('click', () => loadExample(button.dataset.example as ExampleName));
});

toggleRoute.addEventListener('click', () => {
  const dry = activeGraph.routes.find((route) => route.label === 'dry');
  if (!dry) return;
  dry.active = dry.active === false;
  map.update(activeGraph);
  const muted = dry.active === false;
  toggleRoute.setAttribute('aria-pressed', String(muted));
  toggleRoute.textContent = muted ? 'Restore dry route' : 'Mute dry route';
  status.textContent = muted ? 'Dry route muted. It remains visible as a dashed path.' : 'Dry route restored.';
});

clearMap.addEventListener('click', () => {
  if (activeGraph.nodes.length === 0) {
    loadExample(activeExample);
    return;
  }
  map.update({ nodes: [], routes: [] });
  activeGraph = { nodes: [], routes: [] };
  reading.textContent = 'No path yet. Choose “Restore example” to bring the declaration back.';
  status.textContent = 'Empty state shown. The map is ready for a graph declaration.';
  clearMap.textContent = 'Restore example';
  toggleRoute.disabled = true;
});

exportButton.addEventListener('click', () => {
  try {
    map.download(`${activeExample}-route-map.svg`);
    status.textContent = 'Accessible SVG exported to your downloads.';
  } catch (error) {
    status.textContent = error instanceof Error ? error.message : 'The SVG could not be exported.';
  }
});

async function copyText(value: string, statusElement: HTMLElement, confirmation: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(value);
    statusElement.textContent = confirmation;
  } catch {
    statusElement.textContent = 'Copy was blocked. Select the text and copy it manually.';
  }
}

document.querySelector('#copy-install')?.addEventListener('click', () => {
  const copyStatus = document.querySelector<HTMLElement>('#copy-status');
  if (copyStatus) void copyText('npm i web-audio-route-map', copyStatus, 'Install command copied.');
});

document.querySelector('#copy-code')?.addEventListener('click', () => {
  void copyText(codeExample, status, 'Example copied to your clipboard.');
});

const offlineNote = document.querySelector<HTMLElement>('#offline-note');
function updateConnectionState(): void {
  if (!offlineNote) return;
  offlineNote.hidden = navigator.onLine;
}
window.addEventListener('online', updateConnectionState);
window.addEventListener('offline', updateConnectionState);
updateConnectionState();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('./sw.js');
  });
}

window.addEventListener('pagehide', () => map.destroy(), { once: true });
