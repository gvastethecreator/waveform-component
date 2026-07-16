import { useMemo } from "react";
import type { HTMLAttributes } from "react";
import { createStaticWaveformFrame } from "../core/staticFrame";
import type { CanvasWaveformConfigInput, StaticWaveformInput, WaveformFrame } from "../types";
import { TimeDomainCanvas } from "./TimeDomainCanvas";

export interface WaveformProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "color"> {
  readonly ariaLabel?: string;
  readonly config?: CanvasWaveformConfigInput;
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
  return (
    <TimeDomainCanvas {...containerProps} ariaLabel={ariaLabel} config={config} frame={frame} />
  );
}

function isWaveformFrame(value: StaticWaveformInput | WaveformFrame): value is WaveformFrame {
  return (
    typeof value === "object" && value !== null && "kind" in value && value.kind === "waveform"
  );
}
