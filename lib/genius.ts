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
  GeniusContent,
  GeniusExplorationDTO,
  GeniusNode,
  StudyLevel,
} from "@/types/genius";

function openAIClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

const CONTENT_RULES = `Return one child-friendly Chemistry learning node as strict JSON.
The learner is Aashvath. Adapt precisely to Grade STUDY_LEVEL (between 5 and 8).
Never return Markdown, HTML, URLs, or JavaScript. Keep paragraphs short and use relevant emoji.
Connect observations to particle ideas. Define new vocabulary. Do not encourage tasting, direct smelling,
mixing cleaners, flames, sealed reactions, strong chemicals, drug synthesis, explosives, or unsupervised experiments.
TEACHING RULES:
- Begin with the simplest concrete explanation, then build a thorough causal explanation of how and why it works.
- Include one safe, vivid, dramatic memory scene grounded in accurate science: use surprising scale, motion, stakes,
  contrast, or an everyday story a child can picture. Make it memorable without using fear, gore, or a false claim.
- Put that memory scene in an analogy or paragraph block. If it is an analogy, the limit must precisely explain where
  the comparison stops being scientifically accurate; never return placeholder text such as "where the analogy stops".
- Include one clearly scaffolded stretch insight that goes 1-2 grades beyond STUDY_LEVEL. Explain it in familiar words
  so the learner exceeds grade expectations without being overwhelmed.
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
- {"type":"diagram","diagram":"rusting|particle-states|atom|dissolving|reaction|concept-map|process|before-after|particle-scene|scale","title":"...","caption":"...","labels":["3-6 short, topic-specific labels"]}
- {"type":"simulation","simulation":"rust-conditions.v1|particle-states.v1|dissolving.v1|atom-builder.v1|ph-indicator.v1|mass-balance.v1","title":"...","prompt":"..."}
- {"type":"quick_check","question":"...","options":["..."],"correctIndex":0,"explanation":"..."}
- {"type":"remember","points":["..."]}
- {"type":"safety_note","text":"..."}
VISUAL RULES:
- Include one diagram unless a simulation already explains the central idea.
- The diagram must explain the exact topic in this node, not decorate it.
- Use rusting, particle-states, or atom only when that exact scientific model fits.
- Use dissolving only for a solute separating and spreading through a solvent; soap surrounding grease is a particle-scene.
- Otherwise choose: process for a sequence; before-after for a transformation; particle-scene for particle behavior;
  scale for an ordered range; or concept-map for relationships.
- For every context diagram, labels must contain 3-6 short labels specific to this explanation.
- Do not reuse generic labels such as "Observe, Model, Predict" unless the node is specifically about scientific method.
Only choose a simulation when it directly fits. Never invent a simulation ID.
Return:
{"title":"...","estimated_read_minutes":3,"blocks":[...],"explore_choices":[
{"id":"short-kebab-id","emoji":"...","label":"specific next question","intent":"precise generation intent"}
]}
Include 4-7 blocks and 2-4 specific explore choices.`;

async function requestGeneratedNode(prompt: string): Promise<unknown> {
  const client = openAIClient();
  if (!client) return null;

  const response = await client.chat.completions.create({
    model: process.env.GENIUS_MODEL || "gpt-4o",
    messages: [
      { role: "system", content: CONTENT_RULES },
      { role: "user", content: prompt },
    ],
    temperature: 0.65,
    max_tokens: 2200,
    response_format: { type: "json_object" },
  });

  const value = response.choices[0]?.message?.content;
  return value ? JSON.parse(value) : null;
}

