import { useMemo } from "react";
import type { CSSProperties, HTMLAttributes } from "react";
import type { WebglRendererStatus } from "../renderers/webgl2BandVfx";
import { createWebglNeonLinesRenderer } from "../renderers/webgl2NeonLines";
import type { BandEnergyFrame } from "../types";
import {
  resolveNeonLinesConfig,
  type NeonLinesConfig,
  type NeonLinesConfigInput,
} from "../vfx/neonLines";
import { BandVfxSurface } from "./BandVfxSurface";

export interface NeonLinesProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "color"> {
  readonly ariaLabel?: string;
  readonly config?: NeonLinesConfigInput;
  readonly data: BandEnergyFrame;
  readonly height?: number | string;
  readonly onRendererStatusChange?: (status: WebglRendererStatus) => void;
  readonly width?: number | string;
}

export function NeonLines({
  ariaLabel = "Audio-reactive Neon Lines",
  config: configInput,
  ...props
}: NeonLinesProps) {
  const config = useMemo(() => resolveNeonLinesConfig(configInput), [configInput]);
  return (
    <BandVfxSurface
      {...props}
      ariaLabel={ariaLabel}
      config={config}
      createRenderer={createWebglNeonLinesRenderer}
      effectId="neon-lines"
      fallback={neonLinesFallback}
      forcedColorConfig={forcedNeonLinesConfig}
      stateAttribute="data-neon-lines-state"
    />
  );
}

function forcedNeonLinesConfig(config: NeonLinesConfig, darkScheme: boolean): NeonLinesConfig {
  return Object.freeze({
    ...config,
    backgroundColor: darkScheme ? "#000000" : "#ffffff",
    burstColor: darkScheme ? "#ffff00" : "#9b006b",
    leftColor: darkScheme ? "#ffffff" : "#000000",
    rightColor: darkScheme ? "#00ffff" : "#0000ff",
  });
}

function neonLinesFallback(config: NeonLinesConfig) {
  return (
    <span style={FALLBACK_LINES_STYLE}>
      {Array.from({ length: config.lineCount }, (_, index) => {
        const position = (index + 0.5) / config.lineCount;
        const phase = position * Math.PI * 2 + config.flowSpeed * 0.33;
        return (
          <span
            key={index}
            style={{
              background: `linear-gradient(90deg, ${config.leftColor}, ${config.rightColor} 72%, ${config.burstColor})`,
              boxShadow: `0 0 ${Math.max(0, config.glowSize * 7)}px ${config.burstColor}`,
              height: `clamp(1px, ${config.lineThickness * 120}px, 5px)`,
              left: 0,
              position: "absolute",
              right: 0,
              top: `${position * 100}%`,
              transform: `translateY(${Math.sin(phase) * config.waveHeight * 45}px)`,
            }}
          />
        );
      })}
    </span>
  );
}

const FALLBACK_LINES_STYLE: CSSProperties = {
  display: "block",
  height: "58%",
  position: "relative",
  width: "82%",
};
