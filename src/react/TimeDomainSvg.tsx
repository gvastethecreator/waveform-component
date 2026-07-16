import { useCallback } from "react";
import { renderSvgTimeDomain } from "../renderers/svgTimeDomain";
import type { CanvasWaveformConfigInput, TimeDomainFrame } from "../types";
import { SvgSurface } from "./SvgSurface";
import type { SvgSurfaceProps } from "./SvgSurface";

export interface TimeDomainSvgProps extends Omit<SvgSurfaceProps, "buildScene"> {
  readonly config?: CanvasWaveformConfigInput;
  readonly frame: TimeDomainFrame;
}

export function TimeDomainSvg({ ariaLabel, config, frame, ...containerProps }: TimeDomainSvgProps) {
  const buildScene = useCallback(
    (
      viewport: Parameters<typeof renderSvgTimeDomain>[1],
      options: Parameters<typeof renderSvgTimeDomain>[3],
    ) => renderSvgTimeDomain(frame, viewport, config, options),
    [config, frame],
  );
  return (
    <SvgSurface
      {...containerProps}
      ariaLabel={`${ariaLabel}. ${frame.channels.length} source channel${frame.channels.length === 1 ? "" : "s"}, ${frame.sampleCount} samples.`}
      buildScene={buildScene}
      data-time-domain-mode={frame.kind}
      data-waveform-state={frame.state}
    />
  );
}
