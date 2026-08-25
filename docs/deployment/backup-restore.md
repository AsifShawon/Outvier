# Outvier Production Backup and Disaster Recovery Runbook

This guide outlines standard operational procedures for automated database backups, verification, and point-in-time restoration.

---

## 1. MongoDB Database Backup & Restore

### Automated Nightly Backup Script
```bash
#!/bin/bash
set -euo pipefail

BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/outvier/mongodb"
S3_BUCKET="s3://outvier-backups-production/mongodb"

mkdir -p "${BACKUP_DIR}"

# Perform gzip compressed dump with authentication
mongodump \
  --uri="mongodb://${MONGO_ROOT_USER}:${MONGO_ROOT_PASSWORD}@127.0.0.1:27017/outvier?authSource=admin" \
  --gzip \
  --archive="${BACKUP_DIR}/outvier_backup_${BACKUP_DATE}.gz"

# Encrypt backup with AES-256 before uploading to remote S3 storage
gpg --symmetric --cipher-algo AES256 --batch --passphrase "${BACKUP_ENCRYPTION_KEY}" \
  "${BACKUP_DIR}/outvier_backup_${BACKUP_DATE}.gz"

aws s3 cp "${BACKUP_DIR}/outvier_backup_${BACKUP_DATE}.gz.gpg" "${S3_BUCKET}/"

# Prune local backups older than 7 days
find "${BACKUP_DIR}" -type f -mtime +7 -delete

echo "[SUCCESS] MongoDB backup completed: outvier_backup_${BACKUP_DATE}.gz.gpg"
```

### Full Disaster Recovery Restore Procedure
1. Stop backend application services to prevent conflicting writes:
   ```bash
   pm2 stop outvier-backend
   ```
2. Download and decrypt the target backup archive:
   ```bash
   aws s3 cp s3://outvier-backups-production/mongodb/outvier_backup_TARGET_DATE.gz.gpg ./
   gpg --decrypt --batch --passphrase "${BACKUP_ENCRYPTION_KEY}" outvier_backup_TARGET_DATE.gz.gpg > outvier_restore.gz
   ```
3. Restore database with drop protection:
   ```bash
   mongorestore \
     --uri="mongodb://${MONGO_ROOT_USER}:${MONGO_ROOT_PASSWORD}@127.0.0.1:27017/outvier?authSource=admin" \
     --gzip \
     --drop \
     --archive=outvier_restore.gz
   ```
4. Verify database collection counts and readiness:
   ```bash
   curl -f http://localhost:5000/health/ready
   ```
5. Restart application traffic:
   ```bash
   pm2 restart outvier-backend
   ```

---

## 2. Metabase PostgreSQL Backup & Restore

### PostgreSQL Backup
```bash
PGPASSWORD="${METABASE_DB_PASS}" pg_dump \
  -h 127.0.0.1 -p 5432 -U "${METABASE_DB_USER}" -F c -b -v -f "/var/backups/metabase/metabase_$(date +%Y%m%d).dump" metabase
```

### PostgreSQL Restore
```bash
PGPASSWORD="${METABASE_DB_PASS}" pg_restore \
  -h 127.0.0.1 -p 5432 -U "${METABASE_DB_USER}" -d metabase -v --clean "/var/backups/metabase/metabase_TARGET.dump"
```

---

## 3. Redis Persistence & Recovery
- Redis uses combined Append-Only File (`AOF`) and snapshotting (`RDB`).
- Snapshot triggered manually via `redis-cli -a "${REDIS_PASSWORD}" BGSAVE`.
