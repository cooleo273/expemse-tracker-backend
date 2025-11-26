import { CATEGORY_MAP, CATEGORY_REFERENCE_TEXT, DEFAULT_CATEGORY_ID, DEFAULT_SUBCATEGORY_ID, SUBCATEGORY_SETS, type CategoryKey } from "./categories";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-1.5-flash";

const VALID_CATEGORY_IDS = new Set<CategoryKey>(Object.keys(CATEGORY_MAP) as CategoryKey[]);
const SUBCATEGORY_PARENT: Record<string, CategoryKey> = Object.values(SUBCATEGORY_SETS)
  .flat()
  .reduce((acc, subcategory) => {
    acc[subcategory.id] = subcategory.parentId;
    return acc;
  }, {} as Record<string, CategoryKey>);

const SUBCATEGORY_MAP: Record<string, string> = Object.values(SUBCATEGORY_SETS)
  .flat()
  .reduce((acc, subcategory) => {
    acc[subcategory.id] = subcategory.name;
    return acc;
  }, {} as Record<string, string>);

// Create maps for name -> id lookups (case-insensitive) so the model can return either name or id
const CATEGORY_NAME_TO_ID: Record<string, CategoryKey> = Object.values(CATEGORY_MAP).reduce((acc, cat) => {
  acc[cat.name.toLowerCase()] = cat.id;
  acc[cat.id.toLowerCase()] = cat.id; // also map the id itself lowercased
  return acc;
}, {} as Record<string, CategoryKey>);

const SUBCATEGORY_NAME_TO_ID: Record<string, string> = Object.values(SUBCATEGORY_SETS)
  .flat()
  .reduce((acc, subcategory) => {
    acc[subcategory.name.toLowerCase()] = subcategory.id;
    acc[subcategory.id.toLowerCase()] = subcategory.id; // map id to id
    // also map a normalized short form without parent prefix (e.g., 'groceries')
    const short = subcategory.id.split(":").pop()?.toLowerCase();
    if (short) acc[short] = subcategory.id;
    return acc;
  }, {} as Record<string, string>);

let missingApiWarningLogged = false;

export type ReceiptRecord = Record<string, unknown>;

type CategorizationResult = {
  categoryId?: string;
  subcategoryId?: string;
};

export async function categorizeReceiptRecords(records: ReceiptRecord[]): Promise<ReceiptRecord[]> {
  if (!records.length) {
    return records;
  }

  if (!GEMINI_API_KEY) {
    if (!missingApiWarningLogged) {
      console.warn("GEMINI_API_KEY is not set; falling back to local category defaults.");
      missingApiWarningLogged = true;
    }
    return records.map((record) => applyFallback(record));
  }

  try {
    console.info(`[geminiCategorizer] categorizeReceiptRecords called for ${records.length} records. GEMINI_API_KEY configured:${Boolean(GEMINI_API_KEY)}`);
    const prompt = buildPrompt(records);
    const endpoint = buildEndpoint();
    console.info(`[geminiCategorizer] Calling Gemini endpoint for model '${GEMINI_MODEL}': ${endpoint.replace(/\?.*$/, '')} (key hidden)`);
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) {
      const bodyText = await response.text();
      console.warn("Gemini API returned non-200", response.status, bodyText);
      return records.map((record) => applyFallback(record));
    }

    const parsed = await response.json();
    // Helpful debug logs — do not log secrets
    const candidate = parsed?.candidates?.[0];
    console.info("[geminiCategorizer] Gemini response status OK, candidate present:", Boolean(candidate));
    const text = extractResponseText(parsed);
    if (text) {
      console.info("[geminiCategorizer] Extracted text (truncated):", text.substring(0, 512));
    } else {
      console.warn("[geminiCategorizer] No text extracted from Gemini response");
    }
    if (!text) {
      return records.map((record) => applyFallback(record));
    }

    let structured: CategorizationResult[] | undefined;
    try {
      structured = JSON.parse(text) as CategorizationResult[];
    } catch (err) {
      console.warn('[geminiCategorizer] Failed to parse JSON from Gemini response text');
      console.warn('[geminiCategorizer] Raw response text (truncated):', text.substring(0, 1024));
      return records.map((record) => applyFallback(record));
    }

    if (!Array.isArray(structured) || structured.length !== records.length) {
      console.warn('[geminiCategorizer] Structured result unexpected shape or length', {
        expectedLength: records.length,
        actualLength: Array.isArray(structured) ? structured.length : 'not-array',
        structuredPreview: structured && Array.isArray(structured) ? structured.slice(0, 3) : structured,
      });
      return records.map((record) => applyFallback(record));
    }

    return records.map((record, index) => {
      const result = structured[index] ?? {};
      const anyResult = result as any;
      const rawCategoryValue = anyResult.categoryId ?? anyResult.category ?? anyResult.category_id;
      const rawSubcategoryValue = anyResult.subcategoryId ?? anyResult.subcategory ?? anyResult.subcategory_id ?? anyResult.subcategoryId;
      const categoryId = normalizeCategoryId(rawCategoryValue);
      const subcategoryId = normalizeSubcategoryId(rawSubcategoryValue, categoryId);
      const subcategory = SUBCATEGORY_MAP[subcategoryId] ?? "Unknown";
      return { ...record, category: categoryId, subcategoryId, subcategory };
    });
  } catch (error) {
    console.error("Gemini categorization failed", error);
    return records.map((record) => applyFallback(record));
  }
}

