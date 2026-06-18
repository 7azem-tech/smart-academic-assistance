const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const { sendEmailNotification, sendWhatsAppNotification } = require('./services/notificationService');

const app = express();
const server = http.createServer(app);
const PORT = 3005; // Changed from 3001 to prevent conflict with Vite
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const io = new Server(server, {
    cors: { origin: "*" }
});

// SQLite Setup
const dbPath = path.resolve(__dirname, 'vector_db.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        filename TEXT,
        subjectId TEXT,
        uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS chunks (
        id TEXT PRIMARY KEY,
        doc_id TEXT,
        text TEXT,
        embedding JSON
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS queries (
        id TEXT PRIMARY KEY,
        question TEXT,
        answer TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    // LMS Tables
    db.run(`CREATE TABLE IF NOT EXISTS courses (
        id TEXT PRIMARY KEY, code TEXT, name TEXT, instructor TEXT, progress INTEGER,
        nextClass TEXT, unreadAnnouncements INTEGER, pendingAssignments INTEGER,
        color TEXT, students INTEGER, rating REAL, materials INTEGER, videos INTEGER
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS lms_materials (
        id TEXT PRIMARY KEY, courseId TEXT, title TEXT, type TEXT, size TEXT,
        date TEXT, downloads INTEGER, views INTEGER, url TEXT
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS lms_videos (
        id TEXT PRIMARY KEY, courseId TEXT, title TEXT, duration TEXT,
        date TEXT, views INTEGER, watched INTEGER, url TEXT
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS lms_discussions (
        id TEXT PRIMARY KEY, courseId TEXT, title TEXT, author TEXT,
        replies INTEGER, lastActivity TEXT, likes INTEGER,
        openAt TEXT, closeAt TEXT, description TEXT
    )`);
    // Migrate existing rows that lack openAt/closeAt/description columns (safe on fresh DB too)
    db.run(`ALTER TABLE lms_discussions ADD COLUMN openAt TEXT`, () => {});
    db.run(`ALTER TABLE lms_discussions ADD COLUMN closeAt TEXT`, () => {});
    db.run(`ALTER TABLE lms_discussions ADD COLUMN description TEXT`, () => {});
    db.run(`CREATE TABLE IF NOT EXISTS lms_messages (
        id TEXT PRIMARY KEY, discussionId TEXT, author TEXT, content TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS lms_assignments (
        id TEXT PRIMARY KEY, courseId TEXT, title TEXT, dueDate TEXT, status TEXT, submissions INTEGER, total INTEGER
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS lms_submissions (
        id TEXT PRIMARY KEY, assignmentId TEXT, studentName TEXT, fileName TEXT, url TEXT, submittedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Notification and User Tables
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE,
        email TEXT,
        phoneNumber TEXT,
        role TEXT,
        universityId TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS notification_settings (
        userId TEXT PRIMARY KEY,
        emailEnabled INTEGER DEFAULT 1,
        whatsappEnabled INTEGER DEFAULT 0,
        quizTiming TEXT DEFAULT '1day',
        midtermTiming TEXT DEFAULT '3days',
        finalTiming TEXT DEFAULT '1week',
        projectTiming TEXT DEFAULT '2days',
        assignmentTiming TEXT DEFAULT '1day',
        FOREIGN KEY(userId) REFERENCES users(id)
    )`);
    db.run(`ALTER TABLE documents ADD COLUMN url TEXT`, () => {});
});


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (!fs.existsSync('uploads')) {
        fs.mkdirSync('uploads');
    }
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage: storage });

// Gemini API Configuration
const GEMINI_API_KEY = 'AIzaSyAK_el2YSQqGnUqsy3BlY8nShu9fWX-VCo';

// Helper: Get Embedding
async function getEmbedding(text) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${GEMINI_API_KEY}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'models/gemini-embedding-001',
                content: { parts: [{ text: text }] }
            })
        });
        const data = await response.json();
        if (data.embedding && data.embedding.values) {
            return data.embedding.values;
        }
        console.error("Embedding API Error:", data);
        return null;
    } catch (error) {
        console.error("Error fetching embedding:", error);
        return null;
    }
}

