# Outvier Production Release & Rollback Procedures

This document defines the emergency rollback protocols for frontend, backend, and database migrations.

---

## 1. Fast Rollback Protocols (< 2 Minutes)

### Frontend Rollback (Next.js / Vercel / Docker)
If a critical UI regression, hydration error, or rendering loop is detected:
1. Promote the previous stable production release:
   ```bash
   # If deploying via Docker / PM2
   docker pull outvier-frontend:PREVIOUS_STABLE_TAG
   docker stop outvier-frontend && docker rm outvier-frontend
   docker run -d --name outvier-frontend -p 3000:3000 outvier-frontend:PREVIOUS_STABLE_TAG
   ```
2. Invalidate Cloudflare / Edge CDN caches:
   ```bash
   curl -X POST "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache" \
     -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
     -H "Content-Type: application/json" \
     --data '{"purge_everything":true}'
   ```

### Backend API Rollback
1. Switch traffic to previous blue container:
   ```bash
   docker-compose -f docker-compose.prod.yml down backend
   docker-compose -f docker-compose.prod.yml up -d --no-deps backend_previous
   ```
2. Verify liveness and readiness probes:
   ```bash
   curl -f http://127.0.0.1:5000/health/live
   curl -f http://127.0.0.1:5000/health/ready
   ```

---

## 2. Database Migration Rollback Rules
- All database schema evolutions must maintain backward compatibility for N-1 versions (expand-contract pattern).
- If a schema change requires reverting:
  1. Run the specific down-migration script:
     ```bash
     npm run migrate:down -- --step 1
     ```
  2. Verify index integrity:
     ```bash
     mongosh --eval "db.applications.getIndexes()"
     ```

---

## 3. Incident Severity Levels & Triage
| Severity | Description | SLA Response | Escalation |
|---|---|---|---|
| **SEV-1** | Outage, data corruption, auth failure | < 15 mins | Immediate rollback + engineering lead alert |
| **SEV-2** | Degraded search, AI copilot latency | < 1 hour | Enable cache fallback, investigate logs |
| **SEV-3** | Minor visual glitch, copy error | Next sprint | Standard PR fix |
