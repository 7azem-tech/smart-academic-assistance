import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { UploadCloud, MessageSquare, Send, FileText, Loader2, Bot, User, FileUp, Trash2, Camera, Sparkles, Zap, Mic, MicOff, Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { toast } from 'sonner';
import { adminService, Subject } from '../services/adminService';
import { Search, ChevronLeft, BookOpen, Settings, CheckCircle2, Database, TrendingUp, X, Activity } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '../contexts/AuthContext';
import { PDFPreviewModal } from './PDFPreviewModal';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    snippets?: string[];
    citations?: any[];
    isNew?: boolean;
}

interface SmartAssistantTabProps {
    /** When true, hides the Knowledge Base tab — used for the student-facing sidebar view */
    studentOnly?: boolean;
}

export function SmartAssistantTab({ studentOnly = false }: SmartAssistantTabProps) {
    const [view, setView] = useState<'chat' | 'knowledge'>('chat');

    // Students only see the chat interface — no Knowledge Base access
    if (studentOnly) {
        return (
            <div className="space-y-6">
                <motion.div key="student-chat" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <ChatInterface />
                </motion.div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex gap-4 mb-4">
                <Button
                    variant={view === 'chat' ? 'default' : 'outline'}
                    onClick={() => setView('chat')}
                    className="flex items-center gap-2 rounded-xl transition-all"
                >
                    <MessageSquare className="w-4 h-4" /> Student Assistant
                </Button>
                <Button
                    variant={view === 'knowledge' ? 'default' : 'outline'}
                    onClick={() => setView('knowledge')}
                    className="flex items-center gap-2 rounded-xl transition-all"
                >
                    <UploadCloud className="w-4 h-4" /> Knowledge Base (Professors)
                </Button>
            </div>

            <AnimatePresence mode="wait">
                {view === 'chat' ? (
                    <motion.div key="chat" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                        <ChatInterface />
                    </motion.div>
                ) : (
                    <motion.div key="knowledge" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                        <KnowledgeBase />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function KnowledgeBase() {
    const [isUploading, setIsUploading] = React.useState(false);
    const [progress, setProgress] = React.useState(0);
    const [subjects, setSubjects] = React.useState<Subject[]>([]);
    const [stats, setStats] = React.useState<{ totalPdfs: number, counts: Record<string, number>, lastActivity: string }>({ totalPdfs: 0, counts: {}, lastActivity: 'None' });
    const [isLoading, setIsLoading] = React.useState(true);
    const [searchQuery, setSearchQuery] = React.useState('');

    // Modal states
    const [activeModal, setActiveModal] = React.useState<'view' | 'upload' | 'manage' | null>(null);
    const [activeSubject, setActiveSubject] = React.useState<Subject | null>(null);
    const [documents, setDocuments] = React.useState<{ id: string, filename: string, uploaded_at: string, subjectId: string }[]>([]);
    const [uploadSuccess, setUploadSuccess] = React.useState(false);

    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const botAvatarInputRef = React.useRef<HTMLInputElement>(null);

    const fetchStats = async () => {
        const subs = adminService.getSubjects();
        setSubjects(subs);

        let total = 0;
        let counts: Record<string, number> = {};
        let latestDate: Date | null = null;

        const results = await Promise.all(subs.map(s =>
            fetch(`http://localhost:3005/api/documents?subjectId=${s.id}`).then(r => r.json()).catch(() => []) as Promise<{ id: string, filename: string, uploaded_at: string, subjectId: string }[]>
        ));

        results.forEach((docs, index) => {
            const sId = subs[index].id;
            counts[sId] = docs.length;
            total += docs.length;
            docs.forEach((d) => {
                const dDate = new Date(d.uploaded_at);
                if (!latestDate || dDate > latestDate) latestDate = dDate;
            });
        });

        setStats({
            totalPdfs: total,
            counts,
            lastActivity: latestDate ? (latestDate as any).toLocaleDateString() : 'No activity yet'
        });
        setIsLoading(false);
    };

    React.useEffect(() => {
        fetchStats();
    }, []);

    const fetchDocuments = async (subjectId: string) => {
        try {
            const res = await fetch(`http://localhost:3005/api/documents?subjectId=${subjectId}`);
            if (res.ok) setDocuments(await res.json());
        } catch (e) {
            console.error('Failed to fetch documents', e);
        }
    };

    const handleDelete = async (id: string, filename: string) => {
        if (!confirm(`Are you sure you want to delete "${filename}"?`)) return;
        try {
            const res = await fetch(`http://localhost:3005/api/documents/${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Document deleted securely');
                if (activeSubject) fetchDocuments(activeSubject.id);
                fetchStats();
            } else {
                toast.error('Failed to delete document');
            }
        } catch (e) {
            toast.error('Deletion error');
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0 || !activeSubject) return;

        const formData = new FormData();
        formData.append('subjectId', activeSubject.id);
        for (let i = 0; i < files.length; i++) {
            if (files[i].type !== 'application/pdf') {
                toast.error(`File ${files[i].name} is not a PDF.`);
                continue;
            }
            formData.append('pdfs', files[i]);
        }

        if (!formData.has('pdfs')) return;

        setIsUploading(true);
        setUploadSuccess(false);
        setProgress(30);

        try {
            const res = await fetch('http://localhost:3005/api/upload-pdf', {
                method: 'POST',
                body: formData,
            });
            setProgress(80);

            if (!res.ok) throw new Error('Upload failed');

            const data = await res.json();
            setProgress(100);
            setUploadSuccess(true);
            toast.success(data.message || 'PDFs processed successfully!');
            fetchStats();
            setTimeout(() => {
                setIsUploading(false);
                setProgress(0);
                setTimeout(() => closeModal(), 1000);
            }, 1000);
        } catch (error) {
            toast.error('Failed to upload PDFs.');
            setIsUploading(false);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleBotAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activeSubject) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                adminService.updateSubjectBotAvatar(activeSubject.id, reader.result);
                fetchStats();
                toast.success("Professor avatar updated!");
                closeModal();
            }
        };
        reader.readAsDataURL(file);
    };

    const openModal = (mode: 'view' | 'upload' | 'manage', subject: Subject) => {
        setActiveSubject(subject);
        setActiveModal(mode);
        if (mode === 'view') fetchDocuments(subject.id);
    };

    const closeModal = () => {
        setActiveModal(null);
        setTimeout(() => {
            setActiveSubject(null);
            setUploadSuccess(false);
        }, 300);
    };

    const filteredSubjects = subjects.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="w-full relative min-h-[500px]">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 font-['Inter']">Knowledge Base</h1>
                    <p className="text-gray-500 mt-1">Professor-curated academic content & resources</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative max-w-sm w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Find a subject..."
                            className="pl-10 bg-white shadow-sm border-gray-200 rounded-xl"
                            value={searchQuery}
                            onChange={(e: any) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="hidden sm:flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full border border-indigo-100/50 shadow-sm">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-xs font-semibold tracking-wide uppercase">Admin Access Active</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                <div className="xl:col-span-8">
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[1, 2, 3, 4, 5, 6].map(k => (
                                <div key={k} className="bg-white/40 p-5 rounded-2xl border border-gray-100 flex gap-4 animate-pulse">
                                    <div className="w-14 h-14 bg-gray-200 rounded-full shrink-0" />
                                    <div className="flex-1 space-y-3 py-1">
                                        <div className="h-5 bg-gray-200 rounded w-1/2" />
                                        <div className="h-4 bg-gray-200 rounded w-1/4" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : filteredSubjects.length === 0 ? (
                        <div className="text-center py-20 bg-white/50 rounded-3xl border border-dashed border-gray-200 shadow-sm">
                            <Database className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                            <h3 className="text-lg font-semibold text-gray-900">No Subjects Found</h3>
                            <p className="text-gray-500 text-sm">Adjust search query or add subjects.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <AnimatePresence>
                                {filteredSubjects.map((subject, index) => (
                                    <motion.div
                                        key={subject.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.2, delay: index * 0.05 }}
                                        className="group relative"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-[#2563EB] to-[#7C3AED] rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                                        <Card className="relative h-full overflow-hidden border-gray-100 hover:border-indigo-100 bg-white/80 hover:bg-white backdrop-blur-md shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group">
                                            <CardContent className="p-6 flex-1 flex flex-col justify-between">
                                                <div>
                                                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-indigo-100/50 overflow-hidden">
                                                        {subject.botProfileImage ? (
                                                            <img src={subject.botProfileImage} alt="Avatar" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Bot className="w-6 h-6" />
                                                        )}
                                                    </div>
                                                    <h3 className="font-bold text-gray-900 group-hover:text-indigo-700 transition-colors line-clamp-2">{subject.name}</h3>
                                                    <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest mt-1.5">{subject.code}</p>
                                                </div>

                                                <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between w-full">
                                                    <div className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 bg-gray-50/50 px-2 py-1 rounded-md border border-gray-100">
                                                        <FileText className="w-3 h-3 text-indigo-400" />
                                                        <span>{stats.counts[subject.id] || 0} PDFs</span>
                                                    </div>

                                                    <div className="flex items-center gap-0.5">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            title="View PDFs"
                                                            onClick={(e: React.MouseEvent) => { e.stopPropagation(); openModal('view', subject); }}
                                                            className="h-7 w-7 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all z-20 relative"
                                                        >
                                                            <BookOpen className="w-[14px] h-[14px]" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            title="Upload PDF"
                                                            onClick={(e: React.MouseEvent) => { e.stopPropagation(); openModal('upload', subject); }}
                                                            className="h-7 w-7 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all z-20 relative"
                                                        >
                                                            <UploadCloud className="w-[14px] h-[14px]" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            title="Customize Avatar"
                                                            onClick={(e: React.MouseEvent) => { e.stopPropagation(); openModal('manage', subject); }}
                                                            className="h-7 w-7 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all z-20 relative"
                                                        >
                                                            <Settings className="w-[14px] h-[14px]" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>

                <div className="xl:col-span-4">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4 }}
                        className="bg-white/60 backdrop-blur-lg border border-white/40 rounded-[1.5rem] p-6 text-gray-900 shadow-xl relative overflow-hidden h-full flex flex-col"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-200/50 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-200/50 blur-[60px] rounded-full -translate-x-1/2 translate-y-1/2" />

                        <div className="relative z-10 flex flex-col h-full">
                            <h3 className="text-[17px] font-extrabold mb-6 flex items-center gap-2 shrink-0 text-gray-900 tracking-tight">
                                <TrendingUp className="w-5 h-5 text-indigo-600" />
                                Professor Insights
                            </h3>

                            <div className="space-y-4 flex-1">
                                <div className="bg-white/80 border border-gray-100 shadow-sm rounded-[1.125rem] p-4.5 p-4 hover:shadow-md transition-shadow duration-300">
                                    <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5"><Database className="w-3.5 h-3.5 text-indigo-400" /> Total Resources</div>
                                    <div className="text-4xl font-black bg-gradient-to-r from-indigo-700 to-purple-600 bg-clip-text text-transparent">
                                        {isLoading ? '-' : stats.totalPdfs} <span className="text-[13px] font-bold text-gray-400 uppercase tracking-widest leading-10">PDFs</span>
                                    </div>
                                </div>

                                <div className="bg-white/80 border border-gray-100 shadow-sm rounded-[1.125rem] p-4.5 p-4 hover:shadow-md transition-shadow duration-300">
                                    <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5"><Bot className="w-3.5 h-3.5 text-purple-400" /> Active Avatars</div>
                                    <div className="text-3xl font-black text-gray-900 flex items-baseline gap-1.5">
                                        {isLoading ? '-' : Object.keys(stats.counts).filter(k => stats.counts[k] > 0).length}
                                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">/ {subjects.length} active</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-gray-100 rounded-full mt-3 overflow-hidden shadow-inner hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${subjects.length ? (Object.keys(stats.counts).filter(k => stats.counts[k] > 0).length / subjects.length) * 100 : 0}%` }}
                                            transition={{ duration: 1, ease: 'easeOut' }}
                                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                                        />
                                    </div>
                                </div>

                                <div className="bg-white/80 border border-gray-100 shadow-sm rounded-[1.125rem] p-4.5 p-4 flex items-center justify-between hover:shadow-md transition-shadow duration-300">
                                    <div>
                                        <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-0.5">Last Update</div>
                                        <div className="text-sm text-gray-900 font-extrabold">{isLoading ? '-' : stats.lastActivity}</div>
                                    </div>
                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 shadow-sm">
                                        <Activity className="w-5 h-5" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {createPortal(
                <AnimatePresence>
                    {activeModal && activeSubject && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                onClick={closeModal}
                                className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.96, y: 15 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.96, y: 15 }}
                                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                                className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-white"
                            >
                                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                            {activeModal === 'view' && <BookOpen className="w-4 h-4 text-indigo-600" />}
                                            {activeModal === 'upload' && <UploadCloud className="w-4 h-4 text-green-600" />}
                                            {activeModal === 'manage' && <Settings className="w-4 h-4 text-purple-600" />}
                                            {activeModal === 'view' ? 'Professor Library' : activeModal === 'upload' ? 'Upload Resources' : 'Professor Settings'}
                                        </h2>
                                        <p className="text-xs text-gray-500 mt-0.5">{activeSubject.name} ({activeSubject.code})</p>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={closeModal} className="rounded-full hover:bg-gray-200 h-8 w-8 shrink-0">
                                        <X className="w-4 h-4 text-gray-500" />
                                    </Button>
                                </div>

                                <div className="p-6 overflow-hidden">
                                    {activeModal === 'view' && (
                                        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                                            {documents.length === 0 ? (
                                                <div className="text-center py-10 text-gray-500">
                                                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                                        <FileText className="w-5 h-5 text-gray-300" />
                                                    </div>
                                                    <p className="font-medium text-sm">No PDFs uploaded yet.</p>
                                                </div>
                                            ) : (
                                                documents.map(doc => (
                                                    <motion.div key={doc.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all group">
                                                        <div className="flex items-center gap-3 overflow-hidden pr-2">
                                                            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                                <FileText className="w-4 h-4" />
                                                            </div>
                                                            <div className="truncate">
                                                                <p className="font-semibold text-gray-900 text-sm truncate">{doc.filename}</p>
                                                                <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mt-0.5">{(new Date(doc.uploaded_at) as any).toLocaleDateString()}</p>
                                                            </div>
                                                        </div>
                                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(doc.id, doc.filename)} className="text-red-400 hover:text-red-600 hover:bg-red-50 shrink-0 h-8 w-8 rounded-lg">
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </motion.div>
                                                ))
                                            )}
                                        </div>
                                    )}

                                    {activeModal === 'upload' && (
                                        <div
                                            onClick={() => !isUploading && !uploadSuccess && fileInputRef.current?.click()}
                                            className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all flex flex-col items-center justify-center gap-4 ${isUploading ? 'border-indigo-200 bg-indigo-50/50' : uploadSuccess ? 'border-green-300 bg-green-50/50' : 'border-indigo-200/60 hover:bg-indigo-50/50 hover:border-indigo-400 cursor-pointer'}`}
                                        >
                                            <input type="file" ref={fileInputRef} onChange={handleUpload} multiple accept="application/pdf" className="hidden" />

                                            {isUploading ? (
                                                <div className="w-full text-center space-y-4">
                                                    <motion.div animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-md border border-indigo-100 relative">
                                                        <div className="absolute inset-0 bg-indigo-100/50 blur-xl rounded-full scale-150 animate-pulse" />
                                                        <UploadCloud className="w-8 h-8 text-indigo-600 relative z-10" />
                                                    </motion.div>
                                                    <div>
                                                        <h3 className="text-indigo-900 font-bold text-sm mb-2 flex items-center justify-center gap-2">
                                                            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" /> Processing PDFs...
                                                        </h3>
                                                        <div className="w-full h-2 bg-indigo-100 rounded-full overflow-hidden shadow-inner flex items-center">
                                                            <motion.div className="h-full bg-indigo-600" initial={{ width: 0 }} animate={{ width: `${progress}%` }} />
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : uploadSuccess ? (
                                                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-4">
                                                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3 border border-green-200 shadow-sm relative">
                                                        <div className="absolute inset-0 bg-green-400/20 rounded-full animate-ping" />
                                                        <CheckCircle2 className="w-8 h-8 relative z-10" />
                                                    </div>
                                                    <h3 className="text-green-800 font-bold text-lg">Upload Success!</h3>
                                                    <p className="text-xs text-green-600/80 mt-1">Intelligence base updated.</p>
                                                </motion.div>
                                            ) : (
                                                <div className="py-2">
                                                    <div className="w-16 h-16 bg-white text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-indigo-50 group-hover:text-indigo-600 group-hover:scale-110 transition-all duration-300">
                                                        <UploadCloud className="w-8 h-8" />
                                                    </div>
                                                    <h3 className="text-[15px] font-bold text-gray-900 group-hover:text-indigo-700 transition-colors">Select PDFs to train AI</h3>
                                                    <p className="text-[11px] text-gray-500 mt-1 uppercase tracking-wider font-semibold">Drop zone active</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {activeModal === 'manage' && activeSubject && (
                                        <div className="flex flex-col items-center py-4">
                                            <div
                                                className="relative w-28 h-28 rounded-full border-2 border-dashed border-purple-200 cursor-pointer overflow-hidden group flex items-center justify-center bg-purple-50 shadow-sm"
                                                onClick={() => botAvatarInputRef.current?.click()}
                                            >
                                                {activeSubject.botProfileImage ? (
                                                    <img src={activeSubject.botProfileImage} alt="Avatar" className="w-full h-full object-cover group-hover:blur-[2px] transition-all" />
                                                ) : (
                                                    <span className="text-4xl font-bold text-purple-300 group-hover:text-purple-500 transition-colors">P</span>
                                                )}
                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Camera className="w-6 h-6 text-white" />
                                                </div>
                                            </div>
                                            <input type="file" ref={botAvatarInputRef} onChange={handleBotAvatarUpload} accept="image/*" className="hidden" />
                                            <h3 className="mt-4 text-sm font-bold text-gray-900">Custom Professor Avatar</h3>
                                            <p className="text-xs text-gray-500 text-center mt-1">Click to replace the default AI icon.</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
}

function TypewriterMarkdown({ content, isNew, onUpdate, onCitationClick }: { 
    content: string; 
    isNew?: boolean; 
    onUpdate?: () => void;
    onCitationClick?: (pageText: string) => void;
}) {
    const [displayedContent, setDisplayedContent] = React.useState(isNew ? '' : content);

    React.useEffect(() => {
        if (!isNew) {
            setDisplayedContent(content);
            return;
        }

        let i = 0;
        const interval = setInterval(() => {
            setDisplayedContent(content.slice(0, i));
            i += 5; // typing speed
            if (onUpdate) onUpdate();
            if (i >= content.length) {
                clearInterval(interval);
                setDisplayedContent(content);
                if (onUpdate) onUpdate();
            }
        }, 15);

        return () => clearInterval(interval);
    }, [content, isNew]);

    // Dynamically look for any [Page XY] items in the output and convert them to internal links for custom styling.
    const formattedContent = displayedContent.replace(/\[\s*(page\s*\d+|p\.\s*\d+)\s*\]/gi, (match, p1) => `[${p1}](#page-ref)`);

    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
                p: ({ node, ...props }) => <p className="mb-4 last:mb-0 leading-7 text-gray-800" {...props} />,
                ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-4 mt-2 space-y-2" {...props} />,
                ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-4 mt-2 space-y-2" {...props} />,
                li: ({ node, ...props }) => <li className="leading-7 text-gray-800" {...props} />,
                h1: ({ node, ...props }) => <h1 className="text-xl font-bold mb-3 mt-5 text-gray-900 border-b pb-1 border-gray-100" {...props} />,
                h2: ({ node, ...props }) => <h2 className="text-lg font-bold mb-3 mt-5 text-gray-900" {...props} />,
                h3: ({ node, ...props }) => <h3 className="text-md font-bold mb-2 mt-4 text-gray-900" {...props} />,
                strong: ({ node, ...props }) => <strong className="font-semibold text-gray-950" {...props} />,
                code: ({ node, inline, ...props }: any) => inline ? <code className="bg-indigo-50 text-indigo-800 px-1 py-0.5 rounded-md text-[13px] border border-indigo-100 font-mono" {...props} /> : <div className="bg-slate-900 text-gray-100 p-4 rounded-xl overflow-x-auto mb-3 text-sm shadow-inner"><code className="font-mono" {...props} /></div>,
                a: ({ node, href, children, ...props }: any) => {
                    if (href === '#page-ref') {
                        return (
                            <motion.sup
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, ease: 'easeOut' }}
                                className="text-[#14B8A6] font-bold text-[11px] ml-0.5 cursor-pointer hover:text-teal-500 hover:underline transition-colors"
                                onClick={() => onCitationClick?.(String(children))}
                                {...props}
                            >
                                {children}
                            </motion.sup>
                        );
                    }
                    return <a href={href} className="text-blue-600 hover:underline" {...props}>{children}</a>;
                },
            }}
        >
            {formattedContent}
        </ReactMarkdown>
    );
}

function PremiumInput({ onSend, isLoading, inputRef }: {
    onSend: (value: string) => void;
    isLoading: boolean;
    inputRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
    // Fully uncontrolled — no React state updated while typing, zero re-renders
    const [hasContent, setHasContent] = React.useState(false);
    const [isListening, setIsListening] = React.useState(false);
    const recognitionRef = React.useRef<any>(null);

    const toggleListening = (e: React.MouseEvent) => {
        e.preventDefault();
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            toast.error("Speech recognition is not supported in this browser. Try Chrome or Edge.");
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
            if (inputRef.current) {
                const currentVal = inputRef.current.value;
                inputRef.current.value = currentVal ? `${currentVal} ${transcript}` : transcript;
                setHasContent(true);
                // Dispatch input event to update the textarea auto-height
                const evt = new Event('input', { bubbles: true });
                inputRef.current.dispatchEvent(evt);
            }
        };

        rec.onerror = (event: any) => {
            console.error("Speech recognition error:", event.error);
            setIsListening(false);
            if (event.error === 'not-allowed') {
                toast.error("Microphone access blocked. Please enable it in browser settings.");
            } else {
                toast.error("Speech recognition failed: " + event.error);
            }
        };

        rec.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current = rec;
        rec.start();
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const nonEmpty = e.target.value.trim().length > 0;
        if (nonEmpty !== hasContent) setHasContent(nonEmpty); // only flips once per typing session
        e.target.style.height = 'auto';
        e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
    };
    const handleSend = () => {
        const val = inputRef.current?.value ?? '';
        if (!val.trim() || isLoading) return;
        onSend(val);
        if (inputRef.current) { inputRef.current.value = ''; inputRef.current.style.height = 'auto'; }
        setHasContent(false);
    };
    return (
        <div style={{ position: 'relative', flexShrink: 0, width: '100%', maxWidth: '780px', margin: '0 auto', paddingBottom: '20px', paddingTop: '8px' }}>
            {/* Glow halo — CSS opacity, never re-animates while typing */}
            <div style={{ position: 'absolute', inset: '-6px', borderRadius: '34px', pointerEvents: 'none', zIndex: 0, background: 'linear-gradient(135deg,rgba(37,99,235,.18),rgba(124,58,237,.14),rgba(37,99,235,.14))', filter: 'blur(16px)', opacity: hasContent ? 1 : 0, transition: 'opacity 0.5s ease' }} />

            {/* Shell — pure CSS transitions */}
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'flex-end', borderRadius: '26px', border: '1.5px solid transparent', backgroundColor: 'white', background: hasContent ? 'linear-gradient(white,white) padding-box,linear-gradient(135deg,#2563EB,#7C3AED) border-box' : 'linear-gradient(white,white) padding-box,linear-gradient(135deg,#e5e7eb,#e5e7eb) border-box', boxShadow: hasContent ? '0 8px 32px rgba(37,99,235,.14),0 2px 8px rgba(0,0,0,.06)' : '0 2px 12px rgba(0,0,0,.07),0 1px 3px rgba(0,0,0,.04)', transition: 'background 0.45s ease, box-shadow 0.45s ease' }}>
                {/* Sparkles — CSS transition, zero JS per keystroke */}
                <div style={{ paddingLeft: '16px', paddingBottom: '15px', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                    <div style={{ display: 'flex', color: hasContent ? '#2563EB' : '#D1D5DB', transform: hasContent ? 'scale(1.22)' : 'scale(1)', transition: 'color 0.4s ease, transform 0.4s ease' }}>
                        <Sparkles style={{ width: '16px', height: '16px' }} />
                    </div>
                </div>

                {/* Textarea — UNCONTROLLED, no value= prop, zero React re-renders while typing */}
                <textarea ref={inputRef} autoFocus onChange={handleChange} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} rows={1} placeholder="Ask a question and AI will answer from official course materials..." disabled={isLoading} aria-label="Message input" style={{ flex: 1, resize: 'none', background: 'transparent', padding: '16px 10px', fontSize: '14.5px', fontFamily: 'Inter,system-ui,sans-serif', fontWeight: 450, color: '#111827', outline: 'none', border: 'none', maxHeight: '200px', minHeight: '54px', overflowY: 'auto', lineHeight: 1.65 }} />

                {/* Right side */}
                <div style={{ display: 'flex', alignItems: 'flex-end', paddingRight: '10px', paddingBottom: '10px', gap: '8px', flexShrink: 0 }}>
                    {/* Dictate Button */}
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <AnimatePresence>
                            {isListening && (
                                <motion.div
                                    key="mic-ring"
                                    initial={{ opacity: 0.55, scale: 0.85 }}
                                    animate={{ opacity: 0, scale: 1.9 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
                                    style={{ position: 'absolute', width: '36px', height: '36px', borderRadius: '50%', background: '#EF4444', pointerEvents: 'none' }}
                                />
                            )}
                        </AnimatePresence>
                        <motion.button
                            onClick={toggleListening}
                            disabled={isLoading}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.91 }}
                            style={{
                                position: 'relative', zIndex: 1, width: '36px', height: '36px', borderRadius: '50%', border: 'none',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: isListening ? '#EF4444' : '#F3F4F6',
                                boxShadow: isListening ? '0 4px 16px rgba(239, 68, 68, 0.38)' : 'none',
                                transition: 'background .4s ease, box-shadow .4s ease',
                            }}
                            title={isListening ? "Stop listening" : "Dictate question"}
                            aria-label="Dictate message"
                            type="button"
                        >
                            {isListening ? (
                                <Mic style={{ width: '14px', height: '14px', color: 'white' }} />
                            ) : (
                                <MicOff style={{ width: '14px', height: '14px', color: '#9CA3AF' }} />
                            )}
                        </motion.button>
                    </div>

                    {/* Send button */}
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <AnimatePresence>
                            {hasContent && !isLoading && (
                                <motion.div key="ring"
                                    initial={{ opacity: 0.55, scale: 0.85 }} animate={{ opacity: 0, scale: 1.9 }} exit={{ opacity: 0 }}
                                    transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
                                    style={{ position: 'absolute', width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg,#2563EB,#7C3AED)', pointerEvents: 'none' }}
                                />
                            )}
                        </AnimatePresence>
                        <motion.button
                            onClick={handleSend}
                            disabled={isLoading || !hasContent}
                            whileHover={hasContent && !isLoading ? { scale: 1.1 } : {}}
                            whileTap={hasContent ? { scale: 0.91 } : {}}
                            style={{
                                position: 'relative', zIndex: 1, width: '36px', height: '36px', borderRadius: '50%', border: 'none',
                                cursor: hasContent && !isLoading ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: hasContent ? 'linear-gradient(135deg,#2563EB 0%,#7C3AED 100%)' : '#F3F4F6',
                                boxShadow: hasContent ? '0 4px 16px rgba(37,99,235,.38)' : 'none',
                                transition: 'background .4s ease, box-shadow .4s ease',
                            }}
                            aria-label="Send message"
                            type="button"
                        >
                            {isLoading
                                ? <Loader2 style={{ width: '15px', height: '15px', color: 'white' }} className="animate-spin" />
                                : <Send style={{ width: '14px', height: '14px', color: hasContent ? 'white' : '#9CA3AF', marginLeft: '1px' }} />
                            }
                        </motion.button>
                    </div>
                </div>
            </div>

            {/* Bottom hint */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', marginTop: '10px', opacity: 0.5 }}>
                <Zap style={{ width: '9px', height: '9px', color: '#2563EB' }} />
                <span style={{ fontSize: '10.5px', color: '#9CA3AF', fontFamily: 'Inter,sans-serif', fontWeight: 500 }}>Powered by your course materials</span>
                <span style={{ fontSize: '10px', color: '#D1D5DB' }}>·</span>
                <span style={{ fontSize: '10.5px', color: '#9CA3AF', fontFamily: 'Inter,sans-serif', fontWeight: 500 }}>
                    Press <kbd style={{ background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: '4px', padding: '0 4px', fontSize: '9.5px', color: '#6B7280', fontFamily: 'monospace' }}>Enter</kbd> to send
                </span>
            </div>
        </div>
    );
}

function ChatInterface() {
    const { user } = useAuth();
    const [activeSubject, setActiveSubject] = useState<Subject | null>(null);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Chat state
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Audio & Citation states
    const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
    const [previewCitation, setPreviewCitation] = useState<any | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    React.useEffect(() => {
        return () => {
            window.speechSynthesis.cancel();
        };
    }, []);

    const speakText = (text: string, msgId: string) => {
        if (speakingMessageId === msgId) {
            window.speechSynthesis.cancel();
            setSpeakingMessageId(null);
            return;
        }

        window.speechSynthesis.cancel();
        
        // Strip markdown and page notations
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

        setSpeakingMessageId(msgId);
        window.speechSynthesis.speak(utterance);
    };

    const handleCitationClick = (pageStr: string, message: Message) => {
        const pageMatch = pageStr.match(/\d+/);
        if (!pageMatch) return;
        const pageNum = parseInt(pageMatch[0], 10);
        
        const citation = message.citations?.find(c => c.page === pageNum);
        if (citation) {
            setPreviewCitation(citation);
            setIsPreviewOpen(true);
        } else {
            const snippetMatch = message.snippets?.find(s => s.toLowerCase().includes(`page ${pageNum}`) || s.toLowerCase().includes(`page: ${pageNum}`));
            const filename = snippetMatch 
                ? snippetMatch.replace(/[-–(]?\s*(?:page|p\.)\s*\d+\s*\)?/gi, '').replace('Source PDF:', '').trim()
                : ((message as any).source?.file || "Course_Materials.pdf");
            
            setPreviewCitation({
                filename: filename || "Course_Materials.pdf",
                page: pageNum,
                url: (message as any).source?.url || null,
                text: message.content
            });
            setIsPreviewOpen(true);
        }
    };

    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight + 10000;
        }
    };

    React.useEffect(() => {
        setSubjects(adminService.getSubjects());
    }, []);

    const SAVE_KEY = `chat_history_${user?.id}_${activeSubject?.id}`;

    const formatMessageDate = (timestamp: string) => {
        if (timestamp === 'welcome') return 'Today';
        const date = new Date(Number(timestamp));
        if (isNaN(date.getTime())) return 'Today';

        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return (date as any).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
        }
    };

    // Reset chat when subject changes
    React.useEffect(() => {
        if (activeSubject) {
            const savedHistory = localStorage.getItem(SAVE_KEY);
            if (savedHistory) {
                const parsed = JSON.parse(savedHistory).map((m: any) => ({ ...m, isNew: false }));
                setMessages(parsed);
            } else {
                setMessages([{
                    id: 'welcome',
                    role: 'assistant',
                    content: `Hello! I am the AI Knowledge Assistant for **${activeSubject.name}**. Ask me questions about the uploaded course materials for this subject.`,
                    isNew: true
                }]);
            }
            if (inputRef.current) { inputRef.current.value = ''; inputRef.current.style.height = 'auto'; }

            // Wait for Framer Motion entrance animation (0.4s) to finish completely
            // Certain browsers ignore focus() or scroll requests on moving/animating DOM elements.
            setTimeout(() => {
                // Focus the pointer first
                inputRef.current?.focus();

                // Force scroll chat to bottom
                if (scrollRef.current) {
                    scrollRef.current.scrollTop = scrollRef.current.scrollHeight + 10000;
                }

                // Use robust window scroll to drag the entire page downwards
                window.scrollTo({
                    top: document.documentElement.scrollHeight || document.body.scrollHeight,
                    behavior: 'smooth'
                });
            }, 450);
        }
    }, [activeSubject, user?.id]);

    React.useEffect(() => {
        if (activeSubject && messages.length > 0) {
            localStorage.setItem(SAVE_KEY, JSON.stringify(messages));
        }
        // Small delay to ensure DOM is updated before scrolling, avoid race conditions 
        const timer = setTimeout(() => scrollToBottom(), 100);
        return () => clearTimeout(timer);
    }, [messages, activeSubject, SAVE_KEY]);

    const handleSend = async (value?: string) => {
        const text = (value ?? inputRef.current?.value ?? '').trim();
        if (!text) return;

        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text };
        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);
        setTimeout(() => scrollToBottom(), 50);

        try {
            const res = await fetch('http://localhost:3005/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: userMsg.content,
                    subjectId: activeSubject ? activeSubject.id : 'general'
                }),
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to get answer');
            }

            const assistMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.answer || 'No answer generated.',
                snippets: data.snippets,
                citations: data.citations,
                isNew: true
            };
            setMessages(prev => [...prev, assistMsg]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `Error: ${error instanceof Error ? error.message : 'Failed to connect to the knowledge base server.'}`,
                isNew: true
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!activeSubject) {
        // SUBJECT SELECTION GRID
        const filteredSubjects = subjects.filter(s =>
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.code.toLowerCase().includes(searchQuery.toLowerCase())
        );

        return (
            <div className="flex flex-col gap-6 h-[700px]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Academic Chatbot Hub</h2>
                        <p className="text-gray-500">Select a course to interact with its dedicated AI Assistant.</p>
                    </div>
                    <div className="relative max-w-sm w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Find a subject..."
                            className="pl-10 bg-white shadow-sm border-gray-200"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <ScrollArea className="flex-1 -mx-2 px-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-10">
                        <AnimatePresence>
                            {filteredSubjects.map(subject => (
                                <motion.div
                                    key={subject.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    className="group relative"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-[#2563EB] to-[#7C3AED] rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                                    <Card
                                        className="relative h-full overflow-hidden border-gray-100 hover:border-indigo-100 bg-white/80 hover:bg-white backdrop-blur-md shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col group"
                                        onClick={() => setActiveSubject(subject)}
                                    >
                                        <CardContent className="p-6 flex-1 flex flex-col justify-between">
                                            <div>
                                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-indigo-100/50 overflow-hidden">
                                                    {subject.botProfileImage ? (
                                                        <img src={subject.botProfileImage} alt="Avatar" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Bot className="w-6 h-6" />
                                                    )}
                                                </div>
                                                <h3 className="font-bold text-gray-900 group-hover:text-indigo-700 transition-colors line-clamp-2">{subject.name}</h3>
                                                <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest mt-1.5">{subject.code}</p>
                                            </div>
                                            <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between w-full">
                                                <span className="text-sm text-gray-500">Subject Knowledge Base</span>
                                                <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                                    <ChevronLeft className="w-4 h-4 rotate-180" />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {filteredSubjects.length === 0 && (
                            <div className="col-span-full py-20 text-center text-gray-500">
                                <Search className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                                <p>No subjects found matching "{searchQuery}"</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="w-full flex flex-col h-[700px] overflow-hidden rounded-2xl border-none shadow-none"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
        >
            <div className="flex items-center justify-between p-4 shrink-0 bg-transparent relative z-10">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setActiveSubject(null)}
                        className="shrink-0 h-10 w-10 text-gray-400 hover:bg-gray-100/50 hover:text-gray-900 transition-all rounded-xl"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <div className="w-10 h-10 rounded-full bg-white overflow-hidden flex items-center justify-center shadow-sm border border-gray-200 shrink-0">
                        {activeSubject.botProfileImage ? (
                            <img src={activeSubject.botProfileImage} alt="Assistant" className="w-full h-full object-cover" />
                        ) : (
                            <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${activeSubject.id}`} alt="Assistant avatar" className="w-7 h-7 mix-blend-multiply" />
                        )}
                    </div>
                    <div className="truncate pr-4">
                        <h3 className="text-[15px] text-gray-900 font-bold truncate tracking-tight">{activeSubject.name}</h3>
                        <p className="text-[12px] font-medium text-gray-500 truncate">{activeSubject.code} Subject Assistant</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => {
                            setMessages([{
                                id: 'welcome',
                                role: 'assistant',
                                content: `Hello! I am the AI Knowledge Assistant for **${activeSubject.name}**. Ask me questions about the uploaded course materials for this subject.`,
                                isNew: true
                            }]);
                            localStorage.removeItem(SAVE_KEY);
                        }}
                        className="h-8 px-4 text-[12px] font-bold text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 rounded-full shadow-sm transition-all flex items-center gap-1.5"
                    >
                        <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
                        Reset Chat History
                    </Button>
                </div>
            </div>

            <div className="flex-1 flex flex-col p-2 sm:p-4 bg-transparent overflow-hidden">
                <div className="flex-1 overflow-y-auto pr-2 sm:pr-4 space-y-6 mb-4 scroll-smooth scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent" ref={scrollRef}>
                    {messages.map((msg, index) => {
                        const currentDate = formatMessageDate(msg.id);
                        const previousDate = index > 0 ? formatMessageDate(messages[index - 1].id) : null;
                        const showDateSeparator = currentDate !== previousDate;

                        return (
                            <React.Fragment key={msg.id}>
                                {showDateSeparator && (
                                    <div className="flex justify-center my-6">
                                        <span className="text-[11px] font-bold text-gray-400 tracking-widest uppercase bg-gray-50/50 px-5 py-2 rounded-full border border-gray-100/50">
                                            {currentDate}
                                        </span>
                                    </div>
                                )}
                                <motion.div
                                    initial={msg.role === 'user' ? { opacity: 0, scale: 0.95, y: 20 } : { opacity: 0, scale: 0.95, x: -20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                                    transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-4 w-full group font-['Inter',system-ui,sans-serif]`}
                                >
                                    {msg.role === 'assistant' && (
                                        <div className="flex flex-col items-center gap-1.5 shrink-0 mt-1">
                                            <div className="w-8 h-8 rounded-full bg-white overflow-hidden flex items-center justify-center shadow-sm border border-gray-100">
                                                {activeSubject.botProfileImage ? (
                                                    <img src={activeSubject.botProfileImage} alt="Bot" className="w-full h-full object-cover" />
                                                ) : (
                                                    <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${activeSubject.id}`} alt="Bot" className="w-6 h-6 mix-blend-multiply" />
                                                )}
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => speakText(msg.content, msg.id)}
                                                className="h-6 w-6 hover:bg-gray-100 rounded-full transition-all text-gray-400 hover:text-blue-600"
                                                title="Read message out loud"
                                                type="button"
                                            >
                                                {speakingMessageId === msg.id ? (
                                                    <VolumeX className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                                                ) : (
                                                    <Volume2 className="w-3.5 h-3.5" />
                                                )}
                                            </Button>
                                        </div>
                                    )}
                                    <div className={`max-w-[85%] sm:max-w-[75%] flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                        <div
                                            className={`px-5 py-3.5 rounded-3xl shadow-none leading-relaxed relative ${msg.role === 'user'
                                                ? 'bg-[#f4f4f4] text-gray-900 font-medium'
                                                : 'bg-transparent text-gray-900'
                                                }`}
                                        >
                                            {msg.role === 'user' ? (
                                                <div className="text-[15px] break-words">{msg.content}</div>
                                            ) : (
                                                <div className="relative">
                                                    <TypewriterMarkdown
                                                        content={msg.content}
                                                        isNew={msg.isNew}
                                                        onUpdate={() => {
                                                            scrollToBottom();
                                                        }}
                                                        onCitationClick={(pageText) => handleCitationClick(pageText, msg)}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        {msg.snippets && msg.snippets.length > 0 && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 12 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.45, delay: 0.15, ease: [0.4, 0, 0.2, 1] }}
                                                style={{ fontSize: '11px', fontFamily: 'Inter, system-ui, sans-serif' }}
                                                className="mt-5 max-w-full ml-1"
                                            >
                                                {/* Section label */}
                                                <div className="flex items-center gap-1.5 mb-2">
                                                    <FileText style={{ width: '10px', height: '10px', color: '#14B8A6', flexShrink: 0 }} />
                                                    <span style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#9CA3AF' }}>Sources cited:</span>
                                                </div>
                                                {/* Source entries */}
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                    {msg.snippets.map((snip, i) => {
                                                        const pageMatch = snip.match(/(?:page|p\.)\s*(\d+)/i);
                                                        const pageNum = pageMatch ? pageMatch[1] : null;
                                                        const filename = snip.replace(/[-–(]?\s*(?:page|p\.)\s*\d+\s*\)?/gi, '').trim().replace(/[,;-]+$/, '').trim();
                                                        return (
                                                            <motion.div
                                                                key={i}
                                                                initial={{ opacity: 0, x: -10 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                transition={{ duration: 0.35, delay: 0.2 + i * 0.07, ease: 'easeOut' }}
                                                            >
                                                                <span 
                                                                    onClick={() => handleCitationClick(`page ${pageNum}`, msg)}
                                                                    style={{
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        gap: '4px',
                                                                        backgroundColor: '#F0FDFA',
                                                                        border: '1px solid #99F6E4',
                                                                        borderRadius: '6px',
                                                                        padding: '2px 8px',
                                                                        fontSize: '11px',
                                                                        fontWeight: 500,
                                                                        color: '#0F766E',
                                                                        lineHeight: '1.5',
                                                                        cursor: 'pointer',
                                                                        transition: 'all 0.2s',
                                                                    }}
                                                                    className="hover:bg-teal-100 hover:border-teal-400"
                                                                >
                                                                    <FileText style={{ width: '9px', height: '9px', flexShrink: 0, color: '#14B8A6' }} />
                                                                    <span>Source PDF:</span>
                                                                    <span style={{ color: '#0F766E', fontWeight: 600 }}>{filename || snip}</span>
                                                                    {pageNum && (
                                                                        <>
                                                                            <span style={{ color: '#D1D5DB', margin: '0 1px' }}>—</span>
                                                                            <span style={{ color: '#14B8A6', fontWeight: 700 }}>Page {pageNum}</span>
                                                                        </>
                                                                    )}
                                                                </span>
                                                            </motion.div>
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
                            </React.Fragment>
                        );
                    })}
                    {isLoading && (
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex justify-start gap-4 w-full mb-2 mt-2">
                            <div className="w-8 h-8 rounded-full bg-white overflow-hidden flex items-center justify-center shrink-0 border border-gray-200 shadow-sm mt-1">
                                {activeSubject.botProfileImage ? (
                                    <img src={activeSubject.botProfileImage} alt="Bot" className="w-full h-full object-cover animate-pulse" />
                                ) : (
                                    <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${activeSubject.id}`} alt="Bot" className="w-6 h-6 mix-blend-multiply animate-pulse" />
                                )}
                            </div>
                            <div className="bg-transparent px-2 py-3 flex flex-col gap-1.5 text-gray-600 font-medium text-sm mt-1">
                                <div className="flex items-center gap-2">
                                    <div className="flex gap-1.5 p-1">
                                        <motion.div className="w-2 h-2 bg-gray-400 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} />
                                        <motion.div className="w-2 h-2 bg-gray-500 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} />
                                        <motion.div className="w-2 h-2 bg-gray-600 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                    <div ref={messagesEndRef} className="h-8 w-full shrink-0" />
                </div>
 
                <PremiumInput
                    onSend={handleSend}
                    isLoading={isLoading}
                    inputRef={inputRef}
                />
            </div>

            <PDFPreviewModal
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                citation={previewCitation}
                courseName={activeSubject?.name}
            />
        </motion.div>
    );
}
