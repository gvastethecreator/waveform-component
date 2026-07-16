import { describe, expect, it, vi } from "vitest";
import { createStaticWaveformFrame } from "../core/staticFrame";
import type { SpectrumFrame, WaveformFrame } from "../types";
import { createWaveformSession } from "./WaveformSession";
import { createStaticWaveformSource } from "./sources";
import type { WaveformSource, WaveformSourceContext, WaveformSourceHandle } from "./types";

describe("WaveformSession", () => {
  it("publishes stable snapshots to several subscribers from one source connection", async () => {
    const session = createWaveformSession<WaveformFrame>();
    const first = vi.fn();
    const second = vi.fn();
    const disconnectFirst = session.subscribe(first);
    session.subscribe(second);

    await session.attach(createStaticWaveformSource([-1, 0, 1], { id: "shared" }));

    expect(session.getSnapshot()).toMatchObject({
      epoch: 1,
      source: { id: "shared", kind: "static", ownership: "borrowed" },
      status: { sourceKind: "static", state: "ready" },
    });
    expect(first).toHaveBeenCalled();
    expect(second).toHaveBeenCalled();

    disconnectFirst();
    const firstCalls = first.mock.calls.length;
    await session.detach();
    expect(first).toHaveBeenCalledTimes(firstCalls);
    expect(second.mock.calls.length).toBeGreaterThan(firstCalls);
    expect(session.getSnapshot()).toMatchObject({ status: { state: "idle" }, source: null });
  });

  it("ignores stale publication and disposes a late async handle exactly once", async () => {
    const session = createWaveformSession<WaveformFrame>();
    const staleFrame = createStaticWaveformFrame([0.75]);
    const lateDispose = vi.fn();
    let staleContext: WaveformSourceContext<WaveformFrame> | undefined;
    let resolveLate: ((handle: WaveformSourceHandle) => void) | undefined;
    let markStarted: (() => void) | undefined;
    const started = new Promise<void>((resolve) => {
      markStarted = resolve;
    });
    const lateSource: WaveformSource<WaveformFrame> = {
      id: "late",
      kind: "async-test",
      ownership: "owned",
      connect(context) {
        staleContext = context;
        markStarted?.();
        return new Promise((resolve) => {
          resolveLate = resolve;
        });
      },
    };

    const lateAttach = session.attach(lateSource);
    await started;
    await session.attach(createStaticWaveformSource([-1, 1], { id: "current" }));
    staleContext?.publish(staleFrame);
    resolveLate?.({ dispose: lateDispose });
    await lateAttach;

    expect(session.getSnapshot().source?.id).toBe("current");
    expect(session.getSnapshot().frame?.sampleCount).toBe(2);
    expect(lateDispose).toHaveBeenCalledTimes(1);
  });

  it("normalizes source failures into a structured recoverable status", async () => {
    const session = createWaveformSession<WaveformFrame>();
    await session.attach({
      id: "broken",
      kind: "broken-source",
      ownership: "borrowed",
      connect() {
        throw new Error("decoder unavailable");
      },
    });

    expect(session.getSnapshot().status).toMatchObject({
      state: "error",
      error: {
        code: "SOURCE_CONNECT_FAILED",
        message: "decoder unavailable",
        recoverable: true,
        sourceKind: "broken-source",
      },
    });
  });

  it("does not connect a replacement when previous-source cleanup fails", async () => {
    const session = createWaveformSession<WaveformFrame>();
    await session.attach({
      id: "sticky",
      kind: "sticky-source",
      ownership: "owned",
      connect(context) {
        context.publish(createStaticWaveformFrame([0]));
        return {
          dispose() {
            throw new Error("resource remained active");
          },
        };
      },
    });
    const replacementConnect = vi.fn();

    await session.attach({
      id: "replacement",
      kind: "replacement",
      ownership: "borrowed",
      connect: replacementConnect,
    });

    expect(replacementConnect).not.toHaveBeenCalled();
    expect(session.getSnapshot().status).toMatchObject({
      state: "error",
      error: {
        code: "SOURCE_DISPOSE_FAILED",
        message: "resource remained active",
        sourceKind: "sticky-source",
      },
    });
  });

  it("disposes active resources once and rejects reuse after terminal disposal", async () => {
    const handleDispose = vi.fn();
    const session = createWaveformSession<WaveformFrame>();
    await session.attach({
      id: "owned",
      kind: "test",
      ownership: "owned",
      connect(context) {
        context.publish(createStaticWaveformFrame([0]));
        return { dispose: handleDispose };
      },
    });

    await session.dispose();
    await session.dispose();

    expect(handleDispose).toHaveBeenCalledTimes(1);
    expect(session.getSnapshot().status).toEqual({ state: "disposed" });
    await expect(session.attach(createStaticWaveformSource([0]))).rejects.toThrow(/disposed/);
  });

  it("is generic over the canonical analysis-frame union", async () => {
    const spectrum: SpectrumFrame = {
      kind: "spectrum",
      state: "ready",
      bins: new Float32Array([-80, -24, -6]),
      fftSize: 8,
      sampleRate: 48_000,
      minimumDecibels: -100,
      maximumDecibels: 0,
    };
    const session = createWaveformSession<SpectrumFrame>();
    await session.attach({
      id: "spectrum",
      kind: "fixture",
      ownership: "borrowed",
      connect(context) {
        context.publish(spectrum);
      },
    });

    expect(session.getSnapshot().frame).toBe(spectrum);
    expect(session.getSnapshot().status).toMatchObject({ state: "ready" });
  });
});
