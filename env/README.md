# Environment configuration

The repo expects the following environment variables. Create a .env file per app (or export in your shell) with these keys:

Common:
- NODE_ENV
- TZ

Database (API):
- DATABASE_URL (e.g., postgresql://bidops:bidops@localhost:5432/bidops?schema=public)

Redis (Workers/API):
- REDIS_HOST
- REDIS_PORT

OpenSearch:
- OPENSEARCH_HOST

Blob (Azurite):
- AZURITE_BLOB_ENDPOINT
- AZURITE_ACCOUNT_NAME
- AZURITE_ACCOUNT_KEY

Auth (AAD):
- AAD_TENANT_ID
- AAD_CLIENT_ID
- AAD_REDIRECT_URI

Mail:
- SMTP_HOST
- SMTP_PORT
- SMTP_FROM
- SLA_NOTIFY_TO (optional fallback email recipient for SLA alerts)
- SLA_TICK_INTERVAL_MS (default 21600000)
- EMAIL_TICK_INTERVAL_MS (default 60000)

AI extraction:
- AI_PROVIDER (openai|gemini)
- OPENAI_API_KEY
- OPENAI_MODEL
- GEMINI_API_KEY
- GEMINI_MODEL

Collectors translation:
- COLLECTOR_TRANSLATE_TITLES (default true; set to false to disable)
- COLLECTOR_TRANSLATION_PROVIDER (openai|gemini, defaults to AI_PROVIDER)
- OPENAI_API_KEY / OPENAI_MODEL (required if using OpenAI)
- GEMINI_API_KEY / GEMINI_MODEL (required if using Gemini)
