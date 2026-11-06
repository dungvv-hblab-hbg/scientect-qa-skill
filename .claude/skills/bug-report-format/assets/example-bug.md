# Ví dụ bug report hoàn chỉnh

Dựng từ hai dòng Defects đã review của tính năng `INV-001`. Dùng làm mẫu về mức độ
cụ thể cần đạt, không phải để chép nguyên văn. URL là placeholder.

---

# Bug report — INV-001

Spec: .qa/INV-001/spec.md · Test case file: .qa/INV-001/TCs_Invoice-Detail_v1.0.xlsx · Environment: https://scientec-staging.example.com

| Bug ID | TC ID | Title | Severity | Priority |
|---|---|---|---|---|
| BUG-INV-001-001 | TC-B-004 | [Invoice Detail] Missing error message when due date is left empty | Major | High |
| BUG-INV-001-002 | TC-API-007 | [PUT /invoices/{id}] Returns 500 with stack trace on malformed JSON body | Major | High |

---

## BUG-INV-001-001 — [Invoice Detail] Missing error message when due date is left empty

- **TC ID:** TC-B-004
- **Severity:** Major
- **Priority:** High (test case Priority = High)
- **Environment:** https://scientec-staging.example.com · Round 1 · Chromium
- **Spec reference:** AC-03 (spec.md §Validation)

**Description**
Saving the invoice detail form with an empty Due Date silently closes the dialog
instead of blocking the save. The invoice is stored without a due date and is then
excluded from the overdue report.

**Preconditions**
Logged in as a Finance user; invoice `INV-1001` exists in Draft status.

**Steps to reproduce**
1. Open Invoices → click invoice `INV-1001`
2. Clear the Due Date field
3. Click Save

**Expected result**
Save is blocked and the message "Due date is required." is displayed under the
field. No request is sent.

**Actual result**
Dialog closes, no validation message shown. `PUT /invoices/INV-1001` returns 200 and
the Due Date column for `INV-1001` is blank in the list.

**Evidence**
- .qa/INV-001/phase1/TC-B-004-FAIL.png

---

## BUG-INV-001-002 — [PUT /invoices/{id}] Returns 500 with stack trace on malformed JSON body

- **TC ID:** TC-API-007
- **Severity:** Major
- **Priority:** High (test case Priority = High)
- **Environment:** https://scientec-staging.example.com · Round 1 · newman
- **Spec reference:** AC-07 (spec.md §API errors)

**Description**
A malformed JSON payload causes an unhandled exception instead of a 400 response.
The error body leaks the internal exception type and a server file path.

**Preconditions**
Valid API token for a Finance user.

**Steps to reproduce**
1. Authenticate against staging and obtain a valid token
2. Send `PUT /invoices/INV-1001` with body `{"dueDate": ` (truncated JSON)

**Expected result**
`400 Bad Request` with the standard error envelope. No internal type name or file
path in the response body.

**Actual result**
`500 Internal Server Error`. Body contains `JsonReaderException` and a server path
under `/app/src/...`.

**Evidence**
- .qa/INV-001/newman/result.json (request `PUT invoice — malformed body`)
