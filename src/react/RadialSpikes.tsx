import { useMemo } from "react";
import type { CSSProperties, HTMLAttributes } from "react";
import type { WebglRendererStatus } from "../renderers/webgl2BandVfx";
import { createWebglRadialSpikesRenderer } from "../renderers/webgl2RadialSpikes";
import type { BandEnergyFrame } from "../types";
import {
  resolveRadialSpikesConfig,
  type RadialSpikesConfig,
  type RadialSpikesConfigInput,
} from "../vfx/radialSpikes";
import { BandVfxSurface } from "./BandVfxSurface";

export interface RadialSpikesProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "children" | "color"
> {
  readonly ariaLabel?: string;
  readonly config?: RadialSpikesConfigInput;
  readonly data: BandEnergyFrame;
  readonly height?: number | string;
  readonly onRendererStatusChange?: (status: WebglRendererStatus) => void;
  readonly width?: number | string;
}

export function RadialSpikes({
  ariaLabel = "Audio-reactive Radial Spikes",
  config: configInput,
  ...props
}: RadialSpikesProps) {
  const config = useMemo(() => resolveRadialSpikesConfig(configInput), [configInput]);
  return (
    <BandVfxSurface
      {...props}
      ariaLabel={ariaLabel}
      config={config}
      createRenderer={createWebglRadialSpikesRenderer}
      effectId="radial-spikes"
      fallback={radialSpikesFallback}
      forcedColorConfig={forcedRadialSpikesConfig}
      stateAttribute="data-radial-spikes-state"
    />
  );
}

function forcedRadialSpikesConfig(
  config: RadialSpikesConfig,
  darkScheme: boolean,
): RadialSpikesConfig {
  return Object.freeze({
    ...config,
    backgroundColor: darkScheme ? "#000000" : "#ffffff",
    baseColor: darkScheme ? "#ffffff" : "#000000",
    tipColor: darkScheme ? "#ffff00" : "#9b006b",
  });
}

function radialSpikesFallback(config: RadialSpikesConfig) {
  const count = Math.min(config.spikeCount, 64);
  const baseDiameter = 34 + config.baseRadius * 44;
  return (
    <span style={FALLBACK_FIELD_STYLE}>
      <span
        style={{
          border: `2px solid ${config.baseColor}`,
          borderRadius: "50%",
          boxShadow: `0 0 ${Math.max(0, config.glowStrength * 8)}px ${config.baseColor}`,
          height: `${baseDiameter}%`,
          left: "50%",
          position: "absolute",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: `${baseDiameter}%`,
        }}
      />
      {Array.from({ length: count }, (_, index) => {
        const position = count <= 1 ? 0.5 : index / (count - 1);
        const angle = config.rotationDegrees - config.arcDegrees / 2 + position * config.arcDegrees;
        const height = 7 + config.spikeHeight * (38 + 15 * Math.sin(position * Math.PI * 4.2));
        return (
          <span
            key={index}
            style={{
              background: `linear-gradient(180deg, ${config.tipColor}, ${config.baseColor})`,
              borderRadius: "999px 999px 0 0",
              bottom: `calc(50% + ${baseDiameter / 4}%)`,
              boxShadow: `0 0 ${Math.max(0, config.glowStrength * 4)}px ${config.tipColor}`,
              height: `${Math.max(5, height)}%`,
              left: "50%",
              opacity: 0.86,
              position: "absolute",
              transform: `translateX(-50%) rotate(${angle - 90}deg)`,
              transformOrigin: `50% calc(100% + ${baseDiameter / 4}%)`,
              width: `${Math.max(1, config.spikeWidth * 2.6)}px`,
            }}
          />
        );
      })}
    </span>
  );
}

const FALLBACK_FIELD_STYLE: CSSProperties = {
  display: "block",
  height: "84%",
  maxHeight: 230,
  maxWidth: 230,
  position: "relative",
  width: "84%",
};
