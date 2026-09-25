# FastianHub

A modern, high-performance web portal for FAST-NUCES students to browse, search, and download past examination papers, midterms, finals, quizzes, and course outlines across all university campuses.

---

## Campuses Supported

- **FAST Islamabad** (500+ papers, sessionals & course outlines)
- **FAST Karachi** (Quizzes, midterms, finals & lab sheets)
- **FAST Lahore** (6,100+ files across 120+ courses)
- **FAST CFD / Chiniot-Faisalabad** (Labs, terminal exams, slides & solutions)

---

## Key Features

- **Fast Instant Search**: Real-time filtering by course title, code, or keyword.
- **Semester & Outline Filters**: Instant navigation across semesters 1 through 8, course outlines, and bookmarked favorites.
- **Course Material Categorization**: Dynamic classification into Finals, Mids/Sessionals, Quizzes, Assignments, Labs, Projects, Outlines, and Notes.
- **In-Browser Preview & Direct Download**: Proxied file streaming with automatic content-type negotiation for PDFs, code files, and documents.
- **Bookmarks & Saved Courses**: Client-side persistence for quick access to your current courses.
- **Open-Source Credits Leaderboard**: Transparent ranking and attribution for repository contributors.
- **Repo Submissions & Feedback**: Direct user workflows for submitting new course archives and requesting features.

---

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) 16 (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI & Styling**: Vanilla CSS with modern custom design system tokens (Inter typography, responsive bottom sheets, dark accent badges)
- **API & Streaming**: Next.js route handlers with cached streaming proxy (`/api/papers`)

---

## Getting Started

### Prerequisites

- Node.js 22.18+ recommended for the SEO verification script (Next.js requires 20.9+)
- npm, pnpm, or yarn

### Installation

```bash
git clone https://github.com/your-username/fastianhub.git
cd fastianhub
npm install
```

### Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### Building for Production

```bash
npm run build
npm start
```

For the domain, indexing controls, campus URLs and launch checks, see [DEPLOYMENT.md](./DEPLOYMENT.md). Run `npm run check:seo` against the running production build before deployment.

### Data Pipeline

To re-index or update past paper archives from upstream GitHub trees:

```bash
npm run build:papers
```

---

## Project Structure

```text
fastianhub/
├── app/
│   ├── api/papers/route.ts      # File proxy & inline preview stream handler
│   ├── credits/page.tsx         # Contributor archive leaderboard
│   ├── layout.tsx               # Root layout, fonts, and meta tags
│   ├── page.tsx                 # Main application entry
│   └── globals.css              # Design tokens and component styles
├── components/
│   ├── CourseCard.tsx           # Interactive course card
│   ├── CourseDetailsSheet.tsx   # Material drawer & categorizer
│   ├── FeedbackModal.tsx        # Feedback & feature request modal
│   ├── PastPapersView.tsx       # Core past papers browser view
│   └── SubmitRepoModal.tsx      # Repository contribution modal
├── data/
│   ├── contributors.json        # Verified archive contributors
│   └── pastPapers.json          # Compiled multi-campus database
├── lib/
│   └── papers.ts                # TypeScript interfaces and helpers
├── public/                      # Static assets & favicons
└── scripts/
    ├── buildPastPapers.js       # GitHub tree crawler & parser
    └── generateIcons.ps1        # High-res favicon/icon generator
```

---

## License

Open-source and maintained for the FAST-NUCES student community.
