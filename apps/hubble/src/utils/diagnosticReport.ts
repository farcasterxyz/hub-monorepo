import { Worker } from "worker_threads";

let _diagnosticReporter: DiagnosticReporter;

export function initDiagnosticReporter(config: DiagnosticReportConfig) {
  if (!_diagnosticReporter) {
    _diagnosticReporter = new DiagnosticReporter(config);
  }
}

export function diagnosticReporter() {
  return _diagnosticReporter;
}

export enum DiagnosticReportMessageType {
  Unknown = 0,
  Error = 1,
}

export interface DiagnosticReportErrorPayload extends DiagnosticReportConfig {
  error: Error;
}

export interface DiagnosticReportMessageSpec {
  [DiagnosticReportMessageType.Unknown]: never;
  [DiagnosticReportMessageType.Error]: DiagnosticReportErrorPayload;
}

export type DiagnosticReportMessage<T extends DiagnosticReportMessageType> = {
  type: T;
  payload: DiagnosticReportMessageSpec[T];
};

export type DiagnosticReportConfig = {
  optOut: boolean;
  reportURL: string;
  fid?: number;
  peerId?: string;
};

export const DEFAULT_DIAGNOSTIC_REPORT_URL = "https://report.farcaster.xyz";

class DiagnosticReporter {
  private readonly config: DiagnosticReportConfig;
  private readonly worker: Worker;
  constructor(config: DiagnosticReportConfig) {
    this.config = config;
    if (!this.config.reportURL) {
      this.config.reportURL = DEFAULT_DIAGNOSTIC_REPORT_URL;
    }
    // Create a worker thread to run the diagnostics reporter. The path is relative to the current file
    // We use the "../../" to resolve the path from the build directory for transpiled code
    const workerPath = new URL("../../build/utils/diagnosticReportWorker.js", import.meta.url);

    this.worker = new Worker(workerPath);
  }

  public reportError(error: Error) {
    if (this.config.optOut) {
      return;
    }

    // Publish error report
    const errorMessage: DiagnosticReportMessage<DiagnosticReportMessageType.Error> = {
      type: DiagnosticReportMessageType.Error,
      payload: {
        error: error,
        ...this.config,
      },
    };

    this.worker.postMessage(errorMessage);
  }
}
