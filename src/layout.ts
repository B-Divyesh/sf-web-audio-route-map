import type { RouteGraph, RouteNode } from './types';

export const NODE_WIDTH = 152;
export const NODE_HEIGHT = 76;
const COLUMN_GAP = 88;
const ROW_GAP = 32;
const PAD_X = 42;
const PAD_Y = 48;

export interface PositionedNode extends RouteNode {
  x: number;
  y: number;
  order: number;
}

export interface GraphLayout {
  nodes: PositionedNode[];
  width: number;
  height: number;
}

/** Assigns stable columns with a Kahn pass, then safely places cyclic nodes. */
export function layoutGraph(graph: RouteGraph): GraphLayout {
  if (graph.nodes.length === 0) {
    return { nodes: [], width: 520, height: 230 };
  }

  const orderById = new Map(graph.nodes.map((node, index) => [node.id, index]));
  const incoming = new Map(graph.nodes.map((node) => [node.id, 0]));
  const outgoing = new Map(graph.nodes.map((node) => [node.id, [] as string[]]));

  for (const route of graph.routes) {
    incoming.set(route.to, (incoming.get(route.to) ?? 0) + 1);
    outgoing.get(route.from)?.push(route.to);
  }

  const columns = new Map(graph.nodes.map((node) => [node.id, 0]));
  const queue = graph.nodes.filter((node) => incoming.get(node.id) === 0).map((node) => node.id);
  const visited = new Set<string>();

  while (queue.length > 0) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    for (const target of outgoing.get(id) ?? []) {
      columns.set(target, Math.max(columns.get(target) ?? 0, (columns.get(id) ?? 0) + 1));
      incoming.set(target, (incoming.get(target) ?? 1) - 1);
      if (incoming.get(target) === 0) queue.push(target);
    }
  }

  // Cycles have no zero-indegree entry. Preserve declaration order to give
  // them a readable, deterministic progression without pretending to infer DSP.
  let cyclicColumn = Math.max(0, ...columns.values());
  for (const node of graph.nodes) {
    if (!visited.has(node.id)) {
      columns.set(node.id, cyclicColumn++);
    }
  }

  const grouped = new Map<number, RouteNode[]>();
  for (const node of graph.nodes) {
    const column = columns.get(node.id) ?? 0;
    const group = grouped.get(column) ?? [];
    group.push(node);
    grouped.set(column, group);
  }

  const maxRows = Math.max(...[...grouped.values()].map((nodes) => nodes.length));
  const contentHeight = maxRows * NODE_HEIGHT + (maxRows - 1) * ROW_GAP;
  const maxColumn = Math.max(...grouped.keys());
  const width = PAD_X * 2 + (maxColumn + 1) * NODE_WIDTH + maxColumn * COLUMN_GAP;
  const height = Math.max(230, PAD_Y * 2 + contentHeight);
  const positioned: PositionedNode[] = [];

  for (const [column, nodes] of grouped) {
    const groupHeight = nodes.length * NODE_HEIGHT + (nodes.length - 1) * ROW_GAP;
    const top = (height - groupHeight) / 2;
    nodes.forEach((node, row) => {
      positioned.push({
        ...node,
        x: PAD_X + column * (NODE_WIDTH + COLUMN_GAP),
        y: top + row * (NODE_HEIGHT + ROW_GAP),
        order: orderById.get(node.id) ?? 0
      });
    });
  }

  positioned.sort((a, b) => a.order - b.order);
  return { nodes: positioned, width: Math.max(520, width), height };
}
