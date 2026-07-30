# Genius Corner — Product Specification

## 1. Product Summary

**Feature name:** Genius Corner  
**Product:** Aashvath Learning Companion  
**Initial subject:** Chemistry  
**Future subjects:** Physics, Biology, Mathematics, Earth Science, History, and others  
**Primary learner:** Aashvath  
**Supported study levels:** Grade 5 through Grade 8  
**Default study level:** Grade 6

Genius Corner is an open-ended, curiosity-led learning space. Aashvath starts with a topic, reads a short and approachable introduction, and chooses what to explore next. Every **Read More** action expands the current idea with greater depth, better examples, visuals, questions, and optional interactive simulations.

The experience should feel like an interactive learning bot, but it must not look like a conventional text-chat interface. AI responses are rendered as polished learning cards containing headings, short paragraphs, callouts, emoji, diagrams, image panels, mini activities, and simulations.

The first release covers Chemistry while keeping the content and storage model subject-neutral.

---

## 2. Goals

1. Make reading feel approachable by starting with small, visually inviting content.
2. Let Aashvath control the direction and depth of learning.
3. Keep all explanations appropriate for a selected Grade 5–8 study level.
4. Use generated visuals and interactive simulations when they make an idea easier to understand.
5. Turn AI output into a consistent, safe, attractive interface instead of displaying raw Markdown.
6. Save a complete topic exploration so it can be opened later without calling AI again.
7. Create a reusable foundation for subjects beyond Chemistry.

### Non-goals for the first release

- A free-form general-purpose chatbot.
- Formal examination preparation or automatic grading.
- Multi-student classrooms, teacher accounts, or public sharing.
- Allowing the AI model to execute arbitrary JavaScript.
- Replacing supervised real-world laboratory instruction.

---

## 3. Primary User Experience

### 3.1 Entry points

Add these items to the main application navigation:

- **🧠 Genius Corner** → `/genius-corner`
- **🔖 Saved Topics** → `/genius-corner/saved`

On narrow screens, the items may appear inside a **More** menu to prevent the existing navigation from wrapping.

### 3.2 Genius Corner home

The home screen contains:

- A cheerful heading: **“What are you curious about today? 🧠✨”**
- A subject selector. Chemistry is enabled; future subjects may appear as disabled **Coming Soon** cards.
- A prominent topic input with examples such as:
  - “Why does iron rust?”
  - “What are atoms made of?”
  - “Why does salt disappear in water?”
- Suggested topic cards.
- A study-level selector for Grades 5, 6, 7, and 8.
- A primary action: **🚀 Start Exploring**
- A compact **Continue Learning** section for the most recent unsaved or saved exploration.

The app remembers the most recently selected study level locally. Grade 6 is used when no preference exists.

### 3.3 Starting a topic

After a topic is submitted:

1. Validate that it belongs to the selected subject and is safe for a child.
2. Normalize the topic into a clear title.
3. Generate the first lesson node.
4. Immediately show a friendly loading experience with changing educational messages, for example:
   - “Gathering tiny ideas into a big explanation… ⚛️”
   - “Drawing a picture to make this easier… 🎨”
5. Render the introduction as structured learning blocks.

The first node should take roughly 2–4 minutes to read and contain:

- A short hook.
- A simple explanation.
- One everyday-life connection.
- At least one visual when it materially improves understanding.
- A **💡 Remember This** summary.
- Two to four suggested directions for further exploration.

### 3.4 Progressive “Read More” exploration

Every topic node ends with suggested next-step chips rather than a single generic continuation:

- **🔍 How does it work?**
- **🌍 Where do we see it?**
- **⚛️ Go one level deeper**
- **🧪 Try a simulation**
- Topic-specific directions such as **“Why does rust need water?”**

Selecting a chip creates a child node connected to the current node. The generated detail must:

- Build on information already shown.
- Avoid repeating entire earlier explanations.
- Remain at the selected study level.
- Define new vocabulary before using it heavily.
- Prefer one strong analogy over several weak analogies.
- Include a visual or simulation only when it helps the concept.
- Offer further choices at the end.

