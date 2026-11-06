# Scientec QA Harness — End-to-End Tutorial

*(Vietnamese version: [TUTORIAL.md](TUTORIAL.md))*

This guide is for **someone new to the harness** — a QA engineer, or a dev doing QA, who
has never run a `/qa-*` command. It walks one feature through its whole life: from a
Markdown spec file to a written bug report and a verified production deploy.

Read alongside when needed: [README.md](../README.md) (overview + token budget, in
Vietnamese) · [TESTING.md](TESTING.md) (testing the harness itself + diagnosis table) ·
[DEAD-ENDS.md](DEAD-ENDS.md) (dead ends already explored — don't retry).

> The harness itself talks to you in Vietnamese and writes checklists in Vietnamese.
> Bug reports (`bugs_<ID>.md`) and the `Test Cases` sheet are in English.

---

## 0. What this harness does for you

A chain of slash commands running in **Claude Code** that turns one Markdown spec file
into a complete QA package:

```
specs/INV-001.md
   │  /qa-analyze          → analysis checklist (.md)
   │  ▸ YOU REVIEW                                          (stop 1)
   │  /qa-apply-feedback   → revised checklist
   │  ▸ YOU REVIEW AGAIN                                    (stop 2)
   │  /qa-write-cases      → 8-sheet Excel test case file
   │  ▸ YOU REVIEW                                          (stop 3)
   │  /qa-run              → Pass/Fail results + Defects sheet
   │  ▸ YOU REVIEW                                          (stop 4)
   │  /qa-export-bugs      → bugs_INV-001.md + Bug IDs in Excel
   │  ▸ YOU APPROVE THE BATCH (before anything is written)  (stop 5)
   ▼
 production deploy
   │  /qa-verify-prod      → post-deploy verification report
```

**The spec is the only source.** The harness does not read code, does not read git, and
does not connect to any bug tracker. If the spec is too thin it stops and lists the
gaps — it never guesses.

Three kinds of components:

| Kind | What it is | Example |
|---|---|---|
| **Command** (`.claude/commands/`) | entry point, runs in the main session — **can ask you** | `/qa-run` |
| **Agent** (`.claude/agents/`) | subagent that does one stage then ends — **never waits for you** | `test-runner` |
| **Skill** (`.claude/skills/`) | static knowledge, loaded on demand | `common-validate` |

Every question is asked by a **command**, batched into **one round** before the agent
runs. Three levels: **Block** (must answer) · **Confirm** (has a default, waits for your
nod) · **Decide** (agent does it, but lists it in the summary).

---

## 1. Install (once per repo)

You need: Claude Code, Python 3, Node 20+, LibreOffice (optional — without it the Summary
cells stay empty until you open the file in Excel once). The Figma connector is
**optional**, only used when a spec links to Figma.

```bash
git clone https://github.com/dungvv-hblab-hbg/scientect-qa-skill.git
cd scientect-qa-skill
./install.sh /path/to/your-repo --dry-run   # preview
./install.sh /path/to/your-repo             # for real (--with-e2e: also copy scientec-e2e/)
```

In the target repo, open Claude Code:

```
/qa-setup
```

It checks Python + openpyxl, chromium, Playwright MCP, LibreOffice, builds an e2e project
that fits the repo, **asks for one approval** and only then installs. Then:

```bash
cp <e2e project>/.env.example <e2e project>/.env
# BASE_URL, SCIENTEC_USER, SCIENTEC_PASS
# (prod verify) PROD_BASE_URL, SCIENTEC_PROD_USER, SCIENTEC_PROD_PASS
bash .claude/scripts/smoke-scripts.sh            # ~30 s, must be green
```

> **URLs are placeholders for now:** `https://scientec-staging.example.com` (staging) and
> `https://scientec.example.com` (production). Replace them with the real URLs in `.env`
> and in the `project` section of `.claude/qa-config.md` before running `/qa-run`.

> **Passwords live only in `.env`.** The harness never asks for a password in chat and
> never fills the login form through MCP — login always goes through a separate Node script.

Three install traps (details in [README.md](../README.md)): after editing `.mcp.json`
**quit Claude Code and reopen it** · keep **one** Playwright MCP, at project scope ·
don't run a bare `pip install openpyxl`, use the `.claude/.venv` venv.

---

## 2. Prepare the spec file

Running example: **`specs/INV-001.md`** — a "create invoice" feature.

```markdown
# INV-001 — Create invoice

## Description
An accountant creates a new invoice for a customer from the Invoices screen.

## Roles
- Accountant: create and edit draft invoices
- Viewer: read only

## Acceptance criteria
1. The "New invoice" button is visible to Accountant only.
2. Customer and Issue date are required; if missing, show "This field is required."
3. Invoice number is at most 20 characters.
4. On successful save the invoice is in Draft status and appears in the list.

## Design
https://www.figma.com/file/... (optional)
```

The clearer the ACs, verbatim messages and field constraints, the fewer questions the
checklist will carry. If a constraint (e.g. maxlength) is missing, the harness **asks** —
it never assumes 255.

---

## 3. Running one feature — step by step

General tip: open a **second terminal** to follow progress:

```bash
tail -f .qa/INV-001/progress.log
```

### Step 0 — `/qa-login` (when needed)

Logs in once and saves the session to `.playwright-mcp-profile/` for later `/qa-run`s.
Run it the first time, or when `/qa-run` reports a login page. `/qa-login prod` for
production.

The script reads `.env` in its own process; the password never passes through chat. On
`2FA_REQUIRED`, type the code in the browser window yourself and reply **`ok`**. **Seed
BEFORE calling any MCP tool** — once MCP opens the browser it holds the profile lock; if
that already happened, quit Claude Code and reopen.

### Step 1 — `/qa-analyze specs/INV-001.md`

| | |
|---|---|
| **Input** | path to the `.md` spec · (optional) ID as the second argument |
| **Output** | `.qa/INV-001/spec.md` (spec snapshot) · `.qa/INV-001/checklist_INV-001.md` |

It asks (one round): confirm the **feature ID** (default `INV-001`, from the file name)
and — if a checklist already exists — overwrite or stop.

- File missing / not `.md` → stops. Spec in Word/PDF? Convert it to `.md` yourself.
- **Spec pasted into chat instead of a file** → it offers to save it as `specs/<ID>.md`,
  shows you the exact content, **waits for OK**, then writes it and continues. It never
  analyzes raw chat text.
- Spec too thin → `SPEC_INSUFFICIENT`: no checklist, only a list of gaps phrased as
  questions for the BA/customer. Complete the spec and run again.

The `test-analyst` agent reads the spec (and Figma if present) and builds sections A → G:

| Section | Content |
|---|---|
| A | Sources read (spec file, Figma) |
| B | Feature overview |
| C | Detail per part, split by screen |
| D | Summary tables — D1 field constraints, D2 messages, D5 contradictions in the spec… |
| E / E2 | Conditional tables (e.g. role × permission) · **AC table** (feeds the Traceability sheet) |
| F | Assumptions & questions for the BA, with **confidence** High/Medium/Low |
| G | Test plan *(only when more than 15 cases are expected)* |

**What you do:** read the file. Something to fix → write it in the **"Phản hồi review"**
(review feedback) section at the end, referring **by number**: `#4 wrong — real maxlength
is 20`, then go to step 2. All good → skip to step 3.

### Step 2 — `/qa-apply-feedback INV-001` *(only if you wrote feedback)*

Applies feedback in the main session (no subagent — vague feedback needs a follow-up
question). **Existing numbers never change**; new items get the next number at the end;
dropped items are struck through, numbers are never reused. Handled feedback moves to a
`## Đã xử lý (date)` (handled) section, it is not deleted.

**What you do:** review again. While section F still has **Low**-confidence questions,
don't write test cases yet.

### Step 3 — `/qa-write-cases INV-001`

| | |
|---|---|
| **Input** | the reviewed checklist |
| **Output** | `.qa/INV-001/TCs_<Module>_v<ver>.xlsx` — 8 sheets |

It **blocks** while the checklist has unhandled feedback, open Low-confidence questions,
or lacks real constraints/messages a test needs. It **confirms** module, version and file
name.

8 sheets: `Cover · Summary · Test Cases · Test Cases_VN · Common Validate · Defects &
Follow-ups · Traceability · Assumptions & Questions`. The `Test Cases` (EN) sheet is the
source of truth. IDs reset per section (`TC-A-001`, `TC-B-001`). Note-column tags:
`[MANUAL] <reason>` and `[DATA-REQ] <condition>`. Any `MISSING` row in **Traceability**
means an AC is not covered — a real gap.

**What you do:** open the file, edit/add/remove cases.

### Step 4 — `/qa-run INV-001`

| | |
|---|---|
| **Input** | reviewed `.xlsx` · login session · Playwright MCP |
| **Output** | Results in Excel · Defects sheet · `scientec-e2e/tests/INV-001.spec.ts` · screenshots in `.qa/INV-001/phase1/` |

It asks (one round): **is the feature deployed to staging** (the harness can't check —
if not, it stops), which `.xlsx`, Round 1 or Round 2, special test data; then it checks
MCP, session, `.env`, Postman. If the last run broke midway it proposes to **resume**.

Cases go three ways: **UI** (Playwright), **API** (newman — skipped cleanly while no
collection exists), **Manual** (`Blocked` + `[MANUAL]`). UI cases without a `.ts` spec go
through **Phase 1** — the agent explores with MCP (a window appears; don't click in it),
then exports to `tests/INV-001.spec.ts` so later runs use code.

**What you do:** open the file, go to **Defects & Follow-ups**: fix Actual if needed; for
a case you don't want a bug for → **Fix Status = `Won't fix`**. **DON'T DELETE ROWS.**
Save the file.

### Step 5 — `/qa-export-bugs INV-001`

| | |
|---|---|
| **Input** | the reviewed and saved `.xlsx` |
| **Output** | `.qa/INV-001/bugs_INV-001.md` · Bug IDs `BUG-INV-001-NNN` in Excel |

Two halves with an approval stop in between:

```
bug-writer                    ->  YOU APPROVE THE BATCH  ->  command writes files
(reads Defects, drafts,                                      (bugs_INV-001.md + Bug ID
 dedupes, writes bugs-draft_INV-001.md)                       writeback to Excel + recalc)
```

It asks: which file, have you reviewed and saved the Defects sheet, staging URL for the
Environment field. Then it shows a `Draft ID · TC ID · Title · Priority · Duplicate?`
table, plus excluded rows and why.

**What you do:** approve **once for the whole batch** — drop items, edit
title/priority in the same reply, or edit the draft file directly and reply `ok`. Bug
reports are in English, have no assignee, and are not sent anywhere: handing
`bugs_INV-001.md` to the devs is up to you.

### Step 6 — `/qa-verify-prod INV-001` *(after the fix is deployed)*

| | |
|---|---|
| **Input** | `scientec-e2e/tests/INV-001.spec.ts` · `.env` with `PROD_BASE_URL` + prod account |
| **Output** | `.qa/INV-001/prod-verify-<date>.md` |

It asks first: **is it deployed to production**. It runs **reviewed code, NO MCP**, and
**only cases tagged `@prod-safe`** (read-only, no data writes). No tagged case → it
stops instead of reporting a hollow green. It tells you upfront how many of how many cases
will run. Regressions (staging Pass, prod Fail) are called out; it only proposes bugs,
never writes them on its own.

---

## 4. Support commands

```
/qa-status              # all features, newest first
/qa-status INV-001      # each stage of one feature + what to run next
/qa-doctor              # read-only: MCP scope clash, .mcp.json drift, stuck on /login
/qa-retro INV-001       # optional: review the harness itself after a run
```

`state.json` is **a journal, not the source of truth** — `/qa-status` cross-checks it
against the real files on disk and reports any mismatch.

---

## 5. Where artifacts land

```
specs/INV-001.md                       original spec (yours, may still change)
.qa/INV-001/
├─ spec.md                             snapshot of the exact spec version analyzed
├─ checklist_INV-001.md                ★ stops 1 and 2
├─ TCs_<Module>_v1.0.xlsx              ★ stops 3 and 4
├─ bugs-draft_INV-001.md               draft bug batch awaiting approval (removed after writing)
├─ bugs_INV-001.md                     ★ official bug report (stop 5)
├─ prod-verify-<date>.md               production verification report
├─ result.json                         newman report (API branch)
├─ phase1/                             evidence screenshots from MCP exploration
├─ progress.log                        per-case progress
└─ state.json                          stage journal, for /qa-status and resume

scientec-e2e/tests/INV-001.spec.ts     .ts spec exported from Phase 1, one file per feature
.playwright-mcp-profile/               MCP session (Phase 1)
scientec-e2e/playwright/.auth/         code session (running specs) — SEPARATE
```

**Two sessions are by design, not a bug** — the record is in [DEAD-ENDS.md](DEAD-ENDS.md) §1.

---

## 6. Three traps already paid for — don't remove the guardrails

**Append, don't fill gaps.** New Defects rows go after the *last* row with a TC ID.

**Key by TC ID, not by row number.** Inserting/deleting a row between `read` and
`writeback` shifts row numbers; TC IDs don't move.

**Don't use "delete the row" as a rejection signal.** Use Fix Status = `Won't fix`.

---

## 7. Common problems

| Symptom | Cause | Fix |
|---|---|---|
| `/qa-analyze` won't analyze the spec you pasted | by design | agree to save it as `specs/<ID>.md` |
| `/qa-analyze` reports `SPEC_INSUFFICIENT` | spec lacks ACs / description | complete the spec file and rerun |
| `/qa-run` stops at the deploy question | you haven't confirmed the feature is on staging | deploy, then answer "deployed" |
| `browser_wait_for` timeout 5000ms | `.mcp.json` missing timeouts, or another-scope MCP wins | `/qa-doctor`, fix, then **reopen Claude Code** |
| Still on `/login` after seeding | profile not loaded (MCP scope clash) | `/qa-doctor`, don't keep logging in |
| Seed script says profile is locked | the session already called an MCP tool | quit Claude Code, run `/qa-login` **first thing** |
| Summary cells empty | not recalculated (no LibreOffice) | open in Excel once, or install LibreOffice |
| API branch skipped | `postman` section is `CHƯA CÓ` (not yet) | by design |
| Traceability has `MISSING` | an AC is not covered | add cases |

Full diagnosis table: [TESTING.md](TESTING.md).

---

## 8. One-page summary

```
/qa-login                              # when a session is needed
/qa-analyze specs/INV-001.md           ▸ review checklist
/qa-apply-feedback INV-001             ▸ review again (skip if nothing to fix)
/qa-write-cases INV-001                ▸ review Excel file
/qa-run INV-001                        ▸ review Defects sheet (Won't fix, don't delete rows, save)
/qa-export-bugs INV-001                ▸ approve the bug batch → bugs_INV-001.md
# --- after the production deploy ---
/qa-verify-prod INV-001

/qa-status [INV-001]  ·  /qa-doctor  ·  tail -f .qa/INV-001/progress.log
```
