# Database Migration Required

After deploying this code, you must run the Prisma migration to create the new event tables:

```bash
cd backend
npx prisma migrate dev --name add_project_and_service_events
```

This will create:
- `project_events` table
- `service_events` table

Both tables track timeline events for their respective entities.

## Rollback

If needed, you can rollback the migration with:
```bash
npx prisma migrate reset
```

Note: This is only for development. For production, use `prisma migrate deploy`.
