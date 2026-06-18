import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, Bot, User, FileText, ChevronRight, MessageSquare, Mic, MicOff, Volume2, VolumeX, Loader2, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { ScrollArea } from "./ui/scroll-area";
import { Input } from "./ui/input";
import { useAuth } from "../contexts/AuthContext";
import { PDFPreviewModal } from "./PDFPreviewModal";
import { toast } from "sonner";

interface Message {
  role: 'user' | 'bot';
  content: string;
  snippets?: string[];
  citations?: any[];
  isNew?: boolean;
}

export function CoursesChat() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("CS101");
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  const [speakingMessageId, setSpeakingMessageId] = useState<number | null>(null);
  const [previewCitation, setPreviewCitation] = useState<any | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Fetch real courses
  useEffect(() => {
    fetch("http://localhost:3005/api/courses")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setCourses(data);
          // Set to first course code
          setSelectedCourse(data[0].code);
        } else {
          // Fallback to static if empty database
          setCourses([
            { code: "CS101", name: "Object Oriented Programming", instructor: "Dr. Yasser Abdelhameed", credits: 3 },
            { code: "MATH204", name: "Mathematics-3", instructor: "Dr. Manal Shaban", credits: 3 },
            { code: "DB301", name: "Database Systems", instructor: "Dr. Kamal Hamza", credits: 3 },
            { code: "SE202", name: "Software Engineering", instructor: "Dr. Mayar Ali", credits: 3 },
          ]);
        }
      })
      .catch(err => {
        console.error("Error loading courses from server:", err);
        setCourses([
          { code: "CS101", name: "Object Oriented Programming", instructor: "Dr. Yasser Abdelhameed", credits: 3 },
          { code: "MATH204", name: "Mathematics-3", instructor: "Dr. Manal Shaban", credits: 3 },
          { code: "DB301", name: "Database Systems", instructor: "Dr. Kamal Hamza", credits: 3 },
          { code: "SE202", name: "Software Engineering", instructor: "Dr. Mayar Ali", credits: 3 },
        ]);
      });
  }, []);

  const SAVE_KEY = `chat_history_${user?.id}_course_${selectedCourse}`;

  // Load chat history
  useEffect(() => {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
      setChatHistory(JSON.parse(saved).map((m: any) => ({ ...m, isNew: false })));
    } else {
      const courseName = courses.find(c => c.code === selectedCourse)?.name || "";
      setChatHistory([
        {
          role: "bot",
          content: `Hello! I'm your ${courseName || selectedCourse} course assistant. I can help you with course materials, assignments, and answer questions. How can I help you today?`
        }
      ]);
    }
    // Cancel speaking if active
    window.speechSynthesis.cancel();
    setSpeakingMessageId(null);
  }, [selectedCourse, courses, user?.id]);

  // Save chat history
  useEffect(() => {
    if (chatHistory.length > 0) {
      localStorage.setItem(SAVE_KEY, JSON.stringify(chatHistory));
    }
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight + 10000;
      }
    }, 100);
  }, [chatHistory, SAVE_KEY]);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const speakText = (text: string, index: number) => {
    if (speakingMessageId === index) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text
      .replace(/[\#\*\_`]/g, '')
      .replace(/\[\s*(?:page|p\.)\s*\d+(?:\s*-\s*\d+)?\s*\]/gi, '')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);

    // Heuristically select a premium/natural English voice if available
    const voices = window.speechSynthesis.getVoices();
    const englishVoices = voices.filter(v => v.lang.startsWith('en') || v.lang.startsWith('en-'));
    
    let bestVoice = englishVoices.find(v => {
      const name = v.name.toLowerCase();
      return name.includes('natural') || name.includes('neural') || name.includes('online');
    });

    if (!bestVoice) {
      bestVoice = englishVoices.find(v => v.name.toLowerCase().includes('google'));
    }

    if (!bestVoice) {
      bestVoice = englishVoices.find(v => v.name.toLowerCase().includes('zira')) || 
                  englishVoices.find(v => v.name.toLowerCase().includes('hazel'));
    }

    if (!bestVoice) {
      bestVoice = englishVoices[0];
    }

    if (bestVoice) {
      utterance.voice = bestVoice;
    }

    setSpeakingMessageId(index);
    window.speechSynthesis.speak(utterance);
  };

  const handleCitationClick = (pageStr: string, msg: Message) => {
    const pageMatch = pageStr.match(/\d+/);
    if (!pageMatch) return;
    const pageNum = parseInt(pageMatch[0], 10);

    const citation = msg.citations?.find(c => c.page === pageNum);
    if (citation) {
      setPreviewCitation(citation);
      setIsPreviewOpen(true);
    } else {
      const snippetMatch = msg.snippets?.find(s => s.toLowerCase().includes(`page ${pageNum}`) || s.toLowerCase().includes(`page: ${pageNum}`));
      const filename = snippetMatch 
        ? snippetMatch.replace(/[-–(]?\s*(?:page|p\.)\s*\d+\s*\)?/gi, '').replace('Source PDF:', '').trim()
        : ((msg as any).source?.file || "Course_Materials.pdf");
      
      setPreviewCitation({
        filename: filename || "Course_Materials.pdf",
        page: pageNum,
        url: (msg as any).source?.url || null,
        text: msg.content
      });
      setIsPreviewOpen(true);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech recognition is not supported in this browser.");
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';

    rec.onstart = () => {
      setIsListening(true);
      toast.info("Listening... Speak now");
    };

    rec.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setMessage(prev => prev ? `${prev} ${transcript}` : transcript);
    };

    rec.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        toast.error("Microphone access blocked.");
      }
    };

    rec.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = rec;
    rec.start();
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userText = message;
    setMessage(""); // Clear input

    const userMsg: Message = { role: "user", content: userText };
    setChatHistory(prev => [...prev, userMsg]);
    setIsLoading(true);

    const currentCourseObj = courses.find(c => c.code === selectedCourse);
    const subjectId = currentCourseObj ? currentCourseObj.id : "general";

    try {
      const res = await fetch("http://localhost:3005/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: userText,
          subjectId: subjectId
        })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to query server");
      }

      const botMsg: Message = {
        role: "bot",
        content: data.answer || "No answer generated.",
        snippets: data.snippets,
        citations: data.citations,
        isNew: true
      };
      setChatHistory(prev => [...prev, botMsg]);
    } catch (err: any) {
      console.error(err);
      setChatHistory(prev => [
        ...prev,
        {
          role: "bot",
          content: `Error: ${err.message || "Failed to retrieve RAG response."}`,
          isNew: true
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        className="relative"
      >
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1">
            <motion.div
              className="flex items-center gap-3 mb-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center shadow-lg">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-gray-900 mb-0">My Courses & Chat</h1>
                <p className="text-sm text-gray-500 mt-1">Chat with AI assistants for your courses</p>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Pane - Course List */}
        <Card className="border-none shadow-md lg:col-span-1">
          <CardHeader>
            <CardTitle>My Courses</CardTitle>
            <CardDescription>Select a course to chat</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <AnimatePresence mode="wait">
                {courses.map((course, index) => (
                  <motion.button
                    key={course.code}
                    onClick={() => setSelectedCourse(course.code)}
                    aria-label={`Select course ${course.code}: ${course.name}`}
                    aria-pressed={selectedCourse === course.code}
                    role="button"
                    className={`w-full text-left p-4 rounded-lg transition-all ${selectedCourse === course.code
                      ? "bg-gradient-to-r from-[#2563EB] to-[#7C3AED] text-white shadow-lg"
                      : "bg-gray-50 hover:bg-gray-100 text-gray-900"
                      }`}
                    initial={{ opacity: 0, x: -20, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 20, scale: 0.95 }}
                    transition={{
                      duration: 0.4,
                      delay: index * 0.08,
                      ease: [0.4, 0, 0.2, 1]
                    }}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={selectedCourse === course.code ? "text-white" : "text-gray-900"}>
                        {course.code}
                      </span>
                      <AnimatePresence>
                        {selectedCourse === course.code && (
                          <motion.div
                            initial={{ opacity: 0, x: -10, rotate: -90 }}
                            animate={{ opacity: 1, x: 0, rotate: 0 }}
                            exit={{ opacity: 0, x: 10, rotate: 90 }}
                            transition={{ duration: 0.3 }}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <div className={`text-sm ${selectedCourse === course.code ? "text-blue-100" : "text-gray-600"}`}>
                      {course.name}
                    </div>
                    <div className={`text-xs mt-2 ${selectedCourse === course.code ? "text-blue-200" : "text-gray-500"}`}>
                      {course.instructor}
                    </div>
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>

        {/* Right Pane - Chat Interface */}
        <div className="lg:col-span-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="flex flex-col h-[600px] overflow-hidden rounded-2xl border-none shadow-none"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
          >
            <div className="flex items-center justify-between p-4 shrink-0 relative z-10 bg-transparent">
              <div>
                <h3 className="text-[15px] font-bold text-gray-900 flex items-center gap-2">
                  <Bot className="w-5 h-5 text-gray-700" />
                  Chatting about: {courses.find(c => c.code === selectedCourse)?.code}
                </h3>
                <p className="text-[12px] font-medium text-gray-500 mt-1">
                  {courses.find(c => c.code === selectedCourse)?.name}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    const courseName = courses.find(c => c.code === selectedCourse)?.name || "";
                    setChatHistory([
                      {
                        role: "bot",
                        content: `Hello! I'm your ${courseName || selectedCourse} course assistant. I can help you with course materials, assignments, and answer questions. How can I help you today?`
                      }
                    ]);
                    localStorage.removeItem(SAVE_KEY);
                    toast.success("Chat history cleared");
                  }}
                  className="h-7 px-3 text-[11px] font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-full border border-slate-200 hover:border-rose-200 shadow-sm transition-all flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear Chat
                </Button>
                <Badge className="bg-gray-100 text-gray-600 border-none">
                  AI Assistant
                </Badge>
              </div>
            </div>            <div className="flex-1 flex flex-col p-2 sm:p-4 bg-transparent overflow-hidden">
              <ScrollArea className="flex-1 overflow-y-auto pr-2 sm:pr-4 space-y-6 mb-4 scroll-smooth scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                <div ref={scrollRef} className="h-full overflow-y-auto pr-2">
                  <AnimatePresence mode="popLayout">
                    <motion.div
                      key={selectedCourse}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                      className="space-y-4"
                    >
                      {chatHistory.map((msg, index) => (
                        <motion.div
                          key={`${selectedCourse}-${index}`}
                          className={`flex gap-4 w-full group font-['Inter',system-ui,sans-serif] ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          initial={msg.role === 'user' ? { opacity: 0, scale: 0.95, y: 20 } : { opacity: 0, scale: 0.95, x: -20 }}
                          animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                        >
                          {msg.role === 'bot' && (
                            <div className="flex flex-col items-center gap-1.5 shrink-0 mt-1">
                              <div className="w-8 h-8 rounded-full bg-white overflow-hidden flex items-center justify-center shadow-sm border border-gray-100">
                                <Bot className="w-5 h-5 text-gray-700" />
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => speakText(msg.content, index)}
                                className="h-6 w-6 hover:bg-gray-100 rounded-full transition-all text-gray-400 hover:text-blue-600"
                                title="Read message out loud"
                                type="button"
                              >
                                {speakingMessageId === index ? (
                                  <VolumeX className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                                ) : (
                                  <Volume2 className="w-3.5 h-3.5" />
                                )}
                              </Button>
                            </div>
                          )}
                          <div className={`max-w-[85%] sm:max-w-[75%] flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                            <div
                              className={`px-5 py-3.5 rounded-3xl shadow-sm relative ${msg.role === 'user'
                                ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 text-gray-900 font-medium'
                                : 'bg-white border border-gray-100 text-gray-800'
                                }`}
                            >
                              <div className="text-[15px] whitespace-pre-line leading-7 relative">
                                {msg.content.split(/(\[\s*(?:page|p\.)\s*\d+(?:\s*-\s*\d+)?\s*\])/i).map((part, i) => {
                                  if (/^\[\s*(page|p\.)\s*\d+(?:\s*-\s*\d+)?\s*\]$/i.test(part)) {
                                    return (
                                      <motion.sup
                                        key={i}
                                        initial={{ opacity: 0, y: 4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, ease: 'easeOut' }}
                                        className="text-[#14B8A6] font-bold text-[11px] ml-0.5 cursor-pointer hover:text-teal-500 hover:underline transition-colors"
                                        onClick={() => handleCitationClick(part, msg)}
                                      >
                                        {part}
                                      </motion.sup>
                                    );
                                  }
                                  return part;
                                })}
                              </div>
                            </div>
                            {msg.snippets && msg.snippets.length > 0 && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: 0.1 }}
                                className="mt-4 text-[13px] bg-transparent max-w-full ml-1 font-['Inter',sans-serif]"
                              >
                                <div className="font-semibold flex items-center gap-1.5 mb-2 text-[#3B82F6]">
                                  <FileText className="w-4 h-4" /> Source cited:
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  {msg.snippets.map((snip, i) => {
                                    const pageMatch = snip.match(/(?:page|p\.)\s*(\d+)/i);
                                    const pageNum = pageMatch ? pageMatch[1] : null;
                                    const filename = snip.replace(/[-–(]?\s*(?:page|p\.)\s*\d+\s*\)?/gi, '').replace('Source PDF:', '').trim();
                                    return (
                                      <div 
                                        key={i} 
                                        onClick={() => handleCitationClick(`page ${pageNum}`, msg)}
                                        className="pl-3 border-l-[3px] border-[#3B82F6]/30 transition-all duration-200 font-medium text-gray-600 hover:text-[#0F766E] hover:border-[#14B8A6] hover:bg-teal-50/50 py-1.5 pr-3 rounded-r-md cursor-pointer flex items-center gap-2 w-fit text-left"
                                      >
                                        <FileText className="w-3.5 h-3.5 text-[#14B8A6] shrink-0" />
                                        <span className="truncate max-w-[200px]" title={filename}>{filename || snip}</span>
                                        {pageNum && <span className="text-[#14B8A6] font-medium text-[12px] mx-0.5 shrink-0">Page {pageNum}</span>}
                                      </div>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            )}
                          </div>
                          {msg.role === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center shrink-0 mt-1 shadow-md overflow-hidden">
                              {user?.profileImage ? (
                                <img src={user.profileImage} alt="User" className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-5 h-5" />
                              )}
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="relative shrink-0 w-full max-w-[800px] mx-auto pb-4 pt-2">
                <div className="relative flex rounded-3xl bg-white border border-gray-200/80 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] focus-within:shadow-[0_8px_30px_rgb(37,99,235,0.08)] focus-within:border-blue-300 transition-all duration-300 overflow-hidden items-end mx-2 sm:mx-0">
                  <textarea
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    rows={1}
                    placeholder="Ask a question and AI will answer from official course materials..."
                    className="w-full max-h-[200px] resize-none bg-transparent py-[14px] pl-6 pr-24 text-[15px] font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none scrollbar-thin overflow-y-auto leading-relaxed"
                    style={{ minHeight: '52px' }}
                    aria-label="Message input for course chatbot"
                    disabled={isLoading}
                  />
                  <div className="absolute right-3 bottom-2.5 max-h-[52px] flex items-center gap-2">
                    {/* Microphone button */}
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <AnimatePresence>
                        {isListening && (
                          <motion.div
                            key="mic-ring"
                            initial={{ opacity: 0.55, scale: 0.85 }}
                            animate={{ opacity: 0, scale: 1.9 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
                            style={{ position: 'absolute', width: '32px', height: '32px', borderRadius: '50%', background: '#EF4444', pointerEvents: 'none' }}
                          />
                        )}
                      </AnimatePresence>
                      <motion.button
                        onClick={toggleListening}
                        disabled={isLoading}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.91 }}
                        className={`rounded-full transition-all duration-200 h-8 w-8 flex items-center justify-center ${isListening ? 'bg-red-500 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                        title={isListening ? "Stop listening" : "Dictate question"}
                        aria-label="Dictate message"
                        type="button"
                      >
                        {isListening ? (
                          <Mic className="w-4 h-4 text-white" />
                        ) : (
                          <MicOff className="w-4 h-4" />
                        )}
                      </motion.button>
                    </div>

                    <Button
                      size="icon"
                      onClick={handleSendMessage}
                      disabled={!message.trim() || isLoading}
                      className={`rounded-full transition-all duration-200 h-8 w-8 ${message.trim() && !isLoading ? 'bg-gradient-to-r from-[#2563EB] to-[#7C3AED] hover:opacity-90 text-white shadow-md scale-110' : 'bg-[#e5e5e5] text-gray-400'}`}
                      aria-label="Send message"
                      type="button"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                      ) : (
                        <Send className="w-4 h-4 ml-0.5" aria-hidden="true" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="text-center mt-3">
                  <span className="text-[11px] text-gray-400 font-medium tracking-wide">Powered by course materials including lecture PDFs, slides, and textbooks</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Course Materials Section */}
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle>Course Materials for {selectedCourse}</CardTitle>
          <CardDescription>Documents used to train the course chatbot</CardDescription>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedCourse}
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            >
              {[1, 2, 3].map((item, index) => (
                <motion.div
                  key={item}
                  className="p-4 border border-gray-200 rounded-lg hover:border-[#2563EB] transition-all cursor-pointer"
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{
                    duration: 0.4,
                    delay: index * 0.1,
                    ease: [0.4, 0, 0.2, 1]
                  }}
                  whileHover={{ scale: 1.05, y: -4, borderColor: "#2563EB" }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="w-5 h-5 text-[#2563EB]" />
                    <span className="text-sm text-gray-900">
                      {item === 1 && "Chapter_5_OOP_Concepts.pdf"}
                      {item === 2 && "Lecture_Slides_Week_6.pdf"}
                      {item === 3 && "Java_Programming_Textbook.pdf"}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {item === 1 && "45 pages • Indexed"}
                    {item === 2 && "28 pages • Indexed"}
                    {item === 3 && "312 pages • Indexed"}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>

      <PDFPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        citation={previewCitation}
        courseName={courses.find(c => c.code === selectedCourse)?.name}
      />
    </div>
  );
}
