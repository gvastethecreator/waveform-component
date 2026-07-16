import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

if (typeof window !== "undefined") {
  if (typeof window.matchMedia !== "function") {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: () => ({
        matches: false,
        media: "",
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }),
      writable: true,
    });
  }

  if (typeof window.ResizeObserver !== "function") {
    window.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
  }

  const context = {
    arc: vi.fn(),
    beginPath: vi.fn(),
    clearRect: vi.fn(),
    closePath: vi.fn(),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    fill: vi.fn(),
    fillRect: vi.fn(),
    lineTo: vi.fn(),
    moveTo: vi.fn(),
    roundRect: vi.fn(),
    setTransform: vi.fn(),
    stroke: vi.fn(),
    strokeRect: vi.fn(),
    canvas: document.createElement("canvas"),
    fillStyle: "",
    lineCap: "butt",
    lineWidth: 1,
    strokeStyle: "",
  } as unknown as CanvasRenderingContext2D;

  Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
    configurable: true,
    value: vi.fn((kind: string) => (kind === "2d" ? context : null)),
  });
}

if (!("clipboard" in navigator)) {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
}
