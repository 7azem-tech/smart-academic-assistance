import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Save, Plus, Trash2, Check, GripVertical, AlertCircle, XCircle } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Switch } from "../ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { adminService, Subject } from "../../services/adminService";
import { quizService, Quiz, Question, QuestionType } from "../../services/quizService";
import { toast } from "sonner";
import { Checkbox } from "../ui/checkbox";

interface QuizEditorProps {
    quizId: string | null;
    onBack: () => void;
}

export function QuizEditor({ quizId, onBack }: QuizEditorProps) {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [quiz, setQuiz] = useState<Omit<Quiz, 'id' | 'createdAt'>>({
        title: "",
        description: "",
        courseId: "",
        durationMinutes: 30,
        totalPoints: 0,
        maxScore: 100, // Default to 100% or similar
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        questions: [],
        published: false,
        createdBy: 'admin'
    });

    useEffect(() => {
        setSubjects(adminService.getSubjects());
        if (quizId) {
            const existing = quizService.getQuizById(quizId);
            if (existing) {
                const { id, createdAt, ...rest } = existing;
                setQuiz(rest);
            }
        }
    }, [quizId]);

    const handleSave = () => {
        if (!quiz.title || !quiz.courseId) {
            toast.error("Please fill in Title and Subject");
            return;
        }

        const cleanQuestions = quiz.questions.map(q => {
            const cleanOptions = q.options?.map(o => o.trim()) || [];
            let cleanCorrect = (q.correctAnswer || "").trim();

            // If correct answer was trimmed, make sure it matches one of the trimmed options
            if (q.type === 'multiple-choice' && cleanCorrect) {
                // Find if there's a matching option after trim
                // If the original correct answer matched an original option, the trimmed versions should match too.
                // But just to be safe, if we can't find exact match, we might have an issue.
                // For now, just trust the trim.
            }

            return {
                ...q,
                text: q.text.trim(),
                options: cleanOptions,
                correctAnswer: cleanCorrect,
                points: Number(q.points) || 0
            };
        });

        // Calculate total points from questions
        const questionsTotal = cleanQuestions.reduce((sum, q) => sum + q.points, 0);
        // If maxScore is not set or 0, use questionsTotal as default
        const quizToSave = {
            ...quiz,
            questions: cleanQuestions,
            totalPoints: questionsTotal,
            maxScore: quiz.maxScore || questionsTotal
        };

        if (quizId) {
            quizService.updateQuiz(quizId, quizToSave);
            toast.success("Quiz updated successfully");
        } else {
            quizService.createQuiz(quizToSave);
            toast.success("Quiz created successfully");
        }
        onBack();
    };

    const addQuestion = () => {
        const newQ: Question = {
            id: crypto.randomUUID(),
            type: 'multiple-choice',
            text: "",
            options: ["Option 1", "Option 2"],
            correctAnswer: "",
            points: 1
        };
        setQuiz({ ...quiz, questions: [...quiz.questions, newQ] });
    };

    const updateQuestion = (index: number, updates: Partial<Question>) => {
        const newQuestions = [...quiz.questions];
        newQuestions[index] = { ...newQuestions[index], ...updates };
        setQuiz({ ...quiz, questions: newQuestions });
    };

    const removeQuestion = (index: number) => {
        const newQuestions = [...quiz.questions];
        newQuestions.splice(index, 1);
        setQuiz({ ...quiz, questions: newQuestions });
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto pb-20">
            {/* Header */}
            <div className="flex items-center justify-between sticky top-0 bg-[#F9FAFB]/80 backdrop-blur-md py-4 z-10 border-b border-gray-200/50">
                <Button variant="ghost" onClick={onBack} className="gap-2">
                    <ArrowLeft className="w-4 h-4" /> Back
                </Button>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Label htmlFor="published" className="cursor-pointer">Publish Immediately</Label>
                        <Switch
                            id="published"
                            checked={quiz.published}
                            onCheckedChange={(c: boolean) => setQuiz({ ...quiz, published: c })}
                        />
                    </div>
                    <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Save className="w-4 h-4 mr-2" /> Save Quiz
                    </Button>
                </div>
            </div>

            {/* Quiz Settings */}
            <Card className="border-none shadow-lg bg-white/60">
                <CardHeader>
                    <CardTitle className="text-xl text-blue-900">Quiz Settings</CardTitle>
                    <CardDescription>Configure basic quiz information and timing.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Quiz Title</Label>
                            <Input
                                value={quiz.title}
                                onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
                                placeholder="e.g. Midterm Exam"
                                className="font-medium text-lg"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Subject</Label>
                            <Select
                                value={quiz.courseId}
                                onValueChange={(val: string) => setQuiz({ ...quiz, courseId: val })}
                            >
                                <SelectTrigger className="h-12 border-gray-200 bg-white/50 backdrop-blur-sm transition-all duration-300 hover:border-blue-400 hover:shadow-md focus:ring-2 focus:ring-blue-100 focus:border-blue-500 rounded-xl">
                                    <SelectValue placeholder="Select Course" />
                                </SelectTrigger>
                                <SelectContent
                                    className="border border-gray-100 shadow-xl bg-white/95 backdrop-blur-xl rounded-xl animate-in fade-in-0 zoom-in-95 duration-200 overflow-hidden max-h-[300px]"
                                    position="popper"
                                    sideOffset={5}
                                >
                                    {subjects.map(s => (
                                        <SelectItem
                                            key={s.id}
                                            value={s.id}
                                            className="cursor-pointer py-3 px-4 focus:bg-blue-50 focus:text-blue-700 transition-colors duration-200"
                                        >
                                            <span className="font-medium">{s.name}</span> <span className="text-gray-400 text-xs ml-1">({s.code})</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                            value={quiz.description}
                            onChange={(e) => setQuiz({ ...quiz, description: e.target.value })}
                            placeholder="Instructions for students..."
                            className="h-20 resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Duration (Minutes)</Label>
                            <Input
                                type="number"
                                min="1"
                                value={quiz.durationMinutes}
                                onChange={(e) => setQuiz({ ...quiz, durationMinutes: parseInt(e.target.value) })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Total Grade (Out of)</Label>
                            <Input
                                type="number"
                                min="1"
                                value={quiz.maxScore}
                                onChange={(e) => setQuiz({ ...quiz, maxScore: parseInt(e.target.value) })}
                                placeholder="e.g. 100"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Start Date</Label>
                            <Input
                                type="datetime-local"
                                value={quiz.startDate.slice(0, 16)}
                                onChange={(e) => setQuiz({ ...quiz, startDate: new Date(e.target.value).toISOString() })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>End Date</Label>
                            <Input
                                type="datetime-local"
                                value={quiz.endDate.slice(0, 16)}
                                onChange={(e) => setQuiz({ ...quiz, endDate: new Date(e.target.value).toISOString() })}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Questions Editor */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-xl font-bold text-gray-800">Questions ({quiz.questions.length})</h2>
                    <Button variant="outline" onClick={addQuestion} className="border-blue-200 text-blue-600 hover:bg-blue-50">
                        <Plus className="w-4 h-4 mr-2" /> Add Question
                    </Button>
                </div>

                <AnimatePresence mode="popLayout">
                    {quiz.questions.map((q, index) => (
                        <motion.div
                            key={q.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Card className="border border-gray-100 hover:border-blue-100 transition-all shadow-sm">
                                <CardContent className="p-6 space-y-4">
                                    <div className="flex items-start gap-4">
                                        <div className="mt-2 text-gray-400 cursor-move hover:text-gray-600">
                                            <GripVertical className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 space-y-4">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <Input
                                                        value={q.text}
                                                        onChange={(e) => updateQuestion(index, { text: e.target.value })}
                                                        placeholder={`Question ${index + 1}`}
                                                        className="font-medium text-lg border-transparent focus:border-gray-200 hover:bg-gray-50 bg-transparent px-0 rounded-none border-b italic"
                                                    />
                                                </div>
                                                <div className="w-[180px]">
                                                    <Select
                                                        value={q.type}
                                                        onValueChange={(val: QuestionType) => updateQuestion(index, { type: val })}
                                                    >
                                                        <SelectTrigger className="border-transparent bg-gray-50 hover:bg-white hover:border-blue-200 hover:shadow-sm transition-all duration-300 rounded-lg">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="border border-gray-100 shadow-lg bg-white/95 backdrop-blur-xl rounded-xl animate-in fade-in-0 zoom-in-95 duration-200">
                                                            <SelectItem value="multiple-choice" className="cursor-pointer py-2.5 focus:bg-blue-50 focus:text-blue-600">Multiple Choice</SelectItem>
                                                            <SelectItem value="true-false" className="cursor-pointer py-2.5 focus:bg-blue-50 focus:text-blue-600">True / False</SelectItem>
                                                            <SelectItem value="short-answer" className="cursor-pointer py-2.5 focus:bg-blue-50 focus:text-blue-600">Short Answer</SelectItem>
                                                            <SelectItem value="essay" className="cursor-pointer py-2.5 focus:bg-blue-50 focus:text-blue-600">Essay</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="w-[80px]">
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        value={q.points}
                                                        onChange={(e) => updateQuestion(index, { points: parseInt(e.target.value) || 0 })}
                                                        placeholder="Pts"
                                                        className="text-right"
                                                    />
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-gray-400 hover:text-red-500"
                                                    onClick={() => removeQuestion(index)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>

                                            <div className="pl-2 border-l-2 border-gray-100 py-2">
                                                {q.type === 'multiple-choice' && (
                                                    <div className="space-y-2">
                                                        {q.options?.map((opt, optIndex) => (
                                                            <div key={optIndex} className="flex items-center gap-3">
                                                                <div
                                                                    className={`w-5 h-5 rounded-full border flex items-center justify-center cursor-pointer transition-colors ${q.correctAnswer === opt ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-gray-400'}`}
                                                                    onClick={() => updateQuestion(index, { correctAnswer: opt })}
                                                                >
                                                                    {q.correctAnswer === opt && <Check className="w-3 h-3" />}
                                                                </div>
                                                                <Input
                                                                    value={opt}
                                                                    onChange={(e) => {
                                                                        const newText = e.target.value;
                                                                        const newOptions = [...(q.options || [])];

                                                                        if (q.correctAnswer === opt) {
                                                                            updateQuestion(index, { correctAnswer: newText });
                                                                        }
                                                                        newOptions[optIndex] = newText;
                                                                        updateQuestion(index, { options: newOptions });
                                                                    }}
                                                                    className="h-8 text-sm"
                                                                />
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-6 w-6 text-gray-400"
                                                                    onClick={() => {
                                                                        const newOptions = [...(q.options || [])];
                                                                        newOptions.splice(optIndex, 1);
                                                                        updateQuestion(index, { options: newOptions });
                                                                    }}
                                                                >
                                                                    <XCircle className="w-3 h-3" />
                                                                </Button>
                                                            </div>
                                                        ))}
                                                        <Button
                                                            variant="link"
                                                            className="text-blue-500 h-8 px-0 text-xs"
                                                            onClick={() => updateQuestion(index, { options: [...(q.options || []), `Option ${(q.options?.length || 0) + 1}`] })}
                                                        >
                                                            + Add Option
                                                        </Button>
                                                    </div>
                                                )}

                                                {q.type === 'true-false' && (
                                                    <div className="flex gap-4">
                                                        {["True", "False"].map(val => (
                                                            <Button
                                                                key={val}
                                                                variant={q.correctAnswer === val ? "default" : "outline"}
                                                                className={q.correctAnswer === val ? "bg-green-600 hover:bg-green-700" : ""}
                                                                onClick={() => updateQuestion(index, { correctAnswer: val })}
                                                            >
                                                                {val}
                                                            </Button>
                                                        ))}
                                                    </div>
                                                )}

                                                {q.type === 'short-answer' && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-gray-500">Correct Answer:</span>
                                                        <Input
                                                            value={q.correctAnswer as string || ""}
                                                            onChange={(e) => updateQuestion(index, { correctAnswer: e.target.value })}
                                                            placeholder="Enter the exact answer for auto-grading"
                                                            className="max-w-md border-dashed"
                                                        />
                                                    </div>
                                                )}

                                                {q.type === 'essay' && (
                                                    <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-2 rounded text-sm">
                                                        <AlertCircle className="w-4 h-4" />
                                                        <span>Essay questions require manual grading.</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
