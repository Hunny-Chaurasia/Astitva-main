# Astitva

A responsive React, Vite, TypeScript, and Tailwind CSS app concept for a regional heritage social platform.

## Run locally

```sh
npm install
npm run dev
```

The app opens at a sign-in / registration portal with role selection and an OTP step. Use the public-feed link to explore without signing in; the prototype accepts any email/password and any six-digit OTP. Artisan, explorer, heritage researcher, community reviewer, community organisation, and admin/moderator workspaces share consistent navigation and responsive layouts. Researchers enter one heritage-only research workspace for archive search, citations, and research papers. Verified experts and cultural knowledge holders share the same community-review dashboard. Organisations and cultural groups can create shared pages managed by multiple group members rather than depending on an individual social profile.

The visual language uses an indigo, madder, marigold, and unbleached-cotton palette, restrained woven details, and maker/place attribution. The discovery feed is a media feed: short video, voice/audio, and photo posts have their own playback or image treatment, captions, craft/place context, and social actions. The artisan workspace includes a product-story form for photographs, qualities, heritage connection, price, inventory, and location. Publishing adds the listing to the marketplace and shares a product post to the feed. Workspace content and group pages currently use browser state and sample data; they are not shared across devices or persisted to a backend. Authentication delivery, durable storage, chunked media upload/transcoding, purchases, verification services, and production analytics still need service integration.

The sample feed credits its hand-spinning clip and Gujarati verse recording at their source links in the interface.
