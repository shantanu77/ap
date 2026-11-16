import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: "Speech checking is not configured." }, { status: 500 });
  try {
    const form = await request.formData();
    const audio = form.get("audio");
    const sentence = String(form.get("sentence") ?? "").trim();
    const englishSentence = String(form.get("englishSentence") ?? "").trim();
    const meaning = String(form.get("meaning") ?? "").trim();
    if (!(audio instanceof File) || !sentence || !englishSentence) return NextResponse.json({ error: "Audio and the practice sentence are required." }, { status: 400 });
    const transcription = await openai.audio.transcriptions.create({ file: audio, model: "whisper-1", prompt: `Student reading a Hindi or Sanskrit sentence. Expected pronunciation and words: ${sentence}` });
    const transcript = transcription.text.trim();
    if (!transcript) return NextResponse.json({ transcript, correct: false, feedback: "I could not hear the sentence. Please try again." });
    const evaluation = await openai.chat.completions.create({
      model: "gpt-4o-mini", temperature: 0, response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "Evaluate a child's spoken practice sentence. The transcript can be transliterated into Latin script by speech recognition. Check that the spoken words match the expected Hindi/Sanskrit sentence, allowing reasonable pronunciation and transcription variation. Return JSON only: correct (boolean), feedback (short kind sentence). Do not claim perfect pronunciation from a text transcript; judge whether the same sentence was spoken." },
        { role: "user", content: JSON.stringify({ expectedSentence: sentence, englishSentence, wordMeaning: meaning, transcript }) },
      ],
    });
    let result = { correct: false, feedback: "Try saying the same sentence once more, slowly." };
    try { result = { ...result, ...JSON.parse(evaluation.choices[0].message.content ?? "{}") }; } catch {}
    return NextResponse.json({ transcript, correct: Boolean(result.correct), feedback: String(result.feedback) });
  } catch (error) {
    console.error("Language speech check failed:", error);
    return NextResponse.json({ error: "Could not check the recording. Please try again." }, { status: 500 });
  }
}