// Helper: Generate Answer
async function generateAnswer(question, context) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const prompt = `You are a premium academic AI assistant helping university students understand their course material. Answer strictly from the provided Context — do NOT hallucinate or add outside knowledge.

You must respond with a valid JSON object matching this exact schema:
{
  "answer": "Your detailed explanation answering the user's question, formatted with markdown headings and bullet points. Include [Page X] citations.",
  "exactQuote": "The exact verbatim sentence or short paragraph (max 3 sentences) from the Context that best supports your answer. Copy it exactly as it appears in the text."
}

STRICT FORMATTING RULES FOR THE "answer" FIELD:
1. STRUCTURE & READABILITY:
   - Use clear **section headings** when explaining topics.
   - Break information into short paragraphs and avoid large blocks of text.
   - Group related information under meaningful headings.
   - Highlight important terms using **bold text**.
   - Use concise sentences and avoid repeating information. Prioritize readability over verbosity.
   - Always answer in a structured, professional, and visually organized manner easy to scan quickly.
   - End long explanations with a brief **Summary** section when appropriate.

2. LISTS & COMPARISONS:
   - Use bullet points (-) for lists, features, advantages, disadvantages, and examples.
   - Use numbered lists (1., 2., 3.) when describing procedures, steps, or sequences.
   - When comparing items, use separate bullet points or Markdown tables.

3. REQUIRED TEMPLATES:
   If the answer contains DEFINITIONS, use:
   **Definition**
   [definition]
   
   **Key Features**
   - Feature 1
   - Feature 2
   
   **Example**
   [example]

   If the answer contains ADVANTAGES AND DISADVANTAGES, use:
   **Advantages**
   - Advantage 1
   - Advantage 2

   **Disadvantages**
   - Disadvantage 1
   - Disadvantage 2

   If the answer explains a PROCESS, use:
   **How It Works**
   1. Step 1
   2. Step 2

4. PAGE CITATION RULES (CRITICAL):
   - Cite pages using [Page X] format ONLY.
   - Place [Page X] ONCE at the END of each paragraph or list block — NOT after every sentence.
   - If multiple points come from the same page, group them in one section and cite once at the end.
   - If a section uses multiple pages, cite all at end: [Page 3, Page 4].
   - Never repeat the same [Page X] multiple times in a row.

5. If the context does not contain the answer, say so politely and suggest what related topics ARE covered. End with one brief, friendly sentence.

Context:
${context}

Question:
${question}

Answer:`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" }
            })
        });
        const data = await response.json();
        if (data.candidates && data.candidates[0].content) {
            try {
                return JSON.parse(data.candidates[0].content.parts[0].text);
            } catch (e) {
                return { answer: data.candidates[0].content.parts[0].text, exactQuote: null };
            }
        }
        console.error("Generation API Error:", data);
        return { answer: "Sorry, I could not generate an answer.", exactQuote: null };
    } catch (error) {
        console.error("Error generating answer:", error);
        return { answer: "An error occurred during text generation.", exactQuote: null };
    }
}

// Helper: Chunk Text
function chunkText(text, maxWords = 500) {
    const words = text.split(/\s+/);
    const chunks = [];
    for (let i = 0; i < words.length; i += maxWords) {
        chunks.push(words.slice(i, i + maxWords).join(' '));
    }
    return chunks;
}

