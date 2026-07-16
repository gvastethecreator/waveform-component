import { useMemo } from "react";
import type { HTMLAttributes } from "react";
import { createStaticEnvelopeFrame } from "../core/staticFrame";
import type { EnvelopeFrame, StaticWaveformInput, WaveformConfigInput } from "../types";
import { TimeDomainDom } from "./TimeDomainDom";
import { TimeDomainCanvas } from "./TimeDomainCanvas";
import { TimeDomainSvg } from "./TimeDomainSvg";

export interface EnvelopeProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "color"> {
  readonly ariaLabel?: string;
  readonly config?: WaveformConfigInput;
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
  if (config?.renderer === "dom")
    return (
      <TimeDomainDom {...containerProps} ariaLabel={ariaLabel} config={config} frame={frame} />
    );
  if (config?.renderer === "svg")
    return (
      <TimeDomainSvg {...containerProps} ariaLabel={ariaLabel} config={config} frame={frame} />
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
