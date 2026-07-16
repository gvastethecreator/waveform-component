import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { CSSProperties, HTMLAttributes, KeyboardEvent, PointerEvent } from "react";
import {
  assignOverlayCollisionLanes,
  assignOverlayRangeCollisionLanes,
  clampNormalized,
  keyboardNormalizedValue,
  normalizedToValue,
  normalizedValueFromPoint,
  normalizeOverlayRange,
  valueToNormalized,
  type OverlayAxis,
  type OverlayDirection,
  type OverlayScale,
} from "../overlays/coordinates";
import type { WaveformOrientation } from "../types";

export type SignalOverlayChangeSource = "keyboard" | "pointer";
export type SignalOverlayHandleKind =
  | "custom"
  | "high-cutoff"
  | "loop-end"
  | "loop-start"
  | "low-cutoff"
  | "peak-threshold"
  | "playhead"
  | "react-threshold"
  | "selection-end"
  | "selection-start";
export type SignalOverlayRegionKind = "loop" | "region" | "selection";

export interface SignalOverlayChangeMeta {
  readonly commit: boolean;
  readonly source: SignalOverlayChangeSource;
}

export interface SignalOverlayHandle {
  readonly axis?: OverlayAxis;
  /** Coordinate domain used to place and drag the handle; defaults to `minimum`. */
  readonly domainMinimum?: number;
  /** Coordinate domain used to place and drag the handle; defaults to `maximum`. */
  readonly domainMaximum?: number;
  readonly formatValue?: (value: number) => string;
  readonly guide?: boolean;
  readonly id: string;
  readonly kind: SignalOverlayHandleKind;
  readonly label: string;
  readonly maximum: number;
  readonly minimum: number;
  readonly onChange: (value: number, meta: SignalOverlayChangeMeta) => void;
  readonly onCommit?: (value: number, meta: SignalOverlayChangeMeta) => void;
  /** Reverses the physical axis while preserving the value domain. */
  readonly reversed?: boolean;
  readonly scale?: OverlayScale;
  readonly step?: number;
  readonly value: number;
}

export interface SignalOverlayMarker {
  readonly description?: string;
  readonly id: string;
  readonly label: string;
  readonly onActivate?: (id: string) => void;
  readonly position: number;
}

export interface SignalOverlayRegion {
  readonly active?: boolean;
  readonly description?: string;
  readonly end: number;
  readonly id: string;
  readonly kind: SignalOverlayRegionKind;
  readonly label: string;
  readonly onActivate?: (id: string) => void;
  readonly start: number;
}

export interface SignalOverlaySeek {
  readonly formatValue?: (value: number) => string;
  readonly label: string;
  readonly onChange: (value: number, meta: SignalOverlayChangeMeta) => void;
  readonly onCommit?: (value: number, meta: SignalOverlayChangeMeta) => void;
  readonly reversed?: boolean;
  readonly step?: number;
  readonly value: number;
}

export interface SignalOverlayProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "children" | "onChange"
> {
  readonly ariaLabel?: string;
  readonly direction?: OverlayDirection;
  readonly formatHoverValue?: (value: number) => string;
  readonly handles?: readonly SignalOverlayHandle[];
  readonly hoverLabel?: string;
  readonly hoverReversed?: boolean;
  readonly markers?: readonly SignalOverlayMarker[];
  readonly onHoverChange?: (value: number | null) => void;
  readonly orientation?: WaveformOrientation;
  readonly regions?: readonly SignalOverlayRegion[];
  readonly seek?: SignalOverlaySeek;
}

const rootStyle: CSSProperties = {
  inset: 0,
  overflow: "hidden",
  pointerEvents: "auto",
  position: "absolute",
  touchAction: "none",
  zIndex: 4,
};

const visuallyHiddenStyle: CSSProperties = {
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  whiteSpace: "nowrap",
  width: 1,
};