// Helper: Cosine Similarity
function cosineSimilarity(vecA, vecB) {
    let dotProduct = 0.0;
    let normA = 0.0;
    let normB = 0.0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// API Routes

app.post('/api/upload-pdf', upload.array('pdfs'), async (req, res) => {
    try {
        const files = req.files;
        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No PDFs provided' });
        }

        const processedDocs = [];
        const subjectId = req.body.subjectId || 'general';

        for (const file of files) {
            if (file.mimetype !== 'application/pdf') {
                continue; // Skip non-pdfs
            }
            const dataBuffer = fs.readFileSync(file.path);

            let currentPageIndex = 1;
            const pageTexts = [];
            const render_page = async (pageData) => {
                const textContent = await pageData.getTextContent();
                let text = '';
                for (let item of textContent.items) {
                    text += item.str + ' ';
                }
                const pageNum = pageData.pageIndex !== undefined ? pageData.pageIndex + 1 : (pageData.pageNumber || currentPageIndex++);
                pageTexts.push({ page: pageNum, text: text });
                return text;
            };

            await pdfParse(dataBuffer, { pagerender: render_page });
            pageTexts.sort((a, b) => a.page - b.page);

            const docId = crypto.randomUUID();
            const fileUrl = `/uploads/${file.filename}`;
            db.run(`INSERT INTO documents (id, filename, subjectId, url) VALUES (?, ?, ?, ?)`, [docId, file.originalname, subjectId, fileUrl]);

            for (const pt of pageTexts) {
                const chunks = chunkText(pt.text, 500); // 500 words per page chunk
                for (const chunk of chunks) {
                    if (chunk.trim() === '') continue;
                    const embedding = await getEmbedding(chunk);
                    if (embedding) {
                        const metadata = JSON.stringify({ filename: file.originalname, page: pt.page });
                        // We store the metadata and chunk separated by |||
                        db.run(`INSERT INTO chunks (id, doc_id, text, embedding) VALUES (?, ?, ?, ?)`,
                            [crypto.randomUUID(), docId, metadata + '|||' + chunk, JSON.stringify(embedding)]
                        );
                    }
                }
            }
            // fs.unlinkSync(file.path); // keep file so we can view it in the frontend!
            processedDocs.push(file.originalname);
        }

        res.json({ message: 'PDFs processed successfully!', processedDocs });
    } catch (error) {
        console.error(error);
        try { fs.appendFileSync('backend.log', error.stack + '\n'); } catch (e) { }
        res.status(500).json({ error: 'Failed to process PDFs' });
    }
});

app.post('/api/chat', async (req, res) => {
    const { question, subjectId = 'general' } = req.body;
    if (!question) return res.status(400).json({ error: 'Question is required' });

    try {
        const questionEmbedding = await getEmbedding(question);
        if (!questionEmbedding) {
            return res.status(500).json({ error: 'Failed to embed question' });
        }

        // Retrieve chunks for the specific subject, joining with documents to get document URL
        db.all(`SELECT c.text, c.embedding, d.filename, d.url FROM chunks c JOIN documents d ON c.doc_id = d.id WHERE d.subjectId = ?`, [subjectId], async (err, rows) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Database error' });
            }

            if (!rows || rows.length === 0) {
                return res.json({ answer: 'No PDFs uploaded yet. Please upload a PDF first.' });
            }

            // Calculate similarity score for all chunks
            let scoredChunks = rows.map(row => {
                const vec = JSON.parse(row.embedding);
                let score = cosineSimilarity(questionEmbedding, vec);

                let rawText = row.text;
                let metadata = null;
                if (rawText.includes('|||')) {
                    const parts = rawText.split('|||');
                    try {
                        metadata = JSON.parse(parts[0]);
                        rawText = parts.slice(1).join('|||');
                    } catch (e) { }
                }
                // Prepend the page and filename info directly into the LLM context so it knows where it got it from.
                const contextStr = metadata ? `[Source PDF: ${metadata.filename}, Page: ${metadata.page}]\n${rawText}` : rawText;

                // Penalize extremely short chunks (e.g. title slides) to prevent them from dominating the semantic search
                const wordCount = rawText.split(/\s+/).length;
                if (wordCount < 15) {
                    score *= 0.85; 
                }

                return { score, contextStr, metadata, url: row.url };
            });

            // Sort descending by score
            scoredChunks.sort((a, b) => b.score - a.score);

            // Take top 5 chunks to improve accuracy and context breadth
            const topChunks = scoredChunks.slice(0, 5);
            const contextText = topChunks.map(c => c.contextStr).join('\n\n');

            const llmResponse = await generateAnswer(question, contextText);
            const answer = llmResponse.answer || "Sorry, I could not generate an answer.";
            const exactQuote = llmResponse.exactQuote || null;

            // Log query
            db.run(`INSERT INTO queries (id, question, answer) VALUES (?, ?, ?)`,
                [crypto.randomUUID(), question, answer]
            );

            // Clean concise snippet references exactly as asked
            const snippets = [...new Set(topChunks.map(c => {
                if (c.metadata) {
                    return `Source PDF: ${c.metadata.filename} - Page ${c.metadata.page}`;
                }
                return `Source PDF: Unknown (Pre-update uploaded document)`;
            }))];

            // Create structured citations
            const citations = topChunks.map(c => ({
                filename: c.metadata ? c.metadata.filename : 'Unknown',
                page: c.metadata ? c.metadata.page : 1,
                url: c.url || null,
                text: exactQuote || (c.contextStr.includes('\n') ? c.contextStr.substring(c.contextStr.indexOf('\n') + 1) : c.contextStr)
            }));

            res.json({ answer, snippets, citations });
        });
    } catch (error) {
        console.error(error);
        try { fs.appendFileSync('backend.log', error.stack + '\n'); } catch (e) { }
        res.status(500).json({ error: 'Failed to process chat query' });
    }
});

