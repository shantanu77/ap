# Aashvath Learning Companion

**A focused, AI-assisted learning platform that turns one hour every evening into a consistent practice of curiosity, communication, and disciplined work.**

[Production site](https://ap.allshare.me)

Aashvath Learning Companion is a personal learning environment designed around one student rather than a generic classroom. It combines a structured daily routine, adaptive learning content, short reflection exercises, parent-guided review, and a visual exploration space for following scientific curiosity.

The product is built for a Grade 6 learner who thinks deeply, enjoys science and visual explanations, and benefits from extra structure around reading, writing, language practice, and completing schoolwork. It does not try to replace school or a teacher. Its purpose is to make deliberate practice easier to begin, easier to finish, and easier to understand over time.

## Why this product exists

Bright students do not always need more content. Often, they need a better bridge between curiosity and consistent effort.

A learner may happily spend an hour investigating atoms or space while avoiding a short reading passage, written response, or unfinished school task. Conventional learning applications tend to address this with more lessons, points, or generic streaks. Aashvath Learning Companion takes a different approach: it uses genuine curiosity as the entry point, then provides a predictable routine in which communication, reading, language, handwriting, preparation, and accountability all receive focused attention.

The platform is built around several principles:

- **Consistency before volume.** A short, completed exercise is more useful than an ambitious task that creates avoidance.
- **Curiosity is a pathway.** Science and “why” questions create momentum that can carry into reading and writing.
- **Structure reduces overwhelm.** One phase, one task, and one clear definition of success are shown at a time.
- **Effort should be visible.** The platform records participation, confidence, completion, and work quality—not only correct answers.
- **Difficulty should be accommodated, not ignored.** Writing tasks are deliberately short and structured to support a learner with dysgraphia.
- **A missed day should lead to recovery, not shame.** Pending and missed work remains visible so the learner can catch up intentionally.

## The daily learning session

The core experience is a guided evening session organized into six phases. Each phase has a specific purpose and records its own completion details.

| Phase | Focus | What happens |
| --- | --- | --- |
| Day Review | Reflection and communication | The learner talks through the school day, including what felt good, difficult, or unfinished. Spoken summaries can be reviewed with AI assistance. |
| Read Aloud | Reading fluency and comprehension | A high-interest passage is read aloud, followed by comprehension prompts. Recorded responses can be checked and supported. |
| Language | Hindi and Sanskrit foundations | Small vocabulary, script, and sentence-pattern lessons keep language practice approachable and repeatable. |
| Writing | Dysgraphia-aware written practice | Short copying or guided-composition tasks emphasize legibility, completion, and effort without demanding excessive volume. |
| Work Quality | Responsibility and self-observation | Schoolwork is reviewed for completeness, discipline, and avoidance patterns. |
| Next Day Prep | Executive function | The learner prepares the school bag, reviews upcoming needs, and chooses a small goal for the next day. |

The session page keeps the current task prominent, shows progress through the full routine, and saves phase results as the session develops. A session can be pending, partial, complete, or missed, allowing the system to represent real life rather than an all-or-nothing streak.

## Personalized daily plans

Daily plans are generated with OpenAI and stored in MySQL before they are used. A plan typically includes:

- An engaging science or nonfiction reading passage
- Comprehension questions
- A small Hindi or Sanskrit lesson
- A short, structured writing exercise
- A science hook to begin with curiosity
- A reflection about effort, discipline, or honesty
- A practical reminder for the following day

Generation is guided by the learner's grade level, interests, language needs, and writing accommodations. Content is stored rather than regenerated on every page load, which gives each day a stable lesson and preserves the context needed for session history.

The application can generate a plan through its protected cron endpoint, retrieve today's plan, regenerate it when appropriate, and load historical plans by date.

## Genius Corner

Genius Corner is the platform's open-ended exploration space. It lets the learner begin with a chemistry question and grow it into a connected trail of explanations.

Instead of returning a single wall of AI-generated text, Genius Corner builds the topic as a series of learning nodes. Each node can contain:

- Short explanations and memorable key facts
- Vocabulary with age-appropriate definitions
- Analogies and explicit notes about where an analogy stops being accurate
- Step-by-step processes and comparisons
- Contextual diagrams with labels specific to the concept
- Interactive simulations for supported topics
- Quick checks and “remember” summaries
- Suggested directions for deeper exploration

After reading a node, the learner can choose a suggested path or use **Ask it** to enter a detailed, multi-line question. Questions may contain up to 2,000 characters, making it possible to explain the learner's full reasoning rather than reducing curiosity to a short search phrase.

Explorations form a visible trail, so the learner can see how one question led to another. Topics can also be saved as snapshots and reopened later without another AI call. The current experience supports study levels from Grade 5 through Grade 8 and includes safety rules that avoid recommending dangerous or unsupervised chemistry activities.

## Progress, history, and parent visibility

The product treats the parent as a guide and observer, not merely an administrator.

The history view provides a record of daily sessions and their status. The dashboard turns those records into practical indicators such as attendance, completion, reading consistency, language confidence, and work-quality trends. Pending work remains discoverable, and missed sessions can be recorded with context so that patterns are visible over time.

Parent-facing reporting can summarize:

- Sessions attended, completed, partial, or missed
- Phase-level completion and ratings
- Incomplete work that needs attention
- Recent trends and streaks
- Notes attached to learning sessions

The application also contains parent notification and escalation configuration. Email recipients and absence thresholds are supplied through environment variables rather than embedded in source code.

## Product experience

The interface is designed for evening use on desktop or mobile:

- Large, readable typography
- High-contrast cards and clear calls to action
- A single-column session flow that reduces distraction
- Visual explanations that support conceptual learners
- Friendly language without making the material childish
- Responsive layouts for use beside books, notebooks, or schoolwork
- Small tasks with explicit completion criteria

The design aims to make the next useful action obvious. It avoids turning learning into a noisy game while still using color, icons, progress, and discovery to keep the experience inviting.

## Main application areas

| Route | Purpose |
| --- | --- |
| `/` | Loads the current learning experience |
| `/session/[date]` | Runs or reviews a dated six-phase learning session |
| `/history` | Shows past session activity and status |
| `/dashboard` | Presents learning metrics and progress summaries |
| `/genius-corner` | Starts a new guided chemistry exploration |
| `/genius-corner/[id]` | Continues an exploration and asks follow-up questions |
| `/genius-corner/saved` | Browses saved exploration snapshots |

## Technology

| Layer | Technology |
| --- | --- |
| Application | Next.js 16 App Router and React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Database | MySQL with Prisma 5 |
| AI | OpenAI Node SDK |
| Charts | Recharts |
| Production process | PM2 |
| Edge and TLS | Nginx in front of the Next.js server |

The application uses Next.js Route Handlers for its API, Prisma for persistent plans and sessions, and structured JSON for the flexible content inside learning plans and Genius Corner nodes.

## Data model

The principal records are:

- **DailyPlan** — one dated, generated plan with optional edited content
- **Session** — the learner's progress through a plan, timestamps, status, and notes
- **PhaseRating** — completion, ratings, and time spent for one session phase
- **GeniusExploration** — a chemistry topic, its connected learning nodes, and an optional saved snapshot

Database changes are versioned in `prisma/migrations` and are applied in production with `prisma migrate deploy`.

## Configuration

Copy `.env.example` to the appropriate environment file and provide secrets through the environment. Never commit real credentials.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | MySQL connection used by Prisma |
| `OPENAI_API_KEY` | Generates daily plans and Genius Corner content |
| `GENIUS_MODEL` | Selects the OpenAI model used by Genius Corner |
| `CRON_SECRET` | Protects scheduled plan generation |
| `NEXT_PUBLIC_STUDENT_NAME` | Displays the learner's name |
| `NEXT_PUBLIC_SESSION_START_HOUR` | Configures the expected session hour |
| `EMAIL` / `PASSWORD` | Credentials for parent email delivery |
| `PARENT_EMAILS` | Primary parent notification recipients |
| `ESCALATION_EMAILS` | Optional escalation recipients |
| `WARN_AFTER_ABSENCES` | Missed-session warning threshold |
| `ESCALATE_AFTER_ABSENCES` | Missed-session escalation threshold |

## Development

The project requires a Node.js environment and access to a MySQL database.

```bash
npm ci
cp .env.example .env.local
npx prisma migrate dev
npm run dev
```

The application will be available at `http://localhost:3000`.

Useful commands:

```bash
npm run dev       # Start the development server
npm run build     # Create and validate the production build
npm run start     # Run the production build
npx prisma studio # Inspect development data
```

## Production deployment

Production runs at [ap.allshare.me](https://ap.allshare.me). The repository includes `deploy.sh`, which implements the current release process:

1. Push local `main` to GitHub.
2. Connect to the production server over SSH.
3. Pull `origin/main` into `/var/www/ap`.
4. Install the exact dependencies from `package-lock.json`.
5. Load `.env.production`.
6. Apply pending Prisma migrations.
7. Build the Next.js application.
8. Restart the `ap` process with PM2.

```bash
./deploy.sh
```

Deployments should be followed by a check of the public pages and relevant user journey. Because the production database and AI services are integral to the product, a successful production build and focused live verification are the definitive release checks when equivalent local infrastructure is unavailable.

## Repository structure

```text
app/                  Pages and API Route Handlers
components/           Session, dashboard, and Genius Corner UI
lib/                  AI generation, persistence, reporting, and domain logic
prisma/               Database schema and migrations
types/                Shared TypeScript domain types
deploy.sh             Production deployment workflow
ecosystem.config.js   PM2 process definition
spec.md               Original product specification and design history
```

## Product direction

The long-term opportunity is larger than a homework tracker. This platform can become a durable record of how a learner builds habits, expresses ideas, responds to difficulty, and develops independent curiosity.

Potential future work includes richer parent controls, stronger accessibility support, curriculum-linked exploration paths, improved reporting, handwriting review, audio narration, and more interactive scientific models. Any expansion should preserve the central promise: technology should make focused human learning easier, not replace the relationship and effort that make learning meaningful.

---

Built as a personal learning companion for Aashvath.
