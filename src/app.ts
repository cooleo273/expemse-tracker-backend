import "dotenv/config";
import cors from "cors";
import express from "express";
import multer from "multer";
import * as mindee from "mindee";

const MINDEE_API_KEY = process.env.MINDEE_API_KEY;
const MINDEE_MODEL_ID = process.env.MINDEE_MODEL_ID;

if (!MINDEE_API_KEY || !MINDEE_MODEL_ID) {
  throw new Error("MINDEE_API_KEY and MINDEE_MODEL_ID must be set in the environment");
}

const mindeeClient = new mindee.ClientV2({ apiKey: MINDEE_API_KEY });

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const hasKey = <K extends string>(key: K, value: unknown): value is Record<K, unknown> => {
  return typeof value === "object" && value !== null && key in value;
};

const summarizeFieldValue = (field: unknown): unknown => {
  if (!field || typeof field !== "object") {
    return null;
  }

  if (hasKey("value", field)) {
    return field.value ?? null;
  }

  if (hasKey("items", field)) {
    const items = Array.isArray(field.items) ? field.items.length : 0;
    return `list(${items})`;
  }

  if (hasKey("fields", field)) {
    return "object";
  }

  return null;
};

const healthPaths: string[] = ["/health", "/api/health"];
app.head(healthPaths, (_req, res) => {
  res.status(204).end();
});
app.get(healthPaths, (_req, res) => {
  res.json({ status: "ok" });
});

const receiptPaths: string[] = ["/api/receipt/parse", "/receipt/parse"];
app.head(receiptPaths, (_req, res) => {
  res.status(204).end();
});
app.post(receiptPaths, upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Missing file upload named 'file'" });
  }

  const inferenceParams = {
    modelId: MINDEE_MODEL_ID,
  };

  try {
    const inputSource = new mindee.BufferInput({
      buffer: req.file.buffer,
      filename: req.file.originalname ?? "receipt.jpg",
    });

    const response = await mindeeClient.enqueueAndGetInference(
      inputSource,
      inferenceParams
    );

    const inferenceId = response.inference.id;
    const fields = response.inference.result.fields;
    const fieldKeys = Array.from(fields.keys());
    const fieldPreview = Object.fromEntries(
      fieldKeys.slice(0, 5).map((fieldName) => {
        return [fieldName, summarizeFieldValue(fields.get(fieldName))];
      })
    );

    console.info("[receipt.parse] Mindee response", {
      filename: req.file.originalname ?? "receipt.jpg",
      inferenceId,
      fieldKeys,
      fieldPreview,
    });

    res.json({
      inference: response.inference,
      fields,
    });
  } catch (error) {
    console.error("Mindee processing failed", error);
    res.status(502).json({ error: "Mindee processing failed" });
  }
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unexpected error", err);
  res.status(500).json({ error: "Unexpected server error" });
});

export default app;