app.get('/api/documents', (req, res) => {
    const subjectId = req.query.subjectId;
    let query = `SELECT id, filename, uploaded_at FROM documents ORDER BY uploaded_at DESC`;
    let params = [];
    if (subjectId) {
        query = `SELECT id, filename, uploaded_at FROM documents WHERE subjectId = ? ORDER BY uploaded_at DESC`;
        params = [subjectId];
    }

    db.all(query, params, (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(rows);
    });
});

app.delete('/api/documents/:id', (req, res) => {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'ID is required' });

    db.run(`DELETE FROM documents WHERE id = ?`, [id], function (err) {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
        }
        // Also delete associated chunks
        db.run(`DELETE FROM chunks WHERE doc_id = ?`, [id], function (err2) {
            if (err2) console.error("Error deleting chunks for doc:", id);
            res.json({ success: true });
        });
    });
});

// --- NOTIFICATION SETTINGS ROUTES ---

// Sync User from Frontend (LocalStorage) to Backend (SQLite)
app.post('/api/users/sync', (req, res) => {
    const { id, username, email, phoneNumber, role, universityId } = req.body;
    if (!id || !username) return res.status(400).json({ error: 'ID and Username required' });

    db.run(`INSERT OR REPLACE INTO users (id, username, email, phoneNumber, role, universityId) VALUES (?, ?, ?, ?, ?, ?)`,
        [id, username, email, phoneNumber, role, universityId],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            
            // Also ensure notification settings record exists
            db.run(`INSERT OR IGNORE INTO notification_settings (userId) VALUES (?)`, [id], (err2) => {
                res.json({ success: true });
            });
        }
    );
});

// Send Test Email
app.post('/api/notifications/test-email', async (req, res) => {
    const testEmail = "hazem-j@outlook.com";
    const result = await sendEmailNotification(
        testEmail,
        "🔔 System Test: Email Notifications",
        "Test Notification Successful",
        "This is a test email from your EELU LMS Notification System. If you are reading this, your email configuration is working perfectly!"
    );

    if (result.success) {
        res.json({ success: true, message: `Test email sent to ${testEmail}`, previewUrl: result.previewUrl });
    } else {
        res.status(500).json({ error: result.error });
    }
});

// Get Notification Settings
app.get('/api/notifications/settings/:userId', (req, res) => {
    db.get(`SELECT * FROM notification_settings WHERE userId = ?`, [req.params.userId], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) {
            // Default settings if none found
            return res.json({
                userId: req.params.userId,
                emailEnabled: 1,
                whatsappEnabled: 0,
                quizTiming: '1day',
                midtermTiming: '3days',
                finalTiming: '1week',
                projectTiming: '2days',
                assignmentTiming: '1day'
            });
        }
        res.json(row);
    });
});

