# Aashvath Learning Companion — Project Specification

## 1. Project Overview

**Name:** Aashvath Learning Companion (working title: `ap`)  
**URL:** https://ap.allshare.me  
**Purpose:** A daily 1-hour structured learning session manager for Aashvath, a Grade 6 student at Heritage Experiential School. The app generates personalized daily learning plans, guides a supervised 9PM–10PM session, tracks work quality, and shows progress over time.

---

## 2. Student Profile

| Attribute | Detail |
|-----------|--------|
| Name | Aashvath |
| Grade | 6 (Heritage Experiential School, CBSE) |
| IQ | ~130 (gifted range) |
| Learning style | Visual + audio (YouTube-first learner) |
| Strengths | Science, non-fiction deep dives, conceptual thinking |
| Challenges | Dysgraphia (writing avoidance, poor handwriting), reading aversion, discipline/homework habits |
| Language gap | Hindi and Sanskrit — starting from near-zero; CBSE 10th board mandates both |
| Homework pattern | Incomplete, uses colors/visual shortcuts to avoid writing (indicator of disengagement) |

### Dysgraphia Accommodations (built into content)
- Writing prompts are short (max 5 lines), structured, and traceable (copy tasks preferred over free composition initially)
- Praise effort over output quality
- Allow verbal + visual thinking before committing to paper
- Progress metrics focus on consistency, not volume

---

## 3. Daily Session Structure (9:00 PM – 10:00 PM)

The session is broken into 6 phases. Each phase has a timer, a task card, and a completion checkbox.

| Phase | Duration | Purpose |
|-------|----------|---------|
| **1. Day Review** | 10 min | Verbal debrief of school day — what happened, what was hard, what was fun |
| **2. Read Aloud** | 10 min | Short non-fiction science passage (200–300 words) on a rotating topic. Designed to build reading habit via interest. |
| **3. Hindi / Sanskrit Practice** | 15 min | Daily micro-lesson on one vocabulary cluster, one script element, or one sentence pattern. Rotating Hindi/Sanskrit days or mixed. |
| **4. Writing Exercise** | 15 min | Guided copy/short-write exercise. Dysgraphia-friendly: short, structured, meaningful. Self-rated for legibility/completeness. |
| **5. Work Quality Check** | 5 min | Parent-guided review of today's school homework/classwork quality. Rate discipline, completeness, use of shortcuts (colors as avoidance). |
| **6. Next Day Prep** | 5 min | Check school bag, review tomorrow's timetable, set a micro-goal for next day. |

---

## 4. Content Generation (OpenAI)

### Daily Content Package
Generated once per day at **8:00 PM** via a scheduled job, stored in the database. If generation fails, falls back to yesterday's content with a modified date header.

Each daily package contains:

```json
{
  "date": "YYYY-MM-DD",
  "reading": {
    "title": "...",
    "topic": "...",        // science sub-topic (space, biology, physics, etc.)
    "passage": "...",      // 200-300 words, grade 6 level, engaging
    "comprehension_questions": ["...", "...", "..."]
  },
  "hindi": {
    "type": "vocabulary|script|sentence",
    "lesson_title": "...",
    "content": "...",      // actual lesson content
    "practice_task": "...",
    "remember_tip": "..."
  },
  "sanskrit": {
    "type": "vocabulary|script|sentence",
    "lesson_title": "...",
    "content": "...",
    "practice_task": "...",
    "remember_tip": "..."
  },
  "writing_exercise": {
    "type": "copy|dictation|guided_composition",
    "prompt": "...",       // what to write
    "lines_required": 3,   // max 5 for dysgraphia accommodation
    "success_criteria": ["legible", "complete", "no skipped words"]
  },
  "science_hook": "...",   // 1-sentence fascinating science fact to open session
  "ethics_reflection": "...", // short thought on discipline/effort/honesty
  "next_day_tip": "..."    // generic prep reminder
}
```

### OpenAI Prompt Strategy

**Model:** GPT-4o (balances quality and cost)  
**System prompt** sets:
- Student profile (age, dysgraphia, interests, level)
- Rotating topic schedule (see below)
- Output format (strict JSON)
- Tone: engaging, not condescending, science-literate

