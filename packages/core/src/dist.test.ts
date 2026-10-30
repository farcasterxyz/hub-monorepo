import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// Jest runs the TypeScript sources as ESM, so it never loads the published
// build. The CJS build has to require() ESM-only dependencies such as
// @faker-js/faker, which only works on Node versions that support require(esm).
const distDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist");

const loadsFactories = (script: string, ...flags: string[]) => {
  const result = spawnSync(process.execPath, [...flags, "-e", script], { encoding: "utf8" });
  // Some Node 22 releases print an ExperimentalWarning for require(esm); only surface stderr on failure.
  return { status: result.status, output: result.status === 0 ? result.stdout : `${result.stdout}${result.stderr}` };
};

describe("published build", () => {
  beforeAll(() => {
    if (!existsSync(path.join(distDir, "index.js"))) {
      throw new Error(`${distDir} is missing; run \`yarn build\` before this test`);
    }
  });

  test("CJS entry point loads and runs the factories", () => {
    const cjs = JSON.stringify(path.join(distDir, "index.js"));
    const result = loadsFactories(`const { Factories } = require(${cjs}); console.log(typeof Factories.Fid.build());`);
    expect(result).toEqual({ status: 0, output: "number\n" });
  });

  test("ESM entry point loads and runs the factories", () => {
    const esm = JSON.stringify(pathToFileURL(path.join(distDir, "index.mjs")).href);
    const result = loadsFactories(
      `const { Factories } = await import(${esm}); console.log(typeof Factories.Fid.build());`,
      "--input-type=module",
    );
    expect(result).toEqual({ status: 0, output: "number\n" });
  });
});
