# Solar Sales AI Trainer - Implementation Plan

## Overview
A **mobile-first React PWA** that runs in any browser and can be installed as an app on phones, tablets, or Windows desktops. No native app packaging needed -- reps open a URL and start training.

**Stack:** Vite + React + TypeScript + Tailwind CSS + shadcn/ui (single app), FastAPI backend (Python), Claude 3.5 Sonnet (LLM), ElevenLabs (TTS), Whisper (STT)

**Why PWA over native:** Reps are in the field on mixed devices. A PWA installs from the browser, works offline for cached content, and avoids app store friction. On Windows it installs as a desktop app via Chrome/Edge.

---

## Architecture: Simplified Monorepo

```
solar-trainer/
├── frontend/                       # React PWA (Vite)
│   ├── public/
│   │   ├── manifest.json           # PWA manifest
│   │   ├── sw.js                   # Service worker (offline shell)
│   │   └── icons/                  # App icons (192, 512)
│   ├── src/
│   │   ├── main.tsx                # App entry
│   │   ├── App.tsx                 # Router + bottom nav shell
│   │   ├── components/
│   │   │   ├── ui/                 # shadcn/ui primitives
│   │   │   ├── layout/
│   │   │   │   ├── BottomNav.tsx   # Mobile bottom tab bar
│   │   │   │   ├── AppShell.tsx    # Safe-area wrapper, status bar
│   │   │   │   └── PageHeader.tsx  # Sticky top header
│   │   │   ├── script-test/
│   │   │   │   ├── ScriptUploader.tsx
│   │   │   │   ├── RecordingPanel.tsx
│   │   │   │   ├── TranscriptDiff.tsx
│   │   │   │   └── AccuracyScore.tsx
│   │   │   ├── roleplay/
│   │   │   │   ├── DifficultySelect.tsx
│   │   │   │   ├── VoiceSelect.tsx
│   │   │   │   ├── ConversationView.tsx
│   │   │   │   └── AudioControls.tsx
│   │   │   └── assessment/
│   │   │       ├── GradeCard.tsx
│   │   │       ├── CriteriaBreakdown.tsx
│   │   │       └── TipsPanel.tsx
│   │   ├── lib/
│   │   │   ├── api.ts              # Fetch wrapper for backend
│   │   │   ├── audio.ts            # MediaRecorder + AudioContext helpers
│   │   │   └── state-machine.ts    # XState conversation machine
│   │   ├── hooks/
│   │   │   ├── useAudioRecorder.ts
│   │   │   ├── useConversation.ts
│   │   │   └── useScriptTest.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── pages/
│   │       ├── ScriptMaster.tsx    # Tab 1: Script testing
│   │       ├── RolePlay.tsx        # Tab 2: Voice role-play
│   │       ├── History.tsx         # Tab 3: Past sessions & scores
│   │       └── Assessment.tsx      # Post-session results (navigated to)
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── vite.config.ts
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI entry + CORS
│   │   ├── config.py               # Env vars, API keys
│   │   ├── routers/
│   │   │   ├── scripts.py          # Script CRUD
│   │   │   ├── transcription.py    # Whisper STT
│   │   │   ├── roleplay.py         # Role-play sessions + WebSocket
│   │   │   └── assessment.py       # Grading endpoints
│   │   ├── services/
│   │   │   ├── llm.py              # Claude API
│   │   │   ├── stt.py              # Whisper transcription
│   │   │   ├── tts.py              # ElevenLabs synthesis
│   │   │   ├── script_grader.py    # Fuzzy + semantic grading
│   │   │   └── objections.py       # Objection bank logic
│   │   ├── models/
│   │   │   ├── script.py
│   │   │   ├── session.py
│   │   │   └── assessment.py
│   │   └── data/
│   │       └── objections.json
│   ├── requirements.txt
│   └── tests/
│       ├── test_script_grader.py
│       └── test_roleplay.py
└── plan.md
```

---

## UI/UX: Mobile-First Design

### Navigation: Bottom Tab Bar (3 tabs)
```
┌─────────────────────────────┐
│  [Page Header]              │
│                             │
│                             │
│  [Page Content]             │
│                             │
│                             │
├─────────────────────────────┤
│ 📝 Script  │ 🎙 Train  │ 📊 History │
└─────────────────────────────┘
```

