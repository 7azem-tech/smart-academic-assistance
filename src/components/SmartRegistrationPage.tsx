import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Brain, Sparkles, CheckCircle2, AlertTriangle, BookOpen,
  Zap, Edit3, ChevronDown, Search, Plus, X,
  Star, GraduationCap, Check, Loader2, Info,
  FlaskConical, ListChecks, ShieldCheck, BarChart3,
  ArrowRight, Clock, Trophy, AlertCircle, Users,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Course {
  code: string;
  name: string;
  credits: number;
  reason: "Critical Path" | "Blocks 3 Courses" | "Standard Plan" | "Retry — High Priority" | "Elective" | "Final Required";
  priority: "HIGH" | "NORMAL" | "OPTIONAL";
  /** One-sentence AI reasoning shown in the expanded detail panel */
  whyPicked: string;
  /** Downstream courses unlocked/blocked by this course — shown as pill chips */
  blocks: { code: string; name: string }[];
}

interface StudentCase {
  id: number;
  name: string;
  year: string;
  gpa: number;
  status: "On Track" | "Has Failed Courses" | "Final Semester";
  statusColor: string;
  completed: number;
  failed: number;
  remaining: number;
  plan: Course[];
  planTitle: string;
}

// ─── Mock Data — 3 Cases ─────────────────────────────────────────────────────
// All course names, codes, credits, and unlock chains are sourced directly from
// AcademicRoadmap.tsx (semesters array) and registrationEngine.ts (COURSE_CATALOG).
const STUDENT_CASES: StudentCase[] = [

  // ── CASE 1: Hazem Ismail — No failures, clean academic roadmap ────────────
  // Student has passed all of Sem 1, Sem 2, and Sem 3 except MATH3.
  // System auto-selects Sem 4 courses based on normal progression.
  // Source: Semester 4 courses in AcademicRoadmap (Year 2 - Spring)
  {
    id: 0,
    name: "Hazem Ismail",
    year: "Year 2",
    gpa: 3.6,
    status: "On Track",
    statusColor: "#10B981",
    completed: 17,   // Sem 1 (6) + Sem 2 (6) + Sem 3 partial (5 of 6, missing MATH3) = 17 courses
    failed: 0,
    remaining: 31,   // 48 total courses − 17 passed = 31 courses remaining to graduate
    planTitle: "Normal Academic Roadmap — Auto-Selected (Sem 4)",
    plan: [
      {
        code: "DS201", name: "Data Structure", credits: 3,
        reason: "Critical Path", priority: "HIGH",
        whyPicked: "Most impactful course in Sem 4 — passing it immediately unlocks 4 Year 3 courses. Without it, the entire AI, OS, and Algorithms track is locked.",
        blocks: [
          { code: "AI301",  name: "Artificial Intelligence" },
          { code: "OS301",  name: "Operating Systems" },
          { code: "CO301",  name: "Computer Organization" },
          { code: "AAD301", name: "Algorithms Analysis and Design" },
          { code: "CG401",  name: "Computer Graphics" },
        ],
      },
      {
        code: "ML201", name: "Machine Learning Fundamentals", credits: 3,
        reason: "Blocks 3 Courses", priority: "HIGH",
        whyPicked: "All prerequisites (MATH3 + Prob&Stat-2) are already completed. Passing this unlocks the NLP track in Year 3.",
        blocks: [
          { code: "NLP301", name: "Natural Language Processing" },
        ],
      },
      {
        code: "WT201", name: "Web Technology", credits: 3,
        reason: "Blocks 3 Courses", priority: "HIGH",
        whyPicked: "Only requires Programming Language which you passed in Sem 2. Completing this opens the entire web and semantic tracks.",
        blocks: [
          { code: "SWO401", name: "Semantic Web and Ontology" },
        ],
      },
      {
        code: "OR201", name: "Introduction to Operation Research", credits: 3,
        reason: "Standard Plan", priority: "NORMAL",
        whyPicked: "Requires Prob&Stat-1 + Programming Language — both completed. Standard Year 2 Spring progression course.",
        blocks: [],
      },
      {
        code: "NFL201", name: "Networking Fundamentals Lab", credits: 2,
        reason: "Standard Plan", priority: "NORMAL",
        whyPicked: "Requires Computer Networks Technology (NET201) passed in Sem 3. Lab component for networking track.",
        blocks: [],
      },
      {
        code: "ENT201", name: "Entrepreneurship", credits: 2,
        reason: "Elective", priority: "OPTIONAL",
        whyPicked: "No prerequisites. University elective — fulfills non-technical credit requirement before graduation.",
        blocks: [],
      },
    ],
  },

  // ── CASE 2: Sara Al-Mansouri — Failed Data Structure (+ 2 others) ─────────
  // DS201 is the most critical failure — it blocks AI, OS, CO, AAD, CG (4 courses).
  // System auto-prioritizes DS201 retry first, then fills remaining slots.
  // Source: Semester 4 courses + prerequisite map from AcademicRoadmap.tsx
  {
    id: 1,
    name: "Sara Al-Mansouri",
    year: "Year 2",
    gpa: 2.1,
    status: "Has Failed Courses",
    statusColor: "#F59E0B",
    completed: 15,   // Sem 1 (6 courses) + Sem 2 partial (5, excl. MATH2) + Sem 3 partial (4, excl. MATH3 & STAT2) = 15 courses
    failed: 3,
    remaining: 33,   // 48 total courses − 15 passed = 33 courses remaining (includes 3 failed that need retake)
    planTitle: "Recovery Plan — DS201 & Others Auto-Prioritized",
    plan: [
      {
        code: "DS201", name: "Data Structure", credits: 3,
        reason: "Retry — High Priority", priority: "HIGH",
        whyPicked: "Previously FAILED. This is the single most critical blocker in your record — 4 Year 3 courses cannot be taken until this is passed. Placed #1 in plan.",
        blocks: [
          { code: "AI301",  name: "Artificial Intelligence" },
          { code: "OS301",  name: "Operating Systems" },
          { code: "CO301",  name: "Computer Organization" },
          { code: "AAD301", name: "Algorithms Analysis and Design" },
          { code: "CG401",  name: "Computer Graphics" },
        ],
      },
      {
        code: "MATH2", name: "Mathematics-2", credits: 3,
        reason: "Retry — High Priority", priority: "HIGH",
        whyPicked: "Previously FAILED. Prerequisite for Mathematics-3, which is required for Machine Learning Fundamentals and Digital Signal Processing. Entire ML/AI track is locked without it.",
        blocks: [
          { code: "MATH3",  name: "Mathematics-3" },
          { code: "ML201",  name: "Machine Learning Fundamentals" },
          { code: "DSP301", name: "Digital Signal Processing" },
        ],
      },
      {
        code: "STAT2", name: "Probability and Statistics-2", credits: 3,
        reason: "Retry — High Priority", priority: "HIGH",
        whyPicked: "Previously FAILED. Direct prerequisite for Machine Learning Fundamentals (ML201). The entire AI/ML track remains locked until this is resolved.",
        blocks: [
          { code: "ML201",  name: "Machine Learning Fundamentals" },
          { code: "NLP301", name: "Natural Language Processing" },
        ],
      },
      {
        code: "WT201", name: "Web Technology", credits: 3,
        reason: "Standard Plan", priority: "NORMAL",
        whyPicked: "No failed prerequisites block this course. Requires Programming Language (PL101) which you passed. Safe to take alongside the three retakes.",
        blocks: [
          { code: "SWO401", name: "Semantic Web and Ontology" },
        ],
      },
      {
        code: "ENT201", name: "Entrepreneurship", credits: 2,
        reason: "Elective", priority: "OPTIONAL",
        whyPicked: "No prerequisites — zero dependencies. Safe filler course to maintain credit load while resolving critical failures.",
        blocks: [],
      },
    ],
  },

  // ── CASE 3: Omar Khaled — Final Semester (Year 4 - Spring) ───────────────
  // Student has passed everything up to Semester 7. Now registering Sem 8 (graduation).
  // Source: Semester 8 courses in AcademicRoadmap (Year 4 - Spring)
  {
    id: 2,
    name: "Omar Khaled",
    year: "Year 4",
    gpa: 3.85,
    status: "Final Semester",
    statusColor: "#2563EB",
    completed: 42,   // All Semesters 1–7 complete = 6 courses × 7 semesters = 42 courses
    failed: 0,
    remaining: 6,    // Sem 8 has 6 courses left to graduate
    planTitle: "Graduation Completion — Semester 8 Auto-Registered",
    plan: [
      {
        code: "PRJ402", name: "Project (2)", credits: 4,
        reason: "Final Required", priority: "HIGH",
        whyPicked: "Mandatory graduation capstone. Requires Project (1) completed in Sem 7. This is the final degree requirement — cannot graduate without it.",
        blocks: [],
      },
      {
        code: "CCN401", name: "Cloud Computing Networking", credits: 3,
        reason: "Final Required", priority: "HIGH",
        whyPicked: "Requires Advanced Computer Networks (ACN401) completed in Sem 7. This is a final required elective for the CS track — no further courses blocked.",
        blocks: [],
      },
      {
        code: "WMN401", name: "Wireless and Mobile Networks", credits: 3,
        reason: "Final Required", priority: "HIGH",
        whyPicked: "Requires Advanced Computer Networks (ACN401) completed in Sem 7. Graduation requirement for the networking specialization track.",
        blocks: [],
      },
      {
        code: "SWO401", name: "Semantic Web and Ontology", credits: 3,
        reason: "Standard Plan", priority: "NORMAL",
        whyPicked: "Requires Web Technology (WT201) passed in Sem 4. Standard final semester course — no downstream dependencies.",
        blocks: [],
      },
      {
        code: "LAI401", name: "Selected Labs in AI", credits: 2,
        reason: "Standard Plan", priority: "NORMAL",
        whyPicked: "Requires Artificial Intelligence (AI301) passed in Sem 5. Lab component completing the AI practical track.",
        blocks: [],
      },
      {
        code: "FM401", name: "Fundamental of Management", credits: 2,
        reason: "Elective", priority: "OPTIONAL",
        whyPicked: "No prerequisites. University management elective — required for graduation clearance as a non-technical credit.",
        blocks: [],
      },
    ],
  },
];

