import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8');
const m = env.match(/GOOGLE_GENERATIVE_AI_API_KEY=["']?([^"'\r\n]+)/);
const apiKey = m ? m[1].trim() : "";

const SYSTEM_PROMPT = `You are an AI complaint triage engine for Resolvely.
Analyze the complaint title and description and output JSON:
{"category": "billing" | "technical" | "service" | "product" | "delivery" | "account" | "other", "priority": "low" | "medium" | "high" | "urgent", "reason": string}`;

async function testTriage() {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `${SYSTEM_PROMPT}\n\nTitle: Incorrect Billing Charge #4092\n\nDescription: I was double charged $49.99 on my credit card.` }]
        }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.1 }
      })
    });
    const d = await res.json();
    console.log("STATUS:", res.status);
    console.log("RESPONSE:", d?.candidates?.[0]?.content?.parts?.[0]?.text);
  } catch (err) {
    console.error(err);
  }
}

testTriage();
