# File: Backend/src/services/profileService.js

Reads and updates the authenticated user's profile, including picture upload to object storage.

```mermaid
flowchart TD
    A[profileService.js] --> B[getProfileByUserId userId]
    A --> C[updateProfile userId, updates]
    A --> D[uploadPicture userId, fileBuffer, mimeType]

    B --> B1[SELECT staff JOIN institutes\nLEFT JOIN districts, tehsils, villages\nWHERE user_id=$1 AND is_active=TRUE]
    B1 --> B2{found?}
    B2 -->|no| B3[throw NotFoundError]
    B2 -->|yes| B4[SELECT institute_service_villages\nJOIN villages WHERE institute_id=$instituteId]
    B4 --> B5[return profile object:\nstaffId, userId, fullName, designation,\nmobile, email, dob, role,\ninstituteName, type, location,\nserviceVillages]

    C --> C1[UPDATE staff SET\nfull_name, mobile, email, designation, date_of_birth\nWHERE user_id=$1 AND is_active=TRUE]
    C1 --> C2{rowCount > 0?}
    C2 -->|no| C3[throw NotFoundError]
    C2 -->|yes| C4[getProfileByUserId — return updated profile]

    D --> D1[validate mimeType: image/jpeg, image/png, image/webp]
    D1 --> D2[upload to object storage\npath: profiles/userId/timestamp.ext]
    D2 --> D3[UPDATE staff SET profile_picture_url=$url]
    D3 --> D4[return { url }]
```

**Notes:**
- `NotFoundError` is a custom error class from `src/utils/errors.js`; the global error handler maps it to HTTP 404.
- Profile picture upload path uses a timestamp suffix so the new URL differs from the old one, bypassing CDN cache without needing a cache-busting header.
- Only a fixed whitelist of fields is updated to prevent mass-assignment (role, instituteId etc. cannot be changed via this endpoint).
