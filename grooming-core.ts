import { GoogleGenerativeAI } from "@google/generative-ai";
import * as fs from "fs";
import * as path from "path";

const API_KEY = process.env.GEMINI_API_KEY ?? "";
const TEXT_MODEL_NAME = process.env.GEMINI_TEXT_MODEL ?? "gemini-3.1-flash-lite-preview";
const IMAGE_MODEL_NAME = process.env.GEMINI_IMAGE_MODEL ?? "gemini-3.1-flash-image-preview";

if (!API_KEY) {
    throw new Error("GEMINI_API_KEY が未設定です。");
}

const genAI = new GoogleGenerativeAI(API_KEY);

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
    styleStrength: ["弱", "中", "強"] as const,
    lockLevel: ["低", "中", "高", "最高"] as const,
    editingMode: ["保守的", "標準", "積極的"] as const,
    conflictPolicyPreset: [
        "個体優先",
        "背景優先",
        "自然さ優先",
        "スタイル優先",
        "部位別バランス"
    ] as const,
    localEditBias: ["低", "中", "高"] as const,
    styleSafetyBias: ["自然さ優先", "均衡", "スタイル再現優先"] as const,
    failurePreventionFocus: [
        "別犬化防止",
        "背景改変防止",
        "参考犬化防止",
        "耳変形防止",
        "CG感防止"
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
    ] as const,
    refFeatureOption: [
        "頭頂の丸み",
        "頬の締まり",
        "顔の外周ライン",
        "耳まわりの見せ方",
        "マズルのふくらみ",
        "胴体の短さ",
        "胴体の均一感",
        "脚のすっきり感",
        "脚のボリューム感",
        "尾の仕上がり",
        "首胸の残し方"
    ] as const
};

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
export type StyleStrength = (typeof UI_OPTIONS.styleStrength)[number];
export type LockLevel = (typeof UI_OPTIONS.lockLevel)[number];
export type EditingMode = (typeof UI_OPTIONS.editingMode)[number];
export type ConflictPolicyPreset = (typeof UI_OPTIONS.conflictPolicyPreset)[number];
export type LocalEditBias = (typeof UI_OPTIONS.localEditBias)[number];
export type StyleSafetyBias = (typeof UI_OPTIONS.styleSafetyBias)[number];
export type FailurePreventionFocus = (typeof UI_OPTIONS.failurePreventionFocus)[number];
export type StyleName = (typeof UI_OPTIONS.styleName)[number];
export type RefFeatureOption = (typeof UI_OPTIONS.refFeatureOption)[number];

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

    styleStrengthOverall: StyleStrength;
    headStyleStrength: StyleStrength;
    bodyStyleStrength: StyleStrength;
    legStyleStrength: StyleStrength;
    earStyleStrength: StyleStrength;
    tailStyleStrength: StyleStrength;

    customStyleNote?: string;
    specialConstraintsNote?: string;
    prohibitChangesNote?: string;

    refAAdoptFeatures: RefFeatureOption[];
    refBAdoptFeatures: RefFeatureOption[];
    refAAdoptNote?: string;
    refBAdoptNote?: string;

    identityPreservationLevel: LockLevel;
    backgroundLock: LockLevel;
    poseLock: LockLevel;
    cameraLock: LockLevel;
    colorLock: LockLevel;
    anatomyLock: LockLevel;
    realismLevel: LockLevel;

    editingMode: EditingMode;
    conflictPolicyPreset: ConflictPolicyPreset;
    localEditBias: LocalEditBias;
    styleSafetyBias: StyleSafetyBias;
    failurePreventionFocus: FailurePreventionFocus;
};

export type UploadedImage = {
    buffer: Buffer;
    mimeType?: string;
    originalName?: string;
};

type InlineImagePart = {
    inlineData: {
        mimeType: string;
        data: string;
    };
};

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

