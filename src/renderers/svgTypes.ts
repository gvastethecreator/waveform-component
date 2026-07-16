export interface SvgGradientStop {
  readonly color: string;
  readonly offset: number;
  readonly opacity?: number;
}

export interface SvgLinearGradient {
  readonly id: string;
  readonly kind: "linear-gradient";
  readonly stops: readonly SvgGradientStop[];
  readonly x1: number;
  readonly x2: number;
  readonly y1: number;
  readonly y2: number;
}

export interface SvgRadialGradient {
  readonly centerX: number;
  readonly centerY: number;
  readonly id: string;
  readonly innerRadius: number;
  readonly kind: "radial-gradient";
  readonly outerRadius: number;
  readonly stops: readonly SvgGradientStop[];
}

export type SvgGradient = SvgLinearGradient | SvgRadialGradient;

interface SvgPaint {
  readonly fill?: string;
  readonly fillOpacity?: number;
  readonly stroke?: string;
  readonly strokeLinecap?: "butt" | "round";
  readonly strokeOpacity?: number;
  readonly strokeWidth?: number;
}

export interface SvgPathNode extends SvgPaint {
  readonly d: string;
  readonly key: string;
  readonly kind: "path";
}

export interface SvgRectNode extends SvgPaint {
  readonly height: number;
  readonly key: string;
  readonly kind: "rect";
  readonly radius?: number;
  readonly width: number;
  readonly x: number;
  readonly y: number;
}

export type SvgNode = SvgPathNode | SvgRectNode;

export interface SvgScene {
  readonly definitions: readonly SvgGradient[];
  readonly height: number;
  readonly messages: readonly string[];
  readonly nodeCount: number;
  readonly nodes: readonly SvgNode[];
  readonly renderedPointCount: number;
  readonly sourcePointCount: number;
  readonly status: "ready" | "unsupported";
  readonly width: number;
}

export interface SvgRenderOptions {
  readonly forcedColors?: boolean;
  readonly idPrefix?: string;
}
