export type DomNodeRole = "grid" | "history" | "meter" | "spectrum-bar" | "step" | "track";

export interface DomBoxNode {
  readonly background?: string;
  readonly backgroundPosition?: string;
  readonly backgroundSize?: string;
  readonly borderColor?: string;
  readonly borderWidth?: number;
  readonly height: number;
  readonly key: string;
  readonly kind: "box";
  readonly opacity?: number;
  readonly radius?: number;
  readonly role: DomNodeRole;
  readonly width: number;
  readonly x: number;
  readonly y: number;
}

export type DomNode = DomBoxNode;

export interface DomScene {
  readonly background: string;
  readonly height: number;
  readonly messages: readonly string[];
  readonly nodeCount: number;
  readonly nodes: readonly DomNode[];
  readonly renderedPointCount: number;
  readonly sourcePointCount: number;
  readonly status: "ready" | "unsupported";
  readonly width: number;
}

export interface DomRenderOptions {
  readonly forcedColors?: boolean;
}