### Design Principles
- **Touch targets:** Min 44px tap areas, generous spacing
- **Thumb zone:** Primary actions at bottom of screen
- **Safe areas:** Respect notches, home indicators via `env(safe-area-inset-*)`
- **No sidebar:** Bottom nav only -- sidebars are desktop patterns
- **Large type:** 16px minimum body text, no pinch-to-zoom needed
- **Dark mode:** Default dark theme (easier on eyes during long practice sessions)
- **On desktop/Windows:** Bottom nav stays, content area widens, max-width container centers

### Key Screens (Mobile)
1. **Script Master** - Upload script -> Record yourself -> See accuracy score + diff
2. **Train (Role-Play)** - Pick difficulty -> Pick voice -> Big mic button -> Live conversation
3. **History** - Card list of past sessions with grades, tap to see full assessment
4. **Assessment** (navigated from Train or History) - Grade card + criteria breakdown + tips

### PWA Features
- `manifest.json` with `display: "standalone"` -- feels like a native app
- Service worker caches the app shell for instant load
- "Add to Home Screen" prompt on mobile
- On Windows: installable via Edge/Chrome -> appears in Start Menu

---

## Phase 1: Project Scaffolding & Script Test MVP

### 1.1 Setup
- [ ] **Scaffold frontend** - `npm create vite@latest` + React + TS + Tailwind + shadcn/ui
- [ ] **PWA setup** - manifest.json, service worker, app icons, meta viewport tags
- [ ] **Mobile shell** - AppShell with safe-area padding, BottomNav with 3 tabs, React Router
- [ ] **Scaffold backend** - FastAPI with CORS allowing frontend origin
- [ ] **Dark theme** - Tailwind dark mode as default, shadcn dark palette

### 1.2 Script Test Module (MVP)
- [ ] **Script upload endpoint** - `POST /api/scripts` accepts text/file, stores golden script
- [ ] **Audio recording hook** - `useAudioRecorder` using MediaRecorder API (WebM opus)
- [ ] **Whisper transcription endpoint** - `POST /api/transcribe` -> returns transcript
- [ ] **Script grading service** - rapidfuzz token similarity + Claude semantic pass
- [ ] **ScriptUploader component** - Textarea/file-drop to paste or upload golden script
- [ ] **RecordingPanel component** - Big mic button, recording timer, waveform
- [ ] **TranscriptDiff component** - Scrollable diff: green = matched, red = missed/wrong
- [ ] **AccuracyScore component** - Circular progress gauge + keyword callouts
- [ ] **ScriptMaster page** - Full mobile screen composing the above components
- [ ] **End-to-end wiring** - Record -> transcribe -> grade -> display

---

## Phase 2: Voice Role-Play Engine

### 2.1 Objection Bank (15 objections, 3 tiers)
| # | Objection | Tier |
|---|-----------|------|
| 1 | "I need to talk to my spouse first." | Easy |
| 2 | "We're thinking about moving soon." | Easy |
| 3 | "My electricity bill isn't that high." | Easy |
| 4 | "What happens when it's cloudy or at night?" | Easy |
| 5 | "I heard solar panels ruin your roof." | Medium |
| 6 | "I don't trust solar companies." | Medium |
| 7 | "We already got a quote and it was too expensive." | Medium |
| 8 | "I'm locked into a contract with my utility." | Medium |
| 9 | "I'm worried about maintenance costs." | Medium |
| 10 | "We're only renting this place." | Medium |
| 11 | "The technology keeps getting better, I'll wait." | Hard |
| 12 | "I'm filing for bankruptcy / have bad credit." | Hard |
| 13 | "My HOA won't allow it." | Hard |
| 14 | "I've read about solar panels catching fire." | Hard |
| 15 | "I just want the free quote, I'm not buying today." | Hard |

### 2.2 AI Personalities (5 Voices)
1. **Skeptical Steve** - Doubtful, needs data and proof
2. **Busy Barbara** - Impatient, wants the bottom line fast
3. **Friendly Frank** - Agreeable but won't commit, hard to close
4. **Hostile Helen** - Confrontational, bad past experience
5. **Analytical Alex** - Engineer, wants specs and ROI numbers