// ─── Animated Counter Hook ────────────────────────────────────────────────────
function useCounter(target: number, duration = 1200, active = true) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!active) return;
    setValue(0);
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration, active]);

  return value;
}

// ─── Priority Badge ───────────────────────────────────────────────────────────
const PRIORITY_CONFIG = {
  HIGH: { bg: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.4)", text: "#F87171", label: "HIGH" },
  NORMAL: { bg: "rgba(37,99,235,0.15)", border: "rgba(37,99,235,0.4)", text: "#60A5FA", label: "NORMAL" },
  OPTIONAL: { bg: "rgba(124,58,237,0.12)", border: "rgba(124,58,237,0.35)", text: "#A78BFA", label: "OPTIONAL" },
};

const REASON_CONFIG: Record<Course["reason"], { color: string; bg: string }> = {
  "Critical Path":         { color: "#F87171", bg: "rgba(239,68,68,0.1)" },
  "Blocks 3 Courses":      { color: "#FB923C", bg: "rgba(251,146,60,0.1)" },
  "Standard Plan":         { color: "#60A5FA", bg: "rgba(96,165,250,0.1)" },
  "Retry — High Priority": { color: "#FBBF24", bg: "rgba(251,191,36,0.1)" },
  "Elective":              { color: "#A78BFA", bg: "rgba(167,139,250,0.1)" },
  "Final Required":        { color: "#34D399", bg: "rgba(52,211,153,0.1)" },
};

