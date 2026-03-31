import { GoogleGenerativeAI } from "@google/generative-ai";
import * as fs from "fs";
import * as path from "path";
import 'dotenv/config';


const API_KEY = process.env.GEMINI_API_KEY;
const TEXT_MODEL_NAME = process.env.GEMINI_TEXT_MODEL ?? "gemini-3.1-flash-lite-preview";
const IMAGE_MODEL_NAME = process.env.GEMINI_IMAGE_MODEL ?? "gemini-3.1-flash-image-preview";
if (!API_KEY) {
    throw new Error("GEMINI_API_KEY を設定してください。");
}


const genAI = new GoogleGenerativeAI(API_KEY);


async function callAIWithRetry<T>(fn: () => Promise<T>, maxRetries = 3, delayMs = 1000): Promise<T> {
    let lastError: any;
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error: any) {
            lastError = error;
            const status = error?.status || error?.response?.status;
            if (status === 503 || status === 429) {
                console.warn(`⚠️ API 負荷エラー (${status})。リトライ ${i + 1}/${maxRetries} 回目...`);
                await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, i)));
                continue;
            }
            throw error;
        }
    }
    throw lastError;
}


// すべてのUI選択肢（クライアント側と一致させる）
export const UI_OPTIONS = {
    sizeClass: ["未指定", "超小型", "小型", "中型", "大型"] as const,
    ageStage: ["未指定", "子犬", "成犬", "シニア"] as const,
    coatLength: ["未指定", "短毛", "中毛", "長毛"] as const,
    coatVolume: ["未指定", "少なめ", "普通", "多め"] as const,
    coatTexture: ["未指定", "直毛", "ふんわり", "ウェーブ", "カーリー", "ダブルコート風"] as const,
    earType: ["未指定", "立ち耳", "垂れ耳", "半立ち耳", "大きめ立ち耳", "飾り毛あり"] as const,
    tailType: ["未指定", "自然", "ふさふさ", "巻き尾", "垂れ尾", "ポンポン向き"] as const,
    bodyBuild: ["未指定", "華奢", "標準", "がっしり"] as const,
    colorPattern: [
        "未指定",
        "単色",
        "白茶",
        "黒白",
        "白黒茶",
        "クリーム系",
        "グレー系",
        "まだら",
        "画像優先"
    ] as const,
    styleSourceType: ["catalog", "reference", "custom", "hybrid"] as const,
    editingMode: ["保守的", "標準", "積極的"] as const,
    conflictPolicyPreset: [
        "個体優先",
        "背景優先",
        "自然さ優先",
        "スタイル優先",
        "部位別バランス"
    ] as const,
    styleName: [
        "未指定",
        "テディベアカット",
        "柴犬カット",
        "サマーカット",
        "マッシュルームカット",
        "ライオンカット",
        "ピーナッツカット",
        "アフロカット",
        "アシメカット",
        "イヤリングカット",
        "自由オーダー"
    ] as const
};


// 型定義
export type SizeClass = (typeof UI_OPTIONS.sizeClass)[number];
export type AgeStage = (typeof UI_OPTIONS.ageStage)[number];
export type CoatLength = (typeof UI_OPTIONS.coatLength)[number];
export type CoatVolume = (typeof UI_OPTIONS.coatVolume)[number];
export type CoatTexture = (typeof UI_OPTIONS.coatTexture)[number];
export type EarType = (typeof UI_OPTIONS.earType)[number];
export type TailType = (typeof UI_OPTIONS.tailType)[number];
export type BodyBuild = (typeof UI_OPTIONS.bodyBuild)[number];
export type ColorPattern = (typeof UI_OPTIONS.colorPattern)[number];
export type StyleSourceType = (typeof UI_OPTIONS.styleSourceType)[number];
export type EditingMode = (typeof UI_OPTIONS.editingMode)[number];
export type ConflictPolicyPreset = (typeof UI_OPTIONS.conflictPolicyPreset)[number];
export type StyleName = (typeof UI_OPTIONS.styleName)[number];


