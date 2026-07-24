# DuckLoad Web Frontend

The user-facing student portal and admin dashboard for the PUP Student Guidance
System Capstone (GuiSIS). Built with React, Vite, TypeScript, and Tailwind CSS.

For developer guidelines and standards, see [CONTRIBUTING.md](CONTRIBUTING.md).

## Tech Stack

- **Framework**: React (v18) + Vite
- **Language**: TypeScript
- **Routing**: React Router DOM (v6)
- **Styling**: Tailwind CSS + shadcn/ui
- **HTTP Client**: Axios

## Project Structure

```
src/
├── assets/           # Images, logo assets, and static files
├── components/        # Reusable global UI components (shadcn/ui)
├── context/          # React Context providers (AuthContext, etc.)
├── features/         # Feature modules (students, appointments, slips)
├── hooks/            # Custom React hooks
├── lib/              # Shared utility functions and helpers
├── pages/            # Page-level components
├── routes/           # Routing configuration
└── services/         # API integration services (Axios client)
```

## Setup Instructions

### Prerequisites

- Node.js v22+
- npm v10+

### Installation

1. Navigate to the `guisis-web` folder.
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Initialize configuration by creating a `.env` file in the root of the
   `guisis-web` directory:
   ```env
   VITE_API_BASE_URL=http://localhost:8000/api/v1
   ```

### Running Locally

- **Start development server**:
  ```bash
  npm run dev
  ```
- **Build production assets**:
  ```bash
  npm run build
  ```
- **Run ESLint checking**:
  ```bash
  npm run lint
  ```
