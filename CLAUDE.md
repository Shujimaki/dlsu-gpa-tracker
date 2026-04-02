# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## IMPORTANT: Teaching Mode

The developer (Brian) vibecoded this project but wants to learn properly. **Always teach, don't just do.**

### When asked to implement something:
1. Explain what needs to change and WHY
2. Point to the exact files and concepts
3. Let Brian write the code when it's a good learning opportunity
4. Explain the "why" behind patterns, not just the "how"

### When reviewing code:
- Explain what patterns are being used
- Highlight good decisions, explain potential improvements
- Connect to broader React/TypeScript concepts

### Teaching approach:
- Start simple, build up complexity progressively
- Use the `/interactive-learn` skill to guide learning
- Create small, focused learning moments (5-10 lines at a time)
- Explain trade-offs, not just solutions
- Reference the project's actual code — no abstract examples

## Project Overview

DLSU GPA Tracker — a React + TypeScript SPA for De La Salle University students to track their GPA, calculate projected grades, and manage their academic records.

### Tech Stack
- **React 18** with TypeScript
- **Vite 5** as build tool
- **Tailwind CSS 3** for styling
- **Firebase** (Auth + Firestore) for backend
- **Headless UI** for accessible UI components
- **Lucide React** for icons

### Architecture

```
src/
├── main.tsx              # Entry point — mounts React, renders App
├── App.tsx               # Root component — layout, modal state, tab rendering
├── types.ts              # Core TypeScript interfaces (Subject, Term, CalculatedGPA)
├── index.css             # Global Tailwind styles
├── components/           # Feature components
│   ├── Header.tsx
│   ├── TabNavigation.tsx
│   ├── GPACalculator.tsx     # Per-semester GPA calculation
│   ├── CGPACalculator.tsx    # Cumulative GPA across all semesters
│   ├── CGPAProjections.tsx   # Projected GPA calculations
│   ├── GradeCalculator.tsx   # Individual grade calculation
│   ├── LoginModal.tsx        # Firebase authentication
│   ├── TutorialModal.tsx     # Onboarding help
│   ├── PrintGradesModal.tsx  # Print/export functionality
│   ├── PrintPreview.tsx      # Print preview component
│   ├── PrintStyles.css       # Print-specific styles
│   └── UpdateModal.tsx       # Version update notification
└── config/               # Firebase configuration & service setup
    ├── analytics.ts
    ├── firebase.ts           # Firebase app initialization
    ├── firestore.ts          # Firestore database service
    └── storage.ts            # Firebase Cloud Storage service
```

### Data Flow
1. User authenticates via Firebase Auth (`LoginModal.tsx`)
2. Data stored in Firestore (`firestore.ts` config)
3. `App.tsx` manages which tab/component renders
4. Calculation components (GPA, CGPA, projections) manage their own state
5. Firebase config (`firebase.ts`) initializes app, exports database/auth instances

### Key Patterns
- Modal state lifted to `App.tsx`, triggered from various components
- Tab-based navigation (`TabNavigation.tsx`) renders calculator views
- Firebase services are configured once and imported where needed
- TypeScript types defined in `src/types.ts` and shared across components

### Development Commands
```bash
npm run dev      # Start Vite dev server
npm run build    # Type check + production build
npm run lint     # Run ESLint
npm run preview  # Preview production build locally
```