A lightweight **Exploration Trail** shows the path taken:

`Atoms ⚛️ → Inside an atom 🔬 → Electrons ⚡`

The learner can return to any previously generated node without another AI call.

### 3.5 Ask a question

Each node includes **❓ Ask about this**. This opens a small input attached to the current topic context. It is not presented as a chat transcript.

The answer appears as another structured learning node and may contain:

- An illustrated explanation.
- A comparison card.
- A step sequence.
- A misconception correction.
- A simulation.
- Follow-up exploration choices.

If a question is unrelated to the selected subject, the interface gently redirects:

> “That is a great question! 🌟 Genius Corner is exploring Chemistry right now. Try a chemistry question, or save this idea for a future subject.”

---

## 4. Content Presentation

### 4.1 No raw AI text

The client must never render untrusted model output directly as Markdown or HTML. The generation service returns validated JSON using a versioned content schema. The UI maps each block type to a designed component.

If a legacy or fallback response contains Markdown, parse it on the server into the supported block schema. Never show Markdown punctuation such as `##`, `**`, or raw code fences to the learner.

### 4.2 Supported content blocks

| Block | Purpose |
|---|---|
| `hero` | Topic title, emoji, hook, and optional cover image |
| `paragraph` | One short explanation, normally 30–90 words |
| `key_fact` | A visually prominent fact or rule |
| `steps` | A numbered process with an icon for each step |
| `comparison` | Two or three concepts shown side by side |
| `vocabulary` | Term, simple definition, pronunciation, and example |
| `analogy` | Familiar analogy plus a note explaining its limits |
| `image` | Generated or curated image with caption and alt text |
| `diagram` | Labeled concept diagram from a safe declarative specification |
| `simulation` | Interactive model selected from an approved simulation registry |
| `quick_check` | One low-pressure multiple-choice or predict-first question |
| `reveal` | “Think first, then reveal” explanation |
| `remember` | Two or three takeaway points |
| `safety_note` | Age-appropriate caution for experiments or substances |
| `explore_choices` | Two to four context-aware next actions |

### 4.3 Kid-friendly style

- Use warm, energetic language without talking down to the learner.
- Use emoji as navigation and meaning cues, not as decoration on every sentence.
- Aim for 1–3 relevant emoji per card.
- Keep paragraphs short and scannable.
- Use large tap targets and clear visual hierarchy.
- Prefer concrete examples from home, food, nature, sports, machines, and space.
- Celebrate curiosity rather than speed or correctness.
- Avoid dense walls of text even at Grade 8.
- Use accessible contrast; never make color the only source of meaning.

### 4.4 Study-level adaptation

The study level affects vocabulary, sentence complexity, abstraction, and assumed knowledge—not just answer length.

| Level | Expected treatment |
|---|---|
| Grade 5 | Concrete observations, everyday examples, minimal symbols, guided vocabulary |
| Grade 6 | Simple particle models, cause-and-effect, basic scientific terms |
| Grade 7 | More precise models, simple formulae, variables, evidence and exceptions |
| Grade 8 | Deeper particle reasoning, introductory equations, model limitations, multi-step explanations |

Changing the level during an exploration does not rewrite existing nodes. It creates future nodes at the new level and records the level on each node.

---

## 5. Visual Generation

### 5.1 When to generate an image

Generate an image when it can clarify:

- Something too small, large, fast, slow, or abstract to observe directly.
- A before/after transformation.
- A spatial arrangement.
- A process with multiple visible stages.
- A memorable analogy.

Do not generate an image merely to fill space. Prefer reusable, deterministic diagrams for labels, arrows, particle arrangements, graphs, and apparatus layouts.

### 5.2 Image requirements

Every generated image record includes:

- A child-safe generation prompt.
- Subject and topic metadata.
- Aspect ratio.
- A factual caption.
- Useful alt text.
- Generation status.
- A durable stored asset URL or object-storage key.
- Model/provider metadata for audit purposes.

