# Compliance

Compliance Matrix:

- Extract clauses from RFP PDFs (OCR when needed)
- Preserve verbatim requirement text
- Fields: `section_id`, `requirement_text` (verbatim), `mandatory_flag`, `response`, `evidence`, `owner`, `status`
- Response fields, evidence linking, status heatmap
- CSV/XLSX export and round-trip edits

Parser notes:
- Tesseract/textract pipeline; Azure Form Recognizer optional
- Heuristics documented in packages/parser-tools

Endpoints
- GET `/compliance/:opportunityId`
- POST `/compliance/:opportunityId/import` (multipart pdf)
- POST `/compliance/:opportunityId/import.csv` (multipart csv)
- PATCH `/compliance/:id`
- GET `/compliance/:opportunityId/export.csv`

UI
- Matrix grid at `/opportunity/:id/compliance` with export

