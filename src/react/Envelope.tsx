import { useMemo } from "react";
import type { HTMLAttributes } from "react";
import { createStaticEnvelopeFrame } from "../core/staticFrame";
import type { CanvasWaveformConfigInput, EnvelopeFrame, StaticWaveformInput } from "../types";
import { TimeDomainCanvas } from "./TimeDomainCanvas";

export interface EnvelopeProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "color"> {
  readonly ariaLabel?: string;
  readonly config?: CanvasWaveformConfigInput;
  readonly data: EnvelopeFrame | StaticWaveformInput;
  readonly height?: number | string;
  readonly width?: number | string;
}

export function Envelope({
  ariaLabel = "Audio envelope",
  config,
  data,
  ...containerProps
}: EnvelopeProps) {
  const frame = useMemo(
    () => (isEnvelopeFrame(data) ? data : createStaticEnvelopeFrame(data)),
    [data],
  );
  return (
    <TimeDomainCanvas {...containerProps} ariaLabel={ariaLabel} config={config} frame={frame} />
  );
}

function isEnvelopeFrame(value: EnvelopeFrame | StaticWaveformInput): value is EnvelopeFrame {
  return (
    typeof value === "object" && value !== null && "kind" in value && value.kind === "envelope"
  );
}
