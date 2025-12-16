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


