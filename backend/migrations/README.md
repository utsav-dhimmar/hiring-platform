# Database Migrations

This directory contains SQL migration scripts for the HR Platform database.

## How to Run Migrations

### Option 1: Using psql (Recommended for production)
```bash
psql -h localhost -U postgres -d app -f migrations/add_notes_to_hr_decisions.sql
```

### Option 2: Using Docker exec
```bash
docker exec -i postgres-pgvector psql -U postgres -d app < migrations/add_notes_to_hr_decisions.sql
```

### Option 3: Using Python script
```python
import asyncio
from sqlalchemy import text
from app.v1.db.session import AsyncSessionLocal

async def run_migration():
    async with AsyncSessionLocal() as db:
        with open("migrations/add_notes_to_hr_decisions.sql", "r") as f:
            migration_sql = f.read()
        
        await db.execute(text(migration_sql))
        await db.commit()
        print("Migration completed successfully!")

# Run the migration
asyncio.run(run_migration())
```

## Migration Files

### `add_notes_to_hr_decisions.sql`
- **Purpose**: Adds `notes` field to `hr_decisions` table
- **Features**:
  - Adds optional TEXT column for decision notes
  - Creates performance indexes
  - Adds proper column comments
- **Safe to run**: Yes - backward compatible
- **Rollback**: `ALTER TABLE hr_decisions DROP COLUMN notes;`

## Important Notes

1. **Always backup** your database before running migrations
2. **Test migrations** on development environment first
3. **Check application compatibility** after migration
4. **Monitor performance** after adding new indexes

## Migration Status

- ✅ `add_notes_to_hr_decisions.sql` - Ready for deployment
- ⏳ Future migrations will be added here
