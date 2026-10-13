# Marwan El Nabawy: portfolio site

Milestones **M0 to M4** (foundation, 3D journey, zoom-in system, finale and cost strip, AI layer) of the master plan in `docs/PORTFOLIO_PLAN.md`. That document is the source of truth: read its section 0 (truth rules) before changing anything.

## Run it
```bash
npm install
npm run dev                  # 3D journey on capable desktops, plain "fast path" page elsewhere (English and Arabic)
npm run layout:graphs        # recompute the system-view layouts (run after editing a view's nodes or edges; build does it for you)
npm run validate:content     # content rules, flow and layout checks (warns about unreviewed Arabic)
npm run validate:content:prod  # launch gate: also fails on unreviewed Arabic
npm run typecheck
npm test
npm run eval:agent           # live golden tests for the AI agent (needs GROQ_API_KEY; uses a few thousand tokens)
npm run build                # validate + typecheck + bundle
```

## Layout
```
src/content/   layouts.generated.ts (generated), types.ts, site.ts, rootx.ts, intelliroom.ts, mari.ts, shorts-maker.ts, selectors.ts  (single source of truth)
src/scene/     chapters, scroll math, camera path, six station objects, capability detection, the 3D scene
src/views/     plain page, journey overlays, the zoom overlay, the animated system graph and its geometry
src/state/     shared store (language, mode, active chapter, panel)
src/i18n/      UI strings (English and Arabic)
src/styles/    design tokens and global styles
api/           agent.ts and recruiter.ts (Web-standard handlers)
api/_lib/      confidentiality.ts (the only content the AI may see), prompt.ts, tools.ts (whitelist), limits.ts, store.ts, handlers.ts, recruiter.ts
src/agent/     client, tool runner, one-page summary, shared types
scripts/       validate-content.ts, layout-graphs.ts (build-time graph layout with dagre)
tests/         validator, truth rules, agent payload, render smoke test
docs/          PORTFOLIO_PLAN.md
```

## Rules to keep (from the plan)
- Every string is `Localized` (`en`, `ar`, `arReviewed`). Marwan reviews all Arabic; production validation fails until he does.
- IntelliRoom is a team project of 7. Marwan built the planner environment, UI, security and auth, storage, and the fair GPU job queue; teammates built the AI and the rest of the website. Views carry a `credit`.
- Links with `verified: false`, costs with `confirmed: false`, and credits with `verified: false` are never rendered.
- No phone numbers or third-party emails anywhere (validator enforces it).
- Mari shows fictional data only and carries the Riot Games non-affiliation disclaimer.

## AI layer setup
The agent and recruiter mode run on **Qwen 3.8 27B through Groq's OpenAI-compatible API** (`qwen/qwen3.8-27b`, a *preview* model: check console.groq.com/docs/models, since preview models can change or be retired).
1. Copy `.env.example` to `.env.local` and set `GROQ_API_KEY` (create one at console.groq.com/keys). Check the model name and the prices in `.env.example`, and set `DAILY_SPEND_CAP_USD`.
2. `npm run dev` serves `/api/agent` and `/api/recruiter` locally through the same handlers production uses.
3. For production, deploy on Vercel with the same environment variables, and add Upstash/Vercel KV credentials so rate limits and the spend cap are shared across server instances (without them, counters live in each instance's memory).
4. Confirm the handler format (Web-standard `Request`/`Response` named exports) against Vercel's current docs.
5. Run `npm run eval:agent` once the key is set; it must pass before launch. Without a key, or when the cap is reached, the agent shows a friendly message and recruiter mode falls back to keyword matching, so the rest of the site always works.
6. To use another OpenAI-compatible provider, set `LLM_BASE_URL`, `LLM_API_KEY` and the model variables.

## The personality
`src/content/persona.ts` is the voice of the AI version of Marwan: tone dials, beliefs, phrases, and example answers in English and Arabic. Edit it, then run `npm test` (the validator checks that the examples contain no numbers, no claim of the teammates' AI work, and no avoided phrases). The persona is a voice, never a source of facts.

## Checking the journey
No browser was available while building M1 and M2, so the 3D scene and the zoom-in have not been looked at. Run `npm run dev` and check: smooth scrolling along the path, readable stations, the dwell at each chapter, keyboard keys (arrows, 1 to 6), the "Dive in" zoom (camera push, the station dissolving into points, the graph appearing, closing it again with Escape or the button, and whether the points land near the nodes), the flow player and node details, the detail panel for Me and Education, the fast path toggle, Arabic with right-to-left layout, and a phone (it should open on the plain page).

## Next
post-processing polish (depth of field, grain), M3 remaining chapter polish, M4 AI layer, M5 terminal and Arabic review, M6 performance and accessibility, M7 launch (see plan section 11 and the blockers in section 13).