Images must not contain essential explanatory text because image models may render text incorrectly. Labels should be overlaid by the application using HTML/SVG from validated structured data.

If image generation fails, render the lesson immediately with a styled fallback diagram or illustration placeholder. The learner can retry the image independently without regenerating the lesson.

### 5.3 Accuracy review

For scientific visuals:

1. Generate the lesson and a separate visual specification.
2. Check the visual specification against the lesson facts.
3. Generate the image.
4. Display a caption that states when the image is a model and not to scale.

---

## 6. Live JavaScript Simulations

### 6.1 Safety architecture

The AI must never return arbitrary executable JavaScript.

Simulations use a registry of reviewed React/JavaScript templates such as:

- Particle motion.
- Heating and cooling.
- Dissolving.
- Diffusion.
- Atomic structure.
- pH indicator.
- Reaction-rate collision model.
- Conservation-of-mass balance.

The AI may select a template and provide validated parameters, labels, learning goals, and explanation text. Unknown template IDs or invalid parameters are rejected.

### 6.2 Simulation experience

Each simulation contains:

- A clear question or goal.
- A **Predict first 🤔** prompt.
- One or two controls at lower grades; up to four at higher grades.
- Start, pause, reset, and replay controls.
- Live labels and a simple result display.
- A **What changed?** explanation after interaction.
- Reduced-motion support and keyboard accessibility.

Simulations are conceptual models. Each includes a short **Model Note** identifying simplifications.

### 6.3 Persistence

A saved simulation stores:

- Template ID and schema version.
- Validated configuration.
- Initial/default state.
- Optional learner-selected state at save time.
- Captions, labels, and explanation blocks.

It must be reproducible without an AI call.

---

## 7. Saving and Reopening Topics

### 7.1 Save action

The exploration header has a **🔖 Save for Future** action.

Saving creates an immutable snapshot of everything required to render the current exploration:

- Topic title, subject, study level, and topic summary.
- All generated nodes in their current order.
- Parent-child exploration links.
- Structured content blocks.
- Explore-choice labels already shown.
- Generated image asset references, captions, and alt text.
- Diagram specifications.
- Simulation templates, versions, and configurations.
- Quick-check questions and reveal content.
- Schema and renderer version.
- Generation metadata and timestamps.

Reopening a saved topic performs **zero AI calls**. It loads and renders the stored snapshot.

### 7.2 Continuing a saved topic

When viewing a saved snapshot, existing content remains unchanged. If the learner selects a new **Read More** choice:

1. Create a new working revision based on the snapshot.
2. Call AI only for the newly requested node and any new visual.
3. Keep the original saved revision intact.
4. Let the learner choose **Update Saved Topic** or **Save as New Copy**.

### 7.3 Saved Topics page

The page includes:

- Search by title or keyword.
- Filter by subject and study level.
- Sort by recently saved, recently opened, or title.
- Topic cards containing emoji, title, subject, study level, save date, node count, and visual/simulation indicators.
- Actions: **Open**, **Continue**, **Rename**, and **Delete**.

Delete requires confirmation. A recoverable soft delete is preferred.

### 7.4 Autosave and recovery

Working explorations are autosaved after each generated node. If the browser closes or generation fails, the home screen offers **Continue Learning**. Autosaved drafts are distinct from explicitly saved topics and may be cleaned up after a configurable retention period.

---

## 8. Suggested Data Model

The exact Prisma implementation may evolve, but the domain model should preserve these boundaries.

