import "dotenv/config";
import { categorizeReceiptRecords } from "../src/services/geminiCategorizer";

async function main() {
  const records = [
    { amount: 34.99, description: "Wall Charger 745883793740", payee: "Walmart" },
    { amount: 2, description: "Toothpaste", payee: "DOLLARAMA" },
    { amount: 11.47, description: "SC 3PK ODOUR 096506690030", payee: "Walmart" },
    { amount: 49.94, description: "1S5PC BNB TA 84002140347", payee: "Walmart" },
  ];

  console.log("Running categorizeReceiptRecords locally with sample records.\nEnsure GEMINI_API_KEY is set in .env for this test.");
  try {
    const result = await categorizeReceiptRecords(records as any[]);
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("Categorize call failed: ", err);
    process.exit(1);
  }
}

main();
