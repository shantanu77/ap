# Genius Corner — Chemistry Specification

## 1. Purpose

This document defines the Chemistry content, interaction, safety, visual, and simulation requirements for the first Genius Corner subject. It extends the platform requirements in `genius_corner.md`.

The experience should help Aashvath see Chemistry as the study of **what things are made of, how their particles behave, and how substances change**. It should connect invisible particle-level explanations to visible everyday observations.

**Supported levels:** Grade 5–8  
**Default:** Grade 6  
**Tone:** Curious, accurate, visual, energetic, and never childish  
**Primary symbol:** ⚗️

---

## 2. Chemistry Home

### 2.1 Hero

**Title:** “Chemistry Lab of Ideas ⚗️✨”  
**Subtitle:** “Explore what everything is made of—and what happens when it changes.”

The Chemistry home includes a topic input, study-level selector, suggested collections, recent explorations, and saved Chemistry topics.

### 2.2 Starter collections

#### Matter around us 🧊💧💨

- What is matter?
- Why do solids, liquids, and gases behave differently?
- Can matter disappear?
- What is plasma?

#### Atoms and elements ⚛️

- What is an atom?
- What is inside an atom?
- What makes one element different from another?
- How do atoms join together?

#### Mixtures and solutions 🥤

- Why does salt dissolve in water?
- Is air a mixture?
- How can we separate mixtures?
- What makes a solution saturated?

#### Chemical changes 🔥

- How can we tell a chemical reaction happened?
- Why does iron rust?
- Why does food brown while cooking?
- Where does the mass go during a reaction?

#### Acids and bases 🍋🧼

- What makes a substance acidic?
- What does pH measure?
- How do indicators change color?
- What happens when acids and bases meet?

#### Chemistry of everyday life 🏠

- How does soap clean?
- Why do onions make us cry?
- How does baking powder make a cake rise?
- Why do cut apples turn brown?

---

## 3. Chemistry Learning Model

Chemistry explanations should move between three connected views:

1. **👀 What we observe** — color, bubbles, temperature, smell, state, or texture.
2. **⚛️ What particles may be doing** — atoms, molecules, ions, motion, collisions, or rearrangement.
3. **🧪 How scientists represent it** — diagrams, symbols, formulae, graphs, or equations.

At Grade 5, most nodes emphasize observation and simple particle pictures. From Grade 6 onward, nodes increasingly connect all three views. The UI may label these views explicitly with tabs or stacked cards.

### Core explanation pattern

Each introductory Chemistry node should normally include:

- **Curiosity hook**
- **What you can observe**
- **What is happening**
- **Particle picture**
- **Everyday connection**
- **Remember this**
- **Choose where to go next**

Not every node needs every block. Content should remain concise.

---

## 4. Level Progression

### Grade 5

- Matter as things that have mass and occupy space.
- Solids, liquids, and gases described through observable properties.
- Atoms introduced as extremely tiny building pieces.
- Changes grouped as reversible/irreversible or physical/chemical using familiar examples.
- Mixtures and separation through filtering, sieving, evaporation, and magnets.
- Acids and bases introduced through safe familiar examples and indicators.
- No expectation of balancing equations.

### Grade 6

- Particle arrangement and motion explain states of matter.
- Elements, compounds, and mixtures are distinguished.
- Atoms and molecules are introduced with simple models.
- Dissolving is explained as particles spreading among solvent particles, not disappearing.
- Chemical reactions rearrange particles to make new substances.
- Introductory pH scale and neutralization.
- Symbols may be introduced sparingly and always decoded.

### Grade 7

- Protons, neutrons, electrons, atomic number, and simple shells.
- Ions introduced as charged particles.
- Pure substances, solutions, concentration, solubility, and saturation.
- Evidence of chemical reactions and conservation of mass.
- Collision-based explanation of reaction rate.
- Word equations and simple formulae.
- Particle diagrams must conserve particle counts when illustrating reactions.

### Grade 8

- Periodic-table patterns at an introductory level.
- Valence electrons as a model for bonding and reactivity.
- Ionic and covalent bonding with limitations clearly stated.
- Balanced symbolic equations for simple reactions.
- Quantitative concentration or mass reasoning using accessible arithmetic.
- Energy changes, activation energy, catalysts, and reaction-rate variables.
- Model limitations and exceptions are discussed where important.

### Level boundary rule

Do not introduce a higher-grade idea merely to sound impressive. If a learner asks for it directly, give a short bridge explanation and label it **“Stretch idea 🌟”**.

---

## 5. Topic Taxonomy

Each generated exploration is tagged with one primary strand and zero or more supporting concepts.