export function SignalOverlay({
  ariaLabel = "Signal interactions",
  className,
  direction = "ltr",
  formatHoverValue,
  handles = [],
  hoverLabel = "Inspect",
  hoverReversed = false,
  markers = [],
  onHoverChange,
  orientation = "horizontal",
  regions = [],
  seek,
  style,
  ...containerProps
}: SignalOverlayProps) {
  const descriptionPrefix = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<"seek" | string | null>(null);
  const dragValueRef = useRef(0);
  const dragStartValueRef = useRef(0);
  const [hover, setHover] = useState<number | null>(null);
  const [focusedPart, setFocusedPart] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const collisionLayout = useMemo(
    () =>
      assignOverlayCollisionLanes(
        [
          ...markers.map((marker) => ({ id: `marker:${marker.id}`, position: marker.position })),
          ...handles.map((handle) => ({
            axis: handle.axis,
            id: `handle:${handle.id}`,
            position: displayHandlePosition(handle),
          })),
        ],
        0.08,
      ),
    [handles, markers],
  );
  const lanes = useMemo(
    () => new Map(collisionLayout.map((item) => [item.id, item.lane])),
    [collisionLayout],
  );
  const regionLayout = useMemo(
    () =>
      new Map(
        assignOverlayRangeCollisionLanes(
          regions.map(({ id, start, end }) => ({ id, start, end })),
        ).map((item) => [item.id, item]),
      ),
    [regions],
  );

  useEffect(() => () => onHoverChange?.(null), [onHoverChange]);

  const bounds = () => {
    const rect = rootRef.current?.getBoundingClientRect();
    return {
      height: rect?.height ?? 0,
      left: rect?.left ?? 0,
      top: rect?.top ?? 0,
      width: rect?.width ?? 0,
    };
  };

  const pointerNormalized = (
    event: Pick<PointerEvent, "clientX" | "clientY">,
    axis: OverlayAxis,
    reversed = false,
  ) => normalizedValueFromPoint(event, bounds(), { axis, direction, orientation, reversed });

  const updateHover = (event: PointerEvent<HTMLDivElement>) => {
    const value = pointerNormalized(event, "primary", hoverReversed);
    setHover(value);
    onHoverChange?.(value);
  };

  const emitSeek = (value: number, source: SignalOverlayChangeSource, commit: boolean) => {
    if (!seek) return;
    const normalized = normalizedToValue(value, 0, 1, "linear", seek.step);
    dragValueRef.current = normalized;
    const meta = Object.freeze({ commit, source });
    seek.onChange(normalized, meta);
    if (commit) {
      seek.onCommit?.(normalized, meta);
      setAnnouncement(`${seek.label}: ${formatNormalized(normalized, seek.formatValue)}.`);
    }
  };

  const emitHandle = (
    handle: SignalOverlayHandle,
    normalized: number,
    source: SignalOverlayChangeSource,
    commit: boolean,
  ) => {
    const value = Math.min(
      handle.maximum,
      Math.max(
        handle.minimum,
        normalizedToValue(
          normalized,
          handle.domainMinimum ?? handle.minimum,
          handle.domainMaximum ?? handle.maximum,
          handle.scale,
          handle.step,
        ),
      ),
    );
    dragValueRef.current = value;
    const meta = Object.freeze({ commit, source });
    handle.onChange(value, meta);
    if (commit) {
      handle.onCommit?.(value, meta);
      setAnnouncement(`${handle.label}: ${formatHandleValue(handle, value)}.`);
    }
  };

  const rootCombinedStyle = { ...rootStyle, ...style };
  return (
    <div
      {...containerProps}
      ref={rootRef}
      aria-label={ariaLabel}
      className={className}
      data-overlay-direction={direction}
      data-overlay-orientation={orientation}
      onPointerLeave={() => {
        if (draggingRef.current !== null) return;
        setHover(null);
        onHoverChange?.(null);
      }}
      onPointerMove={updateHover}
      role="group"
      style={rootCombinedStyle}
    >
      <div
        aria-label={seek?.label}
        aria-orientation={seek ? orientation : undefined}
        aria-valuemax={seek ? 1 : undefined}
        aria-valuemin={seek ? 0 : undefined}
        aria-valuenow={seek?.value}
        aria-valuetext={seek ? formatNormalized(seek.value, seek.formatValue) : undefined}
        data-overlay-part="seek-surface"
        onBlur={() => setFocusedPart(null)}
        onFocus={() => setFocusedPart("seek")}
        onKeyDown={
          seek
            ? (event) => {
                const next = keyboardNormalizedValue(seek.value, event.key, {
                  direction,
                  orientation,
                  reversed: seek.reversed,
                  step: seek.step,
                });
                if (next === null) return;
                event.preventDefault();
                emitSeek(next, "keyboard", true);
              }
            : undefined
        }
        onPointerDown={
          seek
            ? (event) => {
                if (event.button !== 0) return;
                draggingRef.current = "seek";
                dragStartValueRef.current = seek.value;
                event.currentTarget.setPointerCapture?.(event.pointerId);
                emitSeek(pointerNormalized(event, "primary", seek.reversed), "pointer", false);
              }
            : undefined
        }
        onPointerCancel={
          seek
            ? (event) => {
                if (draggingRef.current !== "seek") return;
                emitSeek(dragStartValueRef.current, "pointer", false);
                draggingRef.current = null;
                setAnnouncement(`${seek.label} adjustment canceled; previous value restored.`);
                event.currentTarget.releasePointerCapture?.(event.pointerId);
              }
            : undefined
        }
        onPointerMove={
          seek
            ? (event) => {
                if (draggingRef.current === "seek")
                  emitSeek(pointerNormalized(event, "primary", seek.reversed), "pointer", false);
              }
            : undefined
        }
        onPointerUp={
          seek
            ? (event) => {
                if (draggingRef.current !== "seek") return;
                emitSeek(pointerNormalized(event, "primary", seek.reversed), "pointer", true);
                draggingRef.current = null;
                event.currentTarget.releasePointerCapture?.(event.pointerId);
              }
            : undefined
        }
        role={seek ? "slider" : undefined}
        style={{
          inset: 0,
          position: "absolute",
          ...(focusedPart === "seek" ? focusedSurfaceStyle : {}),
        }}
        tabIndex={seek ? 0 : undefined}
      />

      {regions.map((region, index) => {
        const range = normalizeOverlayRange(region.start, region.end);
        const lane = regionLayout.get(region.id)?.lane ?? 0;
        const descriptionId = `${descriptionPrefix}-region-${index}`;
        return (
          <div key={region.id}>
            <span
              aria-hidden="true"
              data-overlay-kind={region.kind}
              data-overlay-part="region-fill"
              style={regionFillStyle(range.start, range.end, orientation, direction, region.kind)}
            />
            <button
              type="button"
              aria-describedby={descriptionId}
              aria-label={region.label}
              aria-pressed={region.active}
              className="waveform-overlay-region"
              data-overlay-kind={region.kind}
              data-overlay-lane={lane}
              data-overlay-part="region"
              onBlur={() => setFocusedPart(null)}
              onClick={() => {
                region.onActivate?.(region.id);
                setAnnouncement(`${region.label} activated.`);
              }}
              onFocus={() => setFocusedPart(`region:${region.id}`)}
              style={{
                ...regionControlStyle(
                  range.start,
                  range.end,
                  lane,
                  orientation,
                  direction,
                  region.kind,
                ),
                ...(focusedPart === `region:${region.id}` ? focusedButtonStyle : {}),
              }}
              title={region.description}
            >
              <span id={descriptionId} style={visuallyHiddenStyle}>
                {region.description ? `${region.description}. ` : ""}
                {`Range ${formatNormalized(range.start, undefined)} to ${formatNormalized(range.end, undefined)}${region.active ? ". Selected" : ""}.`}
              </span>
            </button>
          </div>
        );
      })}

      {markers.map((marker, index) => {
        const position = clampNormalized(marker.position);
        const lane = lanes.get(`marker:${marker.id}`) ?? 0;
        const descriptionId = `${descriptionPrefix}-marker-${index}`;
        return (
          <div key={marker.id} data-overlay-part="marker-wrap">
            <span
              aria-hidden="true"
              data-overlay-part="marker-line"
              style={markerLineStyle(position, orientation, direction)}
            />
            <button
              type="button"
              aria-describedby={descriptionId}
              aria-label={marker.label}
              className="waveform-overlay-marker"
              data-overlay-lane={lane}
              data-overlay-part="marker"
              data-overlay-position={position}
              onBlur={() => setFocusedPart(null)}
              onClick={() => {
                marker.onActivate?.(marker.id);
                setAnnouncement(`${marker.label} activated.`);
              }}
              onFocus={() => setFocusedPart(`marker:${marker.id}`)}
              style={{
                ...markerControlStyle(position, lane, orientation, direction),
                ...(focusedPart === `marker:${marker.id}` ? focusedButtonStyle : {}),
              }}
              title={marker.description}
            >
              <span aria-hidden="true" style={markerGlyphStyle} />
              <span id={descriptionId} style={visuallyHiddenStyle}>
                {marker.description ? `${marker.description}. ` : ""}
                {`Position ${formatNormalized(position, undefined)}.`}
              </span>
            </button>
          </div>
        );
      })}

      {handles.map((handle) => {
        const axis = handle.axis ?? "primary";
        const position = displayHandlePosition(handle);
        const lane = lanes.get(`handle:${handle.id}`) ?? 0;
        const policy = { axis, direction, orientation };
        return (
          <div key={handle.id} data-overlay-part="handle-wrap">
            {handle.guide === false ? null : (
              <span
                aria-hidden="true"
                data-overlay-part="handle-guide"
                style={handleGuideStyle(position, axis, orientation, direction)}
              />
            )}
            <button
              type="button"
              aria-label={handle.label}
              aria-orientation={axisOrientation(axis, orientation)}
              aria-valuemax={handle.maximum}
              aria-valuemin={handle.minimum}
              aria-valuenow={handle.value}
              aria-valuetext={formatHandleValue(handle, handle.value)}
              className="waveform-overlay-handle"
              data-overlay-axis={axis}
              data-overlay-kind={handle.kind}
              data-overlay-lane={lane}
              data-overlay-part="handle"
              data-overlay-position={position}
              onBlur={() => setFocusedPart(null)}
              onFocus={() => setFocusedPart(`handle:${handle.id}`)}
              onKeyDown={(event) => handleKeyDown(event, handle, policy, emitHandle)}
              onPointerDown={(event) => {
                if (event.button !== 0) return;
                event.stopPropagation();
                draggingRef.current = handle.id;
                dragStartValueRef.current = handle.value;
                event.currentTarget.setPointerCapture?.(event.pointerId);
                emitHandle(
                  handle,
                  pointerNormalized(event, axis, handle.reversed),
                  "pointer",
                  false,
                );
              }}
              onPointerCancel={(event) => {
                if (draggingRef.current !== handle.id) return;
                event.stopPropagation();
                emitHandle(
                  handle,
                  valueToNormalized(
                    dragStartValueRef.current,
                    handle.domainMinimum ?? handle.minimum,
                    handle.domainMaximum ?? handle.maximum,
                    handle.scale,
                  ),
                  "pointer",
                  false,
                );
                draggingRef.current = null;
                setAnnouncement(`${handle.label} adjustment canceled; previous value restored.`);
                event.currentTarget.releasePointerCapture?.(event.pointerId);
              }}
              onPointerMove={(event) => {
                if (draggingRef.current !== handle.id) return;
                event.stopPropagation();
                emitHandle(
                  handle,
                  pointerNormalized(event, axis, handle.reversed),
                  "pointer",
                  false,
                );
              }}
              onPointerUp={(event) => {
                if (draggingRef.current !== handle.id) return;
                event.stopPropagation();
                const normalized = valueToNormalized(
                  dragValueRef.current,
                  handle.domainMinimum ?? handle.minimum,
                  handle.domainMaximum ?? handle.maximum,
                  handle.scale,
                );
                emitHandle(handle, normalized, "pointer", true);
                draggingRef.current = null;
                event.currentTarget.releasePointerCapture?.(event.pointerId);
              }}
              role="slider"
              style={{
                ...handleStyle(position, lane, axis, orientation, direction),
                ...(focusedPart === `handle:${handle.id}` ? focusedHandleStyle : {}),
              }}
            >
              <span aria-hidden="true" />
            </button>
          </div>
        );
      })}

      {hover === null ? null : (
        <span aria-hidden="true" data-overlay-part="hover" style={hoverStyle}>
          {`${hoverLabel.toUpperCase()} ${formatHoverValue?.(hover) ?? `${Math.round(hover * 1000) / 10}%`}`}
        </span>
      )}
      <span aria-atomic="true" aria-live="polite" role="status" style={visuallyHiddenStyle}>
        {announcement}
      </span>
    </div>
  );
}

