import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AdminQuizList } from "./AdminQuizList";
import { StudentQuizList } from "./StudentQuizList";
import { QuizEditor } from "./QuizEditor";
import { QuizTaker } from "./QuizTaker";
import { QuizResult } from "./QuizResult";
import { Quiz } from "../../services/quizService";

type QuizView = 'list' | 'editor' | 'taker' | 'result';

export function QuizDashboard() {
    // State to manage current view
    const [view, setView] = useState<QuizView>('list');
    const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<string>('student');

    useEffect(() => {
        const role = localStorage.getItem("userRole") || 'student';
        setUserRole(role);
    }, []);

    const handleEditQuiz = (id: string) => {
        setSelectedQuizId(id);
        setView('editor');
    };

    const handleCreateQuiz = () => {
        setSelectedQuizId(null);
        setView('editor');
    };

    const handleTakeQuiz = (id: string) => {
        setSelectedQuizId(id);
        setView('taker');
    };

    const handleViewResult = (id: string) => {
        setSelectedQuizId(id);
        setView('result');
    };

    const handleBack = () => {
        setSelectedQuizId(null);
        setView('list');
    };

    return (
        <div className="p-1 min-h-screen">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-8"
            >
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                    {userRole === 'admin' ? 'Quiz Management' : 'My Quizzes'}
                </h1>
                <p className="text-gray-500">
                    {userRole === 'admin'
                        ? 'Create, manage, and grade assessments.'
                        : 'Take scheduled quizzes and view your performance.'}
                </p>
            </motion.div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={view}
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.3 }}
                >
                    {view === 'list' && (
                        userRole === 'admin' ? (
                            <AdminQuizList
                                onCreate={handleCreateQuiz}
                                onEdit={handleEditQuiz}
                            />
                        ) : (
                            <StudentQuizList
                                onTake={handleTakeQuiz}
                                onViewResult={handleViewResult}
                            />
                        )
                    )}

                    {view === 'editor' && userRole === 'admin' && (
                        <QuizEditor
                            quizId={selectedQuizId}
                            onBack={handleBack}
                        />
                    )}

                    {view === 'taker' && selectedQuizId && (
                        <QuizTaker
                            quizId={selectedQuizId}
                            onFinish={handleBack}
                        />
                    )}

                    {view === 'result' && selectedQuizId && (
                        <QuizResult
                            quizId={selectedQuizId}
                            onBack={handleBack}
                        />
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
