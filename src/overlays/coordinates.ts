import type { WaveformOrientation } from "../types";

export type OverlayAxis = "cross" | "primary";
export type OverlayDirection = "ltr" | "rtl";
export type OverlayScale = "linear" | "log";

export interface OverlayBounds {
  readonly height: number;
  readonly left: number;
  readonly top: number;
  readonly width: number;
}

export interface OverlayCoordinatePolicy {
  readonly axis?: OverlayAxis;
  readonly direction?: OverlayDirection;
  readonly orientation?: WaveformOrientation;
  readonly reversed?: boolean;
}

export interface OverlayPoint {
  readonly clientX: number;
  readonly clientY: number;
}

export interface OverlayPosition {
  readonly x: number;
  readonly y: number;
}

export interface OverlayValueRange {
  readonly end: number;
  readonly start: number;
}

export interface OverlayCollisionItem {
  readonly axis?: OverlayAxis;
  readonly id: string;
  readonly position: number;
}

export interface OverlayCollisionLayout extends OverlayCollisionItem {
  readonly lane: number;
}

export interface OverlayRangeCollisionItem extends OverlayValueRange {
  readonly id: string;
}

export interface OverlayRangeCollisionLayout extends OverlayRangeCollisionItem {
  readonly lane: number;
}

export function normalizedValueFromPoint(
  point: OverlayPoint,
  bounds: OverlayBounds,
  policy: OverlayCoordinatePolicy = {},
): number {
  const orientation = policy.orientation ?? "horizontal";
  const axis = policy.axis ?? "primary";
  const direction = policy.direction ?? "ltr";
  const width = finiteExtent(bounds.width);
  const height = finiteExtent(bounds.height);
  if (width === 0 || height === 0) return 0;
  const horizontal = clampNormalized((point.clientX - bounds.left) / width);
  const vertical = clampNormalized((point.clientY - bounds.top) / height);
  const logical =
    axis === "primary"
      ? orientation === "vertical"
        ? vertical
        : direction === "rtl"
          ? 1 - horizontal
          : horizontal
      : orientation === "horizontal"
        ? 1 - vertical
        : direction === "rtl"
          ? 1 - horizontal
          : horizontal;
  return policy.reversed ? 1 - logical : logical;
}

export function positionForNormalizedValue(
  value: number,
  bounds: Pick<OverlayBounds, "height" | "width">,
  policy: OverlayCoordinatePolicy = {},
): OverlayPosition {
  const normalized = policy.reversed ? 1 - clampNormalized(value) : clampNormalized(value);
  const orientation = policy.orientation ?? "horizontal";
  const axis = policy.axis ?? "primary";
  const direction = policy.direction ?? "ltr";
  const width = finiteExtent(bounds.width);
  const height = finiteExtent(bounds.height);
  if (axis === "primary") {
    if (orientation === "vertical") return Object.freeze({ x: width / 2, y: normalized * height });
    return Object.freeze({
      x: (direction === "rtl" ? 1 - normalized : normalized) * width,
      y: height / 2,
    });
  }
  if (orientation === "horizontal")
    return Object.freeze({ x: width / 2, y: (1 - normalized) * height });
  return Object.freeze({
    x: (direction === "rtl" ? 1 - normalized : normalized) * width,
    y: height / 2,
  });
}

export function normalizeOverlayRange(start: number, end: number): OverlayValueRange {
  const first = clampNormalized(start);
  const second = clampNormalized(end);
  return Object.freeze({ end: Math.max(first, second), start: Math.min(first, second) });
}

export function valueToNormalized(
  value: number,
  minimum: number,
  maximum: number,
  scale: OverlayScale = "linear",
): number {
  const range = finiteRange(minimum, maximum);
  const finite = Number.isFinite(value) ? value : range.minimum;
  if (scale === "log" && range.minimum > 0) {
    const bounded = Math.min(range.maximum, Math.max(range.minimum, finite));
    return clampNormalized(
      Math.log(bounded / range.minimum) / Math.log(range.maximum / range.minimum),
    );
  }
  return clampNormalized((finite - range.minimum) / (range.maximum - range.minimum));
}

export function normalizedToValue(
  normalized: number,
  minimum: number,
  maximum: number,
  scale: OverlayScale = "linear",
  step?: number,
): number {
  const range = finiteRange(minimum, maximum);
  const ratio = clampNormalized(normalized);
  const raw =
    scale === "log" && range.minimum > 0
      ? range.minimum * (range.maximum / range.minimum) ** ratio
      : range.minimum + (range.maximum - range.minimum) * ratio;
  if (!Number.isFinite(step) || step === undefined || step <= 0) return raw;
  const stepped = range.minimum + Math.round((raw - range.minimum) / step) * step;
  return Math.min(
    range.maximum,
    Math.max(range.minimum, Math.round(stepped * 1_000_000_000_000) / 1_000_000_000_000),
  );
}