function handleKeyDown(
  event: KeyboardEvent<HTMLButtonElement>,
  handle: SignalOverlayHandle,
  policy: { axis: OverlayAxis; direction: OverlayDirection; orientation: WaveformOrientation },
  emit: (
    handle: SignalOverlayHandle,
    normalized: number,
    source: SignalOverlayChangeSource,
    commit: boolean,
  ) => void,
) {
  const target = keyboardHandleValue(handle, event.key, policy);
  if (target === null) return;
  event.preventDefault();
  emit(handle, target, "keyboard", true);
}

function keyboardHandleValue(
  handle: SignalOverlayHandle,
  key: string,
  policy: { axis: OverlayAxis; direction: OverlayDirection; orientation: WaveformOrientation },
): number | null {
  if (key === "Home") return 0;
  if (key === "End") return 1;
  const directionProbe = keyboardNormalizedValue(0.5, key, {
    ...policy,
    pageStep: 0.2,
    reversed: handle.reversed,
    step: 0.1,
  });
  if (directionProbe === null) return null;
  const direction = Math.sign(directionProbe - 0.5);
  const range = handle.maximum - handle.minimum;
  const step = handle.step && handle.step > 0 ? handle.step : range / 100;
  const multiplier = key === "PageUp" || key === "PageDown" ? 10 : 1;
  const value = Math.min(
    handle.maximum,
    Math.max(handle.minimum, handle.value + direction * step * multiplier),
  );
  return valueToNormalized(
    value,
    handle.domainMinimum ?? handle.minimum,
    handle.domainMaximum ?? handle.maximum,
    handle.scale,
  );
}

