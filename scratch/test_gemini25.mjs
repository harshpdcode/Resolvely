import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8');
const m = env.match(/GOOGLE_GENERATIVE_AI_API_KEY=["']?([^"'\r\n]+)/);
const apiKey = m ? m[1].trim() : "";

async function test(modelName) {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: "Respond in JSON: {\"status\": \"ok\"}" }] }] })
    });
    const d = await res.json();
    console.log(modelName, res.status, d?.candidates?.[0]?.content?.parts?.[0]?.text);
  } catch (err) {
    console.log(modelName, err.message);
  }
}

async function main() {
  await test("models/gemini-2.5-flash");
  await test("models/gemini-flash-latest");
}

main();
