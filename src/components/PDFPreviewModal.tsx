import { motion, AnimatePresence } from "motion/react";
import { X, FileText, Download, Copy, Check, ExternalLink, Calendar, BookOpen, BookMarked } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { Button } from "./ui/button";

interface Citation {
  filename: string;
  page: number;
  url: string | null;
  text: string;
}

interface PDFPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  citation: Citation | null;
  courseName?: string;
}

export function PDFPreviewModal({ isOpen, onClose, citation, courseName }: PDFPreviewModalProps) {
  const [copied, setCopied] = useState(false);

  if (!citation) return null;

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(citation.text);
      setCopied(true);
      toast.success("Text snippet copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy text");
    }
  };

  const getFullPdfUrl = (url: string | null) => {
    if (!url) return null;
    return `http://localhost:3005${url}`;
  };

  const iframeUrl = citation.url 
    ? `${getFullPdfUrl(citation.url)}#page=${citation.page}&toolbar=0&navpanes=0&view=FitH` 
    : null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-10 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 250 }}
            className="relative w-full max-w-7xl h-[85vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-sm border border-slate-200 dark:border-slate-700 shrink-0">
                  <BookMarked className="w-5 h-5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                </div>
                <div className="truncate">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                    Document Citation Preview
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                    <span>{courseName || "Smart Assistant"}</span>
                    <span>•</span>
                    <span className="font-semibold text-slate-750 dark:text-slate-350">{citation.filename}</span>
                    <span>•</span>
                    <span className="text-teal-600 dark:text-teal-400 font-bold">Page {citation.page}</span>
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 h-9 w-9 shrink-0 text-slate-500 hover:text-slate-850"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content Body - Split Pane (Strict 50/50 Row Split with Info on Left, PDF on Right) */}
            <div className="flex-1 grid grid-cols-2 overflow-hidden min-h-0 bg-slate-50 dark:bg-slate-950">
              {/* Left Pane - Extracted Source Passage & Metadata */}
              <div className="h-full flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800/80 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Extracted Passage Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-teal-500" />
                        Retrieved Source Passage
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyText}
                        className="h-8 px-2.5 text-xs text-teal-650 hover:text-teal-700 hover:bg-teal-50 dark:text-teal-400 dark:hover:bg-teal-950/30 rounded-lg flex items-center gap-1.5 font-medium"
                      >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? "Copied" : "Copy"}
                      </Button>
                    </div>
                    
                    <div className="relative p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-900/50 overflow-hidden group">
                      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-teal-500 to-emerald-500" />
                      <p className="text-[14px] leading-7 text-slate-800 dark:text-slate-300 font-medium whitespace-pre-line select-text">
                        {citation.text}
                      </p>
                    </div>
                  </div>

                  {/* Document Metadata Details Card */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Citation Information
                    </h4>
                    
                    <div className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-900/30 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">File Name</span>
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-350 truncate block" title={citation.filename}>
                            {citation.filename}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">Citation Page</span>
                          <span className="text-sm font-bold text-teal-600 dark:text-teal-400 block">
                            Page {citation.page}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800/50">
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">Subject / Module</span>
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-350 truncate block">
                            {courseName || "General Knowledge Base"}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">Passage Size</span>
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-350 block">
                            {citation.text.split(/\s+/).length} Words
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                {citation.url && (
                  <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex gap-3 shrink-0">
                    <a
                      href={getFullPdfUrl(citation.url) || undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button
                        variant="outline"
                        className="w-full border-slate-200 hover:bg-slate-50 text-slate-700 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 rounded-xl"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open in New Tab
                      </Button>
                    </a>
                    <a
                      href={getFullPdfUrl(citation.url) || undefined}
                      download={citation.filename}
                      className="flex-1"
                    >
                      <Button
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white shadow-md rounded-xl"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download File
                      </Button>
                    </a>
                  </div>
                )}
              </div>

              {/* Right Pane - Interactive PDF iframe */}
              <div className="h-full relative overflow-hidden bg-slate-100 dark:bg-slate-900">
                {iframeUrl ? (
                  <iframe
                    src={iframeUrl}
                    title="PDF Viewer"
                    className="w-full h-full border-none"
                    allow="autoplay"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 bg-slate-50 dark:bg-slate-900">
                    <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/20 text-amber-500 dark:text-amber-400 flex items-center justify-center mb-4">
                      <FileText className="w-8 h-8 animate-pulse" />
                    </div>
                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-250">
                      Original PDF Not Available
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm">
                      This is a legacy document chunk uploaded before PDF file storage was enabled. You can still view the retrieved passage in the left-hand panel.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
