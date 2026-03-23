<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/Zustand-5-433E38?style=for-the-badge&logo=zustand&logoColor=white" />
</p>

# Stocka Client

Frontend application for the Stocka inventory management system — a multi-tenant platform designed for small businesses in Mexico.

---

## Features

- **Authentication** — Login, registration, session persistence, and logout
- **Internationalization** — English and Spanish with automatic browser language detection
- **Responsive Design** — Mobile-first approach with Tailwind CSS
- **Form Validation** — Real-time validation with Zod schemas + React Hook Form
- **Component Library** — shadcn/ui base with custom Stocka design tokens
- **State Management** — Zustand stores per feature module
- **Dark Mode** — Theme support with CSS custom properties

---

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | React 19 + TypeScript |
| **Build Tool** | Vite 6 |
| **Routing** | React Router v6 |
| **Styling** | Tailwind CSS 4 + shadcn/ui |
| **Forms** | React Hook Form + Zod |
| **State** | Zustand |
| **i18n** | react-i18next (EN/ES) |
| **HTTP Client** | Axios |
| **Icons** | lucide-react |

---

## Project Structure

```
src/
├── app/                        # Application setup
│   ├── App.tsx                 # Root component
│   ├── router.tsx              # Route configuration
│   └── providers.tsx           # Context providers
│
├── features/                   # Feature-based modules
│   ├── auth/                   # Authentication feature
│   │   ├── api/                # API calls
│   │   ├── components/         # Feature-specific components
│   │   ├── pages/              # Page components
│   │   ├── hooks/              # Custom hooks
│   │   ├── store/              # Zustand store
│   │   ├── types/              # TypeScript types
│   │   └── schemas/            # Zod validation schemas
│   │
│   └── dashboard/              # Dashboard feature
│
├── shared/                     # Shared code
│   ├── components/ui/          # shadcn/ui components
│   ├── layouts/                # Layout components
│   ├── hooks/                  # Shared hooks
│   ├── lib/                    # Utilities
│   └── types/                  # Global types
│
├── locales/                    # i18n translations
│   ├── en/                     # English
│   └── es/                     # Spanish
│
└── styles/                     # Global styles & tokens
```

---

## Prerequisites

- Node.js 20+
- npm 10+

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.development
```

### 3. Start development server

```bash
npm run dev
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Production build |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:3001/api` |
| `VITE_APP_NAME` | Application display name | `Stocka` |
| `VITE_APP_VERSION` | Current app version | `0.0.1` |

---

## Authentication Flow

```
User visits /auth/login or /auth/register
        │
        ▼
  Fills out form (validated by Zod in real-time)
        │
        ▼
  API call to backend
        │
  ┌─────┴─────┐
  ▼           ▼
Success     Error
  │           │
  ▼           ▼
Store tokens  Show error
  │           message
  ▼
Redirect to /dashboard
```

---

## License

Private — All rights reserved.
