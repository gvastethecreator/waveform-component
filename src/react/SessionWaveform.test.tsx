import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createStaticWaveformFrame } from "../core/staticFrame";
import { createWaveformSession } from "../session/WaveformSession";
import { createStaticWaveformSource } from "../session/sources";
import type { WaveformFrame } from "../types";
import { SessionWaveform, useWaveformSession } from "./SessionWaveform";

describe("SessionWaveform", () => {
  it("lets several React views share one source connection and update together", async () => {
    const session = createWaveformSession<WaveformFrame>();
    const connect = vi.fn((context) => {
      context.publish(createStaticWaveformFrame([-1, 0, 1]));
    });

    await act(() =>
      session.attach({ id: "shared", kind: "fixture", ownership: "borrowed", connect }),
    );
    render(
      <>
        <SessionWaveform ariaLabel="Primary" session={session} />
        <SessionWaveform ariaLabel="Mirror" session={session} />
        <SessionStatus session={session} />
      </>,
    );

    expect(connect).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("img", { name: "Primary. 1 source channel, 3 samples." }),
    ).toBeVisible();
    expect(screen.getByRole("img", { name: "Mirror. 1 source channel, 3 samples." })).toBeVisible();
    expect(screen.getByText("fixture:ready:1")).toBeInTheDocument();

    await act(() => session.attach(createStaticWaveformSource([-1, -0.5, 0, 0.5, 1])));
    expect(
      screen.getByRole("img", { name: "Primary. 1 source channel, 5 samples." }),
    ).toBeVisible();
    expect(screen.getByRole("img", { name: "Mirror. 1 source channel, 5 samples." })).toBeVisible();
  });
});

function SessionStatus({
  session,
}: {
  readonly session: ReturnType<typeof createWaveformSession<WaveformFrame>>;
}) {
  const snapshot = useWaveformSession(session);
  return (
    <output>{`${snapshot.source?.kind ?? "none"}:${snapshot.status.state}:${snapshot.epoch}`}</output>
  );
}
