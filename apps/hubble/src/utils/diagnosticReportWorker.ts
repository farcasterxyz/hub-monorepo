import { parentPort } from "worker_threads";
import {
  DiagnosticReportMessage,
  DiagnosticReportMessageSpec,
  DiagnosticReportMessageType,
} from "./diagnosticReport.js";
import { v1 } from "@datadog/datadog-api-client";
import { logger } from "./logger.js";

parentPort?.on("message", (message: unknown) => {
  const { type, payload } = message as DiagnosticReportMessage<keyof DiagnosticReportMessageSpec>;
  switch (type) {
    case DiagnosticReportMessageType.Error: {
      const data = payload as DiagnosticReportMessageSpec[DiagnosticReportMessageType.Error];
      if (data.optOut) {
        return;
      }

      const error = data.error;
      const params: v1.EventsApiCreateEventRequest = {
        body: {
          title: error.name,
          text: error.message,
          priority: "normal",
          tags: ["error", ...((data.fid && [String(data.fid)]) || []), ...((data.peerId && [data.peerId]) || [])],
        },
      };
      data.datadogInstance.createEvent(params).then(
        (r) => {
          logger.debug({ status: r.status }, "Diagnostic error successfully reported to Datadog");
        },
        (error) => {
          logger.error({ error: error }, "Failed to report diagnostic error to Datadog");
        },
      );
      break;
    }
    default:
      logger.error({ type: type }, "Unknown diagnostic report message type");
  }
});
