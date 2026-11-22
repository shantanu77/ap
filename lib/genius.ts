import OpenAI from "openai";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  createFallbackExpansion,
  createFallbackIntroduction,
  isGeniusContent,
  isUnsafeChemistryRequest,
  normalizeGeneratedNode,
} from "@/lib/geniusContent";
import type {
  GeniusBlock,
  GeniusContent,
  GeniusExplorationDTO,
  GeniusNode,
  GeniusSubject,
  StudyLevel,
} from "@/types/genius";
import type { GeniusCurriculumResearch } from "@/lib/geniusResearch";

const GENIUS_LESSON_CACHE_VERSION = 6;
const GENIUS_DEEP_DIVE_CACHE_VERSION = 7;

function openAIClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

function contentRules(subject: GeniusSubject): string {
  const subjectName = subject[0].toUpperCase() + subject.slice(1);
  const modelGuidance = subject === "physics"
    ? "Connect observations to forces, energy, motion, waves, fields, or matter as appropriate. Use measurable cause and effect and define quantities and units."
    : subject === "biology"
      ? "Connect visible traits and processes to cells, organs, body systems, ecosystems, inheritance, or evolution as appropriate. Explain structure and function without giving medical diagnosis or treatment."
      : subject === "math"
        ? "Teach NCERT-aligned mathematics for the selected grade. Explain why each method works, not only the rule. Use LaTeX notation for mathematical expressions, verify every calculation, and distinguish the reasoning step from the arithmetic step."
        : "Connect observations to particles, substances, energy, and reactions as appropriate.";
  return `Return one child-friendly ${subjectName} learning node as strict JSON.
Teach a Grade 6-8 band: establish Grade 6 foundations, build them into Grade 7 understanding, and add a clearly labelled Grade 8 extension. A student's selected grade is a starting point, not a reason to omit the rest of the core chapter. Never assume or hard-code the learner's name or personal details.
Never return Markdown, HTML, URLs, or JavaScript. Keep paragraphs short and use relevant emoji.
NOTATION RULES: Use LaTeX delimiters for every mathematical expression that benefits from typesetting: inline as \\( ... \\), displayed on its own line as \\[ ... \\]. Write fractions with \\frac{numerator}{denominator}, powers with ^{...}, roots with \\sqrt{...}, and equations with standard LaTeX. For chemical formulae and reactions use mhchem inside math delimiters, for example \\(\\ce{H2O}\\), \\[\\ce{2H2 + O2 -> 2H2O}\\]. Use this for formulas in Math, Chemistry, Physics, and Biology. In strict JSON, escape each LaTeX backslash as \\\\ in the serialized JSON string. Do not use Unicode approximations when a clear formula is appropriate.
${modelGuidance} Define new vocabulary. Do not encourage tasting, direct smelling,
mixing cleaners, flames, sealed reactions, strong chemicals, drug synthesis, explosives, or unsupervised experiments.
For Physics, avoid mains electricity, dangerous projectiles, lasers, heights, fire, or high-pressure builds.
For Biology, avoid self-experimentation, culturing microbes, handling bodily fluids, dissection, wild-organism contact, or medical advice.
TEACHING RULES:
- Begin with the simplest concrete explanation, then build a thorough causal explanation of how and why it works.
- Include one safe, vivid, dramatic memory scene grounded in accurate science: use surprising scale, motion, stakes,
  contrast, or an everyday story a child can picture. Make it memorable without using fear, gore, or a false claim.
- Put that memory scene in an analogy or paragraph block. If it is an analogy, the limit must precisely explain where
  the comparison stops being scientifically accurate; never return placeholder text such as "where the analogy stops".
- Include a clearly marked "Grade 8 extension" without replacing the Grade 6-7 foundation.
- If the requested idea goes beyond Grade 8 curriculum, label it as an optional advanced extension and state the boundary honestly.
- Prefer concrete examples over generic statements. Explain every technical word when it first appears.
- Finish with 2-4 concise remember points that capture the causal idea, the memory scene, and the stretch insight.
Use only these blocks:
- {"type":"hero","emoji":"...","hook":"..."}
- {"type":"paragraph","heading":"...","text":"..."}
- {"type":"key_fact","emoji":"...","title":"...","text":"..."}
- {"type":"steps","title":"...","items":[{"emoji":"...","title":"...","text":"..."}]}
- {"type":"comparison","title":"...","columns":[{"emoji":"...","heading":"...","text":"..."}]}
- {"type":"vocabulary","terms":[{"term":"...","definition":"...","example":"..."}]}
- {"type":"analogy","title":"...","text":"...","limit":"where the analogy stops"}
- {"type":"diagram","diagram":"rusting|particle-states|atom|dissolving|reaction|concept-map|process|before-after|particle-scene|scale|coordinate-grid","title":"...","caption":"...","labels":["3-6 short, topic-specific labels"],"details":["topic-specific explanation for label 1","topic-specific explanation for label 2", "...one explanation per label in the same order"]}
- {"type":"simulation","simulation":"rust-conditions.v1|particle-states.v1|dissolving.v1|atom-builder.v1|ph-indicator.v1|mass-balance.v1|force-motion.v1|gravity-field.v1|compound-bonding.v1|battery-circuit.v1|cell-explorer.v1|food-chain.v1","title":"...","prompt":"..."}
- {"type":"quick_check","question":"...","options":["..."],"correctIndex":0,"explanation":"..."}
- {"type":"remember","points":["..."]}
- {"type":"safety_note","text":"..."}
- {"type":"math_worked_example","title":"...","problem":"...","steps":[{"label":"Step 1","working":"...","explanation":"why this step is valid"}],"answer":"..."}
- {"type":"math_practice","title":"...","problem":"...","steps":[{"prompt":"one intermediate question","acceptedAnswers":["exact answer","equivalent answer"],"hint":"specific hint","explanation":"why"}],"finalAnswer":"..."}
VISUAL RULES:
- Every safe learning node must include an interactive visual. For gravity or gravitation use gravity-field.v1; for compounds, molecules, or chemical bonds use compound-bonding.v1; for motion use force-motion.v1; for electrical circuits, batteries, bulbs, or current use battery-circuit.v1.
- Prefer an approved interactive simulation whenever one fits. Do not substitute a static diagram for one of these topic-specific simulations.
- If using a diagram, provide 3-6 short labels naming distinct visible parts and a details entry for every label, in the same order. Each detail must be 50-80 words in 3-5 clear sentences: explain the part, how or why it works in this topic, and a concrete consequence or example. Keep every detail specific to its label; never repeat the label, pad with generic facts, or use directions such as "look at the picture". Selecting a label visibly highlights it and displays its matching explanation.
- Prefer an approved simulation over a static diagram when the learner can understand the concept by changing a variable,
  making a prediction, or observing cause and effect. Never invent a simulation ID just to satisfy this preference.
- Include one diagram unless a simulation already explains the central idea.
- Use battery-circuit.v1 only for batteries, electric cells, voltage, current, bulbs, or simple circuits. Use force-motion.v1 only for force, mass, acceleration, speed, or motion.
- Use gravity-field.v1 only for gravity, gravitation, gravitational pull, or weight on another planet. Use compound-bonding.v1 only for compounds, molecules, or chemical bonds.
- The diagram must explain the exact topic in this node, not decorate it.
- Use rusting, particle-states, or atom only when that exact scientific model fits.
- Use dissolving only for a solute separating and spreading through a solvent; soap surrounding grease is a particle-scene.
- Otherwise choose: process for a sequence; before-after for a transformation; particle-scene for particle behavior;
  scale for an ordered range; or concept-map for relationships.
- For every context diagram, labels must contain 3-6 short labels specific to this explanation.
- Do not reuse generic labels such as "Observe, Model, Predict" unless the node is specifically about scientific method.
Only choose a simulation when it directly fits. Never invent a simulation ID.
MATH RULES:
- For Math nodes, always include exactly one math_worked_example and one math_practice block.
- Break the worked example into small, ordered steps and explain why each operation is chosen.
- The practice problem must use different numbers but the same method. Each practice step must have all reasonable equivalent accepted answers.
- Include a diagram for number lines, fractions, geometry, data, graphs, or place value when it improves understanding.
- For coordinate graphs use coordinate-grid and put plotted points in labels as exact strings like "(2, 3)". For a number line use scale with ordered labels.
- Check all arithmetic internally before returning JSON. Never reveal the practice final answer before its steps are attempted.
Return:
{"title":"...","estimated_read_minutes":3,"blocks":[...],"explore_choices":[
{"id":"short-kebab-id","emoji":"...","label":"specific next question","intent":"precise generation intent","level":6}
]}
For an INTRO chapter, create 8-16 concise, distinct blocks and aim for 500-700 useful words across the lesson. For an expansion, create 5-10 blocks and aim for 220-350 useful words. Do not count diagram label details as a substitute for the visible explanation. Include 2-4 specific explore choices. The level is the learner's requested depth (6-8 for the core band, or 9-12 for an optional advanced deep dive). Include at least one clearly optional advanced deep-dive choice when useful, set its level to 9-12, and keep that material out of the required Grade 6-8 lesson.`;
}

