# NorthStar Nupes

A monorepo project with React.js frontend and Express.js backend.

## Project Structure

```
.
├── frontend/     # React.js frontend application
├── backend/      # Express.js backend API
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

Install dependencies for both frontend and backend:

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend && npm install

# Install backend dependencies
cd ../backend && npm install
```

### Development

Run both frontend and backend in development mode:

```bash
# From root directory
npm run dev
```

Or run them separately:

```bash
# Frontend (from frontend directory)
cd frontend && npm start

# Backend (from backend directory)
cd backend && npm run dev
```

## Connecting to GitHub

To connect this local repository to GitHub later, you can:

1. Create a repository on GitHub (via web interface or CLI)
2. Add the remote:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/northstar-nupes.git
   git branch -M main
   git push -u origin main
   ```

Or use GitHub CLI:
```bash
gh repo create northstar-nupes --public --source=. --remote=origin --push
```

