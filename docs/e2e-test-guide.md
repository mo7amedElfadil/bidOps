# End-to-End Test Guide

This guide walks through the full BidOps flow in a realistic order, from setup to approvals and exports. It is written so a non-technical tester can validate the product end-to-end.

## 1) Environment & services
1. Start services: `make up`
2. Confirm containers are running: `make ps`
3. Open web app: `http://localhost:8080`
4. Open API health (optional): `http://localhost:4000/health`
5. Open Mailhog (dev only): `http://localhost:8025` (if enabled)

## 2) Admin login + account setup
1. Login as the default admin.
2. If prompted, change the password.
3. Go to `Admin → Users`:
   - Create a few users with different access roles and business roles.
   - Confirm a new user appears in the table.
4. Go to `Admin → Business Roles`:
   - Add a new business role.
   - Edit and delete a role to confirm CRUD.

## 3) Notifications defaults
1. Go to `Notifications`.
2. Add or edit routing defaults for:
   - Opportunity created
   - Approval requested
3. Set user preferences (email/in-app) for yourself.

## 4) Tenders intake → Go/No-Go
1. Go to `Tenders → Available`.
2. Use date filters (from/to) and run collector.
3. Confirm tenders appear and include:
   - Title, tenderRef, dates, purchase link, source link.
4. Click **Request Approval** on a tender:
   - Provide optional notes.
   - Assign business role(s) if applicable.
5. Confirm Go/No-Go status appears on the tender row.

## 5) Approvals queue (Go/No-Go)
1. Go to `Approvals → Review`.
2. Set scope to “Mine” and ensure the request appears for the correct approver.
3. Approve or reject:
   - Add a comment.
   - Confirm status changes.

## 6) Opportunity creation + summary edits
1. From the tender, promote to opportunity.
2. Confirm the opportunity is visible in the main list.
3. Open the opportunity:
   - Edit client, stage, status, priority, submission method, source portal.
   - Assign business owner and bid owners.
4. Confirm summary fields save and render correctly.

## 7) Attachments + AI extraction
1. Go to `Attachments` tab.
2. Upload a PDF/DOCX and ensure it appears in the list.
3. Run AI extraction with a prompt.
4. Confirm extraction output populates:
   - Compliance clauses
   - Clarifications
   - Proposal sections

## 8) Compliance & clarifications
1. Go to `Compliance` tab:
   - Add clauses manually.
   - Import CSV using the example template.
   - Export CSV and verify rows/columns.
2. Go to `Clarifications` tab:
   - Add a clarification Q&A.
   - Export CSV and verify values.

## 9) Pricing workspace
1. Go to `Pricing` tab:
   - Add BoQ rows.
   - Apply formulas (e.g., `=C2*D2`) to multiple rows.
   - Verify currency conversion (base QAR).
2. Create a pricing template, then apply it to the opportunity.
3. Ensure unit cost and currency handling matches expected behavior.

## 10) Approvals (working → pricing → final)
1. From `Approvals` tab, request the next approval stage.
2. Use the review page to approve with comments.
3. Confirm each stage is sequential and blocked until prior stage is approved.
4. Verify bond reminder shows in the final week and hides after deadline.

## 11) Submission & outcomes
1. Go to `Submission` tab:
   - Mark checklist items (bond purchased, forms completed, final PDF).
2. Go to `Outcome` tab:
   - Mark Won/Lost/Withdrawn with a reason.
3. Confirm completed items move to `Post Submission`.

## 12) CSV exports
1. Export compliance and clarifications.
2. Verify headers and row alignment (no “all in one cell”).
3. Export opportunity data for Power BI CSV.

## 13) Notifications (email + in-app)
1. Create a new opportunity and ensure:
   - Bid owners, business owner, and configured roles are notified.
2. Request approval and verify approver notifications.
3. Check in-app notifications and mark as read.

## 14) Pagination & search
1. Validate pagination on:
   - Opportunities
   - Tenders
   - Awards
   - Attachments
2. Confirm page, pageSize, search filters return expected results.

## 15) Security basics
1. Confirm non-admins cannot access `Admin` pages.
2. Confirm unauthorized API calls return 401 and redirect to login.

## Expected artifacts (minimum)
- At least 1 tender in staging
- 1 approved opportunity
- 1 pricing pack
- 1 compliance CSV export
- 1 clarification CSV export
- 1 AI extraction run
- 1 approval chain (Go/No-Go → pricing → final)

## Known external dependencies
- SMTP credentials for email delivery (Gmail/Office365).
- Monaqasat portal availability for collector tests.
- OpenSearch for attachment search (optional).
