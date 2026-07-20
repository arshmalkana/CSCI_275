# File: Backend/src/routes/profile.js

User profile management. Mounted at `/v1/profile`. All routes require authentication.

```mermaid
flowchart TD
    A[profile.js routes\nprefix: /v1/profile] --> B[GET /\npreHandler: authenticate\n→ profileController.getProfile]
    A --> C[PATCH /\nbody: fullName, mobile, email, designation, dob\npreHandler: authenticate\n→ profileController.updateProfile]
    A --> D[POST /picture\ncontent-type: multipart/form-data\nbody: image file ≤ 5 MB\npreHandler: authenticate\n→ profileController.uploadPicture]

    B --> B1[profileService.getProfileByUserId request.user.userId\nreturns staff + institute + location + serviceVillages]

    C --> C1[profileService.updateProfile userId, body\nUPDATE staff SET allowed fields only\nreturns updated profile]

    D --> D1[validate mimeType: jpeg/png/webp\nvalidate size ≤ 5 MB]
    D1 --> D2[profileService.uploadPicture userId, buffer, mimeType\nupload to object storage]
    D2 --> D3[UPDATE staff SET profile_picture_url\nreturn { url }]
```

**Notes:**
- `PATCH /` only allows updating: `fullName`, `mobile`, `email`, `designation`, `dateOfBirth`. Role and institute assignment cannot be changed here.
- `POST /picture` uses `@fastify/multipart` to parse the file; size limit enforced at the plugin level (5 MB).
- The returned profile includes `serviceVillages` from `institute_service_villages` join — used by the PWA to display which villages the staff member covers.
