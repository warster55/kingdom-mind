# Kingdom Mind - Routes Reference

Quick reference for all Journey and Library routes.

## Journey Routes

### Getting Started
```
/journey/getting-started
```
Welcome page with Romans 12:2, "My Why" statement, and checklist.

### Domains Overview
```
/journey/domains
```
Grid of 7 life domains with progress tracking.

### Individual Domain Pages
```
/journey/domains/identity
/journey/domains/relationships
/journey/domains/purpose
/journey/domains/god-relationship
/journey/domains/emotions
/journey/domains/past-healing
/journey/domains/future-hope
```
Each shows overview, scriptures, subfolders, and how to start.

## Library Routes

### Psychology Tools Overview
```
/library/psychology
```
Overview of all psychology tools with links to each.

### Cognitive Distortions
```
/library/psychology/distortions
```
15 thinking errors with biblical counters.

### Scripture Library
```
/library/scripture
```
Searchable scripture library with theme filtering.

### Additional Library Pages (To Be Created)
```
/library/psychology/schemas
/library/psychology/attachment
/library/psychology/faith-stages
```

## Emergency Routes

### Emergency Anchors
```
/emergency-anchors
```
Quick access grounding truths for crisis moments.

## API Endpoints

### Journey API
```
GET    /api/journey                      - Get user journey
PUT    /api/journey                      - Update user journey
GET    /api/journey/domains              - Get all domains with progress
GET    /api/journey/domains/[slug]       - Get single domain details
PUT    /api/journey/domains/[slug]       - Update domain progress
```

### Library API
```
GET    /api/library/cognitive-distortions - Get all cognitive distortions
GET    /api/library/scriptures            - Get scriptures (with search/filter)
```

## Navigation Structure

Recommended sidebar navigation:

```
Journey
├── Getting Started
├── Domains
│   ├── Identity
│   ├── Relationships
│   ├── Purpose & Calling
│   ├── God & Faith
│   ├── Emotions & Mental Health
│   ├── Past & Healing
│   └── Future & Hope

Library
├── Psychology Tools
│   ├── Cognitive Distortions
│   ├── Maladaptive Schemas
│   ├── Attachment Styles
│   └── Faith Development Stages
└── Scripture Library

Tools
└── Emergency Anchors
```

## URL Parameters

### Scripture Library
```
/library/scripture?search=love         - Search scriptures
/library/scripture?theme=identity      - Filter by theme
```

## Protected Routes

All routes under `/journey`, `/library`, and `/emergency-anchors` require authentication via NextAuth.

Unauthenticated users will be redirected to `/login`.
