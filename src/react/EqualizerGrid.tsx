import { useMemo } from "react";
import type { CSSProperties, HTMLAttributes } from "react";
import type { WebglRendererStatus } from "../renderers/webgl2BandVfx";
import { createWebglEqualizerGridRenderer } from "../renderers/webgl2EqualizerGrid";
import type { BandEnergyFrame } from "../types";
import {
  resolveEqualizerGridConfig,
  type EqualizerGridConfig,
  type EqualizerGridConfigInput,
} from "../vfx/equalizerGrid";
import { BandVfxSurface } from "./BandVfxSurface";

export interface EqualizerGridProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "children" | "color"
> {
  readonly ariaLabel?: string;
  readonly config?: EqualizerGridConfigInput;
  readonly data: BandEnergyFrame;
  readonly height?: number | string;
  readonly onRendererStatusChange?: (status: WebglRendererStatus) => void;
  readonly width?: number | string;
}

export function EqualizerGrid({
  ariaLabel = "Audio-reactive Equalizer Grid",
  config: configInput,
  ...props
}: EqualizerGridProps) {
  const config = useMemo(() => resolveEqualizerGridConfig(configInput), [configInput]);
  return (
    <BandVfxSurface
      {...props}
      ariaLabel={ariaLabel}
      config={config}
      createRenderer={createWebglEqualizerGridRenderer}
      effectId="equalizer-grid"
      fallback={equalizerGridFallback}
      forcedColorConfig={forcedEqualizerGridConfig}
      stateAttribute="data-equalizer-grid-state"
    />
  );
}

function forcedEqualizerGridConfig(
  config: EqualizerGridConfig,
  darkScheme: boolean,
): EqualizerGridConfig {
  return Object.freeze({
    ...config,
    backgroundColor: darkScheme ? "#000000" : "#ffffff",
    gradientColor1: darkScheme ? "#ffffff" : "#000000",
    gradientColor2: darkScheme ? "#00ffff" : "#0000ff",
    gradientColor3: darkScheme ? "#ffff00" : "#9b006b",
    gradientColor4: darkScheme ? "#ffffff" : "#000000",
  });
}

function equalizerGridFallback(config: EqualizerGridConfig) {
  const columnSize = 100 / config.gridColumns;
  const rowSize = 100 / config.gridRows;
  const lineWidth = Math.max(1, Math.round(1 + config.cellGap * 4));
  return (
    <span
      style={{
        ...FALLBACK_GRID_STYLE,
        backgroundColor: config.gradientColor1,
        backgroundImage: [
          `linear-gradient(90deg, transparent calc(100% - ${lineWidth}px), ${config.backgroundColor} calc(100% - ${lineWidth}px))`,
          `linear-gradient(0deg, transparent calc(100% - ${lineWidth}px), ${config.backgroundColor} calc(100% - ${lineWidth}px))`,
          `linear-gradient(135deg, ${config.gradientColor1}, ${config.gradientColor2} 34%, ${config.gradientColor3} 67%, ${config.gradientColor4})`,
        ].join(", "),
        backgroundSize: `${columnSize}% ${rowSize}%, ${columnSize}% ${rowSize}%, 100% 100%`,
        boxShadow: `0 0 ${Math.round(4 + config.cellReactivity * 6)}px ${config.gradientColor3}`,
      }}
    />
  );
}

const FALLBACK_GRID_STYLE: CSSProperties = {
  display: "block",
  height: "70%",
  width: "84%",
};
