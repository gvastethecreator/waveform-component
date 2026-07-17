import { useMemo } from "react";
import type { CSSProperties, HTMLAttributes } from "react";
import type { WebglRendererStatus } from "../renderers/webgl2BandVfx";
import { createWebglSpectrumBarsVfxRenderer } from "../renderers/webgl2SpectrumBarsVfx";
import type { BandEnergyFrame } from "../types";
import {
  resolveSpectrumBarsVfxConfig,
  type SpectrumBarsVfxConfig,
  type SpectrumBarsVfxConfigInput,
} from "../vfx/spectrumBarsVfx";
import { BandVfxSurface } from "./BandVfxSurface";

export interface SpectrumBarsVfxProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "children" | "color"
> {
  readonly ariaLabel?: string;
  readonly config?: SpectrumBarsVfxConfigInput;
  readonly data: BandEnergyFrame;
  readonly height?: number | string;
  readonly onRendererStatusChange?: (status: WebglRendererStatus) => void;
  readonly width?: number | string;
}

export function SpectrumBarsVfx({
  ariaLabel = "Audio-reactive Spectrum Bars VFX",
  config: configInput,
  ...props
}: SpectrumBarsVfxProps) {
  const config = useMemo(() => resolveSpectrumBarsVfxConfig(configInput), [configInput]);
  return (
    <BandVfxSurface
      {...props}
      ariaLabel={ariaLabel}
      config={config}
      createRenderer={createWebglSpectrumBarsVfxRenderer}
      effectId="spectrum-bars"
      fallback={spectrumBarsFallback}
      forcedColorConfig={forcedSpectrumBarsConfig}
      stateAttribute="data-spectrum-bars-state"
    />
  );
}

function forcedSpectrumBarsConfig(
  config: SpectrumBarsVfxConfig,
  darkScheme: boolean,
): SpectrumBarsVfxConfig {
  return Object.freeze({
    ...config,
    backgroundColor: darkScheme ? "#000000" : "#ffffff",
    gradientColor1: darkScheme ? "#ffffff" : "#000000",
    gradientColor2: darkScheme ? "#00ffff" : "#0000ff",
    gradientColor3: darkScheme ? "#ffff00" : "#9b5500",
    gradientColor4: darkScheme ? "#ff00ff" : "#9b006b",
  });
}

function spectrumBarsFallback(config: SpectrumBarsVfxConfig) {
  return (
    <span
      style={{
        ...FALLBACK_STYLE,
        alignItems: "end",
        paddingBottom: `${config.verticalPosition * 35}%`,
      }}
    >
      {Array.from({ length: config.barCount }, (_, index) => {
        const position = config.barCount <= 1 ? 0 : index / (config.barCount - 1);
        const height = 12 + (0.5 + Math.sin(position * Math.PI * 4.2)) * 27;
        const color =
          position < 0.33
            ? config.gradientColor1
            : position < 0.66
              ? config.gradientColor2
              : position < 0.86
                ? config.gradientColor3
                : config.gradientColor4;
        return (
          <span
            key={index}
            style={{
              backgroundColor: color,
              boxShadow: `0 0 ${Math.max(0, config.glowStrength * 4)}px ${color}`,
              height: `${height}%`,
              minWidth: 1,
            }}
          />
        );
      })}
    </span>
  );
}

const FALLBACK_STYLE: CSSProperties = {
  display: "grid",
  gap: "2px",
  gridAutoColumns: "1fr",
  gridAutoFlow: "column",
  height: "72%",
  width: "88%",
};
