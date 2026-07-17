import { useMemo } from "react";
import type { CSSProperties, HTMLAttributes } from "react";
import type { WebglRendererStatus } from "../renderers/webgl2BandVfx";
import { createWebglWaveformRibbonRenderer } from "../renderers/webgl2WaveformRibbon";
import type { BandEnergyFrame } from "../types";
import {
  resolveWaveformRibbonConfig,
  type WaveformRibbonConfig,
  type WaveformRibbonConfigInput,
} from "../vfx/waveformRibbon";
import { BandVfxSurface } from "./BandVfxSurface";

export interface WaveformRibbonProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "children" | "color"
> {
  readonly ariaLabel?: string;
  readonly config?: WaveformRibbonConfigInput;
  readonly data: BandEnergyFrame;
  readonly height?: number | string;
  readonly onRendererStatusChange?: (status: WebglRendererStatus) => void;
  readonly width?: number | string;
}

export function WaveformRibbon({
  ariaLabel = "Audio-reactive Waveform Ribbon",
  config: configInput,
  ...props
}: WaveformRibbonProps) {
  const config = useMemo(() => resolveWaveformRibbonConfig(configInput), [configInput]);
  return (
    <BandVfxSurface
      {...props}
      ariaLabel={ariaLabel}
      config={config}
      createRenderer={createWebglWaveformRibbonRenderer}
      effectId="waveform-ribbon"
      fallback={waveformRibbonFallback}
      forcedColorConfig={forcedWaveformRibbonConfig}
      stateAttribute="data-waveform-ribbon-state"
    />
  );
}

function forcedWaveformRibbonConfig(
  config: WaveformRibbonConfig,
  darkScheme: boolean,
): WaveformRibbonConfig {
  return Object.freeze({
    ...config,
    backgroundColor: darkScheme ? "#000000" : "#ffffff",
    leftColor: darkScheme ? "#ffffff" : "#000000",
    peakFlashColor: darkScheme ? "#ffff00" : "#9b006b",
    rightColor: darkScheme ? "#00ffff" : "#0000ff",
  });
}

function waveformRibbonFallback(config: WaveformRibbonConfig) {
  const primaryStyle: CSSProperties = {
    background: `linear-gradient(90deg, ${config.leftColor}, ${config.rightColor} 72%, ${config.peakFlashColor})`,
    borderRadius: "50%",
    boxShadow: `0 0 ${Math.max(0, config.glowStrength * 10)}px ${config.peakFlashColor}`,
    height: `${Math.max(3, config.ribbonThickness * 95)}px`,
    left: "5%",
    position: "absolute",
    right: "5%",
    top: "38%",
    transform: `skewY(${config.waveHeight * 18}deg) translateY(${config.flowSpeed * 2}px)`,
  };
  return (
    <span style={FALLBACK_STYLE}>
      <span style={primaryStyle} />
      <span
        style={{
          ...primaryStyle,
          filter: "blur(2px)",
          opacity: config.reflectionStrength * 0.58,
          top: "66%",
          transform: `scaleY(-0.7) skewY(${config.waveHeight * 12}deg)`,
        }}
      />
    </span>
  );
}

const FALLBACK_STYLE: CSSProperties = {
  display: "block",
  height: "62%",
  position: "relative",
  width: "86%",
};