// Tooltip component removed — replaced by inline expandable detail panel

// ─── Logic Steps ──────────────────────────────────────────────────────────────
const LOGIC_STEPS = [
  { icon: BarChart3,    color: "#2563EB", title: "We checked your academic record",          desc: "Scanned all passed, failed, and in-progress courses against your degree plan." },
  { icon: AlertCircle, color: "#F59E0B", title: "We found failed courses — analyzed impact", desc: "Identified which failures are critical blockers vs. non-critical retakes." },
  { icon: Trophy,      color: "#EF4444", title: "Critical blockers got top priority",        desc: "Courses blocking 3+ future courses were flagged as HIGH and placed first." },
  { icon: ListChecks,  color: "#10B981", title: "Remaining slots filled with your semester plan", desc: "After resolving priorities, normal progression courses filled the remaining credit slots." },
];

// ─── Manual course table mock ─────────────────────────────────────────────────
const MANUAL_CATALOG = [
  "CS401 — Advanced Databases",
  "CS402 — Parallel Computing",
  "CS403 — Compiler Design",
  "CS404 — Cryptography",
  "CS405 — Computer Vision",
  "SE401 — Agile Methods",
  "SE402 — DevOps Engineering",
  "AI401 — Deep Learning",
  "AI402 — Natural Language Processing",
];

