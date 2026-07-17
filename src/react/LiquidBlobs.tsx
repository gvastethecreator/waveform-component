import { useMemo } from "react";
import type { CSSProperties, HTMLAttributes } from "react";
import type { WebglRendererStatus } from "../renderers/webgl2BandVfx";
import { createWebglLiquidBlobsRenderer } from "../renderers/webgl2LiquidBlobs";
import type { BandEnergyFrame } from "../types";
import {
  resolveLiquidBlobsConfig,
  type LiquidBlobsConfig,
  type LiquidBlobsConfigInput,
} from "../vfx/liquidBlobs";
import { BandVfxSurface } from "./BandVfxSurface";

export interface LiquidBlobsProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "children" | "color"
> {
  readonly ariaLabel?: string;
  readonly config?: LiquidBlobsConfigInput;
  readonly data: BandEnergyFrame;
  readonly height?: number | string;
  readonly onRendererStatusChange?: (status: WebglRendererStatus) => void;
  readonly width?: number | string;
}

export function LiquidBlobs({
  ariaLabel = "Audio-reactive Liquid Blobs",
  config: configInput,
  ...props
}: LiquidBlobsProps) {
  const config = useMemo(() => resolveLiquidBlobsConfig(configInput), [configInput]);
  return (
    <BandVfxSurface
      {...props}
      ariaLabel={ariaLabel}
      config={config}
      createRenderer={createWebglLiquidBlobsRenderer}
      effectId="liquid-blobs"
      fallback={liquidBlobsFallback}
      forcedColorConfig={forcedLiquidBlobsConfig}
      stateAttribute="data-liquid-blobs-state"
    />
  );
}

function forcedLiquidBlobsConfig(
  config: LiquidBlobsConfig,
  darkScheme: boolean,
): LiquidBlobsConfig {
  return Object.freeze({
    ...config,
    backgroundColor: darkScheme ? "#000000" : "#ffffff",
    baseColor: darkScheme ? "#d7d7d7" : "#333333",
    blobColor: darkScheme ? "#ffffff" : "#000000",
    peakFlashColor: "#ffff00",
  });
}

function liquidBlobsFallback(config: LiquidBlobsConfig) {
  const count = Math.min(config.blobCount, 12);
  return (
    <span style={FIELD_STYLE}>
      {Array.from({ length: count }, (_, index) => {
        const x = 12 + hashUnit(config.seed, index, 11) * 76;
        const y = 12 + hashUnit(config.seed, index, 29) * 76;
        const scale = 0.68 + hashUnit(config.seed, index, 47) * 0.52;
        const diameter = (15 + config.blobSize * 52) * scale;
        return (
          <span
            key={index}
            style={{
              background: `radial-gradient(circle at 36% 30%, ${config.peakFlashColor}, ${config.blobColor} 34%, ${config.baseColor} 74%)`,
              border: `1px solid ${config.blobColor}`,
              borderRadius: `${44 + hashUnit(config.seed, index, 71) * 22}% ${58 - hashUnit(config.seed, index, 83) * 14}% ${48 + hashUnit(config.seed, index, 97) * 18}% 52%`,
              boxShadow: `0 0 ${Math.max(0, config.glowStrength * 7)}px ${config.blobColor}`,
              height: `${diameter}%`,
              left: `${x}%`,
              opacity: 0.72,
              position: "absolute",
              top: `${y}%`,
              transform: "translate(-50%, -50%)",
              width: `${diameter}%`,
            }}
          />
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
  height: "82%",
  maxHeight: 230,
  maxWidth: 260,
  overflow: "hidden",
  position: "relative",
  width: "88%",
};
