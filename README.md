VidyaQuest 🌾✨

Learning that feels like the best game ever.

VidyaQuest turns school lessons into game-like quests for children in rural Indian classrooms. Kids earn XP, unlock badges, and climb village leaderboards — in their own language, even on low-end devices and patchy connectivity.


Built with Lovable · Powered by TanStack Start, React 19, Supabase, and Tailwind CSS.



✨ Features


Quest Realms — Math, Story, Science, and Language subjects, each mapped to NCERT/CBSE chapters and reframed as game "worlds."
XP & Levels — Every completed quest earns XP; XP accumulates into levels shown on the student's profile.
Badges — Unlockable badges for streaks, mastery, and milestones (e.g. "Math Wizard," "7-Day Streak").
Village Leaderboards — Friendly competition across classrooms, schools, and neighboring villages.
Multilingual — Designed to support 10+ local Indian languages alongside English.
Offline-first mindset — Built to work on shared tablets/low-cost Android phones with intermittent internet.
Auth — Email/password and Google sign-in via Supabase Auth.
Student Dashboard — Live view of profile, XP, streaks, subjects, quests, badges, and leaderboard standings.


🛠 Tech Stack

LayerTechnologyFrameworkTanStack Start + TanStack RouterUIReact 19, Tailwind CSS v4, shadcn/ui (Radix primitives)Backend / DBSupabase (Postgres, Auth, Row-Level Security, RPC functions)Forms & ValidationReact Hook Form + ZodIconslucide-reactToolingVite, TypeScript, ESLint, Prettier

📂 Project Structure

src/
├── routes/                     # File-based routes (TanStack Router)
│   ├── index.tsx                # Public landing page
│   ├── auth.tsx                 # Sign in / sign up
│   └── _authenticated/
│       ├── route.tsx            # Auth guard layout
│       └── dashboard.tsx        # Student dashboard (quests, XP, badges, leaderboard)
├── components/ui/              # shadcn/ui component library
├── integrations/supabase/      # Supabase client, auth middleware, generated types
├── lib/                        # Shared utilities, error handling
└── server.ts / start.ts        # App entry points

supabase/
└── migrations/                 # SQL schema: profiles, subjects, quests, completions, badges

🗄 Database Schema

Core tables (see supabase/migrations/):


profiles — display name, village, class level, total XP, streak days
subjects — quest "realms" (Math, Story, Science, Language, etc.)
quests — individual challenges with a question, options, correct answer, and XP reward
quest_completions — tracks which user completed which quest
badges / user_badges — badge definitions and per-user unlocks


All tables use Postgres Row-Level Security, with a complete_quest RPC function handling XP awards and badge unlocks atomically.

🚀 Getting Started

Prerequisites


Node.js 18+ (or Bun — a bun.lock is included)
A Supabase project


1. Clone & install

bashgit clone https://github.com/kssaravanavelu-web/harvest-of-wisdom.git
cd harvest-of-wisdom
npm install
# or: bun install

2. Configure environment variables

Create a .env file in the project root:

envSUPABASE_PROJECT_ID=your-project-id
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-publishable-key

VITE_SUPABASE_PROJECT_ID=your-project-id
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key

3. Set up the database

Apply the SQL migrations in supabase/migrations/ to your Supabase project (via the Supabase CLI or the SQL editor in the Supabase dashboard) to create the required tables, policies, and RPC functions.

4. Run the dev server

bashnpm run dev

The app will be available at the local URL printed in your terminal.

📜 Available Scripts

CommandDescriptionnpm run devStart the development servernpm run buildBuild for productionnpm run build:devBuild in development modenpm run previewPreview the production build locallynpm run lintRun ESLintnpm run formatFormat code with Prettier

🤝 Contributing

This project is connected to Lovable — changes pushed to the connected branch sync back to the Lovable editor, so please avoid rewriting published git history (force-pushing, rebasing, or amending already-pushed commits).

📄 License

Add your preferred license here (e.g., MIT).