export async function generateIntroduction(topic: string, level: StudyLevel): Promise<GeniusNode> {
  const fallback = createFallbackIntroduction(topic, level);
  if (isUnsafeChemistryRequest(topic)) return fallback;

  try {
    const raw = await requestGeneratedNode(
      `STUDY_LEVEL=${level}\nCreate the introduction to this Chemistry topic: "${topic}".
Start with a surprising hook, a simple explanation, an everyday connection, one useful visual block,
a vivid dramatic memory scene, one carefully explained stretch insight beyond Grade ${level},
a remember block, and specific directions for Read More.`
    );
    return normalizeGeneratedNode(raw, fallback, null, "INTRO", level);
  } catch (error) {
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
}): Promise<GeniusNode> {
  const fallback = createFallbackExpansion({
    topic: args.topic,
    level: args.level,
    parentNodeId: args.parentNode.id,
    label: args.label,
    intent: args.intent,
    nodeType: args.nodeType,
  });
  if (isUnsafeChemistryRequest(`${args.label} ${args.intent}`)) return fallback;

  try {
    const raw = await requestGeneratedNode(
      `STUDY_LEVEL=${args.level}
CHEMISTRY TOPIC="${args.topic}"
CURRENT NODE="${args.parentNode.title}"
LEARNER CHOSE/ASKED="${args.label}"
INTENT="${args.intent}"
ALREADY VISITED=${JSON.stringify(args.ancestorTitles)}
Create only the next learning node. Build on earlier ideas without repeating them. Explain simply but thoroughly,
and make the central idea memorable with a new dramatic, scientifically accurate example.`
    );
    return normalizeGeneratedNode(
      raw,
      fallback,
      args.parentNode.id,
      args.nodeType ?? "READ_MORE",
      args.level
    );
  } catch (error) {
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
    subject: "chemistry",
    canonicalTopic: record.canonicalTopic,
    displayTitle: record.displayTitle,
    defaultLevel: (record.defaultLevel >= 5 && record.defaultLevel <= 8
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

export async function findExploration(id: string) {
  const records = await prisma.$queryRaw<GeniusExplorationRecord[]>`
    SELECT id, subject, canonicalTopic, displayTitle, defaultLevel, content,
           savedSnapshot, savedAt, createdAt, updatedAt, lastOpenedAt
    FROM genius_explorations
    WHERE id = ${id} AND deletedAt IS NULL
    LIMIT 1
  `;
  return records[0] ?? null;
}

export async function createExplorationRecord(args: {
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
      (id, subject, canonicalTopic, displayTitle, defaultLevel, content, createdAt, updatedAt, lastOpenedAt)
    VALUES
      (${id}, ${args.subject}, ${args.canonicalTopic}, ${args.displayTitle}, ${args.defaultLevel},
       ${JSON.stringify(args.content)}, ${now}, ${now}, ${now})
  `;
  const record = await findExploration(id);
  if (!record) throw new Error("Exploration was not created.");
  return record;
}

export async function updateExplorationContent(id: string, content: GeniusContent) {
  const now = new Date();
  await prisma.$executeRaw`
    UPDATE genius_explorations
    SET content = ${JSON.stringify(content)}, updatedAt = ${now}, lastOpenedAt = ${now}
    WHERE id = ${id} AND deletedAt IS NULL
  `;
  const record = await findExploration(id);
  if (!record) throw new Error("Exploration was not found after update.");
  return record;
}

export async function touchExploration(id: string) {
  await prisma.$executeRaw`
    UPDATE genius_explorations SET lastOpenedAt = ${new Date()}
    WHERE id = ${id} AND deletedAt IS NULL
  `;
  const record = await findExploration(id);
  if (!record) throw new Error("Exploration was not found after update.");
  return record;
}

export async function renameExploration(id: string, title: string) {
  await prisma.$executeRaw`
    UPDATE genius_explorations SET displayTitle = ${title}, updatedAt = ${new Date()}
    WHERE id = ${id} AND deletedAt IS NULL
  `;
  const record = await findExploration(id);
  if (!record) throw new Error("Exploration was not found after update.");
  return record;
}

export async function saveExplorationSnapshot(id: string, content: GeniusContent) {
  const now = new Date();
  await prisma.$executeRaw`
    UPDATE genius_explorations
    SET savedSnapshot = ${JSON.stringify(content)}, savedAt = ${now}, updatedAt = ${now}, lastOpenedAt = ${now}
    WHERE id = ${id} AND deletedAt IS NULL
  `;
  const record = await findExploration(id);
  if (!record) throw new Error("Exploration was not found after save.");
  return record;
}

export async function softDeleteExploration(id: string) {
  await prisma.$executeRaw`
    UPDATE genius_explorations SET deletedAt = ${new Date()}, updatedAt = ${new Date()}
    WHERE id = ${id} AND deletedAt IS NULL
  `;
}

export async function listSavedExplorations(search: string) {
  const pattern = `%${search}%`;
  return prisma.$queryRaw<GeniusExplorationRecord[]>`
    SELECT id, subject, canonicalTopic, displayTitle, defaultLevel, content,
           savedSnapshot, savedAt, createdAt, updatedAt, lastOpenedAt
    FROM genius_explorations
    WHERE deletedAt IS NULL
      AND savedAt IS NOT NULL
      AND (${search} = '' OR displayTitle LIKE ${pattern} OR canonicalTopic LIKE ${pattern})
    ORDER BY savedAt DESC
    LIMIT 100
  `;
}