export type GroomingRequest = {
    breedPrimary: string;
    breedSecondary?: string;

    sizeClass: SizeClass;
    ageStage: AgeStage;
    coatLength: CoatLength;
    coatVolume: CoatVolume;
    coatTexture: CoatTexture;
    earType: EarType;
    tailType: TailType;
    bodyBuild: BodyBuild;
    colorPattern: ColorPattern;

    colorNote?: string;
    distinctiveAnchorsNote?: string;

    styleName: StyleName;
    styleSourceType: StyleSourceType;

    customStyleNote?: string;
    specialConstraintsNote?: string;
    prohibitChangesNote?: string;

    refAAdoptNote?: string;
    refBAdoptNote?: string;

    editingMode: EditingMode;
    conflictPolicyPreset: ConflictPolicyPreset;
};
// すでに GroomingRequest などがある場所の直下に書く
export type CandidatePlan = {
    id: "safe" | "balanced" | "style_max";
    label: string;
    strategy_summary: string;
    immutable_anchors: string[];
    scene_locks: string[];
    editable_operations: {
        head: string[];
        ears: string[];
        body: string[];
        legs: string[];
        tail: string[];
    };
    ref_ignore: string[];
    conflict_rules: string[];
    failure_prevention: string[];
    plan_risk_summary: string;
    final_prompt_summary: string;
};

export type CandidatePlanPack = {
    plans: CandidatePlan[];
};
export type PostCheck = {
    identity_score: number;
    background_score: number;
    pose_score: number;
    style_score: number;
    photorealism_score: number;
    notes?: string;
};

export type PlanReview = {
    selected_plan_id: CandidatePlan["id"];
    reason: string;
};

export type GeneratePreviewResult = {
    results: {
        imageBase64: string;
        postCheck: PostCheck;
        debugId: string;
    }[];
    inferred: InferredProfile;
    planPack: CandidatePlanPack;
    selectedPlanId: CandidatePlan["id"];
    selectedPlan: CandidatePlan;
    prompt: string;
};

export type UploadedImage = {
    buffer: Buffer;
    mimeType?: string;
    originalName?: string;
};

export type GeneratePreviewInput = {
    request: GroomingRequest;
    beforeImage: UploadedImage;
    refImageA: UploadedImage;
    refImageB: UploadedImage;
    saveDebugFiles?: boolean;
    outputDir?: string;
};


// Gemini 画像パート型
type InlineImagePart = {
    inlineData: {
        mimeType: string;
        data: string;
    };
};


// スタイル定義
type StylePreset = {
    label: string;
    summary: string;
    head: string;
    body: string;
    legs: string;
    ears: string;
    tail: string;
    muzzle: string;
    notes: string;
};


