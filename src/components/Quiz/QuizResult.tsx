import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { CheckCircle, XCircle, ChevronLeft, Award, RefreshCcw } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { quizService, Quiz, QuizSubmission } from "../../services/quizService";
import { Progress } from "../ui/progress";

interface QuizResultProps {
    quizId: string;
    onBack: () => void;
}

export function QuizResult({ quizId, onBack }: QuizResultProps) {
    const [submission, setSubmission] = useState<QuizSubmission | null>(null);
    const [quiz, setQuiz] = useState<Quiz | null>(null);

    useEffect(() => {
        const q = quizService.getQuizById(quizId);
        const sub = quizService.getSubmissions(quizId).find(s => s.studentId === 'student-123'); // Demo ID

        if (q) setQuiz(q);
        if (sub) setSubmission(sub);
    }, [quizId]);

    if (!submission || !quiz) return <div className="text-center p-8">Loading results...</div>;

    // Calculate maximum possible score
    const totalPossiblePoints = quiz.questions.reduce((acc, curr) => acc + (Number(curr.points) || 0), 0);
    const max = Number(quiz.maxScore) || totalPossiblePoints;

    const percentage = max > 0 ? Math.round((submission.score / max) * 100) : 0;

    const getFeedbackMessage = (pct: number) => {
        if (pct >= 90) return "Excellent!";
        if (pct >= 75) return "Great Job!";
        if (pct >= 50) return "Good Effort!";
        return "Keep Practicing!";
    };

    // Determine status color based on percentage
    const isSuccess = percentage >= 50;
    const statusColor = percentage >= 90 ? 'text-green-600'
        : percentage >= 75 ? 'text-blue-600'
            : percentage >= 50 ? 'text-yellow-600'
                : 'text-red-600';

    const bgStatusColor = percentage >= 90 ? 'bg-green-100'
        : percentage >= 75 ? 'bg-blue-100'
            : percentage >= 50 ? 'bg-yellow-100'
                : 'bg-red-100';

    const renderTimeSpent = () => {
        if (!submission.startedAt) return "N/A";
        const start = new Date(submission.startedAt);
        const end = new Date(submission.submittedAt);
        const diffMs = end.getTime() - start.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffSecs = Math.round((diffMs % 60000) / 1000);
        return `${diffMins}m ${diffSecs}s`;
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 p-4">
            <Button variant="ghost" onClick={onBack} className="mb-4">
                <ChevronLeft className="w-4 h-4 mr-2" /> Back to Quizzes
            </Button>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12 bg-white rounded-3xl shadow-xl border border-gray-100 relative overflow-hidden"
            >
                <div className={`absolute top-0 left-0 w-full h-2 ${percentage >= 50 ? 'bg-green-500' : 'bg-red-500'}`} />

                <div className="relative z-10">
                    <div className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center mb-6 shadow-lg ${bgStatusColor} ${statusColor}`}>
                        {percentage >= 50 ? <Award className="w-12 h-12" /> : <RefreshCcw className="w-10 h-10" />}
                    </div>

                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        {getFeedbackMessage(percentage)}
                    </h1>
                    <p className="text-gray-500 text-lg max-w-md mx-auto mb-8">
                        You scored <span className={`font-bold ${statusColor}`}>{submission.score}</span> out of <span className="font-bold text-gray-900">{max}</span> points.
                    </p>

                    <div className="flex justify-center items-center gap-12 text-center">
                        <div>
                            <div className="text-3xl font-bold text-gray-900">{percentage}%</div>
                            <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">Score</div>
                        </div>
                        <div className="h-10 w-px bg-gray-200" />
                        <div>
                            <div className="text-3xl font-bold text-gray-900">{quiz.questions.length}</div>
                            <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">Questions</div>
                        </div>
                        <div className="h-10 w-px bg-gray-200" />
                        <div>
                            <div className="text-3xl font-bold text-gray-900">
                                {renderTimeSpent()}
                            </div>
                            <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">Time Spent</div>
                        </div>
                    </div>
                </div>

                {/* Confidencne particles or bg decoration could go here */}
            </motion.div>

            <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">Detailed Analysis</h2>
                {quiz.questions.map((q, index) => {
                    // Check if questionScores exists, use strict equality with undefined
                    const earned = submission.questionScores && submission.questionScores[q.id] !== undefined
                        ? submission.questionScores[q.id]
                        : 0;

                    // For display, isCorrect is simpler: did they get full points?
                    // Note: for essay, it might be pending.
                    const isCorrect = earned === (Number(q.points) || 0) && q.type !== 'essay';
                    const studentAnswer = submission.answers[q.id];

                    if (q.type === 'essay') return null; // Skip manual grading for now in auto view

                    return (
                        <Card key={q.id} className={`border-l-4 ${isCorrect ? 'border-l-green-500' : 'border-l-red-500'}`}>
                            <CardHeader>
                                <CardTitle className="flex justify-between items-start text-base">
                                    <span className="leading-relaxed">
                                        <span className="text-gray-400 mr-2">Q{index + 1}.</span>
                                        {q.text} <span className="text-gray-400 text-sm font-normal ml-2">({earned}/{q.points} pts)</span>
                                    </span>
                                    <Badge variant={isCorrect ? "default" : "destructive"}>
                                        {isCorrect ? "Correct" : "Incorrect"}
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <div className="text-gray-500 text-xs uppercase mb-1">Your Answer</div>
                                        <div className={`font-medium ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                                            {studentAnswer?.toString() || "No Answer"}
                                        </div>
                                    </div>
                                    {!isCorrect && (
                                        <div className="p-3 bg-blue-50/50 rounded-lg">
                                            <div className="text-gray-500 text-xs uppercase mb-1">Correct Answer</div>
                                            <div className="font-medium text-blue-700">
                                                {q.correctAnswer?.toString()}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}

function formatDuration(minutes: number) {
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
}
