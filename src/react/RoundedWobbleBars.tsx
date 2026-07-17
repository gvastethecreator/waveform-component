import { useMemo } from "react";
import type { CSSProperties, HTMLAttributes } from "react";
import type { WebglRendererStatus } from "../renderers/webgl2BandVfx";
import { createWebglRoundedWobbleBarsRenderer } from "../renderers/webgl2RoundedWobbleBars";
import type { BandEnergyFrame } from "../types";
import {
  resolveRoundedWobbleBarsConfig,
  type RoundedWobbleBarsConfig,
  type RoundedWobbleBarsConfigInput,
} from "../vfx/roundedWobbleBars";
import { BandVfxSurface } from "./BandVfxSurface";

export interface RoundedWobbleBarsProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "children" | "color"
> {
  readonly ariaLabel?: string;
  readonly config?: RoundedWobbleBarsConfigInput;
  readonly data: BandEnergyFrame;
  readonly height?: number | string;
  readonly onRendererStatusChange?: (status: WebglRendererStatus) => void;
  readonly width?: number | string;
}

export function RoundedWobbleBars({
  ariaLabel = "Audio-reactive Rounded Wobble Bars",
  config: configInput,
  ...props
}: RoundedWobbleBarsProps) {
  const config = useMemo(() => resolveRoundedWobbleBarsConfig(configInput), [configInput]);
  return (
    <BandVfxSurface
      {...props}
      ariaLabel={ariaLabel}
      config={config}
      createRenderer={createWebglRoundedWobbleBarsRenderer}
      effectId="rounded-wobble-bars"
      fallback={roundedWobbleBarsFallback}
      forcedColorConfig={forcedRoundedWobbleBarsConfig}
      stateAttribute="data-rounded-wobble-bars-state"
    />
  );
}

function forcedRoundedWobbleBarsConfig(
  config: RoundedWobbleBarsConfig,
  darkScheme: boolean,
): RoundedWobbleBarsConfig {
  return Object.freeze({
    ...config,
    backgroundColor: darkScheme ? "#000000" : "#ffffff",
    burstFlashColor: darkScheme ? "#ffff00" : "#9b006b",
    leftColor: darkScheme ? "#ffffff" : "#000000",
    rightColor: darkScheme ? "#00ffff" : "#0000ff",
  });
}

function roundedWobbleBarsFallback(config: RoundedWobbleBarsConfig) {
  return (
    <span style={FALLBACK_STYLE}>
      {Array.from({ length: config.barCount }, (_, index) => {
        const position = config.barCount <= 1 ? 0 : index / (config.barCount - 1);
        const energyShape = 0.26 + Math.sin(position * Math.PI * 3.4 + 0.7) * 0.14;
        const height = Math.max(8, (energyShape + config.wobbleIntensity * 0.16) * 100);
        return (
          <span
            key={index}
            style={{
              alignSelf: config.mirrorVertically ? "center" : "end",
              background: `linear-gradient(180deg, ${config.burstFlashColor}, ${position < 0.5 ? config.leftColor : config.rightColor})`,
              borderRadius: "999px",
              boxShadow: `0 0 ${Math.max(0, config.glowIntensity * 5)}px ${config.burstFlashColor}`,
              height: `${height}%`,
              minWidth: 1,
              opacity: 0.88,
              transform: `translateY(${Math.sin(position * Math.PI * 5) * config.wobbleIntensity * 3}px)`,
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
  gridAutoFlow: "column",
  gridAutoColumns: "1fr",
  height: "64%",
  width: "86%",
};