| Strand ID | Strand | Supporting concepts |
|---|---|---|
| `matter` | Matter and its properties | mass, volume, density, states, particle motion |
| `atomic_structure` | Atoms and elements | nucleus, electrons, atomic number, isotopes |
| `periodic_table` | Periodic table | groups, periods, metals, nonmetals, trends |
| `bonding` | Molecules and bonding | compounds, ions, ionic, covalent, structures |
| `mixtures` | Mixtures and separation | solutions, filtration, evaporation, chromatography |
| `reactions` | Chemical reactions | reactants, products, evidence, equations, conservation |
| `acids_bases` | Acids, bases, and pH | indicators, neutralization, pH scale |
| `energy_rates` | Energy and reaction rates | temperature, concentration, surface area, catalysts |
| `everyday` | Everyday chemistry | food, cleaning, corrosion, materials, environment |

Tags drive suggested Read More choices, image style, simulation selection, and saved-topic search.

---

## 6. Chemistry-Specific Content Rules

### 6.1 Scientific language

- Introduce one to three new terms per node.
- Show each important term in a vocabulary card the first time it appears.
- Do not say atoms “want,” “like,” or “try” without immediately explaining that this is shorthand, not intention.
- Do not say particles expand when a substance is heated; explain that particles usually move faster and become farther apart.
- Do not say dissolved matter disappears.
- Distinguish heat from temperature.
- Distinguish melting from dissolving.
- Distinguish atoms, molecules, elements, compounds, and mixtures.
- When using a simplified atomic or bonding model, state its useful purpose and limitation.

### 6.2 Equations and notation

- Always pair a symbolic equation with a word equation the first time it appears.
- Render subscripts correctly; never rely on plain-text approximations when avoidable.
- Explain the meaning of coefficients and subscripts before asking the learner to use them.
- Reaction diagrams must conserve every type of atom.
- Use MathML or an accessible math renderer for formulae.

### 6.3 Analogies

Analogies must include a **“Where this analogy stops 🛑”** note when the analogy could create a misconception. Examples:

- Atoms as building blocks: useful for combinations, limited because atoms are not rectangular pieces.
- Electron shells as lanes: useful for grouping, limited because electrons do not orbit like cars.
- Dissolving as people spreading through a crowd: useful for mixing, limited because particles are in constant three-dimensional motion.

---

## 7. Chemistry Visual Language

### 7.1 Particle diagrams

Prefer deterministic SVG/canvas diagrams over generated images for particle-level explanations.

Particle diagram rules:

- Include a legend.
- Use both color and shape/pattern to distinguish particle types.
- Preserve particle counts across physical and chemical changes.
- Clearly label when spacing is exaggerated.
- Avoid implying that particles themselves change size during state changes.
- Show motion with accessible arrows or optional animation.
- Include a **Not to scale** label.

### 7.2 Generated images

Generated images are suitable for:

- Familiar real-world scenes such as rusted gates, condensation, cooking, or cleaning.
- Before/after observations.
- Memorable visual analogies.
- Safe laboratory context illustrations without procedural danger.

Generated images are not the source of truth for:

- Molecular geometry.
- Electron arrangements.
- Apparatus labels.
- Chemical equations.
- Exact crystal structures.
- Graphs or quantitative results.

Those use application-rendered diagrams.

### 7.3 Apparatus diagrams

Only show apparatus that is necessary for a safe, reviewed activity. Use application-rendered labels. Images must not imply unsafe practices such as tasting, direct smelling, mouth pipetting, heating sealed containers, or missing eye protection.

---

## 8. Initial Simulation Registry

### 8.1 `particle-states.v1` — States of matter

**Levels:** 5–7  
**Controls:** temperature slider, heat/cool toggle  
**Shows:** particle arrangement, motion, spacing, state label  
**Learning goal:** Connect temperature and particle motion to changes of state.  
**Model note:** Particles and gaps are enlarged; the 2D view is simplified.

### 8.2 `dissolving.v1` — Dissolving a solute

**Levels:** 5–8  
**Controls:** solute amount, water temperature, stir toggle  
**Shows:** solute particles spreading, undissolved amount, time to dissolve  
**Learning goal:** Understand that dissolved particles remain present and that rate is different from total solubility.  
**Model note:** Grade-dependent behavior must not incorrectly imply that stirring always increases final solubility.

### 8.3 `atom-builder.v1` — Build an atom

**Levels:** 6–8  
**Controls:** add/remove proton, neutron, electron  
**Shows:** element name, atomic number, mass number, net charge, simple shell diagram  
**Learning goal:** Relate subatomic particle counts to element identity, isotope, and ion charge.  
**Guardrail:** Keep element range and shell model within the reviewed configuration.