export const STYLE_PRESETS: Record<string, StylePreset> = {
    "テディベアカット": {
        label: "テディベアカット",
        summary: "顔まわりを丸くやわらかく見せる、かわいらしい定番スタイル。",
        head: "頭部は丸みを重視し、全体としてぬいぐるみのようなやさしいシルエットに寄せる。",
        body: "胴体は整って見える長さにそろえ、顔の丸みが主役になるようにする。",
        legs: "脚は太すぎず、適度なボリュームを残して自然に整える。",
        ears: "耳は短めまたは輪郭が丸く見えるように整理する。",
        tail: "尾は自然な印象を保ちながら清潔に整える。",
        muzzle: "マズルはふっくらとした楕円感を残す。",
        notes: "過度に短くしすぎず、表情のやわらかさを優先する。"
    },
    "柴犬カット": {
        label: "柴犬カット",
        summary: "顔まわりをコンパクトに、全身を短めで軽快に見せるスタイル。",
        head: "顔まわりをすっきり円形に近づけ、頬を整えてコンパクトに見せる。",
        body: "胴体は短めで均一感のある長さにそろえ、軽快に見せる。",
        legs: "脚はすっきり整え、全身の短さと自然につなぐ。",
        ears: "耳の存在感が見えるようにし、耳自体の構造は変えない。",
        tail: "尾は元の形を活かしつつバランス良く整理する。",
        muzzle: "マズルは清潔感を持たせつつ個体の顔立ちは変えない。",
        notes: "元の犬種の耳や毛質と衝突する場合は、輪郭だけ寄せて個体性を優先する。"
    },
    "サマーカット": {
        label: "サマーカット",
        summary: "全身を短めにし、軽く涼しげに見せるスタイル。",
        head: "顔まわりは清潔感を出しつつ、表情がきつくならない程度に短めに整える。",
        body: "胴体はベリーショート寄りに見せるが、不自然に地肌が出ないようにする。",
        legs: "脚も短めにして全体の一体感を出す。",
        ears: "耳の形が分かるように耳まわりを整理する。",
        tail: "尾は先端やバランスを少し残して自然に見せる。",
        muzzle: "マズルは清潔感重視。",
        notes: "短く見せるが、骨格や個体性を壊さない。"
    },
    "未指定": {
        label: "未指定",
        summary: "自然で清潔感のあるトリミングを目指す。",
        head: "頭部は清潔感を保ちつつ個体の表情を自然に見せる。",
        body: "胴体は自然な長さで整える。",
        legs: "脚は全体バランス優先で整える。",
        ears: "耳は自然な構造を維持する。",
        tail: "尾は元の印象を保ちながら整理する。",
        muzzle: "マズルは清潔感を出しつつ削りすぎない。",
        notes: "個体性優先。"
    }
};


function getStylePreset(styleName: StyleName): StylePreset {
    return STYLE_PRESETS[styleName] ?? STYLE_PRESETS["未指定"];
}


// ディレクトリ作成
function ensureDir(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}


// ファイル名安全化
function sanitizeFileName(name: string): string {
    return name.replace(/[\\/:*?"<>|]/g, "_").trim();
}


// 画像とJSONの保存
function saveBase64Image(base64: string, outputPath: string) {
    fs.writeFileSync(outputPath, Buffer.from(base64, "base64"));
}


function saveJson(data: unknown, outputPath: string) {
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), "utf-8");
}


// Buffer → Gemini InlineImagePart
function bufferToInlineImagePart(buffer: Buffer, mimeType = "image/png"): InlineImagePart {
    return {
        inlineData: {
            mimeType,
            data: buffer.toString("base64")
        }
    };
}


// 画像生成結果から base64 を抽出
function extractImageBase64(response: any): string {
    let generatedBase64 = "";

    response?.candidates?.[0]?.content?.parts?.forEach((part: any) => {
        if (part?.inlineData?.data) generatedBase64 = part.inlineData.data;
        else if (part?.data) generatedBase64 = part.data;
        else if (part?.image?.data) generatedBase64 = part.image.data;
    });

    if (!generatedBase64) {
        generatedBase64 = response?.image?.data || response?.data || "";
    }

    return generatedBase64;
}


// テキストレスポンスからテキスト抽出
async function extractText(response: any): Promise<string> {
    try {
        const text = await response.text();
        if (text) return text;
    } catch {
        // noop
    }

    const parts = response?.candidates?.[0]?.content?.parts ?? [];
    return parts
        .map((part: any) => part?.text ?? "")
        .filter(Boolean)
        .join("\n")
        .trim();
}