```prisma
model GeniusExploration {
  id              String   @id @default(cuid())
  subject         String
  canonicalTopic  String
  displayTitle    String
  defaultLevel    Int
  status          String   // DRAFT | SAVED | ARCHIVED
  activeNodeId    String?
  sourceRevisionId String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  lastOpenedAt    DateTime @default(now())
  deletedAt       DateTime?
  nodes           GeniusNode[]
  revisions       GeniusRevision[]
}

model GeniusNode {
  id              String   @id @default(cuid())
  explorationId   String
  parentNodeId    String?
  level           Int
  nodeType        String   // INTRO | READ_MORE | QUESTION
  promptLabel     String?
  title           String
  contentSchema   String
  content         Json
  sortOrder       Int
  generatedAt     DateTime @default(now())
  exploration     GeniusExploration @relation(fields: [explorationId], references: [id])
}

model GeniusRevision {
  id              String   @id @default(cuid())
  explorationId   String
  revisionNumber  Int
  snapshotSchema  String
  snapshot        Json
  createdAt       DateTime @default(now())
  exploration     GeniusExploration @relation(fields: [explorationId], references: [id])

  @@unique([explorationId, revisionNumber])
}

model GeniusAsset {
  id              String   @id @default(cuid())
  explorationId   String
  nodeId          String?
  assetType       String   // GENERATED_IMAGE | DIAGRAM
  storageKey      String
  mimeType        String
  altText         String   @db.Text
  caption         String?  @db.Text
  metadata        Json
  createdAt       DateTime @default(now())
}
```

The saved `snapshot` is the canonical replay payload. Normalized nodes improve editing and querying, but reopening a saved revision must not depend on regenerating or reconstructing content from prompts.

---

## 9. Structured AI Contract

### 9.1 Lesson-node response

```json
{
  "schema_version": "genius-node.v1",
  "subject": "chemistry",
  "canonical_topic": "rusting",
  "title": "Why Does Iron Rust? 🔩",
  "study_level": 6,
  "estimated_read_minutes": 3,
  "blocks": [
    {
      "type": "hero",
      "emoji": "🔩",
      "hook": "Rust is evidence of a slow chemical reaction happening around us."
    },
    {
      "type": "paragraph",
      "text": "..."
    },
    {
      "type": "diagram",
      "diagram_id": "rust-requirements",
      "spec": {}
    },
    {
      "type": "remember",
      "points": ["...", "..."]
    }
  ],
  "explore_choices": [
    {
      "id": "why-water-matters",
      "emoji": "💧",
      "label": "Why does rust need water?",
      "intent": "Explain water's role in rusting at Grade 6 level."
    }
  ],
  "safety": {
    "classification": "safe_theory",
    "notice": null
  }
}
```

### 9.2 Validation rules

- The entire response must pass server-side schema validation.
- `study_level` must be an integer from 5 through 8.
- Block types must come from the supported registry.
- Text length is capped per block.
- URLs, HTML, scripts, event handlers, and unknown object keys are rejected.
- Simulation IDs must exist in the reviewed registry.
- Image prompts are generated and filtered separately from learner-visible copy.
- Invalid responses may be repaired once; otherwise show a safe retry state.

---

## 10. Proposed API Surface

| Method | Route | Purpose |
|---|---|---|
| `POST` | `/api/genius/explorations` | Start a topic and generate its introduction |
| `GET` | `/api/genius/explorations/[id]` | Load a draft exploration |
| `POST` | `/api/genius/explorations/[id]/expand` | Generate one selected Read More node |
| `POST` | `/api/genius/explorations/[id]/question` | Generate one contextual answer node |
| `POST` | `/api/genius/explorations/[id]/save` | Create a complete saved revision |
| `PATCH` | `/api/genius/explorations/[id]` | Rename, archive, or update metadata |
| `GET` | `/api/genius/saved` | Search and list saved topics |
| `GET` | `/api/genius/saved/[id]` | Load a saved revision with no AI call |
| `DELETE` | `/api/genius/saved/[id]` | Soft-delete a saved topic |
| `POST` | `/api/genius/assets/images` | Generate/retry a node image |

Mutating endpoints require the same family-level access controls as the rest of the application. Rate limits apply per exploration and per minute.

---

## 11. Generation, Loading, and Failure States

