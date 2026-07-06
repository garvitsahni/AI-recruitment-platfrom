# AI Recruitment Platform — Implementation Plan

**Based on:** PRD v3.0 (Real-Portal Intake Correction)
**Backbone:** Automated Recruitment Validator — citation-verified, binary eligibility model
**Repo convention reference:** `ai-recruitment-platform` project skill (Next.js / Node+Express / Python+FastAPI / PostgreSQL+Prisma / S3)

This plan is organized into 9 phases with concrete milestones. Each phase ends in something demoable, not just "done thinking about it." Steps assume the existing repo structure (`frontend/`, `backend/`, `ai-service/`) and conventions already defined in the platform skill — nothing here introduces a new stack.

---

## Phase 0 — Setup & Decisions (Day 0–1)

Before writing code, lock the decisions that change the shape of later phases.

1. **Resolve open questions from PRD v3 Section 16** — at minimum: is Excel import a manual per-batch upload (Phase 1 default) or polled automatically; how many form-template versions must the parser support at launch. Get these answered or explicitly deferred with a documented default.
2. **Confirm reference number format is posting-series-aware**, not hardcoded to `IHM/JA/`. Even if only one series exists today, write the validator as a configurable pattern.
3. **Set up local dev fixtures** — use the sample ZIP + PDF pair already provided (`IHM_JA_1900_10001`) as the canonical test fixture for every phase below. Add 2–3 deliberately broken variants (mismatched reference number, missing attached file, malformed Excel row) for negative-path testing from day one.

**Risk to flag:** the whole pipeline's reliability depends on the form PDF template staying consistent. If HR or the portal team can change the form layout without notice, Phase 4 (structured parsing) needs a versioning strategy before it's trustworthy — don't defer this silently.

---

## Phase 1 — Reference Number Infrastructure (Day 2–3)

**Milestone:** any candidate identifier can be validated and parsed into its components before touching any other logic.

1. `backend/services/referenceNumber.js` — parser/validator: splits `IHM/JA/1900/10001` into `{company, series, postingCode, sequence}`, returns a structured result or a typed validation error.
2. Prisma migration: add `applications.reference_number` (unique, indexed), `applications.reference_validated` (boolean), `jobs.posting_code` (indexed).
3. Unit tests covering: well-formed reference numbers, malformed ones, and the three-source consistency check (filename vs. Excel row vs. PDF-declared value) using the fixture set from Phase 0.
4. **Do not proceed to Phase 3 until this is solid** — every later phase assumes a validated reference number is already available.

---

## Phase 2 — Job Checklist Pipeline (Day 4–7)

**Milestone:** a recruiter can upload a job notice PDF, review an AI-generated checklist, edit it, and lock it.

1. `ai-service/checklist.py` — LLM call (through `ai-service/llm.py`, never a direct provider SDK call) that extracts a structured rule list from the job notice PDF.
2. `backend/routes/jobs.js` — `POST /api/jobs/:jobId/checklist/generate` endpoint wrapping the above.
3. `frontend/app/(recruiter)/jobs/[jobId]/checklist/` — review screen: editable rule rows, hard/soft classification toggle, add/delete rule actions.
4. `PUT /api/jobs/:jobId/checklist` (save edits) and `POST /api/jobs/:jobId/checklist/confirm` (lock + version snapshot) — store the locked checklist as `jobs.requirements` JSONB, versioned per PRD v3 FR-03.
5. Migration: `checklist_versions` table or a version counter on `jobs.requirements` — confirm which approach before building Phase 9's stale-verdict handling.
6. Manual QA: generate a checklist from a real job notice PDF, deliberately introduce a bad extraction, confirm the recruiter can fix it before locking.

**Risky/uncertain step:** the checklist-generation prompt's reliability on notices with unusual formatting (tables, multi-column layouts, scanned images). Test against at least 3 differently-formatted real notices before considering this phase done.

---

## Phase 3 — Excel-Driven Candidate Intake (Day 8–10)

**Milestone:** uploading a portal Excel export queues every candidate's ZIP+PDF pair for processing, with bad rows isolated rather than blocking the batch.

