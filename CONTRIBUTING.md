# Contributor's Guide: React Web Frontend

Welcome to the frontend contributor guidelines for the Guidance System. To ensure
visual consistency, performance, and clean code, please follow these rules.

## 1. Project Structure

We follow a modular structure. Features are placed in the `src/features/` folder.

- **`components/`**: Place only truly global, reusable UI components here.
- **`features/`**: Group page components, forms, and custom state hooks by
  logical domain slices (e.g. `appointments`, `auth`, `slips`).
- **`services/`**: All HTTP client actions and endpoints must be kept here using
  Axios, rather than making inline fetch requests in UI code.

## 2. Strict Coding Standards

### 80-Character Line Limit
No line of JavaScript, TypeScript, JSX, or TSX code should exceed 80 characters.
If tag attributes, functions, or imports are too long, break them onto new
lines.

### Structured Error Logging
Use the following format for all caught errors:
`[Feature/Component/Hook] {Exact Step}: error message`
- Example: `[AppointmentForm] {Submit Handler}: Failed to submit request`

### Typescript Constraints
- Avoid using `any`. Write explicit interfaces and types for props, state,
  and API responses.
- Respect TypeScript compile options and lint rules. Run `npm run lint` before
  committing code.

### Brutal DRY (Don't Repeat Yourself)
- Do not repeat inline Tailwind classes for customized items; extract them into
  components or global styles.
- Do not duplicate data-fetching hooks or utility methods. Abstract common
  patterns into React Hooks under `src/hooks/` or services under `src/services/`.
- UI layouts must feel premium, using transitions, clean HSL variables, and
  consistent spacing. Avoid ad-hoc values.
