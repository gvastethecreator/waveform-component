import { useMemo } from "react";
import type { CSSProperties, HTMLAttributes } from "react";
import {
  createWebglPulseRingRenderer,
  type WebglRendererStatus,
} from "../renderers/webgl2PulseRing";
import type { BandEnergyFrame } from "../types";
import {
  resolvePulseRingConfig,
  type PulseRingConfig,
  type PulseRingConfigInput,
} from "../vfx/pulseRing";
import { BandVfxSurface } from "./BandVfxSurface";

export interface PulseRingProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "color"> {
  readonly ariaLabel?: string;
  readonly config?: PulseRingConfigInput;
  readonly data: BandEnergyFrame;
  readonly height?: number | string;
  readonly onRendererStatusChange?: (status: WebglRendererStatus) => void;
  readonly width?: number | string;
}

export function PulseRing({
  ariaLabel = "Audio-reactive Pulse Ring",
  config: configInput,
  ...props
}: PulseRingProps) {
  const config = useMemo(() => resolvePulseRingConfig(configInput), [configInput]);
  return (
    <BandVfxSurface
      {...props}
      ariaLabel={ariaLabel}
      config={config}
      createRenderer={createWebglPulseRingRenderer}
      effectId="pulse-ring"
      fallback={pulseRingFallback}
      forcedColorConfig={forcedPulseRingConfig}
      stateAttribute="data-pulse-ring-state"
    />
  );
}

function forcedPulseRingConfig(config: PulseRingConfig, darkScheme: boolean): PulseRingConfig {
  return Object.freeze({
    ...config,
    backgroundColor: darkScheme ? "#000000" : "#ffffff",
    primaryColor: darkScheme ? "#ffffff" : "#000000",
    secondaryColor: darkScheme ? "#ffff00" : "#0000ff",
    sweepColor: darkScheme ? "#00ffff" : "#9b006b",
    tertiaryColor: darkScheme ? "#00ffff" : "#400080",
  });
}

function pulseRingFallback(config: PulseRingConfig) {
  return (
    <span
      style={{
        ...FALLBACK_RING_STYLE,
        borderColor: config.primaryColor,
        boxShadow: `0 0 1.35rem ${config.tertiaryColor}, inset 0 0 0.8rem ${config.tertiaryColor}`,
      }}
    />
  );
}

const FALLBACK_RING_STYLE: CSSProperties = {
  aspectRatio: 1,
  border: "clamp(3px, 0.75vw, 8px) solid",
  borderRadius: "50%",
  width: "min(52%, 11rem)",
};
