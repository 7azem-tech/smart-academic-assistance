import { Subject } from './adminService';

export type QuestionType = 'multiple-choice' | 'true-false' | 'short-answer' | 'essay';

export interface Question {
    id: string;
    type: QuestionType;
    text: string;
    options?: string[]; // For MC
    correctAnswer?: string; // For auto-grading (stringified for consistency)
    points: number;
}

export interface Quiz {
    id: string;
    title: string;
    description: string;
    courseId: string; // Link to Subject
    durationMinutes: number;
    totalPoints: number; // Sum of question points
    maxScore?: number; // Optional override (e.g. 100%)
    startDate: string;
    endDate: string;
    questions: Question[];
    published: boolean;
    createdBy: string;
    createdAt: string;
}

export interface QuizSubmission {
    id: string;
    quizId: string;
    studentId: string;
    answers: Record<string, string>; // questionId -> answer
    score: number;
    questionScores: Record<string, number>; // questionId -> score
    startedAt: string;
    submittedAt: string;
    status: 'graded' | 'pending'; // Pending if essay needs manual grading
    feedback?: string;
}

const STORAGE_KEYS = {
    QUIZZES: 'app_quizzes_v1',
    SUBMISSIONS: 'app_submissions_v1',
    kI_BANKS: 'app_question_banks_v1' // Optional: for question bank feature
};

class QuizService {
    private static instance: QuizService;

    private constructor() {
        this.init();
    }

    public static getInstance(): QuizService {
        if (!QuizService.instance) {
            QuizService.instance = new QuizService();
        }
        return QuizService.instance;
    }

    private init() {
        if (!localStorage.getItem(STORAGE_KEYS.QUIZZES)) {
            localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify([]));
        }
        if (!localStorage.getItem(STORAGE_KEYS.SUBMISSIONS)) {
            localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify([]));
        }
    }

    // --- Quiz Management (Admin) ---

    getQuizzes(): Quiz[] {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.QUIZZES) || '[]');
    }

    getQuizById(id: string): Quiz | undefined {
        const quizzes = this.getQuizzes();
        return quizzes.find(q => q.id === id);
    }

    createQuiz(quiz: Omit<Quiz, 'id' | 'createdAt'>): Quiz {
        const quizzes = this.getQuizzes();
        const newQuiz: Quiz = {
            ...quiz,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString()
        };
        quizzes.push(newQuiz);
        localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(quizzes));
        return newQuiz;
    }

    updateQuiz(id: string, updates: Partial<Quiz>): Quiz {
        const quizzes = this.getQuizzes();
        const index = quizzes.findIndex(q => q.id === id);
        if (index === -1) throw new Error("Quiz not found");

        const updatedQuiz = { ...quizzes[index], ...updates };
        quizzes[index] = updatedQuiz;
        localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(quizzes));
        return updatedQuiz;
    }

    deleteQuiz(id: string) {
        let quizzes = this.getQuizzes();
        quizzes = quizzes.filter(q => q.id !== id);
        localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(quizzes));
    }

    // --- Student / Submission ---

    submitQuiz(submission: Omit<QuizSubmission, 'id' | 'submittedAt' | 'score' | 'status' | 'questionScores'> & { startedAt?: string }): QuizSubmission {
        const submissions = this.getSubmissions();
        const quiz = this.getQuizById(submission.quizId);
        if (!quiz) throw new Error("Quiz not found");

        // Auto-grading logic
        let totalScore = 0;
        let requiresManualGrading = false;
        const questionScores: Record<string, number> = {};

        quiz.questions.forEach(q => {
            const studentAnswer = submission.answers[q.id];
            let points = 0;

            if (q.type === 'essay') {
                requiresManualGrading = true;
            } else if (q.correctAnswer) {
                // Aggressive normalization: remove all whitespace and lowercase
                // This handles cases like " Option 1" vs "Option 1" vs "Option&nbsp;1"
                const normalize = (s: string) => String(s || "").replace(/\s+/g, '').toLowerCase();

                const normStudent = normalize(studentAnswer);
                const normCorrect = normalize(q.correctAnswer);

                // Debug logging
                console.log(`[Grading] QID: ${q.id.slice(0, 8)} | Student: "${normStudent}" | Correct: "${normCorrect}" | Match: ${normStudent === normCorrect}`);

                if (normStudent === normCorrect) {
                    // Ensure points are treated as number
                    points = Number(q.points);

                    // Safety check if points is NaN
                    if (isNaN(points)) points = 0;
                }
            }

            questionScores[q.id] = points;
            totalScore += points;
        });

        // If maxScore is defined, scale the totalScore
        let finalScore = totalScore;

        // Ensure accurate scaling
        // Force conversion to number to avoid string concatenation
        const totalPossiblePoints = quiz.questions.reduce((acc, curr) => acc + (Number(curr.points) || 0), 0);
        const maxScore = Number(quiz.maxScore) || totalPossiblePoints;

        if (maxScore > 0 && totalPossiblePoints > 0) {
            // Scale: (Points Obtained / Total Points Possible) * Max Score
            // Example: (8 points / 10 total) * 100% = 80
            finalScore = Math.round((totalScore / totalPossiblePoints) * maxScore);
        } else {
            finalScore = totalScore;
        }

        const newSubmission: QuizSubmission = {
            ...submission,
            id: crypto.randomUUID(),
            startedAt: submission.startedAt || new Date().toISOString(), // Fallback if not provided
            submittedAt: new Date().toISOString(),
            score: finalScore,
            questionScores,
            status: requiresManualGrading ? 'pending' : 'graded'
        };

        submissions.push(newSubmission);
        localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(submissions));
        return newSubmission;
    }

    getSubmissions(quizId?: string): QuizSubmission[] {
        const submissions: QuizSubmission[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.SUBMISSIONS) || '[]');
        if (quizId) {
            return submissions.filter(s => s.quizId === quizId);
        }
        return submissions;
    }

    getStudentSubmissions(studentId: string): QuizSubmission[] {
        const submissions = this.getSubmissions();
        return submissions.filter(s => s.studentId === studentId);
    }

    // --- Analytics ---

    getQuizAnalytics(quizId: string) {
        const submissions = this.getSubmissions(quizId);
        if (submissions.length === 0) return null;

        const scores = submissions.map(s => s.score);
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        const maxScore = Math.max(...scores);
        const minScore = Math.min(...scores);

        return {
            totalAttempts: submissions.length,
            averageScore: avgScore,
            highestScore: maxScore,
            lowestScore: minScore
        };
    }
}

export const quizService = QuizService.getInstance();
