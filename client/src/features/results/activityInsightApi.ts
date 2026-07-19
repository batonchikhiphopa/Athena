import type {
  ActivityInsightsRequest,
  ActivityInsightsResponse,
} from "../../shared/contracts";
import {
  createApiHttpError,
  jsonHeaders,
} from "../../shared/http/httpClient";

export async function generateActivityInsights(
  payload: ActivityInsightsRequest,
  signal?: AbortSignal,
) {
  const response = await fetch("/results/activity-insights", {
    body: JSON.stringify(payload),
    credentials: "same-origin",
    headers: jsonHeaders(),
    method: "POST",
    signal,
  });
  if (!response.ok) {
    throw await createApiHttpError(
      response,
      "Не удалось обновить выводы по занятиям",
    );
  }

  return (await response.json()) as ActivityInsightsResponse;
}
