import cliProgress, { SingleBar } from "cli-progress";

const multiBar = new cliProgress.MultiBar(
  {
    format: " {bar} {percentage}% | {name} | ETA: {eta}s",
    hideCursor: true,
    clearOnComplete: false,
  },
  cliProgress.Presets.shades_grey,
);
let finished = false;

export function addProgressBar(name: string, total: number): SingleBar | undefined {
  if (finished) {
    return undefined;
  }
  return multiBar.create(total, 0, { name });
}

export function finishAllProgressBars(): void {
  if (!finished) {
    finished = true;
    multiBar.stop();
  }
}
