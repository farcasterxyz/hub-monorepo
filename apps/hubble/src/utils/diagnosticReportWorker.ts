import { parentPort } from "worker_threads";
import {
  DiagnosticReportConfig,
  DiagnosticReportMessage,
  DiagnosticReportMessageSpec,
  DiagnosticReportMessageType,
  DiagnosticReportUnavailablePayload,
} from "./diagnosticReport.js";
import { logger } from "./logger.js";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { constants as httpConstants } from "http2";

const DataDogEventAlert = {
  ERROR: "error",
  WARNING: "warning",
  INFO: "info",
  SUCCESS: "success",
  USER_UPDATE: "user_update",
  RECOMMENDATION: "recommendation",
  SNAPSHOT: "snapshot",
} as const;

type DataDogEventAlertType = typeof DataDogEventAlert[keyof typeof DataDogEventAlert];

const DataDogEventPriority = {
  NORMAL: "normal",
  LOW: "low",
} as const;

type DataDogEventPriorityType = typeof DataDogEventPriority[keyof typeof DataDogEventPriority];

type DataDogEventCreateRequest = {
  /**
   * An arbitrary string to use for aggregation. Limited to 100 characters.
   * If you specify a key, all events using that key are grouped together in the Event Stream.
   */
  aggregationKey?: string;
  /**
   * If an alert event is enabled, set its type.
   * For example, `error`, `warning`, `info`, `success`, `user_update`,
   * `recommendation`, and `snapshot`.
   */
  alertType?: DataDogEventAlertType;
  /**
   * POSIX timestamp of the event. Must be sent as an integer (that is no quotes).
   * Limited to events no older than 18 hours
   */
  dateHappened?: number;
  /**
   * A device name.
   */
  deviceName?: string;
  /**
   * Host name to associate with the event.
   * Any tags associated with the host are also applied to this event.
   */
  host?: string;
  /**
   * The priority of the event. For example, `normal` or `low`.
   */
  priority?: DataDogEventPriorityType;
  /**
   * ID of the parent event. Must be sent as an integer (that is no quotes).
   */
  relatedEventId?: number;
  /**
   * The type of event being posted. Option examples include nagios, hudson, jenkins, my_apps, chef, puppet, git, bitbucket, etc.
   * A complete list of source attribute values [available here](https://docs.datadoghq.com/integrations/faq/list-of-api-source-attribute-value).
   */
  sourceTypeName?: string;
  /**
   * A list of tags to apply to the event.
   */
  tags?: Array<string>;
  /**
   * The body of the event. Limited to 4000 characters. The text supports markdown.
   * To use markdown in the event text, start the text block with `%%% \n` and end the text block with `\n %%%`.
   * Use `msg_text` with the Datadog Ruby library.
   */
  text: string;
  /**
   * The event title.
   */
  title: string;
};

const DataDogRouteEventsAPI = "/api/v1/events";

parentPort?.on("message", async (message: unknown) => {
  const { type: messageType, payload } = message as DiagnosticReportMessage<keyof DiagnosticReportMessageSpec>;
  if (payload.optOut) {
    return;
  }

  let response: AxiosResponse<unknown, unknown> | null = null;
  switch (messageType) {
    case DiagnosticReportMessageType.Error: {
      const data = payload as DiagnosticReportMessageSpec[DiagnosticReportMessageType.Error];
      response = await postErrorEvent(data.error, data);
      break;
    }
    case DiagnosticReportMessageType.Unavailable: {
      const data = payload as DiagnosticReportMessageSpec[DiagnosticReportMessageType.Unavailable];
      response = await postUnavailableEvent(data, data);
      break;
    }
    default:
      logger.error({ type: messageType }, "Unknown diagnostic report message type");
  }

  if (response && response.status !== httpConstants.HTTP_STATUS_ACCEPTED) {
    logger.error(
      {
        status: response.status,
        response_data: JSON.stringify(response.data),
      },
      "Failed to report diagnostic to Datadog",
    );
  }
});

const postDataDogEvent = (
  request: DataDogEventCreateRequest,
  config: DiagnosticReportConfig,
): Promise<AxiosResponse> => {
  if (config.optOut) {
    return Promise.resolve({} as AxiosResponse);
  }

  const baseURL = new URL(config.reportURL);
  const errorURL = new URL(DataDogRouteEventsAPI, baseURL);
  const requestConfig: AxiosRequestConfig = {
    responseType: "json",
    headers: {
      "Content-Type": "application/json",
      ...(process.env["HUB_DIAGNOSTICS_API_KEY"] && { "DD-API-KEY": process.env["HUB_DIAGNOSTICS_API_KEY"] }),
      ...(process.env["HUB_DIAGNOSTICS_APP_KEY"] && { "DD-APP-KEY": process.env["HUB_DIAGNOSTICS_APP_KEY"] }),
    },
  };
  return axios.post(errorURL.toString(), request, requestConfig);
};

export const postErrorEvent = async (error: Error, config: DiagnosticReportConfig): Promise<AxiosResponse> => {
  const errorMessage: string = `[error]: ${error.message}`;
  // Check if the stack trace is available, as it might be undefined in some environments
  const stackTrace: string = error.stack ? `\n[stack_trace]:\n${error.stack}` : " [stack_trace: unavailable]";
  const text: string = `${errorMessage}${stackTrace}`;

  const params: DataDogEventCreateRequest = {
    alertType: DataDogEventAlert.ERROR,
    title: error.name,
    text: text,
    priority: DataDogEventPriority.NORMAL,
    tags: ["error", ...((config.fid && [String(config.fid)]) || []), ...((config.peerId && [config.peerId]) || [])],
  };

  return postDataDogEvent(params, config);
};

export const postUnavailableEvent = async (
  payload: DiagnosticReportUnavailablePayload,
  config: DiagnosticReportConfig,
) => {
  const context = payload.context ? `\n[context]:\n${JSON.stringify(payload.context, null, 2)}` : "";
  const text: string = `${payload.message}${context}`;
  const params: DataDogEventCreateRequest = {
    title: payload.method,
    text: text,
    priority: DataDogEventPriority.NORMAL,
    tags: [
      "unavailable",
      ...((config.fid && [String(config.fid)]) || []),
      ...((config.peerId && [config.peerId]) || []),
    ],
  };

  return postDataDogEvent(params, config);
};
