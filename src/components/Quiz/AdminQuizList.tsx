import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Edit, Trash2, CheckCircle, XCircle, Search, BarChart3, Eye, Download } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../ui/table";
import { quizService, Quiz } from "../../services/quizService";
import { adminService, Subject } from "../../services/adminService";
import { toast } from "sonner";
import { format } from "date-fns";

interface AdminQuizListProps {
    onCreate: () => void;
    onEdit: (id: string) => void;
}

export function AdminQuizList({ onCreate, onEdit }: AdminQuizListProps) {
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        setQuizzes(quizService.getQuizzes());
        setSubjects(adminService.getSubjects());
        setIsLoading(false);
    };

    const handleDelete = (id: string) => {
        if (confirm("Are you sure you want to delete this quiz? This cannot be undone.")) {
            quizService.deleteQuiz(id);
            setQuizzes(quizService.getQuizzes());
            toast.success("Quiz deleted successfully");
        }
    };

    const handleTogglePublish = (quiz: Quiz) => {
        const updated = quizService.updateQuiz(quiz.id, { published: !quiz.published });
        setQuizzes(quizzes.map(q => q.id === quiz.id ? updated : q));
        toast.info(updated.published ? "Quiz published" : "Quiz unpublished");
    };

    const handleExportCSV = (quizId: string) => {
        const quiz = quizzes.find(q => q.id === quizId);
        const submissions = quizService.getSubmissions(quizId);
        if (!quiz || submissions.length === 0) {
            toast.error("No submissions to export");
            return;
        }

        // Dynamic headers for questions
        const questionHeaders = quiz.questions.map((_, i) => `Q${i + 1} (${quiz.questions[i].points}pts)`);

        const headers = [
            "Student ID",
            "Subject",
            "Started At",
            "Submitted At",
            "Duration (min)",
            "Score Obtained",
            "Total Points",
            "Status",
            ...questionHeaders
        ];

        const rows = submissions.map(s => {
            const subjectName = getSubjectName(quiz.courseId);
            const started = s.startedAt ? new Date(s.startedAt) : null;
            const submitted = new Date(s.submittedAt);

            // Calculate duration
            let durationMin = "N/A";
            if (started) {
                const diffMs = submitted.getTime() - started.getTime();
                durationMin = Math.round(diffMs / 60000).toString();
            }

            // Calculate per-question scores
            const qScores = quiz.questions.map(q => {
                // Use stored score if available
                if (s.questionScores && s.questionScores[q.id] !== undefined) {
                    return s.questionScores[q.id];
                }

                // Fallback (re-calculate) for older submissions
                if (q.type === 'essay') return 'Pending';

                const studentAns = s.answers[q.id];
                if (!studentAns) return 0;

                // Simple normalization check matching backend
                const isCorrect = q.correctAnswer &&
                    String(studentAns).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase();

                return isCorrect ? q.points : 0;
            });

            return [
                s.studentId,
                subjectName,
                started ? format(started, 'yyyy-MM-dd HH:mm:ss') : "N/A",
                format(submitted, 'yyyy-MM-dd HH:mm:ss'),
                durationMin,
                s.score,
                quiz.totalPoints,
                s.status,
                ...qScores
            ];
        });

        const csvContent = [
            headers.join(","),
            ...rows.map(r => r.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${quiz.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_results.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success("Exported detailed CSV successfully");
    };

    const getSubjectName = (id: string) => {
        return subjects.find(s => s.id === id)?.name || "Unknown Subject";
    };

    const filteredQuizzes = quizzes.filter(q =>
        q.title.toLowerCase().includes(search.toLowerCase()) ||
        getSubjectName(q.courseId).toLowerCase().includes(search.toLowerCase())
    );

    if (isLoading) {
        return <div className="p-8 text-center">Loading quizzes...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="relative max-w-sm w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="Search quizzes..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative z-50 pointer-events-auto"
                >
                    <Button
                        onClick={onCreate}
                        className="relative overflow-hidden bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 group px-6 py-5 rounded-xl border border-white/10"
                    >
                        <motion.div
                            className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"
                        />
                        <motion.div
                            className="absolute -inset-full top-0 block h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 left-[-100%]"
                            animate={{ left: "200%" }}
                            transition={{ repeat: Infinity, duration: 3, ease: "linear", repeatDelay: 1 }}
                        />
                        <div className="relative flex items-center gap-2">
                            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                            <span className="tracking-wide">Create New Quiz</span>
                        </div>
                    </Button>
                </motion.div>
            </div>

            <Card className="border-none shadow-md overflow-hidden bg-white/50 backdrop-blur-sm">
                <Table>
                    <TableHeader className="bg-gray-50/50">
                        <TableRow>
                            <TableHead>Quiz Title</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead>Start Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-center">Attempts</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <AnimatePresence mode='popLayout'>
                            {filteredQuizzes.length > 0 ? (
                                filteredQuizzes.map((quiz, index) => (
                                    <motion.tr
                                        key={quiz.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="group hover:bg-gray-50/50 transition-colors border-b"
                                    >
                                        <TableCell className="font-medium text-gray-900">
                                            {quiz.title}
                                            <div className="text-xs text-gray-500 truncate max-w-[200px]">{quiz.description}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                {getSubjectName(quiz.courseId)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{quiz.durationMinutes} mins</TableCell>
                                        <TableCell className="text-sm text-gray-500">
                                            {format(new Date(quiz.startDate), 'MMM dd, yyyy HH:mm')}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleTogglePublish(quiz)}>
                                                {quiz.published ? (
                                                    <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200 cursor-pointer">Published</Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="cursor-pointer">Draft</Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="secondary" className="rounded-full px-2">
                                                {quizService.getSubmissions(quiz.id).length}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:bg-blue-50 rounded-full" onClick={() => onEdit(quiz.id)}>
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:bg-green-50 rounded-full" title="Export CSV" onClick={() => handleExportCSV(quiz.id)}>
                                                    <Download className="w-4 h-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:bg-red-50 rounded-full" onClick={() => handleDelete(quiz.id)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </motion.tr>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-32 text-center text-gray-500">
                                        No quizzes found. Create one to get started.
                                    </TableCell>
                                </TableRow>
                            )}
                        </AnimatePresence>
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}
