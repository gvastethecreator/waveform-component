import { useMemo } from "react";
import type { CSSProperties, HTMLAttributes } from "react";
import type { WebglRendererStatus } from "../renderers/webgl2BandVfx";
import { createWebglVortexRingsRenderer } from "../renderers/webgl2VortexRings";
import type { BandEnergyFrame } from "../types";
import {
  resolveVortexRingsConfig,
  type VortexRingsConfig,
  type VortexRingsConfigInput,
} from "../vfx/vortexRings";
import { BandVfxSurface } from "./BandVfxSurface";

export interface VortexRingsProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "children" | "color"
> {
  readonly ariaLabel?: string;
  readonly config?: VortexRingsConfigInput;
  readonly data: BandEnergyFrame;
  readonly height?: number | string;
  readonly onRendererStatusChange?: (status: WebglRendererStatus) => void;
  readonly width?: number | string;
}

export function VortexRings({
  ariaLabel = "Audio-reactive Vortex Rings",
  config: configInput,
  ...props
}: VortexRingsProps) {
  const config = useMemo(() => resolveVortexRingsConfig(configInput), [configInput]);
  return (
    <BandVfxSurface
      {...props}
      ariaLabel={ariaLabel}
      config={config}
      createRenderer={createWebglVortexRingsRenderer}
      effectId="vortex-rings"
      fallback={vortexRingsFallback}
      forcedColorConfig={forcedVortexRingsConfig}
      stateAttribute="data-vortex-rings-state"
    />
  );
}

function forcedVortexRingsConfig(
  config: VortexRingsConfig,
  darkScheme: boolean,
): VortexRingsConfig {
  return Object.freeze({
    ...config,
    accentColor: darkScheme ? "#ffff00" : "#9b5500",
    backgroundColor: darkScheme ? "#000000" : "#ffffff",
    primaryColor: darkScheme ? "#ffffff" : "#000000",
    secondaryColor: darkScheme ? "#00ffff" : "#0000ff",
  });
}

function vortexRingsFallback(config: VortexRingsConfig) {
  const count = Math.min(config.ringDensity, 28);
  return (
    <span style={FALLBACK_FIELD_STYLE}>
      {Array.from({ length: count }, (_, index) => {
        const position = (index + 1) / count;
        const size = position * config.vortexRadius * 100;
        const color = index % 2 === 0 ? config.primaryColor : config.secondaryColor;
        return (
          <span
            key={index}
            style={{
              border: `1px solid ${color}`,
              borderRadius: "44% 56% 48% 52%",
              boxShadow: `0 0 ${Math.max(0, config.glowStrength * 4)}px ${color}`,
              height: `${size}%`,
              left: "50%",
              opacity: 0.32 + position * 0.56,
              position: "absolute",
              top: "50%",
              transform: `translate(-50%, -50%) rotate(${position * config.twistAmount * 54 + config.spinSpeed * 5}deg) skew(${config.twistAmount * 0.7}deg)`,
              width: `${size}%`,
            }}
          />
        );
      })}
      <span
        style={{
          border: `2px solid ${config.accentColor}`,
          borderRadius: "50%",
          boxShadow: `0 0 ${Math.max(4, config.glowStrength * 9)}px ${config.accentColor}`,
          height: "9%",
          left: "50%",
          position: "absolute",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: "9%",
        }}
      />
    </span>
  );
}

const FALLBACK_FIELD_STYLE: CSSProperties = {
  display: "block",
  height: "88%",
  maxHeight: 250,
  maxWidth: 250,
  position: "relative",
  width: "88%",
};
