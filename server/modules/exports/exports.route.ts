import express from "express";
import { getDb } from "../../db/sqlite.js";
import { buildBackendMetadataExport } from "./export.service.js";
import { asyncHandler } from "../../platform/http/http.js";

const router = express.Router();

router.get(
  "/exports/backend-metadata",
  asyncHandler(async (_req, res) => {
    return res.json(await buildBackendMetadataExport(await getDb()));
  }),
);

export default router;
