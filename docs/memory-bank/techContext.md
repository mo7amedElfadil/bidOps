* Frontend: React + Vite, TypeScript, Tailwind, shadcn/ui, TanStack Query. MSAL for Azure AD login (when AUTH_PROVIDER=aad). Recharts for charts.
* Backend: NestJS, Prisma with PostgreSQL, BullMQ on Redis for jobs, OpenAPI, class-validator filters. File service and PDF service.
* Data: PostgreSQL transactional schema. OpenSearch for search. File storage abstraction (local filesystem or Azure Blob).
* Storage: Abstracted via StorageService interface. Toggle via STORAGE_PROVIDER=local|azure:
  - local: Files in LOCAL_STORAGE_PATH (default ./data/storage), no external deps
  - azure: Azure Blob Storage (or Azurite for dev)
* AI and OCR: Tesseract and textract pipeline. Optional Azure Form Recognizer for structured PDFs.
* Observability: OpenTelemetry, Prometheus + Grafana. Metrics and logs centralized.
* Security: Azure AD SSO (optional), local auth (default for dev), RBAC and record-level security. JWT tokens.
* Deployment: Docker, self-hosted Linux server or Azure Container Apps. CI with GitHub Actions.

* Defaults: Asia/Qatar timezone for SLAs and reporting.