function displayHandlePosition(handle: SignalOverlayHandle): number {
  const logical = valueToNormalized(
    handle.value,
    handle.domainMinimum ?? handle.minimum,
    handle.domainMaximum ?? handle.maximum,
    handle.scale,
  );
  return handle.reversed ? 1 - logical : logical;
}

function regionFillStyle(
  start: number,
  end: number,
  orientation: WaveformOrientation,
  direction: OverlayDirection,
  kind: SignalOverlayRegionKind,
): CSSProperties {
  const color = regionColor(kind);
  const common: CSSProperties = {
    background: `color-mix(in srgb, ${color} 13%, transparent)`,
    border: `1px solid color-mix(in srgb, ${color} 68%, transparent)`,
    borderRadius: "0.25rem",
    pointerEvents: "none",
    position: "absolute",
    zIndex: 1,
  };
  return { ...common, ...regionPrimaryStyle(start, end, orientation, direction) };
}

function regionControlStyle(
  start: number,
  end: number,
  lane: number,
  orientation: WaveformOrientation,
  direction: OverlayDirection,
  kind: SignalOverlayRegionKind,
): CSSProperties {
  const color = regionColor(kind);
  const common: CSSProperties = {
    background: `color-mix(in srgb, ${color} 34%, Canvas)`,
    border: `2px solid ${color}`,
    borderRadius: "0.25rem",
    cursor: "pointer",
    padding: 0,
    position: "absolute",
    zIndex: 2,
  };
  const primary = regionPrimaryStyle(start, end, orientation, direction);
  if (orientation === "vertical")
    return { ...common, ...primary, left: 8 + lane * 28, right: "auto", width: 24 };
  return { ...common, ...primary, bottom: "auto", height: 24, top: 8 + lane * 28 };
}