### 8.4 `ph-indicator.v1` — pH and indicators

**Levels:** 5–8  
**Controls:** select reviewed familiar substance, add indicator, dilute with water  
**Shows:** pH position, indicator color, acidic/neutral/basic label  
**Learning goal:** Interpret pH and indicator color without encouraging real-world tasting or mixing.  
**Model note:** Substance values are typical approximations and may vary.

### 8.5 `reaction-collisions.v1` — Reaction rate

**Levels:** 7–8  
**Controls:** temperature, concentration, surface area, catalyst toggle  
**Shows:** particle collisions, successful collisions, rate graph  
**Learning goal:** Connect conditions to collision frequency and successful reactions.  
**Model note:** The animation is conceptual, not a molecularly exact calculation.

### 8.6 `mass-balance.v1` — Conservation of mass

**Levels:** 6–8  
**Controls:** open/closed container toggle, reactant amounts  
**Shows:** particle rearrangement, scale reading, escaped gas where applicable  
**Learning goal:** Explain why total mass is conserved and why an open container can appear to lose mass.

### Simulation selection rules

- A node should contain at most one major simulation.
- Offer a simulation when the concept involves motion, change over time, controllable variables, or conservation.
- Require a prediction before revealing the full result where practical.
- Use preset configurations approved for each level.
- Store the selected template version and full configuration with the lesson.

---

## 9. Reviewed At-Home Activity Policy

The default experience favors virtual simulations. A real-world activity may appear only when its activity ID is on a parent-reviewed allowlist.

### Allowed first-release activity types

- Observe an ice cube melting.
- Mix table salt or sugar with room-temperature water.
- Separate sand-sized safe household solids using a sieve.
- Observe condensation on the outside of a cold glass.
- Use red-cabbage indicator only with a parent and reviewed household substances.

Each activity card must include:

- **Adult help:** required or not required.
- Materials.
- Maximum quantities.
- Step-by-step instructions.
- Eye/skin/ingestion warnings.
- Cleanup and disposal.
- What to observe.
- Conceptual explanation.

### Never generate as an at-home activity

- Flames, burners, fireworks, or ignition.
- Explosives or rapid gas production in sealed containers.
- Strong acids or bases.
- Bleach, ammonia, drain cleaner, solvents, fuels, pesticides, or unknown chemicals.
- Mixing household cleaning products.
- Drug synthesis or extraction.
- Toxic gas generation.
- Pressurized vessels.
- Tasting chemicals or food after it has been used in an experiment.
- Deliberate skin contact or direct smelling.

Unsafe requests should still receive a safe conceptual explanation or virtual simulation when appropriate.

---

## 10. Read More Strategy

Every Chemistry node should offer a balanced set of two to four branches:

1. **Mechanism:** “What are the particles doing? ⚛️”
2. **Evidence:** “How do scientists know? 🔍”
3. **Application:** “Where does this happen in real life? 🌍”
4. **Interaction:** “Can I test it in a simulation? 🧪”
5. **Deeper level:** “Show me the Grade 7 idea 🌟”
6. **Misconception:** “Is dissolving the same as melting? 🤔”

Do not use the same generic labels for every topic. The learner should understand what each choice will reveal before tapping it.

### Example branch tree

```text
Why does iron rust? 🔩
├── What does oxygen do? 💨
│   ├── Are new particles formed? ⚛️
│   └── Can we write a word equation? ✍️
├── Why does water speed it up? 💧
│   └── Does salt water rust iron faster? 🌊
├── How can rust be prevented? 🛡️
└── Show a rusting simulation 🧪
```

---

## 11. Seed Experience: “Why Does Iron Rust?”

This is the reference-quality topic used to validate the first implementation.

### 11.1 Introduction node — Grade 6

**Title:** Why Does Iron Rust? 🔩🟠  
**Estimated time:** 3 minutes

Required blocks:

1. **Hero:** A familiar rusted bicycle chain or gate.
2. **Observation:** Rust appears as a flaky reddish-brown coating.
3. **Explanation:** Iron reacts slowly with oxygen in the presence of water, producing rust.
4. **Three-part diagram:** iron + oxygen + water → rusting conditions.
5. **Vocabulary:** reaction, oxygen, rust.
6. **Everyday connection:** wet coastal or rainy environments.
7. **Remember:** Rust is a new substance; it is not simply dirt stuck to iron.
8. **Explore choices:**
   - “Why does water matter? 💧”
   - “How can we stop rust? 🛡️”
   - “Is rusting a chemical change? ⚛️”
   - “Try the rust conditions simulation 🧪”

### 11.2 Expansion: Why does water matter?

