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
import { DOM_RENDERER_CAPABILITIES, getRendererSupport } from "./capabilities";
import { unsupportedDomScene } from "./domHelpers";
import { renderDomMeter } from "./domMeter";
import { renderDomSpectrum } from "./domSpectrum";
import type { DomRenderOptions, DomScene } from "./domTypes";

interface DomMeterRenderRequest {
  readonly config?: MeterConfigInput;
  readonly frame: MeterFrame;
  readonly history?: readonly MeterHistoryPoint[];
}

interface DomSpectrumRenderRequest {
  readonly config?: SpectrumConfigInput;
  readonly frame: SpectrumFrame;
}

interface DomTimeDomainRenderRequest {
  readonly config?: WaveformConfigInput;
  readonly frame: TimeDomainFrame;
}

export type DomRenderRequest =
  | DomMeterRenderRequest
  | DomSpectrumRenderRequest
  | DomTimeDomainRenderRequest;

export interface DomRendererAdapter {
  readonly capabilities: typeof DOM_RENDERER_CAPABILITIES;
  readonly id: "dom";
  readonly render: (
    request: DomRenderRequest,
    viewport: WaveformViewport,
    options?: DomRenderOptions,
  ) => DomScene;
}

export function renderDomFrame(
  request: DomRenderRequest,
  viewport: WaveformViewport,
  options: DomRenderOptions = {},
): DomScene {
  if (isSpectrumRequest(request))
    return renderDomSpectrum(request.frame, viewport, request.config, options);
  if (isMeterRequest(request))
    return renderDomMeter(request.frame, viewport, request.config, request.history ?? [], options);
  return renderUnsupportedTimeDomain(request.frame, viewport);
}

function isSpectrumRequest(request: DomRenderRequest): request is DomSpectrumRenderRequest {
  return request.frame.kind === "spectrum";
}

function isMeterRequest(request: DomRenderRequest): request is DomMeterRenderRequest {
  return request.frame.kind === "meter";
}

export const DOM_RENDERER_ADAPTER: DomRendererAdapter = Object.freeze({
  capabilities: DOM_RENDERER_CAPABILITIES,
  id: "dom",
  render: renderDomFrame,
});

function renderUnsupportedTimeDomain(frame: TimeDomainFrame, viewport: WaveformViewport): DomScene {
  const support = getRendererSupport("dom", {
    channelCount: frame.channels.length,
    frameKind: frame.kind,
    mode: frame.kind,
    pointCount: frame.sampleCount,
  });
  return unsupportedDomScene(
    viewport.width,
    viewport.height,
    `${support.reasons.join(" ")} Use Canvas 2D or SVG for time-domain curves.`,
  );
}
