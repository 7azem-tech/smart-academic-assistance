import { useMemo } from "react";
import { motion } from "motion/react";
import { 
  User, ChevronRight, GraduationCap, AlertTriangle, 
  RotateCcw, Cpu, Sparkles, ShieldCheck
} from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { StudentSelectorProps } from "./types";

export function StudentSelector({
  students,
  studentIndex,
  onStudentChange,
  onGeneratePlan,
  onReset,
  phase,
  registeredCount,
  passedCount,
  failedCount,
  progressPct,
  student,
}: StudentSelectorProps) {

  // Determine professional academic standing
  const academicStanding = useMemo(() => {
    if (failedCount >= 2) return { label: "Academic Review", color: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20" };
    if (failedCount === 1) return { label: "Academic Advisory", color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20" };
    return { label: "Good Standing", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" };
  }, [failedCount]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200/50 dark:border-gray-800/80 bg-white/60 dark:bg-gray-950/65 backdrop-blur-lg shadow-md p-4 w-full">
      {/* Visual Tech Highlight Line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-blue-500/50 via-indigo-500/50 to-purple-500/50" />
      
      <div className="flex flex-col lg:flex-row items-center justify-between gap-5 relative z-10">
        
        {/* 1. Student Selector & Details */}
        <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full lg:w-fit">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 text-[#2563EB] dark:text-indigo-400 border border-blue-100/50 dark:border-blue-900/20 shrink-0">
            <User className="w-5 h-5" />
          </div>
          
          <div className="space-y-1.5 w-full sm:w-56">
            <div className="relative group">
              <select
                value={studentIndex}
                onChange={e => onStudentChange(Number(e.target.value))}
                className="w-full appearance-none bg-gray-55/60 dark:bg-gray-900/60 hover:bg-gray-100/60 dark:hover:bg-gray-850/80 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 pr-9 text-xs font-extrabold text-card-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer shadow-inner"
              >
                {students.map((s, i) => (
                  <option key={s.id} value={i} className="bg-card text-card-foreground font-semibold">{s.name}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 dark:text-gray-550 group-hover:text-gray-600 transition-colors">
                <ChevronRight className="w-4 h-4 rotate-90" />
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 flex-wrap pl-0.5">
              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-extrabold font-mono uppercase tracking-wider">ID: {student.id}</span>
              <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
              <Badge variant="outline" className="text-[8px] font-extrabold border-gray-200/80 dark:border-gray-800 text-gray-655 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-900/40 px-1.5 py-0">
                Level {student.level}
              </Badge>
            </div>
          </div>
        </div>

        {/* 2. Interactive Academic Standing & Progress */}
        <div className="flex flex-col sm:flex-row items-center gap-5 w-full lg:w-fit flex-1 justify-center lg:justify-start lg:pl-5 lg:border-l border-gray-200/50 dark:border-gray-800/80">
          {/* Standing status */}
          <div className="flex flex-row sm:flex-col items-center sm:items-start gap-1 shrink-0 w-full sm:w-auto">
            <span className="text-[9px] text-gray-400 dark:text-gray-500 font-extrabold uppercase tracking-wider">Standing</span>
            <span className={`text-[10px] px-2.5 py-1 rounded-lg font-bold border flex items-center gap-1.5 shadow-sm ${academicStanding.color}`}>
              <span className="relative flex h-1.5 w-1.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  failedCount >= 2 ? "bg-rose-400" : failedCount === 1 ? "bg-amber-400" : "bg-emerald-400"
                }`} />
                <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                  failedCount >= 2 ? "bg-rose-500" : failedCount === 1 ? "bg-amber-500" : "bg-emerald-500"
                }`} />
              </span>
              {academicStanding.label}
            </span>
          </div>

          {/* Custom Animated Progress Bar */}
          <div className="space-y-1.5 w-full flex-1 max-w-xs">
            <div className="flex justify-between text-[10px] font-extrabold">
              <span className="text-gray-400 dark:text-gray-500 uppercase tracking-wider">Path Completion</span>
              <span className="text-blue-600 dark:text-blue-400 font-mono">{progressPct}%</span>
            </div>
            <div className="h-2 w-full bg-gray-100 dark:bg-gray-900 rounded-full overflow-hidden border border-gray-200/30 dark:border-gray-800/50">
              <motion.div 
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full" 
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>

        {/* 3. Micro Metrics Counter Row */}
        <div className="flex items-center gap-3 w-full lg:w-fit justify-center lg:pl-5 lg:border-l border-gray-200/50 dark:border-gray-800/80">
          
          {/* Completed counter */}
          <div className="relative overflow-hidden bg-gray-50/50 dark:bg-gray-900/40 rounded-xl p-2 border border-gray-200/80 dark:border-gray-800/80 text-center w-20 shadow-sm transition-all hover:border-emerald-500/30 group">
            <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-emerald-500/40" />
            <div className="flex items-center justify-center gap-1 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="text-xs font-black text-emerald-650 dark:text-emerald-400 font-mono leading-none">{passedCount}</span>
            </div>
            <div className="text-[7.5px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mt-1">Completed</div>
          </div>
          
          {/* Failed counter */}
          <div className="relative overflow-hidden bg-gray-50/50 dark:bg-gray-900/40 rounded-xl p-2 border border-gray-200/80 dark:border-gray-800/80 text-center w-20 shadow-sm transition-all hover:border-rose-500/30 group">
            <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-rose-500/40" />
            <div className="flex items-center justify-center gap-1 mt-0.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-550 shrink-0" />
              <span className="text-xs font-black text-rose-650 dark:text-rose-455 font-mono leading-none">{failedCount}</span>
            </div>
            <div className="text-[7.5px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mt-1">Failed</div>
          </div>

          {/* Registered counter */}
          <div className="relative overflow-hidden bg-gray-50/50 dark:bg-gray-900/40 rounded-xl p-2 border border-gray-200/80 dark:border-gray-800/80 text-center w-20 shadow-sm transition-all hover:border-sky-500/30 group">
            <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-sky-500/40" />
            <div className="flex items-center justify-center gap-1 mt-0.5">
              <GraduationCap className="w-3.5 h-3.5 text-sky-500 shrink-0" />
              <span className="text-xs font-black text-sky-655 dark:text-sky-400 font-mono leading-none">{registeredCount}</span>
            </div>
            <div className="text-[7.5px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mt-1">Registered</div>
          </div>
        </div>

        {/* 4. Console Trigger Actions */}
        <div className="flex items-center gap-2 w-full lg:w-fit justify-end lg:pl-5 lg:border-l border-gray-200/50 dark:border-gray-800/80 shrink-0">
          {phase !== "confirmed" && (
            <Button
              className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold shadow-md shadow-blue-500/15 h-9 px-4 rounded-xl text-xs transition-all duration-300 hover:scale-[1.01] hover:shadow-lg shrink-0 cursor-pointer disabled:opacity-50 disabled:scale-100 disabled:pointer-events-none"
              onClick={onGeneratePlan}
              disabled={phase === "generating" || phase === "plan" || registeredCount > 0}
            >
              {phase === "generating" ? (
                <span className="flex items-center justify-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 animate-spin text-white" />
                  Running RAG...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 fill-current text-white/90" />
                  Optimize Paths
                </span>
              )}
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={onReset} 
            title="Reset Planner" 
            className="h-9 w-9 p-0 shrink-0 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800/60 border-gray-200 dark:border-gray-850 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
        </div>

      </div>
    </div>
  );
}