- Explain that water helps the processes that move charged particles during corrosion.
- At Grade 6, keep the mechanism conceptual.
- Offer **Stretch idea 🌟** for ions/electrochemical detail at Grade 8.
- Compare dry air, ordinary water exposure, and salty water.
- Avoid presenting a misleading single-step molecular equation for rust, whose composition can vary.

### 11.3 Expansion: How can we stop rust?

Use a comparison block:

| Method | How it helps |
|---|---|
| Paint | Creates a barrier against water and oxygen |
| Oil/grease | Keeps moisture away from moving metal parts |
| Galvanizing | Adds a protective zinc coating |
| Stainless steel | Uses an alloy designed to resist corrosion |

Follow-up choices should explore barriers, alloys, and sacrificial protection at level-appropriate depth.

### 11.4 Reference simulation: `rust-conditions.v1`

Add this Chemistry-specific reviewed template.

**Controls:**

- Oxygen: present/absent.
- Water: dry/damp/submerged.
- Salt: off/on.
- Protective coating: none/paint/oil/zinc.
- Time control.

**Shows:**

- Four labeled iron samples.
- Conceptual rust coverage over time.
- A comparison chart.
- A reminder that time is accelerated and the result is a model.

**Predict-first prompt:**  
“Which sample do you think will rust fastest? Place your prediction before starting. 🤔”

**Result explanation:**  
Explain the role of water and oxygen, why salt usually speeds corrosion, and how a complete barrier protects iron.

The simulation must not suggest that the learner reproduce it using unsafe materials.

---

## 12. Quick Checks

Quick checks are optional, one question at a time, and embedded naturally after an explanation or simulation.

Supported patterns:

- Predict an outcome.
- Choose the best particle diagram.
- Sort examples into element/compound/mixture.
- Spot the misconception.
- Balance a visual atom count at Grade 7–8.
- Explain a result by selecting one of three reasons.

Feedback structure:

- **Correct:** Confirm why, then add one useful connection.
- **Incorrect:** Say “Good try,” identify the key clue, and show the reasoning visually.
- Never use red failure screens, negative sounds, point loss, or time pressure.

---

## 13. Chemistry AI Context

Every Chemistry generation request includes:

- Learner study level.
- Current canonical topic and strand tags.
- Summaries of ancestor nodes.
- Concepts and vocabulary already introduced.
- Exact selected branch intent or learner question.
- Allowed block types.
- Available reviewed simulation template IDs.
- Reviewed real-world activity IDs.
- Chemistry misconception rules.
- Safety policy.
- Required structured response schema.

The model should not receive entire image binaries or unrelated saved-topic content. Use concise summaries to control cost while maintaining continuity.

### Content quality checks

Before persistence, validate:

- Factual consistency between blocks.
- Vocabulary appropriate for the level.
- Atom conservation in particle diagrams and equations.
- Units and numerical examples.
- Simulation compatibility.
- No unsafe procedural content.
- No repeated paragraph from ancestor nodes.
- No unsupported external links or citations.

For high-risk or ambiguous requests, return a safe redirect rather than attempting to “repair” dangerous instructions.

---

## 14. Chemistry Saved-Topic Snapshot

In addition to the general snapshot contract, store:

```json
{
  "subject": "chemistry",
  "primary_strand": "reactions",
  "concept_tags": ["rusting", "oxidation", "corrosion"],
  "concepts_introduced": ["chemical reaction", "oxygen", "rust"],
  "vocabulary": [
    {
      "term": "reaction",
      "level": 6,
      "definition": "..."
    }
  ],
  "safety_classification": "safe_theory",
  "activity_allowlist_version": "chemistry-activities.v1",
  "simulation_registry_version": "chemistry-simulations.v1"
}
```

These fields allow saved-topic filtering, safe future continuation, and compatibility checks without regenerating earlier content.

---

## 15. Chemistry Acceptance Criteria

1. The home screen offers the six starter collections and topic search/input.
2. Explanations correctly adapt across Grade 5–8 using the progression in this document.
3. Chemistry nodes connect observable, particle, and symbolic views where level-appropriate.
4. Particle diagrams follow count, legend, scale, and accessibility rules.
5. The reference rust topic meets all required blocks and branch choices.
6. At least `particle-states.v1`, `dissolving.v1`, `atom-builder.v1`, `ph-indicator.v1`, `mass-balance.v1`, and `rust-conditions.v1` are available for the relevant topics.
7. No model-generated JavaScript is executed.
8. Unsafe experiment requests are refused and redirected to safe theory or simulation.
9. Generated content avoids the named common misconceptions.
10. A saved Chemistry exploration reopens completely—with visuals and simulations—and performs no AI call.

