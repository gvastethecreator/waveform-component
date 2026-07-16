import { useMemo } from "react";
import type { HTMLAttributes } from "react";
import { createStaticWaveformFrame } from "../core/staticFrame";
import type { StaticWaveformInput, WaveformConfigInput, WaveformFrame } from "../types";
import { TimeDomainDom } from "./TimeDomainDom";
import { TimeDomainCanvas } from "./TimeDomainCanvas";
import { TimeDomainSvg } from "./TimeDomainSvg";

export interface WaveformProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "color"> {
  readonly ariaLabel?: string;
  readonly config?: WaveformConfigInput;
  readonly data: StaticWaveformInput | WaveformFrame;
  readonly height?: number | string;
  readonly width?: number | string;
}

export function Waveform({
  ariaLabel = "Audio waveform",
  config,
  data,
  ...containerProps
}: WaveformProps) {
  const frame = useMemo(
    () => (isWaveformFrame(data) ? data : createStaticWaveformFrame(data)),
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

function isWaveformFrame(value: StaticWaveformInput | WaveformFrame): value is WaveformFrame {
  return (
    typeof value === "object" && value !== null && "kind" in value && value.kind === "waveform"
  );
}
