import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Cpu, BookOpen, FileText, Network } from "lucide-react";

import {
  COURSE_CATALOG,
  STUDENT_PROFILES,
  CURRENT_TERM,
  enrichCatalog,
  generateRegistrationPlan,
  StudentProfile,
  RegistrationPlan,
  RecommendedCourse,
} from "../../services/registrationEngine";

import { StudentSelector } from "./StudentSelector";
import { CourseCatalog } from "./CourseCatalog";
import { AcademicHistory } from "./AcademicHistory";
import { RegistrationPlanner } from "./RegistrationPlanner";
import { PrerequisiteGraph } from "./PrerequisiteGraph";

const ENRICHED_CATALOG = enrichCatalog(COURSE_CATALOG);
const TOTAL_COURSES = ENRICHED_CATALOG.length;

type Phase = "idle" | "generating" | "plan" | "confirmed";

export function SmartRegistration() {
  // ── State ─────────────────────────────────────────────────────────────────
  const [studentIndex, setStudentIndex] = useState(0);
  const [students, setStudents] = useState<StudentProfile[]>(
    STUDENT_PROFILES.map(s => ({ ...s, registered: [] }))
  );
  const [activeTab, setActiveTab] = useState<"catalog" | "record" | "planner" | "graph">("catalog");
  const [phase, setPhase] = useState<Phase>("idle");
  const [plan, setPlan] = useState<RegistrationPlan | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [confirmedCourses, setConfirmedCourses] = useState<RecommendedCourse[]>([]);

  const student = students[studentIndex];

  // ── Computed values ───────────────────────────────────────────────────────
  const passedCount = student.passed.length;
  const failedCount = student.failed.length;
  const registeredCount = student.registered.length;
  const progressPct = Math.round((passedCount / TOTAL_COURSES) * 100);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleStudentChange = useCallback((idx: number) => {
    setStudentIndex(idx);
    setPhase("idle");
    setPlan(null);
    setCheckedIds(new Set());
    setConfirmedCourses([]);
  }, []);

  const handleGeneratePlan = useCallback(() => {
    setPhase("generating");
    setActiveTab("planner");
    setTimeout(() => {
      const newPlan = generateRegistrationPlan(student, ENRICHED_CATALOG, CURRENT_TERM);
      setPlan(newPlan);
      setCheckedIds(new Set(newPlan.recommended.filter(r => r.isChecked).map(r => r.course.id)));
      setPhase("plan");
    }, 1200);
  }, [student]);

  const handleToggleCheck = useCallback((courseId: string) => {
    setCheckedIds(prev => {
      const next = new Set(prev);
      if (next.has(courseId)) next.delete(courseId);
      else next.add(courseId);
      return next;
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (!plan) return;
    const selected = plan.recommended.filter(r => checkedIds.has(r.course.id));
    const selectedIds = selected.map(r => r.course.id);
    setStudents(prev =>
      prev.map((s, i) =>
        i === studentIndex ? { ...s, registered: selectedIds } : s
      )
    );
    setConfirmedCourses(selected);
    setPhase("confirmed");
  }, [plan, checkedIds, studentIndex]);

  const handleReset = useCallback(() => {
    setPhase("idle");
    setPlan(null);
    setCheckedIds(new Set());
    setConfirmedCourses([]);
    setStudents(prev =>
      prev.map((s, i) => (i === studentIndex ? { ...s, registered: [] } : s))
    );
  }, [studentIndex]);

  // Tab Configs
  const tabList = useMemo(() => [
    {
      id: "catalog",
      label: "Curriculum Catalog",
      icon: BookOpen,
      badge: `${TOTAL_COURSES} Courses`,
    },
    {
      id: "record",
      label: "Academic History",
      icon: FileText,
      badge: `${passedCount} Passed`,
    },
    {
      id: "planner",
      label: "AI Planner",
      icon: Cpu,
      badge: phase === "confirmed" ? `${registeredCount} Enrolled` : phase === "plan" ? `${plan?.recommended.length ?? 0} Suggested` : null,
    },
    {
      id: "graph",
      label: "Dep Graph",
      icon: Network,
      badge: `${TOTAL_COURSES} Nodes`,
    },
  ], [passedCount, phase, plan, registeredCount]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10 text-card-foreground">
      
      {/* Rebranded Header */}
      <motion.div 
        initial={{ opacity: 0, y: -12 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        <div className="flex items-center gap-3.5 mb-1.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 border border-white/10 shrink-0">
            <Cpu className="w-5.5 h-5.5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight leading-none">IntelliEnroll</h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-50 dark:bg-indigo-950/40 text-[#2563EB] dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 uppercase tracking-wider">
                Cognitive Optimizer
              </span>
              <div className="flex items-center gap-1.5 bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                AI ENGINE CORE ONLINE
              </div>
            </div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-1.5">
              AI-driven prerequisite pathfinder, academic load balancer, and curriculum planner
            </p>
          </div>
        </div>
      </motion.div>

      {/* Floating Top Dashboard Selector Console */}
      <motion.div
        initial={{ opacity: 0, y: -8 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.45, delay: 0.05, ease: "easeOut" }}
      >
        <StudentSelector
          students={students}
          studentIndex={studentIndex}
          onStudentChange={handleStudentChange}
          onGeneratePlan={handleGeneratePlan}
          onReset={handleReset}
          phase={phase}
          registeredCount={registeredCount}
          passedCount={passedCount}
          failedCount={failedCount}
          progressPct={progressPct}
          totalCourses={TOTAL_COURSES}
          student={student}
          catalog={ENRICHED_CATALOG}
        />
      </motion.div>

      {/* Custom Animated Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-gray-100 dark:bg-gray-900/60 backdrop-blur-md rounded-2xl border border-gray-200/50 dark:border-gray-800/80 w-fit">
        {tabList.map(t => {
          const isActive = activeTab === t.id;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`relative px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                isActive
                  ? "text-white"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-250"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeRegistrationTab"
                  className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-650 rounded-xl -z-10 shadow-md shadow-blue-500/10"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-gray-400"}`} />
              <span>{t.label}</span>
              {t.badge && (
                <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-bold transition-colors ${
                  isActive ? "bg-white/20 text-white" : "bg-gray-200/80 dark:bg-gray-800 text-gray-550 dark:text-gray-400"
                }`}>
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Canvas Content: Multi-tab content animations */}
      <div className="w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12, scale: 0.995 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.995 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="focus-visible:outline-none"
          >
            {activeTab === "catalog" && (
              <CourseCatalog 
                catalog={ENRICHED_CATALOG} 
                currentTerm={CURRENT_TERM} 
              />
            )}

            {activeTab === "record" && (
              <AcademicHistory
                student={student}
                catalog={ENRICHED_CATALOG}
                currentTerm={CURRENT_TERM}
              />
            )}

            {activeTab === "planner" && (
              <RegistrationPlanner
                plan={plan}
                checkedIds={checkedIds}
                onToggleCheck={handleToggleCheck}
                onConfirm={handleConfirm}
                onReset={handleReset}
                phase={phase}
                confirmedCourses={confirmedCourses}
                student={student}
                catalog={ENRICHED_CATALOG}
              />
            )}

            {activeTab === "graph" && (
              <PrerequisiteGraph
                catalog={ENRICHED_CATALOG}
                student={student}
                currentTerm={CURRENT_TERM}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
export default SmartRegistration;