function buildEndpoint(): string {
  // Allow users to provide either "model" or "models/<model>" and normalize that
  const modelPath = GEMINI_MODEL?.startsWith("models/") ? GEMINI_MODEL : `models/${GEMINI_MODEL}`;
  const encodedModel = encodeURIComponent(modelPath);
  return `https://generativelanguage.googleapis.com/v1beta/${encodedModel}:generateContent?key=${GEMINI_API_KEY}`;
}

function buildPrompt(records: ReceiptRecord[]): string {
  const formattedRecords = records.map((record, index) => ({
    index,
    amount: record.amount ?? record.total ?? null,
    currency: record.currency ?? null,
    payee: record.payee ?? record.vendor ?? null,
    note: record.note ?? record.description ?? null,
    labels: record.labels ?? null,
    occurredAt: record.occurredAt ?? record.date ?? null,
    existingCategory: record.category ?? null,
    existingSubcategory: record.subcategoryId ?? null,
  }));

  return [
    "You categorize receipt line items into the known categories.",
    CATEGORY_REFERENCE_TEXT,
    "Rules:",
    "IMPORTANT: Only return valid JSON array — do not include extra commentary or explanations.",
    "1. Always return JSON with the same number of items as the input.",
    "2. Use exact category and subcategory ids.",
    `3. If nothing matches, use ${DEFAULT_CATEGORY_ID} and ${DEFAULT_SUBCATEGORY_ID}.`,
    "4. Match by payee, description, and amount when possible.",
    "Respond with: [{\"categoryId\":\"foodAndDrinks\",\"subcategoryId\":\"foodAndDrinks:groceries\"}, ...].",
    "Input records:",
    JSON.stringify(formattedRecords, null, 2),
  ].join("\n\n");
}

function extractResponseText(responseBody: any): string | undefined {
  const candidate = responseBody?.candidates?.[0];
  if (!candidate?.content?.parts) {
    return undefined;
  }

  const parts = candidate.content.parts
    .map((part: { text?: string }) => part.text)
    .filter(Boolean);

  return parts.length ? parts.join("\n").trim() : undefined;
}