// JSON 解析（fallback付き）
function parseJsonFromText<T>(rawText: string, fallback: T): T {
    try {
        const cleaned = rawText
            .replace(/^```json/i, "")
            .replace(/^```/i, "")
            .replace(/```$/i, "")
            .trim();

        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        const jsonText = jsonMatch ? jsonMatch[0] : cleaned;

        return JSON.parse(jsonText) as T;
    } catch {
        console.warn("⚠️ JSON解析に失敗したため fallback を使用します。");
        console.warn(rawText);
        return fallback;
    }
}


// スコアを  に丸める[11][12]
function clampScore(score: number): number {
    if (Number.isNaN(score)) return 1;
    return Math.max(1, Math.min(5, Math.round(score)));
}


// JSON スキーマ：分析結果
export type InferredProfile = {
    visible_identity_anchors: string[];
    visible_color_markings: string[];
    visible_anatomy_notes: string[];
    scene_locks: string[];
    likely_edit_risks: string[];
    summary: string;
};


// トリマー分析用プロンプト（1人目）
function buildInferencePrompt(req: GroomingRequest, preset: StylePreset): string {
    const opts = JSON.stringify(UI_OPTIONS, null, 2);
    return `
あなたは、ドッグトリマーと犬種鑑定士です。
Before 画像（1枚目）だけを見ます。

目的:
- 1枚目の犬の個体性・毛色・構図・背景・カメラ角度・ポーズを、変更してはいけない箇所として抽出します
- どこを変えてよく、どこを絶対に変えてはいけないかを明確にします

UI選択肢:
${opts}

出力ルール:
- 画像に写っていないことは断定しない
- 不明な場合は保守的に書く
- JSONのみを返す。コードブロックは不要

出力形式:
{
  "visible_identity_anchors": ["顔の鼻・口の位置", "耳の位置と形", ...],
  "visible_color_markings": ["胸の白い班", "右耳の斑点", ...],
  "visible_anatomy_notes": ["体の厚さ", "顔の輪郭", ...],
  "scene_locks": ["背景", "構図", "カメラ角度", "光", "ポーズ"],
  "likely_edit_risks": ["変更すると別犬に見える部分", "変更すると表情が変わる部分"],
  "summary": "全体の要約（1～3行）"
}
`.trim();
}


// トリマー分析結果を取得（1人目）
async function inferProfile(
    textModel: any,
    req: GroomingRequest,
    preset: StylePreset,
    beforePart: InlineImagePart
): Promise<InferredProfile> {
    const fallback: InferredProfile = {
        visible_identity_anchors: [
            "1枚目の犬の顔の輪郭",
            "耳の位置と形",
            "体の厚さ",
            "目鼻の位置"
        ],
        visible_color_markings: ["毛色と模様のパターンを保つ"],
        visible_anatomy_notes: ["耳の付け根と頭のつながり"],
        scene_locks: ["背景", "構図", "カメラ角度", "光", "ポーズ"],
        likely_edit_risks: [],
        summary: "保守的なデフォルト分析"
    };

    const prompt = buildInferencePrompt(req, preset);
    const result = await callAIWithRetry(() =>
        textModel.generateContent([prompt, beforePart])
    );
    const response = await (result as any).response;
    const text = await extractText(response);
    return parseJsonFromText<InferredProfile>(text, fallback);
}


// 分析用 Dog 画像解析（beedPrimary など、AI から自動推定）
export type DogAnalysisResult = {
    breedPrimary: string;
    breedSecondary: string;
    sizeClass: SizeClass;
    ageStage: AgeStage;
    coatLength: CoatLength;
    coatVolume: CoatVolume;
    coatTexture: CoatTexture;
    earType: EarType;
    tailType: TailType;
    bodyBuild: BodyBuild;
    colorPattern: ColorPattern;
    styleName: StyleName;
    colorNote: string;
    distinctiveAnchorsNote: string;
};


function buildDogAnalysisPrompt(): string {
    const opts = JSON.stringify(UI_OPTIONS, null, 2);
    return `
あなたは、プロのドッグトリマー兼犬種鑑定士です。
Before 画像をもとに、この犬の情報を推定してください。

UI選択肢:
${opts}

分析ルール:
1. 各項目は、UIオプションと完全に一致する文字列を選ぶ
2. 犬種は日本語で最も一般的な名称を使う
3. styleName は、その犬種・毛質に似合いそうな最も一般的なスタイル1つを選ぶ
4. colorNote, distinctiveAnchorsNote は、画像から見える特徴（例：胸の白い斑点、左耳の茶色など）を簡潔に書く
5. JSONのみを返す

出力形式:
{
  "breedPrimary": "...",
  "breedSecondary": "...",
  "sizeClass": "...",
  "ageStage": "...",
  "coatLength": "...",
  "coatVolume": "...",
  "coatTexture": "...",
  "earType": "...",
  "tailType": "...",
  "bodyBuild": "...",
  "colorPattern": "...",
  "styleName": "...",
  "colorNote": "...",
  "distinctiveAnchorsNote": "..."
}
`.trim();
}
// 候補計画生成
async function generateCandidatePlans(
    textModel: any,
    req: GroomingRequest,
    preset: StylePreset,
    inferred: InferredProfile,
    beforePart: InlineImagePart,
    refPartA: InlineImagePart,
    refPartB: InlineImagePart
): Promise<CandidatePlanPack> {
    const fallback: CandidatePlanPack = {
        plans: [
            {
                id: "balanced",
                label: "バランス",
                strategy_summary: "個体性とスタイルのバランスを取る。",
                immutable_anchors: inferred.visible_identity_anchors,
                scene_locks: inferred.scene_locks,
                editable_operations: { head: [], ears: [], body: [], legs: [], tail: [] },
                ref_ignore: [],
                conflict_rules: [],
                failure_prevention: [],
                plan_risk_summary: "低リスク",
                final_prompt_summary: preset.summary
            }
        ]
    };

    const prompt = `
あなたはドッグトリマーです。以下の情報をもとに、3つの候補計画（safe/balanced/style_max）をJSONで返してください。
犬種: ${req.breedPrimary}、スタイル: ${req.styleName}
個体アンカー: ${inferred.visible_identity_anchors.join(", ")}
JSONのみを返す。
出力形式: { "plans": [ { "id": "safe"|"balanced"|"style_max", "label": "...", "strategy_summary": "...", "immutable_anchors": [], "scene_locks": [], "editable_operations": { "head": [], "ears": [], "body": [], "legs": [], "tail": [] }, "ref_ignore": [], "conflict_rules": [], "failure_prevention": [], "plan_risk_summary": "...", "final_prompt_summary": "..." } ] }
`.trim();

    const result = await callAIWithRetry(() =>
        textModel.generateContent([prompt, beforePart, refPartA, refPartB])
    );
    const response = await (result as any).response;
    const text = await extractText(response);
    return parseJsonFromText<CandidatePlanPack>(text, fallback);
}


// 計画レビュー
async function reviewPlans(
    textModel: any,
    req: GroomingRequest,
    inferred: InferredProfile,
    planPack: CandidatePlanPack,
    beforePart: InlineImagePart,
    refPartA: InlineImagePart,
    refPartB: InlineImagePart
): Promise<PlanReview> {
    const fallback: PlanReview = {
        selected_plan_id: "balanced",
        reason: "デフォルト選択"
    };

    const prompt = `
あなたはドッグトリマーです。以下の候補計画から最適な1つを選んでください。
計画: ${JSON.stringify(planPack.plans.map((p: CandidatePlan) => ({ id: p.id, label: p.label, strategy_summary: p.strategy_summary })))}
JSONのみを返す。
出力形式: { "selected_plan_id": "safe"|"balanced"|"style_max", "reason": "..." }
`.trim();

    const result = await callAIWithRetry(() =>
        textModel.generateContent([prompt, beforePart, refPartA, refPartB])
    );
    const response = await (result as any).response;
    const text = await extractText(response);
    return parseJsonFromText<PlanReview>(text, fallback);
}


// 画像生成プロンプト構築
function buildImagePrompt(
    req: GroomingRequest,
    inferred: InferredProfile,
    plan: CandidatePlan,
    review: PlanReview
): string {
    const preset = getStylePreset(req.styleName);
    return [
        `犬種: ${req.breedPrimary}${req.breedSecondary ? `（${req.breedSecondary}）` : ""}`,
        `スタイル: ${req.styleName} — ${preset.summary}`,
        `頭部: ${preset.head}`,
        `胴体: ${preset.body}`,
        `脚: ${preset.legs}`,
        `耳: ${preset.ears}`,
        `尾: ${preset.tail}`,
        `マズル: ${preset.muzzle}`,
        `注意: ${preset.notes}`,
        `個体アンカー（変更禁止）: ${inferred.visible_identity_anchors.join(", ")}`,
        `毛色マーキング（変更禁止）: ${inferred.visible_color_markings.join(", ")}`,
        `シーンロック: ${inferred.scene_locks.join(", ")}`,
        `採用計画: ${plan.label} — ${plan.strategy_summary}`,
        req.customStyleNote ? `スタイル補足: ${req.customStyleNote}` : "",
        req.specialConstraintsNote ? `制約: ${req.specialConstraintsNote}` : "",
        req.prohibitChangesNote ? `変更禁止: ${req.prohibitChangesNote}` : "",
        req.refAAdoptNote ? `参考A採用方針: ${req.refAAdoptNote}` : "",
        req.refBAdoptNote ? `参考B採用方針: ${req.refBAdoptNote}` : "",
    ].filter(Boolean).join("\n");
}


// 画像生成
async function generateImage(
    imageModel: any,
    prompt: string,
    beforePart: InlineImagePart,
    refPartA: InlineImagePart,
    refPartB: InlineImagePart
): Promise<string> {
    const result = await callAIWithRetry(() =>
        imageModel.generateContent([
            prompt,
            beforePart,
            refPartA,
            refPartB
        ])
    );
    const response = await (result as any).response;
    return extractImageBase64(response);
}


// 事後チェック
async function postCheck(
    textModel: any,
    beforePart: InlineImagePart,
    refPartA: InlineImagePart,
    refPartB: InlineImagePart,
    afterPart: InlineImagePart
): Promise<PostCheck> {
    const fallback: PostCheck = {
        identity_score: 3,
        background_score: 3,
        pose_score: 3,
        style_score: 3,
        photorealism_score: 3,
        notes: "自動評価失敗のためデフォルト値"
    };

    const prompt = `
あなたはドッグトリマーです。Before画像（1枚目）とAfter画像（4枚目）を比較し、以下の観点で1〜5点で評価してください。
- identity_score: 個体の同一性（顔・毛色・特徴が保たれているか）
- background_score: 背景の一致度
- pose_score: ポーズ・構図の一致度
- style_score: 指定スタイルの再現度
- photorealism_score: 写真としての自然さ
JSONのみを返す。
出力形式: { "identity_score": 1-5, "background_score": 1-5, "pose_score": 1-5, "style_score": 1-5, "photorealism_score": 1-5, "notes": "..." }
`.trim();

    const result = await callAIWithRetry(() =>
        textModel.generateContent([prompt, beforePart, refPartA, refPartB, afterPart])
    );
    const response = await (result as any).response;
    const text = await extractText(response);
    const parsed = parseJsonFromText<PostCheck>(text, fallback);
    return {
        identity_score: clampScore(parsed.identity_score),
        background_score: clampScore(parsed.background_score),
        pose_score: clampScore(parsed.pose_score),
        style_score: clampScore(parsed.style_score),
        photorealism_score: clampScore(parsed.photorealism_score),
        notes: parsed.notes
    };
}


export async function analyzeDogImage(beforeImage: UploadedImage): Promise<DogAnalysisResult> {
    const textModel = genAI.getGenerativeModel({ model: TEXT_MODEL_NAME });
    const beforePart = bufferToInlineImagePart(beforeImage.buffer, beforeImage.mimeType || "image/png");

    const fallback: DogAnalysisResult = {
        breedPrimary: "未指定",
        breedSecondary: "なし",
        sizeClass: "小型",
        ageStage: "未指定",
        coatLength: "中毛",
        coatVolume: "普通",
        coatTexture: "直毛",
        earType: "未指定",
        tailType: "未指定",
        bodyBuild: "標準",
        colorPattern: "単色",
        styleName: "未指定",
        colorNote: "",
        distinctiveAnchorsNote: ""
    };

    const prompt = buildDogAnalysisPrompt();
    const result = await callAIWithRetry(() => textModel.generateContent([prompt, beforePart]));
    const response = await (result as any).response;
    const text = await extractText(response);
    return parseJsonFromText<DogAnalysisResult>(text, fallback);
}
export async function generateGroomingPreview(input: GeneratePreviewInput): Promise<GeneratePreviewResult> {
    const { request, beforeImage, refImageA, refImageB, saveDebugFiles = true } = input;

    const preset = getStylePreset(request.styleName);

    const beforePart = bufferToInlineImagePart(beforeImage.buffer, beforeImage.mimeType || "image/png");
    const refPartA = bufferToInlineImagePart(refImageA.buffer, refImageA.mimeType || "image/png");
    const refPartB = bufferToInlineImagePart(refImageB.buffer, refImageB.mimeType || "image/png");

    const textModel = genAI.getGenerativeModel({ model: TEXT_MODEL_NAME });
    const imageModel = genAI.getGenerativeModel({ model: IMAGE_MODEL_NAME });

    const debugId = `${Date.now()}_${sanitizeFileName(request.breedPrimary || "dog")}_${sanitizeFileName(request.styleName || "style")}`;

    const outputDir =
        input.outputDir ||
        path.join(process.cwd(), "outputs");

    if (saveDebugFiles) {
        ensureDir(outputDir);
    }

    const inferred = await inferProfile(textModel, request, preset, beforePart);
    const planPack = await generateCandidatePlans(textModel, request, preset, inferred, beforePart, refPartA, refPartB);
    const review = await reviewPlans(textModel, request, inferred, planPack, beforePart, refPartA, refPartB);

    const selectedPlan: CandidatePlan | undefined =
        planPack.plans.find((p) => p.id === review.selected_plan_id) ||
        planPack.plans.find((p) => p.id === "balanced") ||
        planPack.plans[0];

    if (!selectedPlan) {
        throw new Error("採用計画が見つかりませんでした。");
    }

    const prompt = buildImagePrompt(request, inferred, selectedPlan, review);
    const imageBase64 = await generateImage(imageModel, prompt, beforePart, refPartA, refPartB);
    const afterPart = bufferToInlineImagePart(Buffer.from(imageBase64, "base64"), "image/png");
    const check = await postCheck(textModel, beforePart, refPartA, refPartB, afterPart);

    if (saveDebugFiles) {
        saveJson(request, path.join(outputDir, `${debugId}_request.json`));
        saveJson(inferred, path.join(outputDir, `${debugId}_inferred.json`));
        saveJson(planPack, path.join(outputDir, `${debugId}_plans.json`));
        saveJson(review, path.join(outputDir, `${debugId}_review.json`));
        saveJson(check, path.join(outputDir, `${debugId}_postcheck.json`));
        fs.writeFileSync(path.join(outputDir, `${debugId}_prompt.txt`), prompt, "utf-8");
        saveBase64Image(imageBase64, path.join(outputDir, `${debugId}.png`));
    }

    return {
        results: [
            {
                imageBase64,
                postCheck: check,
                debugId
            }
        ],
        inferred,
        planPack,
        selectedPlanId: selectedPlan.id,
        selectedPlan,
        prompt
    };
}