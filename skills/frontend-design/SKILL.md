---
name: frontend-design
description: Use when working in frontend/ or building, styling, redesigning, or reviewing any user-facing UI. Provides Anthropic frontend-design-inspired guidance for distinctive, production-quality React UI without generic AI aesthetics.
---

# Frontend Design Skill

Use this skill for any task that changes `frontend/`, creates UI components, styles screens, designs flows, or reviews visual quality.

## Load First

Before editing UI, read:

- `context/project-overview.md`
- `context/ui-context.md`
- `context/code-standards.md`

If those files still contain placeholders, infer a practical direction from the user request and update the context only when the user asks for durable documentation.

## Design Intent

Before writing code, decide the interface's purpose, primary user, and visual point of view.

Pick one clear aesthetic direction and carry it through the whole screen. Examples:

- `technical-lab`: dense, precise, data-forward, calm surfaces, sharp hierarchy.
- `clinical-trust`: clean, accessible, high clarity, restrained color, strong status states.
- `editorial-product`: strong typography, composed sections, confident visual rhythm.
- `playful-hackathon`: energetic, memorable, but still usable and readable.
- `industrial-utility`: compact controls, visible structure, direct workflows.

Do not drift between styles in the same page.

## Avoid Generic AI UI

Avoid default-looking compositions unless the product explicitly calls for them.

- No vague purple/blue gradient hero as the main design idea.
- No decorative blobs, random glassmorphism, or card grids used as filler.
- No oversized marketing landing page when the user asked for an app or tool.
- No generic stock imagery that does not show the actual product, state, workflow, or data.
- No hardcoded color sprawl. Use tokens from `context/ui-context.md` or define a small token set first.
- No text explaining how to use the UI inside the UI unless it is real product copy.

## Implementation Defaults

When the frontend stack is not established yet:

- Prefer React + TypeScript.
- Prefer Tailwind CSS or CSS modules, but follow the existing project if present.
- Prefer componentized UI with small, named components.
- Prefer `lucide-react` icons if an icon library is needed.
- Keep app state local until shared state is actually required.
- Validate external API data at the boundary before rendering it.

When a stack already exists, follow it instead of introducing a new framework.

## Layout Rules

- Build the actual usable screen first, not a marketing shell.
- Make the first viewport immediately show the product's core workflow.
- Use responsive layout constraints: `minmax`, `clamp` only for spacing/layout, stable grid tracks, fixed control sizes, and sensible max widths.
- Keep cards for repeated items, modals, and genuinely framed tools. Do not put cards inside cards.
- Match heading size to context. Large display type belongs in true hero moments only.
- Make empty, loading, error, and success states look intentional.

## Visual System

- Define or reuse CSS variables for background, surface, text, muted text, accent, border, error, success, and warning.
- Use color to communicate hierarchy and state, not decoration alone.
- Use 1-2 typefaces max. Avoid default system font choices when creating a distinctive marketing or product experience.
- Use consistent spacing, radius, border, and shadow scales.
- Keep letter spacing at `0` unless a specific display treatment needs it.
- Use motion only to clarify transitions, feedback, or spatial changes.

## Accessibility

- Every interactive element must have a visible focus state.
- Buttons and links must have accessible names.
- Maintain readable contrast for text, icons, borders, and state colors.
- Use semantic HTML before ARIA.
- Preserve keyboard navigation for menus, dialogs, forms, and toolbars.
- Do not rely on color alone for errors, status, or selected states.

## API Integration Expectations

The backend is expected to be FastAPI unless the repo proves otherwise.

- Keep API client functions separate from UI components.
- Centralize backend base URL configuration.
- Handle loading, empty, validation, and failure states for every request.
- Do not assume response shapes. Type them and validate where practical.
- Keep user-facing errors specific enough to act on, but do not expose internals.

## Review Checklist

Before calling frontend work done:

- Run the relevant build/typecheck/lint command if available.
- Open the UI in a browser if a dev server exists.
- Check at least desktop and mobile widths.
- Confirm there is no overlapping text, clipped buttons, or layout shift from hover/loading states.
- Confirm forms, buttons, navigation, and API-backed states behave correctly.
- Confirm the result has a deliberate visual direction rather than default framework styling.
