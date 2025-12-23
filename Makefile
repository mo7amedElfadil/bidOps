SHELL := /bin/bash
COMPOSE_BASE := docker compose --env-file .env -f infra/compose.yml
COMPOSE := $(COMPOSE_BASE)
COMPOSE_MONITORING := $(COMPOSE_BASE) --profile monitoring
INCLUDE_MONITORING ?= false
DB_URL := postgresql://bidops:bidops@localhost:5432/bidops?schema=public

.PHONY: bootstrap up down db-migrate db-seed db-reset api-dev web-dev workers-dev collectors-run lint test build build-packages pack-sample parse-rfp pbi-export
.PHONY: logs logs-monitoring logs-backend logs-frontend api-start-4000 api-smoke
.PHONY: rebuild rebuild-nc

bootstrap:
	@echo "Bootstrapping toolchains and workspace..."
	@corepack enable pnpm || true
	@pnpm --version || true
	@echo "Install root dev deps (turbo)"; pnpm i -w --ignore-scripts || true

up:
ifeq ($(INCLUDE_MONITORING),true)
	$(COMPOSE_MONITORING) up -d
else
	$(COMPOSE) up -d
endif

up-monitoring:
	$(COMPOSE_MONITORING) up -d

down:
	$(COMPOSE) down

down-volumes:
	$(COMPOSE) down -v

db-migrate:
	@echo "Running Prisma migrations (API app)..."
	@set -a; . ./.env; set +a; cd apps/api && pnpm prisma migrate deploy || true

db-seed:
	@echo "Seeding database (API app)..."
	@set -a; . ./.env; set +a; cd apps/api && pnpm prisma db seed || true
	@echo "Tip: admin user seeded as admin@example.com (local auth); use /auth/dev-login"

db-reset:
	@echo "Resetting database (drop -> migrate -> seed)..."
	@set -a; . ./.env; set +a; cd apps/api && pnpm prisma migrate reset --force || true

api-dev:
	@cd apps/api && pnpm dev

web-dev:
	@cd apps/web && pnpm dev

workers-dev:
	@cd apps/workers && pnpm dev

collectors-run:
	@cd apps/collectors && pnpm start

lint:
	@pnpm lint

test:
	@pnpm test

build:
	@pnpm build

build-packages:
	@pnpm --filter @itsq-bidops/parser-tools build

api-start-4000:
	@PORT=4000 DATABASE_URL=postgresql://bidops:bidops@localhost:5432/bidops?schema=public node apps/api/dist/main.js

api-smoke:
	@echo "Starting API on :4000 (background) and probing endpoints..."
	@PORT=4000 DATABASE_URL=postgresql://bidops:bidops@localhost:5432/bidops?schema=public node apps/api/dist/main.js & \
	sleep 3; \
	echo "Health:"; curl -sS http://localhost:4000/health; echo; \
	echo "SLA:"; curl -sS http://localhost:4000/settings/sla; echo; \
	echo "Clients list:"; curl -sS http://localhost:4000/clients; echo; \
	fg >/dev/null 2>&1 || true
pack-sample:
	@echo "Generating sample submission pack from fixtures..."
	@node scripts/pack-sample.js || true

parse-rfp:
	@echo "Parsing sample RFP to compliance CSV..."
	@node scripts/parse-rfp.js || true

pbi-export:
	@echo "Exporting BI snapshot to ./exports ..."
	@mkdir -p exports
	@curl -sS -H "Authorization: Bearer $${JWT:-}" http://localhost:4000/analytics/export/awards.csv -o exports/awards.csv || true
	@curl -sS -H "Authorization: Bearer $${JWT:-}" http://localhost:4000/analytics/export/opportunities.csv -o exports/opportunities.csv || true

sla-tick:
	@node apps/workers/dist/index.js || true

import-sample:
	@echo "Posting sample CSV to API import endpoint..."
	@echo "Customer,Tender Details,Description,Submission Date,Status,Business Owner,Mode of Submission,Days Left,Rank,Validity" > /tmp/sample.csv
	@echo "ACME,REF-001,Sample Bid,$$(date -d '+10 day' +%F),Open,Owner,Portal,10,1,30" >> /tmp/sample.csv
	@curl -s -F file=@/tmp/sample.csv http://localhost:4000/import/tracker || true

.PHONY: seed-admin
seed-admin:
	@echo "Seeding admin via /auth/dev-login ..."
	@TOKEN=$$(curl -sS -H "content-type: application/json" -d '{"email":"admin@example.com","name":"Admin","role":"ADMIN","tenantId":"default"}' http://localhost:4000/auth/dev-login | jq -r .access_token); \
	if [ "$$TOKEN" = "null" ] || [ -z "$$TOKEN" ]; then echo "Failed to obtain token"; exit 1; fi; \
	echo "JWT: $$TOKEN"; \
	echo "export JWT=$$TOKEN"

# Logs
logs:
	$(COMPOSE) logs -f --tail=200

logs-monitoring:
	$(COMPOSE_MONITORING) logs -f --tail=200 grafana prometheus otel-collector dashboards

logs-backend:
	$(COMPOSE) logs -f --tail=200 api

logs-frontend:
	$(COMPOSE) logs -f --tail=200 web

# Rebuild changed services (pass SERVICES="api web" to limit scope)
rebuild:
	@echo "Rebuilding $(if $(SERVICES),$(SERVICES),all services) with bake..."
	@COMPOSE_BAKE=true $(COMPOSE) build $(SERVICES)
	@$(COMPOSE) up -d $(SERVICES)

rebuild-nc:
	@echo "Rebuilding (no cache) $(if $(SERVICES),$(SERVICES),all services) with bake..."
	@COMPOSE_BAKE=true $(COMPOSE) build --no-cache $(SERVICES)
	@$(COMPOSE) up -d $(SERVICES)
