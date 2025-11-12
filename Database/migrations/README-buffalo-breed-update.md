# Buffalo Breed Update - Migration Guide

## Changes Made

### Frontend Changes

1. **Updated Label Names in AI Reports Section** ([AIReportsSection.tsx](../../ahpunjabfrontend/src/components/ReportComponents/AIReportsSection.tsx))
   - "Current Month" → "Artificial Insemination"
   - "Covered 3 Months Ago" → "Follow Up (Covered 3 Months Ago)"
   - "Positive 6 Months Ago" → "Calf Born (Positive 6 Months Ago)"

2. **Updated Buffalo Breeds**
   - **Removed:** Surti, Jaffarabadi
   - **Added:** Murrah Sexed, Nili Ravi Sexed

   **Files Updated:**
   - [types.ts](../../ahpunjabfrontend/src/components/ReportComponents/types.ts) - TypeScript interface
   - [AIReportsSection.tsx](../../ahpunjabfrontend/src/components/ReportComponents/AIReportsSection.tsx) - UI display
   - [CreateReportScreen.tsx](../../ahpunjabfrontend/src/screens/CreateReportScreen.tsx) - Initial state (2 locations)

### Backend Changes

1. **Database Schema** ([02-seed-semen-types.sql](../init/02-seed-semen-types.sql))
   - Replaced `SURTI` and `JAFFARABADI` with `MURRAH_SEXED` and `NILI_RAVI_SEXED`

2. **Backend Configuration** ([semenTypes.js](../../Backend/src/config/semenTypes.js))
   - Updated `SEMEN_TYPE_MAPPING` to include new buffalo breeds:
     ```javascript
     'murrahSexed': 'MURRAH_SEXED',
     'niliRaviSexed': 'NILI_RAVI_SEXED',
     ```

3. **Database Migration** ([001-update-buffalo-breeds.sql](./001-update-buffalo-breeds.sql))
   - Deactivates old breeds (preserves data integrity)
   - Adds new sexed buffalo breeds
   - Includes verification queries

## How to Apply Database Migration

### For Existing Database:

Run the migration script:
```bash
docker exec -i ahpunjab-postgres psql -U ahpunjab -d ahpunjab_db < Database/migrations/001-update-buffalo-breeds.sql
```

### For Fresh Database Setup:

The changes in `02-seed-semen-types.sql` will be automatically applied during database initialization.

## Verification

After applying changes:

1. **Check Frontend:**
   ```bash
   cd ahpunjabfrontend && npm run build
   ```
   ✅ Build should complete successfully

2. **Check Database:**
   ```sql
   SELECT semen_code, semen_name, is_active
   FROM semen_types
   WHERE species = 'Buffalo'
   ORDER BY is_active DESC, semen_code;
   ```
   Expected output:
   - MURRAH (active)
   - MURRAH_SEXED (active)
   - NILI_RAVI (active)
   - NILI_RAVI_SEXED (active)
   - JAFFARABADI (inactive)
   - SURTI (inactive)

## Notes

- Old buffalo breeds (Surti, Jaffarabadi) are deactivated but not deleted to preserve historical data integrity
- Any existing AI reports using old breeds will continue to work
- New reports will only show the updated buffalo breeds in the UI
