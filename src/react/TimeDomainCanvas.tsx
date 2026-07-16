import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { CSSProperties, HTMLAttributes } from "react";
import { renderCanvasTimeDomain, syncCanvasSize } from "../renderers/canvas2d";
import type { CanvasWaveformConfigInput, TimeDomainFrame } from "../types";

export interface TimeDomainCanvasProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "children" | "color"
> {
  readonly ariaLabel: string;
  readonly config?: CanvasWaveformConfigInput;
  readonly frame: TimeDomainFrame;
  readonly height?: number | string;
  readonly width?: number | string;
}

export function TimeDomainCanvas({
  ariaLabel,
  className,
  config,
  frame,
  height = 240,
  style,
  width = "100%",
  ...containerProps
}: TimeDomainCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const errorId = useId();
  const [renderError, setRenderError] = useState<{ code: string; message: string } | null>(null);
  const renderErrorRef = useRef(renderError);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const bounds = canvas.parentElement?.getBoundingClientRect();
    const cssWidth = bounds?.width || canvas.clientWidth || 300;
    const cssHeight = bounds?.height || canvas.clientHeight || 150;
    const dpr = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
    const size = syncCanvasSize(canvas, cssWidth, cssHeight, dpr);
    const context = canvas.getContext("2d");
    if (!context) return;
    try {
      renderCanvasTimeDomain(
        context,
        frame,
        { width: size.cssWidth, height: size.cssHeight },
        config,
      );
      if (renderErrorRef.current !== null) {
        renderErrorRef.current = null;
        setRenderError(null);
      }
    } catch (error) {
      context.clearRect(0, 0, size.cssWidth, size.cssHeight);
      const next = {
        code: errorCode(error),
        message: error instanceof Error ? error.message : "The time-domain config is invalid.",
      };
      const current = renderErrorRef.current;
      if (current?.code !== next.code || current.message !== next.message) {
        renderErrorRef.current = next;
        setRenderError(next);
      }
    }
  }, [config, frame]);

  useEffect(() => {
    draw();
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!parent || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(draw);
    observer.observe(parent);
    return () => observer.disconnect();
  }, [draw]);

  const containerStyle: CSSProperties = {
    height,
    maxWidth: "100%",
    minHeight: 1,
    position: "relative",
    width,
    ...style,
  };

  return (
    <div {...containerProps} className={className} style={containerStyle}>
      <canvas
        ref={canvasRef}
        aria-describedby={renderError ? errorId : undefined}
        aria-label={`${ariaLabel}. ${frame.channels.length} source channel${frame.channels.length === 1 ? "" : "s"}, ${frame.sampleCount} samples.`}
        data-render-error={renderError?.code}
        data-time-domain-mode={frame.kind}
        data-waveform-state={frame.state}
        role="img"
      >
        {ariaLabel}
      </canvas>
      {renderError ? (
        <p id={errorId} role="alert" style={ERROR_STYLE}>
          <strong>{renderError.code}</strong>
          {renderError.message}
        </p>
      ) : null}
    </div>
  );
}

const ERROR_STYLE: CSSProperties = {
  alignItems: "center",
  background: "rgb(28 12 18 / 0.94)",
  border: "1px solid rgb(255 120 146 / 0.45)",
  borderRadius: "0.35rem",
  color: "#ffd9e1",
  display: "flex",
  flexDirection: "column",
  fontFamily: "ui-monospace, monospace",
  fontSize: "0.7rem",
  gap: "0.35rem",
  inset: "50% auto auto 50%",
  margin: 0,
  maxWidth: "calc(100% - 2rem)",
  padding: "0.75rem",
  position: "absolute",
  textAlign: "center",
  transform: "translate(-50%, -50%)",
};

function errorCode(error: unknown): string {
  if (typeof error !== "object" || error === null || !("code" in error)) return "RENDER_ERROR";
  const code = Reflect.get(error, "code");
  return typeof code === "string" ? code : "RENDER_ERROR";
}
