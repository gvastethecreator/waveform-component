import { rm } from "node:fs/promises";
import { resolve } from "node:path";

for (const directory of ["dist", "dist-playground", "coverage"]) {
  await rm(resolve(directory), { force: true, recursive: true });
}
