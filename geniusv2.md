# Genius Corner v2: researched chapters and meaning-aware exploration

## Product goal

Genius Corner should teach a coherent topic, not merely echo the wording of the first question. A query such as “types of chemical bond” must be resolved to the **chemical bonding** chapter, answered directly, and then expanded into the related ideas a learner needs. A query such as “why do atoms stick together?” can reuse that chapter while retaining its own focus.

The default lesson band is Grades 6–8:

1. **Grade 6 foundation:** familiar observations, essential vocabulary, simple models, and cause and effect.
2. **Grade 7 development:** more precise mechanisms, comparisons, evidence, and connected concepts.
3. **Grade 8 extension:** a clearly labelled next step with more formal reasoning, notation, or model limits where appropriate.

The selected Grade 6, 7, or 8 is a starting point for presentation. It must not remove the other parts of this core band. More advanced learning (Grades 9–12 or equivalent) is optional, selected through a branch, and labelled with its target level. It must not be mixed into required core content.

## Curriculum research and factual scope

On the first request for a canonical subject and chapter, Genius Corner researches the current NCERT curriculum and authoritative subject sources before drafting the chapter. Research must identify:

- What the current curriculum expects learners to know at Grades 6, 7, and 8.
- Which related concepts are prerequisites and which are sensible extensions.
- Whether the user's exact query is named in a chapter, is an implication of that chapter, or lies beyond Grade 8.
- Suitable examples, misconceptions, and visuals for the age band.
- The sources actually consulted, shown to the learner in a collapsible source panel.

The research notes and source links are stored with the cached chapter. Subsequent queries mapped to that chapter reuse the research and lesson instead of researching and regenerating the whole chapter.

### Chemistry example: chemical bonds

“Types of chemical bond” should resolve to one **chemical bonding** chapter, and that exact question should be answered prominently with the principal introductory categories (ionic and covalent bonding) and clear particle/electron models. The lesson then connects atoms, elements, compounds, electron transfer or sharing, simple formula examples, and the limits of the introductory model.

The application must not claim that “chemical bonding” is a formal Grade 8 NCERT chapter. The NCERT grade boundary is part of the explanation: Grade 6–8 ideas about matter, atoms, elements, compounds, and chemical changes are the foundation; ionic/covalent bonding is introduced as a carefully labelled conceptual extension when not explicitly in the current grade's book. Deeper bond polarity, Lewis structures, geometry, and orbital models remain optional higher-grade branches.

Curriculum research starts at the official [NCERT textbook portal](https://ncert.nic.in/textbook.php) and the current NCERT Grade 8 textbook catalogue. A related official reference is [Learning Outcomes at the Elementary Stage](https://www.ncert.nic.in/pdf/publication/otherpublications/tilops101.pdf). For example, the current Grade 8 science learning outcomes emphasize materials, chemical effects of electric current, and word equations for some reactions; they do not establish a dedicated chemical-bonding chapter. Search citations should be stored with exact titles and URLs and should make this distinction explicit.

## Query understanding and lesson identity

Before research or cache lookup, resolve each user query into a compact plan:

- Subject.
- Stable chapter key (lowercase kebab case).
- Human-readable chapter title.
- The exact question or requested focus to answer first.
- Two to four curriculum/research search terms.

The resolver groups synonyms and questions that belong in one comprehensive chapter. It must not merge different chapters simply because they share a vocabulary word. Keep the exact user focus separately from the chapter key so a reused lesson still highlights the requested question.

The chapter key is unique with subject, for example `chemistry:chemical-bonding`. A new question mapped to that key opens a new exploration record using the cached chapter. Existing saved explorations and their snapshots remain immutable.

## Lesson content contract

Every new chapter includes:

- A direct answer to the exact initiating focus near the top.
- A chapter map or clear subtopic sequence broad enough to answer common related questions; the introduction should usually be 500–700 useful words across 8–10 concise cards.
- Grade 6 foundation, Grade 7 development, and a clearly titled Grade 8 extension.
- Definitions on first use; worked examples or concrete applications; common misconception corrections.
- A declarative interactive visual or an approved simulation that actually teaches the selected subject matter.
- Two to four meaningful next actions, with at least one optional Grade 9–12 deep dive when appropriate.
- Curriculum scope notes and source citations in stored metadata.

Lesson text should be substantial enough to teach the chapter, organized into readable cards, and avoid repeating the same generic paragraph. A query that asks for a category, comparison, mechanism, or “why” must receive that structure explicitly rather than being reduced to an elementary definition.

## Deep dives and cache policy

Deep dives are separately generated nodes. They can target any level from Grade 6 through Grade 12; the core chapter remains Grade 6–8. Advanced nodes should explain required prerequisites briefly and state when their content goes beyond NCERT Grade 8.

For each deep-dive request:

1. Embed the subject, canonical chapter, and requested meaning with `text-embedding-3-small` (configurable by environment).
2. Compare only candidates from the same subject, canonical chapter, and target study level.
3. Reuse a result only when cosine similarity meets the strict threshold `GENIUS_DEEP_DIVE_SIMILARITY` (default `0.90`).
4. Reattach a reused node to the active exploration with a fresh node ID, the current parent, the current label, and requested level.
5. Otherwise generate a new explanation and persist its text, embedding, and structured node.

Embedding or cache outages must not prevent an otherwise safe lesson from being generated. A cache miss is always safe; a false positive that returns a different answer is not. Candidate searches are bounded by chapter and recent entries to keep latency controlled.

## Persistence and compatibility

- `genius_lesson_cache` stores one researched Grade 6–8 introduction per subject and canonical chapter.
- `genius_deep_dive_cache` stores independent structured nodes and embeddings, scoped by subject and canonical chapter.
- Each user exploration remains in `genius_explorations`; the shared cache is a source for new records, not the user's mutable trail.
- `curriculumResearch` is optional on `GeniusContent` so old records continue to deserialize. Older saved snapshots need no migration.
- Display stored research sources as ordinary links; never render model output as HTML or executable code.
- Only Grades 6–8 appear in the core grade selector. An advanced level is available only on an explicit deep-dive branch.

## Failure behavior

- If query resolution fails, retain the user's exact query as the chapter identity and focus.
- If web research is temporarily unavailable, do not fabricate citations or claim a verified NCERT mapping. Either use an explicitly labelled fallback research status/source or return a retryable generation error; never silently present the result as researched.
- If lesson generation fails after research, retain the research pack and show a safe retry path rather than discarding the curriculum work.
- If embeddings fail, generate normally and skip deep-dive cache read/write for that request.
- Existing cached chapters are served without web research or lesson generation.

## Acceptance criteria

1. “Type of chemical bond”, “types of chemical bonds”, and “how do atoms bond?” resolve to one chemistry chapter where appropriate, while each exact query is still answered first.
2. The first uncached chapter request performs NCERT/authoritative web research, stores the research plan, and exposes sources in the UI.
3. The chemistry bonding lesson explains the Grade 6–7 foundations, adds a Grade 8-labelled extension, and accurately marks formal bonding theory as beyond the Grade 8 NCERT chapter where applicable.
4. Core level choices are only 6, 7, and 8; the chapter always covers this progression.
5. Higher-level deep dives are optional, explicitly targeted, and support Grades 9–12.
6. A deep-dive node is reused only within the same subject/chapter and above the configured high cosine-similarity threshold.
7. Reused nodes receive fresh IDs and correct parent links; cached lesson records and prior saved snapshots are not mutated.
8. Existing Genius Corner records without research metadata remain readable.
9. No arbitrary model-generated JavaScript is executed, and interactive visuals remain constrained to the approved registry.
