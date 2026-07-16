import { describe, expect, it } from "vitest";
import { createSpectrumFrame } from "./spectrum";
import {
  SpectrumFrameDelay,
  createSpectrumDynamicsProcessor,
  gaussianFilterSpectrum,
  resolveSpectrumDynamicsConfig,
  resolveVisualSyncOffset,
} from "./spectrumDynamics";

const FRAME_OPTIONS = {
  fftSize: 32,
  maximumDecibels: 0,
  minimumDecibels: -120,
  sampleRate: 32_000,
} as const;

describe("spectrum dynamics", () => {
  it("resolves finite ranges and orders frequency and threshold pairs", () => {
    const config = resolveSpectrumDynamicsConfig({
      attackMs: Number.NaN,
      gaussianRadius: 100,
      highFrequency: 100,
      lowFrequency: 1000,
      peakThresholdDb: -80,
      reactThresholdDb: -20,
      smoothingFactor: 2,
      smoothingMode: "invalid" as never,
    });

    expect(config.attackMs).toBe(35);
    expect(config.gaussianRadius).toBe(32);
    expect(config.lowFrequency).toBe(100);
    expect(config.highFrequency).toBe(1000);
    expect(config.reactThresholdDb).toBe(-80);
    expect(config.peakThresholdDb).toBe(-20);
    expect(config.smoothingFactor).toBe(0.9999);
    expect(config.smoothingMode).toBe("none");

    const frameBound = resolveSpectrumDynamicsConfig(
      {
        highFrequency: 100_000,
        lowFrequency: 90_000,
        normalizationTargetDb: -200,
        peakThresholdDb: 10,
        reactThresholdDb: -200,
        silenceThresholdDb: 10,
      },
      FRAME_OPTIONS,
    );
    expect(frameBound).toMatchObject({
      highFrequency: 16_000,
      lowFrequency: 16_000,
      normalizationTargetDb: -120,
      peakThresholdDb: 0,
      reactThresholdDb: -120,
      silenceThresholdDb: 0,
    });
  });

  it.each([
    ["simple EMA", { smoothingFactor: 0.72, smoothingMode: "ema" as const }],
    [
      "time-variant EMA with inertia",
      {
        attackMs: 180,
        inertiaMs: 70,
        releaseMs: 420,
        smoothingMode: "time-variant-ema" as const,
      },
    ],
  ])("keeps %s response stable at 30, 60, and 120 Hz", (_, config) => {
    const outputs = [30, 60, 120].map((cadence) => runStep(cadence, config));

    expect(outputs[0]).toBeCloseTo(outputs[1], 3);
    expect(outputs[1]).toBeCloseTo(outputs[2], 3);
  });

  it("uses separate attack/release constants and lets fast peaks bypass attack", () => {
    const processor = createSpectrumDynamicsProcessor();
    const config = {
      attackMs: 200,
      releaseMs: 800,
      smoothingMode: "time-variant-ema" as const,
    };
    processor.process(frameAt(-80), config, { timestampMs: 0 });
    const attacked = processor.process(frameAt(-20), config, { timestampMs: 100 });
    const released = processor.process(frameAt(-80), config, { timestampMs: 200 });

    expect(attacked.frame.bins[0]).toBeCloseTo(-56.39, 1);
    expect(released.frame.bins[0]).toBeGreaterThan(-60);

    processor.reset();
    processor.process(frameAt(-80), config, { timestampMs: 0 });
    const fast = processor.process(
      frameAt(-20),
      { ...config, fastPeaks: true },
      { timestampMs: 100 },
    );
    expect(fast.frame.bins[0]).toBe(-20);
  });

  it("caps normalization gain and never lifts floor-only silence", () => {
    const processor = createSpectrumDynamicsProcessor();
    const normalized = processor.process(frameAt(-30), {
      normalizationEnabled: true,
      normalizationMaxGainDb: 6,
      normalizationTargetDb: -12,
    });
    expect(normalized.appliedGainDb).toBe(6);
    expect(normalized.peakDb).toBe(-24);

    processor.reset();
    const silence = processor.process(frameAt(-120), {
      normalizationEnabled: true,
      normalizationMaxGainDb: 60,
      normalizationTargetDb: 0,
    });
    expect(silence.appliedGainDb).toBe(0);
    expect(silence.peakDb).toBe(-120);
  });

  it("applies slope, cutoff roll-off, and Gaussian bin filtering independently", () => {
    const bins = new Float32Array(16).fill(-60);
    bins[4] = -20;
    const frame = createSpectrumFrame(bins, FRAME_OPTIONS);
    const processor = createSpectrumDynamicsProcessor();
    const compensated = processor.process(frame, {
      gaussianRadius: 0,
      highFrequency: 12_000,
      highFrequencySlopeDbPerOctave: 3,
      highFrequencySlopeReference: 1000,
      lowFrequency: 2000,
      rolloffAttenuationDb: 12,
      rolloffBandwidthHz: 1000,
    });

    // Bin 4 is 4 kHz: +6 dB from two octaves and no in-band roll-off.
    expect(compensated.frame.bins[4]).toBe(-14);
    // Bin 1 is below the 2 kHz cutoff and receives the full 12 dB attenuation.
    expect(compensated.frame.bins[1]).toBe(-72);

    const filtered = gaussianFilterSpectrum(Float32Array.from([-100, -100, -20, -100, -100]), 1);
    expect(filtered[2]).toBeGreaterThan(filtered[1]);
    expect(filtered[1]).toBeGreaterThan(filtered[0]);
    expect(filtered[1]).toBeCloseTo(filtered[3], 5);
    expect(Array.from(filtered).every(Number.isFinite)).toBe(true);
  });

  it("makes threshold, silence, and mute policy transitions explicit", () => {
    const processor = createSpectrumDynamicsProcessor();
    const active = processor.process(frameAt(-10), {
      peakThresholdDb: -12,
      reactThresholdDb: -48,
    });
    expect(active).toMatchObject({ peakActive: true, policy: "processed", reacting: true });

    const held = processor.process(frameAt(-70), undefined, {
      sourceState: "muted",
      timestampMs: 16,
    });
    expect(held.policy).toBe("held-muted");
    expect(held.frame.bins[0]).toBe(-10);

    const processedMute = processor.process(
      frameAt(-70),
      { processMuted: true },
      { sourceState: "muted", timestampMs: 32 },
    );
    expect(processedMute.policy).toBe("processed");
    expect(processedMute.frame.bins[0]).toBe(-70);

    const hidden = processor.process(
      frameAt(-110),
      { hideSilent: true, silenceThresholdDb: -100 },
      { sourceState: "silent", timestampMs: 48 },
    );
    expect(hidden).toMatchObject({ policy: "hidden-silent", visible: false });

    processor.reset();
    const firstMuted = processor.process(
      frameAt(-20),
      { hideSilent: true, processMuted: false },
      { sourceState: "muted", timestampMs: 0 },
    );
    expect(firstMuted.policy).toBe("held-muted");
    expect(firstMuted.frame.bins[0]).toBe(-120);
    expect(firstMuted.visible).toBe(false);
  });

  it("resolves look-ahead capability without claiming audio delay ownership", () => {
    expect(
      resolveVisualSyncOffset(-120, { canLookAhead: false, sourceKind: "live microphone" }),
    ).toEqual({
      enabled: false,
      offsetMs: 0,
      reason: "live microphone cannot provide future audio frames for negative visual sync.",
    });
    expect(
      resolveVisualSyncOffset(-120, { canLookAhead: true, sourceKind: "decoded buffer" }),
    ).toEqual({ enabled: true, offsetMs: -120 });
    expect(
      resolveVisualSyncOffset(250, { canLookAhead: false, sourceKind: "live microphone" }),
    ).toEqual({ enabled: true, offsetMs: 250 });
  });

  it("buffers positive visual offsets in a bounded timestamp queue", () => {
    const delay = new SpectrumFrameDelay(3);
    const first = frameAt(-10);
    const second = frameAt(-20);
    const third = frameAt(-30);

    expect(delay.push(first, 0, 100)).toBeNull();
    expect(delay.push(second, 50, 100)).toBeNull();
    expect(delay.push(third, 100, 100)).toBe(first);
    expect(delay.push(frameAt(-40), 160, 100)).toBe(second);
    delay.clear();
    expect(delay.push(third, 200, 0)).toBe(third);
  });
});

function frameAt(decibels: number) {
  return createSpectrumFrame(new Float32Array(16).fill(decibels), FRAME_OPTIONS);
}

function runStep(
  cadence: number,
  config: Parameters<ReturnType<typeof createSpectrumDynamicsProcessor>["process"]>[1],
) {
  const processor = createSpectrumDynamicsProcessor();
  processor.process(frameAt(-100), config, { timestampMs: 0 });
  for (let step = 1; step <= cadence; step += 1)
    processor.process(frameAt(-20), config, { timestampMs: (step * 1000) / cadence });
  return processor.process(frameAt(-20), config, { timestampMs: 1000 }).frame.bins[0];
}
