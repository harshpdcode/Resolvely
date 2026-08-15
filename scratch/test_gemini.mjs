import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8');
const m = env.match(/GOOGLE_GENERATIVE_AI_API_KEY=["']?([^"'\r\n]+)/);
const apiKey = m ? m[1].trim() : "";

async function listModels() {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await res.json();
    if (data.models) {
      console.log("AVAILABLE MODELS:");
      data.models.forEach(m => console.log(" - " + m.name));
    } else {
      console.log("Error:", data);
    }
  } catch (err) {
    console.error(err);
  }
}

async function test(modelName) {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: "Hello" }] }] })
    });
    const d = await res.json();
    console.log(modelName, res.status, d?.candidates ? "OK" : d?.error?.message);
  } catch (err) {
    console.log(modelName, err.message);
  }
}

async function main() {
  await listModels();
  await test("models/gemini-1.5-flash");
  await test("models/gemini-1.5-pro");
}

main();
