---
name: ai-recruitment-platform
description: Use this whenever working on the AI Recruitment Platform — any task involving job postings, the eligibility checklist, candidate intake (Excel/ZIP/PDF), structured form parsing, the rule-checking and citation-verification pipeline, the deterministic verdict engine, the recruiter dashboard, the document viewer, or manual overrides. Consult this before writing code, suggesting a library, or proposing a schema change in this project. Supersedes any earlier version of this file that describes weighted scoring or generic multi-candidate ZIP uploads — that architecture was replaced.
---

# AI Recruitment Platform — Project Skill (v3)

This is the company's internal recruitment automation system, built on top of the existing IHMCL-style applicant portal (ihmcl.co.in/careers). It replaces HR's manual process of downloading each candidate's ZIP and eyeballing it against a job requirement.

**Read this file fully before making changes.** This version reflects the PRD v3 architecture — a binary, citation-verified eligibility model. If you are working from an older mental model of this project (weighted scoring, generic bulk ZIP upload), that architecture has been explicitly abandoned. Do not reintroduce it.

---

## 1. Project Context (Read First)

- This is an **internal tool**, not a public SaaS product. One company, one deployment, no multi-tenancy.
- It plugs into an **existing applicant portal** that already collects structured applications. Do not rebuild the application form, candidate-facing UI, or auth — check `references/existing-portal-integration.md` before assuming something needs to be built from scratch.
- The core value being added: **AI-assisted eligibility checking, with every AI claim independently verified against source documents before a recruiter ever sees it as trustworthy.**
- Target users: internal recruiters and hiring managers only.
- Scale: hundreds of applicants per job posting, not millions. Do not over-engineer — no Kafka, no Kubernetes, no microservices beyond the existing `backend` / `ai-service` split.

---

## 2. The Core Architectural Decision — Read Before Touching Anything Scoring-Related

**There is no weighted score. There is no candidate ranking.** Every candidate resolves to exactly one of three verdicts:

- `eligible` — every hard rule passed, every citation verified
- `semi_eligible` — every hard rule passed, but at least one citation is unverified and needs human review
- `not_eligible` — at least one hard rule failed

This decision is final for this project. If a task seems to call for "a score," "a ranking," "a percentage match," or "weighted criteria," **stop and flag it to the user** rather than implementing it — this is very likely either a misunderstanding of the current architecture or a genuinely new feature request that needs explicit confirmation, not an assumption.

**The verdict computation itself must never be an LLM call.** It is a pure, deterministic function over rule pass/fail and citation-verified statuses. The LLM's role is limited to: (a) extracting the eligibility checklist from a job notice, and (b) finding and citing evidence for rules that require documentary proof. Nothing else in this pipeline should call an LLM.

---

## 3. Tech Stack (Do Not Deviate Without Asking)