**Topic rotation for reading:**
- Week 1: Space & Astronomy
- Week 2: Human Body & Biology
- Week 3: Physics & Forces
- Week 4: Earth Science & Climate
- Repeat with new angles (curriculum-linked where possible)

**Hindi/Sanskrit rotation:**
- Monday/Wednesday/Friday: Hindi
- Tuesday/Thursday/Saturday: Sanskrit
- Sunday: Review + revision quiz from the week

---

## 5. Rating & Tracking System

### Daily Session Ratings
After each session, the parent rates each phase:

| Phase | Rating fields |
|-------|--------------|
| Day Review | mood (1–5), engagement (1–5) |
| Read Aloud | completed (yes/no), comprehension score (0–3 questions) |
| Hindi/Sanskrit | completed (yes/no), confidence (1–5) |
| Writing Exercise | lines written (0–5), legibility (1–5), effort (1–5) |
| Work Quality | homework completeness (1–5), discipline (1–5), shortcut usage (flag: none/minor/major) |
| Next Day Prep | bag packed (yes/no), goal set (yes/no) |

### Derived Metrics (shown in graphs)
- **Writing Consistency Score** = avg(lines_written / lines_required) × avg(effort) rolling 7-day
- **Reading Habit Score** = % sessions with reading completed, 30-day rolling
- **Language Progress** = Hindi confidence + Sanskrit confidence, weekly avg
- **Discipline Index** = avg(homework_completeness) - penalty for major_shortcut_usage
- **Session Attendance** = sessions logged / days since start (%)

---

## 6. Features

### 6.1 Today's Plan (Default Landing Page)
- Opens to **today's date** automatically
- Shows all 6 phases as expandable cards with a timer for each
- Phase cards display generated content inline (passage, lesson, writing prompt)
- Each card has: Start Timer → Mark Complete → Rate (parent input after completion)
- Progress bar across top showing completed phases
- Session can be saved as draft and completed later the same day

### 6.2 Session History & Search
- Calendar view: colored dots per day (green = completed, yellow = partial, red = missed)
- Click any date to view that day's full plan + ratings
- Search by: date range, topic keyword, rating range
- Filter: show only reading sessions, writing sessions, language sessions

### 6.3 Progress Dashboard
- Charts (line graphs, bar charts):
  - Writing Consistency over time
  - Reading Habit Score (30-day rolling)
  - Hindi vs Sanskrit confidence trend
  - Discipline Index trend
  - Session attendance (streak counter prominent)
- Milestone badges (e.g., "7-day streak", "First Sanskrit sentence", "5 clean writing sessions")

### 6.4 Content Review / Edit (Admin)
- Before each session, parent can view and optionally edit today's generated content
- Override individual sections (e.g., swap reading passage, change writing prompt)
- Mark content as "used" or "skip to tomorrow"

### 6.5 Session Timer
- Phase-by-phase countdown timer visible on screen
- Soft bell/notification at phase end
- Auto-advances to next phase (with confirmation click)
- Pause/resume support
- Total elapsed time displayed

### 6.6 Notifications
- 8:00 PM: "Content ready for tonight's session"
- 9:00 PM: "Session time! Tap to begin"
- 10:15 PM: "Don't forget to rate tonight's session"

---

## 7. Technical Architecture

### 7.1 Tech Stack

| Layer | Technology | Reason |
|-------|------------|--------|
| Frontend | Next.js 14 (App Router) | SSR for fast load, full-stack capability, easy deployment |
| Styling | Tailwind CSS + shadcn/ui | Fast, clean, mobile-friendly |
| Backend API | Next.js API Routes | Keeps stack unified |
| Database | MySQL 8 on 10.0.0.3 (via Prisma ORM) | Existing MySQL server, root access via SSH key |
| Scheduler | Node-cron (in-process) or system cron | Daily 8PM content generation |
| AI | OpenAI GPT-4o via official SDK | Content generation |
| Auth | Simple password (PIN) for parent dashboard | Single-family app, no multi-user needed |
| Deployment | Node.js + PM2 + Nginx on ap.allshare.me | Existing server |
| Version Control | GitHub (private repo) | Source management |

