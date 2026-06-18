# Smart Academic Assistant User Walkthrough

Welcome to the **Smart Academic Assistant** platform! This guide will walk you through the primary user flows for both students and administrators.

---

## 1. Getting Started: Authentication

### Logging In
1. Navigate to the local server URL (e.g., `http://localhost:5173`).
2. You will be greeted by the premium Login screen.
3. Depending on your role in the academic system:
   - **Student Login:** Enter your university credentials.
   - **Admin Login:** Enter your administrative credentials.
4. The system validates your role and seamlessly routes you to either the **Student Dashboard** or **Admin Panel**.

---

## 2. Administrator Workflows

If you are an administrator, you have specialized tools to manage the platform and AI.

### Managing Users
1. From the Admin Dashboard, navigate to the **Users Management** tab.
2. View all currently registered students and faculty.
3. **Adding a User:** Click 'Add User' to register a new student or admin. Their profile picture, contact details, and ID will be securely handled.

### Managing AI Knowledge (Uploading PDFs)
The core of the Subject-Based AI relies on PDFs uploaded by authorities.
1. In the Admin Dashboard, locate the **Upload Materials** or **Subject Knowledge Base** area.
2. Select a target **Subject** from the unified dropdown.
3. Click "Upload File" and select PDF lecture slides, curriculum notes, or reference texts.
4. **Behind the Scenes:** The system instantly reads the PDF, chunks it into segments, and syncs vector embeddings into the SQLite database. Future student AI queries for this subject will source answers from these uploaded files.

### Sending Broadcast Alerts
1. Navigate to the **Alerts Center**.
2. Create platform-wide announcements natively.
3. If external notification is required, use the **WhatsApp Alert** feature to push critical announcements via Wasender directly to student phone numbers.

---

## 3. Student Workflows

Once a student is logged in, they have access to a suite of smart tools via the responsive sidebar.

### The Dashboard
- Your central hub. View an at-a-glance summary of announcements, active components, and personal profile information dynamically loaded from your user account.

### Using the Subject-Based AI Chatbot
1. Click on **Smart Assistant** or **Subjects** from the sidebar.
2. Select the specific course you need help with.
3. Type your question in the premium chat interface.
4. **The AI's Response:** The RAG (Retrieval-Augmented Generation) engine will query the exact PDFs the Admin uploaded for this subject. The AI will respond with a highly detailed, intelligently formatted answer.
5. **Exact Page Citations:** Notice the AI precisely citing the PDF filename and "Page X" where it found the answer. 

### Simulating Smart Registration
1. Navigate to the **Smart Registration** tab.
2. Select courses you have previously passed or failed.
3. Click **Simulate**. The AI simulator processes prerequisite chains securely and recommends an optimal list of subjects to register for the upcoming semester, highly prioritizing unlocked mandatory chains.

### Taking Quizzes
1. Access the **LMS** or **Quizzes** tab.
2. Start an assessment. The premium UI presents Multiple Choice Questions with visual feedback.
3. Upon submission, the backend instantly tallies your score compared exactly against dynamic maximums configured by your professors, returning precise percentage feedback.

---

## 4. Customizing the Experience

- **Profile Picture Upload:** Navigate to your profile to dynamically swap your profile image. This uses local persistent hooks, so your picture updates broadly across the header navbar and your dashboard.
- **Dark Mode Enablement:** Found within `Settings`, enabling dark mode engages the system's class-variance-authority hooks to dynamically transform the luxury glassmorphism panels into their high-contrast, deep-theme variants.

---

**Need Help?**
For setup configurations, please review the `DOCUMENTATION.md` file found in the project root directory.
