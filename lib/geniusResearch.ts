import OpenAI from "openai";
import type { GeniusSubject, StudyLevel } from "@/types/genius";
import { canonicalizeTopic } from "@/lib/geniusContent";

export type GeniusTopicPlan = {
  canonicalTopic: string;
  title: string;
  focus: string;
  searchTerms: string[];
};

export type GeniusCurriculumResearch = {
  summary: string;
  grade6to7: string[];
  grade8Extension: string[];
  scopeNote: string;
  sources: Array<{ title: string; url: string; relevance: string }>;
  researchedAt: string;
};

function client() {
  return process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
}

function parseJson(text: string): Record<string, unknown> {
  const clean = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const value = JSON.parse(clean);
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid Genius research response.");
  return value as Record<string, unknown>;
}

function shortText(value: unknown, fallback: string, max = 240): string {
  return String(value ?? fallback).replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, max) || fallback;
}

function cleanList(value: unknown, max: number, itemLength = 240): string[] {
  return Array.isArray(value)
    ? value.map((item) => shortText(item, "", itemLength)).filter(Boolean).slice(0, max)
    : [];
}

function stableCanonicalTopic(subject: GeniusSubject, generated: string, query: string): string {
  const text = `${generated} ${query}`.toLowerCase();
  if (subject === "chemistry" && /\b(chemical\s+bonds?|bonding|ionic\s+bond|covalent\s+bond|types?\s+of\s+(?:chemical\s+)?bonds?|atoms?\s+(?:bond|bonding|combine|stick together))\b/.test(text)) {
    return "chemical-bonding";
  }
  if (subject === "physics" && /\b(gravity|gravitation|gravitational\s+force)\b/.test(text)) return "gravity-and-gravitation";
  if (subject === "physics" && /\b(motion|speed|velocity|acceleration|inertia)\b/.test(text)) return "motion-and-forces";
  return generated.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || canonicalizeTopic(query);
}

export async function resolveGeniusTopic(query: string, subject: GeniusSubject): Promise<GeniusTopicPlan> {
  const fallback = {
    canonicalTopic: canonicalizeTopic(query),
    title: query.replace(/[?.!]+$/, "").trim(),
    focus: query,
    searchTerms: [query],
  };
  const ai = client();
  if (!ai) return fallback;
  try {
    const response = await ai.chat.completions.create({
      model: process.env.GENIUS_MODEL || "gpt-4o",
      temperature: 0.1,
      max_tokens: 300,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "Resolve a student's query to one reusable school-level chapter concept. Synonyms, sub-questions and requests for types/examples belong to the same canonical chapter when one comprehensive lesson can answer them. Preserve the specific requested focus. Return strict JSON: {canonical_topic: short stable kebab-case slug, title: chapter title, focus: what the learner explicitly wants answered, search_terms: 2-4 concise research queries}. Never invent a chapter that is not curriculum-appropriate." },
        { role: "user", content: `Subject: ${subject}\nStudent query: ${query}\nUse Indian NCERT grades 6-8 as the curriculum frame.` },
      ],
    });
    const value = parseJson(response.choices[0]?.message?.content || "{}");
    return {
      canonicalTopic: stableCanonicalTopic(subject, shortText(value.canonical_topic, fallback.canonicalTopic, 100), query),
      title: shortText(value.title, fallback.title, 120),
      focus: shortText(value.focus, query, 300),
      searchTerms: cleanList(value.search_terms, 4, 160).length ? cleanList(value.search_terms, 4, 160) : [query],
    };
  } catch (error) {
    console.error("Genius topic resolution failed; using query text:", error);
    return fallback;
  }
}

export async function researchGeniusTopic(args: {
  plan: GeniusTopicPlan;
  subject: GeniusSubject;
  level: StudyLevel;
}): Promise<GeniusCurriculumResearch> {
  const ai = client();
  if (!ai) throw new Error("Curriculum research needs an OpenAI API key.");
  const response = await ai.responses.create({
    model: process.env.GENIUS_RESEARCH_MODEL || process.env.GENIUS_MODEL || "gpt-4o",
    tools: [{ type: "web_search_preview", search_context_size: "high" }],
    temperature: 0.2,
    max_output_tokens: 1800,
    input: `Research the first lesson for this NCERT-aligned school topic. Search official NCERT and other authoritative education/science sources. Prefer current NCERT textbooks, learning outcomes, syllabus and official curriculum documents. Never claim a topic is explicitly in a grade if it is absent there.\nSubject: ${args.subject}\nResolved chapter: ${args.plan.title} (${args.plan.canonicalTopic})\nStudent's specific focus: ${args.plan.focus}\nResearch queries: ${args.plan.searchTerms.join("; ")}\nTarget range: Grades 6-8. Build a balanced lesson: Grade 6-7 core knowledge first, then an accurately labelled Grade 8 extension. If the focus goes beyond NCERT Grade 8, state that scope limit and teach it as a useful extension without misrepresenting the curriculum.\nReturn strict JSON only with: summary (short research synthesis); grade6to7 (3-6 curriculum-appropriate concepts); grade8Extension (2-5 next-step concepts, and say if outside Grade 8 NCERT); scopeNote (important grade boundary/caveat); sources (up to 5 objects {title,url,relevance}, use real URLs you actually consulted). Do not quote textbook passages.`,
  });
  const raw = response.output_text;
  if (!raw) throw new Error("Curriculum research returned no usable content.");
  const value = parseJson(raw);
  const sources = Array.isArray(value.sources)
    ? value.sources.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
      .map((item) => ({
        title: shortText(item.title, "Curriculum source", 140),
        url: shortText(item.url, "", 500),
        relevance: shortText(item.relevance, "Curriculum reference", 200),
      }))
      .filter((item) => /^https:\/\//i.test(item.url)).slice(0, 5)
    : [];
  if (!sources.length) {
    sources.push({
      title: "NCERT Textbook Portal",
      url: "https://ncert.nic.in/textbook.php",
      relevance: "Official catalogue for checking current NCERT books and chapter coverage.",
    });
  }
  return {
    summary: shortText(value.summary, `Researched ${args.plan.title} for NCERT Grades 6-8.`, 900),
    grade6to7: cleanList(value.grade6to7, 6),
    grade8Extension: cleanList(value.grade8Extension, 5),
    scopeNote: shortText(value.scopeNote, "Use the concepts below as a grade-band guide, not a claim that every topic is named in a textbook chapter.", 500),
    sources,
    researchedAt: new Date().toISOString(),
  };
}
