import { useMemo, useState, useSyncExternalStore } from "react";
import type { KeyboardEvent } from "react";
import type { RecordedAudioSnapshot, RecordedAudioSource } from "../recorded/RecordedAudioSource";
import type { WaveformSession } from "../session/types";
import type { CanvasWaveformConfig, WaveformFrame } from "../types";
import { SessionWaveform } from "./SessionWaveform";
import type { SessionWaveformProps } from "./SessionWaveform";

export interface RecordedWaveformPlayerProps extends Omit<
  SessionWaveformProps,
  "config" | "session"
> {
  readonly config?: Partial<CanvasWaveformConfig>;
  readonly keyboardStep?: number;
  readonly session: WaveformSession<WaveformFrame>;
  readonly source: RecordedAudioSource;
}

export function useRecordedAudioSource(source: RecordedAudioSource): RecordedAudioSnapshot {
  return useSyncExternalStore(
    source.subscribeTransport,
    source.getTransportSnapshot,
    source.getTransportSnapshot,
  );
}

export function RecordedWaveformPlayer({
  ariaLabel = "Recorded audio waveform",
  config,
  keyboardStep = 5,
  session,
  source,
  ...waveformProps
}: RecordedWaveformPlayerProps) {
  const transport = useRecordedAudioSource(source);
  const [seekFocused, setSeekFocused] = useState(false);
  const progress = transport.duration > 0 ? transport.currentTime / transport.duration : 0;
  const resolvedConfig = useMemo(
    () => ({ ...config, playbackProgress: progress }),
    [config, progress],
  );
  const playing = transport.state === "playing";
  const seek = (time: number) => source.seek(time);
  const togglePlayback = () => (playing ? source.pause() : void source.play());
  const handleSeekKey = (event: KeyboardEvent<HTMLInputElement>) => {
    const pageStep = Math.max(keyboardStep, transport.duration / 10);
    const target = keyboardSeekTarget(
      event.key,
      transport.currentTime,
      transport.duration,
      keyboardStep,
      pageStep,
    );
    if (target === null) return;
    event.preventDefault();
    if (target === "toggle") togglePlayback();
    else seek(target);
  };

  return (
    <section aria-label={`${transport.name} player`} style={PLAYER_STYLE}>
      <div style={TRANSPORT_STYLE}>
        <button
          type="button"
          aria-label={playing ? `Pause ${transport.name}` : `Play ${transport.name}`}
          disabled={transport.state === "loading" || transport.duration <= 0}
          onClick={togglePlayback}
          style={BUTTON_STYLE}
        >
          {playing ? "Pause" : "Play"}
        </button>
        <strong style={NAME_STYLE}>{transport.name}</strong>
        <output aria-live="off" style={TIME_STYLE}>
          {formatAudioTime(transport.currentTime)} / {formatAudioTime(transport.duration)}
        </output>
      </div>
      <div style={WAVEFORM_STYLE}>
        <SessionWaveform
          {...waveformProps}
          ariaLabel={ariaLabel}
          config={resolvedConfig}
          session={session}
        />
        <input
          type="range"
          aria-label={`Seek ${transport.name}`}
          min={0}
          max={Math.max(0, transport.duration)}
          step={0.01}
          value={Math.min(transport.currentTime, transport.duration)}
          disabled={transport.duration <= 0}
          onChange={(event) => seek(Number(event.currentTarget.value))}
          onBlur={() => setSeekFocused(false)}
          onFocus={() => setSeekFocused(true)}
          onKeyDown={handleSeekKey}
          style={SEEK_STYLE}
        />
        <span
          aria-hidden="true"
          style={{
            ...PLAYHEAD_STYLE,
            boxShadow: seekFocused ? "0 0 0 3px currentColor" : "none",
            left: `${progress * 100}%`,
          }}
        />
      </div>
      {transport.error ? (
        <p role="alert" style={ERROR_STYLE}>
          {transport.error.message} Try another local audio file.
        </p>
      ) : null}
    </section>
  );
}

export function formatAudioTime(time: number): string {
  const seconds = Math.max(0, Number.isFinite(time) ? time : 0);
  const wholeMinutes = Math.floor(seconds / 60);
  const wholeSeconds = Math.floor(seconds % 60);
  return `${wholeMinutes}:${String(wholeSeconds).padStart(2, "0")}`;
}

export function keyboardSeekTarget(
  key: string,
  currentTime: number,
  duration: number,
  arrowStep: number,
  pageStep: number,
): number | "toggle" | null {
  const clamp = (value: number) => Math.min(duration, Math.max(0, value));
  switch (key) {
    case "ArrowLeft":
    case "ArrowDown":
      return clamp(currentTime - arrowStep);
    case "ArrowRight":
    case "ArrowUp":
      return clamp(currentTime + arrowStep);
    case "PageDown":
      return clamp(currentTime - pageStep);
    case "PageUp":
      return clamp(currentTime + pageStep);
    case "Home":
      return 0;
    case "End":
      return duration;
    case " ":
    case "Spacebar":
      return "toggle";
    default:
      return null;
  }
}

const PLAYER_STYLE = {
  display: "grid",
  gap: "0.5rem",
  gridTemplateRows: "auto minmax(0, 1fr) auto",
  height: "100%",
  minHeight: 0,
  padding: "0.75rem",
  width: "100%",
} as const;
const TRANSPORT_STYLE = { alignItems: "center", display: "flex", gap: "0.65rem" } as const;
const BUTTON_STYLE = {
  background: "#172025",
  border: "1px solid #344146",
  borderRadius: "0.3rem",
  color: "inherit",
  minHeight: "2.25rem",
  minWidth: "4.25rem",
} as const;
const NAME_STYLE = {
  flex: 1,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
} as const;
const TIME_STYLE = { fontVariantNumeric: "tabular-nums" } as const;
const WAVEFORM_STYLE = {
  height: "100%",
  minHeight: 0,
  overflow: "hidden",
  position: "relative",
} as const;
const SEEK_STYLE = {
  cursor: "pointer",
  height: "100%",
  inset: 0,
  margin: 0,
  opacity: 0.001,
  position: "absolute",
  width: "100%",
} as const;
const PLAYHEAD_STYLE = {
  background: "currentColor",
  bottom: 0,
  pointerEvents: "none",
  position: "absolute",
  top: 0,
  width: 1,
} as const;
const ERROR_STYLE = { color: "#ff9daa", margin: 0 } as const;