function regionPrimaryStyle(
  start: number,
  end: number,
  orientation: WaveformOrientation,
  direction: OverlayDirection,
): CSSProperties {
  if (orientation === "vertical")
    return {
      height: `${(end - start) * 100}%`,
      left: 0,
      right: 0,
      top: `${start * 100}%`,
    };
  const left = direction === "rtl" ? 1 - end : start;
  return { bottom: 0, left: `${left * 100}%`, top: 0, width: `${(end - start) * 100}%` };
}

function regionColor(kind: SignalOverlayRegionKind): string {
  return kind === "loop"
    ? "var(--waveform-overlay-loop, #a7f59c)"
    : kind === "selection"
      ? "var(--waveform-overlay-selection, #62dcf5)"
      : "var(--waveform-overlay-region, #f8d65c)";
}

function markerControlStyle(
  position: number,
  lane: number,
  orientation: WaveformOrientation,
  direction: OverlayDirection,
): CSSProperties {
  const physical = direction === "rtl" && orientation === "horizontal" ? 1 - position : position;
  const common: CSSProperties = {
    alignItems: "center",
    background: "Canvas",
    border: "2px solid var(--waveform-overlay-marker, #f8d65c)",
    borderRadius: 3,
    cursor: "pointer",
    display: "flex",
    height: 24,
    justifyContent: "center",
    padding: 0,
    position: "absolute",
    width: 24,
    zIndex: 3,
  };
  if (orientation === "vertical")
    return {
      ...common,
      left: 8 + lane * 28,
      top: `calc(${position * 100}% - 12px)`,
    };
  return {
    ...common,
    left: `calc(${physical * 100}% - 12px)`,
    top: 8 + lane * 28,
  };
}

