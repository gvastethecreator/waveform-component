import type {
  MeterConfigInput,
  MeterFrame,
  MeterHistoryPoint,
  SpectrumConfigInput,
  SpectrumFrame,
  TimeDomainFrame,
  WaveformConfigInput,
  WaveformViewport,
} from "../types";
import { SVG_RENDERER_CAPABILITIES } from "./capabilities";
import { renderSvgMeter } from "./svgMeter";
import { renderSvgSpectrum } from "./svgSpectrum";
import { renderSvgTimeDomain } from "./svgTimeDomain";
import type { SvgRenderOptions, SvgScene } from "./svgTypes";

interface SvgMeterRenderRequest {
  readonly config?: MeterConfigInput;
  readonly frame: MeterFrame;
  readonly history?: readonly MeterHistoryPoint[];
}

interface SvgSpectrumRenderRequest {
  readonly config?: SpectrumConfigInput;
  readonly frame: SpectrumFrame;
}

interface SvgTimeDomainRenderRequest {
  readonly config?: WaveformConfigInput;
  readonly frame: TimeDomainFrame;
}

export type SvgRenderRequest =
  | SvgMeterRenderRequest
  | SvgSpectrumRenderRequest
  | SvgTimeDomainRenderRequest;

export interface SvgRendererAdapter {
  readonly capabilities: typeof SVG_RENDERER_CAPABILITIES;
  readonly id: "svg";
  readonly render: (
    request: SvgRenderRequest,
    viewport: WaveformViewport,
    options?: SvgRenderOptions,
  ) => SvgScene;
}

export function renderSvgFrame(
  request: SvgRenderRequest,
  viewport: WaveformViewport,
  options: SvgRenderOptions = {},
): SvgScene {
  if (isTimeDomainRequest(request))
    return renderSvgTimeDomain(request.frame, viewport, request.config, options);
  if (isSpectrumRequest(request))
    return renderSvgSpectrum(request.frame, viewport, request.config, options);
  return renderSvgMeter(request.frame, viewport, request.config, request.history ?? [], options);
}

export const SVG_RENDERER_ADAPTER: SvgRendererAdapter = Object.freeze({
  capabilities: SVG_RENDERER_CAPABILITIES,
  id: "svg",
  render: renderSvgFrame,
});

function isTimeDomainRequest(request: SvgRenderRequest): request is SvgTimeDomainRenderRequest {
  return request.frame.kind === "waveform" || request.frame.kind === "envelope";
}

function isSpectrumRequest(request: SvgRenderRequest): request is SvgSpectrumRenderRequest {
  return request.frame.kind === "spectrum";
}
