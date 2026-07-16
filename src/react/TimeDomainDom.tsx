import { useCallback } from "react";
import { renderDomFrame } from "../renderers/dom";
import type { TimeDomainFrame, WaveformConfigInput } from "../types";
import { DomSurface } from "./DomSurface";
import type { DomSurfaceProps } from "./DomSurface";

export interface TimeDomainDomProps extends Omit<DomSurfaceProps, "buildScene"> {
  readonly config?: WaveformConfigInput;
  readonly frame: TimeDomainFrame;
}

export function TimeDomainDom({ ariaLabel, config, frame, ...containerProps }: TimeDomainDomProps) {
  const buildScene = useCallback(
    (
      viewport: Parameters<typeof renderDomFrame>[1],
      options: Parameters<typeof renderDomFrame>[2],
    ) => renderDomFrame({ config, frame }, viewport, options),
    [config, frame],
  );
  return (
    <DomSurface
      {...containerProps}
      ariaLabel={`${ariaLabel}. ${frame.channels.length} source channel${frame.channels.length === 1 ? "" : "s"}, ${frame.sampleCount} samples.`}
      buildScene={buildScene}
      data-time-domain-mode={frame.kind}
      data-waveform-state={frame.state}
    />
  );
}
