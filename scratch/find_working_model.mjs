import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8');
const m = env.match(/GOOGLE_GENERATIVE_AI_API_KEY=["']?([^"'\r\n]+)/);
const apiKey = m ? m[1].trim() : "";

const modelsToTest = [
  "gemini-flash-latest",
  "gemini-pro-latest",
  "gemini-2.5-flash-lite",
  "gemini-3.5-flash",
  "gemini-3.7-flash",
  "gemini-3.1-flash-lite",
  "gemini-3-flash-preview",
  "gemma-4-26b-a4b-it"
];

async function test(name) {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${name}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Hello, return JSON: {\"status\": \"ok\"}" }] }]
      })
    });
    const d = await res.json();
    if (res.ok && d.candidates) {
      console.log(`[WORKING] ${name}:`, d.candidates[0].content.parts[0].text.trim());
      return true;
    } else {
      console.log(`[FAILED] ${name}: (${res.status})`, d?.error?.message || d);
      return false;
    }
  } catch (err) {
    console.log(`[ERR] ${name}:`, err.message);
    return false;
  }
}

async function main() {
  for (const m of modelsToTest) {
    await test(m);
  }
}

main();
