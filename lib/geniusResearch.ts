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
  lessonPlan?: Array<{ section: string; gradeBand: string; learningGoal: string }>;
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
    input: `Research the first lesson for this NCERT-aligned school topic. Search official NCERT primary sources first: current textbooks, learning outcomes, syllabus and curriculum documents; consult authoritative subject sources only for scientific explanations. Never claim a topic is explicitly in a grade if the NCERT source does not establish it. Distinguish curriculum evidence from your pedagogical recommendation.\nSubject: ${args.subject}\nResolved chapter: ${args.plan.title} (${args.plan.canonicalTopic})\nStudent's specific focus: ${args.plan.focus}\nResearch queries: ${args.plan.searchTerms.join("; ")}\nTarget range: Grades 6-8. Build a balanced lesson: Grade 6-7 core knowledge first, then an accurately labelled Grade 8 extension. If the focus goes beyond NCERT Grade 8, state that scope limit and teach it as a useful conceptual preview without misrepresenting the curriculum.\nReturn strict JSON only with: summary (short research synthesis); grade6to7 (3-6 concepts actually suitable for these grades); grade8Extension (2-5 next-step concepts, explicitly say if outside Grade 8 NCERT); lessonPlan (8-10 objects {section,gradeBand,learningGoal} in an instructional sequence); scopeNote (important grade boundary/caveat); sources (up to 5 objects {title,url,relevance}, use real URLs you actually consulted, prioritizing NCERT). Do not quote textbook passages.`,
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
  if (args.subject === "chemistry" && args.plan.canonicalTopic === "chemical-bonding") {
    const officialSources = [
      {
        title: "NCERT Class VIII Science: Curiosity textbook catalogue",
        url: "https://ncert.nic.in/textbook.php?hecu1=0-12",
        relevance: "Check current Grade 8 science chapters and the matter/compound foundation; this is not a chemical-bonding chapter.",
      },
      {
        title: "NCERT Chemistry syllabus, Classes XI–XII: Chemical Bonding and Molecular Structure",
        url: "https://ncert.nic.in/pdf/syllabus/desm_s_Chemistry.pdf",
        relevance: "NCERT places formal chemical-bonding and molecular-structure study in the higher-secondary syllabus.",
      },
    ];
    for (const official of officialSources) {
      if (!sources.some((source) => source.url === official.url)) sources.unshift(official);
    }
    return {
      summary: "NCERT Grade 6–8 learning can establish ideas about matter, atoms, elements, compounds, and chemical change. Formal types of chemical bonds are not a dedicated Grade 8 NCERT chapter; ionic and covalent bonding should be taught here as a clearly labelled conceptual preview, with deeper models left for later study.",
      grade6to7: [
        "Use observations to distinguish materials and describe substances made from more than one element.",
        "Introduce atoms and elements as models for explaining what substances are made of, without requiring electron-shell rules.",
        "Explain that compounds contain different elements in definite combinations, using familiar formulas such as H2O and NaCl only as examples.",
        "Connect a chemical change to the rearrangement of particles while avoiding the claim that Grade 6–7 students must already know bond theory.",
      ],
      grade8Extension: [
        "Preview ionic bonding as electron transfer followed by attraction between oppositely charged ions, and covalent bonding as sharing electron pairs; label both as beyond the formal Grade 8 NCERT chapter.",
        "Use simple examples such as sodium chloride and water while explaining that diagrams are simplified models, not literal pictures of atoms.",
      ],
      lessonPlan: [
        { section: "Start with compounds", gradeBand: "6-7 foundation", learningGoal: "Relate familiar substances to elements combining in compounds." },
        { section: "What is a chemical bond?", gradeBand: "Conceptual bridge", learningGoal: "Define the attraction that holds atoms or ions together, while noting this is a preview beyond the formal Grade 8 chapter." },
        { section: "Ionic bonding", gradeBand: "Grade 8-style preview", learningGoal: "Show electron transfer and the attraction between positive and negative ions." },
        { section: "Covalent bonding", gradeBand: "Grade 8-style preview", learningGoal: "Show atoms sharing electron pairs, using water as a simple model." },
        { section: "Compare the two types", gradeBand: "Grade 8-style preview", learningGoal: "Contrast transfer and sharing, and connect each to a familiar compound." },
        { section: "Read a simple formula", gradeBand: "6-8 bridge", learningGoal: "Interpret atom ratios in a formula without inferring a full 3D structure." },
        { section: "Check a misconception", gradeBand: "6-8 bridge", learningGoal: "Distinguish an ionic lattice from a separate NaCl molecule and avoid overly literal shell pictures." },
        { section: "Choose a deeper path", gradeBand: "Optional 9-12", learningGoal: "Offer electronegativity, Lewis structures, and molecular shape as later study, not prerequisites." },
      ],
      scopeNote: "NCERT's current Grade 8 science does not teach a formal chapter on ionic and covalent bond types. They are included because the learner explicitly asked for them, and are clearly presented as a conceptual preview. NCERT formal chemical bonding appears in the Classes XI–XII Chemistry syllabus.",
      sources: sources.slice(0, 5),
      researchedAt: new Date().toISOString(),
    };
  }
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
    lessonPlan: Array.isArray(value.lessonPlan)
      ? value.lessonPlan.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
        .map((item) => ({ section: shortText(item.section, "Chapter section", 100), gradeBand: shortText(item.gradeBand, "Grades 6-8", 60), learningGoal: shortText(item.learningGoal, "Build the next concept.", 200) }))
        .slice(0, 10)
      : [],
    scopeNote: shortText(value.scopeNote, "Use the concepts below as a grade-band guide, not a claim that every topic is named in a textbook chapter.", 500),
    sources,
    researchedAt: new Date().toISOString(),
  };
}
