import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { motion, AnimatePresence } from "motion/react";
import { X, MessageCirclePlus, AlertTriangle, LockKeyhole, LockOpen, CalendarClock, Pencil, Send, Paperclip, Smile, MoreVertical, Hash } from "lucide-react";
import { BookOpen, FileText, Download, Clock, Users, MessageSquare, CheckCircle2, Play, TrendingUp, Bell, Star, Upload, Eye, Trash2, Plus, Search, Filter, Sparkles, GraduationCap, ChevronDown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Separator } from "./ui/separator";
import { ScrollArea } from "./ui/scroll-area";
import { Input } from "./ui/input";
import { Avatar } from "./ui/avatar";

export function LMS() {
  const { userRole, user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"overview" | "course">("overview");
  const [activeTab, setActiveTab] = useState<string>("materials");

  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [courseMaterials, setCourseMaterials] = useState<any[]>([]);
  const [courseVideos, setCourseVideos] = useState<any[]>([]);
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [selectedDiscussion, setSelectedDiscussion] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [socket, setSocket] = useState<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  // Premium chat modal state
  const [showChatModal, setShowChatModal] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState("");
  const [hoveredMessage, setHoveredMessage] = useState<string | null>(null);
  const [messageReactions, setMessageReactions] = useState<Record<string, { emoji: string; count: number; userReacted: boolean }[]>>({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => {
    if (chatMessages.length > 0) scrollToBottom();
  }, [chatMessages]);

  // Modal states
  const [showDiscussionModal, setShowDiscussionModal] = useState(false);
  const [discussionTitle, setDiscussionTitle] = useState("");
  const [discussionDesc, setDiscussionDesc] = useState("");
  const [discussionOpenAt, setDiscussionOpenAt] = useState("");
  const [discussionCloseAt, setDiscussionCloseAt] = useState("");
  const [discussionCreating, setDiscussionCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'material' | 'video' | 'discussion'; id: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  // Schedule edit modal
  const [editScheduleDiscussion, setEditScheduleDiscussion] = useState<any | null>(null);
  const [editOpenAt, setEditOpenAt] = useState("");
  const [editCloseAt, setEditCloseAt] = useState("");
  const [savingSchedule, setSavingSchedule] = useState(false);
  // Ticker to re-evaluate open/closed status every second
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 5000); return () => clearInterval(t); }, []);

  // Assignment states
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [assignmentDueDate, setAssignmentDueDate] = useState("");
  const [assignmentCreating, setAssignmentCreating] = useState(false);
  const [submittingAssignmentId, setSubmittingAssignmentId] = useState<string | null>(null);
  const assignmentFileInputRef = useRef<HTMLInputElement>(null);

  // Fetch courses dynamically
  useEffect(() => {
    fetch("http://localhost:3005/api/courses")
      .then(res => res.json())
      .then(data => setEnrolledCourses(data))
      .catch(err => console.error("Failed to fetch courses", err));
  }, []);

  // Fetch details when a course is selected
  useEffect(() => {
    if (activeView === "course" && selectedCourse) {
      fetch(`http://localhost:3005/api/lms/${selectedCourse}/materials`)
        .then(res => res.json())
        .then(data => setCourseMaterials(data));

      fetch(`http://localhost:3005/api/lms/${selectedCourse}/videos`)
        .then(res => res.json())
        .then(data => setCourseVideos(data));


      fetch(`http://localhost:3005/api/lms/${selectedCourse}/discussions`)
        .then(res => res.json())
        .then(data => setDiscussions(data));

      fetch(`http://localhost:3005/api/lms/${selectedCourse}/assignments`)
        .then(res => res.json())
        .then(data => setAssignments(data));
    }
  }, [activeView, selectedCourse]);

  // Connect socket on mount
  useEffect(() => {
    import('socket.io-client').then(({ default: io }) => {
      const newSocket = io("http://localhost:3005");
      setSocket(newSocket);
      newSocket.on('receive_message', (msg: any) => {
        setChatMessages(prev => [...prev, msg]);
      });
    });
  }, []);

  // Lock body scroll when chat modal is open
  useEffect(() => {
    if (showChatModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showChatModal]);

  // Join discussion room
  useEffect(() => {
    if (selectedDiscussion && socket) {
      socket.emit('join_discussion', selectedDiscussion);
      fetch(`http://localhost:3005/api/lms/discussions/${selectedDiscussion}/messages`)
        .then(res => res.json())
        .then(data => setChatMessages(data));
    }
  }, [selectedDiscussion, socket]);

  const openDiscussionChat = (discussionId: string) => {
    setSelectedDiscussion(discussionId);
    setShowChatModal(true);
    setNewMessage("");
    setChatMessages([]);
  };

  const closeChatModal = () => {
    setShowChatModal(false);
    setSelectedDiscussion(null);
    setNewMessage("");
  };

  const handleSendMessage = () => {
    if (newMessage.trim() === "" || !selectedDiscussion || !socket) return;
    socket.emit('send_message', {
      discussionId: selectedDiscussion,
      author: user ? `${user.firstName} ${user.lastName}` : (userRole === 'admin' ? 'Professor' : 'Student'),
      content: newMessage.trim(),
      role: userRole
    });
    setNewMessage("");
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleMessageKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const addReaction = (msgId: string, emoji: string) => {
    setMessageReactions(prev => {
      const current = prev[msgId] || [];
      const existing = current.find(r => r.emoji === emoji);
      let updated;
      
      if (existing) {
        if (existing.userReacted) {
          // User is removing their reaction. Decrement count.
          // If count becomes 0, remove the reaction completely.
          updated = current
            .map(r => r.emoji === emoji ? { ...r, count: r.count - 1, userReacted: false } : r)
            .filter(r => r.count > 0);
        } else {
          // User is adding their reaction back. Increment count.
          updated = current.map(r => r.emoji === emoji ? { ...r, count: r.count + 1, userReacted: true } : r);
        }
      } else {
        // Initializing with a stable mock count between 1 and 3 (simulating other users)
        // plus 1 for the current user who just reacted.
        const mockOthers = Math.floor(Math.random() * 3); // 0, 1, or 2 others
        updated = [...current, { emoji, count: mockOthers + 1, userReacted: true }];
      }
      
      return { ...prev, [msgId]: updated };
    });
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNewMessage(val);
    
    // Only collapse the height to 'auto' to allow shrinking when characters are deleted.
    // If typing characters (length increases or stays same), avoid setting it to 'auto'
    // to prevent rapid layout reflows that cause the scroll viewport to bounce up/down.
    if (val.length < newMessage.length) {
      e.target.style.height = 'auto';
    }
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };


  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'material' | 'video') => {
    const file = e.target.files?.[0];
    if (!file || !selectedCourse) return;

    const formData = new FormData();
    formData.append("courseId", selectedCourse);

    // In a real app we would ask for title in a modal, but for speed we grab the filename
    const title = file.name.replace(/\.[^/.]+$/, "");

    if (type === 'material') {
      formData.append("title", title);
      formData.append("file", file);
      fetch(`http://localhost:3005/api/lms/materials`, {
        method: 'POST',
        body: formData
      }).then(res => res.json())
        .then(data => setCourseMaterials(prev => [...prev, data]))
        .catch(err => console.error(err));
    } else {
      formData.append("title", title);
      formData.append("video", file);
      fetch(`http://localhost:3005/api/lms/videos`, {
        method: 'POST',
        body: formData
      }).then(res => res.json())
        .then(data => setCourseVideos(prev => [...prev, data]))
        .catch(err => console.error(err));
    }
  };

  const handleDownload = (url: string) => {
    window.open(`http://localhost:3005${url}`, '_blank');
  };

  const handleDeleteMaterial = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`http://localhost:3005/api/lms/materials/${id}`, { method: 'DELETE' });
      setCourseMaterials(prev => prev.filter(m => m.id !== id));
    } catch (err) { console.error(err); }
  };

  const handleDeleteVideo = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`http://localhost:3005/api/lms/videos/${id}`, { method: 'DELETE' });
      setCourseVideos(prev => prev.filter(v => v.id !== id));
    } catch (err) { console.error(err); }
  };

  const handleDeleteAssignment = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`http://localhost:3005/api/lms/assignments/${id}`, { method: 'DELETE' });
      setAssignments(prev => prev.filter(v => v.id !== id));
      toast.success("Assignment deleted successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete assignment");
    }
  };

  const handleCreateDiscussion = () => {
    setDiscussionTitle("");
    setDiscussionDesc("");
    setDiscussionOpenAt("");
    setDiscussionCloseAt("");
    setShowDiscussionModal(true);
  };

  const submitDiscussion = async () => {
    if (!discussionTitle.trim() || !selectedCourse) return;
    setDiscussionCreating(true);
    try {
      const res = await fetch(`http://localhost:3005/api/lms/${selectedCourse}/discussions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: discussionTitle.trim(),
          author: user ? `${user.firstName} ${user.lastName}` : 'Professor',
          openAt: discussionOpenAt || null,
          closeAt: discussionCloseAt || null,
          description: discussionDesc.trim() || null,
        })
      });
      const data = await res.json();
      setDiscussions(prev => [data, ...prev]);
      setShowDiscussionModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setDiscussionCreating(false);
    }
  };

  const handleEditSchedule = (discussion: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditScheduleDiscussion(discussion);
    setEditOpenAt(discussion.openAt ? discussion.openAt.slice(0, 16) : "");
    setEditCloseAt(discussion.closeAt ? discussion.closeAt.slice(0, 16) : "");
  };

  const saveSchedule = async () => {
    if (!editScheduleDiscussion) return;
    setSavingSchedule(true);
    try {
      await fetch(`http://localhost:3005/api/lms/discussions/${editScheduleDiscussion.id}/schedule`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ openAt: editOpenAt || null, closeAt: editCloseAt || null })
      });
      setDiscussions(prev => prev.map(d =>
        d.id === editScheduleDiscussion.id
          ? { ...d, openAt: editOpenAt || null, closeAt: editCloseAt || null }
          : d
      ));
      setEditScheduleDiscussion(null);
    } catch (err) { console.error(err); }
    finally { setSavingSchedule(false); }
  };

  // Returns 'upcoming' | 'open' | 'closed' | 'always'
  const getDiscussionStatus = (d: any): 'upcoming' | 'open' | 'closed' | 'always' => {
    if (!d.openAt && !d.closeAt) return 'always';
    const open = d.openAt ? new Date(d.openAt) : null;
    const close = d.closeAt ? new Date(d.closeAt) : null;
    if (open && now < open) return 'upcoming';
    if (close && now > close) return 'closed';
    return 'open';
  };

  const canStudentType = (d: any) => {
    const s = getDiscussionStatus(d);
    return s === 'open' || s === 'always';
  };

  const activeDiscussionObj = discussions.find(d => d.id === selectedDiscussion);

  const handleDeleteDiscussion = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`http://localhost:3005/api/lms/discussions/${id}`, { method: 'DELETE' });
      setDiscussions(prev => prev.filter(d => d.id !== id));
      if (selectedDiscussion === id) setSelectedDiscussion(null);
    } catch (err) { console.error(err); }
  };

  const handleCreateAssignment = () => {
    setAssignmentTitle("");
    setAssignmentDueDate("");
    setShowAssignmentModal(true);
  };

  const submitAssignment = async () => {
    if (!assignmentTitle.trim() || !selectedCourse) return;
    setAssignmentCreating(true);
    try {
      const res = await fetch(`http://localhost:3005/api/lms/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: selectedCourse,
          title: assignmentTitle.trim(),
          dueDate: assignmentDueDate
        })
      });
      const data = await res.json();
      setAssignments(prev => [...prev, data]);
      setShowAssignmentModal(false);
    } catch (err) { console.error(err); }
    finally { setAssignmentCreating(false); }
  };

  const handleAssignmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !submittingAssignmentId) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("studentName", user ? `${user.firstName} ${user.lastName}` : "Student");

    fetch(`http://localhost:3005/api/lms/assignments/${submittingAssignmentId}/submit`, {
      method: 'POST',
      body: formData
    }).then(res => res.json())
      .then(() => {
        setAssignments(prev => prev.map(a =>
          a.id === submittingAssignmentId ? { ...a, submissions: (a.submissions || 0) + 1 } : a
        ));
        setSubmittingAssignmentId(null);
      })
      .catch(err => console.error(err));
  };

  const executeDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      if (confirmDelete.type === 'material') {
        await fetch(`http://localhost:3005/api/lms/materials/${confirmDelete.id}`, { method: 'DELETE' });
        setCourseMaterials(prev => prev.filter(m => m.id !== confirmDelete.id));
      } else if (confirmDelete.type === 'video') {
        await fetch(`http://localhost:3005/api/lms/videos/${confirmDelete.id}`, { method: 'DELETE' });
        setCourseVideos(prev => prev.filter(v => v.id !== confirmDelete.id));
      } else if (confirmDelete.type === 'discussion') {
        await fetch(`http://localhost:3005/api/lms/discussions/${confirmDelete.id}`, { method: 'DELETE' });
        setDiscussions(prev => prev.filter(d => d.id !== confirmDelete.id));
        if (selectedDiscussion === confirmDelete.id) setSelectedDiscussion(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
      setConfirmDelete(null);
    }
  };

  const selectedCourseData = enrolledCourses.find(c => c.id === selectedCourse);

  // ── Modals (matching site design) ──────────────────────────────────────────
  const [titleError, setTitleError] = useState(false);

  const Modals = (
    <AnimatePresence>
      {/* ── Create Discussion Modal ─────────────────────────── */}
      {showDiscussionModal && (
        <motion.div
          key="discussion-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999999] flex items-center justify-center p-4 md:p-6"
          style={{ background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
          onClick={() => setShowDiscussionModal(false)}
        >
          <motion.div
            key="discussion-modal"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: "spring", damping: 28, stiffness: 380 }}
            className="relative w-full max-w-md rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden"
            style={{ background: '#ffffff', border: '1px solid #e2e8f0', colorScheme: 'light', color: '#0f172a' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Top accent bar matching site's blue */}
            <div className="h-1 w-full bg-gradient-to-r from-[#2563EB] to-[#7C3AED]" />

            {/* Header */}
            <div className="flex items-center justify-between px-7 pt-6 pb-5 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <MessageCirclePlus className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900 leading-tight">New Discussion</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Start a topic for your students</p>
                </div>
              </div>
              <button
                onClick={() => setShowDiscussionModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              {/* Topic Title */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-600">
                  Discussion Topic <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    autoFocus
                    maxLength={120}
                    value={discussionTitle}
                    onChange={e => { setDiscussionTitle(e.target.value); setTitleError(false); }}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && submitDiscussion()}
                    placeholder="e.g. How does recursion work in practice?"
                    style={{ background: '#f8fafc', color: '#0f172a' }}
                    className={`w-full rounded-lg px-3 py-2.5 text-sm border transition-all duration-150 outline-none pr-12
                      ${titleError
                        ? 'border-red-500/50 ring-2 ring-red-500/20'
                        : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                      }`}
                  />
                  <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs tabular-nums ${discussionTitle.length > 100 ? 'text-orange-600' : 'text-slate-500'}`}>
                    {discussionTitle.length}/120
                  </span>
                </div>
                {titleError && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-red-500 flex items-center gap-1 mt-1"
                  >
                    <AlertTriangle className="w-3 h-3" />
                    Please enter a discussion topic.
                  </motion.p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-600">
                  Description{" "}
                  <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  rows={2}
                  maxLength={400}
                  value={discussionDesc}
                  onChange={e => setDiscussionDesc(e.target.value)}
                  placeholder="Add context or guiding questions for your students…"
                  style={{ background: '#f8fafc', color: '#0f172a' }}
                  className="w-full rounded-lg px-3 py-2.5 text-sm border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none resize-none transition-all duration-150"
                />
              </div>

              {/* Schedule (optional) */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2">
                  <CalendarClock className="w-4 h-4 text-slate-500" />
                  <label className="text-sm font-medium text-slate-600">Schedule <span className="text-slate-400 font-normal">(optional)</span></label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Opens at</label>
                    <input
                      type="datetime-local"
                      value={discussionOpenAt}
                      onChange={e => setDiscussionOpenAt(e.target.value)}
                      style={{ background: '#f8fafc', color: '#0f172a' }}
                      className="w-full rounded-lg px-3 py-2 text-xs border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Closes at</label>
                    <input
                      type="datetime-local"
                      value={discussionCloseAt}
                      onChange={e => setDiscussionCloseAt(e.target.value)}
                      style={{ background: '#f8fafc', color: '#0f172a' }}
                      className="w-full rounded-lg px-3 py-2 text-xs border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-400">Leave blank to always allow replies.</p>
              </div>

            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-7 pb-6 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDiscussionModal(false)}
                style={{ background: '#f1f5f9', color: '#0f172a', borderColor: '#e2e8f0' }}
              >
                Cancel
              </Button>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  size="sm"
                  onClick={() => {
                    if (!discussionTitle.trim()) { setTitleError(true); return; }
                    submitDiscussion();
                  }}
                  disabled={discussionCreating}
                  className="bg-gradient-to-r from-[#2563EB] to-[#7C3AED] hover:from-[#1d4ed8] hover:to-[#6D28D9] text-white border-none disabled:opacity-60 min-w-[130px]"
                >
                  {discussionCreating ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Creating…
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <MessageCirclePlus className="w-4 h-4" />
                      Start Discussion
                    </span>
                  )}
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* ── Create Assignment Modal ─────────────────────────── */}
      {showAssignmentModal && (
        <motion.div
          key="assignment-backdrop"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[999999] flex items-center justify-center p-4 md:p-6"
          style={{ background: "rgba(15, 23, 42, 0.8)", backdropFilter: "blur(12px)", position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
          onClick={() => setShowAssignmentModal(false)}
        >
          <motion.div
            key="assignment-modal"
            initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: "spring", damping: 28, stiffness: 380 }}
            className="relative w-full max-w-md bg-white/80 backdrop-blur-2xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-slate-200 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="h-1 w-full bg-gradient-to-r from-[#2563EB] to-[#7C3AED]" />
            <div className="px-7 pt-6 pb-5 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center"><Plus className="w-5 h-5 text-blue-600" /></div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900 leading-tight">Create Assignment</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Add a new task for your students</p>
                </div>
              </div>
              <button onClick={() => setShowAssignmentModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all"><X className="w-4 h-4" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-600">Assignment Title</label>
                <input value={assignmentTitle} onChange={e => setAssignmentTitle(e.target.value)} placeholder="e.g. Project 1: File System"
                  className="w-full rounded-lg px-3 py-2.5 text-sm text-slate-900 bg-white/50 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder-gray-500 outline-none transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-600">Due Date</label>
                <input type="date" value={assignmentDueDate} onChange={e => setAssignmentDueDate(e.target.value)}
                  className="w-full rounded-lg px-3 py-2.5 text-sm text-slate-900 bg-white/50 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-7 pb-6 pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowAssignmentModal(false)} className="border-slate-200 bg-white/50 text-slate-900 hover:bg-slate-100">Cancel</Button>
              <Button size="sm" onClick={submitAssignment} disabled={assignmentCreating} className="bg-gradient-to-r from-[#2563EB] to-[#7C3AED] hover:from-[#1d4ed8] hover:to-[#6D28D9] text-white border-none min-w-[130px]">
                {assignmentCreating ? "Creating…" : "Add Assignment"}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* ── Edit Schedule Modal ───────────────────────────────── */}
      {editScheduleDiscussion && (
        <motion.div
          key="schedule-backdrop"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[999999] flex items-center justify-center p-4 md:p-6"
          style={{ background: "rgba(15, 23, 42, 0.8)", backdropFilter: "blur(12px)", position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
          onClick={() => setEditScheduleDiscussion(null)}
        >
          <motion.div
            key="schedule-modal"
            initial={{ opacity: 0, scale: 0.95, y: 14 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: "spring", damping: 28, stiffness: 380 }}
            className="relative w-full max-w-sm bg-white/80 backdrop-blur-2xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-slate-200 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="h-1 w-full bg-gradient-to-r from-[#2563EB] to-[#7C3AED]" />
            <div className="px-7 pt-6 pb-7 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center"><CalendarClock className="w-5 h-5 text-blue-600" /></div>
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">Schedule Discussion</h2>
                    <p className="text-xs text-slate-500">Set when students can participate</p>
                  </div>
                </div>
                <button onClick={() => setEditScheduleDiscussion(null)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Opens at <span className="text-slate-400 font-normal">(leave blank = always open)</span></label>
                  <input type="datetime-local" value={editOpenAt} onChange={e => setEditOpenAt(e.target.value)}
                    className="w-full rounded-lg px-3 py-2.5 text-sm text-slate-900 bg-white/50 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Closes at <span className="text-slate-400 font-normal">(leave blank = no close time)</span></label>
                  <input type="datetime-local" value={editCloseAt} onChange={e => setEditCloseAt(e.target.value)}
                    className="w-full rounded-lg px-3 py-2.5 text-sm text-slate-900 bg-white/50 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <Button variant="outline" size="sm" onClick={() => setEditScheduleDiscussion(null)} className="flex-1 border-slate-200 bg-white/50 text-slate-900 hover:bg-slate-100">Cancel</Button>
                <Button size="sm" disabled={savingSchedule} onClick={saveSchedule} className="flex-1 bg-gradient-to-r from-[#2563EB] to-[#7C3AED] hover:from-[#1d4ed8] hover:to-[#6D28D9] text-white border-none disabled:opacity-60">
                  {savingSchedule ? "Saving…" : "Save Schedule"}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      {/* ── Premium Chat Modal ───────────────────────────────── */}
      {showChatModal && selectedDiscussion && (() => {
        const disc = activeDiscussionObj;
        const status = disc ? getDiscussionStatus(disc) : 'always';
        const studentCanType = userRole === 'admin' || (disc ? canStudentType(disc) : true);

        return (
          <motion.div
            key="chat-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[9999999] flex items-center justify-center"
            style={{ background: "#0f172a", position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
          >
            <motion.div
              key="chat-modal"
              initial={{ opacity: 0, scale: 0.98, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              transition={{ type: "spring", damping: 30, stiffness: 350 }}
              className="relative w-full h-full bg-white flex flex-col overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Chat Header */}
              <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10 shrink-0 sticky top-0 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
                <div className="flex items-center gap-4 cursor-pointer" onClick={closeChatModal}>
                  <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors -ml-2 mr-1">
                    <X className="w-5 h-5" />
                  </Button>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] p-[2px] shadow-sm">
                    <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
                      <Hash className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 leading-tight tracking-tight flex items-center gap-2 font-[Inter]">
                      {disc?.title}
                      {status === 'closed' ? (
                        <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-300">
                          <LockKeyhole className="w-3 h-3" /> Closed
                        </div>
                      ) : status === 'upcoming' ? (
                        <div className="flex items-center gap-1 text-[10px] font-semibold text-blue-600 bg-blue-500/20 px-2 py-0.5 rounded-full border border-blue-500/30">
                          <CalendarClock className="w-3 h-3" /> Upcoming
                        </div>
                      ) : null}
                    </h2>
                    <p className="text-sm font-medium text-slate-500 mt-0.5 flex items-center gap-2">
                      {selectedCourseData?.name}
                      {disc && (disc.openAt || disc.closeAt) && (
                        <span className="text-xs font-normal text-slate-400">
                          • {disc.openAt && `Opens ${new Date(disc.openAt).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`}
                          {disc.openAt && disc.closeAt && ' - '}
                          {disc.closeAt && `Closes ${new Date(disc.closeAt).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex -space-x-3 mr-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 overflow-hidden shadow-sm">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=user${i}&backgroundColor=1e293b`} alt="" className="w-full h-full" />
                      </div>
                    ))}
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-900 shadow-sm z-10 backdrop-blur-sm">
                      +12
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors">
                    <Search className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                  <div className="w-px h-6 bg-slate-100 mx-1" />
                  <Button variant="ghost" size="icon" onClick={closeChatModal} className="text-slate-500 hover:text-red-600 hover:bg-red-500/20 rounded-xl transition-colors">
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Chat Messages */}
              <ScrollArea className="flex-1 px-4 sm:px-8 bg-transparent">
                <div className="py-12 space-y-10 max-w-4xl mx-auto">
                  {disc?.description && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-5 rounded-2xl bg-blue-50/50 border border-blue-100/50 shadow-sm mb-6 relative overflow-hidden text-left"
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500 rounded-full blur-2xl opacity-10 pointer-events-none" />
                      <div className="flex gap-3 items-start relative z-10">
                        <div className="w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                          <MessageSquare className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900 mb-1">Discussion Topic Overview</h4>
                          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{disc.description}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  {chatMessages.length === 0 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-32 text-slate-500">
                      <div className="w-24 h-24 rounded-full bg-blue-500/10 flex items-center justify-center mb-8 shadow-sm">
                        <MessageCirclePlus className="w-12 h-12 text-blue-600" />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight font-[Inter]">Welcome to the discussion</h3>
                      <p className="text-slate-500 text-center max-w-md text-base">No messages here yet. Be the first to start the conversation in this topic!</p>
                    </motion.div>
                  )}
                  {chatMessages.map((msg, idx) => {
                    const isCurrentUser = user ? `${user.firstName} ${user.lastName}` === msg.author : false;
                    const isProfessor = msg.role === 'admin' || msg.author.toLowerCase().includes('professor') || msg.author.toLowerCase().includes('dr.');

                    const isConsecutive = idx > 0 && chatMessages[idx - 1].author === msg.author && (new Date(msg.timestamp).getTime() - new Date(chatMessages[idx - 1].timestamp).getTime() < 300000);
                    const showAvatarRow = !isConsecutive;

                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className={`flex gap-6 max-w-full w-full group ${!isConsecutive ? 'mt-6' : 'mt-2'}`}
                        onMouseEnter={() => setHoveredMessage(msg.id)}
                        onMouseLeave={() => setHoveredMessage(null)}
                      >
                        {showAvatarRow ? (
                          <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden shrink-0 bg-white">
                            <img
                              src={`https://api.dicebear.com/7.x/initials/svg?seed=${msg.author}&backgroundColor=${isProfessor ? '9333ea' : (isCurrentUser ? '2563eb' : '475569')}&fontFamily=Arial&fontSize=40&fontWeight=700`}
                              alt={msg.author}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : <div className="w-10 shrink-0" />}

                        <div className="flex-1 flex flex-col min-w-0">
                          {showAvatarRow && (
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <span className="text-[15px] font-bold text-slate-900 tracking-tight font-[Inter]">{msg.author}</span>
                              {isProfessor && <Badge className="h-5 px-1.5 bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-blue-600 border border-blue-500/30 text-[10px] uppercase font-bold tracking-wider rounded-md">Instructor</Badge>}
                              <span className="text-[12px] font-medium text-slate-500 ml-1">
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                              </span>
                            </div>
                          )}

                          <div className={`relative group/content text-[16px] leading-[1.65] text-slate-600 break-words font-[Inter] antialiased pr-12`}>
                            {msg.content}

                            {/* Micro-interaction: Discoverable React Trigger Icon (Smile Face) */}
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center z-10">
                              <button
                                onClick={() => setHoveredMessage(prev => prev === msg.id ? null : msg.id)}
                                className="opacity-30 group-hover/content:opacity-100 focus:opacity-100 transition-all duration-200 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 flex items-center justify-center shrink-0 cursor-pointer"
                                title="Add Reaction"
                              >
                                <Smile className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Micro-interaction: Reactions Emoji Panel (visible on hover or click) */}
                            <AnimatePresence>
                              {hoveredMessage === msg.id && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                  animate={{ opacity: 1, scale: 1, y: -45 }}
                                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                  transition={{ type: "spring", damping: 18, stiffness: 220 }}
                                  className="absolute right-0 top-0 flex gap-1 bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-xl p-1 z-30"
                                >
                                  {['👍', '❤️', '🔥'].map((emoji) => (
                                    <motion.button
                                      key={emoji}
                                      whileHover={{ scale: 1.2 }}
                                      whileTap={{ scale: 0.9 }}
                                      onClick={() => {
                                        addReaction(msg.id, emoji);
                                        setHoveredMessage(null); // Auto-close after reacting
                                      }}
                                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition text-base cursor-pointer"
                                    >
                                      {emoji}
                                    </motion.button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>

                            {/* Render Reactions */}
                            {messageReactions[msg.id] && messageReactions[msg.id].length > 0 && (
                              <div className="flex flex-wrap items-center gap-1.5 mt-2 z-10">
                                {messageReactions[msg.id].map((r, i) => (
                                  <motion.span
                                    key={i}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className={`inline-flex items-center justify-center h-7 px-3 rounded-full border shadow-sm cursor-pointer transition-all duration-200 font-medium text-[12px] select-none
                                      ${r.userReacted 
                                        ? 'bg-blue-50/80 border-blue-200 text-blue-600 hover:bg-blue-100/80 shadow-sm shadow-blue-100/30' 
                                        : 'bg-white/50 border-slate-200 text-slate-700 hover:bg-slate-100'}`}
                                    onClick={() => addReaction(msg.id, r.emoji)}
                                  >
                                    <span className="text-base flex items-center justify-center mr-1.5">{r.emoji}</span>
                                    <span className="font-bold tabular-nums flex items-center justify-center h-full leading-none">{r.count}</span>
                                  </motion.span>
                                ))}

                                {/* Small inline Add Reaction pill */}
                                <button
                                  onClick={() => setHoveredMessage(prev => prev === msg.id ? null : msg.id)}
                                  className="inline-flex items-center justify-center h-7 px-2.5 rounded-full border border-dashed border-slate-200 bg-slate-50/30 text-slate-400 hover:text-blue-600 hover:bg-blue-50/50 hover:border-blue-200 transition-all duration-200 text-[11px] font-medium gap-1 cursor-pointer"
                                  title="Add Reaction"
                                >
                                  <Smile className="w-3.5 h-3.5" />
                                  <span>+</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}

                  {isTyping && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-end gap-3 max-w-[85%]">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden shrink-0 shadow-sm border-2 border-white z-10 bg-slate-100">
                        <img src={`https://api.dicebear.com/7.x/initials/svg?seed=Typing&backgroundColor=475569&fontFamily=Inter`} alt="Typing" className="w-full h-full object-cover opacity-50" />
                      </div>
                      <div className="bg-white/50 border border-slate-200 shadow-sm rounded-[20px] rounded-tl-sm px-4 py-3.5 flex items-center gap-1.5 h-[42px]">
                        <motion.div className="w-1.5 h-1.5 bg-gray-400 rounded-full" animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut", delay: 0 }} />
                        <motion.div className="w-1.5 h-1.5 bg-gray-400 rounded-full" animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut", delay: 0.15 }} />
                        <motion.div className="w-1.5 h-1.5 bg-gray-400 rounded-full" animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut", delay: 0.3 }} />
                      </div>
                    </motion.div>
                  )}
                  <div ref={chatEndRef} className="h-4" />
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="bg-white/80 backdrop-blur-xl px-6 py-6 border-t border-slate-200 shrink-0 z-10 w-full">
                {studentCanType ? (
                  <div className="flex flex-col gap-2 max-w-4xl mx-auto w-full">
                    <div className="w-full bg-white/50 border border-slate-200 focus-within:bg-slate-100 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/20 rounded-2xl transition-all duration-300 relative group overflow-hidden flex items-end">
                      <button className="p-4 text-slate-400 hover:text-blue-600 transition-colors self-end shrink-0 outline-none">
                        <Paperclip className="w-5 h-5" />
                      </button>
                      <textarea
                        ref={textareaRef}
                        value={newMessage}
                        onChange={handleTextareaChange}
                        onKeyDown={handleMessageKeyDown}
                        placeholder={`Message #${disc?.title.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'discussion'}`}
                        className="flex-1 max-h-[200px] min-h-[56px] w-full bg-transparent border-none py-4 px-2 text-[16px] text-slate-900 placeholder-gray-500 resize-none focus:outline-none focus:ring-0 leading-[1.5] font-[Inter]"
                        rows={1}
                      />
                      <div className="flex items-center self-end p-3 shrink-0 gap-2">
                        <div className="relative">
                          <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 text-slate-400 hover:text-amber-400 transition-colors rounded-xl hover:bg-slate-100 outline-none">
                            <Smile className="w-5 h-5" />
                          </button>
                          <AnimatePresence>
                            {showEmojiPicker && (
                              <motion.div initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 10 }} className="absolute bottom-full right-0 mb-3 bg-slate-100 border border-slate-200 shadow-2xl rounded-3xl p-4 flex gap-2 grid-cols-4 grid w-64">
                                {['😀', '😂', '🥰', '😎', '🤔', '🙌', '🔥', '✨', '🎉', '🚀', '👀', '💯'].map(e => <button key={e} onClick={() => { setNewMessage(prev => prev + e); setShowEmojiPicker(false); }} className="text-2xl hover:bg-slate-100 p-2.5 rounded-xl transition flex items-center justify-center">{e}</button>)}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="shrink-0">
                          <Button
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim()}
                            className={`rounded-xl w-[40px] h-[40px] p-0 flex items-center justify-center shadow-sm transition-all duration-300 border-none
                              ${newMessage.trim()
                                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_4px_14px_rgba(37,99,235,0.4)]'
                                : 'bg-white/50 text-slate-400 shadow-none cursor-not-allowed'}`}
                          >
                            <Send className={`w-4 h-4 ${newMessage.trim() ? 'ml-0.5' : ''}`} />
                          </Button>
                        </motion.div>
                      </div>
                    </div>
                    <div className="text-center w-full">
                      <span className="text-xs font-medium text-slate-500">
                        Discussing in <strong className="text-slate-600">{selectedCourseData?.name}</strong> • Press <span className="text-slate-600 font-bold bg-slate-100 px-1.5 py-0.5 rounded">Enter</span> to send, <span className="text-slate-600 font-bold bg-slate-100 px-1.5 py-0.5 rounded">Shift + Enter</span> for new line
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 max-w-5xl mx-auto p-4 bg-white/50 border border-slate-200 rounded-2xl opacity-75">
                    <LockKeyhole className="w-5 h-5 text-slate-500" />
                    <span className="text-[15px] font-medium text-slate-500">
                      {status === 'upcoming'
                        ? `This discussion opens at ${disc?.openAt ? new Date(disc.openAt).toLocaleString() : 'a designated time'}.`
                        : "This discussion has been closed. You can no longer send messages."}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        );
      })()}
    </AnimatePresence>
  );
  // ──────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: "100vh", position: "relative", paddingBottom: 60 }}>
      <div style={{
        position: "relative",
        zIndex: 1,
        maxWidth: 1200,
        margin: "0 auto",
        padding: "40px",
        background: "linear-gradient(145deg, #ffffff, #f8fafc)",
        borderRadius: 32,
        color: "#0f172a",
        boxShadow: "0 24px 80px rgba(0,0,0,0.05)",
        border: "1px solid rgba(0,0,0,0.05)",
        backdropFilter: "blur(24px)",
        minHeight: 800,
        overflow: "hidden"
      }}>
        {/* ── Ambient mesh background ── */}
        <div style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" }}>
          <motion.div
            animate={{ x: [0, 40, -20, 0], y: [0, -30, 20, 0] }}
            transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
            style={{
              position: "absolute", top: "-20%", left: "10%", width: 700, height: 700,
              background: "radial-gradient(circle, rgba(37,99,235,0.05) 0%, transparent 70%)", borderRadius: "50%", filter: "blur(60px)"
            }}
          />
          <motion.div
            animate={{ x: [0, -50, 30, 0], y: [0, 40, -20, 0] }}
            transition={{ duration: 30, repeat: Infinity, ease: "easeInOut", delay: 5 }}
            style={{
              position: "absolute", bottom: "-10%", right: "5%", width: 600, height: 600,
              background: "radial-gradient(circle, rgba(124,58,237,0.04) 0%, transparent 70%)", borderRadius: "50%", filter: "blur(60px)"
            }}
          />
          <motion.div
            animate={{ x: [0, 30, -40, 0], y: [0, -20, 40, 0] }}
            transition={{ duration: 26, repeat: Infinity, ease: "easeInOut", delay: 12 }}
            style={{
              position: "absolute", top: "40%", right: "25%", width: 400, height: 400,
              background: "radial-gradient(circle, rgba(16,185,129,0.03) 0%, transparent 70%)", borderRadius: "50%", filter: "blur(40px)"
            }}
          />
        </div>

        <div style={{ position: "relative", zIndex: 1 }}>
          {activeView === "course" && selectedCourseData ? (
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
                        <GraduationCap className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h1 className="text-slate-900 mb-0">Learning System</h1>
                        <p className="text-sm text-slate-500 mt-1">Access course materials, videos, and assignments</p>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
              {/* Course Header */}
              <div className="relative">
                <div className={`bg-gradient-to-r ${selectedCourseData.color} bg-opacity-80 rounded-2xl p-8 text-slate-900 shadow-[0_8px_32px_rgba(0,0,0,0.05)] relative overflow-hidden backdrop-blur-md border border-slate-200`}>
                  <div className="absolute top-0 right-0 w-64 h-64 bg-slate-100 rounded-full -mr-32 -mt-32"></div>
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full -ml-24 -mb-24"></div>
                  <div className="relative z-10">
                    <motion.div whileHover={{ x: -4 }} transition={{ type: "spring", stiffness: 400, damping: 25 }} className="w-fit">
                      <Button
                        variant="ghost"
                        className="mb-4 text-slate-900 hover:bg-slate-200"
                        onClick={() => setActiveView("overview")}
                      >
                        ← Back to Courses
                      </Button>
                    </motion.div>
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge className="bg-slate-200 text-slate-900 border-none mb-3">{selectedCourseData.code}</Badge>
                        <h1 className="text-slate-900 mb-2">{selectedCourseData.name}</h1>
                        <div className="flex items-center gap-4 text-slate-900/90">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            <span>{selectedCourseData.instructor}</span>
                          </div>
                          <span>•</span>
                          <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 fill-slate-900" />
                            <span>{selectedCourseData.rating}</span>
                          </div>
                          <span>•</span>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            <span>{selectedCourseData.students} Students</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-slate-900/90 text-sm mb-2">Your Progress</div>
                        <div className="text-slate-900 text-2xl">{selectedCourseData.progress}%</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Course Content Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-6 bg-white/60 backdrop-blur-xl border border-slate-200 shadow-lg p-1 rounded-xl">
                  {[
                    { value: "materials", label: "Materials" },
                    { value: "videos", label: "Videos" },
                    { value: "assignments", label: "Assignments" },
                    { value: "announcements", label: "Announcements" },
                    { value: "discussions", label: "Discussions" },
                    { value: "grades", label: "Grades" }
                  ].map((tab, index) => (
                    <motion.div
                      key={tab.value}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
                    >
                      <TabsTrigger value={tab.value} className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 text-slate-500 hover:text-slate-900 rounded-lg transition-all">
                        {tab.label}
                      </TabsTrigger>
                    </motion.div>
                  ))}
                </TabsList>

                {/* Materials Tab */}
                <TabsContent value="materials" className="space-y-4">
                  <motion.div
                    key="materials"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: activeTab === "materials" ? 1 : 0, x: activeTab === "materials" ? 0 : -20 }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <Card className="border border-slate-200 shadow-[0_8px_32px_rgba(0,0,0,0.05)] bg-white backdrop-blur-xl text-slate-900">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-slate-900">Course Materials</CardTitle>
                            <CardDescription className="text-slate-500">Lecture slides, notes, and resources</CardDescription>
                          </div>
                          <div className="flex gap-2">
                            {userRole === 'admin' && (
                              <>
                                <input
                                  type="file"
                                  ref={fileInputRef}
                                  className="hidden"
                                  accept=".pdf,.doc,.docx,.ppt,.pptx"
                                  onChange={(e) => handleFileUpload(e, 'material')}
                                />
                                <Button className="bg-gradient-to-r from-[#2563EB] to-[#7C3AED] hover:from-[#1d4ed8] hover:to-[#6D28D9] text-white border-none" size="sm" onClick={() => fileInputRef.current?.click()}>
                                  <Upload className="w-4 h-4 mr-2" />
                                  Upload PDF
                                </Button>
                              </>
                            )}
                            <Button variant="outline" size="sm" className="border-slate-200 bg-white/50 text-slate-900 hover:bg-slate-100">
                              <Search className="w-4 h-4 mr-2" />
                              Search
                            </Button>
                            <Button variant="outline" size="sm" className="border-slate-200 bg-white/50 text-slate-900 hover:bg-slate-100">
                              <Filter className="w-4 h-4 mr-2" />
                              Filter
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {courseMaterials.map((material, index) => (
                            <motion.div
                              key={material.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.35, delay: index * 0.05 }}
                            >
                              <div className="p-4 bg-white/50 rounded-lg border border-slate-200 hover:border-blue-500/50 hover:bg-slate-100 transition-all group">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 mb-2 sm:mb-0">
                                    <div className="flex items-start gap-3">
                                      <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <FileText className="w-5 h-5 text-red-600" />
                                      </div>
                                      <div className="flex-1">
                                        <div className="text-sm text-slate-900 mb-1">{material.title}</div>
                                        <div className="flex items-center gap-3 text-xs text-slate-500">
                                          <span>{material.type.toUpperCase()}</span>
                                          <span>•</span>
                                          <span>{material.size}</span>
                                          <span>•</span>
                                          <span>{material.date}</span>
                                        </div>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                                          <div className="flex items-center gap-1">
                                            <Download className="w-3 h-3" />
                                            <span>{material.downloads} downloads</span>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <Eye className="w-3 h-3" />
                                            <span>{material.views} views</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {userRole === 'admin' && (
                                      <Button size="sm" variant="destructive" className="bg-red-500/20 text-red-600 hover:bg-red-500/30 border border-red-500/30" onClick={(e: React.MouseEvent) => handleDeleteMaterial(material.id, e)}>
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete
                                      </Button>
                                    )}
                                    <Button size="sm" className="bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200" onClick={() => handleDownload(material.url)}>
                                      <Download className="w-4 h-4 mr-2" />
                                      Download
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </TabsContent>

                {/* Videos Tab */}
                <TabsContent value="videos" className="space-y-4">
                  <motion.div
                    key="videos"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: activeTab === "videos" ? 1 : 0, x: activeTab === "videos" ? 0 : -20 }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <Card className="border border-slate-200 shadow-[0_8px_32px_rgba(0,0,0,0.05)] bg-white backdrop-blur-xl text-slate-900">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-slate-900">Lecture Videos</CardTitle>
                            <CardDescription className="text-slate-500">Recorded lectures and tutorials</CardDescription>
                          </div>
                          <div className="flex gap-2 items-center">
                            <Badge className="bg-blue-500/20 text-blue-600 border border-blue-500/30">
                              {courseVideos.filter(v => v.watched).length}/{courseVideos.length} Watched
                            </Badge>
                            {userRole === 'admin' && (
                              <>
                                <input
                                  type="file"
                                  ref={videoInputRef}
                                  className="hidden"
                                  accept="video/*"
                                  onChange={(e) => handleFileUpload(e, 'video')}
                                />
                                <Button className="bg-gradient-to-r from-[#9333ea] to-[#c026d3] hover:from-[#7e22ce] hover:to-[#a21caf] text-white border-none" size="sm" onClick={() => videoInputRef.current?.click()}>
                                  <Upload className="w-4 h-4 mr-2" />
                                  Upload Video
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {courseVideos.map((video, index) => (
                            <motion.div
                              key={video.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.35, delay: index * 0.05 }}
                            >
                              <div className="p-4 bg-white/50 rounded-lg border border-slate-200 hover:border-purple-500/50 hover:bg-slate-100 transition-all group">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 mb-2 sm:mb-0">
                                    <div className="flex items-start gap-3">
                                      <div className={`w-10 h-10 ${video.watched ? 'bg-green-500/20' : 'bg-purple-500/20'} rounded-lg flex items-center justify-center flex-shrink-0`}>
                                        {video.watched ? (
                                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                                        ) : (
                                          <Play className="w-5 h-5 text-purple-600" />
                                        )}
                                      </div>
                                      <div className="flex-1">
                                        <div className="text-sm text-slate-900 mb-1">{video.title}</div>
                                        <div className="flex items-center gap-3 text-xs text-slate-500">
                                          <span>{video.duration}</span>
                                          <span>•</span>
                                          <span>{video.date}</span>
                                          <span>•</span>
                                          <span>{video.views} views</span>
                                        </div>
                                        {!video.watched && (
                                          <div className="mt-2">
                                            <Progress value={0} className="h-1 bg-slate-200" />
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {userRole === 'admin' && (
                                      <Button size="sm" variant="destructive" className="bg-red-500/20 text-red-600 hover:bg-red-500/30 border border-red-500/30" onClick={(e: React.MouseEvent) => handleDeleteVideo(video.id, e)}>
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete
                                      </Button>
                                    )}
                                    <Button size="sm" className="bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200" onClick={() => handleDownload(video.url)}>
                                      <Play className="w-4 h-4 mr-2" />
                                      {video.watched ? 'Rewatch' : 'Watch'}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </TabsContent>

                {/* Assignments Tab */}
                <TabsContent value="assignments" className="space-y-4">
                  <motion.div
                    key="assignments"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: activeTab === "assignments" ? 1 : 0, x: activeTab === "assignments" ? 0 : -20 }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <Card className="border border-slate-200 shadow-[0_8px_32px_rgba(0,0,0,0.05)] bg-white backdrop-blur-xl text-slate-900">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-slate-900">Assignments & Projects</CardTitle>
                            <CardDescription className="text-slate-500">Submit your work and track grades</CardDescription>
                          </div>
                          {userRole === 'admin' && (
                            <Button className="bg-gradient-to-r from-[#2563EB] to-[#7C3AED] hover:from-[#1d4ed8] hover:to-[#6D28D9] text-white border-none" size="sm" onClick={handleCreateAssignment}>
                              <Plus className="w-4 h-4 mr-2" />
                              Add Assignment
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <input type="file" className="hidden" accept=".pdf" ref={assignmentFileInputRef} onChange={handleAssignmentUpload} />
                        <div className="space-y-3">
                          {assignments.length === 0 && <p className="text-slate-500 text-sm">No assignments posted yet.</p>}
                          {assignments.map((assignment, index) => (
                            <motion.div
                              key={assignment.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.35, delay: index * 0.05 }}
                            >
                              <div
                                className={`p-4 rounded-lg border-2 transition-all ${assignment.status === 'pending'
                                  ? 'bg-orange-500/10 border-orange-500/30'
                                  : assignment.status === 'graded'
                                    ? 'bg-green-500/10 border-green-500/30'
                                    : 'bg-blue-500/10 border-blue-500/30'
                                  }`}
                              >
                                <div className="flex items-start justify-between flex-wrap gap-3">
                                  <div className="flex-1 min-w-[200px]">
                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                      <div className="text-sm font-semibold text-slate-900">{assignment.title}</div>
                                      {assignment.status === 'pending' && (
                                        <Badge className="bg-orange-500/20 text-orange-600 border border-orange-500/30">Due {assignment.dueDate}</Badge>
                                      )}
                                      {assignment.status === 'graded' && (
                                        <Badge className="bg-green-500/20 text-green-600 border border-green-500/30">Grade: {assignment.grade}</Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-slate-500">
                                      <div className="flex items-center gap-1">
                                        <Users className="w-3 h-3 text-slate-400" />
                                        <span>{assignment.submissions}/{assignment.total} submitted</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Clock className="w-3 h-3 text-slate-400" />
                                        <span>{assignment.dueDate}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    {userRole === 'admin' && (
                                      <Button size="sm" variant="destructive" className="bg-red-500/20 text-red-600 hover:bg-red-500/30 border border-red-500/30" onClick={(e: React.MouseEvent) => handleDeleteAssignment(assignment.id, e)}>
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete
                                      </Button>
                                    )}
                                    {userRole === 'admin' ? (
                                      <div className="text-xs text-blue-600 font-medium bg-blue-500/20 px-3 py-1.5 rounded-full border border-blue-500/30">
                                        Track Submissions
                                      </div>
                                    ) : (
                                      assignment.status === 'pending' && (
                                        <Button size="sm" className="bg-orange-500/20 text-orange-600 hover:bg-orange-500/30 border border-orange-500/30"
                                          onClick={() => {
                                            setSubmittingAssignmentId(assignment.id);
                                            assignmentFileInputRef.current?.click();
                                          }}>
                                          <Upload className="w-4 h-4 mr-2" />
                                          Submit PDF
                                        </Button>
                                      )
                                    )}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </TabsContent>

                {/* Announcements Tab */}
                <TabsContent value="announcements" className="space-y-4">
                  <motion.div
                    key="announcements"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: activeTab === "announcements" ? 1 : 0, x: activeTab === "announcements" ? 0 : -20 }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <Card className="border border-slate-200 shadow-[0_8px_32px_rgba(0,0,0,0.05)] bg-white backdrop-blur-xl text-slate-900">
                      <CardHeader>
                        <CardTitle className="text-slate-900">Course Announcements</CardTitle>
                        <CardDescription className="text-slate-500">Important updates from your instructor</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {announcements.map((announcement, index) => (
                            <motion.div
                              key={announcement.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.35, delay: index * 0.05 }}
                            >
                              <div
                                className={`p-4 rounded-lg border transition-all ${!announcement.read
                                  ? 'bg-blue-500/10 border-blue-500/30'
                                  : 'bg-white/50 border-slate-200'
                                  }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex items-start gap-3 flex-1">
                                    <Bell className={`w-5 h-5 mt-1 ${announcement.priority === 'high' ? 'text-red-600' : announcement.priority === 'medium' ? 'text-orange-600' : 'text-slate-400'}`} />
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <div className="text-sm text-slate-900">{announcement.title}</div>
                                        {!announcement.read && (
                                          <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                                        )}
                                      </div>
                                      <div className="text-xs text-slate-500">{announcement.date}</div>
                                    </div>
                                  </div>
                                  {announcement.priority === 'high' && (
                                    <Badge className="bg-red-500/20 text-red-600 border border-red-500/30">Urgent</Badge>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </TabsContent>

                {/* Discussions Tab */}
                <TabsContent value="discussions" className="space-y-4">
                  <motion.div
                    key="discussions"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: activeTab === "discussions" ? 1 : 0, x: activeTab === "discussions" ? 0 : -20 }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <Card className="border border-slate-200 shadow-[0_8px_32px_rgba(0,0,0,0.05)] bg-white backdrop-blur-xl text-slate-900">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-slate-900">Discussion Forum</CardTitle>
                            <CardDescription className="text-slate-500">Ask questions and help your classmates</CardDescription>
                          </div>
                          {userRole === 'admin' && (
                            <Button className="bg-gradient-to-r from-[#2563EB] to-[#7C3AED] hover:from-[#1d4ed8] hover:to-[#6D28D9] text-white border-none" onClick={handleCreateDiscussion}>
                              <Plus className="w-4 h-4 mr-2" />
                              New Discussion
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="space-y-3 p-6">
                          {discussions.length === 0 && <p className="text-slate-500 text-sm">No discussions found.</p>}
                          {discussions.map((discussion, index) => {
                            const status = getDiscussionStatus(discussion);
                            const statusStyles = {
                              open: 'bg-green-500/20 text-green-600 border border-green-500/30',
                              always: 'bg-green-500/20 text-green-600 border border-green-500/30',
                              upcoming: 'bg-blue-500/20 text-blue-600 border border-blue-500/30',
                              closed: 'bg-slate-100 text-slate-500 border border-slate-300',
                            }[status];
                            return (
                              <motion.div
                                key={discussion.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.35, delay: index * 0.05 }}
                              >
                                <div onClick={() => openDiscussionChat(discussion.id)} className="group p-4 bg-white/50 rounded-xl border border-slate-200 hover:border-blue-500/50 hover:bg-slate-100 hover:shadow-md transition-all cursor-pointer">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1.5">
                                        <span className="text-sm font-medium text-slate-900 group-hover:text-blue-600 transition-colors">{discussion.title}</span>
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles}`}>
                                          {status === 'closed' ? <LockKeyhole className="w-3 h-3" /> : <LockOpen className="w-3 h-3" />}
                                          {status === 'upcoming' ? 'Upcoming' : status === 'closed' ? 'Closed' : 'Open'}
                                        </span>
                                      </div>
                                      {discussion.description && (
                                        <p className="text-xs text-slate-500 mb-2.5 line-clamp-2 leading-relaxed">
                                          {discussion.description}
                                        </p>
                                      )}
                                      <div className="flex items-center gap-4 text-xs text-slate-500">
                                        <div className="flex items-center gap-1">
                                          <Avatar className="w-4 h-4 border border-slate-300" />
                                          <span>{discussion.author}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <MessageSquare className="w-3 h-3" />
                                          <span>{discussion.replies} replies</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Clock className="w-3 h-3" />
                                          <span>{discussion.lastActivity}</span>
                                        </div>
                                      </div>
                                      {(discussion.openAt || discussion.closeAt) && (
                                        <div className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
                                          <CalendarClock className="w-3 h-3" />
                                          {discussion.openAt && <span>Opens {new Date(discussion.openAt).toLocaleString()}</span>}
                                          {discussion.openAt && discussion.closeAt && <span>·</span>}
                                          {discussion.closeAt && <span>Closes {new Date(discussion.closeAt).toLocaleString()}</span>}
                                        </div>
                                      )}
                                    </div>
                                    {userRole === 'admin' && (
                                      <div className="flex gap-1.5 ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button size="sm" variant="outline" className="border-slate-300 text-slate-600 hover:bg-slate-100 hover:text-slate-900 h-8 px-2 bg-transparent" onClick={(e: React.MouseEvent) => handleEditSchedule(discussion, e)}>
                                          <CalendarClock className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button size="sm" variant="destructive" className="h-8 px-2 bg-red-500/20 text-red-600 hover:bg-red-500/30 border border-red-500/30" onClick={(e: React.MouseEvent) => handleDeleteDiscussion(discussion.id, e)}>
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </TabsContent>

                {/* Grades Tab */}
                <TabsContent value="grades" className="space-y-4">
                  <motion.div
                    key="grades"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: activeTab === "grades" ? 1 : 0, x: activeTab === "grades" ? 0 : -20 }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="border border-slate-200 shadow-[0_8px_32px_rgba(0,0,0,0.05)] bg-blue-50/50 backdrop-blur-xl relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500 rounded-full blur-2xl opacity-20 pointer-events-none" />
                        <CardContent className="p-6 relative z-10">
                          <div className="text-sm text-blue-600 mb-2">Current Grade</div>
                          <div className="text-slate-900 text-3xl font-bold mb-1">B+</div>
                          <div className="text-xs text-blue-300">85.5%</div>
                        </CardContent>
                      </Card>
                      <Card className="border border-slate-200 shadow-[0_8px_32px_rgba(0,0,0,0.05)] bg-green-900/20 backdrop-blur-xl relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-green-500 rounded-full blur-2xl opacity-20 pointer-events-none" />
                        <CardContent className="p-6 relative z-10">
                          <div className="text-sm text-green-600 mb-2">Assignments</div>
                          <div className="text-slate-900 text-3xl font-bold mb-1">A-</div>
                          <div className="text-xs text-green-300">88%</div>
                        </CardContent>
                      </Card>
                      <Card className="border border-slate-200 shadow-[0_8px_32px_rgba(0,0,0,0.05)] bg-purple-50/50 backdrop-blur-xl relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-500 rounded-full blur-2xl opacity-20 pointer-events-none" />
                        <CardContent className="p-6 relative z-10">
                          <div className="text-sm text-purple-600 mb-2">Attendance</div>
                          <div className="text-slate-900 text-3xl font-bold mb-1">95%</div>
                          <div className="text-xs text-purple-300">19/20 classes</div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card className="border border-slate-200 shadow-[0_8px_32px_rgba(0,0,0,0.05)] bg-white backdrop-blur-xl text-slate-900 mt-4">
                      <CardHeader>
                        <CardTitle className="text-slate-900">Grade Breakdown</CardTitle>
                        <CardDescription className="text-slate-500">Detailed performance analysis</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-slate-500">Assignments (40%)</span>
                              <span className="text-sm text-slate-900 font-medium">88%</span>
                            </div>
                            <Progress value={88} className="h-2 bg-slate-200" />
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-slate-500">Midterm (30%)</span>
                              <span className="text-sm text-slate-900 font-medium">82%</span>
                            </div>
                            <Progress value={82} className="h-2 bg-slate-200" />
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-slate-500">Quizzes (20%)</span>
                              <span className="text-sm text-slate-900 font-medium">90%</span>
                            </div>
                            <Progress value={90} className="h-2 bg-slate-200" />
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-slate-500">Participation (10%)</span>
                              <span className="text-sm text-slate-900 font-medium">85%</span>
                            </div>
                            <Progress value={85} className="h-2 bg-slate-200" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
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
                        <GraduationCap className="w-5 h-5 text-slate-900" />
                      </div>
                      <div>
                        <h1 className="text-slate-900 mb-0">Learning System</h1>
                        <p className="text-sm text-slate-500 mt-1">Access course materials, videos, and assignments</p>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
              <div className="flex items-center justify-end">
                <Button className="bg-gradient-to-r from-[#2563EB] to-[#7C3AED] hover:from-[#1d4ed8] hover:to-[#6D28D9] text-white shadow-lg">
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI Study Assistant
                </Button>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  {
                    title: "Active Courses",
                    value: enrolledCourses.length,
                    icon: BookOpen,
                    gradient: "from-blue-500 to-blue-600",
                    textColor: "text-blue-900",
                    iconColor: "text-blue-800"
                  },
                  {
                    title: "Pending Tasks",
                    value: enrolledCourses.reduce((sum, course) => sum + course.pendingAssignments, 0),
                    icon: Clock,
                    gradient: "from-orange-500 to-orange-600",
                    textColor: "text-orange-900",
                    iconColor: "text-orange-800"
                  },
                  {
                    title: "Avg. Progress",
                    value: `${Math.round(enrolledCourses.reduce((sum, course) => sum + course.progress, 0) / enrolledCourses.length)}%`,
                    icon: TrendingUp,
                    gradient: "from-green-500 to-green-600",
                    textColor: "text-green-900",
                    iconColor: "text-green-800"
                  },
                  {
                    title: "Unread Announcements",
                    value: enrolledCourses.reduce((sum, course) => sum + course.unreadAnnouncements, 0),
                    icon: Bell,
                    gradient: "from-purple-500 to-purple-600",
                    textColor: "text-purple-900",
                    iconColor: "text-purple-800"
                  }
                ].map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 + index * 0.1, ease: [0.4, 0, 0.2, 1] }}
                      whileHover={{ scale: 1.05, y: -4 }}
                    >
                      <Card className={`border border-slate-200 shadow-[0_8px_32px_rgba(0,0,0,0.05)] bg-white backdrop-blur-xl text-slate-900 relative overflow-hidden`}>
                        <div className={`absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br ${stat.gradient} rounded-full blur-2xl opacity-20 pointer-events-none`} />
                        <CardContent className="p-6 relative z-10">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-slate-500 text-sm mb-1">{stat.title}</div>
                              <div className="text-slate-900 text-3xl font-bold">{stat.value}</div>
                            </div>
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} p-[1px] shadow-lg`}>
                              <div className="w-full h-full bg-white rounded-[11px] flex items-center justify-center">
                                <Icon className={`w-6 h-6 text-slate-900`} />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>

              {/* Course Cards Grid - Remove old cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {enrolledCourses.map((course, index) => {
                  const Icon = course.id === "cs101" ? BookOpen : course.id === "math204" ? BookOpen : BookOpen;
                  return (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 + index * 0.1, ease: [0.4, 0, 0.2, 1] }}
                      whileHover={{ scale: 1.03, y: -4 }}
                    >
                      <Card
                        className="border border-slate-200 shadow-[0_8px_32px_rgba(0,0,0,0.05)] bg-white backdrop-blur-xl transition-all cursor-pointer group hover:border-slate-300 hover:bg-slate-50"
                        onClick={() => {
                          setSelectedCourse(course.id);
                          setActiveView("course");
                        }}
                      >
                        <CardHeader className="bg-slate-50 rounded-t-lg border-b border-slate-100">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-slate-900">{course.code}</CardTitle>
                              <CardDescription className="text-slate-900/80">{course.name}</CardDescription>
                            </div>
                            <motion.div
                              whileHover={{ rotate: 360 }}
                              transition={{ duration: 0.5 }}
                              className={`w-12 h-12 bg-gradient-to-br ${course.color} rounded-xl flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-white/20`}
                            >
                              <Icon className="w-6 h-6 text-white" />
                            </motion.div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-6 text-slate-900">
                          <div className="space-y-4">
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-slate-500">Progress</span>
                                <span className="text-sm font-medium text-slate-900">{course.progress}%</span>
                              </div>
                              <div className="relative h-2 bg-slate-200 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${course.progress}%` }}
                                  transition={{ duration: 1, delay: 0.4 + index * 0.1 }}
                                  className={`h-full rounded-full bg-gradient-to-r ${course.color}`}
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <div className="text-slate-500">Instructor</div>
                                <div className="text-slate-900 font-medium truncate">{course.instructor}</div>
                              </div>
                              <div>
                                <div className="text-slate-500">Students</div>
                                <div className="text-slate-900 font-medium">{course.students}</div>
                              </div>
                            </div>

                            <Separator className="bg-slate-100" />

                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2 text-slate-500">
                                <Clock className="w-4 h-4" />
                                <span className="text-slate-900">{course.nextClass}</span>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              {course.unreadAnnouncements > 0 && (
                                <Badge className="bg-red-500/20 text-red-600 border border-red-500/30">
                                  {course.unreadAnnouncements} New
                                </Badge>
                              )}
                              {course.pendingAssignments > 0 && (
                                <Badge className="bg-orange-500/20 text-orange-600 border border-orange-500/30">
                                  {course.pendingAssignments} Tasks
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>

              {/* Enrolled Courses Grid */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-slate-900 text-xl font-bold">My Courses</h2>
                  <div className="flex gap-2">
                    <Input placeholder="Search courses..." className="w-64 bg-white/50 border-slate-200 text-slate-900 placeholder-gray-400" />
                    <Button variant="outline" className="border-slate-200 bg-white/50 text-slate-900 hover:bg-slate-100">
                      <Filter className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {enrolledCourses.map((course, index) => (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1, ease: [0.4, 0, 0.2, 1] }}
                      whileHover={{ scale: 1.02, y: -4 }}
                    >
                      <Card
                        className="border border-slate-200 shadow-[0_8px_32px_rgba(0,0,0,0.05)] bg-white backdrop-blur-xl transition-all cursor-pointer group relative overflow-hidden"
                        onClick={() => {
                          setSelectedCourse(course.id);
                          setActiveView("course");
                        }}
                      >
                        <div className={`h-1 bg-gradient-to-r ${course.color} rounded-t-lg absolute top-0 left-0 right-0`}></div>
                        <CardContent className="p-6 pt-8">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <Badge className="bg-slate-100 text-slate-600 mb-2 border-slate-200">{course.code}</Badge>
                              <h3 className="text-slate-900 mb-1 group-hover:text-blue-600 transition-colors font-semibold text-lg">{course.name}</h3>
                              <div className="text-sm text-slate-500 flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                {course.instructor}
                              </div>
                            </div>
                            <div className={`w-14 h-14 bg-gradient-to-br ${course.color} rounded-xl flex items-center justify-center text-white shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-white/20`}>
                              <BookOpen className="w-6 h-6" />
                            </div>
                          </div>

                          <Separator className="my-4 bg-slate-100" />

                          <div className="space-y-3">
                            <div>
                              <div className="flex items-center justify-between text-sm mb-2">
                                <span className="text-slate-500">Course Progress</span>
                                <span className="text-slate-900 font-bold">{course.progress}%</span>
                              </div>
                              <Progress value={course.progress} className="h-2 bg-slate-200" />
                            </div>
                            <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                              <div className="p-2 bg-white/50 border border-slate-100 rounded-lg">
                                <div className="text-xs text-slate-500 mb-1">Materials</div>
                                <div className="text-sm text-slate-900 font-medium">{course.materials}</div>
                              </div>
                              <div className="p-2 bg-white/50 border border-slate-100 rounded-lg">
                                <div className="text-xs text-slate-500 mb-1">Videos</div>
                                <div className="text-sm text-slate-900 font-medium">{course.videos}</div>
                              </div>
                              <div className="p-2 bg-white/50 border border-slate-100 rounded-lg">
                                <div className="text-xs text-slate-500 mb-1">Rating</div>
                                <div className="text-sm text-slate-900 font-medium flex items-center justify-center gap-1">
                                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-500" />
                                  {course.rating}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-2">
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                <Clock className="w-4 h-4" />
                                <span className="text-slate-900">{course.nextClass}</span>
                              </div>
                              {course.unreadAnnouncements > 0 && (
                                <Badge className="bg-red-500/20 border-red-500/30 text-red-600">
                                  {course.unreadAnnouncements} new
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {Modals}
        </div>
      </div>
    </div>
  );
}




