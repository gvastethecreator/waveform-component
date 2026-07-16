import { useSyncExternalStore } from "react";
import type { MicrophoneSnapshot, MicrophoneSource } from "../live/MicrophoneSource";

export function useMicrophoneSource(source: MicrophoneSource): MicrophoneSnapshot {
  return useSyncExternalStore(
    source.subscribeMicrophone,
    source.getMicrophoneSnapshot,
    source.getMicrophoneSnapshot,
  );
}
