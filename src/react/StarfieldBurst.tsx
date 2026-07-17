import { useMemo } from "react";
import type { CSSProperties, HTMLAttributes } from "react";
import type { WebglRendererStatus } from "../renderers/webgl2BandVfx";
import { createWebglStarfieldBurstRenderer } from "../renderers/webgl2StarfieldBurst";
import type { BandEnergyFrame } from "../types";
import {
  resolveStarfieldBurstConfig,
  type StarfieldBurstConfig,
  type StarfieldBurstConfigInput,
} from "../vfx/starfieldBurst";
import { BandVfxSurface } from "./BandVfxSurface";

export interface StarfieldBurstProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "children" | "color"
> {
  readonly ariaLabel?: string;
  readonly config?: StarfieldBurstConfigInput;
  readonly data: BandEnergyFrame;
  readonly height?: number | string;
  readonly onRendererStatusChange?: (status: WebglRendererStatus) => void;
  readonly width?: number | string;
}

export function StarfieldBurst({
  ariaLabel = "Audio-reactive Starfield Burst",
  config: configInput,
  ...props
}: StarfieldBurstProps) {
  const config = useMemo(() => resolveStarfieldBurstConfig(configInput), [configInput]);
  return (
    <BandVfxSurface
      {...props}
      ariaLabel={ariaLabel}
      config={config}
      createRenderer={createWebglStarfieldBurstRenderer}
      effectId="starfield-burst"
      fallback={starfieldBurstFallback}
      forcedColorConfig={forcedStarfieldBurstConfig}
      stateAttribute="data-starfield-burst-state"
    />
  );
}

function forcedStarfieldBurstConfig(
  config: StarfieldBurstConfig,
  darkScheme: boolean,
): StarfieldBurstConfig {
  return Object.freeze({
    ...config,
    backgroundColor: darkScheme ? "#000000" : "#ffffff",
    coreColor: darkScheme ? "#ffffff" : "#000000",
    edgeColor: darkScheme ? "#d7d7d7" : "#333333",
    trebleFlashColor: "#ffff00",
  });
}

function starfieldBurstFallback(config: StarfieldBurstConfig) {
  const count = Math.min(config.starCount, 48);
  return (
    <span style={FIELD_STYLE}>
      <span
        style={{
          backgroundColor: config.coreColor,
          borderRadius: "50%",
          boxShadow: `0 0 ${4 + config.starSize * 3}px ${config.trebleFlashColor}`,
          height: 6,
          left: "50%",
          position: "absolute",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: 6,
        }}
      />
      {Array.from({ length: count }, (_, index) => {
        const jitter = hashUnit(config.seed, index, 17);
        const angle = (index / count) * 360 + (jitter - 0.5) * (210 / count);
        const radius = 7 + hashUnit(config.seed, index, 41) * 23;
        const length = 3 + config.trailLength * 28 * (0.55 + jitter * 0.45);
        return (
          <span
            key={index}
            style={{
              inset: 0,
              position: "absolute",
              transform: `rotate(${angle}deg)`,
            }}
          >
            <span
              style={{
                background: `linear-gradient(90deg, transparent, ${config.edgeColor}, ${config.coreColor})`,
                borderRadius: "999px",
                boxShadow: `0 0 ${Math.max(1, config.starSize * 1.8)}px ${config.trebleFlashColor}`,
                height: `${Math.max(1, config.starSize * 0.7)}px`,
                left: `${50 + radius}%`,
                opacity: 0.42 + hashUnit(config.seed, index, 73) * 0.46,
                position: "absolute",
                top: "50%",
                transform: "translateY(-50%)",
                width: `${Math.max(2, length)}%`,
              }}
            />
          </span>
        );
      })}
    </span>
  );
}

function hashUnit(seed: number, index: number, salt: number): number {
  let value = (Math.round(seed) ^ Math.imul(index + 1, 0x9e3779b1) ^ salt) >>> 0;
  value ^= value >>> 16;
  value = Math.imul(value, 0x7feb352d) >>> 0;
  value ^= value >>> 15;
  value = Math.imul(value, 0x846ca68b) >>> 0;
  value ^= value >>> 16;
  return value / 0xffffffff;
}

const FIELD_STYLE: CSSProperties = {
  display: "block",
  height: "84%",
  maxHeight: 230,
  maxWidth: 230,
  overflow: "hidden",
  position: "relative",
  width: "84%",
};
