import './style.css';
import { layoutGraph, NODE_HEIGHT, NODE_WIDTH, type PositionedNode } from './layout';
import type { Route, RouteGraph, RouteMapInstance, RouteMapOptions, RouteNode } from './types';

export type {
  Route,
  RouteGraph,
  RouteMapInstance,
  RouteMapOptions,
  RouteNode,
  RouteNodeKind
} from './types';

const SVG_NS = 'http://www.w3.org/2000/svg';
let instanceNumber = 0;

function svgElement<K extends keyof SVGElementTagNameMap>(name: K): SVGElementTagNameMap[K] {
  return document.createElementNS(SVG_NS, name);
}

function setAttributes(element: Element, attributes: Record<string, string | number>): void {
  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, String(value));
  }
}

function validateGraph(value: RouteGraph): Error | null {
  if (!value || !Array.isArray(value.nodes) || !Array.isArray(value.routes)) {
    return new TypeError('The graph must contain nodes and routes arrays.');
  }
  const ids = new Set<string>();
  for (const [index, node] of value.nodes.entries()) {
    if (!node || typeof node.id !== 'string' || node.id.trim() === '') {
      return new TypeError(`Node ${index + 1} needs a non-empty string id.`);
    }
    if (typeof node.label !== 'string' || node.label.trim() === '') {
      return new TypeError(`Node "${node.id}" needs a readable label.`);
    }
    if (ids.has(node.id)) return new TypeError(`Node id "${node.id}" is duplicated.`);
    ids.add(node.id);
  }
  for (const [index, route] of value.routes.entries()) {
    if (!route || !ids.has(route.from)) {
      return new TypeError(`Route ${index + 1} starts at unknown node "${route?.from ?? ''}".`);
    }
    if (!ids.has(route.to)) {
      return new TypeError(`Route ${index + 1} ends at unknown node "${route.to}".`);
    }
  }
  return null;
}

function nodeKind(node: RouteNode): string {
  return node.kind ?? 'node';
}

function routeSentence(route: Route, nodes: Map<string, RouteNode>): string {
  const source = nodes.get(route.from)?.label ?? route.from;
  const target = nodes.get(route.to)?.label ?? route.to;
  const name = route.label ? ` via ${route.label}` : '';
  const state = route.active === false ? ' (inactive)' : '';
  return `${source} routes to ${target}${name}${state}.`;
}

function graphDescription(graph: RouteGraph): string {
  if (graph.nodes.length === 0) {
    return 'No audio nodes yet. Add at least one node to begin the signal path.';
  }
  const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
  const count = `${graph.nodes.length} ${graph.nodes.length === 1 ? 'node' : 'nodes'} and ${graph.routes.length} ${graph.routes.length === 1 ? 'route' : 'routes'}.`;
  return `${count} ${graph.routes.map((route) => routeSentence(route, nodes)).join(' ')}`.trim();
}

function nodeDescription(node: RouteNode, graph: RouteGraph): string {
  const nodes = new Map(graph.nodes.map((item) => [item.id, item]));
  const incoming = graph.routes.filter((route) => route.to === node.id);
  const outgoing = graph.routes.filter((route) => route.from === node.id);
  const parts = [`${node.label}, ${nodeKind(node)}${node.detail ? `, ${node.detail}` : ''}.`];
  if (incoming.length > 0) parts.push(`Receives from ${incoming.map((route) => nodes.get(route.from)?.label ?? route.from).join(', ')}.`);
  if (outgoing.length > 0) parts.push(`Sends to ${outgoing.map((route) => nodes.get(route.to)?.label ?? route.to).join(', ')}.`);
  if (incoming.length === 0 && outgoing.length === 0) parts.push('No connected routes.');
  return parts.join(' ');
}

