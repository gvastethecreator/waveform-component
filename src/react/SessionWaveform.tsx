import { useSyncExternalStore } from "react";
import { createStaticWaveformFrame } from "../core/staticFrame";
import type { WaveformSession, WaveformSessionSnapshot } from "../session/types";
import type { AnalysisFrame, WaveformFrame } from "../types";
import { Waveform } from "./Waveform";
import type { WaveformProps } from "./Waveform";

const EMPTY_FRAME = createStaticWaveformFrame([]);

export function useWaveformSession<Frame extends AnalysisFrame>(
  session: WaveformSession<Frame>,
): WaveformSessionSnapshot<Frame> {
  return useSyncExternalStore(session.subscribe, session.getSnapshot, session.getSnapshot);
}

export interface SessionWaveformProps extends Omit<WaveformProps, "data"> {
  readonly session: WaveformSession<WaveformFrame>;
}

export function SessionWaveform({ session, ...props }: SessionWaveformProps) {
  const snapshot = useWaveformSession(session);
  return <Waveform {...props} data={snapshot.frame ?? EMPTY_FRAME} />;
}
