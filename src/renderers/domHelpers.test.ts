import { describe, expect, it } from "vitest";
import { cssColorWithAlpha, finalizeDomScene } from "./domHelpers";
import type { DomNode } from "./domTypes";

describe("DOM scene helpers", () => {
  it("preserves CSS-variable color roles instead of resolving them headlessly", () => {
    expect(cssColorWithAlpha("var(--signal)", 0.42)).toBe(
      "color-mix(in srgb, var(--signal) 42%, transparent)",
    );
    expect(cssColorWithAlpha("CanvasText", 1)).toBe("CanvasText");
  });

  it("rejects an over-budget scene before exposing an oversized DOM contract", () => {
    const node: DomNode = {
      height: 1,
      key: "node",
      kind: "box",
      role: "step",
      width: 1,
      x: 0,
      y: 0,
    };
    const scene = finalizeDomScene({
      background: "Canvas",
      height: 100,
      nodes: Array.from({ length: 1025 }, (_, index) => ({ ...node, key: `node-${index}` })),
      renderedPointCount: 1025,
      sourcePointCount: 1025,
      width: 100,
    });
    expect(scene.status).toBe("unsupported");
    expect(scene.nodeCount).toBe(0);
    expect(scene.messages[0]).toContain("maximum 1024");
    expect(Object.isFrozen(scene)).toBe(true);
  });
});
