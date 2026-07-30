import type {
  ExploreChoice,
  GeniusBlock,
  GeniusContent,
  GeniusNode,
  StudyLevel,
} from "@/types/genius";

const APPROVED_SIMULATIONS = new Set([
  "rust-conditions.v1",
  "particle-states.v1",
  "dissolving.v1",
  "atom-builder.v1",
  "ph-indicator.v1",
  "mass-balance.v1",
]);

const BLOCK_TYPES = new Set([
  "hero",
  "paragraph",
  "key_fact",
  "steps",
  "comparison",
  "vocabulary",
  "analogy",
  "diagram",
  "simulation",
  "quick_check",
  "remember",
  "safety_note",
]);

export function toStudyLevel(value: unknown): StudyLevel {
  const number = Number(value);
  return number === 5 || number === 6 || number === 7 || number === 8 ? number : 6;
}

export function cleanTopic(value: unknown): string {
  return String(value ?? "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

export function canonicalizeTopic(topic: string): string {
  return topic
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100) || "chemistry-topic";
}

export function displayTitleForTopic(topic: string): string {
  const trimmed = topic.replace(/[?.!]+$/, "").trim();
  const title = trimmed.replace(/\b\w/g, (character) => character.toUpperCase());
  return `${title || "Chemistry Mystery"} ⚗️`;
}

export function isUnsafeChemistryRequest(topic: string): boolean {
  return /\b(explosive|bomb|poison|toxic gas|weapon|meth|drug synthesis|make chlorine|mix bleach|bleach and ammonia|thermite|napalm|gunpowder|detonat|strong acid at home)\b/i.test(
    topic
  );
}

function choice(id: string, emoji: string, label: string, intent: string): ExploreChoice {
  return { id, emoji, label, intent };
}

function nodeBase(
  title: string,
  level: StudyLevel,
  nodeType: GeniusNode["nodeType"],
  parentNodeId: string | null,
  promptLabel: string | null,
  blocks: GeniusBlock[],
  exploreChoices: ExploreChoice[]
): GeniusNode {
  return {
    id: crypto.randomUUID(),
    parentNodeId,
    nodeType,
    promptLabel,
    title,
    studyLevel: level,
    estimatedReadMinutes: Math.max(2, Math.min(6, Math.ceil(blocks.length / 2))),
    blocks,
    exploreChoices,
    createdAt: new Date().toISOString(),
  };
}

function rustNode(level: StudyLevel): GeniusNode {
  return nodeBase(
    "Why Does Iron Rust? 🔩🟠",
    level,
    "INTRO",
    null,
    null,
    [
      { type: "hero", emoji: "🔩", hook: "That orange crust is evidence of a slow chemical reaction happening all around us!" },
      {
        type: "paragraph",
        heading: "👀 What do we observe?",
        text: "When iron stays damp, a flaky reddish-brown layer can slowly appear. That layer is rust. It is not dirt stuck onto the metal—it is a new substance made by a chemical change.",
      },
      {
        type: "diagram",
        diagram: "rusting",
        title: "The rusting team",
        caption: "Iron rusts when oxygen and water can both reach it. This is a model, not a complete chemical equation.",
        labels: ["Iron", "Oxygen", "Water", "Rust"],
      },
      {
        type: "vocabulary",
        terms: [
          { term: "Reaction", definition: "A process that rearranges particles and makes one or more new substances." },
          { term: "Corrosion", definition: "The gradual damage of a metal through chemical reactions with its surroundings." },
        ],
      },
      {
        type: "key_fact",
        emoji: "🌊",
        title: "A salty speed boost",
        text: "Salt water usually makes iron rust faster, which is one reason coastal air is tough on metal objects.",
      },
      {
        type: "remember",
        points: ["Rusting needs iron, oxygen, and water.", "Rust is a new substance, so rusting is a chemical change."],
      },
    ],
    [
      choice("water-role", "💧", "Why does water matter?", "Explain the role of water in rusting."),
      choice("prevent-rust", "🛡️", "How can we stop rust?", "Compare safe methods used to prevent rust."),
      choice("chemical-change", "⚛️", "Why is rusting a chemical change?", "Connect rusting to particles and new substances."),
      choice("rust-sim", "🧪", "Try the rust simulator", "Add the approved rust conditions simulation."),
    ]
  );
}

function atomNode(level: StudyLevel): GeniusNode {
  return nodeBase(
    "What Is an Atom? ⚛️",
    level,
    "INTRO",
    null,
    null,
    [
      { type: "hero", emoji: "⚛️", hook: "Everything from stars to your shoelaces is built from a surprisingly small set of atom types." },
      {
        type: "paragraph",
        heading: "Tiny building pieces",
        text: "An atom is the smallest piece of an element that still behaves like that element. Atoms are far too small to see with an ordinary microscope, so scientists use models to reason about them.",
      },
      { type: "diagram", diagram: "atom", title: "A simple atom model", caption: "The picture is greatly enlarged and simplified—not to scale." },
      {
        type: "comparison",
        title: "Inside the model",
        columns: [
          { emoji: "➕", heading: "Proton", text: "Positive charge; found in the nucleus." },
          { emoji: "⚪", heading: "Neutron", text: "No charge; found in the nucleus." },
          { emoji: "➖", heading: "Electron", text: "Negative charge; found around the nucleus." },
        ],
      },
      {
        type: "analogy",
        title: "Like letters building words 🔤",
        text: "A few kinds of letters can make many words. In a similar way, atoms can join in different combinations to make an enormous variety of substances.",
        limit: "Atoms are not flat letters and chemical bonds are not spelling. The analogy only helps us think about combinations.",
      },
      { type: "remember", points: ["The number of protons decides which element an atom is.", "Atomic diagrams are useful models, not photographs."] },
    ],
    [
      choice("inside-atom", "🔬", "Go inside the atom", "Explain protons, neutrons and electrons more deeply."),
      choice("elements", "🧩", "How do atoms make elements?", "Explain element identity and atomic number."),
      choice("atom-builder", "🎮", "Build an atom", "Add the approved atom builder simulation."),
    ]
  );
}

function dissolvingNode(level: StudyLevel): GeniusNode {
  return nodeBase(
    "Why Does Salt Disappear in Water? 🧂💧",
    level,
    "INTRO",
    null,
    null,
    [
      { type: "hero", emoji: "🧂", hook: "The salt seems to vanish—but every salt particle is still there." },
      {
        type: "paragraph",
        heading: "Disappearing or spreading?",
        text: "Water pulls salt particles away from the crystal and they spread throughout the liquid. The mixture looks clear because the separated particles are too small to see, not because the salt has stopped existing.",
      },
      { type: "diagram", diagram: "dissolving", title: "From crystal to solution", caption: "The particles are enlarged so their spreading is easy to see." },
      {
        type: "key_fact",
        emoji: "♻️",
        title: "You can get it back",
        text: "If the water evaporates, the salt remains and can form crystals again. Dissolving is different from melting.",
      },
      { type: "quick_check", question: "Where is the salt after it dissolves?", options: ["It no longer exists", "It becomes water", "Its particles spread through the water"], correctIndex: 2, explanation: "Exactly! The salt particles remain present but are separated and spread throughout the water." },
      { type: "remember", points: ["Dissolved does not mean gone.", "A solution is a mixture in which particles are spread evenly at a tiny scale."] },
    ],
    [
      choice("dissolve-faster", "🏎️", "What makes it dissolve faster?", "Compare stirring, temperature and particle size."),
      choice("saturation", "🥄", "Can water run out of room?", "Explain saturation and solubility."),
      choice("dissolve-sim", "🧪", "Try the dissolving simulator", "Add the approved dissolving simulation."),
    ]
  );
}

function statesNode(level: StudyLevel): GeniusNode {
  return nodeBase(
    "Why Do Solids, Liquids, and Gases Behave Differently? 🧊💧💨",
    level,
    "INTRO",
    null,
    null,
    [
      { type: "hero", emoji: "🧊", hook: "The same water particles can lock into ice, flow as water, or race around as vapor." },
      {
        type: "paragraph",
        heading: "Same particles, different motion",
        text: "In a solid, particles vibrate around fixed positions. In a liquid, they stay close but slide past one another. In a gas, they move quickly and spread to fill the available space.",
      },
      { type: "diagram", diagram: "particle-states", title: "Three particle patterns", caption: "Particles and gaps are shown much larger than they really are." },
      {
        type: "key_fact",
        emoji: "🔥",
        title: "Heating changes motion",
        text: "Heating usually gives particles more energy, so they move faster. The particles themselves do not swell like balloons.",
      },
      { type: "remember", points: ["State depends on particle arrangement and motion.", "A change of state does not create a new substance."] },
    ],
    [
      choice("melting", "🌡️", "What happens while ice melts?", "Explain melting using energy and particles."),
      choice("state-sim", "🎮", "Control the particles", "Add the approved particle states simulation."),
      choice("evaporation", "☀️", "Boiling vs evaporation", "Compare two ways liquid becomes gas."),
    ]
  );
}

function genericNode(topic: string, level: StudyLevel): GeniusNode {
  const title = displayTitleForTopic(topic);
  return nodeBase(
    title,
    level,
    "INTRO",
    null,
    null,
    [
      { type: "hero", emoji: "⚗️", hook: `${topic} becomes easier when we connect what we can observe to what particles are doing.` },
      {
        type: "paragraph",
        heading: "Start with the evidence 👀",
        text: `Chemists explore ${topic.toLowerCase()} by making careful observations, comparing materials, and building particle models that explain the patterns they find.`,
      },
      {
        type: "diagram",
        diagram: "concept-map",
        title: `A map of ${topic}`,
        caption: `The visual connects ${topic.toLowerCase()} to the evidence, particles, and explanation used by chemists.`,
        labels: [topic, "Visible clues", "Particles involved", "Cause of the change", "Real-life example"],
      },
      {
        type: "steps",
        title: "Think like a chemist 🧠",
        items: [
          { emoji: "👀", title: "Observe", text: "Notice what changes and what stays the same." },
          { emoji: "📏", title: "Measure", text: "Use evidence instead of guessing." },
          { emoji: "⚛️", title: "Model", text: "Imagine a particle explanation that fits the evidence." },
        ],
      },
      { type: "remember", points: ["Good chemistry explanations connect evidence and particles.", "Models are tested and improved when new evidence appears."] },
    ],
    [
      choice("how-it-works", "🔍", "How does it work?", `Explain the mechanism behind ${topic}.`),
      choice("real-life", "🌍", "Where do we see it?", `Give useful everyday examples of ${topic}.`),
      choice("particle-view", "⚛️", "Show the particle view", `Explain ${topic} using a particle model.`),
    ]
  );
}

function unsafeNode(topic: string, level: StudyLevel): GeniusNode {
  return nodeBase(
    "Let’s Explore This Safely 🛡️",
    level,
    "INTRO",
    null,
    null,
    [
      { type: "hero", emoji: "🛡️", hook: "Some chemistry is fascinating to learn about but unsafe to make or test at home." },
      {
        type: "safety_note",
        text: `I can’t provide instructions for “${topic}”. We can safely explore the science behind reactions, energy, acids and bases, or gases without making anything dangerous.`,
      },
      {
        type: "remember",
        points: ["Never mix household cleaners.", "Use a reviewed simulation when a real reaction could be dangerous."],
      },
    ],
    [
      choice("reaction-energy", "🔥", "How can reactions release energy?", "Give a safe conceptual explanation of reaction energy."),
      choice("safe-reactions", "🧪", "Explore safe reaction models", "Explain how simulations help study reactions safely."),
    ]
  );
}

export function createFallbackIntroduction(topic: string, level: StudyLevel): GeniusNode {
  if (isUnsafeChemistryRequest(topic)) return unsafeNode(topic, level);
  if (/rust|corrosion/i.test(topic)) return rustNode(level);
  if (/atom|element|proton|electron/i.test(topic)) return atomNode(level);
  if (/dissolv|salt.*water|solution/i.test(topic)) return dissolvingNode(level);
  if (/state|solid|liquid|gas|melt|boil/i.test(topic)) return statesNode(level);
  return genericNode(topic, level);
}

function expansionBlocks(intent: string, topic: string, level: StudyLevel): GeniusBlock[] {
  const lower = intent.toLowerCase();
  if (/rust.*sim|simulator.*rust/.test(lower)) {
    return [
      { type: "hero", emoji: "🧪", hook: "Change one condition at a time and watch how the rust model responds." },
      { type: "simulation", simulation: "rust-conditions.v1", title: "Rust Conditions Lab", prompt: "Which sample will rust fastest? Make a prediction, then test it." },
      { type: "remember", points: ["Water and oxygen are both needed for rusting.", "Salt can speed corrosion; a complete coating blocks the surroundings."] },
    ];
  }
  if (/atom.*build|build.*atom/.test(lower)) {
    return [
      { type: "hero", emoji: "🎮", hook: "Change the tiny particle counts and see when the element or charge changes." },
      { type: "simulation", simulation: "atom-builder.v1", title: "Atom Builder", prompt: "Can you build a neutral carbon atom with 6 protons?" },
      { type: "remember", points: ["Protons decide the element.", "Electrons change the charge; neutrons change the isotope."] },
    ];
  }
  if (/dissolv.*sim|simulator.*dissolv/.test(lower)) {
    return [
      { type: "hero", emoji: "🥄", hook: "Watch a crystal break apart and spread through water." },
      { type: "simulation", simulation: "dissolving.v1", title: "Dissolving Lab", prompt: "Predict whether stirring or warming will make dissolving happen faster." },
      { type: "remember", points: ["Stirring changes the rate, not how much salt can ultimately dissolve at a fixed temperature.", "Dissolved particles are still present."] },
    ];
  }
  if (/particle state|control.*particle|state.*sim/.test(lower)) {
    return [
      { type: "hero", emoji: "🌡️", hook: "Add or remove energy and watch particle motion change." },
      { type: "simulation", simulation: "particle-states.v1", title: "Particle States Lab", prompt: "What do you predict will happen as the temperature rises?" },
      { type: "remember", points: ["Heating increases particle motion.", "The substance can change state without becoming a new substance."] },
    ];
  }
  if (/stop rust|prevent rust/.test(lower)) {
    return [
      { type: "hero", emoji: "🛡️", hook: "Rust prevention is mostly a clever game of keep-away." },
      {
        type: "comparison",
        title: "Four defenses",
        columns: [
          { emoji: "🎨", heading: "Paint", text: "Makes a barrier against oxygen and water." },
          { emoji: "🛢️", heading: "Oil", text: "Keeps moisture away from moving parts." },
          { emoji: "🪙", heading: "Zinc", text: "Protects the iron even if a small scratch appears." },
          { emoji: "🔧", heading: "Alloy", text: "Stainless steel is designed to resist corrosion." },
        ],
      },
      { type: "key_fact", emoji: "🔎", title: "The coating must cover the surface", text: "A gap or scratch can let water and oxygen reach the iron underneath." },
      { type: "remember", points: ["Barriers keep water and oxygen away.", "Some metals and alloys provide extra chemical protection."] },
    ];
  }
  if (/water.*rust|role of water/.test(lower)) {
    return [
      { type: "hero", emoji: "💧", hook: "Water is more than a wet spectator—it helps charged particles move during corrosion." },
      {
        type: "paragraph",
        heading: "A tiny pathway",
        text: level >= 8
          ? "A thin water layer lets ions move between regions of the iron surface. Iron atoms can lose electrons while oxygen takes part in reactions elsewhere, leading to hydrated iron oxides we call rust."
          : "A thin layer of water helps the corrosion process move charged particles around. Without water, ordinary rusting becomes extremely slow.",
      },
      { type: "comparison", title: "Compare the conditions", columns: [
        { emoji: "🏜️", heading: "Dry air", text: "Very little ordinary rusting." },
        { emoji: "🌧️", heading: "Damp air", text: "Water and oxygen can reach the iron." },
        { emoji: "🌊", heading: "Salty water", text: "Moving charge becomes easier, so corrosion is often faster." },
      ] },
      { type: "remember", points: ["Water helps the corrosion process; salt often speeds it up.", "Rust is a family of hydrated iron compounds, not one perfectly fixed material."] },
    ];
  }
  return [
    { type: "hero", emoji: "🔍", hook: `Let’s zoom in on ${topic} and connect the visible clues to particles.` },
    { type: "paragraph", heading: "The deeper idea", text: `${intent} Chemists answer this by comparing careful observations with models of particles, energy, and how substances interact.` },
    {
      type: "diagram",
      diagram: "process",
      title: `How this idea unfolds`,
      caption: `A context map for ${intent.toLowerCase()}. Each step connects the observation to its particle explanation.`,
      labels: [`Question: ${intent}`, "Identify the visible change", "Track the particles", "Explain the result"],
    },
    { type: "steps", title: "Follow the reasoning", items: [
      { emoji: "1️⃣", title: "Spot the change", text: "Identify exactly what was observed." },
      { emoji: "2️⃣", title: "Track the particles", text: "Ask whether particles moved, separated, or rearranged." },
      { emoji: "3️⃣", title: "Test the model", text: "Check whether the explanation predicts another observation." },
    ] },
    { type: "key_fact", emoji: "🌟", title: `Grade ${level} insight`, text: "A strong scientific explanation does more than name a fact—it explains why the evidence should look that way." },
    { type: "remember", points: ["Use evidence first, then a particle model.", "A model is useful when it explains and predicts observations."] },
  ];
}

export function createFallbackExpansion(args: {
  topic: string;
  level: StudyLevel;
  parentNodeId: string;
  label: string;
  intent: string;
  nodeType?: GeniusNode["nodeType"];
}): GeniusNode {
  const blocks = expansionBlocks(args.intent, args.topic, args.level);
  return nodeBase(
    `${args.label} ${args.nodeType === "QUESTION" ? "💬" : ""}`.trim(),
    args.level,
    args.nodeType ?? "READ_MORE",
    args.parentNodeId,
    args.label,
    blocks,
    [
      choice("evidence-next", "🔍", "What is the evidence?", `Explain evidence connected to ${args.intent}`),
      choice("real-life-next", "🌍", "Show a real-life connection", `Give an everyday application connected to ${args.intent}`),
    ]
  );
}

function stringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim().slice(0, 1200) : fallback;
}