function markerLineStyle(
  position: number,
  orientation: WaveformOrientation,
  direction: OverlayDirection,
): CSSProperties {
  if (orientation === "vertical")
    return {
      background: "var(--waveform-overlay-marker, #f8d65c)",
      height: 2,
      left: 0,
      pointerEvents: "none",
      position: "absolute",
      right: 0,
      top: `calc(${position * 100}% - 1px)`,
      zIndex: 3,
    };
  const physical = direction === "rtl" ? 1 - position : position;
  return {
    background: "var(--waveform-overlay-marker, #f8d65c)",
    bottom: 0,
    left: `calc(${physical * 100}% - 1px)`,
    pointerEvents: "none",
    position: "absolute",
    top: 0,
    width: 2,
    zIndex: 3,
  };
}

const markerGlyphStyle: CSSProperties = {
  background: "var(--waveform-overlay-marker, #f8d65c)",
  borderRadius: "50%",
  height: 8,
  width: 8,
};

function handleGuideStyle(
  position: number,
  axis: OverlayAxis,
  orientation: WaveformOrientation,
  direction: OverlayDirection,
): CSSProperties {
  const verticalGuide =
    (axis === "primary" && orientation === "horizontal") ||
    (axis === "cross" && orientation === "vertical");
  const invert = direction === "rtl" && verticalGuide;
  const physical = invert ? 1 - position : position;
  return verticalGuide
    ? {
        borderLeft: "1px dashed var(--waveform-overlay-guide, rgb(248 214 92 / 0.7))",
        bottom: 0,
        left: `${physical * 100}%`,
        pointerEvents: "none",
        position: "absolute",
        top: 0,
        zIndex: 2,
      }
    : {
        borderTop: "1px dashed var(--waveform-overlay-guide, rgb(248 214 92 / 0.7))",
        left: 0,
        pointerEvents: "none",
        position: "absolute",
        right: 0,
        top: `${(axis === "cross" && orientation === "horizontal" ? 1 - position : position) * 100}%`,
        zIndex: 2,
      };
}