1. `backend/routes/candidates.js` — `POST /api/jobs/:jobId/candidates/import-excel`: parse the Excel (a library like `xlsx` or `exceljs` on the Node side — confirm this doesn't conflict with anything already in the stack before adding it), extract reference number + ZIP link + PDF link per row.
2. Per-row download worker: fetches the linked ZIP and PDF, dual-writes to S3, per NFR-07's per-row failure isolation requirement — one broken link must not halt the batch.
3. Wire in Phase 1's reference number validator here: run the three-source consistency check immediately on download, before the candidate record is fully created.
4. `applications` table: candidate record created only after validation passes; failed rows land in a `failed_imports` table or a status flag for manual review — don't silently drop them.
5. Frontend: import screen showing per-row status (queued / downloaded / validated / failed) so a recruiter can see the batch's health at a glance, not just a spinner.

**Unglamorous but necessary:** test with a genuinely malformed Excel file (missing columns, extra rows, blank reference number cell) — this is the most likely real-world failure point given it's driven by a third-party export, not your own API.

---

## Phase 4 — Structured Form Parsing (Day 11–13)

**Milestone:** declared values (age, education, experience, marks) are extracted directly from the form PDF's tables — deterministically, not via open-ended LLM reading.

1. `ai-service/form_parser.py` — table/text extraction from the known form template (a PDF text/table extraction library, not an LLM call, per PRD v3 FR-06's framing of this as deterministic).
2. Map extracted fields into a fixed schema: `personal_info`, `education[]`, `work_experience[]`, `technical_skills[]`, `compensation` — matching the sections visible in the reference PDF.
3. Also parse the form's own **"List of attached documents"** table into `applications.attachment_manifest` JSONB — this becomes Phase 5's evidence-targeting map.
4. Store results in `applications.parsed_form_data` JSONB.
5. **Failure handling is not optional here:** if a field can't be confidently parsed, flag it — never guess or silently null it out (per NFR-04). Surface unparseable candidates to the recruiter explicitly.
6. Test against the template consistently, and pressure-test with a slightly-different-looking form (missing a section, extra row in a table) to see how gracefully the parser degrades.

**Risky/uncertain step:** how much the real-world form output varies in practice (font/whitespace inconsistencies, optional sections that are sometimes blank). This can't be fully known until more real samples are seen — plan to revisit the parser after the first real batch runs.

---

## Phase 5 — Declared-Value Checking & Evidence Citation Verification (Day 14–17)

**Milestone:** every checklist rule is either resolved by pure logic against declared values, or by a targeted, verified citation.

1. `ai-service/rule_checker.py` — for each checklist rule, first attempt resolution purely from `parsed_form_data` (e.g. age range, education level) — no LLM call needed for rules fully answerable from declared data.
2. For rules requiring document proof, use `attachment_manifest` from Phase 4 to identify the *specific* evidence file — pass only that file (and the relevant rule) to the LLM, not the full document set. This is the targeting improvement from PRD v3 FR-08.
3. `ai-service/citation_verifier.py` — three-stage check: file exists in the candidate's S3 upload, page exists in that file, quoted text fuzzy-matches the actual page content.
4. **Lock the fuzzy-match similarity threshold** as a named constant with a comment explaining the chosen value — this is a tuning decision (per PRD v3 open questions), so don't bury it as a magic number.
5. Store results in `ai_match_results.rule_results` JSONB: `{rule, value_found, status, document_id, page, quoted_text, citation_verified}`.
6. Run the full fixture set (good + deliberately broken candidates from Phase 0) through this phase and manually verify every citation's verified/unverified status is correct.

**Risky/uncertain step:** citation verification checks that a quote is accurate, not that it's *relevant* to the rule — an LLM could misjudge which rule a fact satisfies even while citing real text. Flag this as a known limitation; consider a periodic manual audit sample once live (ties to the "extra things to add" audit-export idea from earlier planning).

---

## Phase 6 — Deterministic Verdict Engine (Day 18)

**Milestone:** pure logic computes Eligible / Semi-Eligible / Not Eligible with zero AI involvement at this step.

1. `ai-service/verdict.py` — a small, isolated, heavily-tested pure function:
   - any failed hard rule → `not_eligible`
   - all hard rules passed, ≥1 unverified citation → `semi_eligible`
   - all hard rules passed, all citations verified → `eligible`
2. Missing-document rules (PRD v3 FR-13) get their own status distinct from failed — decide now whether they count toward `not_eligible` or a separate `incomplete` state (this was an open question; pick a default and document it).
3. Unit test this function exhaustively — every combination of pass/fail/unverified/missing across a small rule set. This function is small enough to have 100% branch coverage; there's no excuse not to.
4. Write `ai_match_results.verdict`, `checklist_version` (which version the candidate was evaluated against, per FR-03).

---

## Phase 7 — Recruiter Dashboard & Citation-Linked Viewer (Day 19–22)

**Milestone:** a recruiter can see candidates sorted by verdict, click into any rule, and land on the exact cited page.

1. `frontend/app/(recruiter)/jobs/[jobId]/candidates/` — three-bucket view (Eligible / Semi-Eligible / Not Eligible), grouped automatically by `posting_code`, no score or ranking anywhere in the UI.
2. Candidate profile page: left panel (rule-by-rule checklist with pass/fail + citation-verified icons), right panel (document viewer) — reuse the two-panel layout convention already established in the platform's Document Viewer feature.
3. `GET /api/documents/:documentId/view?page=&highlight=` — extend the existing document-streaming endpoint to accept a page/highlight target and scroll `react-pdf` there on load.
4. Status icon set: add the "unverified citation" state distinct from recruiter-flagged and expiry-warning, per the earlier UI plan.
5. Every document view still logs to `document_view_logs` (existing convention) — don't lose this when wiring in the new jump-to-page behavior.

---

## Phase 8 — Manual Override & Audit Trail (Day 23–24)

**Milestone:** Semi-Eligible candidates have a clear, logged resolution path — nothing sits in limbo indefinitely.

1. `POST /api/applications/:referenceNumber/override` — recruiter confirms or overrides a Semi-Eligible verdict; writes `override_by`, `override_reason`, `override_at` on `ai_match_results`.
2. Override action is append-only from an audit perspective — never edit or delete a prior override record; a second override is a new row referencing the same application, not a mutation.
3. Frontend: override action available only on Semi-Eligible candidates, with a required reason field (no silent one-click override).
4. Confirm access control: decide now whether hiring managers can submit overrides or are view-only (open question from PRD v3) — implement the RBAC check accordingly rather than leaving it open in code.

---

## Phase 9 — End-to-End Testing, Hardening, Rollout (Day 25–28)

**Milestone:** the full pipeline runs against a real batch of candidates for one job posting, with recruiter sign-off.

1. **Full pipeline dry run:** one real (or realistic) Excel export, a handful of real candidate ZIP+PDF pairs, run start to finish — Excel import → validation → form parsing → rule checking → verdict → dashboard → override → final action.
2. **Negative-path pass:** confirm every failure mode from earlier phases is handled gracefully in sequence, not just in isolation (a malformed Excel row, a mismatched reference number, an unparseable form, an unverifiable citation all in the same batch).
3. **Load check against NFR-01:** confirm 4-way parallel candidate processing actually holds up with a batch of 50+ candidates, not just the small fixture set.
4. **Security pass against NFR-05:** confirm no direct S3 or portal URL is ever exposed to the frontend at any point in the flow, including the new Excel-import and form-parsing steps.
5. **Recruiter walkthrough and feedback round** — this is a one-person internship project building for real HR users; get their eyes on the three-bucket dashboard and override flow before calling this done, per the platform skill's guidance to treat the PRD/Design Doc as source of truth but flag gaps to a human rather than guessing silently.
6. Fix findings, re-run the dry run once, then rollout.

---

## Dependency Summary

```
Phase 0 (decisions/fixtures)
   │
   ▼
Phase 1 (reference number infra) ──────────────┐
   │                                            │
   ▼                                            │
Phase 2 (checklist pipeline)                    │
   │                                            │
   ▼                                            │
Phase 3 (Excel intake) ◄────────────────────────┘   (needs Phase 1's validator)
   │
   ▼
Phase 4 (structured form parsing)
   │
   ▼
Phase 5 (rule checking + citation verification)  (needs Phase 2's locked checklist)
   │
   ▼
Phase 6 (deterministic verdict)
   │
   ▼
Phase 7 (dashboard + viewer)
   │
   ▼
Phase 8 (manual override)
   │
   ▼
Phase 9 (end-to-end testing + rollout)
```

Phases 1 and 2 can run in parallel if two people are available — Phase 3 depends on Phase 1 only, not Phase 2. Everything from Phase 4 onward is strictly sequential given this is a one-person build.

---

## Open Items to Resolve Before Phase 3

Carried over from PRD v3 Section 16 — resolve or explicitly defer before intake work starts, since they change Phase 3 and Phase 6's exact behavior:

- [ ] Excel import: manual per-batch upload, or automatic polling?
- [ ] How many form-template versions must Phase 4's parser support at launch?
- [ ] Reference-number mismatch: auto-retry once, or always to manual review?
- [ ] Missing-document rules: count toward Not Eligible, or a separate Incomplete state?
- [ ] Hiring manager override access: view-only, or can they also override?
- [ ] Fuzzy-match verification threshold: fixed platform-wide, or configurable per job?
