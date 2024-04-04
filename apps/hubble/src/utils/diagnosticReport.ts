import { Worker } from "worker_threads";
import { client, v1 } from "@datadog/datadog-api-client";

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
  Error = 0,
}

export interface DiagnosticReportErrorPayload extends DiagnosticReportConfig {
  error: Error;
  datadogInstance: v1.EventsApi;
}

export interface DiagnosticReportMessageSpec {
  [DiagnosticReportMessageType.Error]: DiagnosticReportErrorPayload;
}

export type DiagnosticReportMessage<T extends DiagnosticReportMessageType> = {
  type: T;
  payload: DiagnosticReportMessageSpec[T];
};

type DiagnosticReportConfig = {
  optOut: boolean;
  fid?: number;
  peerId?: string;
};

class DiagnosticReporter {
  private readonly config: DiagnosticReportConfig;
  private readonly dataDogInstance: v1.EventsApi | undefined;
  private readonly worker: Worker;
  constructor(config: DiagnosticReportConfig) {
    this.config = config;
    this.worker = new Worker(new URL("./diagnosticReportWorker.ts", import.meta.url));

    // By default the library will use the DD_API_KEY and DD_APP_KEY
    // environment variables to authenticate against the Datadog API
    const configuration = client.createConfiguration();
    this.dataDogInstance = new v1.EventsApi(configuration);
  }

  public reportError(error: Error) {
    if (this.config.optOut || !this.dataDogInstance) {
      return;
    }

    // Publish error report
    const errorMessage: DiagnosticReportMessage<DiagnosticReportMessageType.Error> = {
      type: DiagnosticReportMessageType.Error,
      payload: {
        error: error,
        datadogInstance: this.dataDogInstance,
        ...this.config,
      },
    };

    this.worker.postMessage(errorMessage);
  }
}
