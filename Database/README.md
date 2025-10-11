# AH Punjab PostgreSQL Database

Docker-based PostgreSQL setup for the AH Punjab Reporting System.

## Quick Start

### 1. Start Database

```bash
cd Database
docker-compose up -d
```

This will:
- ✅ Start PostgreSQL 16 on port **5432**
- ✅ Create database `ahpunjab_db`
- ✅ Run schema (all tables, indexes, views, triggers)
- ✅ Load seed data (districts, tehsils, villages, etc.)
- ✅ Start pgAdmin on port **5050** (optional web UI)

### 2. Check Database Status

```bash
docker-compose ps
```

You should see:
```
NAME                  STATUS
ahpunjab-postgres     Up (healthy)
ahpunjab-pgadmin      Up
```

### 3. View Logs

```bash
docker-compose logs postgres
```

Look for:
```
Seed data loaded successfully!
Districts: 8
Tehsils: 15
Villages: 17
```

## Database Access

### Connection Details

| Property | Value |
|----------|-------|
| Host | `localhost` |
| Port | `5432` |
| Database | `ahpunjab_db` |
| Username | `ahpunjab` |
| Password | `ahpunjab_dev_2024` |

### Connection String (for Node.js)

```
postgresql://ahpunjab:ahpunjab_dev_2024@localhost:5432/ahpunjab_db
```

### Via Command Line (psql)

```bash
docker exec -it ahpunjab-postgres psql -U ahpunjab -d ahpunjab_db
```

Example queries:
```sql
-- List all districts
SELECT * FROM districts;

-- List villages with populations
SELECT * FROM v_village_populations;

-- Count total animals
SELECT
  SUM(total_animals) as total_animals,
  SUM(human_population) as total_humans
FROM v_village_populations;
```

### Via pgAdmin (Web UI)

1. Open browser: http://localhost:5050
2. Login:
   - Email: `admin@ahpunjab.local`
   - Password: `admin`
3. Add server:
   - Host: `postgres` (container name, not localhost!)
   - Port: `5432`
   - Database: `ahpunjab_db`
   - Username: `ahpunjab`
   - Password: `ahpunjab_dev_2024`

## Database Structure

### Key Tables

| Table | Purpose |
|-------|---------|
| `districts` | Punjab districts |
| `tehsils` | Sub-districts/tehsils |
| `villages` | Villages with animal/human populations |
| `institutes` | Veterinary institutes (CVH, CVD, PAIW) |
| `staff` | Veterinary staff with login credentials |
| `monthly_reports` | Monthly reporting workflow |
| `service_charges` | Fee structure for services |
| `semen_types` | AI semen types |
| `vaccines` | Vaccine master data |

### Useful Views

| View | Purpose |
|------|---------|
| `v_institute_hierarchy` | Complete institute info with location |
| `v_village_populations` | Village populations with totals |
| `v_current_staff_postings` | Current staff assignments |
| `v_monthly_report_summary` | Report status overview |

## Sample Data Loaded

- **8 Districts**: Amritsar, Ludhiana, Jalandhar, Patiala, Bathinda, Mohali, Gurdaspur, Hoshiarpur
- **15 Tehsils**: Including Ajnala, Amritsar I/II, Tarn Taran, Patti, etc.
- **17 Villages**: With realistic population data
- **10 Service Charges**: OPD, AI, Vaccination, Certificates
- **6 Semen Types**: HF, Jersey, Sahiwal, Murrah, etc.
- **6 Vaccines**: FMD, HS, BQ, Brucella, PPR, Ranikhet

## Management Commands

### Stop Database

```bash
docker-compose down
```

### Stop and Remove Data (Fresh Start)

```bash
docker-compose down -v
```

⚠️ **Warning**: This deletes ALL data! Use only for fresh start.

### Restart Database

```bash
docker-compose restart
```

### View Resource Usage

```bash
docker stats ahpunjab-postgres
```

### Backup Database

```bash
docker exec ahpunjab-postgres pg_dump -U ahpunjab ahpunjab_db > backup.sql
```

### Restore Database

```bash
docker exec -i ahpunjab-postgres psql -U ahpunjab ahpunjab_db < backup.sql
```

## Files

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Docker configuration |
| `init/01-schema.sql` | Database schema (tables, indexes, views) |
| `init/02-seed.sql` | Sample data for testing |

## Troubleshooting

### Port 5432 Already in Use

If you have PostgreSQL installed locally:
```bash
# Windows - Stop local PostgreSQL
net stop postgresql-x64-16

# Or change port in docker-compose.yml
ports:
  - "5433:5432"  # Use 5433 instead
```

### Database Not Initializing

Check logs:
```bash
docker-compose logs postgres
```

Fresh restart:
```bash
docker-compose down -v
docker-compose up -d
```

### Can't Connect from Node.js

Make sure to use `localhost` (not `postgres`):
```javascript
const connectionString = 'postgresql://ahpunjab:ahpunjab_dev_2024@localhost:5432/ahpunjab_db'
```

## Next Steps

1. ✅ Database running
2. Install `pg` driver in Backend: `cd Backend && npm install pg`
3. Create database connection module
4. Build registration API endpoint
5. Connect frontend to backend

## Security Notes

⚠️ **Development Only**: These credentials are for development only!

For production:
- Change passwords
- Use environment variables
- Enable SSL/TLS
- Restrict network access
- Set up regular backups