### 2.3 Tasks
- [ ] **XState conversation machine** - idle -> selecting -> in-session -> paused -> ended
- [ ] **Claude system prompts** - Per-personality prompts with difficulty-scaled objection logic
- [ ] **ElevenLabs TTS service** - 5 voice IDs mapped to personalities
- [ ] **WebSocket endpoint** - `WS /api/roleplay/stream` for real-time audio exchange
- [ ] **Audio pipeline** - Mic -> Whisper -> Claude -> ElevenLabs -> Speaker (target <2s)
- [ ] **DifficultySelect** - 3 big tap-friendly cards: Easy / Medium / Hard
- [ ] **VoiceSelect** - Personality cards with name, description, preview button
- [ ] **ConversationView** - Chat-bubble transcript with speaker labels
- [ ] **AudioControls** - Floating bottom bar: mute, pause, end session
- [ ] **Training flow** - Difficulty -> Voice -> 3-2-1 countdown -> Live session
- [ ] **Context management** - Full conversation history maintained across turns

---

## Phase 3: Post-Session Assessment

### 3.1 Grading Criteria
| Criteria | Weight | Evaluates |
|----------|--------|-----------|
| Empathy | 25% | Listening, acknowledging concerns, rapport |
| Objection Handling | 30% | Direct responses, proper rebuttals |
| Closing Skills | 25% | Asked for the sale, urgency, next steps |
| Script Adherence | 20% | On message, hit key talking points |

### 3.2 Tasks
- [ ] **Assessment prompt** - Claude evaluates full transcript against criteria
- [ ] **Assessment endpoint** - `POST /api/assess` -> structured grade JSON
- [ ] **GradeCard** - Big letter grade (A-F), color-coded, centered on screen
- [ ] **CriteriaBreakdown** - 4 horizontal bars with scores and short explanations
- [ ] **TipsPanel** - 3 numbered actionable tips in card format
- [ ] **Assessment page** - Scrollable mobile view: grade -> breakdown -> tips

---

## Phase 4: History, Polish & Install

- [ ] **History page** - Card list of past sessions, date/grade/personality, tap for details
- [ ] **Local storage** - Save session history to localStorage (no DB needed for MVP)
- [ ] **Loading states** - Skeleton screens, pulse animations during transcription
- [ ] **Error handling** - Toast notifications for mic permission, network errors
- [ ] **Install prompt** - "Add to Home Screen" banner for first-time mobile visitors
- [ ] **Windows install** - Test Edge/Chrome PWA install, verify Start Menu shortcut
- [ ] **Audio latency tuning** - Chunk streaming, WebSocket buffer optimization
- [ ] **Viewport testing** - Test on iPhone SE (small), iPhone 15, iPad, desktop

---

## Key Technical Decisions

1. **PWA over native:** One codebase, works everywhere. URL-based distribution, no app store needed. Installable on Windows via Edge/Chrome.
2. **Bottom nav over sidebar:** Mobile-first pattern. 3 tabs keeps it simple. On desktop the layout just widens.
3. **XState for conversation:** Prevents lost context, handles edge cases (mic disconnects, network drops, user pauses).
4. **Audio pipeline:** Browser MediaRecorder -> WebSocket -> Whisper -> Claude -> ElevenLabs -> WebSocket -> AudioContext. Target <2s round-trip.
5. **Script grading:** Two-pass -- rapidfuzz for mechanical %, Claude for semantic analysis.
6. **Dark mode default:** Reps train in cars, offices, evenings. Dark is easier on eyes.
7. **localStorage for MVP:** No user accounts or DB yet. Session history stays on-device.

---

## API Keys Required
- **Anthropic** - Claude 3.5 Sonnet (LLM for role-play + grading)
- **ElevenLabs** - Text-to-speech (5 distinct voices)
- **OpenAI** - Whisper API (speech-to-text) -- or local whisper.cpp to save costs

## Build Order
```
Phase 1: Scaffold + Script Test MVP
    ↓
Phase 2: Voice Role-Play Engine
    ↓
Phase 3: Post-Session Assessment
    ↓
Phase 4: History, Polish, PWA Install
```
