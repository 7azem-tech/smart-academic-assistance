# Smart Academic Assistant Design - Project Documentation

## 1. Project Overview
A comprehensive, premium educational platform designed with a modern and luxury aesthetic. It integrates a Learner Management System (LMS), Academic Roadmap, Smart Registration simulator, an AI-powered subject-based Chatbot (using RAG with a Large Language Model), a customizable Quiz System, and an Alerts Center with WhatsApp integration.

## 2. Tech Stack & Technologies
### Frontend
- **Framework:** React 18, Vite, TypeScript
- **Styling:** Tailwind CSS, class-variance-authority, tailwind-merge
- **UI Components:** Radix UI primitives (Accordion, Dialog, Dropdown, Menu, etc.) for accessible, headless components
- **Animations:** framer-motion (`motion/react`) for fluid micro-interactions
- **Routing:** Conditional component rendering managed by central component state (`App.tsx`)
- **Utilities:** lucide-react (icons), recharts (data visualization), react-markdown (text formatting), sonner (toast notifications), react-hook-form

### Backend (RAG Server)
- **Environment:** Node.js, Express.js
- **Database:** SQLite3 (`vector_db.sqlite`) for storing document metadata, text chunks, and vector embeddings
- **AI Integration:** Large Language Model (LLM)
- **Document Processing:** `pdf-parse` for text extraction, `multer` for multipart form file uploads

## 3. Project Architecture & Folder Structure
```text
project-root/
├── backend/
│   ├── server.js             # Express server (PDF uploads & LLM RAG logic)
│   ├── vector_db.sqlite      # SQLite vector database for embeddings
│   └── uploads/              # Local temporary folder for PDF uploads
├── src/
│   ├── components/
│   │   ├── AdminDashboard.tsx      # Comprehensive admin panel (Users, Courses management)
│   │   ├── Dashboard.tsx           # Main student dashboard interface
│   │   ├── Login.tsx               # Authentication gateway
│   │   ├── AcademicRoadmap.tsx     # Student progress & subjects tracking
│   │   ├── LMS.tsx                 # Learning Management System functionality
│   │   ├── CoursesChat.tsx      # Specific subject-based AI Chatbots via LLM
│   │   ├── SmartRegistration.tsx   # Simulator for smart, prerequisite-based registration
│   │   ├── Alerts.tsx              # Application-wide alerts and announcements
│   │   ├── WhatsAppAlertModal.tsx  # WhatsApp messaging modal using Wasender API
│   │   ├── Quiz/                   # Assessment functionality, grading, and MCQs
│   │   ├── Settings.tsx            # Application and dynamic user settings
│   │   ├── Sidebar.tsx             # Main navigation layout
│   │   └── ui/                     # Reusable Radix UI and Tailwind interface primitives
│   ├── contexts/
│   ├── AuthContext.tsx         # Provides logged-in user state & role-based validation
│   ├── SettingsContext.tsx     # Centralized app configuration and persistence
│   └── CompactViewContext.tsx  # Accessibility/UI scaling context
├── App.tsx                     # Main application entry point & UI router
├── main.tsx                    # React DOM renderer
└── index.css                   # Global styles & Tailwind CSS injections
├── package.json                    # Project dependencies and script definitions
└── vite.config.ts                  # Vite bundler configuration
```

## 4. Core Features
### 4.1. Authentication & Role-Based Access
- Administered centrally via `AuthContext.tsx`.
- Automatically differentiates between `student` and `admin` roles, safely routing users to the appropriate interface (`Dashboard` vs `AdminDashboard`).
- Fully supports dynamically persistent user profiles across application restarts through unified state contexts.

### 4.2. Subject-Based AI Chatbots (Retrieval-Augmented Generation)
- Configured via the `backend/server.js` module.
- Admins upload PDF course materials per subject directly via the UI tools in `AdminDashboard.tsx`.
- The Node.js server extracts the text, segments it into chunks, and fetches dense vector embeddings to be persistently stored in `vector_db.sqlite`.
- Students querying within `CoursesChat.tsx` trigger a cosine-similarity search against these embeddings, supplying the most relevant passages as context to the Large Language Model (LLM) for rich, deeply analytical, and academically sourced answers with exact page citations.

### 4.3. Smart Registration Simulator
- Designed within `SmartRegistration.tsx` to allow educators or administrators to safely simulate a student's academic path.
- Ingests multiple student variables—most notably prerequisites, prior completions, and failures—to output logically optimal course recommendations dynamically.

### 4.4. Quiz & Assessment System
- Enclosed inside `src/components/Quiz/`.
- Enables precision-based assessment flows, dynamic max-score caps configured by admins, and real-time frontend grading mapped neatly to beautifully animated Multiple Choice Question schemas.

### 4.5. Alerts Center & WhatsApp Integration
- `Alerts.tsx` tracks global notifications.
- The `WhatsAppAlertModal.tsx` incorporates third-party WhatsApp integration directly into the frontend, permitting broadcast or targeted direct messaging to specific numbers natively.

## 5. Setup & Installation
1. **Ensure environment prerequisites are met:**
   - Node.js (v18+)
   - npm or yarn
2. **Install project dependencies:**
   ```bash
   npm install
   ```
3. **Boot the environment:**
   ```bash
   npm run dev
   ```
   *Note: This command triggers concurrently under the hood, initiating the Vite React frontend (port 5173 by default) whilst simultaneously lifting the Express.js backend RAG service (configured to port 3005) securely dodging port collisions.*

## 6. Design Philosophy & UI Rules
- **Aesthetics First:** Strongly emphasizes glassmorphism, depth-mapping shadow effects, and high-contrast alert displays, prioritizing a distinguished "luxury" feel throughout the user experience.
- **Responsiveness:** Entirely reliant on functional Tailwind CSS utility logic to flex symmetrically across mobile and large formats.
- **Micro-Interactions Flow:** Leverages `framer-motion` strategically on UI mount, hover states, list sorting, and form submission to drastically boost application interactivity.