function routePath(source: PositionedNode, target: PositionedNode, routeIndex: number): string {
  const sourceX = source.x + NODE_WIDTH;
  const sourceY = source.y + NODE_HEIGHT / 2;
  const targetX = target.x;
  const targetY = target.y + NODE_HEIGHT / 2;
  if (targetX > sourceX + 24) {
    const middle = sourceX + (targetX - sourceX) / 2;
    return `M ${sourceX} ${sourceY} C ${middle} ${sourceY}, ${middle} ${targetY}, ${targetX} ${targetY}`;
  }
  const loop = Math.max(source.y, target.y) + NODE_HEIGHT + 34 + routeIndex * 8;
  return `M ${sourceX} ${sourceY} C ${sourceX + 42} ${loop}, ${targetX - 42} ${loop}, ${targetX} ${targetY}`;
}

function svgStyles(markerId: string, shadowId: string): string {
  return `
    .warm-route { fill: none; stroke: var(--warm-route, #145da0); stroke-width: 3; marker-end: url(#${markerId}); }
    .warm-route--inactive { stroke: var(--warm-muted, #60767a); stroke-dasharray: 7 7; }
    .warm-route-label { fill: var(--warm-text, #172b31); font: 600 11px ui-monospace, monospace; paint-order: stroke; stroke: var(--warm-canvas, #f3f7f6); stroke-width: 5px; stroke-linejoin: round; }
    .warm-node { cursor: default; outline: none; }
    .warm-node__plate { fill: var(--warm-surface, #fff); stroke: var(--warm-border, #b9d0cf); stroke-width: 1.5; filter: url(#${shadowId}); }
    .warm-node__notch { fill: var(--warm-route, #145da0); }
    .warm-node__label { fill: var(--warm-text, #172b31); font: 650 15px ui-sans-serif, system-ui, sans-serif; }
    .warm-node__meta { fill: var(--warm-muted, #50666b); font: 600 10px ui-monospace, monospace; letter-spacing: .08em; text-transform: uppercase; }
    .warm-node:focus .warm-node__plate { stroke: var(--warm-focus, #0c426f); stroke-width: 4; }
    .warm-empty-title { fill: var(--warm-text, #172b31); font: 650 18px ui-sans-serif, system-ui, sans-serif; }
    .warm-empty-copy { fill: var(--warm-muted, #50666b); font: 14px ui-sans-serif, system-ui, sans-serif; }
  `;
}

