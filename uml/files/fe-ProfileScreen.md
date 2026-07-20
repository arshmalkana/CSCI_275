# File: ahpunjabfrontend/src/screens/ProfileScreen.tsx

Displays and edits the logged-in user's profile. Uses flexbox scroll pattern (not fixed positioning).

```mermaid
flowchart TD
    A[ProfileScreen] --> B[GET /v1/profile on mount]
    B --> C[Display:\nAvatar + name + role chip\ninstitute name + location\nservice villages list]

    C --> D[Edit button → edit mode]
    D --> E[FloatingLabelField inputs:\nfullName, mobile, email, designation, dob]
    E --> F[Save → PATCH /v1/profile body]
    F --> G{success?}
    G -->|yes| H[update local state\nshow success toast\nreturn to view mode]
    G -->|no| I[show error message]

    C --> J[Change Photo button\nfile input: jpeg/png/webp ≤ 5MB\n→ POST /v1/profile/picture multipart]
    J --> K[optimistic preview\nthen update profile_picture_url]

    C --> L[Navigation links:\nChange Password → /change-password\nManage Passkeys → /manage-passkeys\nActive Sessions → /active-sessions]

    subgraph Layout
        LAY[flex flex-col h-screen\nFixed header: Back + Profile title\nScrollable content: pb-32\nFixed Save button at bottom]
    end
```

**Notes:**
- Profile picture shows initials avatar when `profile_picture_url` is null.
- Edit mode replaces display text with `FloatingLabelField` components.
- Service villages are displayed as a tag cloud below the institute info.
