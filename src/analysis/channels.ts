import { WaveformConfigError } from "../config";
import type { TimeDomainFrame, WaveformChannelSelection } from "../types";

export interface SelectedTimeDomainChannels {
  readonly channels: readonly Float32Array[];
  /** `-1` identifies a mono mix derived from more than one source channel. */
  readonly sourceChannelIndices: readonly number[];
}

export function selectTimeDomainChannels(
  frame: TimeDomainFrame,
  selection: WaveformChannelSelection,
): SelectedTimeDomainChannels {
  switch (selection.channelMode) {
    case "source":
      return freezeSelection(
        frame.channels,
        frame.channels.map((_, index) => index),
      );
    case "mono":
      return freezeSelection([mixChannels(frame.channels)], [frame.channels.length === 1 ? 0 : -1]);
    case "stereo":
      if (frame.channels.length < 2)
        throw new WaveformConfigError(
          "STEREO_REQUIRES_TWO_CHANNELS",
          `Stereo mode requires at least two source channels; received ${frame.channels.length}.`,
        );
      return freezeSelection(frame.channels.slice(0, 2), [0, 1]);
    case "single":
      if (selection.channelIndex >= frame.channels.length)
        throw new WaveformConfigError(
          "INVALID_CHANNEL_INDEX",
          `Channel ${selection.channelIndex} is unavailable; the frame has ${frame.channels.length} channel${frame.channels.length === 1 ? "" : "s"}.`,
        );
      return freezeSelection([frame.channels[selection.channelIndex]], [selection.channelIndex]);
  }
}

export function mixChannels(channels: readonly Float32Array[]): Float32Array {
  const length = channels.reduce((maximum, channel) => Math.max(maximum, channel.length), 0);
  const output = new Float32Array(length);
  for (let sampleIndex = 0; sampleIndex < length; sampleIndex += 1) {
    let sum = 0;
    let contributors = 0;
    for (const channel of channels) {
      if (sampleIndex >= channel.length) continue;
      sum += channel[sampleIndex];
      contributors += 1;
    }
    output[sampleIndex] = contributors === 0 ? 0 : sum / contributors;
  }
  return output;
}

function freezeSelection(
  channels: readonly Float32Array[],
  sourceChannelIndices: readonly number[],
): SelectedTimeDomainChannels {
  return Object.freeze({
    channels: Object.freeze([...channels]),
    sourceChannelIndices: Object.freeze([...sourceChannelIndices]),
  });
}