async function requestGeneratedNode(prompt: string, subject: GeniusSubject, maxTokens = 3000): Promise<unknown> {
  const client = openAIClient();
  if (!client) return null;

  const response = await client.chat.completions.create({
    model: process.env.GENIUS_MODEL || "gpt-4o",
    messages: [
      { role: "system", content: contentRules(subject) },
      { role: "user", content: prompt },
    ],
    temperature: 0.65,
    max_tokens: maxTokens,
    response_format: { type: "json_object" },
  });

  const value = response.choices[0]?.message?.content;
  return value ? JSON.parse(value) : null;
}

async function requestSupplementalParagraphs(args: {
  subject: GeniusSubject;
  topic: string;
  focus: string;
  level: StudyLevel;
  research?: GeniusCurriculumResearch;
  existingBlocks: GeniusBlock[];
  minimumWords: number;
}): Promise<GeniusBlock[]> {
  const client = openAIClient();
  if (!client) return [];
  const response = await client.chat.completions.create({
    model: process.env.GENIUS_MODEL || "gpt-4o",
    temperature: 0.45,
    max_tokens: 1800,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You expand a child-safe, research-grounded ${args.subject} lesson for Grades 6-8. Return strict JSON with a blocks array containing exactly two supported paragraph blocks {type:"paragraph",heading:"...",text:"..."}. Each paragraph should be 100-160 words, add a distinct missing lesson-plan section, and avoid repeating any existing section. Keep vocabulary defined, explanations scientifically correct, and any beyond-Grade-8 idea clearly labelled as an extension. Use LaTeX delimited by \\( ... \\) or \\[ ... \\] for mathematics, and mhchem \\ce{...} inside math delimiters for chemical formulae and reactions; JSON strings must escape backslashes. No Markdown, HTML, URLs, experiments, or unsafe directions.`,
      },
      {
        role: "user",
        content: `Chapter: ${args.topic}\nQuestion focus: ${args.focus}\nTarget starting grade: ${args.level}\nCurriculum research: ${JSON.stringify(args.research ?? {})}\nAlready visible blocks: ${JSON.stringify(args.existingBlocks)}\nAdd at least ${args.minimumWords} NEW useful words as exactly two concise paragraphs. Cover the least-developed remaining lesson-plan sections, add a concrete comparison/example, and make the chapter more complete. Do not repeat definitions or facts already visible.`,
      },
    ],
  });
  const raw = response.choices[0]?.message?.content;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as { blocks?: unknown };
    return Array.isArray(parsed.blocks)
      ? parsed.blocks.filter((block): block is { type: "paragraph"; heading: string; text: string } =>
          Boolean(block && typeof block === "object" && (block as Record<string, unknown>).type === "paragraph"
            && typeof (block as Record<string, unknown>).text === "string"))
        .map((block) => ({ type: "paragraph" as const, heading: String(block.heading ?? "A closer look").slice(0, 100), text: String(block.text).slice(0, 1200) }))
        .slice(0, 2)
      : [];
  } catch {
    return [];
  }
}

function generatedNodeWordCount(value: unknown): number {
  if (!value || typeof value !== "object") return 0;
  const object = value as Record<string, unknown>;
  const blocks = Array.isArray(object.blocks) ? object.blocks : [];
  const visible: string[] = [];
  const hiddenKeys = new Set(["type", "emoji", "simulation", "diagram", "id", "level", "labels", "details"]);
  const collect = (part: unknown, key = "") => {
    if (typeof part === "string") {
      if (!hiddenKeys.has(key)) visible.push(part);
      return;
    }
    if (Array.isArray(part)) {
      part.forEach((item) => collect(item, key));
      return;
    }
    if (part && typeof part === "object") {
      for (const [childKey, child] of Object.entries(part as Record<string, unknown>)) collect(child, childKey);
    }
  };
  blocks.forEach((block) => collect(block));
  const words = visible.join(" ").match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu);
  return words?.length ?? 0;
}

export async function generateIntroduction(topic: string, level: StudyLevel, subject: GeniusSubject = "chemistry", research?: GeniusCurriculumResearch, focus = topic): Promise<GeniusNode> {
  const fallback = createFallbackIntroduction(topic, level, subject);
  if (subject === "chemistry" && isUnsafeChemistryRequest(topic)) return fallback;

  try {
    const prompt = `STUDY_BAND=Grades 6-8 (learner selected Grade ${level} as a starting point)\nSUBJECT=${subject}\nCHAPTER=${topic}\nSTUDENT_FOCUS=${focus}\nRESEARCHED_LESSON_PLAN=${JSON.stringify(research ?? {})}\nCreate the opening to a comprehensive chapter lesson of at least 500 useful visible words. Use 8-10 concise, distinct cards so the lesson is detailed but scannable. Answer the exact student focus explicitly near the beginning, then cover related chapter foundations so common questions can be answered from this lesson. Follow the researched lesson plan. Establish Grade 6 foundations, build to Grade 7 reasoning, and include a clearly labelled Grade 8 extension. Cover key subtopics, vocabulary, examples, misconceptions, and a useful visual. If the requested concept exceeds NCERT Grade 8 scope, state that boundary gently and make further depth choice-based. Do not count labels or source metadata toward the minimum.`;
    let raw = await requestGeneratedNode(prompt, subject, 4200);
    const initialWords = generatedNodeWordCount(raw);
    if (research && initialWords < 500) {
      raw = await requestGeneratedNode(`${prompt}\n\nQUALITY RETRY: The previous draft contained only ${initialWords} visible lesson words. Expand the explanations, examples, and comparisons to at least 500 visible words. Do not count diagram labels/details. Preserve and expand this draft instead of starting over: ${JSON.stringify(raw)}`, subject, 4600);
    }
    let node = normalizeGeneratedNode(raw, fallback, null, "INTRO", level, `${topic} ${subject}`);
    let finalWords = generatedNodeWordCount(node);
    for (let attempt = 0; research && finalWords < 500 && attempt < 3; attempt += 1) {
      const supplement = await requestSupplementalParagraphs({ subject, topic, focus, level, research, existingBlocks: node.blocks, minimumWords: 500 - finalWords });
      node = normalizeGeneratedNode({ title: node.title, blocks: [...node.blocks, ...supplement], explore_choices: node.exploreChoices }, fallback, null, "INTRO", level, `${topic} ${subject}`);
      finalWords = generatedNodeWordCount(node);
    }
    if (research && finalWords < 500) throw new Error(`The researched chapter draft was too short (${finalWords} visible words); refusing to cache it.`);
    return node;
  } catch (error) {
    if (research) throw error;
    console.error("Genius Corner introduction generation failed; using reviewed fallback:", error);
    return fallback;
  }
}

export async function generateExpansion(args: {
  topic: string;
  level: StudyLevel;
  parentNode: GeniusNode;
  label: string;
  intent: string;
  nodeType?: GeniusNode["nodeType"];
  ancestorTitles: string[];
  subject: GeniusSubject;
  curriculumResearch?: GeniusCurriculumResearch;
}): Promise<GeniusNode> {
  const fallback = createFallbackExpansion({
    topic: args.topic,
    level: args.level,
    parentNodeId: args.parentNode.id,
    label: args.label,
    intent: args.intent,
    nodeType: args.nodeType,
    subject: args.subject,
  });
  if (args.subject === "chemistry" && isUnsafeChemistryRequest(`${args.label} ${args.intent}`)) return fallback;

  try {
    const prompt = `STUDY_LEVEL=${args.level}
SUBJECT=${args.subject}
TOPIC="${args.topic}"
CURRICULUM_RESEARCH="${JSON.stringify(args.curriculumResearch ?? {})}"
CURRENT NODE="${args.parentNode.title}"
LEARNER CHOSE/ASKED="${args.label}"
INTENT="${args.intent}"
ALREADY VISITED=${JSON.stringify(args.ancestorTitles)}
Create only the next learning node. Interpret the query carefully and answer the exact requested idea first. Build on earlier ideas without repeating them. Match the explicit target level, which may extend beyond Grade 8 when the learner chooses a deep dive, while supplying any essential Grade 6-7 foundation. Use the researched curriculum where relevant and say when the explanation goes beyond NCERT Grade 8. Use LaTeX delimited by \\( ... \\) or \\[ ... \\] for math, and mhchem \\ce{...} inside math delimiters for chemical formulas and reactions; escape backslashes in JSON strings. Make this a substantial focused mini-lesson of at least 220 words across 5-8 blocks. Include 2-3 explanatory paragraphs of roughly 50-85 words, a concrete example or analogy, a misconception correction, a useful visual and concise takeaways. Explain the mechanism and why it matters for this exact question. Avoid repeated facts, generic filler, or inappropriate oversimplification.`;
    let raw = await requestGeneratedNode(prompt, args.subject, 3000);
    const initialWords = generatedNodeWordCount(raw);
    if (args.curriculumResearch && initialWords < 220) {
      raw = await requestGeneratedNode(`${prompt}\n\nQUALITY RETRY: The previous draft had only ${initialWords} visible words. Expand the specific explanation and example to at least 220 useful words. Do not count diagram labels/details or pad with repetition. Preserve and expand this draft: ${JSON.stringify(raw)}`, args.subject, 3400);
    }
    let node = normalizeGeneratedNode(
      raw,
      fallback,
      args.parentNode.id,
      args.nodeType ?? "READ_MORE",
      args.level,
      `${args.topic} ${args.parentNode.title} ${args.label} ${args.intent} ${args.subject}`
    );
    let finalWords = generatedNodeWordCount(node);
    for (let attempt = 0; args.curriculumResearch && finalWords < 220 && attempt < 3; attempt += 1) {
      const supplement = await requestSupplementalParagraphs({ subject: args.subject, topic: args.topic, focus: `${args.label}. ${args.intent}`, level: args.level, research: args.curriculumResearch, existingBlocks: node.blocks, minimumWords: 220 - finalWords });
      node = normalizeGeneratedNode({ title: node.title, blocks: [...node.blocks, ...supplement], explore_choices: node.exploreChoices }, fallback, args.parentNode.id, args.nodeType ?? "READ_MORE", args.level,
        `${args.topic} ${args.parentNode.title} ${args.label} ${args.intent} ${args.subject}`);
      finalWords = generatedNodeWordCount(node);
    }
    if (args.curriculumResearch && finalWords < 220) throw new Error(`The researched deep dive was too short (${finalWords} visible words).`);
    return node;
  } catch (error) {
    if (args.curriculumResearch) throw error;
    console.error("Genius Corner expansion generation failed; using reviewed fallback:", error);
    return fallback;
  }
}

export function jsonContent(content: GeniusContent): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(content)) as Prisma.InputJsonValue;
}

export function contentFromJson(value: unknown): GeniusContent {
  if (typeof value === "string") {
    return contentFromJson(JSON.parse(value));
  }
  if (!isGeniusContent(value)) {
    throw new Error("This exploration contains an unsupported content version.");
  }
  return value;
}

export type GeniusExplorationRecord = {
  id: string;
  kidId: string;
  subject: string;
  canonicalTopic: string;
  displayTitle: string;
  defaultLevel: number;
  content: unknown;
  savedSnapshot: unknown | null;
  savedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  lastOpenedAt: Date;
};

export function toExplorationDTO(record: GeniusExplorationRecord): GeniusExplorationDTO {
  return {
    id: record.id,
    subject: record.subject === "physics" || record.subject === "biology" || record.subject === "math" ? record.subject : "chemistry",
    canonicalTopic: record.canonicalTopic,
    displayTitle: record.displayTitle,
    defaultLevel: (record.defaultLevel >= 6 && record.defaultLevel <= 8
      ? record.defaultLevel
      : 6) as StudyLevel,
    content: contentFromJson(record.content),
    savedSnapshot: record.savedSnapshot ? contentFromJson(record.savedSnapshot) : null,
    savedAt: record.savedAt?.toISOString() ?? null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    lastOpenedAt: record.lastOpenedAt.toISOString(),
  };
}

export async function findExploration(id: string, kidId: string) {
  const records = await prisma.$queryRaw<GeniusExplorationRecord[]>`
    SELECT id, kidId, subject, canonicalTopic, displayTitle, defaultLevel, content,
           savedSnapshot, savedAt, createdAt, updatedAt, lastOpenedAt
    FROM genius_explorations
    WHERE id = ${id} AND kidId = ${kidId} AND deletedAt IS NULL
    LIMIT 1
  `;
  return records[0] ?? null;
}

type LessonCacheRecord = {
  canonicalTopic: string;
  displayTitle: string;
  content: unknown;
  createdAt: Date;
};

type DeepDiveCacheRecord = { queryText: string; embedding: unknown; node: unknown };

export async function findCachedLesson(subject: GeniusSubject, canonicalTopic: string) {
  const rows = await prisma.$queryRaw<LessonCacheRecord[]>`
    SELECT canonicalTopic, displayTitle, content, createdAt
    FROM genius_lesson_cache
    WHERE subject = ${subject} AND canonicalTopic = ${canonicalTopic} AND contentVersion = ${GENIUS_LESSON_CACHE_VERSION}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function cacheLesson(args: {
  subject: GeniusSubject;
  canonicalTopic: string;
  displayTitle: string;
  content: GeniusContent;
}) {
  await prisma.$executeRaw`
    INSERT IGNORE INTO genius_lesson_cache
      (id, subject, canonicalTopic, displayTitle, content, contentVersion, createdAt)
    VALUES (${crypto.randomUUID()}, ${args.subject}, ${args.canonicalTopic}, ${args.displayTitle}, ${JSON.stringify(args.content)}, ${GENIUS_LESSON_CACHE_VERSION}, ${new Date()})
  `;
}

export async function embedDeepDive(subject: GeniusSubject, canonicalTopic: string, query: string): Promise<number[] | null> {
  const client = openAIClient();
  if (!client) return null;
  const response = await client.embeddings.create({
    model: process.env.GENIUS_EMBEDDING_MODEL || "text-embedding-3-small",
    input: `${subject} | ${canonicalTopic} | ${query}`.slice(0, 2000),
  });
  return response.data[0]?.embedding ?? null;
}

function cosineSimilarity(left: number[], right: number[]): number {
  if (!left.length || left.length !== right.length) return 0;
  let dot = 0;
  let leftSize = 0;
  let rightSize = 0;
  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index];
    leftSize += left[index] ** 2;
    rightSize += right[index] ** 2;
  }
  return leftSize && rightSize ? dot / Math.sqrt(leftSize * rightSize) : 0;
}

export async function findSimilarDeepDive(args: {
  subject: GeniusSubject;
  canonicalTopic: string;
  level: StudyLevel;
  embedding: number[];
  threshold?: number;
}) {
  const rows = await prisma.$queryRaw<DeepDiveCacheRecord[]>`
    SELECT queryText, embedding, node
    FROM genius_deep_dive_cache
    WHERE subject = ${args.subject} AND canonicalTopic = ${args.canonicalTopic} AND studyLevel = ${args.level} AND contentVersion = ${GENIUS_DEEP_DIVE_CACHE_VERSION}
    ORDER BY createdAt DESC
    LIMIT 150
  `;
  const threshold = args.threshold ?? Number(process.env.GENIUS_DEEP_DIVE_SIMILARITY || 0.88);
  let best: { record: DeepDiveCacheRecord; score: number } | null = null;
  for (const record of rows) {
    const candidate = Array.isArray(record.embedding) ? record.embedding.map(Number) : [];
    const score = cosineSimilarity(args.embedding, candidate);
    if (score >= threshold && (!best || score > best.score)) best = { record, score };
  }
  return best;
}

export async function cacheDeepDive(args: {
  subject: GeniusSubject;
  canonicalTopic: string;
  level: StudyLevel;
  queryText: string;
  embedding: number[];
  node: GeniusNode;
}) {
  await prisma.$executeRaw`
    INSERT INTO genius_deep_dive_cache
      (id, subject, canonicalTopic, studyLevel, queryText, embedding, node, contentVersion, createdAt)
    VALUES (${crypto.randomUUID()}, ${args.subject}, ${args.canonicalTopic}, ${args.level}, ${args.queryText},
      ${JSON.stringify(args.embedding)}, ${JSON.stringify(args.node)}, ${GENIUS_DEEP_DIVE_CACHE_VERSION}, ${new Date()})
  `;
}

export async function createExplorationRecord(args: {
  kidId: string;
  subject: string;
  canonicalTopic: string;
  displayTitle: string;
  defaultLevel: StudyLevel;
  content: GeniusContent;
}) {
  const id = crypto.randomUUID();
  const now = new Date();
  await prisma.$executeRaw`
    INSERT INTO genius_explorations
      (id, kidId, subject, canonicalTopic, displayTitle, defaultLevel, content, createdAt, updatedAt, lastOpenedAt)
    VALUES
      (${id}, ${args.kidId}, ${args.subject}, ${args.canonicalTopic}, ${args.displayTitle}, ${args.defaultLevel},
       ${JSON.stringify(args.content)}, ${now}, ${now}, ${now})
  `;
  const record = await findExploration(id, args.kidId);
  if (!record) throw new Error("Exploration was not created.");
  return record;
}

export async function updateExplorationContent(id: string, kidId: string, content: GeniusContent) {
  const now = new Date();
  await prisma.$executeRaw`
    UPDATE genius_explorations
    SET content = ${JSON.stringify(content)}, updatedAt = ${now}, lastOpenedAt = ${now}
    WHERE id = ${id} AND kidId = ${kidId} AND deletedAt IS NULL
  `;
  const record = await findExploration(id, kidId);
  if (!record) throw new Error("Exploration was not found after update.");
  return record;
}

export async function touchExploration(id: string, kidId: string) {
  await prisma.$executeRaw`
    UPDATE genius_explorations SET lastOpenedAt = ${new Date()}
    WHERE id = ${id} AND kidId = ${kidId} AND deletedAt IS NULL
  `;
  const record = await findExploration(id, kidId);
  if (!record) throw new Error("Exploration was not found after update.");
  return record;
}

export async function renameExploration(id: string, kidId: string, title: string) {
  await prisma.$executeRaw`
    UPDATE genius_explorations SET displayTitle = ${title}, updatedAt = ${new Date()}
    WHERE id = ${id} AND kidId = ${kidId} AND deletedAt IS NULL
  `;
  const record = await findExploration(id, kidId);
  if (!record) throw new Error("Exploration was not found after update.");
  return record;
}

export async function saveExplorationSnapshot(id: string, kidId: string, content: GeniusContent) {
  const now = new Date();
  await prisma.$executeRaw`
    UPDATE genius_explorations
    SET savedSnapshot = ${JSON.stringify(content)}, savedAt = ${now}, updatedAt = ${now}, lastOpenedAt = ${now}
    WHERE id = ${id} AND kidId = ${kidId} AND deletedAt IS NULL
  `;
  const record = await findExploration(id, kidId);
  if (!record) throw new Error("Exploration was not found after save.");
  return record;
}

export async function softDeleteExploration(id: string, kidId: string) {
  await prisma.$executeRaw`
    UPDATE genius_explorations SET deletedAt = ${new Date()}, updatedAt = ${new Date()}
    WHERE id = ${id} AND kidId = ${kidId} AND deletedAt IS NULL
  `;
}

export async function listSavedExplorations(kidId: string, search: string) {
  const pattern = `%${search}%`;
  return prisma.$queryRaw<GeniusExplorationRecord[]>`
    SELECT id, kidId, subject, canonicalTopic, displayTitle, defaultLevel, content,
           savedSnapshot, savedAt, createdAt, updatedAt, lastOpenedAt
    FROM genius_explorations
    WHERE kidId = ${kidId} AND deletedAt IS NULL
      AND savedAt IS NOT NULL
      AND (${search} = '' OR displayTitle LIKE ${pattern} OR canonicalTopic LIKE ${pattern})
    ORDER BY savedAt DESC
    LIMIT 100
  `;
}
