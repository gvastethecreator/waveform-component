import { useMemo } from "react";
import type { CSSProperties, HTMLAttributes } from "react";
import type { WebglRendererStatus } from "../renderers/webgl2BandVfx";
import { createWebglTunnelWavesRenderer } from "../renderers/webgl2TunnelWaves";
import type { BandEnergyFrame } from "../types";
import {
  resolveTunnelWavesConfig,
  type TunnelWavesConfig,
  type TunnelWavesConfigInput,
} from "../vfx/tunnelWaves";
import { BandVfxSurface } from "./BandVfxSurface";

export interface TunnelWavesProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "children" | "color"
> {
  readonly ariaLabel?: string;
  readonly config?: TunnelWavesConfigInput;
  readonly data: BandEnergyFrame;
  readonly height?: number | string;
  readonly onRendererStatusChange?: (status: WebglRendererStatus) => void;
  readonly width?: number | string;
}

export function TunnelWaves({
  ariaLabel = "Audio-reactive Tunnel Waves",
  config: configInput,
  ...props
}: TunnelWavesProps) {
  const config = useMemo(() => resolveTunnelWavesConfig(configInput), [configInput]);
  return (
    <BandVfxSurface
      {...props}
      ariaLabel={ariaLabel}
      config={config}
      createRenderer={createWebglTunnelWavesRenderer}
      effectId="tunnel-waves"
      fallback={tunnelWavesFallback}
      forcedColorConfig={forcedTunnelWavesConfig}
      stateAttribute="data-tunnel-waves-state"
    />
  );
}

function forcedTunnelWavesConfig(
  config: TunnelWavesConfig,
  darkScheme: boolean,
): TunnelWavesConfig {
  return Object.freeze({
    ...config,
    backgroundColor: darkScheme ? "#000000" : "#ffffff",
    centerColor: darkScheme ? "#ffffff" : "#000000",
    midColor: darkScheme ? "#00ffff" : "#0000ff",
    outerColor: darkScheme ? "#ffff00" : "#9b5500",
  });
}

function tunnelWavesFallback(config: TunnelWavesConfig) {
  const count = Math.min(config.ringDensity, 28);
  return (
    <span style={FALLBACK_FIELD_STYLE}>
      {Array.from({ length: count }, (_, index) => {
        const position = count <= 1 ? 0 : index / (count - 1);
        const perspective = Math.pow(position, 0.45 + config.tunnelDepth * 0.8);
        const size = 5 + perspective * 90;
        const color =
          position < 0.5
            ? `color-mix(in srgb, ${config.centerColor} ${Math.round((1 - position * 2) * 100)}%, ${config.midColor})`
            : `color-mix(in srgb, ${config.midColor} ${Math.round((2 - position * 2) * 100)}%, ${config.outerColor})`;
        return (
          <span
            key={index}
            style={{
              border: `1px solid ${color}`,
              borderRadius: "50%",
              boxShadow: `0 0 ${Math.max(0, config.glowStrength * 5)}px ${color}`,
              height: `${size}%`,
              left: "50%",
              opacity: 0.32 + position * 0.56,
              position: "absolute",
              top: "50%",
              transform: `translate(-50%, -50%) rotate(${config.tunnelSpeed * position * 6}deg)`,
              width: `${size}%`,
            }}
          />
        );
      })}
      <span
        style={{
          backgroundColor: config.centerColor,
          borderRadius: "50%",
          boxShadow: `0 0 ${Math.max(4, config.glowStrength * 10)}px ${config.centerColor}`,
          height: "4%",
          left: "50%",
          position: "absolute",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: "4%",
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
