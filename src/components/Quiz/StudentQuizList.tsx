import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Play, Clock, CheckCircle, AlertTriangle, FileText } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { quizService, Quiz, QuizSubmission } from "../../services/quizService";
import { adminService, Subject } from "../../services/adminService";
import { format, isPast, isFuture } from "date-fns";

interface StudentQuizListProps {
    onTake: (id: string) => void;
    onViewResult: (id: string) => void;
}

export function StudentQuizList({ onTake, onViewResult }: StudentQuizListProps) {
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [submissions, setSubmissions] = useState<QuizSubmission[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const studentId = "student-123"; // Demo Student ID

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        const allQuizzes = quizService.getQuizzes().filter(q => q.published);
        const mySubmissions = quizService.getSubmissions(); // In real app, filter by student ID

        setQuizzes(allQuizzes);
        setSubmissions(mySubmissions);
        setSubjects(adminService.getSubjects());
        setIsLoading(false);
    };

    const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || "Unknown";

    const getStatus = (quiz: Quiz) => {
        const submission = submissions.find(s => s.quizId === quiz.id);
        const now = new Date();
        const start = new Date(quiz.startDate);
        const end = new Date(quiz.endDate);

        if (submission) return { label: "Completed", color: "bg-green-100 text-green-700", action: "result" };
        if (now < start) return { label: "Upcoming", color: "bg-gray-100 text-gray-700", action: "wait" };
        if (now > end) return { label: "Missed", color: "bg-red-100 text-red-700", action: "none" };
        return { label: "Open", color: "bg-blue-100 text-blue-700", action: "take" };
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
                {quizzes.map((quiz, index) => {
                    const status = getStatus(quiz);
                    return (
                        <motion.div
                            key={quiz.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card className="h-full hover:shadow-lg transition-shadow border-t-4 border-t-blue-500 overflow-hidden group">
                                <CardContent className="p-6 flex flex-col h-full">
                                    <div className="flex justify-between items-start mb-4">
                                        <Badge variant="outline" className="mb-2">
                                            {getSubjectName(quiz.courseId)}
                                        </Badge>
                                        <Badge className={`${status.color} border-none`}>
                                            {status.label}
                                        </Badge>
                                    </div>

                                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                                        {quiz.title}
                                    </h3>
                                    <p className="text-gray-500 text-sm mb-6 flex-grow line-clamp-2">
                                        {quiz.description}
                                    </p>

                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center text-sm text-gray-500">
                                            <Clock className="w-4 h-4 mr-2" />
                                            {quiz.durationMinutes} Minutes
                                        </div>
                                        <div className="flex items-center text-sm text-gray-500">
                                            <AlertTriangle className="w-4 h-4 mr-2" />
                                            Due: {format(new Date(quiz.endDate), "MMM d, h:mm a")}
                                        </div>
                                    </div>

                                    <div className="mt-auto">
                                        {status.action === 'take' && (
                                            <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => onTake(quiz.id)}>
                                                Start Quiz <Play className="w-4 h-4 ml-2" />
                                            </Button>
                                        )}
                                        {status.action === 'result' && (
                                            <Button variant="outline" className="w-full" onClick={() => onViewResult(quiz.id)}>
                                                View Results <FileText className="w-4 h-4 ml-2" />
                                            </Button>
                                        )}
                                        {status.action === 'wait' && (
                                            <Button variant="secondary" disabled className="w-full opacity-50">
                                                Opens {format(new Date(quiz.startDate), "MMM d")}
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
            {quizzes.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-500">
                    No quizzes available at the moment.
                </div>
            )}
        </div>
    );
}
