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

const healthPaths: string[] = ["/health", "/api/health"];
app.get(healthPaths, (_req, res) => {
  res.json({ status: "ok" });
});

const receiptPaths: string[] = ["/api/receipt/parse", "/receipt/parse"];
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

    res.json({
      inference: response.inference,
      fields: response.inference.result.fields ?? {},
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
