import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Check, AlertTriangle, AlertCircle, CalendarX, 
  Cpu, Lock, Unlock, List, RotateCcw, Info, Sparkles,
  TrendingUp, BookOpen, ArrowRight, Activity, Zap, Award
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { RegistrationPlannerProps } from "./types";
import { MAX_CREDITS, getUnlockedByPassing, getLockedCourses } from "../../services/registrationEngine";

// Simulated AI Telemetry Compiler for generating phase
function TelemetryCompiler() {
  const [logs, setLogs] = useState<string[]>([]);
  
  useEffect(() => {
    const rawLogs = [
      "⚡ [SYSTEM] Initializing cognitive curriculum pathway model...",
      "🔍 [RESOLVER] Mapping student academic history graph...",
      "📚 [RESOLVER] Loading curriculum catalog nodes (48 modules)...",
      "💡 [ADVISER] Evaluating failed courses & outstanding prerequisites...",
      "⚠️ [DIAGNOSTIC] Found outstanding retake track requirements.",
      "🧠 [ANALYZER] Computing path velocity & credit allocations...",
      "🛡️ [OPTIMIZER] Applying linear credit constraints (Max 19 CH)...",
      "🚀 [SUCCESS] Curriculum pathway optimized! Injecting recommendation matrix..."
    ];
    
    let currentIdx = 0;
    const interval = setInterval(() => {
      if (currentIdx < rawLogs.length) {
        setLogs(prev => [...prev, rawLogs[currentIdx]]);
        currentIdx++;
      } else {
        clearInterval(interval);
      }
    }, 120);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gray-950 text-gray-250 font-mono text-[11px] p-6 rounded-2xl border border-gray-850 shadow-2xl space-y-2 max-w-xl mx-auto w-full text-left overflow-hidden min-h-[220px]">
      <div className="flex items-center justify-between border-b border-gray-900 pb-2 mb-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 animate-pulse" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 animate-pulse" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 animate-pulse" />
        </div>
        <span className="text-[9px] uppercase tracking-wider text-gray-500 font-black">IntelliEnroll Compiler v2.0</span>
      </div>
      <div className="space-y-1.5 max-h-[160px] overflow-y-auto no-scrollbar">
        {logs.map((log, idx) => (
          <motion.div 
            key={idx} 
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            className="leading-relaxed"
          >
            {log}
          </motion.div>
        ))}
        {logs.length < 8 && (
          <span className="inline-block w-1.5 h-3 bg-blue-500 animate-pulse ml-0.5" />
        )}
      </div>
    </div>
  );
}

export function RegistrationPlanner({
  plan,
  checkedIds,
  onToggleCheck,
  onConfirm,
  onReset,
  phase,
  confirmedCourses,
  student,
  catalog
}: RegistrationPlannerProps) {
  
  // Calculate current checked credits
  const planCredits = useMemo(() =>
    plan?.recommended
      .filter(r => checkedIds.has(r.course.id))
      .reduce((s, r) => s + r.course.credits, 0) ?? 0,
    [plan, checkedIds]
  );

  // Group recommendations into lanes
  const criticalRetakes = useMemo(() => 
    plan?.recommended.filter(r => r.badge === "Critical retake") ?? [],
    [plan]
  );

  const prereqUnlocks = useMemo(() => 
    plan?.recommended.filter(r => r.badge === "Prerequisite unlock") ?? [],
    [plan]
  );

  const standardProgression = useMemo(() => 
    plan?.recommended.filter(r => r.badge !== "Critical retake" && r.badge !== "Prerequisite unlock") ?? [],
    [plan]
  );

  // Compute subsequent courses unlocked by a specific course
  const getSubsequentUnlocked = (courseId: string) => {
    return catalog.filter(c => 
      c.prerequisites.includes(courseId) && 
      !student.passed.includes(c.id) &&
      !student.registered.includes(c.id)
    );
  };

  // Compute locked courses for diagnostics
  const lockedCourses = useMemo(() => getLockedCourses(student, catalog), [student, catalog]);

  // Compute what will be unlocked after passing all confirmed courses
  const unlockedAfter = useMemo(() => {
    if (phase !== "confirmed") return [];
    return getUnlockedByPassing(
      confirmedCourses.map(c => c.course.id),
      student,
      catalog
    );
  }, [phase, confirmedCourses, student, catalog]);

  // Render course item nodes
  const renderCourseCard = (rec: any, idx: number, isCritical: boolean, isUnlock: boolean) => {
    const isSelected = checkedIds.has(rec.course.id);
    const unlocked = getSubsequentUnlocked(rec.course.id);
    
    return (
      <motion.div 
        key={rec.course.id} 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: idx * 0.04, duration: 0.3 }}
        whileHover={{ x: 2 }}
        className="relative group"
      >
        {/* Connection pipeline node */}
        <div className={`absolute -left-[24px] top-7 w-3 h-3 rounded-full border-2 transition-all duration-300 ${
          isSelected 
            ? isCritical 
              ? "bg-rose-500 border-rose-500 ring-4 ring-rose-500/25" 
              : isUnlock 
                ? "bg-purple-500 border-purple-500 ring-4 ring-purple-500/25" 
                : "bg-blue-500 border-blue-500 ring-4 ring-blue-500/25"
            : "bg-white dark:bg-gray-950 border-gray-300 dark:border-gray-800"
        }`} />

        <div
          onClick={() => onToggleCheck(rec.course.id)}
          className={`flex flex-col p-4 rounded-2xl border transition-all duration-300 cursor-pointer ${
            isSelected 
              ? isCritical 
                ? "bg-rose-500/5 dark:bg-rose-950/10 border-rose-300 dark:border-rose-900/60 shadow-md shadow-rose-500/5" 
                : isUnlock 
                  ? "bg-purple-500/5 dark:bg-purple-950/10 border-purple-300 dark:border-purple-900/60 shadow-md shadow-purple-500/5"
                  : "bg-blue-500/5 dark:bg-blue-950/10 border-blue-300 dark:border-blue-900/60 shadow-md shadow-blue-500/5"
              : "bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-850 hover:border-gray-300 dark:hover:border-gray-800 hover:shadow-sm"
          }`}
        >
          {/* Header elements */}
          <div className="flex flex-wrap items-center gap-2 mb-2 justify-between">
            <div className="flex items-center gap-2">
              <span className={`font-mono text-[9px] font-extrabold tracking-wide px-2 py-0.5 rounded-md border ${
                isCritical 
                  ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/30" 
                  : isUnlock 
                    ? "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-900/30"
                    : "bg-blue-50 dark:bg-blue-950/40 text-[#2563EB] dark:text-blue-400 border-blue-100 dark:border-blue-900/30"
              }`}>
                {rec.course.id}
              </span>
              <span className="text-gray-900 dark:text-white font-extrabold text-sm tracking-tight truncate max-w-[200px]">
                {rec.course.name}
              </span>
            </div>
            
            {/* Custom Interactive Toggle Switch */}
            <div className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-300 ${
              isSelected 
                ? isCritical 
                  ? "bg-rose-600 shadow-md shadow-rose-600/20" 
                  : isUnlock 
                    ? "bg-purple-600 shadow-md shadow-purple-600/20"
                    : "bg-blue-600 shadow-md shadow-blue-600/25" 
                : "bg-gray-200 dark:bg-gray-800"
            }`}>
              <div 
                className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
                  isSelected ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </div>
          </div>

          {/* Metrics labels */}
          <div className="flex items-center gap-1.5 mb-2.5">
            <Badge variant="outline" className={`text-[8px] font-extrabold uppercase border ${
              isCritical 
                ? "bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 border-rose-200/50 dark:border-rose-900/30" 
                : isUnlock 
                  ? "bg-purple-50 dark:bg-purple-950/30 text-purple-800 dark:text-purple-300 border-purple-200/50 dark:border-purple-900/30"
                  : "bg-blue-50 dark:bg-blue-950/30 text-[#2563EB] dark:text-blue-300 border-blue-200/50 dark:border-blue-900/30"
            }`}>
              {rec.badge}
            </Badge>
            <Badge variant="outline" className="text-[8px] font-extrabold border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-900/50">
              {rec.course.credits} CH
            </Badge>
          </div>

          {/* AI Advisor reason */}
          <div className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400 bg-gray-55/60 dark:bg-gray-900/40 rounded-xl px-3 py-2 border border-gray-200/50 dark:border-gray-850/80 shadow-inner">
            <div className={`p-0.5 rounded shrink-0 mt-0.5 ${
              isCritical ? "bg-rose-50 dark:bg-rose-950 text-rose-600" : isUnlock ? "bg-purple-50 dark:bg-purple-950 text-purple-600" : "bg-blue-50 dark:bg-blue-950 text-[#2563EB]"
            }`}>
              <Cpu className="w-3.5 h-3.5 animate-pulse" />
            </div>
            <span className="leading-relaxed font-semibold">{rec.reason}</span>
          </div>

          {/* Pipeline unlocks chips */}
          {unlocked.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2.5 border-t border-gray-150 dark:border-gray-800/80 mt-2.5">
              <span className="text-[9px] font-black text-gray-450 dark:text-gray-500 uppercase tracking-wider flex items-center gap-1 shrink-0">
                <Unlock className="w-3 h-3 text-purple-500" />
                Unlocks Paths:
              </span>
              <div className="flex flex-wrap gap-1">
                {unlocked.map(u => (
                  <Badge 
                    key={u.id} 
                    variant="outline" 
                    className="text-[8px] font-bold font-mono px-1.5 py-0 border-purple-100/50 dark:border-purple-900/40 text-purple-700 dark:text-purple-300 bg-purple-50/10 dark:bg-purple-950/20"
                  >
                    {u.id}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        
        {/* 1. Generating Loader */}
        {phase === "generating" && (
          <motion.div
            key="generating"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="min-h-[400px] flex flex-col items-center justify-center gap-6 bg-card text-card-foreground rounded-3xl border border-border shadow-xl p-8 text-center"
          >
            <div className="relative w-16 h-16">
              <motion.div 
                className="absolute inset-0 rounded-full border-4 border-indigo-100 dark:border-indigo-950"
                animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.7, 0.3] }} 
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }} 
              />
              <motion.div 
                className="absolute inset-0 rounded-full border-4 border-t-[#2563EB] border-r-transparent border-b-transparent border-l-transparent"
                animate={{ rotate: 360 }} 
                transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }} 
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Cpu className="w-6 h-6 text-[#2563EB]" />
              </div>
            </div>
            <div className="space-y-4 w-full">
              <div className="space-y-1">
                <h3 className="font-extrabold text-lg text-gray-900 dark:text-white">Curriculum Path Optimization</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Please wait while the cognitive compiler balances the academic load matrix...</p>
              </div>
              <TelemetryCompiler />
            </div>
          </motion.div>
        )}

        {/* 2. Idle State */}
        {phase === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-[380px] flex flex-col items-center justify-center gap-5 bg-card text-card-foreground rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800 p-8 text-center"
          >
            <div className="relative w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 bg-blue-500/10 dark:bg-blue-500/5 rounded-2xl blur-md" />
              <div className="relative w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-[#2563EB] shadow-inner border border-blue-100/50 dark:border-blue-900/30">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
            </div>
            
            <div className="space-y-2 max-w-sm">
              <h3 className="font-black text-lg text-gray-900 dark:text-white">Optimization Engine Staged</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-semibold">
                Click **Optimize Paths** on the console banner to calculate dynamic prerequisite maps, balance academic constraints, and resolve outstanding retakes.
              </p>
            </div>
          </motion.div>
        )}

        {/* 3. Planner View (Plan Ready) */}
        {phase === "plan" && plan && (
          <motion.div
            key="plan"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Top Warnings list - global warning block */}
            {plan.warnings.length > 0 && (
              <div className="space-y-2">
                {plan.warnings.map((warning, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-3 p-3 bg-amber-500/10 dark:bg-amber-950/15 border-l-4 border-amber-500 rounded-r-xl border border-y-amber-500/10 border-r-amber-500/10 shadow-sm"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs font-semibold text-amber-850 dark:text-amber-300 leading-relaxed">{warning}</p>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Widescreen Cockpit Columns: Left Runway (7/12) + Right Sidebar (5/12) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Optimization Runway (width: 7/12) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center gap-2 pb-1 border-b border-gray-200 dark:border-gray-800">
                  <List className="w-4 h-4 text-indigo-500" />
                  <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    Optimization Pipeline Runway
                  </h3>
                </div>
                
                <div className="relative pl-6 border-l border-dashed border-gray-200 dark:border-gray-800 space-y-6">
                  
                  {/* Lane 1: Critical Priority Retakes */}
                  {criticalRetakes.length > 0 && (
                    <div className="space-y-3 relative">
                      <div className="flex items-center gap-2 px-1 py-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                        <h4 className="text-[10px] font-black text-rose-600 dark:text-rose-455 uppercase tracking-widest">
                          Critical Retake Runway ({criticalRetakes.length})
                        </h4>
                        <div className="flex-1 h-[1px] bg-rose-200/50 dark:bg-rose-950/40" />
                      </div>
                      <div className="space-y-4">
                        {criticalRetakes.map((rec, i) => renderCourseCard(rec, i, true, false))}
                      </div>
                    </div>
                  )}

                  {/* Lane 2: Core Prerequisite Unlocks */}
                  {prereqUnlocks.length > 0 && (
                    <div className="space-y-3 relative">
                      <div className="flex items-center gap-2 px-1 py-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                        <h4 className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest">
                          Core Prerequisite Runway ({prereqUnlocks.length})
                        </h4>
                        <div className="flex-1 h-[1px] bg-purple-200/50 dark:bg-purple-950/40" />
                      </div>
                      <div className="space-y-4">
                        {prereqUnlocks.map((rec, i) => renderCourseCard(rec, i, false, true))}
                      </div>
                    </div>
                  )}

                  {/* Lane 3: Standard Progression */}
                  {standardProgression.length > 0 && (
                    <div className="space-y-3 relative">
                      <div className="flex items-center gap-2 px-1 py-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        <h4 className="text-[10px] font-black text-[#2563EB] dark:text-blue-400 uppercase tracking-widest">
                          Standard Progression Runway ({standardProgression.length})
                        </h4>
                        <div className="flex-1 h-[1px] bg-blue-200/50 dark:bg-blue-950/40" />
                      </div>
                      <div className="space-y-4">
                        {standardProgression.map((rec, i) => renderCourseCard(rec, i, false, false))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Path Diagnostics & Confirm Checkout (width: 5/12) */}
              <div className="lg:col-span-5 space-y-6">
                
                <div className="flex items-center gap-2 pb-1 border-b border-gray-200 dark:border-gray-800">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    Console Telemetry & Checkout
                  </h3>
                </div>

                {/* Unified Diagnostics Panel */}
                <div className="space-y-5">
                  
                  {/* Dynamic Credit allocation dial */}
                  <div className="relative overflow-hidden rounded-2xl border border-gray-200/50 dark:border-gray-850/80 bg-white/60 dark:bg-gray-950/65 backdrop-blur-md p-5 shadow-sm">
                    <div className="flex flex-col items-center justify-center">
                      <div className="relative w-28 h-28 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle
                            cx="56"
                            cy="56"
                            r="46"
                            className="stroke-gray-100 dark:stroke-gray-900 fill-none"
                            strokeWidth="7"
                          />
                          <motion.circle
                            cx="56"
                            cy="56"
                            r="46"
                            className={`fill-none transition-colors duration-500 ${
                              planCredits > 18 
                                ? "stroke-red-500" 
                                : planCredits >= 12 
                                  ? "stroke-emerald-500" 
                                  : "stroke-amber-500"
                            }`}
                            strokeWidth="7"
                            strokeDasharray={2 * Math.PI * 46}
                            initial={{ strokeDashoffset: 2 * Math.PI * 46 }}
                            animate={{ strokeDashoffset: 2 * Math.PI * 46 * (1 - Math.min(planCredits, MAX_CREDITS) / MAX_CREDITS) }}
                            transition={{ duration: 0.85, ease: "easeOut" }}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute text-center">
                          <span className="text-2xl font-black text-gray-900 dark:text-white font-mono leading-none">{planCredits}</span>
                          <p className="text-[8px] uppercase font-black text-gray-450 dark:text-gray-500 tracking-widest mt-0.5">CH Selected</p>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex flex-col items-center gap-1.5 w-full">
                        <span className={`text-[10px] font-extrabold px-3 py-0.5 rounded-full border ${
                          planCredits > 18 
                            ? "bg-red-500/10 text-red-750 dark:text-red-400 border-red-500/20" 
                            : planCredits >= 12 
                              ? "bg-emerald-500/10 text-emerald-750 dark:text-emerald-400 border-emerald-500/20" 
                              : "bg-amber-500/10 text-amber-750 dark:text-amber-400 border-amber-500/20"
                        }`}>
                          {planCredits > 18 ? "⚠️ OVERLOAD DETECTED" : planCredits >= 12 ? "✓ OPTIMAL LOAD TARGET" : "ℹ UNDERLOAD VELOCITY"}
                        </span>
                        
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 text-center font-medium leading-relaxed max-w-xs mt-1">
                          {planCredits > 18 
                            ? "Selected hours exceed standard credit limit. You must de-select classes to confirm enrollment."
                            : planCredits >= 12 
                              ? "Your selected hours fit standard progression metrics perfectly for optimal graduation speed."
                              : "Under minimum full-time status. Consider adding additional progression subjects."}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Telemetry diagnostics data */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-gray-50/50 dark:bg-gray-900/40 border border-gray-200/80 dark:border-gray-800/80 rounded-xl shadow-inner">
                      <div className="text-[8px] font-black text-gray-450 dark:text-gray-500 uppercase tracking-widest">Cap Capacity</div>
                      <div className="text-sm font-black text-gray-850 dark:text-gray-100 font-mono mt-0.5">
                        {Math.max(0, MAX_CREDITS - planCredits)} <span className="text-[9px] font-bold text-gray-400 dark:text-gray-550">CH left</span>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-gray-50/50 dark:bg-gray-900/40 border border-gray-200/80 dark:border-gray-800/80 rounded-xl shadow-inner">
                      <div className="text-[8px] font-black text-gray-450 dark:text-gray-500 uppercase tracking-widest">Timeline Velocity</div>
                      <div className="text-sm font-black text-gray-850 dark:text-gray-100 font-mono mt-0.5 flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                        <span>+24%</span>
                      </div>
                    </div>
                  </div>

                  {/* Future unlocks projection */}
                  <div className="p-4 bg-gray-55/40 dark:bg-gray-900/30 border border-gray-200/80 dark:border-gray-800/80 rounded-2xl space-y-3">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-black text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-purple-500" />
                        Pathway Unlock Projection
                      </h4>
                      <p className="text-[9px] text-gray-500 dark:text-gray-400 font-semibold">
                        Selecting prerequisites unlocks registration paths for these next-term modules:
                      </p>
                    </div>

                    <div className="space-y-2 max-h-[160px] overflow-y-auto no-scrollbar">
                      {(() => {
                        const selectedIds = plan?.recommended
                          .filter(r => checkedIds.has(r.course.id))
                          .map(r => r.course.id) ?? [];
                        
                        const unlocked = catalog.filter(c => {
                          const hasPassedAll = c.prerequisites.every(pId => 
                            student.passed.includes(pId) || selectedIds.includes(pId)
                          );
                          return hasPassedAll && 
                                 c.prerequisites.length > 0 && 
                                 !student.passed.includes(c.id) &&
                                 !selectedIds.includes(c.id);
                        });

                        if (unlocked.length === 0) {
                          return (
                            <div className="text-center py-4 text-[9px] text-gray-400 dark:text-gray-500 italic font-semibold">
                              Select core pathways to simulate next semester pipeline impacts.
                            </div>
                          );
                        }

                        return unlocked.map(c => (
                          <div key={c.id} className="p-2 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-850 rounded-xl flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[9px] font-black text-purple-650 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-1.5 py-0.2 rounded border border-purple-100 dark:border-purple-900/30">
                                {c.id}
                              </span>
                              <span className="text-[10px] font-extrabold text-gray-700 dark:text-gray-300 truncate max-w-[140px]">{c.name}</span>
                            </div>
                            <span className="text-[8px] font-black font-mono text-gray-450 dark:text-gray-500">{c.credits} CH</span>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>

                  {/* Outstanding failed blockages */}
                  {student.failed.length > 0 && (
                    <div className="p-3.5 bg-rose-500/5 dark:bg-rose-950/10 border border-rose-200/50 dark:border-rose-900/30 rounded-2xl space-y-2">
                      <div className="text-[9px] font-black text-rose-700 dark:text-rose-455 uppercase tracking-widest flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-550" />
                        Outstanding Path Failures ({student.failed.length})
                      </div>
                      <div className="space-y-1.5">
                        {student.failed.map(fId => {
                          const c = catalog.find(x => x.id === fId);
                          const isCurrentlySelected = checkedIds.has(fId);
                          if (!c) return null;
                          return (
                            <div key={fId} className="flex justify-between items-center text-[10px] text-rose-800 dark:text-rose-350 font-bold bg-white dark:bg-gray-950 border border-rose-100 dark:border-rose-900/40 p-2 rounded-xl">
                              <span className="truncate max-w-[150px]">{c.name}</span>
                              <div className="flex items-center gap-1.5">
                                {isCurrentlySelected ? (
                                  <Badge className="bg-emerald-500/10 border-emerald-500/20 text-emerald-600 text-[8px] font-black py-0">STAGED RETAKE</Badge>
                                ) : (
                                  <Badge className="bg-rose-500/10 border-rose-500/20 text-rose-600 text-[8px] font-black py-0">RETENTION RISK</Badge>
                                )}
                                <span className="font-mono bg-rose-50 dark:bg-rose-950 px-1 py-0.2 rounded border border-rose-100 dark:border-rose-900 text-[8.5px]">{fId}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Confirmed checkout basket */}
                  <div className="relative overflow-hidden rounded-2xl border border-gray-250 dark:border-gray-800 bg-white/60 dark:bg-gray-950/60 p-4 space-y-4">
                    <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-blue-600 to-indigo-650" />
                    
                    <div className="space-y-1">
                      <span className="text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block">Checkout Console</span>
                      <div className="text-xs text-gray-800 dark:text-gray-200 font-bold">
                        Staged {checkedIds.size} course{checkedIds.size !== 1 ? "s" : ""} · Total {planCredits} Credits
                      </div>
                    </div>

                    {/* Staged items mini pills list */}
                    {checkedIds.size > 0 ? (
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto no-scrollbar">
                        {Array.from(checkedIds).map(id => (
                          <span key={id} className="font-mono text-[9px] font-black px-2 py-0.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300">
                            {id}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 italic">No courses selected for registration.</p>
                    )}

                    <Button
                      onClick={onConfirm}
                      disabled={checkedIds.size === 0 || planCredits > MAX_CREDITS}
                      className="w-full bg-gradient-to-r from-emerald-600 to-teal-650 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold px-6 h-10 rounded-xl transition-all duration-300 shadow-md shadow-emerald-500/10 shrink-0 cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                    >
                      <Check className="w-4 h-4 mr-2 stroke-[3px]" />
                      Initialize Academic Enrollment
                    </Button>
                  </div>

                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* 4. Confirmed State */}
        {phase === "confirmed" && (
          <motion.div
            key="confirmed"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            {/* Celebration Success Banner */}
            <div className="relative p-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-teal-700 text-white text-center shadow-lg border border-emerald-500/20 overflow-hidden">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTIwIDB2NDBIMjB6TTAgMjBoNDBWMjB6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
                className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-2.5 shadow-inner"
              >
                <Unlock className="w-5.5 h-5.5 text-white" />
              </motion.div>
              <h3 className="text-base font-black tracking-tight uppercase">Academic Enrollment Matrix Committed</h3>
              <p className="text-emerald-100 text-xs mt-1 font-semibold">
                Enrolled successfully in {confirmedCourses.length} course{confirmedCourses.length !== 1 ? "s" : ""} totaling{" "}
                {confirmedCourses.reduce((s, c) => s + c.course.credits, 0)} credit hours.
              </p>
            </div>

            {/* Confirmed List (Timeline style) */}
            <Card className="border border-gray-200/60 dark:border-gray-800/80 bg-card text-card-foreground rounded-2xl overflow-hidden shadow-md">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-black flex items-center gap-2 text-gray-900 dark:text-white">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  Active Course Load (Current Semester)
                </CardTitle>
                <CardDescription className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Registration files compiled for the following courses:
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-6">
                <div className="relative pl-6 border-l border-dashed border-gray-200 dark:border-gray-800 space-y-5">
                  {confirmedCourses.map((rec, i) => (
                    <motion.div
                      key={rec.course.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="relative"
                    >
                      {/* Timeline node dot */}
                      <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-emerald-50 dark:bg-emerald-950 border-2 border-emerald-500 flex items-center justify-center shadow-sm">
                        <Check className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-450 stroke-[3px]" />
                      </div>
                      
                      <div className="p-3.5 bg-gray-50/50 dark:bg-gray-900/40 border border-gray-200/85 dark:border-gray-800/80 rounded-2xl space-y-1.5 transition-all hover:border-emerald-500/10">
                        <div className="flex justify-between items-center gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[9px] font-black text-[#2563EB] bg-blue-50 dark:bg-blue-950 px-1.5 py-0.2 rounded border border-blue-100 dark:border-blue-900/30">
                              {rec.course.id}
                            </span>
                            <span className="font-black text-xs text-gray-900 dark:text-white">{rec.course.name}</span>
                          </div>
                          <Badge variant="outline" className="text-[8.5px] font-extrabold font-mono border-gray-250 dark:border-gray-800 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-950">
                            {rec.course.credits} CH
                          </Badge>
                        </div>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 pl-0.5 leading-relaxed font-semibold">
                          {rec.reason.split(".")[0]}.
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Subsequent Unlocked Paths */}
            {unlockedAfter.length > 0 && (
              <Card className="border border-purple-200/60 dark:border-purple-900/50 bg-purple-50/10 dark:bg-purple-950/5 rounded-2xl shadow-sm">
                <CardHeader className="pb-2.5">
                  <CardTitle className="text-sm font-black text-purple-800 dark:text-purple-300 flex items-center gap-2">
                    <Unlock className="w-4 h-4 text-purple-600 dark:text-purple-400 animate-pulse" />
                    Unlocked Academic Pipeline
                  </CardTitle>
                  <CardDescription className="text-purple-750/80 dark:text-purple-400/80 text-[10px] font-semibold leading-relaxed">
                    Completing your staged courses unlocks registration eligibility for these advanced subjects:
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-4 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {unlockedAfter.map(c => (
                      <div key={c.id} className="flex items-center gap-2.5 p-2 bg-white dark:bg-gray-950 border border-purple-100/60 dark:border-purple-900/20 rounded-xl">
                        <span className="font-mono text-[9px] font-black text-purple-650 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-1.5 py-0.2 rounded border border-purple-100 dark:border-purple-900/30">
                          {c.id}
                        </span>
                        <span className="text-[10px] font-black text-gray-700 dark:text-gray-300 truncate">{c.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end">
              <Button 
                variant="outline" 
                onClick={onReset} 
                className="w-fit px-6 h-10 font-extrabold rounded-xl transition-all duration-300 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset Optimization Run
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