### 7.2 Database Schema (Prisma)

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model DailyPlan {
  id              String   @id @default(cuid())
  date            DateTime @unique @db.Date
  generatedAt     DateTime @default(now())
  content         Json     // full OpenAI-generated package (MySQL JSON column)
  edited          Boolean  @default(false)
  editedContent   Json?    // parent overrides if any (MySQL JSON column)
  session         Session?
}

model Session {
  id              String      @id @default(cuid())
  date            DateTime    @db.Date
  dailyPlan       DailyPlan   @relation(fields: [dailyPlanId], references: [id])
  dailyPlanId     String      @unique
  startedAt       DateTime?
  completedAt     DateTime?
  status          SessionStatus @default(PENDING) // PENDING | PARTIAL | COMPLETE | MISSED
  phases          PhaseRating[]
  notes           String?     // parent free-text notes
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
}

model PhaseRating {
  id              String    @id @default(cuid())
  session         Session   @relation(fields: [sessionId], references: [id])
  sessionId       String
  phase           Phase     // DAY_REVIEW | READ_ALOUD | LANGUAGE | WRITING | WORK_QUALITY | NEXT_DAY_PREP
  completed       Boolean   @default(false)
  ratings         Json      // phase-specific rating fields (flexible)
  timeSpentSec    Int?
  createdAt       DateTime  @default(now())
}

enum SessionStatus {
  PENDING
  PARTIAL
  COMPLETE
  MISSED
}

enum Phase {
  DAY_REVIEW
  READ_ALOUD
  LANGUAGE
  WRITING
  WORK_QUALITY
  NEXT_DAY_PREP
}
```

### 7.3 API Routes

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/plans/today` | Fetch today's plan (or generate if missing) |
| GET | `/api/plans/[date]` | Fetch plan for specific date |
| POST | `/api/plans/[date]/edit` | Parent override of plan content |
| GET | `/api/sessions` | List sessions (with filters) |
| GET | `/api/sessions/[date]` | Get session for date |
| POST | `/api/sessions/[date]/start` | Mark session started |
| PATCH | `/api/sessions/[date]/phase` | Submit phase rating |
| POST | `/api/sessions/[date]/complete` | Mark session complete |
| GET | `/api/metrics` | Aggregated metrics for dashboard |
| POST | `/api/generate` | Manually trigger content generation (admin) |

### 7.4 Scheduled Job

- **Trigger:** Daily cron at 20:00 IST (14:30 UTC)
- **Action:** Call OpenAI, generate tomorrow's plan, store in DB
- **Fallback:** If today's plan missing at 21:00, generate on-demand
- **Implementation:** `node-cron` package running within the Next.js server process (PM2 keeps it alive), OR a system cron calling a `/api/generate` endpoint with a secret key

---

## 8. UI/UX Design

### Design Principles
- **Large text** — easy to read in the evening, from arm's length
- **Phase cards** — one phase visible at a time (reduces overwhelm)
- **Color coding per phase** (not for avoidance, but for structure):
  - Day Review: Warm yellow
  - Reading: Blue
  - Language: Orange
  - Writing: Green
  - Work Quality: Red/Pink
  - Next Day Prep: Purple
- **Timer prominent** — always visible, creates healthy urgency
- **No clutter** — single column, no sidebars, mobile-first

### Pages / Routes

| Route | Description |
|-------|-------------|
| `/` | Redirects to `/session/today` |
| `/session/today` | Today's plan and live session |
| `/session/[date]` | Historical session view |
| `/history` | Calendar + search |
| `/dashboard` | Progress graphs and metrics |
| `/admin` | PIN-protected: view/edit content, trigger generation |
| `/admin/settings` | Notification times, topic rotation settings |

---

## 9. Deployment

### Server: ap.allshare.me
- OS: Linux (Ubuntu assumed)
- Access: SSH with `/home/shantanu/mykey.key`
- Web server: Nginx (existing, configure reverse proxy to port 3000)
- Process manager: PM2

### Deployment Steps (initial)
1. SSH into server, clone GitHub repo to `/var/www/ap`
2. Copy `.env.production` with DB connection, OpenAI key, auth PIN
3. Database already created: `aashvath_ap` on 10.0.0.3, app user `ap_user` granted access from 10.0.0.4
4. `npm install && npx prisma migrate deploy && npm run build`
5. `pm2 start npm --name "ap" -- start`
6. Configure Nginx:
   ```nginx
   server {
     server_name ap.allshare.me;
     location / {
       proxy_pass http://localhost:3000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
     }
   }
   ```
