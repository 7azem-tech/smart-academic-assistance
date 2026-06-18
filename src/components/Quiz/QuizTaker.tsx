import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Clock, CheckCircle, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { Card, CardContent } from "../ui/card";
import { quizService, Quiz, Question } from "../../services/quizService";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";

interface QuizTakerProps {
    quizId: string;
    onFinish: () => void;
}

export function QuizTaker({ quizId, onFinish }: QuizTakerProps) {
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const startTimeRef = useState<string>(new Date().toISOString())[0];

    useEffect(() => {
        const q = quizService.getQuizById(quizId);
        if (q) {
            setQuiz(q);
            setTimeLeft(q.durationMinutes * 60);
        } else {
            toast.error("Quiz not found");
            onFinish();
        }

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [quizId]);

    useEffect(() => {
        if (!timeLeft) return;
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft]);

    const handleAnswer = (val: string) => {
        if (!quiz) return;
        const currentQ = quiz.questions[currentQuestionIndex];
        setAnswers(prev => ({ ...prev, [currentQ.id]: val }));
    };

    const handleSubmit = async () => {
        if (!quiz || isSubmitting) return;
        setIsSubmitting(true);

        try {
            await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network
            quizService.submitQuiz({
                quizId: quiz.id,
                studentId: 'student-123', // Demo ID
                answers: answers,
                startedAt: startTimeRef
            });
            toast.success("Quiz submitted successfully!");
            onFinish();
        } catch (error) {
            toast.error("Submission failed. Please try again.");
            setIsSubmitting(false);
        }
    };

    if (!quiz) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-blue-600 w-12 h-12 mb-4" />
                <p className="text-gray-500 font-medium animate-pulse">Loading assessments...</p>
            </div>
        );
    }

    const currentQuestion = quiz.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return (
        <div className="max-w-3xl mx-auto py-8 px-4">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100 sticky top-0 z-10">
                <div>
                    <h2 className="text-lg font-bold text-gray-800">{quiz.title}</h2>
                    <div className="text-sm text-gray-500">Question {currentQuestionIndex + 1} of {quiz.questions.length}</div>
                </div>
                <div className={`flex items-center gap-2 font-mono text-xl font-bold px-4 py-2 rounded-lg ${timeLeft < 60 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-blue-50 text-blue-600'}`}>
                    <Clock className="w-5 h-5" />
                    {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </div>
            </div>

            <Progress value={progress} className="h-2 mb-8 bg-gray-100" />

            {/* Question Card */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentQuestionIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                >
                    <Card className="min-h-[400px] flex flex-col justify-between border-t-4 border-t-blue-500 shadow-lg">
                        <CardContent className="p-8">
                            <h3 className="text-xl font-medium text-gray-900 mb-8 leading-relaxed">
                                {currentQuestion.text}
                            </h3>

                            <div className="space-y-4">
                                {currentQuestion.type === 'multiple-choice' && (
                                    <RadioGroup value={answers[currentQuestion.id] || ""} onValueChange={handleAnswer} className="space-y-3">
                                        {currentQuestion.options?.map((opt, i) => (
                                            <div
                                                key={i}
                                                className={`flex items-start gap-3 border p-4 rounded-xl cursor-pointer transition-all duration-200 group ${answers[currentQuestion.id] === opt ? 'bg-blue-50 border-blue-500 shadow-sm' : 'hover:bg-gray-50 border-gray-200 hover:border-blue-200'}`}
                                                onClick={() => handleAnswer(opt)}
                                            >
                                                <RadioGroupItem value={opt} id={`opt-${i}`} className="mt-1 shrink-0 text-blue-600 border-gray-300 group-hover:border-blue-400" />
                                                <Label htmlFor={`opt-${i}`} className="cursor-pointer text-base text-gray-700 font-normal leading-relaxed break-words w-full">{opt}</Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                )}

                                {currentQuestion.type === 'true-false' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        {["True", "False"].map(val => (
                                            <Button
                                                key={val}
                                                variant={answers[currentQuestion.id] === val ? "default" : "outline"}
                                                className={`h-16 text-lg ${answers[currentQuestion.id] === val ? 'bg-blue-600' : 'hover:border-blue-300'}`}
                                                onClick={() => handleAnswer(val)}
                                            >
                                                {val}
                                            </Button>
                                        ))}
                                    </div>
                                )}

                                {(currentQuestion.type === 'short-answer' || currentQuestion.type === 'essay') && (
                                    <Textarea
                                        value={answers[currentQuestion.id] || ""}
                                        onChange={(e) => handleAnswer(e.target.value)}
                                        placeholder="Type your answer here..."
                                        className="min-h-[200px] text-lg p-4 bg-gray-50 focus:bg-white transition-colors"
                                    />
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex justify-between items-center mt-8">
                <Button
                    variant="outline"
                    onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentQuestionIndex === 0 || isSubmitting}
                    className="w-32"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Previous
                </Button>

                {currentQuestionIndex === quiz.questions.length - 1 ? (
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="w-40 bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/20"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                        Submit Quiz
                    </Button>
                ) : (
                    <Button
                        onClick={() => setCurrentQuestionIndex(prev => Math.min(quiz.questions.length - 1, prev + 1))}
                        className="w-32 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        Next <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                )}
            </div>
        </div>
    );
}
