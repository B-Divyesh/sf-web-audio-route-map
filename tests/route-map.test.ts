import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRouteMap, type RouteGraph } from '../src';

const documentedGraph: RouteGraph = {
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

afterEach(() => {
  document.body.replaceChildren();
});

describe('createRouteMap', () => {
  it('renders the documented example with an accessible text equivalent', () => {
    const container = document.createElement('div');
    document.body.append(container);
    createRouteMap(container, documentedGraph, { label: 'Synth signal path' });

    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('role')).toBe('group');
    expect(svg?.querySelector('title')?.textContent).toBe('Synth signal path');
    expect(svg?.querySelector('desc')?.textContent).toContain('4 nodes and 3 routes');
    expect(container.querySelectorAll('.warm-node')).toHaveLength(4);
    expect(container.textContent).toContain('Oscillator routes to Low-pass');
  });

  it('updates live and keeps disabled routes visibly and verbally distinct', () => {
    const container = document.createElement('div');
    document.body.append(container);
    const map = createRouteMap(container, documentedGraph);
    const updated: RouteGraph = {
      ...documentedGraph,
      routes: [{ from: 'osc', to: 'out', label: 'bypass', active: false }]
    };
    map.update(updated);

    expect(container.querySelector('.warm-route--inactive')).not.toBeNull();
    expect(container.querySelector('desc')?.textContent).toContain('bypass (inactive)');
  });

  it('provides a useful empty state', () => {
    const container = document.createElement('div');
    document.body.append(container);
    const map = createRouteMap(container, { nodes: [], routes: [] });

    expect(container.textContent).toContain('The route shelf is empty');
    expect(map.toSVG()).toContain('No audio nodes yet');
  });

  it('renders and reports an actionable error for invalid references', () => {
    const container = document.createElement('div');
    const onError = vi.fn();
    document.body.append(container);
    const map = createRouteMap(container, {
      nodes: [{ id: 'osc', label: 'Oscillator' }],
      routes: [{ from: 'osc', to: 'missing' }]
    }, { onError });

    expect(container.querySelector('[role="alert"]')?.textContent).toContain('unknown node "missing"');
    expect(onError).toHaveBeenCalledOnce();
    expect(() => map.toSVG()).toThrow('Fix the graph');
  });

  it('supports arrow, Home, End, Enter, and Space keyboard paths', () => {
    const container = document.createElement('div');
    document.body.append(container);
    createRouteMap(container, documentedGraph);
    const nodes = [...container.querySelectorAll<SVGElement>('.warm-node')];

    nodes[0]?.focus();
    nodes[0]?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(document.activeElement).toBe(nodes[1]);
    nodes[1]?.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    expect(document.activeElement).toBe(nodes[3]);
    nodes[3]?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    expect(document.activeElement).toBe(nodes[0]);
    nodes[0]?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(container.querySelector('[aria-live]')?.textContent).toContain('Sends to Low-pass');
  });

  it('escapes user-provided labels in exported SVG', () => {
    const container = document.createElement('div');
    document.body.append(container);
    const map = createRouteMap(container, {
      nodes: [{ id: 'safe', label: '<script>alert(1)</script>' }],
      routes: []
    });
    const output = map.toSVG();

    expect(output).not.toContain('<script>alert');
    expect(output).toContain('&lt;script&gt;');
  });

  it('lays out cycles without hanging and exports a standalone SVG', () => {
    const container = document.createElement('div');
    document.body.append(container);
    const map = createRouteMap(container, {
      nodes: [{ id: 'a', label: 'Delay send' }, { id: 'b', label: 'Feedback gain' }],
      routes: [{ from: 'a', to: 'b' }, { from: 'b', to: 'a' }]
    }, { label: 'Feedback loop' });
    const output = map.toSVG();

    expect(output).toMatch(/^<\?xml/);
    expect(output).toContain('Feedback loop');
    expect(output).toContain('aria-labelledby');
    expect(output).toContain('role="img"');
    expect(output).not.toContain('role="button"');
  });

  it('destroys cleanly and becomes inert', () => {
    const container = document.createElement('div');
    document.body.append(container);
    const map = createRouteMap(container, documentedGraph);
    map.destroy();
    map.destroy();

    expect(container.childElementCount).toBe(0);
    expect(map.focusNode('osc')).toBe(false);
    expect(() => map.toSVG()).toThrow('destroyed');
  });
});
