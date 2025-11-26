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
    const prompt = buildPrompt(records);
    const response = await fetch(buildEndpoint(), {
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
    const text = extractResponseText(parsed);
    if (!text) {
      return records.map((record) => applyFallback(record));
    }

    const structured = JSON.parse(text) as CategorizationResult[];
    if (!Array.isArray(structured) || structured.length !== records.length) {
      return records.map((record) => applyFallback(record));
    }

    return records.map((record, index) => {
      const result = structured[index] ?? {};
      const categoryId = normalizeCategoryId(result.categoryId);
      const subcategoryId = normalizeSubcategoryId(result.subcategoryId, categoryId);
      const subcategory = SUBCATEGORY_MAP[subcategoryId] ?? "Unknown";
      return { ...record, category: categoryId, subcategoryId, subcategory };
    });
  } catch (error) {
    console.error("Gemini categorization failed", error);
    return records.map((record) => applyFallback(record));
  }
}

function buildEndpoint(): string {
  const encodedModel = encodeURIComponent(GEMINI_MODEL);
  return `https://generativelanguage.googleapis.com/v1beta/models/${encodedModel}:generateContent?key=${GEMINI_API_KEY}`;
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
  if (value && VALID_CATEGORY_IDS.has(value as CategoryKey)) {
    return value as CategoryKey;
  }
  return DEFAULT_CATEGORY_ID;
}

function normalizeSubcategoryId(value: string | undefined, categoryId: CategoryKey): string {
  if (value) {
    const parentId = SUBCATEGORY_PARENT[value];
    if (parentId && parentId === categoryId) {
      return value;
    }
  }

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
  const subcategory = SUBCATEGORY_MAP[DEFAULT_SUBCATEGORY_ID] ?? "Unknown";
  return { ...record, category: DEFAULT_CATEGORY_ID, subcategoryId: DEFAULT_SUBCATEGORY_ID, subcategory };
}
