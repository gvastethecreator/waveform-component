import { createDemoWaveform, createStaticWaveformFrame } from "../core/staticFrame";
import type { DemoWaveformOptions, StaticWaveformOptions } from "../core/staticFrame";
import type { StaticWaveformInput, WaveformFrame } from "../types";
import type {
  SourceOwnership,
  WaveformSource,
  WaveformSourceContext,
  WaveformSourceHandle,
  WaveformSourceState,
} from "./types";

export interface SourceOptions {
  readonly id?: string;
}

export interface MediaStreamSourceOptions extends SourceOptions {
  readonly ownership?: SourceOwnership;
}

export function createStaticWaveformSource(
  input: StaticWaveformInput,
  options: SourceOptions & StaticWaveformOptions = {},
): WaveformSource<WaveformFrame> {
  const frame = createStaticWaveformFrame(input, options);
  return createFrameSource("static", options.id ?? "static", frame);
}

export function createDemoWaveformSource(
  options: SourceOptions & DemoWaveformOptions = {},
): WaveformSource<WaveformFrame> {
  const samples = createDemoWaveform(options);
  const frame = createStaticWaveformFrame(samples);
  return createFrameSource("demo", options.id ?? "demo", frame, "owned");
}

export function createPcmWaveformSource(
  channels: StaticWaveformInput,
  options: SourceOptions & StaticWaveformOptions = {},
): WaveformSource<WaveformFrame> {
  const frame = createStaticWaveformFrame(channels, options);
  return createFrameSource("pcm", options.id ?? "pcm", frame);
}

export function createAudioBufferWaveformSource(
  buffer: AudioBuffer,
  options: SourceOptions = {},
): WaveformSource<WaveformFrame> {
  const channels = Array.from({ length: buffer.numberOfChannels }, (_, index) =>
    buffer.getChannelData(index),
  );
  const frame = createStaticWaveformFrame(channels, {
    duration: buffer.duration,
    sampleRate: buffer.sampleRate,
  });
  return createFrameSource("audio-buffer", options.id ?? "audio-buffer", frame);
}

export function createMediaElementWaveformSource(
  element: HTMLMediaElement,
  options: SourceOptions = {},
): WaveformSource<WaveformFrame> {
  return {
    id: options.id ?? "media-element",
    kind: "media-element",
    ownership: "borrowed",
    connect(context) {
      const update = () => {
        if (element.error) {
          context.fail({
            code: "MEDIA_ELEMENT_ERROR",
            message: element.error.message || "The media element reported an error.",
            recoverable: true,
          });
        } else if (element.ended) {
          context.setState("ended");
        } else {
          context.setState(element.readyState > 0 ? "ready" : "empty");
        }
      };
      const events = ["loadedmetadata", "canplay", "emptied", "ended", "error"] as const;
      for (const event of events) element.addEventListener(event, update);
      update();
      return onceHandle(() => {
        for (const event of events) element.removeEventListener(event, update);
      });
    },
  };
}

export function createMediaStreamWaveformSource(
  stream: MediaStream,
  options: MediaStreamSourceOptions = {},
): WaveformSource<WaveformFrame> {
  const ownership = options.ownership ?? "borrowed";
  return {
    id: options.id ?? "media-stream",
    kind: "media-stream",
    ownership,
    connect(context) {
      const tracks = stream.getAudioTracks();
      const update = () => context.setState(streamState(tracks));
      for (const track of tracks) {
        track.addEventListener("ended", update);
        track.addEventListener("mute", update);
        track.addEventListener("unmute", update);
      }
      update();
      return onceHandle(() => {
        for (const track of tracks) {
          track.removeEventListener("ended", update);
          track.removeEventListener("mute", update);
          track.removeEventListener("unmute", update);
          if (ownership === "owned") track.stop();
        }
      });
    },
  };
}

export function createAudioNodeWaveformSource(
  _node: AudioNode,
  options: SourceOptions = {},
): WaveformSource<WaveformFrame> {
  return {
    id: options.id ?? "audio-node",
    kind: "audio-node",
    ownership: "borrowed",
    connect(context) {
      context.setState("ready");
    },
  };
}

function createFrameSource(
  kind: string,
  id: string,
  frame: WaveformFrame,
  ownership: SourceOwnership = "borrowed",
): WaveformSource<WaveformFrame> {
  return Object.freeze({
    id,
    kind,
    ownership,
    connect(context: WaveformSourceContext<WaveformFrame>) {
      context.publish(frame);
    },
  });
}

function streamState(tracks: readonly MediaStreamTrack[]): WaveformSourceState {
  if (tracks.length === 0) return "empty";
  if (tracks.every((track) => track.readyState === "ended")) return "ended";
  if (tracks.every((track) => track.muted || !track.enabled)) return "muted";
  return "ready";
}

function onceHandle(dispose: () => void): WaveformSourceHandle {
  let disposed = false;
  return {
    dispose() {
      if (disposed) return;
      disposed = true;
      dispose();
    },
  };
}
