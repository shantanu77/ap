import OpenAI from "openai";
import { NextResponse } from "next/server";
import { getAuthenticatedKid } from "@/lib/kidAuth";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  const kid = await getAuthenticatedKid();
  if (!kid) return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: "Photo checking is not configured." }, { status: 500 });
  try {
    const form = await request.formData();
    const photo = form.get("photo");
    const task = String(form.get("task") ?? "").trim();
    const criteria = String(form.get("criteria") ?? "").trim();
    if (!(photo instanceof File) || !task) return NextResponse.json({ error: "Upload the completed booster page." }, { status: 400 });
    if (!allowed.has(photo.type) || photo.size === 0 || photo.size > 5_000_000) return NextResponse.json({ error: "Use a clear JPEG, PNG, or WebP photo under 5 MB." }, { status: 415 });
    const image = Buffer.from(await photo.arrayBuffer()).toString("base64");
    const response = await openai.chat.completions.create({
      model: "gpt-4o", temperature: 0, response_format: { type: "json_object" },
      messages: [
        { role: "system", content: `You are a kind, simple checker for a Grade ${kid.grade} learner's photographed homework booster. Inspect only visible evidence. Decide whether the requested work appears attempted and rate correctness/quality from 1 to 5. Do not assume invisible work is done. Return JSON only with completed:boolean, rating:integer, summary:string. Be brief, specific, encouraging, and avoid inventing unreadable answers.` },
        { role: "user", content: [{ type: "text", text: JSON.stringify({ task, successCriteria: criteria }) }, { type: "image_url", image_url: { url: `data:${photo.type};base64,${image}`, detail: "high" } }] },
      ],
    });
    const result = JSON.parse(response.choices[0].message.content ?? "{}");
    return NextResponse.json({ completed: Boolean(result.completed), rating: Math.max(1, Math.min(5, Math.round(Number(result.rating) || 1))), summary: String(result.summary ?? "The work was checked from the photo.").slice(0, 500) });
  } catch (error) {
    console.error("Booster photo check failed:", error);
    return NextResponse.json({ error: "Could not check the page. Try a clearer photo." }, { status: 500 });
  }
}
