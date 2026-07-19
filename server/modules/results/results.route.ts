import express from "express";
import {
  asyncHandler,
  sendValidationError,
} from "../../platform/http/http.js";
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
        activityInsightQuotaKey(req),
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

function activityInsightQuotaKey(req: express.Request): string {
  return `ip:${req.ip || req.socket.remoteAddress || "local"}`;
}

export default router;
