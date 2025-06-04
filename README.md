# HotBoxes - Super Bowl Squares Reimagined

HotBoxes is a modern web application that reimagines the classic Super Bowl Squares game. It allows users to create games, select squares on a 10x10 grid, and track scores in real-time.

## Features

- 🎮 Interactive 10x10 grid for selecting squares
- 👤 User authentication with Supabase
- 🎯 Real-time updates when others select squares
- 📱 Fully responsive design for all devices
- 🌓 Light and dark mode support
- 🎲 Multiple games support

## Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS, Framer Motion
- **Backend**: Supabase (Authentication, Database, Realtime)
- **Language**: TypeScript

## Setup

### Prerequisites

- Node.js 16+ and npm
- Supabase account (free tier works fine)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/hotboxes.git
   cd hotboxes
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a Supabase project and get your API keys.

4. Create a `.env.local` file in the root directory with the following content:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

5. Set up your Supabase database with the following tables:
   - `profiles`: For user profiles
   - `games`: For game details
   - `boxes`: For the grid boxes

6. Run the development server:
   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Database Schema

### profiles
- `id`: UUID (primary key, references auth.users.id)
- `username`: TEXT
- `email`: TEXT
- `created_at`: TIMESTAMP

### games
- `id`: UUID (primary key)
- `name`: TEXT
- `homeTeam`: TEXT
- `awayTeam`: TEXT
- `homeScores`: INTEGER[]
- `awayScores`: INTEGER[]
- `isActive`: BOOLEAN
- `createdBy`: UUID (references profiles.id)
- `createdAt`: TIMESTAMP

### boxes
- `id`: TEXT (primary key)
- `row`: INTEGER
- `column`: INTEGER
- `userId`: UUID (references profiles.id)
- `gameId`: UUID (references games.id)

## License

MIT

## Acknowledgements

- Next.js team for the amazing framework
- Tailwind CSS for the utility-first CSS framework
- Supabase for the backend services