- Stream progress by block or show staged placeholders so the page never feels frozen.
- Disable duplicate expansion requests while one choice is generating.
- Make requests idempotent with a client request ID.
- Preserve the current exploration if the generation request fails.
- Show **Try Again** and alternative explore choices.
- A failed image or simulation must not discard successful lesson text.
- Time out long-running requests cleanly and continue autosaving completed nodes.
- Log schema failures, generation latency, asset failures, and token usage without logging unnecessary personal information.

---

## 12. Child Safety and Scientific Integrity

- Treat learner-entered prompts as untrusted.
- Refuse instructions involving explosives, poisons, illegal drugs, weaponization, dangerous heating, pressurized vessels, ingestion, or unsupervised chemical mixing.
- Redirect unsafe requests toward a safe conceptual explanation or simulation.
- Clearly distinguish observations, models, analogies, and established facts.
- Avoid claiming that generated diagrams are exact or to scale.
- Label any real-world activity with supervision, materials, cleanup, and safety requirements.
- For the initial release, real-world activities are restricted to a reviewed allowlist.
- Do not include outbound links or advertisements in generated content.

---

## 13. Accessibility and Dysgraphia Support

- The core journey requires little typing beyond the initial topic or optional question.
- Exploration choices are tappable chips.
- Provide read-aloud controls for headings, explanations, and captions.
- Highlight the currently spoken block.
- Support keyboard use, screen readers, reduced motion, and zoom to 200%.
- Do not require handwritten answers.
- Quick checks are optional and give encouraging explanatory feedback.
- Never show public scores, penalties, or streak loss inside Genius Corner.

---

## 14. Analytics and Success Measures

Track product events without storing generated answer text in analytics:

- Topic started.
- Introduction completed or meaningfully viewed.
- Read More choice selected.
- Question asked.
- Image opened.
- Simulation started and completed.
- Topic saved, reopened, continued, renamed, or deleted.
- Study level changed.
- Generation failed or retried.

Initial success indicators:

- Percentage of started topics with at least one Read More action.
- Average number of nodes explored per session.
- Percentage of explorations explicitly saved.
- Saved-topic reopen rate.
- Simulation engagement rate.
- Reading completion proxy such as block visibility or read-aloud completion.
- Low unsafe-request and generation-failure rates.

Avoid optimizing for session length alone; a short, satisfying explanation is a successful outcome.

---

## 15. Delivery Phases

### Phase 1 — Structured Chemistry reader

- Genius Corner home.
- Chemistry topic start.
- Grade 5–8 selector.
- Structured introduction and Read More nodes.
- Exploration trail.
- Draft autosave.
- Save and Saved Topics pages.
- Read-aloud support.

### Phase 2 — Visual learning

- Generated images with durable asset storage.
- Declarative diagrams.
- Image retry and fallbacks.
- Visual accuracy checks.

### Phase 3 — Interactive learning

- Reviewed simulation registry.
- Predict-first interaction.
- Persisted simulation configurations.
- Quick checks and reveal cards.

### Phase 4 — Expansion

- Parent review controls.
- Additional subjects using subject-specific policies.
- Cross-topic recommendations.
- Optional learning summaries and progress insights.

---

## 16. Acceptance Criteria

1. Aashvath can start a Chemistry topic at any Grade 5–8 level.
2. The introduction renders as designed cards with no visible raw Markdown or HTML.
3. Every successful node offers two to four useful next directions.
4. Selecting Read More adds one context-aware node without replacing earlier content.
5. Existing nodes reopen without an AI call.
6. Generated images have stored assets, captions, alt text, and graceful fallbacks.
7. Simulations can only use reviewed templates and validated parameters.
8. Saving captures the full exploration, images, diagrams, simulations, and navigation links.
9. Opening a Saved Topic makes zero AI calls and matches the saved appearance and behavior.
10. Continuing a saved topic preserves the earlier revision.
11. Unsafe chemistry requests are blocked or redirected safely.
12. The experience works on phone, tablet, and desktop and is usable with keyboard and screen reader.