// Update Notification Settings
app.post('/api/notifications/settings/:userId', (req, res) => {
    const { 
        emailEnabled, 
        whatsappEnabled, 
        quizTiming, 
        midtermTiming, 
        finalTiming, 
        projectTiming, 
        assignmentTiming 
    } = req.body;

    db.run(`UPDATE notification_settings SET 
            emailEnabled = ?, 
            whatsappEnabled = ?, 
            quizTiming = ?, 
            midtermTiming = ?, 
            finalTiming = ?, 
            projectTiming = ?, 
            assignmentTiming = ? 
            WHERE userId = ?`,
        [
            emailEnabled ? 1 : 0, 
            whatsappEnabled ? 1 : 0, 
            quizTiming, 
            midtermTiming, 
            finalTiming, 
            projectTiming, 
            assignmentTiming, 
            req.params.userId
        ],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        }
    );
});

// --- LMS API ROUTES ---

// Get all courses (Admin & Students)
app.get('/api/courses', (req, res) => {
    db.all(`SELECT * FROM courses`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Admin: Create a course
app.post('/api/courses', (req, res) => {
    const id = crypto.randomUUID();
    const { code, name, instructor, color } = req.body;
    db.run(`INSERT INTO courses (id, code, name, instructor, progress, nextClass, unreadAnnouncements, pendingAssignments, color, students, rating, materials, videos) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, code, name, instructor, 0, "Not Scheduled", 0, 0, color || "from-blue-500 to-blue-600", 0, 0, 0, 0],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, id });
        }
    );
});

// Upload material (Admin)
app.post('/api/lms/materials', upload.single('file'), (req, res) => {
    const { courseId, title } = req.body;
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file provided' });
    
    const id = crypto.randomUUID();
    const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const size = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
    const type = file.originalname.split('.').pop() || 'file';
    const url = `/uploads/${file.filename}`;

    db.run(`INSERT INTO lms_materials (id, courseId, title, type, size, date, downloads, views, url) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, courseId, title, type, size, date, 0, 0, url],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            db.run(`UPDATE courses SET materials = materials + 1 WHERE id = ?`, [courseId]);
            res.json({ id, title, type, size, date, downloads: 0, views: 0, url });
        }
    );
});

// Upload video (Admin)
app.post('/api/lms/videos', upload.single('video'), (req, res) => {
    const { courseId, title, duration } = req.body;
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No video provided' });

    const id = crypto.randomUUID();
    const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const url = `/uploads/${file.filename}`;

    db.run(`INSERT INTO lms_videos (id, courseId, title, duration, date, views, watched, url) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, courseId, title, duration || "00:00", date, 0, 0, url],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            db.run(`UPDATE courses SET videos = videos + 1 WHERE id = ?`, [courseId]);
            res.json({ id, title, duration, date, views: 0, watched: 0, url });
        }
    );
});

// Get Materials and Videos for Course
app.get('/api/lms/:courseId/materials', (req, res) => {
    db.all(`SELECT * FROM lms_materials WHERE courseId = ?`, [req.params.courseId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/lms/:courseId/videos', (req, res) => {
    db.all(`SELECT * FROM lms_videos WHERE courseId = ?`, [req.params.courseId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Delete material (Admin)
app.delete('/api/lms/materials/:id', (req, res) => {
    const { id } = req.params;
    db.get('SELECT url FROM lms_materials WHERE id = ?', [id], (err, row) => {
        if (row && row.url) {
            const filePath = path.join(__dirname, row.url);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
        db.run('DELETE FROM lms_materials WHERE id = ?', [id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
    });
});

// Delete video (Admin)
app.delete('/api/lms/videos/:id', (req, res) => {
    const { id } = req.params;
    db.get('SELECT url FROM lms_videos WHERE id = ?', [id], (err, row) => {
        if (row && row.url) {
            const filePath = path.join(__dirname, row.url);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
        db.run('DELETE FROM lms_videos WHERE id = ?', [id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
    });
});

// Update Video Watch Status (Student)
app.post('/api/lms/videos/:id/watch', (req, res) => {
    db.run(`UPDATE lms_videos SET watched = 1 WHERE id = ?`, [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Serve uploads folder statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Get discussions for course
app.get('/api/lms/:courseId/discussions', (req, res) => {
    db.all(`SELECT * FROM lms_discussions WHERE courseId = ?`, [req.params.courseId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Create discussion for course
app.post('/api/lms/:courseId/discussions', (req, res) => {
    const id = crypto.randomUUID();
    const { title, author, openAt, closeAt, description } = req.body;
    const { courseId } = req.params;
    
    db.run(`INSERT INTO lms_discussions (id, courseId, title, author, replies, lastActivity, likes, openAt, closeAt, description) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, courseId, title, author || "Unknown", 0, "Just now", 0, openAt || null, closeAt || null, description || null],
        async (err) => {
            if (err) return res.status(500).json({ error: err.message });
            
            // --- TRIGGER NOTIFICATIONS ---
            db.all(`SELECT u.email, u.phoneNumber, s.* FROM users u 
                    JOIN notification_settings s ON u.id = s.userId`, [], async (err, users) => {
                if (err) return;
                for (const user of users) {
                    const message = `A new discussion topic "${title}" has been opened by ${author}.`;
                    if (user.emailEnabled && user.email) {
                        await sendEmailNotification(user.email, `New Discussion: ${title}`, 'New Discussion Topic', message);
                    }
                    if (user.whatsappEnabled && user.phoneNumber) {
                        await sendWhatsAppNotification(user.phoneNumber, `💬 *LMS Discussion*\n\nNew topic: ${title}\nBy: ${author}\n\nJoin the conversation now!`);
                    }
                }
            });

            res.json({ id, courseId, title, author, replies: 0, lastActivity: "Just now", likes: 0, openAt: openAt || null, closeAt: closeAt || null, description: description || null });
        }
    );
});

