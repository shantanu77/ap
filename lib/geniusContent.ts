import type {
  ExploreChoice,
  GeniusBlock,
  GeniusContent,
  GeniusNode,
  StudyLevel,
  GeniusSubject,
} from "@/types/genius";
import { GENIUS_QUESTION_MAX_LENGTH } from "@/lib/geniusLimits";

const APPROVED_SIMULATIONS = new Set([
  "rust-conditions.v1",
  "particle-states.v1",
  "dissolving.v1",
  "atom-builder.v1",
  "ph-indicator.v1",
  "mass-balance.v1",
  "force-motion.v1",
  "gravity-field.v1",
  "compound-bonding.v1",
  "battery-circuit.v1",
  "cell-explorer.v1",
  "food-chain.v1",
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
  "math_worked_example",
  "math_practice",
]);

export function toStudyLevel(value: unknown): StudyLevel {
  const number = Number(value);
  return number === 7 || number === 8 ? number : 6;
}

export function toDeepDiveLevel(value: unknown, fallback: StudyLevel): StudyLevel {
  const number = Number(value);
  return Number.isInteger(number) && number >= 6 && number <= 12 ? number as StudyLevel : fallback;
}

export function cleanTopic(value: unknown): string {
  return String(value ?? "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

export function cleanQuestion(value: unknown): string {
  return String(value ?? "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, GENIUS_QUESTION_MAX_LENGTH);
}

export function canonicalizeTopic(topic: string): string {
  return topic
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100) || "chemistry-topic";
}

export function toGeniusSubject(value: unknown): GeniusSubject {
  return value === "physics" || value === "biology" || value === "math" ? value : "chemistry";
}

export function displayTitleForTopic(topic: string, subject: GeniusSubject = "chemistry"): string {
  const trimmed = topic.replace(/[?.!]+$/, "").trim();
  const title = trimmed.replace(/\b\w/g, (character) => character.toUpperCase());
  const fallback = subject === "physics" ? "Physics Mystery" : subject === "biology" ? "Biology Mystery" : subject === "math" ? "Math Mystery" : "Chemistry Mystery";
  const emoji = subject === "physics" ? "🚀" : subject === "biology" ? "🧬" : subject === "math" ? "➗" : "⚗️";
  return `${title || fallback} ${emoji}`;
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
  const safeBlocks = blocks.some((block) => block.type === "safety_note")
    ? blocks
    : ensureVisualBlock(blocks, title);
  return {
    id: crypto.randomUUID(),
    parentNodeId,
    nodeType,
    promptLabel,
    title,
    studyLevel: level,
    estimatedReadMinutes: Math.max(2, Math.min(6, Math.ceil(safeBlocks.length / 2))),
    blocks: safeBlocks,
    exploreChoices,
    createdAt: new Date().toISOString(),
  };
}

function ensureVisualBlock(blocks: GeniusBlock[], title: string): GeniusBlock[] {
  if (blocks.some((block) => block.type === "diagram" || block.type === "simulation")) return blocks;
  const cleanTitle = title.replace(/[^\p{L}\p{N}\s-]/gu, "").trim() || "Chemistry concept";
  const visual: GeniusBlock = {
    type: "diagram",
    diagram: "concept-map",
    title: `Explore ${cleanTitle}`,
    caption: "Tap each label to focus on one part of the explanation.",
    labels: [cleanTitle, "What we observe", "Particle explanation", "Cause and effect", "Real-life connection"],
  };
  const insertAt = Math.min(2, blocks.length);
  return [...blocks.slice(0, insertAt), visual, ...blocks.slice(insertAt)];
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

function genericNode(topic: string, level: StudyLevel, subject: GeniusSubject = "chemistry"): GeniusNode {
  const title = displayTitleForTopic(topic, subject);
  const subjectName = subject[0].toUpperCase() + subject.slice(1);
  const focus = subject === "physics"
    ? "forces, energy, motion, matter, and measurable cause and effect"
    : subject === "biology"
      ? "living structures, their functions, systems, adaptation, and evidence"
      : subject === "math"
        ? "patterns, quantities, representations, and step-by-step reasoning"
        : "materials, particles, reactions, and evidence";
  const emoji = subject === "physics" ? "🚀" : subject === "biology" ? "🧬" : subject === "math" ? "➗" : "⚗️";
  const requiredSimulation = requiredInteractiveSimulation(`${topic} ${subject}`);
  return nodeBase(
    title,
    level,
    "INTRO",
    null,
    null,
    [
      { type: "hero", emoji, hook: `${topic} becomes easier when we connect what we observe to the hidden mechanism that causes it.` },
      {
        type: "paragraph",
        heading: "Start with the evidence 👀",
        text: `${subjectName} explores ${topic.toLowerCase()} through careful observations, comparisons, measurements, and models. Here we will connect the evidence to ${focus}.`,
      },
      {
        type: "analogy",
        title: "The invisible detective story 🕵️",
        text: `Imagine entering a room after a dramatic event: a chair is overturned, a window is open, and papers are everywhere. You did not see what happened, but the clues let you reconstruct it. In ${topic.toLowerCase()}, observations are the clues and the scientific model must account for every clue.`,
        limit: "Particles do not leave clues intentionally, and a scientific model must make testable predictions—not merely tell a convincing story.",
      },
      requiredSimulation
        ? { type: "simulation", simulation: requiredSimulation[0], title: requiredSimulation[1], prompt: requiredSimulation[2] }
        : {
            type: "diagram",
            diagram: "concept-map",
            title: `A map of ${topic}`,
            caption: `The visual connects ${topic.toLowerCase()} to the evidence, particles, and explanation used by scientists.`,
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
      ...(subject === "math" ? [
        {
          type: "math_worked_example" as const,
          title: "Worked example",
          problem: `Use a clear step-by-step method to solve one Grade ${level} example about ${topic}.`,
          steps: [
            { label: "Step 1", working: "Write down what is known and what must be found.", explanation: "Separating the given information from the goal prevents choosing an operation too early." },
            { label: "Step 2", working: "Choose the matching operation or representation.", explanation: "The operation must match the relationship described in the problem." },
            { label: "Step 3", working: "Calculate carefully and check using the reverse operation.", explanation: "A reverse check catches many arithmetic mistakes." },
          ],
          answer: "Use the generated lesson above to substitute the topic's values.",
        },
        {
          type: "math_practice" as const,
          title: "Try the method",
          problem: `Explain the first valid step for a similar ${topic} problem.`,
          steps: [{ prompt: "What should you identify before calculating?", acceptedAnswers: ["what is known and what must be found", "known values and the unknown"], hint: "Separate the information given from the question being asked.", explanation: "This identifies the mathematical goal before selecting an operation." }],
          finalAnswer: "Identify the known values and the unknown.",
        },
      ] : []),
      { type: "key_fact", emoji: "🚀", title: "Stretch idea: a model must predict", text: "A powerful explanation does not only fit evidence we already have. It predicts what should happen in a new situation, which lets scientists test whether the model survives." },
      { type: "remember", points: [`Good ${subjectName.toLowerCase()} explanations connect evidence to a mechanism.`, "Think like a detective: every visible clue needs a cause.", "A strong model predicts new evidence and changes when a prediction fails."] },
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

function batteryNode(level: StudyLevel): GeniusNode {
  return nodeBase(
    "How Batteries Power a Circuit 🔋",
    level,
    "INTRO",
    null,
    null,
    [
      { type: "hero", emoji: "🔋", hook: "Inside a battery, chemical reactions create an electric push—but charge moves only when there is a complete path." },
      { type: "paragraph", heading: "Chemical energy becomes electrical energy", text: "Reactions inside an electric cell separate charge between its two terminals. This creates voltage, the electric push that can drive charge through a closed circuit." },
      { type: "simulation", simulation: "battery-circuit.v1", title: "Battery and Circuit Lab", prompt: "Close the switch, then compare one cell with two cells in series." },
      { type: "vocabulary", terms: [{ term: "Voltage", definition: "A measure of the electric push between two points." }, { term: "Circuit", definition: "A complete conducting path through which charge can move." }] },
      { type: "remember", points: ["A battery converts stored chemical energy into electrical energy.", "A bulb lights only when the circuit is complete.", "Cells connected in series add their voltages."] },
    ],
    [
      choice("inside-battery", "⚛️", "What happens inside a battery?", "Explain the chemical changes and charge separation inside a battery."),
      choice("series-cells", "🔋", "Why do two cells make it brighter?", "Explain voltage when cells are connected in series."),
      choice("open-circuit", "💡", "Why does an open switch stop the bulb?", "Explain current and the need for a complete circuit."),
    ]
  );
}

export function createFallbackIntroduction(topic: string, level: StudyLevel, subject: GeniusSubject = "chemistry"): GeniusNode {
  if (subject === "chemistry" && isUnsafeChemistryRequest(topic)) return unsafeNode(topic, level);
  if (/\b(batter(?:y|ies)|electric cells?|voltage|electric circuit)\b/i.test(topic)) return batteryNode(level);
  if (subject !== "chemistry") return genericNode(topic, level, subject);
  if (/rust|corrosion/i.test(topic)) return rustNode(level);
  if (/atom|element|proton|electron/i.test(topic)) return atomNode(level);
  if (/dissolv|salt.*water|solution/i.test(topic)) return dissolvingNode(level);
  if (/state|solid|liquid|gas|melt|boil/i.test(topic)) return statesNode(level);
  return genericNode(topic, level, subject);
}

function expansionBlocks(intent: string, topic: string, level: StudyLevel, subject: GeniusSubject = "chemistry"): GeniusBlock[] {
  const lower = intent.toLowerCase();
  if (/\b(batter(?:y|ies)|electric cells?|voltage|electric circuit)\b/.test(`${lower} ${topic.toLowerCase()}`)) {
    return [
      { type: "hero", emoji: "🔋", hook: "A battery does not store electric current—it uses a chemical reaction to push charge around a complete circuit." },
      { type: "simulation", simulation: "battery-circuit.v1", title: "Battery and Circuit Lab", prompt: "Close the circuit, then compare one cell with two cells. What changes?" },
      { type: "paragraph", heading: "What is happening inside?", text: "Chemical reactions separate charge at the battery terminals. The resulting voltage is an electric push. When the circuit is closed, that push drives charge through the wire and bulb; opening the circuit stops the continuous path." },
      { type: "remember", points: ["A battery changes stored chemical energy into electrical energy.", "Current needs a complete conducting path.", "More cells in series provide a larger voltage, within the safe simplified model."] },
    ];
  }
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
  const subjectName = subject[0].toUpperCase() + subject.slice(1);
  const mechanism = subject === "physics" ? "forces, energy, motion, and measurable changes" : subject === "biology" ? "structures, functions, systems, and living processes" : subject === "math" ? "patterns, quantities, diagrams, and valid calculation steps" : "particles, energy, and how substances interact";
  return [
    { type: "hero", emoji: subject === "physics" ? "🚀" : subject === "biology" ? "🧬" : subject === "math" ? "➗" : "🔍", hook: `Let’s zoom in on ${topic} and connect the visible clues to the mechanism behind them.` },
    { type: "paragraph", heading: "The deeper idea", text: `${intent} ${subjectName} answers this by comparing careful observations with models of ${mechanism}.` },
    {
      type: "analogy",
      title: "Freeze the dramatic moment 🎬",
      text: `Imagine a film paused at the most surprising moment in ${topic}: the visible result is frozen on screen, but millions of invisible particle events led to it. Rewind the scene by asking what moved, collided, separated, or rearranged at each step.`,
      limit: "Real particles do not follow a script, and the mental movie is useful only when each scene agrees with measured evidence.",
    },
    {
      type: "diagram",
      diagram: "process",
      title: `How this idea unfolds`,
        caption: `A context map for ${intent.toLowerCase()}. Each step connects the observation to its scientific explanation.`,
        labels: [`Question: ${intent}`, "Identify the visible change", "Track the mechanism", "Explain the result"],
    },
    { type: "steps", title: "Follow the reasoning", items: [
      { emoji: "1️⃣", title: "Spot the change", text: "Identify exactly what was observed." },
      { emoji: "2️⃣", title: "Track the mechanism", text: `Ask how ${mechanism} produce the observation.` },
      { emoji: "3️⃣", title: "Test the model", text: "Check whether the explanation predicts another observation." },
    ] },
    { type: "key_fact", emoji: "🌟", title: `Beyond Grade ${level}: test a prediction`, text: "A strong scientific explanation does more than name a fact—it predicts how the evidence would change if one condition changed." },
    { type: "remember", points: ["Use evidence first, then a scientific model.", "Rewind the dramatic visible moment into smaller causal steps.", "A model becomes powerful when it explains and predicts observations."] },
  ];
}

export function createFallbackExpansion(args: {
  topic: string;
  level: StudyLevel;
  parentNodeId: string;
  label: string;
  intent: string;
  nodeType?: GeniusNode["nodeType"];
  subject?: GeniusSubject;
}): GeniusNode {
  const blocks = expansionBlocks(args.intent, args.topic, args.level, args.subject);
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

function contentText(block: GeniusBlock): string[] {
  if (block.type === "hero") return [block.hook];
  if (block.type === "paragraph") return [`${block.heading ? `${block.heading}: ` : ""}${block.text}`];
  if (block.type === "key_fact") return [`${block.title}: ${block.text}`];
  if (block.type === "analogy") return [`${block.title}: ${block.text}`, block.limit ?? ""];
  if (block.type === "steps") return [`${block.title}: ${block.items.map((item) => `${item.title}: ${item.text}`).join(" ")}`];
  if (block.type === "comparison") return [`${block.title}: ${block.columns.map((column) => `${column.heading}: ${column.text}`).join(" ")}`];
  if (block.type === "vocabulary") return block.terms.flatMap((term) => [term.term, term.definition, term.example ?? ""]);
  if (block.type === "simulation") return [block.title, block.prompt];
  if (block.type === "remember") return block.points;
  if (block.type === "safety_note") return [block.text];
  return [];
}

export function detailsForDiagram(block: Extract<GeniusBlock, { type: "diagram" }>, contextBlocks: GeniusBlock[]): string[] {
  const labels = block.labels ?? [];
  const explicit = block.details ?? [];
  const knowledge = contextBlocks
    .filter((item) => item !== block && item.type !== "diagram")
    .flatMap(contentText)
    .map((text) => text.trim())
    .filter((text) => text.length > 25);
  return labels.map((label, index) => {
    const detail = explicit[index]?.trim();
    const detailWordCount = detail?.split(/\s+/u).filter(Boolean).length ?? 0;
    if (detail && detailWordCount >= 45 && detail.toLowerCase() !== label.toLowerCase() && !/look at (?:the )?(?:picture|diagram)|see above/i.test(detail)) return detail;

    const name = label.toLowerCase();
    let candidates = knowledge;
    if (/real.?life|everyday|example|connection/.test(name)) {
      candidates = knowledge.filter((text) => /\b(imagine|everyday|real.life|example|when you|for instance|think of)\b/i.test(text));
    } else if (/particle|electron|atom|mechanism|how it works/.test(name)) {
      candidates = knowledge.filter((text) => /\b(particles?|electrons?|atoms?|force|energy|mechanism|flows?)\b/i.test(text));
    } else if (/cause|effect|change|why|result|consequence/.test(name)) {
      candidates = knowledge.filter((text) => /\b(if|because|when|so |therefore|causes?|makes?|turns? into|results? in)\b/i.test(text));
    } else if (/observe|visible|evidence|notice|what we see/.test(name)) {
      candidates = knowledge.filter((text) => /\b(see|notice|observe|visible|light|move|flow|change|turns? on|turns? off)\b/i.test(text));
    } else {
      const terms = name.split(/[^\p{L}\p{N}]+/u).filter((word) => word.length > 3 && !/^(this|that|with|from|what|when|where|about|main|part|idea|show|focus|understanding)$/i.test(word));
      if (terms.length) candidates = knowledge.filter((text) => terms.some((term) => text.toLowerCase().includes(term)));
    }
    const sources = [...candidates, ...knowledge.filter((text) => !candidates.includes(text))];
    const chosen: string[] = [];
    const seen = new Set<string>();
    let words = 0;
    for (const source of sources) {
      const normalized = source.toLowerCase();
      if (seen.has(normalized)) continue;
      seen.add(normalized);
      chosen.push(source);
      words += source.split(/\s+/u).filter(Boolean).length;
      if (words >= 70 || chosen.length >= 3) break;
    }
    const selected = chosen.join(" ") || `${block.title}: ${block.caption}`;
    const selectedWords = selected.split(/\s+/u).filter(Boolean);
    return selectedWords.length > 110 ? `${selectedWords.slice(0, 110).join(" ")}…` : selected;
  });
}

export function normalizeGeneratedNode(
  raw: unknown,
  fallback: GeniusNode,
  parentNodeId: string | null,
  nodeType: GeniusNode["nodeType"],
  level: StudyLevel,
  relevanceText = ""
): GeniusNode {
  if (!raw || typeof raw !== "object") return fallback;
  const object = raw as Record<string, unknown>;
  const rawBlocks = Array.isArray(object.blocks) ? object.blocks : [];
  const parsedBlocks = rawBlocks
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
    .filter((item) => BLOCK_TYPES.has(String(item.type)))
    .filter((item) => item.type !== "simulation" || (
      APPROVED_SIMULATIONS.has(String(item.simulation))
      && isSimulationRelevant(String(item.simulation), relevanceText)
    ))
    .slice(0, 12) as unknown as GeniusBlock[];
  if (parsedBlocks.length < 2) return fallback;
  const controlledBlocks = parsedBlocks.map((block): GeniusBlock => {
    if (block.type !== "diagram") return block;
    const record = block as unknown as Record<string, unknown>;
    const title = stringValue(record.title, "Explore the main idea");
    const labels = Array.isArray(record.labels)
      ? record.labels.filter((label): label is string => typeof label === "string" && Boolean(label.trim())).map((label) => label.trim().slice(0, 70)).slice(0, 6)
      : [];
    const interactiveLabels = labels.length >= 3
      ? labels
      : [title, ...labels, "Key part", "What changes"].slice(0, 4);
    const supportedDiagrams = new Set([
      "rusting", "particle-states", "atom", "dissolving", "reaction", "concept-map",
      "process", "before-after", "particle-scene", "scale", "coordinate-grid",
    ]);
    const diagram = supportedDiagrams.has(String(record.diagram))
      && !(record.diagram === "coordinate-grid" && !labels.some((label) => /\(-?\d+(?:\.\d+)?,\s*-?\d+(?:\.\d+)?\)/.test(label)))
      ? block.diagram
      : "concept-map";
    const normalized = {
      ...block,
      diagram,
      title,
      caption: stringValue(record.caption, `Select a label to focus on that part of ${title}.`),
      labels: interactiveLabels,
      details: Array.isArray(record.details)
        ? record.details.filter((detail): detail is string => typeof detail === "string").map((detail) => detail.trim().slice(0, 500))
        : [],
    };
    return { ...normalized, details: detailsForDiagram(normalized, parsedBlocks) };
  });
  const requiredSimulation = requiredInteractiveSimulation(relevanceText);
  let generatedBlocks = controlledBlocks;
  if (requiredSimulation) {
    const [simulation, title, prompt] = requiredSimulation;
    const hasSimulation = controlledBlocks.some((block) => block.type === "simulation" && block.simulation === simulation);
    generatedBlocks = controlledBlocks.filter((block) => block.type !== "diagram");
    if (!hasSimulation) {
      const block: GeniusBlock = { type: "simulation", simulation, title, prompt };
      generatedBlocks.splice(Math.min(2, generatedBlocks.length), 0, block);
    }
  }
  const blocks = ensureVisualBlock(generatedBlocks, stringValue(object.title, fallback.title));

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
      ...(Number.isInteger(Number(item.level)) && Number(item.level) >= 6 && Number(item.level) <= 12
        ? { level: Number(item.level) as StudyLevel }
        : {}),
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

function requiredInteractiveSimulation(context: string): [Extract<GeniusBlock, { type: "simulation" }>["simulation"], string, string] | null {
  const text = context.toLowerCase();
  if (/\b(gravity|gravitation|gravitational|weight on (?:the )?(?:moon|planet))\b/.test(text)) {
    return ["gravity-field.v1", "Gravity Field Lab", "Change the planet's mass or the object's distance. Watch how the gravitational pull changes."];
  }
  if (/\b(compounds?|molecules?|chemical bonds?|elements? combine)\b/.test(text)) {
    return ["compound-bonding.v1", "Build a Compound", "Change the atom counts, then see whether they can form a molecule."];
  }
  if (/\b(electrical? circuits?|batter(?:y|ies)|electric current|voltage|bulbs?|circuit components?)\b/.test(text)) {
    return ["battery-circuit.v1", "Circuit Builder", "Open and close the switch, then compare one cell with two. Watch the bulb and current path respond."];
  }
  if (/\b(motion|force|acceleration|speed|velocity|inertia)\b/.test(text)) {
    return ["force-motion.v1", "Force and Motion Lab", "Change the force or mass and watch the object's acceleration and motion change."];
  }
  return null;
}

function isSimulationRelevant(simulation: string, context: string): boolean {
  const text = context.toLowerCase();
  const patterns: Record<string, RegExp> = {
    "rust-conditions.v1": /\b(rust|rusting|corrosion|iron)\b/,
    "particle-states.v1": /\b(solid|liquid|gas|state of matter|melting|boiling|freezing|particle state)\b/,
    "dissolving.v1": /\b(dissolv|solution|solute|solvent|salt in water)\b/,
    "atom-builder.v1": /\b(atom|element|proton|neutron|electron|isotope|ion)\b/,
    "ph-indicator.v1": /\b(ph|acid|base|alkali|indicator)\b/,
    "mass-balance.v1": /\b(conservation of mass|mass balance|closed container|reaction mass)\b/,
    "force-motion.v1": /\b(force|motion|acceleration|newton|inertia|push|pull|velocity|speed)\b/,
    "gravity-field.v1": /\b(gravity|gravitation|gravitational|weight on (?:the )?(?:moon|planet))\b/,
    "compound-bonding.v1": /\b(compounds?|molecules?|chemical bonds?|elements? combine)\b/,
    "battery-circuit.v1": /\b(batter(?:y|ies)|electric(?:al)? cells?|voltage|electric(?:al)? circuits?|current|bulbs?)\b/,
    "cell-explorer.v1": /\b(cell|organelle|nucleus|mitochond|membrane|ribosome)\b/,
    "food-chain.v1": /\b(food chain|food web|ecosystem|producer|consumer|predator|energy transfer)\b/,
  };
  return patterns[simulation]?.test(text) ?? false;
}

export function createContent(introduction: GeniusNode, curriculumResearch?: GeniusContent["curriculumResearch"]): GeniusContent {
  return {
    schemaVersion: "genius-exploration.v1",
    activeNodeId: introduction.id,
    nodes: [introduction],
    ...(curriculumResearch ? { curriculumResearch } : {}),
  };
}

export function isGeniusContent(value: unknown): value is GeniusContent {
  if (!value || typeof value !== "object") return false;
  const object = value as Record<string, unknown>;
  return object.schemaVersion === "genius-exploration.v1" && Array.isArray(object.nodes);
}
