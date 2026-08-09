import type { GeniusNode } from "@/types/genius";

export interface LearningSummarySection {
  nodeId: string;
  title: string;
  points: string[];
}

export function learningSummaryForNodes(nodes: GeniusNode[]): LearningSummarySection[] {
  return nodes.map((node) => {
    const remembered = node.blocks.flatMap((block) => block.type === "remember" ? block.points : []);
    const fallback = node.blocks.flatMap((block) => {
      if (block.type === "hero") return [block.hook];
      if (block.type === "key_fact") return [`${block.title}: ${block.text}`];
      return [];
    });
    return {
      nodeId: node.id,
      title: node.title,
      points: (remembered.length > 0 ? remembered : fallback).slice(0, 4),
    };
  }).filter((section) => section.points.length > 0);
}

export function summaryNarrationForNodes(nodes: GeniusNode[]): string {
  const sections = learningSummaryForNodes(nodes);
  return [
    "Here is your saved learning summary.",
    ...sections.map((section) => `${section.title}. ${section.points.join(" ")}`),
  ].join(" ");
}

export function narrationForNode(node: GeniusNode): string {
  const details: string[] = [];
  const recap: string[] = [];

  node.blocks.forEach((block) => {
    if (block.type === "hero") details.push(`Here is the big idea. ${block.hook}`);
    if (block.type === "paragraph") details.push(`${block.heading ? `${block.heading}. ` : ""}${block.text}`);
    if (block.type === "key_fact") details.push(`An important fact. ${block.title}. ${block.text}`);
    if (block.type === "steps") {
      details.push(`${block.title}. ${block.items.map((item, index) => `Step ${index + 1}. ${item.title}. ${item.text}`).join(" ")}`);
    }
    if (block.type === "comparison") {
      details.push(`${block.title}. Let us compare them. ${block.columns.map((column) => `${column.heading}. ${column.text}`).join(" ")}`);
    }
    if (block.type === "vocabulary") {
      details.push(`Useful words. ${block.terms.map((term) => `${term.term} means ${term.definition}${term.example ? ` For example, ${term.example}` : ""}`).join(" ")}`);
    }
    if (block.type === "analogy") {
      details.push(`Here is a helpful analogy. ${block.title}. ${block.text}${block.limit ? ` Remember where the analogy stops. ${block.limit}` : ""}`);
    }
    if (block.type === "diagram") {
      details.push(`Picture this. ${block.title}. ${block.caption}${block.labels?.length ? ` Look for ${block.labels.join(", ")}.` : ""}`);
    }
    if (block.type === "simulation") details.push(`Try the interactive model called ${block.title}. ${block.prompt}`);
    if (block.type === "quick_check") details.push(`Now pause for a quick check. ${block.question}`);
    if (block.type === "remember") recap.push(...block.points);
    if (block.type === "safety_note") details.push(`Safety note. ${block.text}`);
  });

  const summary = recap.length > 0 ? `To summarize, remember these ideas. ${recap.join(" ")}` : "";
  return [`Let us explore ${node.title}.`, ...details, summary].filter(Boolean).join(" ");
}
