# AH Punjab - Testing Guide

## What Was Implemented

### 1. Comprehensive Database Seed Data
**File**: `Backend/database/comprehensive_seed_data.sql`

This file contains mock data for all database tables:
- Service charges (OPD, AI, vaccines, diagnostics, etc.)
- Semen types (HF, Jersey, Murrah, etc.)
- Vaccines (FMD, HS, BQ, Brucellosis, etc.)
- Geographic data (Districts, Tehsils, Villages with animal populations)
- Institutes (CVD Kotra Kalan and attached institutes)
- Staff (Dr. Rajdeep Sandhu and team)
- Semen & Vaccine Stock
- Monthly Reports (with various statuses)

### 2. Backend API Endpoint
**Endpoint**: `GET /v1/home`

**Files Created**:
- `Backend/src/routes/home.js` - Route definition
- `Backend/src/controllers/homeController.js` - Request handler
- `Backend/src/services/homeService.js` - Business logic

**Features**:
- Fetches user's institute information
- Retrieves staff members
- Gets attached villages with animal populations
- Calculates OPD, AI Cow, and AI Buffalo statistics (monthly & annual)
- Aggregates vaccine statistics for all vaccines
- Returns attached institutes with reporting status (for admins)

### 3. Frontend Integration
**Files Modified**:
- `ahpunjabfrontend/src/screens/HomeScreen.tsx` - Updated to fetch from API
- `ahpunjabfrontend/src/utils/api.ts` - Created API utility

**Features**:
- Fetches homepage data from backend on mount
- Shows loading spinner while fetching
- Falls back to mock data if API fails
- Displays error state with retry button
- Fully typed with TypeScript interfaces

## How to Test

### Step 1: Setup Database

```bash
# Make sure PostgreSQL is running
# Create database if it doesn't exist
psql -U postgres
CREATE DATABASE ahpunjab_db;
CREATE USER ahpunjab WITH PASSWORD 'ahpunjab_dev_2024';
GRANT ALL PRIVILEGES ON DATABASE ahpunjab_db TO ahpunjab;
\q

# Then run the schema and seed data
cd Backend
psql -U ahpunjab -d ahpunjab_db -f database/schema.sql
psql -U ahpunjab -d ahpunjab_db -f database/comprehensive_seed_data.sql
```

### Step 2: Start Backend

```bash
cd Backend
npm run dev
```

The backend will start on `http://localhost:8080`

### Step 3: Start Frontend

```bash
cd ahpunjabfrontend
npm run dev
```

The frontend will start on `http://localhost:3000`

### Step 4: Test the Homepage API

**Option A: Using curl**

```bash
# You need an auth token first - use one of these test users:
# user_id: CVD_KOTRA_001 (Dr. Rajdeep Sandhu - INAPH)
# user_id: TEHSIL_AMRITSAR1 (Dr. Manjit Kaur - Tehsil Admin)
# user_id: DISTRICT_AMRITSAR (Dr. Rajinder Kumar - District Admin)

# Login first to get token
curl -X POST http://localhost:8080/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"userId": "CVD_KOTRA_001", "password": "your_password"}'

# Then use the token to fetch home data
curl -X GET http://localhost:8080/v1/home \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Option B: Using the Frontend**

1. Navigate to `http://localhost:3000`
2. Login with one of the test users
3. The HomeScreen will automatically fetch data from the API
4. Check browser DevTools Network tab to see the API call

**Option C: Using Swagger UI**

1. Navigate to `http://localhost:8080/docs`
2. Find the `GET /v1/home` endpoint
3. Click "Try it out"
4. Add your Bearer token
5. Execute

## Expected Response Structure