export type InferredProfile = {
    visible_identity_anchors: string[];
    visible_color_markings: string[];
    visible_anatomy_notes: string[];
    scene_locks: string[];
    likely_edit_risks: string[];
    recommended_region_intensity: {
        head: StyleStrength;
        body: StyleStrength;
        legs: StyleStrength;
        ears: StyleStrength;
        tail: StyleStrength;
    };
    summary: string;
};

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
    ref_adoption: {
        refA: string[];
        refB: string[];
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

export type PlanReview = {
    selected_plan_id: "safe" | "balanced" | "style_max";
    reason: string;
    reinforce_points: string[];
    final_risk_checks: string[];
    final_revision_directive: string;
};

export type PostCheck = {
    identity_score: number;
    background_score: number;
    pose_score: number;
    style_score: number;
    photorealism_score: number;
    issues: string[];
};

export type GeneratePreviewInput = {
    request: GroomingRequest;
    beforeImage: UploadedImage;
    refImageA: UploadedImage;
    refImageB: UploadedImage;
    saveDebugFiles?: boolean;
    outputDir?: string;
};

export type GeneratePreviewResult = {
    imageBase64: string;
    inferred: InferredProfile;
    planPack: CandidatePlanPack;
    review: PlanReview;
    selectedPlanId: CandidatePlan["id"];
    selectedPlan: CandidatePlan;
    postCheck: PostCheck;
    prompt: string;
    debugId: string;
};

const STYLE_PRESETS: Record<string, StylePreset> = {
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
    "マッシュルームカット": {
        label: "マッシュルームカット",
        summary: "頭頂から耳にかけて丸くつながるシルエットを作る。",
        head: "頭頂から耳にかけてなめらかに丸くつなげる。",
        body: "頭部のボリュームを引き立てる程度に自然に整える。",
        legs: "脚はやや整え、頭部とのバランスを取る。",
        ears: "耳と頭部の境界を強く分断しすぎない。",
        tail: "尾は自然に整理する。",
        muzzle: "マズルは顔全体の丸みに調和させる。",
        notes: "頭部の一体感を重視する。"
    },
    "ライオンカット": {
        label: "ライオンカット",
        summary: "首胸を残し、胴体を短くしてコントラストを出す。",
        head: "顔は整えつつ、首胸とのつながりでたてがみ感を表現する。",
        body: "胴体は短くし、首胸との長短差を出す。",
        legs: "脚は胴体と自然につながる短さで整える。",
        ears: "耳は自然な構造を優先する。",
        tail: "尾先にやや残しを作る方向で整える。",
        muzzle: "マズルは自然な輪郭を保つ。",
        notes: "極端で不自然な段差は避ける。"
    },
    "ピーナッツカット": {
        label: "ピーナッツカット",
        summary: "頬を締め、頭部とマズルにボリュームを残す。",
        head: "頭部にボリュームを残し、頬にくびれを作る。",
        body: "胴体は顔のデザイン性を邪魔しない長さに整える。",
        legs: "脚はすっきり整える。",
        ears: "耳は頭部との調和を重視する。",
        tail: "尾は自然に整理する。",
        muzzle: "マズルに丸みと存在感を持たせる。",
        notes: "正面から見たときのくびれ感を重視。"
    },
    "アフロカット": {
        label: "アフロカット",
        summary: "頭部に大きな球体感を持たせる。",
        head: "頭部を大きな球体状に見せる。",
        body: "頭部を引き立てるため、胴体は過度に重くしない。",
        legs: "脚は自然に整える。",
        ears: "耳は可能な範囲で被毛に溶け込ませる。",
        tail: "尾は元の印象を保ちながら整理する。",
        muzzle: "マズルは頭部の丸さに自然につなげる。",
        notes: "元の毛量や犬種との整合性を優先。"
    },
    "アシメカット": {
        label: "アシメカット",
        summary: "左右差をデザインとして持たせる。",
        head: "顔まわりに左右差を作るが、表情や視認性は維持する。",
        body: "胴体は基本的に自然に整える。",
        legs: "脚は自然に整える。",
        ears: "耳まわりに左右差を作る場合も付け根位置は維持する。",
        tail: "尾は全体バランスに合わせる。",
        muzzle: "マズルは清潔に整える。",
        notes: "やりすぎて不自然な変形にしない。"
    },
    "イヤリングカット": {
        label: "イヤリングカット",
        summary: "耳まわりをイヤリングのように見せる。",
        head: "顔まわりはすっきりさせ、耳まわりを引き立てる。",
        body: "胴体はモード感を邪魔しない長さに整える。",
        legs: "脚はすっきりめに整える。",
        ears: "耳の毛先をイヤリングのように見せる。",
        tail: "尾は上品に整理する。",
        muzzle: "頬はタイトにして耳との対比を出す。",
        notes: "耳の見せ方が主役。"
    },
    "自由オーダー": {
        label: "自由オーダー",
        summary: "自由入力を軸に個体性と自然さを優先して構成する。",
        head: "頭部は個体の表情が自然に見える範囲で調整する。",
        body: "胴体は犬の体格に合わせて自然に整える。",
        legs: "脚は全体バランス優先で整える。",
        ears: "耳は自然な構造を保ちながら整理する。",
        tail: "尾は元の印象を保ちながら整える。",
        muzzle: "マズルは削りすぎず自然な印象を保つ。",
        notes: "自由入力を優先。ただし不自然な変形は避ける。"
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

function ensureDir(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

function sanitizeFileName(name: string): string {
    return name.replace(/[\\/:*?"<>|]/g, "_").trim();
}

function saveBase64Image(base64: string, outputPath: string) {
    fs.writeFileSync(outputPath, Buffer.from(base64, "base64"));
}

function saveJson(data: unknown, outputPath: string) {
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), "utf-8");
}

function bufferToInlineImagePart(buffer: Buffer, mimeType = "image/png"): InlineImagePart {
    return {
        inlineData: {
            mimeType,
            data: buffer.toString("base64")
        }
    };
}

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

function parseJsonFromText<T>(rawText: string, fallback: T): T {
    try {
        const cleaned = rawText
            .replace(/^```json/i, "")
            .replace(/^```/i, "")
            .replace(/```$/i, "")
            .trim();

        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        const jsonText = jsonMatch ? jsonMatch : cleaned;

        return JSON.parse(jsonText) as T;
    } catch {
        console.warn("⚠️ JSON解析に失敗したため fallback を使用します。");
        console.warn(rawText);
        return fallback;
    }
}

function clampScore(score: number): number {
    if (Number.isNaN(score)) return 1;
    return Math.max(1, Math.min(5, Math.round(score)));
}

function getStylePreset(styleName: StyleName): StylePreset {
    return STYLE_PRESETS[styleName] ?? STYLE_PRESETS["未指定"];
}

function buildRequestSummary(req: GroomingRequest, preset: StylePreset): string {
    return [
        `主犬種: ${req.breedPrimary || "未指定"}`,
        `副犬種: ${req.breedSecondary || "なし"}`,
        `サイズ: ${req.sizeClass}`,
        `年齢区分: ${req.ageStage}`,
        `毛の長さ: ${req.coatLength}`,
        `毛量: ${req.coatVolume}`,
        `毛質: ${req.coatTexture}`,
        `耳タイプ: ${req.earType}`,
        `尾タイプ: ${req.tailType}`,
        `体格: ${req.bodyBuild}`,
        `毛色パターン: ${req.colorPattern}`,
        `毛色補足: ${req.colorNote || "なし"}`,
        `個体アンカー補足: ${req.distinctiveAnchorsNote || "なし"}`,
        `スタイル名: ${req.styleName}`,
        `スタイルソース: ${req.styleSourceType}`,
        `スタイル概要: ${preset.summary}`,
        `全体強度: ${req.styleStrengthOverall}`,
        `頭部強度: ${req.headStyleStrength}`,
        `胴体強度: ${req.bodyStyleStrength}`,
        `脚強度: ${req.legStyleStrength}`,
        `耳強度: ${req.earStyleStrength}`,
        `尾強度: ${req.tailStyleStrength}`,
        `追加スタイル補足: ${req.customStyleNote || "なし"}`,
        `制約補足: ${req.specialConstraintsNote || "なし"}`,
        `変更禁止補足: ${req.prohibitChangesNote || "なし"}`,
        `参考Aで採用したい要素: ${req.refAAdoptFeatures.join("、") || "なし"}`,
        `参考Bで採用したい要素: ${req.refBAdoptFeatures.join("、") || "なし"}`,
        `参考A補足: ${req.refAAdoptNote || "なし"}`,
        `参考B補足: ${req.refBAdoptNote || "なし"}`,
        `個体保持レベル: ${req.identityPreservationLevel}`,
        `背景固定レベル: ${req.backgroundLock}`,
        `ポーズ固定レベル: ${req.poseLock}`,
        `カメラ固定レベル: ${req.cameraLock}`,
        `毛色固定レベル: ${req.colorLock}`,
        `骨格固定レベル: ${req.anatomyLock}`,
        `写実性要求レベル: ${req.realismLevel}`,
        `編集モード: ${req.editingMode}`,
        `衝突方針: ${req.conflictPolicyPreset}`,
        `局所編集バイアス: ${req.localEditBias}`,
        `安全性バイアス: ${req.styleSafetyBias}`,
        `失敗予防フォーカス: ${req.failurePreventionFocus}`
    ].join("\n");
}

function buildDogAnalysisPrompt(): string {
    const options = JSON.stringify(UI_OPTIONS, null, 2);
    return `
あなたはプロのドッグトリマーかつ犬種鑑定士です。
入力された犬の画像を詳細に分析し、提供された選択肢（UI_OPTIONS）の中から最も適切なものを選択してください。

利用可能な選択肢（UI_OPTIONS）:
${options}

分析ルール:
1. 各項目について、UI_OPTIONS に定義されている文字列と完全に一致するものを選んでください。
2. 犬種（breedPrimary, breedSecondary）は自由入力ですが、画像から推測される最も一般的な名称（日本語）を優先してください。
3. styleName は、その犬種や毛質から判断して、最も「似合いそう」または「一般的」なカットスタイルを1つ選んでください。
4. colorNote, distinctiveAnchorsNote は、画像から見える特徴（「胸元に白い斑点がある」「左耳が垂れている」など）を簡潔に記述してください。
5. JSON形式のみで回答してください。コードブロックや説明文は不要です。

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

function buildInferencePrompt(req: GroomingRequest, preset: StylePreset): string {
    return `
あなたは犬の写真編集の事前分析官です。
入力画像は1枚目です。1枚目の犬だけを分析してください。

目的:
- 1枚目の犬で「絶対に保持すべき個体アンカー」を抽出する
- 毛色・模様・耳・顔立ち・体格のうち、別犬化しやすい重要ポイントを抽出する
- 背景・構図・光・カメラ角度など、固定すべきシーン要素を抽出する
- 想定される編集失敗リスクを列挙する
- 頭部・胴体・脚・耳・尾について、今回の要求に対して無理のない推奨スタイル強度を出す

ユーザー指定情報:
${buildRequestSummary(req, preset)}

出力ルール:
- 画像に写っていないことを断定しない
- 不明な場合は保守的に表現する
- JSONのみを返す
- コードブロック禁止

出力形式:
{
  "visible_identity_anchors": ["..."],
  "visible_color_markings": ["..."],
  "visible_anatomy_notes": ["..."],
  "scene_locks": ["..."],
  "likely_edit_risks": ["..."],
  "recommended_region_intensity": {
    "head": "弱",
    "body": "中",
    "legs": "中",
    "ears": "弱",
    "tail": "弱"
  },
  "summary": "..."
}
`.trim();
}

function buildCandidatePlanPrompt(req: GroomingRequest, preset: StylePreset, inferred: InferredProfile): string {
    return `
あなたは犬の写真編集ディレクター兼トップトリマーです。
入力画像は3枚です。

- 1枚目: Before画像。個体情報とシーンの唯一の基準。
- 2枚目: 参考A。カットスタイル参考。
- 3枚目: 参考B。カットスタイル参考。

目的:
1回目の画像生成で成功率を上げるため、3種類の編集計画を作ってください。
ただし成功基準は緩めません。個体保持・背景保持・ポーズ保持・スタイル反映・写実性を同時に高く満たす必要があります。

作る計画:
- safe: 最も事故が少ない保守案
- balanced: 個体性とスタイル再現の均衡案
- style_max: スタイル再現を最大化しつつ破綻を抑えた案

共通ルール:
- 1枚目の犬の個体性、毛色、模様、耳の付け根、顔比率、体格、ポーズ、背景、光、画角は最優先で保持
- 2枚目と3枚目はカット形状の参考であり、犬種・毛色・背景・体型・アクセサリーはコピーしない
- 「どこをどう変えるか」を部位ごとに操作レベルで明示する
- 衝突時ルールを必ず入れる
- 1回目で起きやすい失敗を先回りして禁止する
- safe / balanced / style_max の差は主に適用強度とリスク許容度で作る

ユーザー指定:
${buildRequestSummary(req, preset)}

事前分析:
${JSON.stringify(inferred, null, 2)}

スタイル詳細:
- ラベル: ${preset.label}
- 顔: ${preset.head}
- 胴体: ${preset.body}
- 脚: ${preset.legs}
- 耳: ${preset.ears}
- 尾: ${preset.tail}
- マズル: ${preset.muzzle}
- 補足: ${preset.notes}

JSONのみを返してください。コードブロック禁止。
出力形式:
{
  "plans": [
    {
      "id": "safe",
      "label": "...",
      "strategy_summary": "...",
      "immutable_anchors": ["..."],
      "scene_locks": ["..."],
      "editable_operations": {
        "head": ["..."],
        "ears": ["..."],
        "body": ["..."],
        "legs": ["..."],
        "tail": ["..."]
      },
      "ref_adoption": {
        "refA": ["..."],
        "refB": ["..."]
      },
      "ref_ignore": ["..."],
      "conflict_rules": ["..."],
      "failure_prevention": ["..."],
      "plan_risk_summary": "...",
      "final_prompt_summary": "..."
    },
    {
      "id": "balanced",
      "label": "...",
      "strategy_summary": "...",
      "immutable_anchors": ["..."],
      "scene_locks": ["..."],
      "editable_operations": {
        "head": ["..."],
        "ears": ["..."],
        "body": ["..."],
        "legs": ["..."],
        "tail": ["..."]
      },
      "ref_adoption": {
        "refA": ["..."],
        "refB": ["..."]
      },
      "ref_ignore": ["..."],
      "conflict_rules": ["..."],
      "failure_prevention": ["..."],
      "plan_risk_summary": "...",
      "final_prompt_summary": "..."
    },
    {
      "id": "style_max",
      "label": "...",
      "strategy_summary": "...",
      "immutable_anchors": ["..."],
      "scene_locks": ["..."],
      "editable_operations": {
        "head": ["..."],
        "ears": ["..."],
        "body": ["..."],
        "legs": ["..."],
        "tail": ["..."]
      },
      "ref_adoption": {
        "refA": ["..."],
        "refB": ["..."]
      },
      "ref_ignore": ["..."],
      "conflict_rules": ["..."],
      "failure_prevention": ["..."],
      "plan_risk_summary": "...",
      "final_prompt_summary": "..."
    }
  ]
}
`.trim();
}

function buildPlanReviewPrompt(req: GroomingRequest, inferred: InferredProfile, planPack: CandidatePlanPack): string {
    return `
あなたは犬の画像生成の品質監査役です。
入力画像は3枚です。

- 1枚目: Before画像
- 2枚目: 参考A
- 3枚目: 参考B

あなたの役割:
3つの編集計画のうち、「1回目で成功する確率が最も高い計画」を1つだけ選んでください。
ここでの成功とは、以下を同時に高水準で満たすことです。
- 同一個体性
- 背景・光・画角維持
- ポーズ維持
- スタイル反映
- 写実性

重要:
- 成功基準は緩めない
- スタイルを弱めすぎて別物にしない
- ただし無理な変形や別犬化のリスクが高い案は避ける
- 最終的に画像生成に渡すため、補強指示も作る

ユーザー指定:
${buildRequestSummary(req, getStylePreset(req.styleName))}

事前分析:
${JSON.stringify(inferred, null, 2)}

候補計画:
${JSON.stringify(planPack, null, 2)}

JSONのみを返してください。コードブロック禁止。
出力形式:
{
  "selected_plan_id": "safe",
  "reason": "...",
  "reinforce_points": ["..."],
  "final_risk_checks": ["..."],
  "final_revision_directive": "..."
}
`.trim();
}

function buildImagePrompt(
    req: GroomingRequest,
    inferred: InferredProfile,
    selectedPlan: CandidatePlan,
    review: PlanReview
): string {
    const locks = [
        `個体保持レベル: ${req.identityPreservationLevel}`,
        `背景固定レベル: ${req.backgroundLock}`,
        `ポーズ固定レベル: ${req.poseLock}`,
        `カメラ固定レベル: ${req.cameraLock}`,
        `毛色固定レベル: ${req.colorLock}`,
        `骨格固定レベル: ${req.anatomyLock}`,
        `写実性要求レベル: ${req.realismLevel}`
    ].join("\n");

    const headOps = selectedPlan.editable_operations.head.map((v) => `- ${v}`).join("\n");
    const earOps = selectedPlan.editable_operations.ears.map((v) => `- ${v}`).join("\n");
    const bodyOps = selectedPlan.editable_operations.body.map((v) => `- ${v}`).join("\n");
    const legOps = selectedPlan.editable_operations.legs.map((v) => `- ${v}`).join("\n");
    const tailOps = selectedPlan.editable_operations.tail.map((v) => `- ${v}`).join("\n");
    const immutableAnchors = selectedPlan.immutable_anchors.map((v) => `- ${v}`).join("\n");
    const sceneLocks = selectedPlan.scene_locks.map((v) => `- ${v}`).join("\n");
    const refA = selectedPlan.ref_adoption.refA.map((v) => `- ${v}`).join("\n");
    const refB = selectedPlan.ref_adoption.refB.map((v) => `- ${v}`).join("\n");
    const refIgnore = selectedPlan.ref_ignore.map((v) => `- ${v}`).join("\n");
    const conflictRules = selectedPlan.conflict_rules.map((v) => `- ${v}`).join("\n");
    const failurePrevention = selectedPlan.failure_prevention.map((v) => `- ${v}`).join("\n");
    const reinforcePoints = review.reinforce_points.map((v) => `- ${v}`).join("\n");
    const riskChecks = review.final_risk_checks.map((v) => `- ${v}`).join("\n");

    return `
あなたは、写真編集ディレクター兼プロのドッグトリマーです。
入力画像は3枚です。

- 1枚目: Before画像。個体情報とシーン情報の唯一のソース。
- 2枚目: 参考A。顔・頭部のカット形状の参考のみ。
- 3枚目: 参考B。胴体・脚のカット形状の参考のみ。

目的:
1枚目の犬と同じ個体・同じシーンのまま、トリミング後の写実的なAfter写真を1枚生成してください。
編集するのは主に被毛の長さ・輪郭・ボリューム表現のみであり、骨格や個体の顔立ちを別の犬に変えてはいけません。

最優先:
1. 1枚目と同じ犬に見えること
2. 1枚目と同じ背景・光・画角・ポーズであること
3. 参考A / 参考Bのカット形状だけを自然に取り込むこと
4. フォトリアルであること

ユーザー指定:
${buildRequestSummary(req, getStylePreset(req.styleName))}

事前分析:
${JSON.stringify(inferred, null, 2)}

採用計画:
- 計画ID: ${selectedPlan.id}
- ラベル: ${selectedPlan.label}
- 戦略要約: ${selectedPlan.strategy_summary}
- 最終要約: ${selectedPlan.final_prompt_summary}

保持する個体アンカー:
${immutableAnchors}

固定するシーン要素:
${sceneLocks}

頭部で行う編集:
${headOps}

耳まわりで行う編集:
${earOps}

胴体で行う編集:
${bodyOps}

脚で行う編集:
${legOps}

尾で行う編集:
${tailOps}

参考Aから採用する要素:
${refA}

参考Bから採用する要素:
${refB}

参考画像から無視する要素:
${refIgnore}

衝突時ルール:
${conflictRules}

失敗予防:
${failurePrevention}

監査役からの補強指示:
${reinforcePoints}

最終リスクチェック:
${riskChecks}

ロック設定:
${locks}

追加の最終指示:
${review.final_revision_directive}

厳守事項:
- 毛だけを主に編集し、骨格・目鼻位置・耳の付け根・体格比率は変えない
- 犬は1匹のみ
- 背景を変えない
- 視線とポーズを変えない
- カメラ角度・画角・トリミングを変えない
- 参考画像の犬種そのものを移植しない
- 参考画像の毛色を移植しない
- 参考画像の背景を移植しない
- 新しいアクセサリーを追加しない
- 毛先は実際にトリミングした犬のように自然な質感にする
- 漫画、イラスト、3DCG風は禁止
- 写実的な写真として成立させる
- スタイル名の雰囲気だけでなく、採用計画の操作内容を正確に反映する
`.trim();
}

function buildPostCheckPrompt(): string {
    return `
あなたは犬の画像生成結果の検査員です。
入力画像は4枚です。

- 1枚目: Before画像
- 2枚目: 参考A
- 3枚目: 参考B
- 4枚目: 生成結果

以下を5点満点で採点し、問題点を列挙してください。
- identity_score: 同じ個体に見えるか
- background_score: 背景、光、画角が維持されているか
- pose_score: ポーズや視線が維持されているか
- style_score: 顔は参考A、胴体・脚は参考Bの意図が自然に反映されているか
- photorealism_score: 毛の質感や輪郭が写真として自然か

JSONのみを返してください。コードブロック禁止。
出力形式:
{
  "identity_score": 1,
  "background_score": 1,
  "pose_score": 1,
  "style_score": 1,
  "photorealism_score": 1,
  "issues": ["..."]
}
`.trim();
}

async function inferProfile(
    textModel: any,
    req: GroomingRequest,
    preset: StylePreset,
    beforePart: InlineImagePart
): Promise<InferredProfile> {
    const fallback: InferredProfile = {
        visible_identity_anchors: [
            "1枚目の犬の顔立ち",
            "1枚目の犬の耳の付き方",
            "1枚目の犬の毛色と模様"
        ],
        visible_color_markings: ["1枚目の毛色パターンを保持"],
        visible_anatomy_notes: ["耳と体格の自然な構造を保持"],
        scene_locks: ["背景", "光", "カメラ角度", "構図", "ポーズ"],
        likely_edit_risks: ["別犬化", "参考犬の毛色流入", "背景の変化"],
        recommended_region_intensity: {
            head: req.headStyleStrength,
            body: req.bodyStyleStrength,
            legs: req.legStyleStrength,
            ears: req.earStyleStrength,
            tail: req.tailStyleStrength
        },
        summary: "保守的なデフォルト分析"
    };

    const prompt = buildInferencePrompt(req, preset);
    const result = await textModel.generateContent([prompt, beforePart]);
    const response = await result.response;
    const text = await extractText(response);
    return parseJsonFromText<InferredProfile>(text, fallback);
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
    const result = await textModel.generateContent([prompt, beforePart]);
    const response = await result.response;
    const text = await extractText(response);
    return parseJsonFromText<DogAnalysisResult>(text, fallback);
}

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
                id: "safe",
                label: "保守案",
                strategy_summary: "個体保持を最優先にしつつ必要な部位だけ編集する。",
                immutable_anchors: [...inferred.visible_identity_anchors, ...inferred.visible_color_markings],
                scene_locks: [...inferred.scene_locks],
                editable_operations: {
                    head: ["頬外周だけを自然に整える", "目鼻位置と顔比率は変えない"],
                    ears: ["耳の付け根位置は維持し、耳まわりの毛だけ整理する"],
                    body: ["胴体被毛の長さを均一に短めへ調整する"],
                    legs: ["脚の輪郭を整え、太さの見え方を自然にする"],
                    tail: ["尾の毛先だけを整理し、形は維持する"]
                },
                ref_adoption: {
                    refA: req.refAAdoptFeatures,
                    refB: req.refBAdoptFeatures
                },
                ref_ignore: ["参考犬の毛色", "参考犬の背景", "参考犬の体型", "参考犬の犬種そのもの"],
                conflict_rules: ["衝突時は個体性を優先する", "耳構造は変えず耳まわりの毛だけ参考化する"],
                failure_prevention: ["別犬化しない", "背景を再構成しない", "参考犬の毛色をコピーしない"],
                plan_risk_summary: "最も安全だがスタイルが弱く見えるリスクがある",
                final_prompt_summary: "個体性を壊さず、参考の輪郭だけを自然に移す"
            },
            {
                id: "balanced",
                label: "均衡案",
                strategy_summary: "個体性とスタイル再現のバランスを取る。",
                immutable_anchors: [...inferred.visible_identity_anchors, ...inferred.visible_color_markings],
                scene_locks: [...inferred.scene_locks],
                editable_operations: {
                    head: ["顔外周を丸くまたは狙いの輪郭へ整える", "目鼻位置は維持する"],
                    ears: ["耳の構造は維持しつつ、耳まわりの毛量表現を調整する"],
                    body: ["胴体を参考に沿って短く均一に整える"],
                    legs: ["脚のボリュームを参考意図に沿って整理する"],
                    tail: ["尾は元の形を維持しつつ仕上がりだけ整える"]
                },
                ref_adoption: {
                    refA: req.refAAdoptFeatures,
                    refB: req.refBAdoptFeatures
                },
                ref_ignore: ["参考犬の毛色", "参考犬の背景", "参考犬の体型", "参考犬のアクセサリー"],
                conflict_rules: ["不自然な変形より輪郭の近似を優先する", "配色は一切移植しない"],
                failure_prevention: ["顔比率を変えすぎない", "耳を別形状にしない", "背景光を変えない"],
                plan_risk_summary: "実用上の本命案",
                final_prompt_summary: "顔は参考A、胴体と脚は参考Bの意図を、1枚目の個体に自然に適応する"
            },
            {
                id: "style_max",
                label: "スタイル再現強化案",
                strategy_summary: "スタイル形状の再現を高めるが、個体アンカーだけは固定する。",
                immutable_anchors: [...inferred.visible_identity_anchors, ...inferred.visible_color_markings],
                scene_locks: [...inferred.scene_locks],
                editable_operations: {
                    head: ["参考Aの輪郭意図を強めに反映する", "ただし目鼻位置は維持する"],
                    ears: ["耳周辺の毛量表現を積極的に調整するが耳構造は変えない"],
                    body: ["胴体を参考Bの長さ感へ強めに寄せる"],
                    legs: ["脚の輪郭を参考B寄りにする"],
                    tail: ["尾の仕上がりをやや強めに整える"]
                },
                ref_adoption: {
                    refA: req.refAAdoptFeatures,
                    refB: req.refBAdoptFeatures
                },
                ref_ignore: ["参考犬の毛色", "参考犬の背景", "参考犬の体格", "参考犬の顔立ち"],
                conflict_rules: ["個体アンカーを壊す場合はスタイル再現を弱める"],
                failure_prevention: ["別犬化しない", "顔の造形を変えない", "背景を動かさない"],
                plan_risk_summary: "スタイル再現は高いが初回破綻リスクが相対的に高い",
                final_prompt_summary: "参考スタイルを強めに取りつつ、個体の鍵だけは固定する"
            }
        ]
    };

    const prompt = buildCandidatePlanPrompt(req, preset, inferred);
    const result = await textModel.generateContent([prompt, beforePart, refPartA, refPartB]);
    const response = await result.response;
    const text = await extractText(response);
    return parseJsonFromText<CandidatePlanPack>(text, fallback);
}

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
        reason: "均衡案が最も初回成功率と再現性のバランスが良いと判断。",
        reinforce_points: [
            "耳の付け根と耳の角度を維持する",
            "毛色と模様を厳密に保持する",
            "背景・光・画角を変えない"
        ],
        final_risk_checks: [
            "別犬化していないか",
            "参考犬の毛色が流入していないか",
            "背景や構図が変わっていないか"
        ],
        final_revision_directive:
            "輪郭と毛量表現は変えてよいが、顔立ち・耳構造・毛色・背景・ポーズは維持し、参考Aは顔、参考Bは胴体と脚の形状だけに使う。"
    };

    const prompt = buildPlanReviewPrompt(req, inferred, planPack);
    const result = await textModel.generateContent([prompt, beforePart, refPartA, refPartB]);
    const response = await result.response;
    const text = await extractText(response);
    return parseJsonFromText<PlanReview>(text, fallback);
}

async function generateImage(
    imageModel: any,
    prompt: string,
    beforePart: InlineImagePart,
    refPartA: InlineImagePart,
    refPartB: InlineImagePart
): Promise<string> {
    const result = await imageModel.generateContent([prompt, beforePart, refPartA, refPartB]);
    const response = await result.response;
    const base64 = extractImageBase64(response);

    if (!base64) {
        console.log("DEBUG - Candidates:", JSON.stringify(response.candidates, null, 2));
        throw new Error("画像データを取得できませんでした。");
    }

    return base64;
}

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
        issues: ["評価の解析に失敗したため暫定値を使用。"]
    };

    const prompt = buildPostCheckPrompt();
    const result = await textModel.generateContent([prompt, beforePart, refPartA, refPartB, afterPart]);
    const response = await result.response;
    const text = await extractText(response);
    const parsed = parseJsonFromText<PostCheck>(text, fallback);

    return {
        identity_score: clampScore(parsed.identity_score),
        background_score: clampScore(parsed.background_score),
        pose_score: clampScore(parsed.pose_score),
        style_score: clampScore(parsed.style_score),
        photorealism_score: clampScore(parsed.photorealism_score),
        issues: Array.isArray(parsed.issues) ? parsed.issues : fallback.issues
    };
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

    const selectedPlan =
        planPack.plans.find((p) => p.id === review.selected_plan_id) ||
        planPack.plans.find((p) => p.id === "balanced") ||
        planPack.plans;

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
        imageBase64,
        inferred,
        planPack,
        review,
        selectedPlanId: selectedPlan.id,
        selectedPlan,
        postCheck: check,
        prompt,
        debugId
    };
}