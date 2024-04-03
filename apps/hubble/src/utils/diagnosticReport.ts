import { client, v1 } from "@datadog/datadog-api-client";
import * as Sentry from "@sentry/node";

let _diagnosticReporter: DiagnosticReporter;

export function initDiagnosticReporter(optOut = false, enableDataDog?: boolean, fid?: number, hubId?: string) {
  if (!_diagnosticReporter) {
    _diagnosticReporter = new DiagnosticReporter(optOut, enableDataDog, fid, hubId);
  }
}

export function diagnosticReporter() {
  return _diagnosticReporter;
}

class DiagnosticReporter {
  private readonly optOut: boolean;
  private readonly enableDataDog: boolean;
  private readonly dataDogInstance: v1.EventsApi | undefined;
  private readonly fid: number | undefined;
  private readonly hubId: string | undefined;
  constructor(optOut: boolean, enableDataDog?: boolean, fid?: number, hubId?: string) {
    this.optOut = optOut;
    this.fid = fid;
    this.enableDataDog = enableDataDog ?? false;
    this.hubId = hubId;

    if (this.enableDataDog) {
      // By default the library will use the DD_API_KEY and DD_APP_KEY
      // environment variables to authenticate against the Datadog API
      const configuration = client.createConfiguration();
      this.dataDogInstance = new v1.EventsApi(configuration);
    }
  }

  public reportError(error: Error) {
    if (this.optOut) {
      return;
    }

    // Publish error report
    if (this.enableDataDog) {
    }

    Sentry.captureException(error);
  }

  private reportToDataDog(error: Error) {
    if (this.optOut || !this.dataDogInstance) {
      return;
    }

    const params: v1.EventsApiCreateEventRequest = {
      body: {
        title: error.name,
        text: error.message,
        priority: "normal",
        tags: ["error", ...((this.fid && [String(this.fid)]) || []), ...((this.hubId && [this.hubId]) || [])],
      },
    };
    this.dataDogInstance.createEvent(params).then(
      (r) => {
        console.log(r);
      },
      (error) => {
        console.error(error);
      },
    );
  }
}
