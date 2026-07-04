import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface VerificationResult {
  correct: boolean;
  score: 0 | 1;
  rating: 1 | 2 | 3 | 4 | 5;
  feedback: string;
  contentFeedback: string;
  styleRating: 1 | 2 | 3 | 4 | 5;
  styleFeedback: string;
  fillerWords: string[];
  betterAnswer: string;
  speakingTips: string[];
}

function clampRating(value: unknown): 1 | 2 | 3 | 4 | 5 {
  const rating = Math.round(Number(value));
  if (!Number.isFinite(rating)) return 1;
  if (rating <= 1) return 1;
  if (rating >= 5) return 5;
  return rating as 1 | 2 | 3 | 4 | 5;
}

function parseVerification(raw: string | null): VerificationResult {
  if (!raw) {
    return {
      correct: false,
      score: 0,
      rating: 1,
      feedback: "No verification returned.",
      contentFeedback: "No content review was returned.",
      styleRating: 1,
      styleFeedback: "No speaking style review was returned.",
      fillerWords: [],
      betterAnswer: "Try answering in one complete sentence with one detail from the passage.",
      speakingTips: ["Use a full sentence.", "Include one detail from the passage."],
    };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<VerificationResult>;
    const correct = Boolean(parsed.correct);
    const contentFeedback =
      typeof parsed.contentFeedback === "string" && parsed.contentFeedback.trim()
        ? parsed.contentFeedback.trim()
        : correct
        ? "The answer matches the passage."
        : "The answer needs a clearer detail from the passage.";
    const styleFeedback =
      typeof parsed.styleFeedback === "string" && parsed.styleFeedback.trim()
        ? parsed.styleFeedback.trim()
        : "Speak in complete sentences with fewer filler words.";
    return {
      correct,
      score: correct ? 1 : 0,
      rating: clampRating(parsed.rating),
      feedback:
        typeof parsed.feedback === "string" && parsed.feedback.trim()
          ? parsed.feedback.trim()
          : `${contentFeedback} ${styleFeedback}`,
      contentFeedback,
      styleRating: clampRating(parsed.styleRating),
      styleFeedback,
      fillerWords: Array.isArray(parsed.fillerWords)
        ? parsed.fillerWords.map((item) => String(item).trim()).filter(Boolean).slice(0, 5)
        : [],
      betterAnswer:
        typeof parsed.betterAnswer === "string" && parsed.betterAnswer.trim()
          ? parsed.betterAnswer.trim()
          : "I think the answer is important because the passage says one clear detail that supports it.",
      speakingTips: Array.isArray(parsed.speakingTips)
        ? parsed.speakingTips.map((item) => String(item).trim()).filter(Boolean).slice(0, 5)
        : ["Answer in a complete sentence.", "Avoid um and uh when you can."],
    };
  } catch {
    return {
      correct: false,
      score: 0,
      rating: 1,
      feedback: "Could not parse verification result.",
      contentFeedback: "Could not parse the content review.",
      styleRating: 1,
      styleFeedback: "Could not parse the speaking style review.",
      fillerWords: [],
      betterAnswer: "Try answering again in one complete sentence with a passage detail.",
      speakingTips: ["Use a complete sentence.", "Add one specific detail."],
    };
  }
}

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OpenAI API key is not configured" }, { status: 500 });
  }

  try {
    const formData = await req.formData();
    const audio = formData.get("audio");
    const question = String(formData.get("question") ?? "").trim();
    const passage = String(formData.get("passage") ?? "").trim();

    if (!(audio instanceof File)) {
      return NextResponse.json({ error: "Audio recording is required" }, { status: 400 });
    }
    if (!question || !passage) {
      return NextResponse.json({ error: "Question and passage are required" }, { status: 400 });
    }

    const transcription = await openai.audio.transcriptions.create({
      file: audio,
      model: "whisper-1",
      language: "en",
      response_format: "json",
      prompt: "A grade 6 student named Ashvath is answering a reading comprehension question.",
    });
    const transcript = transcription.text.trim();

    if (!transcript) {
      return NextResponse.json({
        transcript,
        correct: false,
        score: 0,
        rating: 1,
        feedback: "No spoken answer was detected. Record Ashvath's answer again.",
        contentFeedback: "No answer was available to check against the passage.",
        styleRating: 1,
        styleFeedback: "Speak loudly enough for the microphone and answer in a full sentence.",
        fillerWords: [],
        betterAnswer: "The answer is ___ because the passage says ___.",
        speakingTips: ["Speak clearly into the microphone.", "Use one full sentence."],
      });
    }

    const verification = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You grade and coach a child's spoken reading comprehension answer. Return only JSON with keys correct:boolean, rating:number from 1 to 5, feedback:string, contentFeedback:string, styleRating:number from 1 to 5, styleFeedback:string, fillerWords:string[], betterAnswer:string, speakingTips:string[]. Award correct only when the transcript answers the question using details or a valid inference from the passage. Do not require exact wording. The rating should combine correctness and response quality. Also coach speaking style: filler words like um/uh/like/you know, sentence structure, clarity, completeness, and how to sound more confident.",
        },
        {
          role: "user",
          content: JSON.stringify({
            learner: "Ashvath",
            rule: "No guest work: the answer must be Ashvath's own spoken answer, not a typed answer or parent substitute.",
            passage,
            question,
            transcript,
          }),
        },
      ],
      temperature: 0,
      response_format: { type: "json_object" },
    });

    const result = parseVerification(verification.choices[0].message.content);
    return NextResponse.json({ transcript, ...result });
  } catch (err) {
    console.error("Read aloud verification failed:", err);
    return NextResponse.json({ error: "Failed to verify recorded answer" }, { status: 500 });
  }
}