function createSvg(graph: RouteGraph, label: string, idPrefix: string): SVGSVGElement {
  const layout = layoutGraph(graph);
  const svg = svgElement('svg');
  const titleId = `${idPrefix}-title`;
  const descId = `${idPrefix}-desc`;
  const markerId = `${idPrefix}-arrow`;
  const shadowId = `${idPrefix}-shadow`;
  setAttributes(svg, {
    xmlns: SVG_NS,
    viewBox: `0 0 ${layout.width} ${layout.height}`,
    role: 'img',
    'aria-labelledby': `${titleId} ${descId}`,
    preserveAspectRatio: 'xMidYMid meet',
    style: '--warm-canvas:#f3f7f6;--warm-surface:#ffffff;--warm-text:#172b31;--warm-muted:#50666b;--warm-route:#145da0;--warm-focus:#0c426f;--warm-border:#b9d0cf'
  });
  svg.classList.add('warm-canvas');

  const title = svgElement('title');
  title.id = titleId;
  title.textContent = label;
  const desc = svgElement('desc');
  desc.id = descId;
  desc.textContent = graphDescription(graph);
  svg.append(title, desc);

  const defs = svgElement('defs');
  const style = svgElement('style');
  style.textContent = svgStyles(markerId, shadowId);
  const marker = svgElement('marker');
  setAttributes(marker, { id: markerId, viewBox: '0 0 8 8', refX: 7, refY: 4, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' });
  const arrow = svgElement('path');
  setAttributes(arrow, { d: 'M 0 0 L 8 4 L 0 8 z', fill: 'var(--warm-route, #145da0)' });
  marker.append(arrow);
  const filter = svgElement('filter');
  setAttributes(filter, { id: shadowId, x: '-20%', y: '-20%', width: '140%', height: '160%' });
  const shadow = svgElement('feDropShadow');
  setAttributes(shadow, { dx: 0, dy: 5, stdDeviation: 6, 'flood-color': '#14323b', 'flood-opacity': 0.12 });
  filter.append(shadow);
  defs.append(style, marker, filter);
  svg.append(defs);

  if (layout.nodes.length === 0) {
    const emptyTitle = svgElement('text');
    setAttributes(emptyTitle, { x: layout.width / 2, y: layout.height / 2 - 10, 'text-anchor': 'middle', class: 'warm-empty-title' });
    emptyTitle.textContent = 'The route shelf is empty';
    const emptyCopy = svgElement('text');
    setAttributes(emptyCopy, { x: layout.width / 2, y: layout.height / 2 + 20, 'text-anchor': 'middle', class: 'warm-empty-copy' });
    emptyCopy.textContent = 'Add a node to begin mapping the signal.';
    svg.append(emptyTitle, emptyCopy);
    return svg;
  }

  const positions = new Map(layout.nodes.map((node) => [node.id, node]));
  const routesGroup = svgElement('g');
  routesGroup.setAttribute('aria-hidden', 'true');
  graph.routes.forEach((route, index) => {
    const source = positions.get(route.from)!;
    const target = positions.get(route.to)!;
    const path = svgElement('path');
    setAttributes(path, {
      d: routePath(source, target, index),
      class: `warm-route${route.active === false ? ' warm-route--inactive' : ''}`,
      'data-route': `${route.from}:${route.to}`
    });
    routesGroup.append(path);
    if (route.label) {
      const labelElement = svgElement('text');
      setAttributes(labelElement, {
        x: source.x + NODE_WIDTH + Math.max(28, (target.x - source.x - NODE_WIDTH) / 2),
        y: (source.y + target.y) / 2 + NODE_HEIGHT / 2 - 8,
        'text-anchor': 'middle',
        class: 'warm-route-label'
      });
      labelElement.textContent = `${route.label}${route.active === false ? ' · off' : ''}`;
      routesGroup.append(labelElement);
    }
  });
  svg.append(routesGroup);

  const nodesGroup = svgElement('g');
  layout.nodes.forEach((node, index) => {
    const group = svgElement('g');
    setAttributes(group, {
      class: 'warm-node',
      role: 'button',
      tabindex: index === 0 ? 0 : -1,
      transform: `translate(${node.x} ${node.y})`,
      'data-node-id': node.id,
      'aria-label': nodeDescription(node, graph)
    });
    const plate = svgElement('rect');
    setAttributes(plate, { class: 'warm-node__plate', width: NODE_WIDTH, height: NODE_HEIGHT, rx: 18 });
    const notch = svgElement('path');
    setAttributes(notch, { class: 'warm-node__notch', d: 'M 0 15 Q 0 0 15 0 L 34 0 L 0 34 Z', opacity: node.kind === 'control' ? 0.58 : 1 });
    const labelText = svgElement('text');
    setAttributes(labelText, { class: 'warm-node__label', x: 18, y: 34 });
    labelText.textContent = node.label.length > 18 ? `${node.label.slice(0, 17)}…` : node.label;
    const meta = svgElement('text');
    setAttributes(meta, { class: 'warm-node__meta', x: 18, y: 56 });
    meta.textContent = node.detail ? `${nodeKind(node)} · ${node.detail}` : nodeKind(node);
    group.append(plate, notch, labelText, meta);
    nodesGroup.append(group);
  });
  svg.append(nodesGroup);
  return svg;
}

export function createRouteMap(container: Element, initialGraph: RouteGraph, options: RouteMapOptions = {}): RouteMapInstance {
  if (!(container instanceof Element)) throw new TypeError('createRouteMap needs a DOM element as its first argument.');
  const idPrefix = `warm-${++instanceNumber}`;
  const label = options.label?.trim() || 'Web Audio signal route';
  let graph = initialGraph;
  let svg: SVGSVGElement | null = null;
  let destroyed = false;

  container.classList.add('warm-root');
  const live = document.createElement('p');
  live.className = 'warm-sr-only';
  live.setAttribute('aria-live', 'polite');
  live.setAttribute('aria-atomic', 'true');

  const render = (nextGraph: RouteGraph): void => {
    if (destroyed) throw new Error('This route map has been destroyed.');
    const error = validateGraph(nextGraph);
    if (error) {
      svg = null;
      const notice = document.createElement('div');
      notice.className = 'warm-error';
      notice.setAttribute('role', 'alert');
      const heading = document.createElement('strong');
      heading.textContent = 'This route map could not be drawn.';
      const message = document.createElement('span');
      message.textContent = `${error.message} Check the graph declaration and try again.`;
      notice.append(heading, message);
      container.replaceChildren(notice, live);
      options.onError?.(error);
      return;
    }

    graph = nextGraph;
    svg = createSvg(graph, label, idPrefix);
    const summary = document.createElement('p');
    summary.className = 'warm-sr-only';
    summary.textContent = graphDescription(graph);
    container.replaceChildren(svg, summary, live);
    live.textContent = graph.nodes.length === 0 ? 'Route map is empty.' : `Route map updated. ${graphDescription(graph)}`;
  };

  const keydown = (event: Event): void => {
    if (!(event instanceof KeyboardEvent)) return;
    const target = event.target;
    if (!(target instanceof SVGElement) || !target.matches('.warm-node')) return;
    const nodes = [...container.querySelectorAll<SVGElement>('.warm-node')];
    const current = nodes.indexOf(target);
    let next = current;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (current + 1) % nodes.length;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (current - 1 + nodes.length) % nodes.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = nodes.length - 1;
    else if (event.key === 'Enter' || event.key === ' ') {
      live.textContent = target.getAttribute('aria-label') ?? '';
      event.preventDefault();
      return;
    } else return;
    event.preventDefault();
    nodes.forEach((node, index) => node.setAttribute('tabindex', index === next ? '0' : '-1'));
    nodes[next]?.focus();
  };

  const focusin = (event: Event): void => {
    const target = event.target;
    if (!(target instanceof SVGElement) || !target.matches('.warm-node')) return;
    container.querySelectorAll('.warm-node').forEach((node) => node.setAttribute('tabindex', node === target ? '0' : '-1'));
  };

  container.addEventListener('keydown', keydown);
  container.addEventListener('focusin', focusin);
  render(initialGraph);

  return {
    update(nextGraph) {
      render(nextGraph);
    },
    toSVG() {
      if (destroyed) throw new Error('This route map has been destroyed.');
      if (!svg) throw new Error('Fix the graph before exporting SVG.');
      return `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(svg)}`;
    },
    download(filename = 'audio-route-map.svg') {
      const safeFilename = filename.toLowerCase().endsWith('.svg') ? filename : `${filename}.svg`;
      const url = URL.createObjectURL(new Blob([this.toSVG()], { type: 'image/svg+xml;charset=utf-8' }));
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = safeFilename;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 0);
    },
    focusNode(id) {
      if (destroyed) return false;
      const node = [...container.querySelectorAll<SVGElement>('.warm-node')].find((item) => item.dataset.nodeId === id);
      if (!node) return false;
      node.setAttribute('tabindex', '0');
      node.focus();
      return true;
    },
    destroy() {
      if (destroyed) return;
      container.removeEventListener('keydown', keydown);
      container.removeEventListener('focusin', focusin);
      container.replaceChildren();
      container.classList.remove('warm-root');
      svg = null;
      destroyed = true;
    }
  };
}
