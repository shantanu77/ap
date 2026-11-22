# AllShare Learning Companion v1 (AP v1)

## Goal

Extend the current single-learner study companion into a multi-learner service for children in Grades 6–8. Each learner gets a profile, keeps a long-lived sign-in, and sees only their own daily study work, settings, Genius Corner explorations, and ratings. Aashvath’s existing history is retained under his profile. Reusable generated lessons and semantically matched deep dives remain shared caches so equivalent questions do not trigger unnecessary regeneration.

## Learner and family experience

1. The welcome screen separates “Sign in” from “Create a profile.” Returning learners enter only their email address and receive a short-lived one-time code. New learners choose profile creation, then provide the learner name, grade, avatar, and parent/guardian attestation before requesting a code. Code-request responses do not reveal whether an email is already registered; after a code is verified, an email with no profile is guided to profile creation.
2. After verification, a new learner creates a lightweight profile: display name, grade (6, 7, or 8), and a friendly avatar selected from a curated set of animal, fruit, and flower emoji. Existing learners return directly to their profile.
3. The verified browser receives a secure, persistent session so a child does not need to request a code on each visit. The initial target is 180 days, with server-side revocation and renewal. A visible “Log out” action ends the session.
4. The app greets the learner by their profile name and uses their grade as the default across daily work and Genius Corner. Grade remains editable in profile settings.

The email is the account recovery and family contact address; the learner profile is separate from it. Do not ask children for a birth date, school, address, phone number, or other unnecessary personal information in v1. A deployment that onboards children publicly must review applicable child privacy and parental-consent requirements before opening registration broadly. An email OTP verifies mailbox access; it does not by itself prove that the mailbox holder is a parent or establish legal consent.

## Account and session rules

- Normalize email with trim + lowercase and enforce uniqueness.
- Send a cryptographically random six-digit code with a 10-minute expiry. Store only a keyed hash, allow at most five verification attempts, rate-limit code requests and verification attempts, and invalidate prior outstanding codes when issuing a new one.
- Use the existing SMTP sender. Fail closed with a friendly retry message if mail delivery is unavailable; never log codes, full email addresses, or session tokens.
- Store a random opaque session token in an `HttpOnly`, `Secure` (on HTTPS), `SameSite=Lax`, path-wide cookie. Store only its SHA-256 hash in the database. Use a 180-day expiry and allow explicit revocation on logout. Refresh near expiry.
- Require authentication and ownership checks on every private page API and mutation. Return 401 for unauthenticated API requests. The login and code-verification endpoints are the only public data APIs.
- Rate-limit authentication by email and source address. Avoid account enumeration by returning the same code-request response for new and existing addresses.

## Profile-owned learning data

Every learner owns their daily plans, sessions, phase ratings, reminder preferences, Genius Corner explorations/saved snapshots, and Genius lesson feedback. Every read, update, delete, and mutation must include the authenticated learner’s ID or prove ownership through a parent relation. Cross-profile IDs must not expose data, even if guessed.

Daily plan dates are unique per learner, not globally. Calendar, history, streaks, dashboards, and absence handling all query only the active learner. Reminder configuration (days, time, enabled state, destination, and last-sent marker) is per learner. The scheduled reminder worker iterates enabled profiles, sends only to that profile’s verified email, and uses each profile’s timezone. A single learner’s completion or reminder setting must never affect another learner.

Genius Corner content and saved explorations are learner-owned. The expensive reusable curriculum lesson cache and deep-dive semantic cache remain global and contain no learner identity. Deep-dive reuse continues to require strong semantic similarity and matching subject, canonical topic, study level, and cache version. Feedback is stored per learner and lesson node; it must not alter shared cached lesson content.

## Content feedback

Each generated lesson node offers a simple, child-friendly 1–5 star helpfulness rating and optional short feedback. A learner can revise their rating. Feedback is associated with learner, exploration, and node, and is private to the service operators; it is not shown to other learners. Existing daily-task ratings remain part of that learner’s session record.

## Data model direction

- `KidProfile`: normalized unique login email (nullable only for the migration seed), display name, grade, avatar emoji, timezone, consent/guardian attestation metadata, creation/update timestamps.
- `LoginCode`: email, keyed code hash, expiry, attempts, consumed timestamp, request-rate metadata.
- `AuthSession`: learner ID, unique token hash, expiry, created/last-used/revoked timestamps.
- Add learner ID to daily plans, board settings, and Genius explorations; sessions inherit ownership from their daily plan and phase ratings inherit it through their session.
- `GeniusRating`: learner ID, exploration ID, node ID, rating, optional bounded feedback, timestamps; unique per learner/exploration/node.
- Keep global lesson/deep-dive caches separate from user-owned tables.

## Aashvath migration

Create one legacy Aashvath profile and attach all existing daily plans, sessions (through their plans), phase ratings (through sessions), board settings, and 57 Genius explorations to it. Preserve content, timestamps, IDs, completion history, settings, and saved snapshots. Bind the profile to the existing verified reminder email during the one-time server migration; do not print the address in deployment logs. The existing installation currently has 189 daily plans, 45 sessions, and 57 Genius explorations, and all must remain available after migration. Leave global lesson caches unchanged.

The first successful sign-in to the existing reminder email claims the migrated profile. Other email addresses create independent profiles and cannot claim or read Aashvath’s rows. If the configured reminder email cannot be matched to the authenticated email, stop the claim and resolve the account mapping explicitly rather than matching only on the display name.

## Rollout and acceptance

1. Apply additive schema changes and backfill the legacy profile in a transaction-safe migration; make learner ownership required after the backfill.
2. Deploy code that supports OTP onboarding, long-lived sessions, profile ownership, scoped reminders, profile-aware navigation, and Genius ratings.
3. Sign in as Aashvath using the already configured reminder email and confirm the legacy counts/content/settings are intact. Create a second test profile and verify it sees no Aashvath data.
4. Verify unauthenticated page/API access is redirected or rejected, wrong/expired/reused codes fail, rate limits work, logout revokes the session, and a valid long-lived session survives a browser restart.
5. Verify daily plan generation, editing, completion, history, streaks, missed-day processing, reminders, Genius save/open/delete/expand, and ratings work independently for two profiles. Shared lesson/deep-dive cache hits must not share explorations or feedback.

## Privacy and operational requirements

Use minimal profile data, secure cookies, hashed credentials, non-enumerating responses, bounded retention for login challenges, and private server logs. Provide an understandable privacy notice and a way for the family to request profile/data deletion before broad public onboarding. Review age-appropriate parental-consent, data access/deletion, retention, and email practices for intended jurisdictions before marketing or opening the service to the public. See the [FTC COPPA guidance](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions) and [GDPR Article 8](https://eur-lex.europa.eu/eli/reg/2016/679/2016-05-04/eng) as starting points; this specification is not a compliance determination.

## Out of scope for v1

Parent dashboards, multiple children under one parent account, school/class administration, public profiles, social sharing, child-to-child messaging, custom passwords, and third-party identity providers.