// Update discussion schedule (Admin only)
app.patch('/api/lms/discussions/:id/schedule', (req, res) => {
    const { openAt, closeAt } = req.body;
    const { id } = req.params;
    db.run(`UPDATE lms_discussions SET openAt = ?, closeAt = ? WHERE id = ?`,
        [openAt || null, closeAt || null, id],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        }
    );
});

// Add discussion topic
app.post('/api/lms/discussions', (req, res) => {
    const { courseId, title, author, description } = req.body;
    const id = crypto.randomUUID();
    const lastActivity = "Just now";
    
    db.run(`INSERT INTO lms_discussions (id, courseId, title, author, replies, lastActivity, likes, description) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, courseId, title, author, 0, lastActivity, 0, description || null],
        async (err) => {
            if (err) return res.status(500).json({ error: err.message });
            
            // --- TRIGGER NOTIFICATIONS ---
            db.all(`SELECT u.email, u.phoneNumber, s.* FROM users u 
                    JOIN notification_settings s ON u.id = s.userId`, [], async (err, users) => {
                if (err) return;
                for (const user of users) {
                    const message = `A new discussion topic "${title}" has been started.`;
                    if (user.emailEnabled && user.email) {
                        await sendEmailNotification(user.email, `New Discussion: ${title}`, 'New Discussion Topic', message);
                    }
                    if (user.whatsappEnabled && user.phoneNumber) {
                        await sendWhatsAppNotification(user.phoneNumber, `💬 *LMS Discussion*\n\nTopic: ${title}\n\nJoin the conversation!`);
                    }
                }
            });

            res.json({ id, title, author, replies: 0, lastActivity, likes: 0, description: description || null });
        }
    );
});

// Get messages for a discussion
app.get('/api/lms/discussions/:discussionId/messages', (req, res) => {
    db.all(`SELECT * FROM lms_messages WHERE discussionId = ? ORDER BY timestamp ASC`, [req.params.discussionId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});


// Delete discussion (Admin)
app.delete('/api/lms/discussions/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM lms_discussions WHERE id = ?', [id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        db.run('DELETE FROM lms_messages WHERE discussionId = ?', [id], (err2) => {
            if (err2) console.error("Error deleting messages for discussion:", id);
            res.json({ success: true });
        });
    });
});

// Assignments API
app.get('/api/lms/:courseId/assignments', (req, res) => {
    db.all(`SELECT * FROM lms_assignments WHERE courseId = ?`, [req.params.courseId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/lms/assignments', (req, res) => {
    const { courseId, title, dueDate } = req.body;
    const id = crypto.randomUUID();
    db.get('SELECT students FROM courses WHERE id = ?', [courseId], (err, row) => {
        const total = row ? row.students : 0;
        db.run(`INSERT INTO lms_assignments (id, courseId, title, dueDate, status, submissions, total) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [id, courseId, title, dueDate, 'pending', 0, total],
            (err) => {
                if (err) return res.status(500).json({ error: err.message });
                db.run(`UPDATE courses SET pendingAssignments = pendingAssignments + 1 WHERE id = ?`, [courseId]);
                
                // --- TRIGGER NOTIFICATIONS ---
                // In a real app, you'd find all students enrolled in this course.
                // For this demo, we notify all registered students who have notifications enabled.
                db.all(`SELECT u.email, u.phoneNumber, s.* FROM users u 
                        JOIN notification_settings s ON u.id = s.userId`, [], async (err, users) => {
                    if (err) return;
                    for (const user of users) {
                        const message = `A new assignment "${title}" has been posted in your course. Due date: ${dueDate}.`;
                        
                        if (user.emailEnabled && user.email) {
                            await sendEmailNotification(
                                user.email, 
                                `New Assignment: ${title}`, 
                                'New Assignment Posted', 
                                message
                            );
                        }
                        
                        if (user.whatsappEnabled && user.phoneNumber) {
                            await sendWhatsAppNotification(
                                user.phoneNumber, 
                                `🔔 *LMS Alert*\n\nNew Assignment: ${title}\nDue: ${dueDate}\n\nCheck your dashboard for details.`
                            );
                        }
                    }
                });

                res.json({ id, courseId, title, dueDate, status: 'pending', submissions: 0, total });
            }
        );
    });
});