export function keyboardNormalizedValue(
  value: number,
  key: string,
  options: OverlayCoordinatePolicy & { readonly pageStep?: number; readonly step?: number } = {},
): number | null {
  const current = clampNormalized(value);
  const step = positiveFinite(options.step, 0.01);
  const pageStep = positiveFinite(options.pageStep, Math.max(0.1, step * 10));
  if (key === "Home") return 0;
  if (key === "End") return 1;
  if (key === "PageUp") return clampNormalized(current + pageStep);
  if (key === "PageDown") return clampNormalized(current - pageStep);
  const delta = keyboardDelta(key, options);
  return delta === null ? null : clampNormalized(current + delta * step);
}

export function assignOverlayCollisionLanes(
  items: readonly OverlayCollisionItem[],
  minimumSeparation = 0.035,
): readonly OverlayCollisionLayout[] {
  const separation = Number.isFinite(minimumSeparation) ? Math.max(0, minimumSeparation) : 0.035;
  const lanesByIndex = items.map(() => 0);
  for (const axis of ["primary", "cross"] as const) {
    const sorted = items
      .map((item, index) => ({ index, item }))
      .filter(({ item }) => (item.axis ?? "primary") === axis)
      .sort(
        (left, right) =>
          clampNormalized(left.item.position) - clampNormalized(right.item.position) ||
          left.item.id.localeCompare(right.item.id),
      );
    const laneEnds: number[] = [];
    for (const { index, item } of sorted) {
      const position = clampNormalized(item.position);
      const lane = laneEnds.findIndex((end) => position - end >= separation);
      const assigned = lane === -1 ? laneEnds.length : lane;
      laneEnds[assigned] = position;
      lanesByIndex[index] = assigned;
    }
  }
  return Object.freeze(
    items.map((item, index) =>
      Object.freeze({
        ...item,
        position: clampNormalized(item.position),
        lane: lanesByIndex[index],
      }),
    ),
  );
}

export function assignOverlayRangeCollisionLanes(
  items: readonly OverlayRangeCollisionItem[],
  minimumSeparation = 0.005,
): readonly OverlayRangeCollisionLayout[] {
  const separation = Number.isFinite(minimumSeparation) ? Math.max(0, minimumSeparation) : 0.005;
  const normalized = items.map((item, index) => ({
    ...normalizeOverlayRange(item.start, item.end),
    id: item.id,
    index,
  }));
  const lanesByIndex = items.map(() => 0);
  const laneEnds: number[] = [];
  for (const item of [...normalized].sort(
    (left, right) =>
      left.start - right.start || left.end - right.end || left.id.localeCompare(right.id),
  )) {
    const lane = laneEnds.findIndex((end) => item.start - end >= separation);
    const assigned = lane === -1 ? laneEnds.length : lane;
    laneEnds[assigned] = item.end;
    lanesByIndex[item.index] = assigned;
  }
  return Object.freeze(
    normalized.map((item) =>
      Object.freeze({
        end: item.end,
        id: item.id,
        lane: lanesByIndex[item.index],
        start: item.start,
      }),
    ),
  );
}

function keyboardDelta(key: string, policy: OverlayCoordinatePolicy): -1 | 1 | null {
  const orientation = policy.orientation ?? "horizontal";
  const axis = policy.axis ?? "primary";
  const direction = policy.direction ?? "ltr";
  let delta: -1 | 1 | null = null;
  if (axis === "primary" && orientation === "vertical") {
    if (key === "ArrowDown") delta = 1;
    if (key === "ArrowUp") delta = -1;
  } else if (axis === "cross" && orientation === "horizontal") {
    if (key === "ArrowUp") delta = 1;
    if (key === "ArrowDown") delta = -1;
  } else {
    const right = direction === "rtl" ? -1 : 1;
    if (key === "ArrowRight") delta = right;
    if (key === "ArrowLeft") delta = right === 1 ? -1 : 1;
  }
  if (delta === null || !policy.reversed) return delta;
  return delta === 1 ? -1 : 1;
}

function finiteRange(minimum: number, maximum: number) {
  const floor = Number.isFinite(minimum) ? minimum : 0;
  const ceiling = Number.isFinite(maximum) ? maximum : 1;
  return ceiling > floor
    ? { maximum: ceiling, minimum: floor }
    : { maximum: floor + 1, minimum: floor };
}

function finiteExtent(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function positiveFinite(value: number | undefined, fallback: number): number {
  return value !== undefined && Number.isFinite(value) && value > 0 ? value : fallback;
}

export function clampNormalized(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}