```json
{
  "success": true,
  "data": {
    "name": "Veterinary Dispensary Kotra Kalan",
    "welcomeMessage": "Welcome Dr. Rajdeep Sandhu",
    "location": {
      "lat": "30.4681° N",
      "lng": "72.6503° E"
    },
    "stats": {
      "opd": {
        "monthly": { "completed": 45 },
        "annual": { "completed": 495, "target": 1200 }
      },
      "aiCow": {
        "monthly": { "completed": 35 },
        "annual": { "completed": 385, "target": 600 }
      },
      "aiBuf": {
        "monthly": { "completed": 25 },
        "annual": { "completed": 275, "target": 360 }
      }
    },
    "vaccines": {
      "FMD": {
        "name": "Foot and Mouth Disease",
        "monthly": { "completed": 350 },
        "annual": { "completed": 3850, "target": 6000 }
      },
      // ... more vaccines
    },
    "staff": [
      {
        "name": "Dr. Rajdeep Sandhu",
        "role": "Veterinary Officer",
        "phone": "+919834562107",
        "email": "rajdeep.sandhu@ahpunjab.gov.in",
        "whatsapp": "+919834562107"
      },
      // ... more staff
    ],
    "villages": [
      {
        "name": "Kotra Kalan",
        "population": 3050,
        "animalPopulation": {
          "equine": 28,
          "buffaloes": 295,
          "cows": 540,
          "pigs": 9,
          "goat": 225,
          "sheep": 165,
          "poultryLayers": 1320,
          "poultryBroilers": 710
        }
      },
      // ... more villages
    ],
    "reportingStatus": "On Time",
    "attachedInstitutes": [] // Only for Tehsil/District admins
  }
}
```

## Test Users

| User ID | Name | Role | Institute |
|---------|------|------|-----------|
| CVD_KOTRA_001 | Dr. Rajdeep Sandhu | INAPH | Veterinary Dispensary Kotra Kalan |
| ASSIST_KOTRA_001 | Manpreet Kaur | AIW | Veterinary Dispensary Kotra Kalan |
| LAB_KOTRA_001 | Arvinder Singh | AIW | Veterinary Dispensary Kotra Kalan |
| TEHSIL_AMRITSAR1 | Dr. Manjit Kaur | Tehsil Admin | Tehsil Veterinary Office Amritsar-I |
| DISTRICT_AMRITSAR | Dr. Rajinder Kumar | District Admin | District Veterinary Office Amritsar |

**Note**: Passwords need to be set up properly with Argon2id hashing. The seed data has placeholder hashes.

## Database Tables Populated

- ✅ districts (10 districts)
- ✅ tehsils (11 tehsils)
- ✅ villages (10 villages with full animal population data)
- ✅ service_charges (25 service types)
- ✅ semen_types (11 semen types)
- ✅ vaccines (7 vaccines with dosage info)
- ✅ institutes (7 institutes including CVDs, Tehsil HQ, District HQ)
- ✅ staff (5 staff members)
- ✅ staff_postings (5 posting records)
- ✅ institute_service_villages (4 service village mappings)
- ✅ semen_stock (3 stock records)
- ✅ vaccine_stock (7 vaccine stock records)
- ✅ monthly_reports (6 sample reports)

## Troubleshooting

### Issue: Database connection error
**Solution**: Check PostgreSQL is running and credentials in `Backend/src/database/db.js` are correct

### Issue: 401 Unauthorized
**Solution**: Make sure you're logged in and passing the JWT token in Authorization header

### Issue: Empty response or null data
**Solution**: Check that the seed data was loaded correctly by running:
```sql
SELECT * FROM staff WHERE user_id = 'CVD_KOTRA_001';
SELECT * FROM institutes WHERE org_id = 'CVD_KOTRA_001';
```

### Issue: Frontend shows error state
**Solution**:
1. Check browser console for errors
2. Check Network tab to see the API response
3. Verify backend is running on port 8080
4. Check CORS is enabled in backend

## Next Steps

After testing, you can:
1. Add more institutes and staff members
2. Add more monthly reports with detailed breakdown (OPD, AI, vaccines)
3. Implement the actual report creation flow
4. Add real authentication with proper password hashing
5. Deploy to production environment

## Files Reference

### Backend
- `/Backend/database/comprehensive_seed_data.sql` - Complete seed data
- `/Backend/src/routes/home.js` - Home route
- `/Backend/src/controllers/homeController.js` - Home controller
- `/Backend/src/services/homeService.js` - Home business logic
- `/Backend/src/server.js` - Route registration

### Frontend
- `/ahpunjabfrontend/src/screens/HomeScreen.tsx` - Home screen with API integration
- `/ahpunjabfrontend/src/utils/api.ts` - API utility functions
- `/ahpunjabfrontend/src/utils/storage.ts` - Storage utility (for auth tokens)