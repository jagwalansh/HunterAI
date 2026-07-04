# Hunter AI

A career intelligence platform that transforms resumes into living skill profiles, ranked role matches, and clearer applications in real time.

## Stack

| Layer | Technology |
|-------|------------|
| **Framework** | React 19 |
| **Language** | TypeScript |
| **Build Tool** | Vite 8 |
| **Styling** | Tailwind CSS v4 (with custom design system) |
| **Animation** | GSAP 3 + ScrollTrigger |
| **Linting** | ESLint 10 + TypeScript ESLint |
| **Package Manager** | npm |

## Project Structure

```
src/
├── App.tsx              # Main application with all sections
├── main.tsx             # Entry point
├── index.css            # Tailwind v4 + custom design tokens & utilities
├── assets/              # Static assets
└── vite-env.d.ts        # Vite types
```

## Design System

Custom CSS variables defined in `src/index.css`:

```css
:root {
  --paper: #e9e9e9;
  --silver: #b7b7b7;
  --stone: #8f8f8d;
  --charcoal: #535351;
  --black: #050505;
  --white: #fbfbfa;
  --line: rgba(5, 5, 5, 0.1);
  --muted: rgba(5, 5, 5, 0.52);
}
```

- **Typography**: Outfit / Avenir Next system stack
- **Motion**: GSAP context + ScrollTrigger for scroll-linked animations
- **Reduced motion**: Respects `prefers-reduced-motion`

## Key Features

- **Animated workflow visualization** — SVG path drawing + scroll progress
- **Interactive skill graph** — Floating nodes with real-time line sync
- **Glass-morphism dashboard mock** — Backdrop filter panels
- **Staggered entrance animations** — GSAP timelines
- **Scroll-triggered reveals** — IntersectionObserver + GSAP

## Scripts

```bash
npm run dev      # Start dev server
npm run build    # Type-check + production build
npm run lint     # ESLint
npm run preview  # Preview production build
```

## Getting Started

```bash
git clone https://github.com/jagwalansh/ui-hunter-ai.git
cd ui-hunter-ai
npm install
npm run dev
```

## Deployment

The `dist/` folder is production-ready after `npm run build`. Deploy to any static host (Vercel, Netlify, Cloudflare Pages, etc.).