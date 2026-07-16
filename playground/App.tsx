import {
  IconCheck,
  IconCode,
  IconCopy,
  IconFocus2,
  IconLayoutGrid,
  IconRefresh,
} from "@tabler/icons-react";
import { useEffect, useId, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  DEFAULT_WAVEFORM_CONFIG,
  SessionWaveform,
  Waveform,
  createDemoWaveform,
  createDemoWaveformSource,
  createWaveformSession,
  useWaveformSession,
  type CanvasWaveformConfig,
  type WaveformFrame,
} from "waveform-component";

const PRESETS = [
  { id: "broadcast", label: "Broadcast", phase: 0, color: "#62dcf5" },
  { id: "transient", label: "Transient", phase: 0.18, color: "#f8d65c" },
  { id: "nocturne", label: "Nocturne", phase: 0.37, color: "#a7f59c" },
  { id: "signal", label: "Signal red", phase: 0.64, color: "#ff7892" },
] as const;

type Preset = (typeof PRESETS)[number];

export default function App() {
  const [view, setView] = useState<"overview" | "focus">("overview");
  const [presetId, setPresetId] = useState<Preset["id"]>("broadcast");
  const [sampleCount, setSampleCount] = useState(2048);
  const [amplitude, setAmplitude] = useState(DEFAULT_WAVEFORM_CONFIG.amplitude);
  const [lineWidth, setLineWidth] = useState(DEFAULT_WAVEFORM_CONFIG.lineWidth);
  const [showCenterLine, setShowCenterLine] = useState(true);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const session = useMemo(() => createWaveformSession<WaveformFrame>(), []);
  const preset = PRESETS.find((candidate) => candidate.id === presetId) ?? PRESETS[0];
  const sessionSnapshot = useWaveformSession(session);
  const config = useMemo<Partial<CanvasWaveformConfig>>(
    () => ({ amplitude, color: preset.color, lineWidth, showCenterLine }),
    [amplitude, lineWidth, preset.color, showCenterLine],
  );

  useEffect(() => {
    void session.attach(
      createDemoWaveformSource({
        id: `${preset.id}-${sampleCount}`,
        phase: preset.phase,
        sampleCount,
      }),
    );
    return () => {
      void session.detach();
    };
  }, [preset.id, preset.phase, sampleCount, session]);

  const reset = () => {
    setPresetId("broadcast");
    setSampleCount(2048);
    setAmplitude(DEFAULT_WAVEFORM_CONFIG.amplitude);
    setLineWidth(DEFAULT_WAVEFORM_CONFIG.lineWidth);
    setShowCenterLine(true);
    setCopyState("idle");
  };

  const copyCode = async () => {
    const code = `<Waveform\n  data={samples}\n  config={{\n    renderer: "canvas2d",\n    mode: "waveform",\n    amplitude: ${amplitude.toFixed(2)},\n    lineWidth: ${lineWidth.toFixed(1)},\n    color: "${preset.color}",\n    showCenterLine: ${showCenterLine}\n  }}\n/>`;
    try {
      await navigator.clipboard.writeText(code);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  };

  return (
    <div className="workbench" data-view={view}>
      <main className="workbench-main">
        <header className="topbar">
          <div className="brand-lockup">
            <span className="brand-mark" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
              <i />
            </span>
            <div>
              <h1>Signal Workbench</h1>
              <p>Deterministic demo · signed PCM · 48 kHz</p>
            </div>
          </div>
          <div className="view-switch" role="group" aria-label="Workbench view">
            <button
              type="button"
              aria-pressed={view === "overview"}
              onClick={() => setView("overview")}
            >
              <IconLayoutGrid size={14} aria-hidden="true" />
              Overview
            </button>
            <button type="button" aria-pressed={view === "focus"} onClick={() => setView("focus")}>
              <IconFocus2 size={14} aria-hidden="true" />
              Focus
            </button>
          </div>
          <div className="status-readout" aria-label="Signal status">
            <span className="status-dot" />
            {sessionSnapshot.source?.kind.toUpperCase() ?? "NO SOURCE"} /{" "}
            {sessionSnapshot.status.state.toUpperCase()}
          </div>
        </header>

        <section className="artifact-area" aria-labelledby="artifact-title">
          <div className="artifact-card">
            <div className="artifact-meta">
              <div>
                <span className="eyebrow">LIVE ARTIFACT</span>
                <h2 id="artifact-title">{preset.label} waveform</h2>
              </div>
              <div className="artifact-badges" aria-label="Active visualization">
                <span>WAVEFORM</span>
                <span>CANVAS 2D</span>
                <span>MONO</span>
              </div>
            </div>
            <div className="signal-stage">
              <div className="signal-scale" aria-hidden="true">
                <span>+1.0</span>
                <span>0.0</span>
                <span>−1.0</span>
              </div>
              <SessionWaveform
                ariaLabel={`${preset.label} deterministic waveform preview`}
                className="primary-waveform"
                config={config}
                height="100%"
                session={session}
              />
              <div className="transient-guide" aria-hidden="true">
                <span>TRANSIENT</span>
                <i />
              </div>
            </div>
            <div className="artifact-footer">
              <span>{sampleCount.toLocaleString()} SAMPLES</span>
              <span>PEAK +0.91 / −0.74</span>
              <span>PUBLIC PACKAGE PATH</span>
            </div>
          </div>

          <section className="preset-section" aria-labelledby="preset-heading">
            <div className="section-heading">
              <div>
                <span className="eyebrow">DETERMINISTIC SOURCES</span>
                <h2 id="preset-heading">Signal studies</h2>
              </div>
              <span>Same component · four configurations</span>
            </div>
            <div className="preset-grid">
              {PRESETS.map((candidate) => {
                const selected = candidate.id === preset.id;
                return (
                  <button
                    type="button"
                    className="preset-card"
                    data-selected={selected}
                    aria-pressed={selected}
                    key={candidate.id}
                    onClick={() => setPresetId(candidate.id)}
                  >
                    <Waveform
                      ariaLabel={`${candidate.label} preset thumbnail`}
                      data={createDemoWaveform({ phase: candidate.phase, sampleCount: 384 })}
                      config={{
                        ...config,
                        backgroundColor: "transparent",
                        color: candidate.color,
                        lineWidth: 1,
                        padding: 4,
                        showCenterLine: false,
                      }}
                      height={50}
                    />
                    <span className="preset-copy">
                      <strong>{candidate.label}</strong>
                      <small>{selected ? "ACTIVE" : "LOAD PRESET"}</small>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        </section>
      </main>

      <aside className="inspector" aria-label="Waveform controls">
        <header className="inspector-header">
          <div>
            <span className="eyebrow">PLAYGROUND</span>
            <h2>Waveform 001</h2>
          </div>
          <span className="version-tag">v0.1 tracer</span>
        </header>

        <div className="inspector-scroll">
          <ControlSection title="Source & transport">
            <StaticRow label="Source" value="Deterministic demo · session" />
            <p className="control-note">No permission, network, or audio device required.</p>
          </ControlSection>

          <ControlSection title="Visualization">
            <StaticRow label="Visual mode" value="Waveform" />
            <StaticRow label="Rendering engine" value="Canvas 2D" />
            <p className="control-note">Mode and engine are separate public contracts.</p>
          </ControlSection>

          <ControlSection title="Geometry">
            <RangeControl
              label="Amplitude"
              min={0.2}
              max={1.5}
              step={0.01}
              value={amplitude}
              valueLabel={`${amplitude.toFixed(2)}×`}
              onChange={setAmplitude}
            />
            <RangeControl
              label="Line width"
              min={0.5}
              max={5}
              step={0.1}
              value={lineWidth}
              valueLabel={`${lineWidth.toFixed(1)} px`}
              onChange={setLineWidth}
            />
            <RangeControl
              label="Sample density"
              min={256}
              max={4096}
              step={256}
              value={sampleCount}
              valueLabel={sampleCount.toLocaleString()}
              onChange={setSampleCount}
            />
          </ControlSection>

          <ControlSection title="Color & guides">
            <label className="color-control">
              <span>Signal color</span>
              <span className="color-readout">
                <i style={{ "--swatch": preset.color } as CSSProperties} />
                {preset.color.toUpperCase()}
              </span>
            </label>
            <label className="toggle-control">
              <span>
                <strong>Center line</strong>
                <small>Zero-amplitude reference</small>
              </span>
              <input
                type="checkbox"
                checked={showCenterLine}
                onChange={(event) => setShowCenterLine(event.currentTarget.checked)}
              />
            </label>
          </ControlSection>

          <ControlSection title="Contract">
            <dl className="contract-list">
              <div>
                <dt>Input</dt>
                <dd>Float32Array</dd>
              </div>
              <div>
                <dt>Range</dt>
                <dd>−1…+1 signed</dd>
              </div>
              <div>
                <dt>Resize</dt>
                <dd>DPR aware</dd>
              </div>
              <div>
                <dt>Import</dt>
                <dd>SSR safe</dd>
              </div>
              <div>
                <dt>Lifecycle</dt>
                <dd>Epoch {sessionSnapshot.epoch}</dd>
              </div>
              <div>
                <dt>Ownership</dt>
                <dd>{sessionSnapshot.source?.ownership ?? "none"}</dd>
              </div>
            </dl>
          </ControlSection>
        </div>

        <footer className="inspector-actions">
          <button type="button" className="secondary-action" onClick={reset}>
            <IconRefresh size={15} aria-hidden="true" />
            Reset
          </button>
          <button type="button" className="primary-action" onClick={copyCode}>
            {copyState === "copied" ? (
              <IconCheck size={15} aria-hidden="true" />
            ) : copyState === "failed" ? (
              <IconCode size={15} aria-hidden="true" />
            ) : (
              <IconCopy size={15} aria-hidden="true" />
            )}
            {copyState === "copied"
              ? "Copied"
              : copyState === "failed"
                ? "Copy blocked"
                : "Copy code"}
          </button>
          <span className="copy-status" aria-live="polite">
            {copyState === "failed"
              ? "Clipboard unavailable. Try again after granting access."
              : ""}
          </span>
        </footer>
      </aside>
    </div>
  );
}

function ControlSection({
  children,
  title,
}: {
  readonly children: ReactNode;
  readonly title: string;
}) {
  return (
    <section className="control-section">
      <h3>{title}</h3>
      <div className="control-stack">{children}</div>
    </section>
  );
}

function StaticRow({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="static-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

interface RangeControlProps {
  readonly label: string;
  readonly max: number;
  readonly min: number;
  readonly onChange: (value: number) => void;
  readonly step: number;
  readonly value: number;
  readonly valueLabel: string;
}

function RangeControl({ label, max, min, onChange, step, value, valueLabel }: RangeControlProps) {
  const inputId = useId();
  return (
    <div className="range-control">
      <span>
        <label htmlFor={inputId}>{label}</label>
        <output htmlFor={inputId}>{valueLabel}</output>
      </span>
      <input
        id={inputId}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
      />
    </div>
  );
}
