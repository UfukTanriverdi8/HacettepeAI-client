# Hacettepe AI Chatbot - Project Context

## Project Overview
Single-page React chatbot application for Hacettepe University AI assistant.
Built with Vite + React 18 + Tailwind CSS. Deployed on Digital Ocean.

## Architecture

### Component Tree
```
App.jsx                         # Root: global state, layout
├── Header.jsx                  # Branding, language toggle, API version toggle
├── ChatConversations.jsx       # Scrollable message list container
│   └── ChatMessage.jsx         # Individual message bubble + typewriter effect
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
- `apiVersion` — `'v1' | 'v2'` (persisted)
- `openModal` — boolean

**Message object shape:**
```js
{
  sender: 'Human' | 'AI',
  message: string,
  isPlaceholder?: boolean,   // true while API is loading
  skipTypewriter?: boolean,  // skip animation for history messages and real API responses
  id?: number,               // used to replace placeholder with real response
  timestamp?: string         // v2 only — used to send feedback for a specific message
}
```

## API Integration (ChatInput.jsx)

### V2 API (default, stateful)
- Env var: `VITE_V2_API_URL`, `VITE_V2_API_KEY`
- Backend: AWS Lambda
- Chat request: `{ prompt, session_id? }`
- Chat response: `{ response, session_id, timestamp }`
- Feedback request: `{ action: 'feedback', session_id, timestamp, feedback_value: 'Positive' | 'Negative' }`
- Session stored in `localStorage` as `v2_session_id`

### V1 API (legacy, stateless)
- Env var: `VITE_API_URL`, `VITE_API_KEY`
- Request: `{ query, college_name: "hacettepe", lang, context }`
- Response: `{ response: { output: { text } } }`

**API call flow:**
1. Add human message to history
2. Add placeholder message with unique ID (cycling animated loading messages)
3. Fetch from selected API
4. Replace placeholder with real response using ID (`skipTypewriter: true` — instant display)
5. Store `session_id` and `timestamp` (v2 only)

**Constraints:** Max 30 messages. Session cleared on language or version switch.

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
| `react-icons` | UI icons (FaUser, FaTrash, FaArrow, etc.) |
| `react-toastify` | Toast notifications |
| Vite | Build tool + dev server |

## Environment Variables
```
VITE_API_KEY
VITE_API_URL
VITE_V2_API_URL
VITE_V2_API_KEY
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
- Feedback buttons (thumbs up/down) shown on v2 AI messages after typing completes, only when `timestamp` is present
- `GiDeerHead` icon (react-icons/gi) used as AI avatar; `FaThumbsUp`/`FaThumbsDown` for feedback
- `dangerouslySetInnerHTML` used only in `InfoModal.jsx` for controlled bilingual HTML content
- No routing — single view SPA
- Language switch clears chat history (with confirmation dialog)
