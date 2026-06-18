# 🎓 Smart Academic Assistant — Full-Stack Educational Portal

An advanced, premium university management and learning portal designed with a high-contrast luxury aesthetic. It features a headlining Learner Management System (LMS), an AI-powered course assistant utilizing Retrieval-Augmented Generation (RAG) via a Large Language Model (LLM), a smart prerequisite-based registration simulator, an interactive Quiz System, and custom administrative controls.

---

## 🚀 Key Features

*   **🤖 Subject-Based AI Assistant (RAG)**: Students get immediate, source-cited responses to their academic queries. Under the hood, a Node.js backend processes PDF slide uploads, generates vector embeddings, and queries them using a Large Language Model (LLM) with SQLite.
*   **⛓️ Smart Registration Simulator**: Process course registration simulations based on prerequisite requirements, prior failures/completions, and core requirements automatically.
*   **📝 Assessment & Quiz System**: Interactive multiple-choice quizzes with live scoring, grading, and dynamic maximum scores customizable by administrators.
*   **📢 Alerts & Broadcasts**: System-wide notifications with external integration via WASender API to push messages directly to students' WhatsApp accounts.
*   **🔒 Role-Based Dashboard**: Differentiated interfaces for **Students** (dashboard, roadmap, quizzes, chats) and **Administrators** (user list management, course assignments, PDF uploads).

---

## 🛠️ Technology Stack

| Component | Technology |
| :--- | :--- |
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Framer Motion |
| **Backend** | Node.js, Express.js, Socket.io (WebSockets) |
| **Database** | SQLite3 (Metadata, chunks, and Vector Embeddings) |
| **AI Integration** | Large Language Model (LLM) API |
| **Document Parsing**| `pdf-parse`, `multer` (file handling) |

---

## 📁 Repository Structure

```text
project-root/
├── backend/
│   ├── server.js             # Express API server (AI RAG & Uploads)
│   ├── vector_db.sqlite      # SQLite database storing data & embeddings
│   ├── uploads/              # Local file upload storage
│   └── package.json          # Backend package dependencies
├── src/
│   ├── components/           # React component library (LMS, Roadmap, Quiz)
│   ├── contexts/             # Global contexts (Auth, Settings, Accessibility)
│   ├── App.tsx               # Main routing & application shell
│   └── index.css             # Main styling & Tailwind directives
├── package.json              # Root-level Vite script & concurrent workspace dependencies
├── vite.config.ts            # Vite bundler configurations
└── README.md                 # This file
```

---

## ⚙️ Local Setup & Quick Start

Follow these steps to configure the project on your local machine:

### Prerequisites
- [Node.js](https://nodejs.org/) (version `18.0.0` or higher recommended)
- An AI Model API Key

### 1. Install Dependencies
Install all package dependencies for the project. Run the following command in the **root** folder:
```bash
npm install
```

Next, install the backend dependencies. Navigate to the `backend` directory and run:
```bash
cd backend
npm install
cd ..
```

### 2. Configure Environment Variables
Create a `.env` file in your **backend** directory (or root, depending on setup) or add your API key directly in `backend/server.js`:
```env
GEMINI_API_KEY=your_api_key_here
```

### 3. Run the Servers Concurrently
From the **root** directory of the project, run:
```bash
npm run dev
```
This runs the frontend React app (default: `http://localhost:3000`) and backend Express server (default: `http://localhost:3005`) simultaneously using the `concurrently` package.

---

## 📚 Supplementary Guides
- **Technical Architecture**: For deeper insights into schema designs, database structures, and RAG systems, check out [DOCUMENTATION.md](file:///c:/Users/Anonymous/Desktop/Smart%20Academic%20Assistance%20-%20Source%20Code/DOCUMENTATION.md).
- **User Walkthroughs**: To read step-by-step instructions for student and admin interactions, see [WALKTHROUGH.md](file:///c:/Users/Anonymous/Desktop/Smart%20Academic%20Assistance%20-%20Source%20Code/WALKTHROUGH.md).
