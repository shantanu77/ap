export type StudyLevel = 5 | 6 | 7 | 8;
export type GeniusSubject = "chemistry" | "physics" | "biology" | "math";

export type GeniusBlock =
  | { type: "hero"; emoji: string; hook: string }
  | { type: "paragraph"; heading?: string; text: string }
  | { type: "key_fact"; emoji?: string; title: string; text: string }
  | { type: "steps"; title: string; items: Array<{ emoji: string; title: string; text: string }> }
  | { type: "comparison"; title: string; columns: Array<{ heading: string; text: string; emoji?: string }> }
  | { type: "vocabulary"; terms: Array<{ term: string; definition: string; example?: string }> }
  | { type: "analogy"; title: string; text: string; limit?: string }
  | {
      type: "diagram";
      diagram:
        | "rusting"
        | "particle-states"
        | "atom"
        | "dissolving"
        | "reaction"
        | "concept-map"
        | "process"
        | "before-after"
        | "particle-scene"
        | "scale"
        | "coordinate-grid";
      title: string;
      caption: string;
      labels?: string[];
    }
  | {
      type: "simulation";
      simulation:
        | "rust-conditions.v1"
        | "particle-states.v1"
        | "dissolving.v1"
        | "atom-builder.v1"
        | "ph-indicator.v1"
        | "mass-balance.v1"
        | "force-motion.v1"
        | "cell-explorer.v1"
        | "food-chain.v1";
      title: string;
      prompt: string;
    }
  | { type: "quick_check"; question: string; options: string[]; correctIndex: number; explanation: string }
  | { type: "remember"; points: string[] }
  | { type: "safety_note"; text: string }
  | {
      type: "math_worked_example";
      title: string;
      problem: string;
      steps: Array<{ label: string; working: string; explanation: string }>;
      answer: string;
    }
  | {
      type: "math_practice";
      title: string;
      problem: string;
      steps: Array<{ prompt: string; acceptedAnswers: string[]; hint: string; explanation: string }>;
      finalAnswer: string;
    };

export interface ExploreChoice {
  id: string;
  emoji: string;
  label: string;
  intent: string;
}

export interface GeniusNode {
  id: string;
  parentNodeId: string | null;
  nodeType: "INTRO" | "READ_MORE" | "QUESTION";
  promptLabel: string | null;
  title: string;
  studyLevel: StudyLevel;
  estimatedReadMinutes: number;
  blocks: GeniusBlock[];
  exploreChoices: ExploreChoice[];
  createdAt: string;
}

export interface GeniusContent {
  schemaVersion: "genius-exploration.v1";
  activeNodeId: string;
  nodes: GeniusNode[];
}

export interface GeniusExplorationDTO {
  id: string;
  subject: GeniusSubject;
  canonicalTopic: string;
  displayTitle: string;
  defaultLevel: StudyLevel;
  content: GeniusContent;
  savedSnapshot: GeniusContent | null;
  savedAt: string | null;
  createdAt: string;
  updatedAt: string;
  lastOpenedAt: string;
}

export interface SavedTopicSummary {
  id: string;
  subject: GeniusSubject;
  canonicalTopic: string;
  displayTitle: string;
  defaultLevel: StudyLevel;
  nodeCount: number;
  savedAt: string;
  lastOpenedAt: string;
  emoji: string;
  hasSimulation: boolean;
}
