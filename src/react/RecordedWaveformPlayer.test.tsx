import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  createRecordedAudioSource,
  type RecordedAudioEnvironment,
} from "../recorded/RecordedAudioSource";
import { createWaveformSession } from "../session/WaveformSession";
import type { WaveformFrame } from "../types";
import {
  formatAudioTime,
  keyboardSeekTarget,
  RecordedWaveformPlayer,
} from "./RecordedWaveformPlayer";

class PlayerAudioElement extends EventTarget {
  buffered = { length: 0, end: () => 0 } as unknown as TimeRanges;
  currentTime = 0;
  duration = 100;
  ended = false;
  error: MediaError | null = null;
  preload = "";
  src = "";
  load() {}
  removeAttribute() {}
  pause = vi.fn(() => this.dispatchEvent(new Event("pause")));
  play = vi.fn(async () => this.dispatchEvent(new Event("play")));
}

describe("RecordedWaveformPlayer", () => {
  it("provides controlled play, labels, pointer input, and all required keyboard commands", async () => {
    const audio = new PlayerAudioElement();
    const environment: RecordedAudioEnvironment = {
      createAudioContext: () =>
        ({
          close: async () => {},
          decodeAudioData: async () =>
            ({
              duration: 100,
              numberOfChannels: 1,
              sampleRate: 48_000,
              getChannelData: () => new Float32Array([-1, 0, 1]),
            }) as unknown as AudioBuffer,
        }) as never,
      createAudioElement: () => audio as unknown as HTMLAudioElement,
      createObjectURL: () => "blob:player",
      fetchArrayBuffer: async () => new ArrayBuffer(0),
      revokeObjectURL: () => {},
    };
    const source = createRecordedAudioSource(new ArrayBuffer(4), {
      environment,
      name: "drums.wav",
    });
    const session = createWaveformSession<WaveformFrame>();
    await session.attach(source);
    const user = userEvent.setup();
    render(<RecordedWaveformPlayer source={source} session={session} height={120} />);

    await user.click(screen.getByRole("button", { name: "Play drums.wav" }));
    expect(audio.play).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Pause drums.wav" })).toBeVisible();

    const seek = screen.getByRole("slider", { name: "Seek drums.wav" });
    fireEvent.change(seek, { target: { value: "30" } });
    expect(audio.currentTime).toBe(30);
    fireEvent.keyDown(seek, { key: "ArrowRight" });
    expect(audio.currentTime).toBe(35);
    fireEvent.keyDown(seek, { key: "PageUp" });
    expect(audio.currentTime).toBe(45);
    fireEvent.keyDown(seek, { key: " " });
    expect(audio.pause).toHaveBeenCalled();
    fireEvent.keyDown(seek, { key: "Home" });
    expect(audio.currentTime).toBe(0);
    fireEvent.keyDown(seek, { key: "End" });
    expect(audio.currentTime).toBe(100);
  });
});

describe("recorded transport helpers", () => {
  it("formats stable labels and clamps keyboard seeking", () => {
    expect(formatAudioTime(0)).toBe("0:00");
    expect(formatAudioTime(125.9)).toBe("2:05");
    expect(keyboardSeekTarget("ArrowLeft", 2, 100, 5, 10)).toBe(0);
    expect(keyboardSeekTarget("PageUp", 95, 100, 5, 10)).toBe(100);
    expect(keyboardSeekTarget("Spacebar", 30, 100, 5, 10)).toBe("toggle");
    expect(keyboardSeekTarget("Escape", 30, 100, 5, 10)).toBeNull();
  });
});