7. SSL: `certbot --nginx -d ap.allshare.me`

### Environment Variables
```env
DATABASE_URL=mysql://ap_user:Ap@Learn2025!@10.0.0.3:3306/aashvath_ap
OPENAI_API_KEY=<openai_key>
ADMIN_PIN=<4-6 digit PIN chosen by parent>
CRON_SECRET=<random string for triggering generation via HTTP>
NEXT_PUBLIC_STUDENT_NAME=Aashvath
NEXT_PUBLIC_SESSION_START_HOUR=21
CONTENT_GEN_HOUR=20
TZ=Asia/Kolkata
```

---

## 10. Content Generation Prompt Template

```
You are a learning assistant for Aashvath, a 11-year-old Grade 6 CBSE student in India.

Student profile:
- Very high IQ, loves science, especially space, biology, and physics
- Has dysgraphia: make all writing tasks short (max 5 lines), structured, and copy-based where possible
- Dislikes reading; use high-interest science hooks to make reading feel worthwhile
- Learning Hindi and Sanskrit from near-zero; use simple vocabulary, transliteration alongside Devanagari
- The session is 9PM-10PM supervised by his parent

Today's date: {date}
Day of week: {day}
Language focus today: {hindi|sanskrit}
Reading topic this week: {topic}

Generate a daily learning package in the following JSON format. Be engaging, age-appropriate, and scientifically accurate. The reading passage should feel like a YouTube thumbnail — surprising and fascinating. The language lesson should be one tiny, memorable chunk, not an overwhelming list.

{JSON schema as defined in section 4}
```

---

## 11. Development Phases

### Phase 1 — Core MVP (Week 1–2)
- [ ] Next.js project scaffold with Tailwind + shadcn
- [ ] PostgreSQL + Prisma setup
- [ ] OpenAI integration and content generation endpoint
- [ ] Daily plan API (generate + fetch)
- [ ] Today's session page with phase cards and timer
- [ ] Phase rating submission
- [ ] Daily cron job for 8PM generation
- [ ] Nginx + PM2 deployment on ap.allshare.me

### Phase 2 — History & Review (Week 3)
- [ ] Session history list with calendar view
- [ ] Search and filter sessions
- [ ] Historical session viewer

### Phase 3 — Dashboard & Metrics (Week 4)
- [ ] Metrics computation (rolling averages)
- [ ] Progress graphs (recharts or Chart.js)
- [ ] Milestone badges
- [ ] Streak counter

### Phase 4 — Polish (Week 5)
- [ ] Admin panel (content edit, manual trigger)
- [ ] Notifications (browser push or SMS via Twilio optional)
- [ ] Settings page (topic rotation, session timing)
- [ ] Print-friendly session card (for physical reference)
- [ ] Mobile responsiveness audit

---

## 12. Success Metrics

After 3 months:
- Session attendance > 80%
- Writing lines per session trending up (baseline 0-1 → target 3-4)
- Reading completion > 70% of sessions
- Hindi/Sanskrit confidence self-rated > 3/5 consistently
- Homework completeness > 3/5 weekly average
- Zero "major shortcut" flags for 2+ consecutive weeks

---

## 13. Out of Scope (v1)
- Student self-login (parent-operated only)
- Multi-student support
- AI evaluation of handwriting photos (future)
- Gamification / points system (consider Phase 5)
- Audio narration of passages (consider Phase 4+)
- Integration with school LMS or timetable

---

## 14. Repository & Infrastructure

| Item | Value |
|------|-------|
| GitHub repo | To be created: `aashvath-learning-companion` (private) |
| GitHub account | shantanu@mobileyug.com |
| Server | ap.allshare.me |
| Server SSH key | /home/shantanu/mykey.key |
| Production URL | https://ap.allshare.me |
| Database | MySQL 8 on 10.0.0.3 (root access via same SSH key) |
| OpenAI key | Stored in `.env` (never committed to git) |

---

*Spec version 1.0 — Created 2026-05-17*
