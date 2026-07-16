import { rm } from "node:fs/promises";
import { isAbsolute, relative, resolve } from "node:path";

const repositoryRoot = resolve(".");
const fixtureRoot = resolve("fixtures/external-consumer");
const fixtureRelative = relative(repositoryRoot, fixtureRoot);

if (fixtureRelative.startsWith("..") || isAbsolute(fixtureRelative)) {
  throw new Error("Refusing to clean an external-consumer fixture outside the repository.");
}

for (const entry of ["node_modules", "bun.lock", "waveform-component.tgz"]) {
  await rm(resolve(fixtureRoot, entry), { force: true, recursive: entry === "node_modules" });
}
