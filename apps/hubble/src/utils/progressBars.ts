import cliProgress, { SingleBar } from "cli-progress";

// The global multibar, to which all progress bars are added
const multiBar = new cliProgress.MultiBar(
  {
    format: " {bar} {percentage}% | {name} | ETA: {eta}s",
    hideCursor: true,
    clearOnComplete: false,
  },
  cliProgress.Presets.shades_grey,
);
let finished = false;

// Add a progress bar to the console. Returns undefined if the progress bar
// cannot be added (e.g. if the process is shutting down).
// Call finishAllProgressBars() to stop all progress bars.
export function addProgressBar(name: string, total: number): SingleBar | undefined {
  if (finished) {
    return undefined;
  }
  return multiBar.create(total, 0, { name });
}

// Finish all progress bars. This should be called when the process is shutting
export function finishAllProgressBars(): void {
  if (!finished) {
    finished = true;
    multiBar.stop();
  }
}
