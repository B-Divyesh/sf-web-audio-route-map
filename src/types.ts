export type RouteNodeKind = 'source' | 'effect' | 'control' | 'analysis' | 'output';

export interface RouteNode {
  /** Stable unique identifier used by routes. */
  id: string;
  /** Human-readable name shown in the map and its text alternative. */
  label: string;
  /** Short category used as a visual and spoken cue. */
  kind?: RouteNodeKind;
  /** Optional compact setting or state, such as "900 Hz". */
  detail?: string;
}

export interface Route {
  from: string;
  to: string;
  /** Optional name such as "wet" or "sidechain". */
  label?: string;
  /** Inactive routes remain visible as dashed paths and are announced. */
  active?: boolean;
}

export interface RouteGraph {
  nodes: RouteNode[];
  routes: Route[];
}

export interface RouteMapOptions {
  /** Accessible name and exported SVG title. */
  label?: string;
  /** Called when an invalid graph is supplied. */
  onError?: (error: Error) => void;
}

export interface RouteMapInstance {
  update(graph: RouteGraph): void;
  toSVG(): string;
  download(filename?: string): void;
  focusNode(id: string): boolean;
  destroy(): void;
}
