import express from "express";
import { getDb } from "../db/sqlite.js";
import { buildBackendMetadataExport } from "../services/export.service.js";
import { asyncHandler } from "./http.js";

const router = express.Router();

router.get(
  "/exports/backend-metadata",
  asyncHandler(async (_req, res) => {
    return res.json(await buildBackendMetadataExport(await getDb()));
  }),
);

export default router;
