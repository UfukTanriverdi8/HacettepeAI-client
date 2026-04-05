# Hacettepe AI Chatbot - Project Context

## Project Overview
Single-page React chatbot application for Hacettepe University AI assistant.
Built with Vite + React 18 + Tailwind CSS. Deployed on Digital Ocean.

## Architecture

### Component Tree
```
App.jsx                         # Root: global state, layout
├── Header.jsx                  # Branding, language toggle
├── ChatConversations.jsx       # Scrollable message list container
│   └── ChatMessage.jsx         # Individual message bubble + typewriter effect
│       └── FeedbackModal.jsx   # 5-star feedback modal (shown per AI message)
├── ChatInput.jsx               # Input field, send/clear, API calls
├── Footer.jsx                  # Social links, info button
└── InfoModal.jsx               # Project info popup
```

`Chatbot.jsx` is a legacy/unused component.

## State Management
No external state library — all prop-drilled from `App.jsx` with `localStorage` persistence.

**App.jsx global state:**
- `chatHistory` — array of message objects (persisted to localStorage)
- `language` — `'EN' | 'TR'` (persisted)
- `openModal` — boolean

**Message object shape:**
```js
{
  sender: 'Human' | 'AI',
  message: string,
  isPlaceholder?: boolean,   // true while API is loading
  skipTypewriter?: boolean,  // skip animation for history messages and real API responses
  id?: number,               // used to replace placeholder with real response
  timestamp?: string,        // ISO string — present on all AI responses, used to gate feedback button
  question?: string          // the user's original question — stored for feedback POST body
}
```

## API Integration (ChatInput.jsx)

Backend is selected at build time via `VITE_ACTIVE_BACKEND` env var. No UI toggle exists.

### Institutional backend (default, `VITE_ACTIVE_BACKEND=institutional`)
- Env var: `VITE_INSTITUTIONAL_API_URL`, `VITE_INSTITUTIONAL_API_KEY`
- Backend: AWS API Gateway → AWS Bedrock Flow (multi-agent)
- Chat request: `POST /student` `{ question }`
- Chat response: triple-nested JSON — unwrap: `data.result.body` → `result.body` → `responses[agentKey]`
- Feedback request: `POST /student/feedback` `{ question, answer, rating, comment }` (backend TBD)
- Timestamp: client-generated ISO string (no session management)

### Tunca-hoca backend (fallback, `VITE_ACTIVE_BACKEND=tunca-hoca`)
- Env var: `VITE_TUNCA_API_URL`, `VITE_TUNCA_API_KEY`
- Backend: AWS Lambda
- Chat request: `{ prompt, session_id? }`
- Chat response: `{ response, session_id, timestamp }`
- Feedback request: `{ action: 'feedback', session_id, timestamp, feedback_value: 'Positive' | 'Negative' }` (stars ≥3 → Positive)
- Session stored in `localStorage` as `v2_session_id`

**API call flow:**
1. Add human message to history
2. Add placeholder message with unique ID (cycling animated loading messages)
3. Fetch from active backend
4. Replace placeholder with real response (`skipTypewriter: true` — instant display)
5. Store `timestamp` and `question` on the AI message for feedback

**Constraints:** Max 30 messages. Session cleared on language switch.

## Feedback System (FeedbackModal.jsx)

- Triggered by "💬 Geri bildirimde bulun" button shown on AI messages after typing completes
- Requires `timestamp` to be present on the message
- Hidden after submission (`feedbackSubmitted` state in ChatMessage)
- Modal contains:
  - 5-star rating with half-star support (0.5 increments via left/right half-hover)
  - Optional comment textarea
  - Bilingual TR/EN labels
- Posts to institutional or tunca-hoca feedback endpoint based on `VITE_ACTIVE_BACKEND`

## Styling
- Tailwind CSS v3 with custom colors in `tailwind.config.js`:
  - `primary`: `#1e2729` (dark bg)
  - `secondary`: `#b72e2e` (brand red)
  - `tertiary`: `#EDF2F4` (light gray)
- Custom CSS in `index.css`: `.scrollable`, `.scroll-container`, `.custom-toast`
- Responsive breakpoints: `sm:`, `md:` via Tailwind

## Key Libraries
| Library | Purpose |
|---|---|
| `react-markdown` + `remark-gfm` | Render AI responses as Markdown |
| `typewriter-effect` | Animated title in Header |
| `react-icons` | UI icons (FaUser, FaStar, FaStarHalfStroke, GiDeerHead, etc.) |
| `react-toastify` | Toast notifications |
| Vite | Build tool + dev server |

## Environment Variables
```
VITE_INSTITUTIONAL_API_URL    # active backend (default)
VITE_INSTITUTIONAL_API_KEY
VITE_TUNCA_API_URL            # fallback backend
VITE_TUNCA_API_KEY
VITE_ACTIVE_BACKEND           # 'institutional' | 'tunca-hoca'
```
All API keys/URLs are env-var only — never hardcoded.

## Dev Commands
```bash
npm run dev      # start dev server
npm run build    # production build
npm run preview  # preview production build
npm run lint     # ESLint
```

## Notable Conventions
- All components are functional with hooks
- Typewriter animation:
  - **Placeholder**: cycles through `LOADING_MESSAGES` (Turkish strings) at 45ms/char, 220ms for dots, 700ms pause between messages
  - **Real AI responses**: instant display (`skipTypewriter: true` set by `ChatInput`)
  - **Greeting / initial messages** (no `skipTypewriter`): 25ms/char one-shot typewriter
  - **History on load**: instant display (`skipTypewriter: true` set by `App.jsx`)
- Feedback button shown on AI messages after typing completes, only when `timestamp` is present
- `GiDeerHead` icon (react-icons/gi) used as AI avatar; `FaStar`/`FaStarHalfStroke` for feedback rating
- `dangerouslySetInnerHTML` used only in `InfoModal.jsx` for controlled bilingual HTML content
- No routing — single view SPA
- Language switch clears chat history (with confirmation dialog)
