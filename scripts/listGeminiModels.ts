import "dotenv/config";

// Using global fetch (Node 20+)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
declare const fetch: any;

async function main() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.error("GEMINI_API_KEY not set in .env");
    process.exit(1);
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`;
  try {
    const res = await fetch(url);
    const json = await res.json();
    console.log(JSON.stringify(json, null, 2));
  } catch (err) {
    console.error("Failed to list Gemini models", err);
    process.exit(1);
  }
}

main();
