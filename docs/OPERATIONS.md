# Operations runbook

How to look after the production Firebase project `saath-societyapps` (Firestore
database `(default)`, region `asia-south1`). Run the commands in Google Cloud Shell
(https://shell.cloud.google.com) while signed in as a project owner.

## Backups (roadmap 5.3)

Firestore managed backups copy the whole database on a schedule. They need no code and
no bucket. A database can have one daily and one weekly schedule.

### Turn them on (once)

```bash
gcloud config set project saath-societyapps

# Every day, kept for 14 days
gcloud firestore backups schedules create --database='(default)' \
  --recurrence=daily --retention=14d

# Every Sunday, kept for 8 weeks
gcloud firestore backups schedules create --database='(default)' \
  --recurrence=weekly --day-of-week=SUN --retention=8w
```

### Check they are running

```bash
gcloud firestore backups schedules list --database='(default)'
gcloud firestore backups list --location=asia-south1   # appears a day after turning on
```

Cost: backups are billed per GB stored. While the society is small the database is a
few MB, so this is a few rupees a month.

### Restore

A restore always creates a **new** database next to the live one; it never overwrites
`(default)`.

1. Find the backup: `gcloud firestore backups list --location=asia-south1`
2. Restore it into a new database:
   ```bash
   gcloud firestore databases restore \
     --source-backup=projects/saath-societyapps/locations/asia-south1/backups/BACKUP_ID \
     --destination-database=restore-YYYYMMDD
   ```
3. Inspect it in the Firebase console (database selector at the top of Firestore).
4. Copy back what is needed. For a full rollback, point the app at the restored database
   (needs a small code change in `src/lib/firebase/admin.ts`); ask before doing this.
5. Delete the restored database when finished:
   `gcloud firestore databases delete --database=restore-YYYYMMDD`

## Indexes and rules

`firestore.indexes.json` and `firestore.rules` in the repo are the source of truth.
Deploy changes with `firebase deploy --only firestore:indexes` (or `firestore:rules`)
from the repo root. When the CLI offers to delete indexes that are not in the file,
answer **No** and check first.

## Making someone App Admin

The app never grants `SUPER_ADMIN` itself. After the person has signed in once:

```bash
npm ci --legacy-peer-deps
npm run grant-app-admin -- --phone 98XXXXXXXX            # dry run
npm run grant-app-admin -- --phone 98XXXXXXXX --apply
```