// ─── Main Component ───────────────────────────────────────────────────────────
export function SmartRegistrationPage() {
  const [caseIdx, setCaseIdx] = useState(0);
  const [registerPhase, setRegisterPhase] = useState<"idle" | "analyzing" | "building" | "done">("idle");
  const [logicOpen, setLogicOpen] = useState(false);
  const [manualSearch, setManualSearch] = useState("");
  const [manualCourses, setManualCourses] = useState<string[]>([]);
  const [countActive, setCountActive] = useState(true);
  const [saved, setSaved] = useState(false);
  /** Code of the course whose detail panel is currently expanded, or null */
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);

  const student = STUDENT_CASES[caseIdx];

  // Re-trigger counters on case change
  useEffect(() => {
    setCountActive(false);
    const t = setTimeout(() => setCountActive(true), 50);
    return () => clearTimeout(t);
  }, [caseIdx]);

  const completedCount  = useCounter(student.completed,  1100, countActive);
  const failedCount     = useCounter(student.failed,     900,  countActive);
  const remainingCount  = useCounter(student.remaining,  1300, countActive);

  const handleRegister = useCallback(() => {
    if (registerPhase !== "idle") return;
    setRegisterPhase("analyzing");
    setTimeout(() => setRegisterPhase("building"), 1800);
    setTimeout(() => setRegisterPhase("done"),     3600);
    setTimeout(() => setRegisterPhase("idle"),     6000);
  }, [registerPhase]);

  const filteredCatalog = MANUAL_CATALOG.filter(
    c => c.toLowerCase().includes(manualSearch.toLowerCase()) && !manualCourses.includes(c)
  );

  const totalCredits = student.plan.reduce((s, c) => s + c.credits, 0);

  // ── Glow palette per case
  const caseGlow = ["rgba(37,99,235,0.18)", "rgba(245,158,11,0.18)", "rgba(16,185,129,0.18)"];

  return (
    <div style={{ minHeight: "100vh", position: "relative", paddingBottom: 60 }}>

      {/* ── Ambient mesh background ── */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
        <motion.div
          animate={{ x: [0, 40, -20, 0], y: [0, -30, 20, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          style={{ position: "absolute", top: "-20%", left: "10%", width: 700, height: 700,
            background: "radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)", borderRadius: "50%", filter: "blur(60px)" }}
        />
        <motion.div
          animate={{ x: [0, -50, 30, 0], y: [0, 40, -20, 0] }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut", delay: 5 }}
          style={{ position: "absolute", bottom: "-10%", right: "5%", width: 600, height: 600,
            background: "radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)", borderRadius: "50%", filter: "blur(60px)" }}
        />
        <motion.div
          animate={{ x: [0, 30, -40, 0], y: [0, -20, 40, 0] }}
          transition={{ duration: 26, repeat: Infinity, ease: "easeInOut", delay: 12 }}
          style={{ position: "absolute", top: "40%", right: "25%", width: 400, height: 400,
            background: "radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 70%)", borderRadius: "50%", filter: "blur(40px)" }}
        />
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto" }}>

        {/* ─────────────────────────────────────────────────────────────────────
            1. HEADER
        ───────────────────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{ marginBottom: 28 }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            {/* Left: Title */}
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 16, flexShrink: 0,
                background: "linear-gradient(135deg, #2563EB, #7C3AED)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 0 24px rgba(37,99,235,0.45), 0 4px 16px rgba(0,0,0,0.3)",
                border: "1px solid rgba(255,255,255,0.15)",
              }}>
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Brain style={{ width: 24, height: 24, color: "white" }} />
                </motion.div>
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <h1 style={{ fontSize: 26, fontWeight: 900, color: "#0F172A", margin: 0, letterSpacing: "-0.5px" }}>
                    Smart Registration
                  </h1>
                  <motion.div
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{
                      display: "flex", alignItems: "center", gap: 5,
                      background: "linear-gradient(90deg, #2563EB, #7C3AED)",
                      borderRadius: 20, padding: "3px 10px",
                    }}
                  >
                    <Sparkles style={{ width: 11, height: 11, color: "white" }} />
                    <span style={{ fontSize: 10, fontWeight: 800, color: "white", letterSpacing: "0.08em", textTransform: "uppercase" }}>AI-Powered</span>
                  </motion.div>
                </div>
                <p style={{ fontSize: 13, color: "#64748B", margin: "4px 0 0", fontWeight: 500 }}>
                  Your personalized course plan, built automatically
                </p>
              </div>
            </div>

            {/* Right: Student chip */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              style={{
                background: "linear-gradient(135deg, #0F172A, #1E293B)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 16, padding: "12px 18px",
                display: "flex", alignItems: "center", gap: 12,
                boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: "linear-gradient(135deg, #2563EB, #7C3AED)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: `0 0 14px ${caseGlow[caseIdx]}`,
              }}>
                <GraduationCap style={{ width: 20, height: 20, color: "white" }} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "white", lineHeight: 1.2 }}>{student.name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                  <span style={{ fontSize: 11, color: "#94A3B8", background: "rgba(255,255,255,0.06)", borderRadius: 6, padding: "1px 7px" }}>
                    {student.year}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#D4AF37" }}>
                    <Star style={{ width: 10, height: 10, fill: "#D4AF37" }} /> GPA {student.gpa}
                  </span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                    background: `${student.statusColor}22`,
                    border: `1px solid ${student.statusColor}55`,
                    color: student.statusColor,
                    display: "flex", alignItems: "center", gap: 4,
                  }}>
                    <motion.span
                      animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      style={{ display: "inline-block", width: 5, height: 5, borderRadius: "50%", background: student.statusColor }}
                    />
                    {student.status}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Case switcher */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 18, flexWrap: "wrap" }}
          >
            <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              <Users style={{ width: 12, height: 12, display: "inline", marginRight: 4 }} />Preview Case:
            </span>
            {STUDENT_CASES.map((c, i) => (
              <button
                key={c.id}
                onClick={() => { setCaseIdx(i); setRegisterPhase("idle"); setSaved(false); }}
                style={{
                  padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer",
                  border: caseIdx === i ? "1px solid rgba(37,99,235,0.6)" : "1px solid rgba(255,255,255,0.1)",
                  background: caseIdx === i ? "linear-gradient(90deg,#2563EB22,#7C3AED22)" : "rgba(255,255,255,0.04)",
                  color: caseIdx === i ? "#60A5FA" : "#64748B",
                  transition: "all 0.2s",
                  display: "flex", alignItems: "center", gap: 6,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.statusColor, display: "inline-block" }} />
                {c.name.split(" ")[0]} · {c.status}
              </button>
            ))}
          </motion.div>
        </motion.div>

        {/* ─────────────────────────────────────────────────────────────────────
            2. ACADEMIC STATUS STRIP
        ───────────────────────────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
          {[
            {
              icon: CheckCircle2, label: "Courses Completed", value: completedCount,
              glow: "rgba(16,185,129,0.3)", border: "rgba(16,185,129,0.25)",
              from: "#10B981", to: "#059669", textColor: "#34D399", bgOverlay: "rgba(16,185,129,0.06)",
            },
            {
              icon: AlertTriangle, label: "Failed / Needs Retry", value: failedCount,
              glow: "rgba(245,158,11,0.3)", border: "rgba(245,158,11,0.25)",
              from: "#F59E0B", to: "#D97706", textColor: "#FBBF24", bgOverlay: "rgba(245,158,11,0.06)",
            },
            {
              icon: BookOpen, label: "Remaining to Graduate", value: remainingCount,
              glow: "rgba(124,58,237,0.3)", border: "rgba(124,58,237,0.25)",
              from: "#7C3AED", to: "#6D28D9", textColor: "#A78BFA", bgOverlay: "rgba(124,58,237,0.06)",
            },
          ].map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -3, boxShadow: `0 16px 48px ${card.glow}` }}
              style={{
                background: `linear-gradient(135deg, #0F172A, #1E293B)`,
                border: `1px solid ${card.border}`,
                borderRadius: 20, padding: "20px 24px", cursor: "default",
                boxShadow: `0 4px 24px ${card.glow.replace("0.3", "0.15")}`,
                position: "relative", overflow: "hidden",
                transition: "box-shadow 0.3s",
              }}
            >
              <div style={{
                position: "absolute", inset: 0,
                background: card.bgOverlay,
                borderRadius: 20,
              }} />
              {/* Pulse ring */}
              <motion.div
                animate={{ scale: [1, 1.6, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.4 }}
                style={{
                  position: "absolute", top: 18, right: 18,
                  width: 10, height: 10, borderRadius: "50%",
                  background: card.from,
                  boxShadow: `0 0 12px ${card.from}`,
                }}
              />
              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12, marginBottom: 14,
                  background: `linear-gradient(135deg, ${card.from}, ${card.to})`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: `0 4px 16px ${card.glow}`,
                }}>
                  <card.icon style={{ width: 20, height: 20, color: "white" }} />
                </div>
                <div style={{ fontSize: 38, fontWeight: 900, color: card.textColor, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                  {card.value}
                </div>
                <div style={{ fontSize: 12, color: "#64748B", marginTop: 6, fontWeight: 500 }}>{card.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ─────────────────────────────────────────────────────────────────────
            3. SMART PLAN PANEL
        ───────────────────────────────────────────────────────────────────── */}
        <motion.div
          key={`plan-${caseIdx}`}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background: "linear-gradient(145deg, rgba(15,23,42,0.98), rgba(30,41,59,0.95))",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 24, marginBottom: 20, overflow: "hidden",
            boxShadow: "0 24px 80px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)",
            backdropFilter: "blur(24px)",
          }}
        >
          {/* Panel Header */}
          <div style={{
            padding: "22px 28px 18px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            background: "linear-gradient(90deg, rgba(37,99,235,0.08), rgba(124,58,237,0.06))",
            display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
          }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: "linear-gradient(135deg,#2563EB,#7C3AED)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 0 16px rgba(37,99,235,0.4)",
                }}>
                  <Sparkles style={{ width: 16, height: 16, color: "white" }} />
                </div>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: "white", margin: 0 }}>
                  Your Registration Plan for Next Semester
                </h2>
              </div>
              <p style={{ fontSize: 12, color: "#64748B", margin: "6px 0 0 42px", fontWeight: 500 }}>
                {student.planTitle} · {totalCredits} Total Credit Hours
              </p>
            </div>
            <div style={{
              fontSize: 12, color: "#94A3B8", background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "6px 12px",
              fontFamily: "monospace",
            }}>
              {student.plan.length} courses · {totalCredits} cr
            </div>
          </div>

          {/* Course List */}
          <div style={{ padding: "8px 0" }}>
            {student.plan.map((course, i) => {
              const pr = PRIORITY_CONFIG[course.priority];
              const rs = REASON_CONFIG[course.reason];
              const isExpanded = expandedCourse === course.code;
              const isFailed = course.reason === "Retry — High Priority";

              return (
                <motion.div
                  key={course.code}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.25 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    borderBottom: i < student.plan.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                  }}
                >
                  {/* ── Main row ── */}
                  <div
                    onClick={() => setExpandedCourse(isExpanded ? null : course.code)}
                    style={{
                      display: "flex", alignItems: "center", gap: 14,
                      padding: "14px 28px", cursor: "pointer",
                      background: isExpanded ? "rgba(37,99,235,0.06)" : "transparent",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={e => { if (!isExpanded) (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.025)"; }}
                    onMouseLeave={e => { if (!isExpanded) (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                  >
                    {/* Index */}
                    <div style={{
                      width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                      background: isExpanded ? "rgba(37,99,235,0.2)" : "rgba(255,255,255,0.05)",
                      border: isExpanded ? "1px solid rgba(37,99,235,0.4)" : "1px solid rgba(255,255,255,0.08)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 700, color: isExpanded ? "#60A5FA" : "#475569",
                      transition: "all 0.2s",
                    }}>
                      {i + 1}
                    </div>

                    {/* Course info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: "white", fontFamily: "monospace" }}>
                          {course.code}
                        </span>
                        <span style={{ fontSize: 13, color: "#CBD5E1", fontWeight: 500 }}>
                          {course.name}
                        </span>
                        {isFailed && (
                          <span style={{
                            fontSize: 9, fontWeight: 800, padding: "1px 7px", borderRadius: 20,
                            background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)",
                            color: "#F87171", letterSpacing: "0.06em", textTransform: "uppercase",
                          }}>FAILED</span>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5, flexWrap: "wrap" }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 6,
                          background: rs.bg, color: rs.color, letterSpacing: "0.03em",
                        }}>
                          {course.reason}
                        </span>
                        <span style={{ fontSize: 11, color: "#475569", fontFamily: "monospace" }}>
                          {course.credits} cr
                        </span>
                        {course.blocks.length > 0 && (
                          <span style={{ fontSize: 10, color: "#FB923C", fontWeight: 600 }}>
                            Unlocks {course.blocks.length} course{course.blocks.length > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right side: priority + expand toggle */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 20,
                        background: pr.bg, border: `1px solid ${pr.border}`, color: pr.text,
                        letterSpacing: "0.06em", textTransform: "uppercase",
                      }}>
                        {pr.label}
                      </span>
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.25 }}
                        style={{
                          width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                          background: isExpanded ? "rgba(37,99,235,0.2)" : "rgba(255,255,255,0.05)",
                          border: isExpanded ? "1px solid rgba(37,99,235,0.35)" : "1px solid rgba(255,255,255,0.08)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >
                        <ChevronDown style={{ width: 13, height: 13, color: isExpanded ? "#60A5FA" : "#475569" }} />
                      </motion.div>
                    </div>
                  </div>

                  {/* ── Expandable detail panel ── */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        style={{ overflow: "hidden" }}
                      >
                        <div style={{
                          margin: "0 28px 14px",
                          background: "rgba(15,23,42,0.6)",
                          border: "1px solid rgba(37,99,235,0.2)",
                          borderRadius: 14,
                          padding: "16px 18px",
                          backdropFilter: "blur(12px)",
                        }}>
                          {/* AI Reasoning */}
                          <div style={{ display: "flex", gap: 10, marginBottom: course.blocks.length > 0 ? 14 : 0 }}>
                            <div style={{
                              width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                              background: "linear-gradient(135deg,#2563EB,#7C3AED)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              boxShadow: "0 0 12px rgba(37,99,235,0.3)",
                            }}>
                              <Brain style={{ width: 14, height: 14, color: "white" }} />
                            </div>
                            <div>
                              <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                                Why the AI picked this
                              </div>
                              <div style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.6 }}>
                                {course.whyPicked}
                              </div>
                            </div>
                          </div>

                          {/* Downstream blocked/unlocked courses */}
                          {course.blocks.length > 0 && (
                            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 12 }}>
                              <div style={{
                                fontSize: 10, fontWeight: 700, color: isFailed ? "#F87171" : "#FB923C",
                                textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10,
                                display: "flex", alignItems: "center", gap: 6,
                              }}>
                                <AlertTriangle style={{ width: 11, height: 11 }} />
                                {isFailed ? "Still blocking these courses until retake is passed:" : "Passing this unlocks:"}
                              </div>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                                {course.blocks.map(b => (
                                  <span
                                    key={b.code}
                                    style={{
                                      display: "inline-flex", alignItems: "center", gap: 6,
                                      padding: "5px 11px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                                      background: isFailed ? "rgba(239,68,68,0.1)" : "rgba(251,146,60,0.1)",
                                      border: isFailed ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(251,146,60,0.25)",
                                      color: isFailed ? "#FCA5A5" : "#FDBA74",
                                    }}
                                  >
                                    <span style={{ fontFamily: "monospace", fontWeight: 800, fontSize: 10 }}>{b.code}</span>
                                    <span style={{ color: isFailed ? "#F87171" : "#FB923C", opacity: 0.7 }}>·</span>
                                    {b.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div style={{
            padding: "20px 28px 24px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            display: "flex", gap: 14, flexWrap: "wrap",
          }}>
            {/* Register For Me */}
            <motion.button
              onClick={handleRegister}
              whileHover={registerPhase === "idle" ? { scale: 1.03, y: -1 } : {}}
              whileTap={registerPhase === "idle" ? { scale: 0.97 } : {}}
              disabled={registerPhase !== "idle" && registerPhase !== "done"}
              style={{
                flex: 1, minWidth: 200, padding: "14px 24px", borderRadius: 14,
                border: "none", cursor: registerPhase === "idle" ? "pointer" : "default",
                background: registerPhase === "done"
                  ? "linear-gradient(135deg, #10B981, #059669)"
                  : "linear-gradient(135deg, #2563EB, #7C3AED)",
                color: "white", fontWeight: 800, fontSize: 14,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                boxShadow: registerPhase === "done"
                  ? "0 0 28px rgba(16,185,129,0.45)"
                  : "0 0 28px rgba(37,99,235,0.4), 0 4px 16px rgba(0,0,0,0.3)",
                transition: "all 0.4s",
              }}
            >
              <AnimatePresence mode="wait">
                {registerPhase === "idle" && (
                  <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Zap style={{ width: 17, height: 17 }} /> Register for Me
                  </motion.span>
                )}
                {registerPhase === "analyzing" && (
                  <motion.span key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                      <Loader2 style={{ width: 17, height: 17 }} />
                    </motion.div>
                    Analyzing your record…
                  </motion.span>
                )}
                {registerPhase === "building" && (
                  <motion.span key="building" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}>
                      <FlaskConical style={{ width: 17, height: 17 }} />
                    </motion.div>
                    Building plan…
                  </motion.span>
                )}
                {registerPhase === "done" && (
                  <motion.span key="done" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Check style={{ width: 17, height: 17 }} /> Enrolled Successfully ✓
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Progress bar under button when building */}
            <AnimatePresence>
              {(registerPhase === "analyzing" || registerPhase === "building") && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0 }}
                  style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: "0 0 160px" }}
                >
                  <div style={{ fontSize: 10, color: "#64748B", marginBottom: 5, fontWeight: 600 }}>
                    {registerPhase === "analyzing" ? "STEP 1 / 3 — Scanning" : "STEP 2 / 3 — Building"}
                  </div>
                  <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
                    <motion.div
                      initial={{ width: "0%" }}
                      animate={{ width: registerPhase === "analyzing" ? "35%" : "80%" }}
                      transition={{ duration: 1.4, ease: "easeOut" }}
                      style={{ height: "100%", borderRadius: 4, background: "linear-gradient(90deg,#2563EB,#7C3AED)" }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Customize Plan */}
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.97 }}
              style={{
                padding: "14px 24px", borderRadius: 14,
                border: "1px solid rgba(124,58,237,0.4)", cursor: "pointer",
                background: "rgba(124,58,237,0.07)", color: "#A78BFA",
                fontWeight: 700, fontSize: 14,
                display: "flex", alignItems: "center", gap: 8,
                transition: "all 0.25s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(124,58,237,0.14)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(124,58,237,0.07)"; }}
            >
              <Edit3 style={{ width: 16, height: 16 }} /> Customize Plan
            </motion.button>
          </div>

          {/* Step progress indicator */}
          <AnimatePresence>
            {registerPhase !== "idle" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "12px 28px", display: "flex", gap: 20, overflow: "hidden" }}
              >
                {[
                  { step: 1, label: "Analyzing", done: registerPhase === "building" || registerPhase === "done" },
                  { step: 2, label: "Building Plan", done: registerPhase === "done" },
                  { step: 3, label: "Done ✓", done: registerPhase === "done" },
                ].map(s => (
                  <div key={s.step} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                      background: s.done ? "#10B981" : (
                        (s.step === 1 && registerPhase === "analyzing") || (s.step === 2 && registerPhase === "building")
                          ? "#2563EB" : "rgba(255,255,255,0.06)"
                      ),
                      fontSize: 9, fontWeight: 800, color: "white",
                      transition: "background 0.4s",
                    }}>
                      {s.done ? <Check style={{ width: 11, height: 11 }} /> : s.step}
                    </div>
                    <span style={{ fontSize: 11, color: s.done ? "#34D399" : "#64748B", fontWeight: 600 }}>{s.label}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ─────────────────────────────────────────────────────────────────────
            4. LOGIC EXPLAINER (Collapsible)
        ───────────────────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          style={{
            background: "linear-gradient(145deg, rgba(15,23,42,0.95), rgba(30,41,59,0.9))",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 20, marginBottom: 20, overflow: "hidden",
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          }}
        >
          <button
            onClick={() => setLogicOpen(!logicOpen)}
            style={{
              width: "100%", padding: "18px 24px", background: "none", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <ShieldCheck style={{ width: 18, height: 18, color: "#60A5FA" }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: "white" }}>How did we choose these courses?</span>
              <span style={{
                fontSize: 10, padding: "2px 8px", borderRadius: 20,
                background: "rgba(37,99,235,0.15)", color: "#60A5FA",
                border: "1px solid rgba(37,99,235,0.25)", fontWeight: 600,
              }}>AI Logic</span>
            </div>
            <motion.div animate={{ rotate: logicOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
              <ChevronDown style={{ width: 18, height: 18, color: "#475569" }} />
            </motion.div>
          </button>

          <AnimatePresence>
            {logicOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                style={{ overflow: "hidden" }}
              >
                <div style={{
                  padding: "0 24px 24px",
                  display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14,
                  borderTop: "1px solid rgba(255,255,255,0.05)",
                  paddingTop: 20,
                }}>
                  {LOGIC_STEPS.map((step, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07 }}
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: 14, padding: "16px 18px",
                        display: "flex", gap: 12,
                      }}
                    >
                      <div style={{
                        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                        background: `${step.color}22`, border: `1px solid ${step.color}44`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <step.icon style={{ width: 18, height: 18, color: step.color }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: "#64748B", fontWeight: 700, marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                          Step {i + 1}
                        </div>
                        <div style={{ fontSize: 12, color: "#CBD5E1", fontWeight: 600, lineHeight: 1.4 }}>
                          {step.title}
                        </div>
                        <div style={{ fontSize: 11, color: "#475569", marginTop: 4, lineHeight: 1.5 }}>
                          {step.desc}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ─────────────────────────────────────────────────────────────────────
            5. MANUAL OVERRIDE SECTION
        ───────────────────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.38 }}
          style={{
            background: "linear-gradient(145deg, rgba(15,23,42,0.95), rgba(30,41,59,0.9))",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 20, overflow: "hidden",
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          }}
        >
          {/* Header */}
          <div style={{
            padding: "20px 24px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: "rgba(212,175,55,0.15)", border: "1px solid rgba(212,175,55,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Edit3 style={{ width: 16, height: 16, color: "#D4AF37" }} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "white" }}>Want full control?</div>
                <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>Manual Override — Add or remove courses</div>
              </div>
            </div>
            <div style={{
              fontSize: 11, color: "#F59E0B", background: "rgba(245,158,11,0.1)",
              border: "1px solid rgba(245,158,11,0.2)", borderRadius: 8, padding: "5px 10px",
              display: "flex", alignItems: "center", gap: 5, maxWidth: 300,
            }}>
              <AlertCircle style={{ width: 11, height: 11, flexShrink: 0 }} />
              Manual changes won't affect your AI plan unless you save
            </div>
          </div>

          <div style={{ padding: 24 }}>
            {/* Search input */}
            <div style={{ position: "relative", marginBottom: 16 }}>
              <Search style={{
                position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                width: 16, height: 16, color: "#475569", pointerEvents: "none",
              }} />
              <input
                value={manualSearch}
                onChange={e => setManualSearch(e.target.value)}
                placeholder="Search course code or name to add…"
                style={{
                  width: "100%", padding: "12px 14px 12px 40px",
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12, color: "white", fontSize: 13, outline: "none",
                  transition: "border-color 0.2s", boxSizing: "border-box",
                }}
                onFocus={e => (e.target.style.borderColor = "rgba(37,99,235,0.5)")}
                onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
              />
              {/* Dropdown suggestions */}
              <AnimatePresence>
                {manualSearch && filteredCatalog.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    style={{
                      position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 20,
                      background: "#0F172A", border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 12, overflow: "hidden",
                      boxShadow: "0 16px 48px rgba(0,0,0,0.4)",
                    }}
                  >
                    {filteredCatalog.slice(0, 5).map(course => (
                      <button
                        key={course}
                        onClick={() => { setManualCourses(p => [...p, course]); setManualSearch(""); }}
                        style={{
                          width: "100%", padding: "10px 16px", background: "none", border: "none",
                          cursor: "pointer", textAlign: "left", color: "#CBD5E1", fontSize: 13,
                          display: "flex", alignItems: "center", gap: 10, transition: "background 0.15s",
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(37,99,235,0.15)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "none")}
                      >
                        <Plus style={{ width: 14, height: 14, color: "#2563EB", flexShrink: 0 }} />
                        <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#60A5FA" }}>
                          {course.split("—")[0]}
                        </span>
                        <span style={{ color: "#64748B" }}>—{course.split("—")[1]}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Manual courses table */}
            <AnimatePresence>
              {manualCourses.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ marginBottom: 16, overflow: "hidden" }}
                >
                  <div style={{
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 12, overflow: "hidden",
                  }}>
                    <div style={{
                      padding: "8px 16px",
                      background: "rgba(255,255,255,0.03)",
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                      display: "grid", gridTemplateColumns: "1fr auto auto",
                      fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em",
                      gap: 16,
                    }}>
                      <span>Course</span><span>Credits</span><span>Remove</span>
                    </div>
                    {manualCourses.map((c, i) => (
                      <motion.div
                        key={c}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ delay: i * 0.04 }}
                        style={{
                          display: "grid", gridTemplateColumns: "1fr auto auto",
                          padding: "11px 16px", gap: 16, alignItems: "center",
                          borderBottom: i < manualCourses.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                        }}
                      >
                        <div>
                          <span style={{ fontSize: 12, fontFamily: "monospace", fontWeight: 700, color: "#60A5FA" }}>
                            {c.split("—")[0]}
                          </span>
                          <span style={{ fontSize: 12, color: "#64748B" }}>—{c.split("—")[1]}</span>
                        </div>
                        <span style={{ fontSize: 12, color: "#475569", fontFamily: "monospace" }}>3 cr</span>
                        <button
                          onClick={() => setManualCourses(p => p.filter(x => x !== c))}
                          style={{
                            width: 24, height: 24, borderRadius: 6, border: "1px solid rgba(239,68,68,0.3)",
                            background: "rgba(239,68,68,0.08)", cursor: "pointer", color: "#F87171",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={e => { (e.currentTarget).style.background = "rgba(239,68,68,0.2)"; }}
                          onMouseLeave={e => { (e.currentTarget).style.background = "rgba(239,68,68,0.08)"; }}
                        >
                          <X style={{ width: 12, height: 12 }} />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Empty state */}
            {manualCourses.length === 0 && (
              <div style={{
                padding: "20px 16px", textAlign: "center",
                border: "1px dashed rgba(255,255,255,0.08)", borderRadius: 12,
                marginBottom: 16,
              }}>
                <BookOpen style={{ width: 28, height: 28, color: "#1E293B", margin: "0 auto 8px" }} />
                <p style={{ fontSize: 12, color: "#334155", margin: 0 }}>No manual courses added yet. Search above to add.</p>
              </div>
            )}

            {/* Save button */}
            <div style={{ display: "flex", gap: 12 }}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => { if (manualCourses.length > 0) setSaved(true); }}
                style={{
                  padding: "11px 22px", borderRadius: 12,
                  background: saved ? "rgba(16,185,129,0.15)" : "rgba(212,175,55,0.12)",
                  border: saved ? "1px solid rgba(16,185,129,0.4)" : "1px solid rgba(212,175,55,0.3)",
                  color: saved ? "#34D399" : "#D4AF37",
                  fontSize: 13, fontWeight: 700, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 8, transition: "all 0.3s",
                }}
              >
                {saved ? <><Check style={{ width: 15, height: 15 }} /> Saved</> : <><ShieldCheck style={{ width: 15, height: 15 }} /> Save Manual Changes</>}
              </motion.button>
              {manualCourses.length > 0 && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setManualCourses([]); setSaved(false); }}
                  style={{
                    padding: "11px 22px", borderRadius: 12,
                    background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                    color: "#F87171", fontSize: 13, fontWeight: 700, cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 8,
                  }}
                >
                  <X style={{ width: 15, height: 15 }} /> Clear All
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}

export default SmartRegistrationPage;
