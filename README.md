# Pokemon Explorer - Take-Home Interview Assignment

## Overview

This is a take-home interview assignment demonstrating frontend development skills with Next.js, TypeScript, and modern React patterns. The focus is on **functionality and coding best practices**. Feel free to add libraries as seen fit. The designs are meant as a guide. Be as creative as you'd like. 

## Submission
Commit your changes to a public repository and share the link.

## Requirements

The application should provide:

- ✅ **Working searchable grid view** of Pokemon
- ✅ **Infinite scroll** instead of traditional pagination
- ✅ **Two views:**
  - **Default view:** showing only Pokemon name and type
  - **Expanded view** Reveal additional details
- ✅ **Responsive design** that works on all screen sizes

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Package Manager**: pnpm

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── pokemon/
│   │       └── route.ts          # Pokemon endpoint with search & pagination
│   └── page.tsx                  # Main Pokemon grid component
├── components/
│   ├── ui/                       # shadcn/ui components
│   └── PokemonGrid.tsx           # Main Pokemon grid with infinite scroll
├── data/
│   └── pokemon.json              # Generated Pokemon fixtures
└── scripts/
    └── generate-pokemon.js       # Faker.js script to generate Pokemon data
```

## Key Features to implement

### 1. **Infinite Scroll Grid**

- Load Pokemon in batches
- Automatically fetches more data as user scrolls

### 2. **Search Functionality**

### 3. **Expandable Cards**

- **Default view**: Name and type badges only
- **Expanded view**: Full stats, description, and details
- Click to expand/collapse individual cards

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm package manager

### Installation

```bash
# Install dependencies
pnpm install

# Generate Pokemon fixtures
node scripts/generate-pokemon.js

# Start development server
pnpm dev
```

### Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm lint         # Run ESLint
```

## API Endpoints

### GET `/api/pokemon`

Endpoint for fetching Pokemon with pagination and conditional search functionality.

**Query Parameters:**

- `page` (number): Page number for pagination (default: 1)
- `limit` (number): Items per page (default: 20)
- `search` (string): Optional search term for filtering by name, type, or description

**Response:**

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1000,
    "totalPages": 50,
    "hasNext": true,
    "hasPrev": false
  }
}
```

**Usage Examples:**

- `GET /api/pokemon?page=1&limit=20` - First 20 Pokemon
- `GET /api/pokemon?search=fire&page=1&limit=15` - Search for fire-type Pokemon with pagination
- `GET /api/pokemon?search=dragon&page=2&limit=10` - Second page of dragon Pokemon search results