app.post('/api/lms/assignments/:id/submit', upload.single('file'), (req, res) => {
    const { id } = req.params;
    const { studentName } = req.body;
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No PDF provided' });

    const submissionId = crypto.randomUUID();
    const url = `/uploads/${file.filename}`;

    db.run(`INSERT INTO lms_submissions (id, assignmentId, studentName, fileName, url) VALUES (?, ?, ?, ?, ?)`,
        [submissionId, id, studentName, file.originalname, url],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            db.run(`UPDATE lms_assignments SET submissions = submissions + 1 WHERE id = ?`, [id]);
            res.json({ success: true, url });
        }
    );
});

// Socket.io LMS Chat Rooms
io.on('connection', (socket) => {
    console.log('User connected to LMS socket:', socket.id);

    // Join a discussion room
    socket.on('join_discussion', (discussionId) => {
        socket.join(discussionId);
        console.log(`Socket ${socket.id} joined discussion ${discussionId}`);
    });

    // Handle new message — enforce schedule server-side
    socket.on('send_message', (data) => {
        const { discussionId, author, content, role } = data;

        // Fetch the discussion to check schedule
        db.get('SELECT openAt, closeAt FROM lms_discussions WHERE id = ?', [discussionId], (err, disc) => {
            if (err || !disc) return socket.emit('message_error', { error: 'Discussion not found' });

            const now = new Date();
            const isAdmin = role === 'admin';
            if (!isAdmin) {
                if (disc.openAt && new Date(disc.openAt) > now) {
                    return socket.emit('message_error', { error: 'Discussion has not opened yet.' });
                }
                if (disc.closeAt && new Date(disc.closeAt) < now) {
                    return socket.emit('message_error', { error: 'Discussion is closed.' });
                }
            }

            const msgId = crypto.randomUUID();
            const timestamp = new Date().toISOString();
            db.run(`INSERT INTO lms_messages (id, discussionId, author, content, timestamp) VALUES (?, ?, ?, ?, ?)`,
                [msgId, discussionId, author, content, timestamp],
                (err) => {
                    if (!err) {
                        db.run(`UPDATE lms_discussions SET replies = replies + 1, lastActivity = 'Just now' WHERE id = ?`, [discussionId]);
                        const messagePayload = { id: msgId, discussionId, author, content, timestamp };
                        io.to(discussionId).emit('receive_message', messagePayload);
                    }
                }
            );
        });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected from LMS socket:', socket.id);
    });
});

server.listen(PORT, () => {
    console.log(`Backend listening on port ${PORT}`);
});