export function normalizeGeneratedNode(
  raw: unknown,
  fallback: GeniusNode,
  parentNodeId: string | null,
  nodeType: GeniusNode["nodeType"],
  level: StudyLevel
): GeniusNode {
  if (!raw || typeof raw !== "object") return fallback;
  const object = raw as Record<string, unknown>;
  const rawBlocks = Array.isArray(object.blocks) ? object.blocks : [];
  const blocks = rawBlocks
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
    .filter((item) => BLOCK_TYPES.has(String(item.type)))
    .filter((item) => item.type !== "simulation" || APPROVED_SIMULATIONS.has(String(item.simulation)))
    .slice(0, 10) as unknown as GeniusBlock[];
  if (blocks.length < 2) return fallback;

  const rawChoices = Array.isArray(object.explore_choices)
    ? object.explore_choices
    : Array.isArray(object.exploreChoices)
      ? object.exploreChoices
      : [];
  const exploreChoices = rawChoices
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
    .map((item, index) => ({
      id: stringValue(item.id, `choice-${index}`).replace(/[^a-z0-9-]/gi, "-"),
      emoji: stringValue(item.emoji, "🔍").slice(0, 4),
      label: stringValue(item.label, "Explore further").slice(0, 100),
      intent: stringValue(item.intent, "Explain this idea more deeply.").slice(0, 300),
    }))
    .slice(0, 4);

  return {
    id: crypto.randomUUID(),
    parentNodeId,
    nodeType,
    promptLabel: fallback.promptLabel,
    title: stringValue(object.title, fallback.title).slice(0, 160),
    studyLevel: level,
    estimatedReadMinutes: Math.max(2, Math.min(6, Number(object.estimated_read_minutes) || 3)),
    blocks,
    exploreChoices: exploreChoices.length >= 2 ? exploreChoices : fallback.exploreChoices,
    createdAt: new Date().toISOString(),
  };
}

export function createContent(introduction: GeniusNode): GeniusContent {
  return {
    schemaVersion: "genius-exploration.v1",
    activeNodeId: introduction.id,
    nodes: [introduction],
  };
}

export function isGeniusContent(value: unknown): value is GeniusContent {
  if (!value || typeof value !== "object") return false;
  const object = value as Record<string, unknown>;
  return object.schemaVersion === "genius-exploration.v1" && Array.isArray(object.nodes);
}