function handleStyle(
  position: number,
  lane: number,
  axis: OverlayAxis,
  orientation: WaveformOrientation,
  direction: OverlayDirection,
): CSSProperties {
  const size = 24;
  const crossOffset = 12 + lane * 28;
  const common: CSSProperties = {
    alignItems: "center",
    background: "var(--waveform-overlay-handle, #f8d65c)",
    border: "2px solid var(--waveform-overlay-handle-border, #0b1012)",
    borderRadius: "50%",
    boxShadow: "0 0 0 1px color-mix(in srgb, CanvasText 38%, transparent)",
    cursor: "grab",
    display: "flex",
    height: size,
    justifyContent: "center",
    padding: 0,
    position: "absolute",
    touchAction: "none",
    width: size,
    zIndex: 5,
  };
  if (axis === "primary" && orientation === "horizontal") {
    const physical = direction === "rtl" ? 1 - position : position;
    return { ...common, left: `calc(${physical * 100}% - ${size / 2}px)`, top: crossOffset };
  }
  if (axis === "primary")
    return { ...common, left: crossOffset, top: `calc(${position * 100}% - ${size / 2}px)` };
  if (orientation === "horizontal")
    return { ...common, left: crossOffset, top: `calc(${(1 - position) * 100}% - ${size / 2}px)` };
  const physical = direction === "rtl" ? 1 - position : position;
  return { ...common, left: `calc(${physical * 100}% - ${size / 2}px)`, top: crossOffset };
}

function axisOrientation(axis: OverlayAxis, orientation: WaveformOrientation): WaveformOrientation {
  if (axis === "primary") return orientation;
  return orientation === "horizontal" ? "vertical" : "horizontal";
}

function formatNormalized(value: number, formatter: SignalOverlaySeek["formatValue"]): string {
  return formatter?.(value) ?? `${Math.round(clampNormalized(value) * 1000) / 10}%`;
}

function formatHandleValue(handle: SignalOverlayHandle, value: number): string {
  return handle.formatValue?.(value) ?? String(Math.round(value * 1000) / 1000);
}

const hoverStyle: CSSProperties = {
  background: "Canvas",
  border: "1px solid color-mix(in srgb, CanvasText 35%, transparent)",
  borderRadius: "0.2rem",
  bottom: 8,
  color: "CanvasText",
  fontFamily: "ui-monospace, monospace",
  fontSize: 9,
  padding: "0.2rem 0.35rem",
  pointerEvents: "none",
  position: "absolute",
  right: 8,
  zIndex: 7,
};

const focusedButtonStyle: CSSProperties = {
  outline: "3px solid var(--waveform-overlay-focus, Highlight)",
  outlineOffset: 2,
};

const focusedHandleStyle: CSSProperties = {
  ...focusedButtonStyle,
  zIndex: 8,
};

const focusedSurfaceStyle: CSSProperties = {
  outline: "3px solid var(--waveform-overlay-focus, Highlight)",
  outlineOffset: -3,
};
