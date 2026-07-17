import express from "express";
import {
  asyncHandler,
  sendValidationError,
} from "../../platform/http/http.js";
import type { AuthenticatedSession } from "../auth/auth.service.js";
import { activityInsightsRequestSchema } from "./activityInsights.schema.js";
import {
  ActivityInsightsProviderError,
  generateActivityInsights,
} from "./activityInsights.service.js";

const router = express.Router();

router.post(
  "/results/activity-insights",
  asyncHandler(async (req, res) => {
    const parsed = activityInsightsRequestSchema.safeParse(req.body);

    if (!parsed.success) {
      return sendValidationError(
        res,
        "Invalid activity insight request",
        parsed.error,
      );
    }

    try {
      const result = await generateActivityInsights(
        parsed.data,
        activityInsightQuotaKey(req, res),
      );
      return res.json(result);
    } catch (error) {
      if (error instanceof ActivityInsightsProviderError) {
        return res.status(error.httpStatus).json({ error: error.code });
      }

      throw error;
    }
  }),
);

function activityInsightQuotaKey(
  req: express.Request,
  res: express.Response,
): string {
  const auth = res.locals.auth as AuthenticatedSession | undefined;
  if (auth) return `user:${auth.user.id}`;

  return `ip:${req.ip || req.socket.remoteAddress || "local"}`;
}

export default router;
