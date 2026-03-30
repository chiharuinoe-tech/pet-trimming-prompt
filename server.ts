import express, { Request, Response } from "express";
import cors from "cors";
import multer from "multer";
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";
import {
    generateGroomingPreview,
    type GroomingRequest
} from "./grooming-core.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT ?? 3001);
const PUBLIC_DIR = fs.existsSync(path.join(__dirname, "public"))
    ? path.join(__dirname, "public")
    : __dirname;
const OUTPUT_DIR = path.join(process.cwd(), "outputs");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

if (fs.existsSync(PUBLIC_DIR)) {
    app.use(express.static(PUBLIC_DIR));
}

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 15 * 1024 * 1024
    }
});

function parseRequestJson(raw: unknown): GroomingRequest {
    if (typeof raw !== "string") {
        throw new Error("requestJson が送信されていません。");
    }

    const parsed = JSON.parse(raw) as GroomingRequest;

    if (!parsed.breedPrimary) {
        parsed.breedPrimary = "未指定";
    }

    if (!Array.isArray(parsed.refAAdoptFeatures)) {
        parsed.refAAdoptFeatures = [];
    }

    if (!Array.isArray(parsed.refBAdoptFeatures)) {
        parsed.refBAdoptFeatures = [];
    }

    return parsed;
}

function getUploadedFile(
    files: Request["files"],
    fieldName: string
): Express.Multer.File {
    const typedFiles = files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const file = typedFiles?.[fieldName]?.[0];

    if (!file) {
        throw new Error(`${fieldName} が不足しています。`);
    }

    return file;
}

app.get("/health", (_req: Request, res: Response) => {
    res.json({
        ok: true,
        service: "grooming-preview-api"
    });
});

app.post(
    "/generate",
    upload.fields([
        { name: "beforeImage", maxCount: 1 },
        { name: "refImageA", maxCount: 1 },
        { name: "refImageB", maxCount: 1 }
    ]),
    async (req: Request, res: Response) => {
        try {
            const requestJson = parseRequestJson(req.body.requestJson);

            const beforeImage = getUploadedFile(req.files, "beforeImage");
            const refImageA = getUploadedFile(req.files, "refImageA");
            const refImageB = getUploadedFile(req.files, "refImageB");

            const result = await generateGroomingPreview({
                request: requestJson,
                beforeImage: {
                    buffer: beforeImage.buffer,
                    mimeType: beforeImage.mimetype,
                    originalName: beforeImage.originalname
                },
                refImageA: {
                    buffer: refImageA.buffer,
                    mimeType: refImageA.mimetype,
                    originalName: refImageA.originalname
                },
                refImageB: {
                    buffer: refImageB.buffer,
                    mimeType: refImageB.mimetype,
                    originalName: refImageB.originalname
                },
                saveDebugFiles: true,
                outputDir: OUTPUT_DIR
            });

            res.json({
                ok: true,
                imageBase64: result.imageBase64,
                inferred: result.inferred,
                planPack: result.planPack,
                review: result.review,
                selectedPlanId: result.selectedPlanId,
                selectedPlan: result.selectedPlan,
                postCheck: result.postCheck,
                prompt: result.prompt,
                debugId: result.debugId
            });
        } catch (error: any) {
            console.error("🔥 /generate error:", error);

            res.status(500).json({
                ok: false,
                error: error?.message || "不明なエラーが発生しました。"
            });
        }
    }
);

app.use((req: Request, res: Response) => {
    if (req.method === "GET" && fs.existsSync(path.join(PUBLIC_DIR, "index.html"))) {
        return res.sendFile(path.join(PUBLIC_DIR, "index.html"));
    }

    res.status(404).json({
        ok: false,
        error: "Not Found"
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Server started: http://localhost:${PORT}`);
    if (fs.existsSync(path.join(PUBLIC_DIR, "index.html"))) {
        console.log(`🌐 Frontend: http://localhost:${PORT}/index.html`);
    }
});