| Layer | Technology | Notes |
|---|---|---|
| Frontend | Next.js (React), Tailwind CSS, shadcn/ui | Reuse shadcn components before building custom ones |
| Backend | Node.js + Express | REST API, not GraphQL |
| AI / parsing service | Python + FastAPI | Separate service — backend calls it over HTTP, never imports Python directly |
| Database | PostgreSQL + Prisma | JSONB for flexible/evolving fields (see Section 6) |
| File storage | AWS S3 | Never store files in the DB or local disk in production |
| PDF rendering | react-pdf (frontend) | Must support jump-to-page + highlight for citation links |
| DOCX → PDF | LibreOffice headless (backend) | Convert before serving in viewer; cache the converted file |
| LLM | Configurable provider (OpenAI / Anthropic / Gemini) | Always behind `ai-service/llm.py` — never call a provider SDK directly from business logic |
| Excel parsing | A Node Excel library (confirm choice, don't assume one is already installed) | Used only for the portal's Excel export import, not for output |
| Email | Nodemailer / SendGrid | Candidate/recruiter notifications |
| Auth | JWT (existing system if present — check first) | Do not introduce a second auth system |

If a task seems to need a new library or service not listed here, **stop and ask the user** rather than silently adding a dependency.

---

## 4. Repository Structure

```
recruitment-platform/
├── frontend/
│   ├── app/
│   │   ├── (candidate)/         candidate-facing pages (only touch if explicitly asked)
│   │   ├── (recruiter)/         checklist review, Excel import, three-bucket dashboard,
│   │   │                        candidate profile + document viewer, override UI
│   │   └── (auth)/
│   └── components/
│
├── backend/
│   ├── routes/                  jobs.js, candidates.js, applications.js, documents.js...
│   ├── controllers/             business logic — keep route handlers thin
│   ├── middleware/               auth.js, validation.js, rbac.js
│   ├── services/                 email.js, s3.js, llmClient.js, referenceNumber.js
│   └── prisma/                   schema.prisma + migrations
│
├── ai-service/
│   ├── main.py
│   ├── checklist.py              job notice → eligibility checklist (LLM call)
│   ├── form_parser.py            structured form PDF → declared values (deterministic, no LLM)
│   ├── rule_checker.py           declared values + checklist → rule pass/fail (+ evidence citations where needed)
│   ├── citation_verifier.py      file/page/text-match verification (deterministic, no LLM)
│   ├── verdict.py                pure function: rule results → eligible/semi_eligible/not_eligible
│   └── requirements.txt
│
└── docker-compose.yml
```

New files go in the matching folder above. Don't invent new top-level folders without asking. Don't put business logic in route files — controllers only.

---

## 5. Candidate Identity — the Reference Number

Every candidate is identified by a structured reference number, e.g. `IHM/JA/1900/10001`:

- `IHM` — company prefix
- `JA` — job application marker
- `1900` — job posting code (used to auto-group candidates to the correct job and checklist)
- `10001` — sequential candidate number within that posting

This number appears independently in three places: the ZIP/PDF filenames, the Excel row, and printed inside the PDF form itself. **Before any candidate record is created or any AI resource is spent, validate that all three match.** This is a cheap, deterministic gate — never skip it, and never proceed with a candidate whose reference number failed validation without an explicit manual-review flag.

Write the validator to be posting-series-aware (parameterized on the prefix pattern), not hardcoded to `IHM/JA/`, in case other reference series are introduced later.

---

## 6. Database Conventions

- Primary keys are UUIDs, not auto-increment integers.
- `applications.reference_number` — TEXT, unique, indexed. `jobs.posting_code` — TEXT, indexed.
- `applications.parsed_form_data` — JSONB. Declared values extracted directly from the structured form PDF (age, education, experience, etc.) — this is deterministic table parsing, not an LLM extraction.
- `applications.attachment_manifest` — JSONB. The file-type-to-filename map taken from the form's own "List of attached documents" table. This is what targets citation verification to the correct file instead of searching blindly.
- `ai_match_results.rule_results` — JSONB array: `{ rule, value_found, status, document_id, page, quoted_text, citation_verified }`. There is no `criterion_scores` or weighted field — do not add one.
- `ai_match_results.verdict` — ENUM: `eligible / semi_eligible / not_eligible`.
- `ai_match_results.checklist_version` — which locked checklist version this candidate was evaluated against. Checklists are versioned, not mutated in place after lock — a post-lock edit creates a new version.
- `ai_match_results.override_by / override_reason / override_at` — set only via the manual override flow on `semi_eligible` candidates.
- Audit-relevant tables (`document_view_logs`, override history) are **append-only**. Never UPDATE or DELETE rows in these tables.
- Use a real table (not a JSONB blob) only when there can be multiple independently-owned rows per parent (e.g. `document_notes`, one row per recruiter's note).
- All migrations go through Prisma. Never hand-edit the schema directly.

---

## 7. Intake Pipeline Conventions

The real intake shape is: **Excel export → one ZIP + one form PDF per candidate row**, not a single manually-uploaded multi-candidate archive. Don't build or assume a generic "upload a big ZIP of candidates" flow.

- Excel import happens per job posting. Each row yields a reference number, a ZIP link, and a PDF link.
- Downloads are per-row and failure-isolated — one broken link must not block the rest of the batch. Failed rows get flagged for manual review, never silently dropped.
- Reference number validation (Section 5) runs immediately on download, before a candidate record is fully created.
- Structured form parsing (`ai-service/form_parser.py`) is a deterministic extraction against a known template, not an open-ended LLM read. If a field can't be confidently parsed, flag it — never guess or null it out silently.
- The form's own "List of attached documents" table is the source of truth for which file backs which claim — use it to target evidence lookup, don't search the full document set for every rule.

---

## 8. Rule-Checking & Citation Verification Conventions

- Resolve a rule from `parsed_form_data` first, using pure logic, whenever the rule doesn't require documentary proof (e.g. an age range check against a declared date of birth). No LLM call needed for these.
- Only call the LLM for rules that genuinely require reading a specific evidence document, and pass it the *specific* file named in `attachment_manifest` for that claim — not the candidate's entire document set.
- Every citation the LLM returns must pass three independent, deterministic checks before being trusted:
  1. The referenced document exists in this candidate's upload.
  2. The referenced page exists in that document.
  3. A fuzzy text match confirms the quoted text is actually on that page.
- A failed check marks the citation `citation_verified: false` — it is kept and shown to the recruiter, never silently discarded. This is what produces the `semi_eligible` state.
- The fuzzy-match similarity threshold is a named, documented constant — not a magic number buried inline. Flag it as a tuning decision if you're touching it.
- Missing required documents are a distinct state from "checked and failed" — cross-reference `attachment_manifest` (what the candidate claims to have attached) against the actual files present in the ZIP to detect this.

---

## 9. Recruiter-Facing Conventions

- The dashboard shows three buckets (Eligible / Semi-Eligible / Not Eligible), grouped by `posting_code`. **No score, percentage, or ranking is ever rendered.**
- Every rule in a candidate's profile is clickable and must jump the document viewer to the exact cited page, highlighting the cited text. This is the core trust mechanism of the whole product — don't treat it as optional polish.
- The manual override action exists only for `semi_eligible` candidates, requires a reason, and is logged (recruiter, reason, timestamp). Without this, Semi-Eligible candidates have no resolution path — never ship this feature without the override flow attached.
- Document access always goes through a signed backend streaming endpoint — never expose a direct S3 or portal URL to the frontend, at any point in the pipeline including the new Excel-import and form-parsing steps.
- Every document view is logged to `document_view_logs`, no exceptions — this is a compliance requirement, not optional telemetry.

---

## 10. Security Rules (Non-Negotiable)

- Never log or print full candidate PII (name, email, phone, Aadhaar number) in plain console logs — use structured logging with PII redaction.
- Never commit `.env` files, API keys, or AWS credentials.
- All file uploads/downloads (including from the Excel-linked ZIP/PDF) must be validated for type and size before processing.
- All API endpoints touching candidate or application data must check the requesting user's role and access scope server-side — never assume the frontend already filtered correctly.
- SQL always goes through Prisma's query builder. No raw string-concatenated SQL.

---

## 11. Coding Conventions

- **Backend (Node.js):** thin route handlers — validate input (Zod), call a controller, return a response. Logic lives in `controllers/` or `services/`.
- **AI service (Python):** FastAPI endpoints mirror the same thin-handler pattern — Pydantic validation, logic in separate functions.
- **Frontend (Next.js):** server components for data fetching where possible; client components only for interactive pieces (checklist editor, document viewer, override dialogs).
- **Naming:** snake_case for DB columns, camelCase for JS/TS, PascalCase for React components.
- **Comments:** explain *why*, especially around the fuzzy-match threshold, hard/soft rule classification logic, and any deviation from the PRD.
- Don't introduce a new state management library, a different API style, or a parallel scoring mechanism without flagging it to the user first.

---

## 12. When Requirements Are Unclear

Treat **PRD v3.0** as the source of truth for product behavior and **the implementation plan** as the source of truth for build sequencing. If a task conflicts with either, or isn't covered by them, **flag it explicitly rather than guessing** — this is a one-person build where assumptions need a human checkpoint, not silent inference. This is especially true for anything touching:

- The verdict logic (Section 2) — never let an LLM make this call
- The reference number validation gate (Section 5) — never skip it for convenience
- Whether something is a hard or soft requirement — this is a per-job recruiter decision, not something to infer from wording

---

## 13. Open Items Still Unresolved (Check Before Building These Areas)

- Excel import: manual per-batch upload, or automatic polling?
- How many historical form-template versions must `form_parser.py` support?
- Reference-number mismatch: auto-retry once, or always route to manual review?
- Missing-document rules: count toward `not_eligible`, or a separate `incomplete` state?
- Hiring manager override access: view-only, or can they also submit overrides?
- Fuzzy-match verification threshold: fixed platform-wide, or configurable per job?

If your task touches one of these and no decision has been made yet, stop and ask rather than picking a default silently.
