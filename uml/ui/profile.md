# UI: Profile Screen

```mermaid
flowchart TD
    A[ProfileScreen] --> H[Header bar\nBack arrow  ·  Profile]

    H --> AV[Avatar circle\nInitials or profile_picture_url\nTap → upload new photo]

    AV --> INFO[Info section\nFull name  ·  Role chip\nInstitute name  ·  District, Tehsil\nVillage  ·  GPS coordinates]

    INFO --> SV[Service Villages\ntag cloud of assigned villages]

    SV --> EDIT[Edit Profile button\n→ inline edit mode with FloatingLabelFields\nfullName, mobile, email, designation, dob\nSave / Cancel]

    SV --> LINKS[Security section\nChange Password →\nManage Passkeys →\nActive Sessions →\nNotification Settings →]

    subgraph Bottom safe area
        SAFE[iOS safe area inset padding]
    end
```

**API calls:** `GET /v1/profile` on load; `PATCH /v1/profile` on save; `POST /v1/profile/picture` on photo tap.

**Layout:** `flex flex-col h-screen overflow-hidden` — scrollable content area between fixed header and fixed save button.