function normalizeCategoryId(value: string | undefined): CategoryKey {
  if (!value) return DEFAULT_CATEGORY_ID;
  const v = value.toString().trim();
  if (VALID_CATEGORY_IDS.has(v as CategoryKey)) {
    return v as CategoryKey;
  }
  const mapped = CATEGORY_NAME_TO_ID[v.toLowerCase()];
  if (mapped) return mapped;
  return DEFAULT_CATEGORY_ID;
}

function normalizeSubcategoryId(value: string | undefined, categoryId: CategoryKey): string {
  if (!value) {
    // Choose primary subcategory for the category
    const subcategories = SUBCATEGORY_SETS[categoryId] ?? [];
    const primarySubcategory = subcategories[0];
    if (primarySubcategory) return primarySubcategory.id;
    return DEFAULT_SUBCATEGORY_ID;
  }

  const v = value.toString().trim();
  // If the value is a valid id and belongs to the category, accept
  if (SUBCATEGORY_PARENT[v] && SUBCATEGORY_PARENT[v] === categoryId) return v;
  // If the value is a recognized id (but maybe from different category), normalize to fallback
  if (SUBCATEGORY_PARENT[v]) return DEFAULT_SUBCATEGORY_ID;
  // If value is a name, try mapping name -> id
  const mappedByName = SUBCATEGORY_NAME_TO_ID[v.toLowerCase()];
  if (mappedByName && SUBCATEGORY_PARENT[mappedByName] === categoryId) return mappedByName;

  const subcategories = SUBCATEGORY_SETS[categoryId];
  if (subcategories?.length) {
    const primarySubcategory = subcategories[0];
    if (primarySubcategory) {
      return primarySubcategory.id;
    }
  }

  return DEFAULT_SUBCATEGORY_ID;
}

function applyFallback(record: ReceiptRecord): ReceiptRecord {
  // Try a lightweight heuristic before falling back to defaults
  const heuristic = heuristicCategorizeRecord(record);
  if (heuristic) {
    return { ...record, category: heuristic.categoryId, subcategoryId: heuristic.subcategoryId, subcategory: SUBCATEGORY_MAP[heuristic.subcategoryId] };
  }

  const subcategory = SUBCATEGORY_MAP[DEFAULT_SUBCATEGORY_ID] ?? "Unknown";
  return { ...record, category: DEFAULT_CATEGORY_ID, subcategoryId: DEFAULT_SUBCATEGORY_ID, subcategory };
}

function heuristicCategorizeRecord(record: ReceiptRecord): { categoryId: CategoryKey; subcategoryId: string } | undefined {
  const text = (record.description ?? record.note ?? record.payee ?? "").toString().toLowerCase();
  if (!text) return undefined;

  const matches: Array<{ keywords: string[]; categoryId: CategoryKey; subcategoryId: string }> = [
    { keywords: ["charger", "usb", "cable", "wall charger"], categoryId: "shopping", subcategoryId: "shopping:electronics-accessories" },
    { keywords: ["toothpaste", "tooth brush", "toothbrush", "tooth"], categoryId: "shopping", subcategoryId: "shopping:drug-store-chemist" },
    { keywords: ["lotion", "soap", "shampoo", "body lotion", "bath"], categoryId: "shopping", subcategoryId: "shopping:health-beauty" },
    { keywords: ["pan", "saute", "skillet", "bake", "cook"], categoryId: "shopping", subcategoryId: "shopping:home-green" },
    { keywords: ["plate", "spoon", "fork", "utensil", "spoons"], categoryId: "shopping", subcategoryId: "shopping:home-green" },
    { keywords: ["paper towel", "paper towels", "towel"], categoryId: "shopping", subcategoryId: "shopping:home-green" },
    { keywords: ["detergent", "dishwashing", "vim", "soap"], categoryId: "shopping", subcategoryId: "shopping:home-green" },
  ];

  for (const m of matches) {
    for (const k of m.keywords) {
      if (text.includes(k)) return { categoryId: m.categoryId, subcategoryId: m.subcategoryId };
    }
  }

  return undefined;
}
