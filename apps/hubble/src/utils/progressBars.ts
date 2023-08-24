import cliProgress, { SingleBar } from "cli-progress";
import { logger } from "./logger.js";

// The global multibar, to which all progress bars are added
const multiBar = new cliProgress.MultiBar(
  {
    format: " {bar} {percentage}% | {name} | {value}/{total} | ETA: {eta_formatted}",
    hideCursor: true,
    clearOnComplete: false,
    etaBuffer: 1_000,
    autopadding: true,
  },
  cliProgress.Presets.shades_grey,
);
let finished = false;

// Add a progress bar to the console. Returns undefined if the progress bar
// cannot be added (e.g. if the process is shutting down).
// Call finishAllProgressBars() to stop all progress bars.
export function addProgressBar(name: string, total: number, options?: cliProgress.Options): SingleBar | undefined {
  if (finished) {
    return undefined;
  }
  return multiBar.create(total, 0, { name, ...options });
}

// Finish all progress bars. This should be called when the process is shutting
export function finishAllProgressBars(showDelay = false): void {
  if (!finished) {
    // Finish up the progress bars and start logging to STDOUT
    (async () => {
      if (showDelay) {
        const waitForSec = 30;

        // Wait a few seconds so that the user can see all the status. Do it async, so we don't block the startup
        const progress = addProgressBar("Starting Hubble", waitForSec);
        finished = true;

        for (let i = 0; i < waitForSec; i++) {
          progress?.increment();
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } else {
        finished = true;
      }

      multiBar.stop();
      logger.flush();
    })();
  }
}
