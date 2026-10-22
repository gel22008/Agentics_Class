# + Math Practice

A child-friendly math practice web app for ages 7–12. Kids practice addition, subtraction,
multiplication and division with flip cards, track their progress, and get extra practice on the
facts they miss.

Built with **React + TypeScript + Vite**. All data is saved in the browser's local storage: no
account, no server, and no personal information is collected. Clearing your browser data removes
your progress.

## Features

- **Practice setup:** pick one or more operations, a difficulty (Beginner, Easy, Intermediate,
  Advanced) and a session length (5, 10, 20 or continuous).
- **Flip cards:** four multiple-choice answers (number keys 1–4 work), a Flip Card button, the
  correct answer and a plain-language explanation on the back, and "I Got It Right / I Got It
  Wrong" self-reporting with gentle red/green "recheck" nudges.
- **Session summary:** attempted, correct, incorrect and accuracy.
- **Statistics:** overall, by operation, by difficulty, most missed operation and number facts,
  and recent sessions, with Reset Statistics (keeps settings).
- **Settings:** sound effects, card animation, explanations, encouraging feedback, mastery
  threshold, practice defaults, and Clear All Application Data.
- **Mistake review:** missed facts are tracked and practiced with similar questions until mastered.
- Keyboard accessible, screen-reader labels, reduced-motion support and responsive layout.

## Requirements

- [Node.js](https://nodejs.org/) 20 or newer (22 recommended) and npm.

## Run locally

```bash
cd math-practice-app
npm install
npm run dev
```

Then open the address it prints (usually http://localhost:5173).

## Scripts

| Command              | What it does                                          |
| -------------------- | ----------------------------------------------------- |
| `npm run dev`        | Start the development server with live reload         |
| `npm test`           | Run all unit and component tests once (Vitest)        |
| `npm run test:watch` | Re-run tests automatically when files change          |
| `npm run lint`       | Check the code with ESLint                            |
| `npm run format`     | Format the code with Prettier                         |
| `npm run build`      | Type-check and create the production build in `dist/` |
| `npm run preview`    | Serve the production build locally to test it         |

## Build and deploy

```bash
npm run build
npm run preview   # check the production build at the printed address
```

The app is deployed on **Netlify**. The `netlify.toml` file in the repository root tells Netlify to
build from the `math-practice-app` folder (`npm run build`), publish `dist`, and send every route
to `index.html` so links like `/statistics` work after a refresh.

## Project structure

```
src/
├── components/   Reusable UI (header, nav, flip card, selectors, dialogs, …)
├── pages/        One component per route (home, setup, session, summary, statistics, settings)
├── services/     Question generation, answer choices, storage, statistics, mistake tracking
├── hooks/        Settings context and hooks
├── utils/        Small helpers (random numbers, difficulty rules, validation, formatting)
└── types/        Shared TypeScript types
```

## Known limitations

- **Browser Back button during a session is not guarded.** The "Leave this practice session?"
  prompt only appears for the app's own links (nav bar and title). Pressing the browser's Back
  button leaves without asking. No progress is lost: the session is saved after every answer and
  shows as "Not finished" in Recent Sessions.
- **No warning when refreshing or closing the tab.** The app does not use the browser's
  `beforeunload` "Leave site?" box, because its wording can't be changed and can confuse
  children. Instead, every answer is saved immediately and a refresh restores the session.
- **A refresh restores the same card, but unflipped.** The question and progress come back; an
  answer that was selected but not yet reported is not remembered. Answers are never counted twice.
- **Refreshing during the short pause after the last answer starts a new session.** The finished
  session is already saved (it appears in Statistics), but the page does not jump to the summary.
- **Very long histories:** only the newest 5,000 answers are kept, so overall statistics cover
  those answers only.

See `TODO.md` for the implementation checklist, progress and deferred items.
