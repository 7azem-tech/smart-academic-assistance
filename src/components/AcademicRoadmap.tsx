import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Map, CheckCircle2, Circle, Lock, GraduationCap,
  ArrowRight, Info, BookOpen, Network,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { COURSE_CATALOG, enrichCatalog, CURRENT_TERM, StudentProfile } from "../services/registrationEngine";
import { PrerequisiteGraph } from "./SmartRegistration/PrerequisiteGraph";

// ── Enrich catalog once at module level ─────────────────────────────────────
const ENRICHED_CATALOG = enrichCatalog(COURSE_CATALOG);

interface AcademicRoadmapProps {
  onNavigate?: (screen: string) => void;
}

// Roadmap student profile (mirrors Semester 1+2 as completed, Sem 3 in progress)
const ROADMAP_STUDENT: StudentProfile = {
  id: "STU-ROAD",
  name: "Current Student",
  level: 2,
  passed: [
    "MATH1","CS101","ELEC101","TRW101","HR101","DM101",
    "MATH2","STAT1","CST101","ECON101","LD101","PL101",
  ],
  failed: [],
  registered: ["OOP201","DB201","MATH3","NET201","STAT2","SE201"],
};

export function AcademicRoadmap({ onNavigate: _onNavigate }: AcademicRoadmapProps) {
  const currentSemester = 3;
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"roadmap" | "catalog" | "graph">("roadmap");

  // ── Roadmap prerequisite unlock map ────────────────────────────────────────
  const prerequisites: Record<string, string[]> = {
    "Mathematics-1": ["Probability and Statistics-1"],
    "Introduction to Computers": ["Programming Language", "Computer Network Technology"],
    "Probability and Statistics-1": ["Probability and Statistics-2", "Introduction to Operation Research"],
    "Introduction to Software Engineering": ["Advanced Software Engineering", "Selected Labs in Software Engineering"],
    "Electronics": ["Logic Design"],
    "Programming Language": ["Object Oriented Programming", "Introduction to Database Systems", "Introduction to Software Engineering", "Introduction to Operation Research"],
    "Mathematics-2": ["Mathematics-3"],
    "Mathematics-3": ["Machine Learning Fundamentals", "Digital Signal Processing"],
    "Probability and Statistics-2": ["Machine Learning Fundamentals"],
    "Machine Learning Fundamentals": ["Natural Language Processing"],
    "Web Technology": ["Semantic Web and Ontology"],
    "Data Structure": ["Artificial Intelligence", "Operating Systems", "Computer Organization", "Algorithms Analysis and Design"],
    "Advanced Software Engineering": ["Selected Labs in Software Engineering"],
    "Microcontroller": ["Embedded Systems"],
    "Advanced Computer Networks": ["Cloud Computing Networking", "Wireless and Mobile Networks"],
    "Project (1)": ["Project (2)"],
    "Digital Signal Processing": ["Pattern Recognition"],
    "Computer Networks Technology": ["Networking Fundamentals Lab", "Information Computer Networks Security", "Microcontroller", "Ethical Hacking-Lab", "Advanced Computer Networks", "Communication Technology"],
  };

  // ── Semester data ───────────────────────────────────────────────────────────
  const semesters = [
    {
      number: 1, name: "Semester 1", year: "Year 1 - Fall", completed: true,
      courses: [
        { name: "Electronics", credits: 3, grade: "A" },
        { name: "Mathematics-1", credits: 3, grade: "B+" },
        { name: "Technical Report Writing", credits: 2, grade: "A" },
        { name: "Human Rights", credits: 2, grade: "A-" },
        { name: "Discrete Math", credits: 3, grade: "B" },
        { name: "Introduction to Computers", credits: 3, grade: "A" },
      ]
    },
    {
      number: 2, name: "Semester 2", year: "Year 1 - Spring", completed: true,
      courses: [
        { name: "Probability and Statistics-1", credits: 3, grade: "B+" },
        { name: "Creative and Scientific Thinking", credits: 2, grade: "A" },
        { name: "Mathematics-2", credits: 3, grade: "B" },
        { name: "Micro Economics", credits: 2, grade: "A-" },
        { name: "Logic Design", credits: 3, grade: "B+" },
        { name: "Programming Language", credits: 3, grade: "A" },
      ]
    },
    {
      number: 3, name: "Semester 3", year: "Year 2 - Fall", completed: false, inProgress: true,
      courses: [
        { name: "Object Oriented Programming", credits: 3, grade: null },
        { name: "Introduction to Database Systems", credits: 3, grade: null },
        { name: "Mathematics-3", credits: 3, grade: null },
        { name: "Computer Networks Technology", credits: 3, grade: null },
        { name: "Probability and Statistics-2", credits: 3, grade: null },
        { name: "Introduction to Software Engineering", credits: 3, grade: null },
      ]
    },
    {
      number: 4, name: "Semester 4", year: "Year 2 - Spring", completed: false,
      courses: [
        { name: "Introduction to Operation Research", credits: 3, grade: null },
        { name: "Data Structure", credits: 3, grade: null },
        { name: "Machine Learning Fundamentals", credits: 3, grade: null },
        { name: "Web Technology", credits: 3, grade: null },
        { name: "Entrepreneurship", credits: 2, grade: null },
        { name: "Networking Fundamentals Lab", credits: 2, grade: null },
      ]
    },
    {
      number: 5, name: "Semester 5", year: "Year 3 - Fall", completed: false,
      courses: [
        { name: "Network Routing and Switching-Lab", credits: 2, grade: null },
        { name: "Artificial Intelligence", credits: 3, grade: null },
        { name: "Operating Systems", credits: 3, grade: null },
        { name: "Digital Signal Processing", credits: 3, grade: null },
        { name: "Computer Organization", credits: 3, grade: null },
        { name: "Algorithms Analysis and Design", credits: 3, grade: null },
      ]
    },
    {
      number: 6, name: "Semester 6", year: "Year 3 - Spring", completed: false,
      courses: [
        { name: "Pattern Recognition", credits: 3, grade: null },
        { name: "Information Computer Networks Security", credits: 3, grade: null },
        { name: "Natural Language Processing", credits: 3, grade: null },
        { name: "Advanced Software Engineering", credits: 3, grade: null },
        { name: "Microcontroller", credits: 3, grade: null },
        { name: "Ethical Hacking-Lab", credits: 2, grade: null },
      ]
    },
    {
      number: 7, name: "Semester 7", year: "Year 4 - Fall", completed: false,
      courses: [
        { name: "Selected Labs in Software Engineering", credits: 2, grade: null },
        { name: "Embedded Systems", credits: 3, grade: null },
        { name: "Computer Graphics", credits: 3, grade: null },
        { name: "Advanced Computer Networks", credits: 3, grade: null },
        { name: "Project (1)", credits: 3, grade: null },
        { name: "Communication Technology", credits: 3, grade: null },
      ]
    },
    {
      number: 8, name: "Semester 8", year: "Year 4 - Spring", completed: false,
      courses: [
        { name: "Cloud Computing Networking", credits: 3, grade: null },
        { name: "Semantic Web and Ontology", credits: 3, grade: null },
        { name: "Wireless and Mobile Networks", credits: 3, grade: null },
        { name: "Fundamental of Management", credits: 2, grade: null },
        { name: "Project (2)", credits: 4, grade: null },
        { name: "Selected Labs in AI", credits: 2, grade: null },
      ]
    },
  ];

  const totalCredits = semesters.reduce((sum, sem) =>
    sum + sem.courses.reduce((courseSum, course) => courseSum + course.credits, 0), 0
  );
  const completedCredits = semesters
    .filter(sem => sem.completed)
    .reduce((sum, sem) => sum + sem.courses.reduce((cs, c) => cs + c.credits, 0), 0);
  const completionPercentage = (completedCredits / totalCredits) * 100;

  return (
    <div className="space-y-6">

      {/* ── Page Header ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        className="flex flex-col items-center justify-center text-center gap-4 mb-4"
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center shadow-2xl mb-2">
            <Map className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-0">Academic Roadmap</h1>
            <p className="text-base text-gray-500 mt-1 max-w-md mx-auto">Visualize your academic journey and master your course dependencies with intelligence</p>
          </div>
        </div>
        <Badge className="bg-[#2563EB] text-white px-6 py-2 shadow-lg shadow-blue-500/20">
          <GraduationCap className="w-4 h-4 mr-2" />
          CS Bachelor Program
        </Badge>
      </motion.div>

      {/* ── Tab Switcher ────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="flex justify-center w-full mb-6"
      >
        <div className="inline-flex items-center gap-0 p-1.5 bg-gray-100 rounded-2xl border border-gray-200 shadow-inner">
          {([
            { id: "roadmap", label: "Academic Roadmap", Icon: Map },
            { id: "catalog", label: "Course Catalog",   Icon: BookOpen },
            { id: "graph",   label: "Dependency Graph", Icon: Network },
          ] as const).map(({ id, label, Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                style={{ position: "relative" }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold cursor-pointer border-0 transition-colors duration-200 outline-none"
              >
                {/* Sliding background pill — always in DOM so layoutId works */}
                {isActive && (
                  <motion.span
                    layoutId="roadmap-tab-pill"
                    style={{
                      position: "absolute", inset: 0, borderRadius: 10, zIndex: 0,
                      background: "linear-gradient(135deg, #2563EB, #6d28d9)",
                      boxShadow: "0 2px 12px rgba(37,99,235,0.35)",
                    }}
                    transition={{ type: "spring", stiffness: 420, damping: 32 }}
                  />
                )}
                {/* Icon + label always above the pill */}
                <span style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 6, color: isActive ? "#fff" : "#6b7280" }}>
                  <Icon style={{ width: 14, height: 14, flexShrink: 0 }} />
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </motion.div>


      {/* ── Tab Content ─────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">

        {/* ══ ROADMAP TAB ════════════════════════════════════════════════ */}
        {activeTab === "roadmap" && (
          <motion.div
            key="roadmap"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
            className="space-y-6"
          >
            {/* Progress card */}
            <Card className="border-none shadow-md bg-gradient-to-r from-[#2563EB] to-[#1e40af] text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-sm text-blue-100 mb-1">Overall Progress</div>
                    <div className="text-white">{completedCredits} / {totalCredits} Credits Completed</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-blue-100 mb-1">Completion Rate</div>
                    <div className="text-white">{Math.round(completionPercentage)}%</div>
                  </div>
                </div>
                <div className="w-full h-3 bg-blue-900/30 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full transition-all" style={{ width: `${completionPercentage}%` }} />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                  <div><div className="text-blue-100">Completed</div><div className="text-white">{semesters.filter(s => s.completed).length} Semesters</div></div>
                  <div><div className="text-blue-100">In Progress</div><div className="text-white">{semesters.filter(s => s.inProgress).length} Semester</div></div>
                  <div><div className="text-blue-100">Remaining</div><div className="text-white">{semesters.filter(s => !s.completed && !s.inProgress).length} Semesters</div></div>
                </div>
              </CardContent>
            </Card>

            {/* Semester cards grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {semesters.map((semester, index) => {
                const semesterCredits = semester.courses.reduce((sum, course) => sum + course.credits, 0);
                const isLocked = semester.number > currentSemester + 1;
                return (
                  <motion.div
                    key={semester.number}
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.6, delay: index * 0.08, ease: [0.4, 0, 0.2, 1] }}
                    whileHover={{ scale: 1.02, y: -4 }}
                  >
                    <Card className={`border-none shadow-md transition-all ${semester.completed ? "bg-green-50 border-l-4 border-l-green-500"
                      : semester.inProgress ? "bg-blue-50 border-l-4 border-l-[#2563EB]"
                        : isLocked ? "bg-gray-50 border-l-4 border-l-gray-300 opacity-75"
                          : "border-l-4 border-l-gray-400"
                      }`}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              {semester.completed && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                              {semester.inProgress && <Circle className="w-5 h-5 text-[#2563EB] fill-[#2563EB]" />}
                              {isLocked && <Lock className="w-5 h-5 text-gray-400" />}
                              {!semester.completed && !semester.inProgress && !isLocked && <Circle className="w-5 h-5 text-gray-400" />}
                              <span className={semester.completed ? "text-green-900" : semester.inProgress ? "text-[#2563EB]" : "text-gray-900"}>
                                {semester.name}
                              </span>
                            </CardTitle>
                            <CardDescription className={semester.completed ? "text-green-700" : semester.inProgress ? "text-blue-700" : "text-gray-600"}>
                              {semester.year} • {semesterCredits} Credits
                            </CardDescription>
                          </div>
                          {semester.completed && <Badge className="bg-green-600 text-white">Completed</Badge>}
                          {semester.inProgress && <Badge className="bg-[#2563EB] text-white">In Progress</Badge>}
                          {isLocked && <Badge className="bg-gray-400 text-white">Locked</Badge>}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {semester.courses.map((course, idx) => (
                            <div key={idx} className={`p-3 rounded-lg transition-all ${semester.completed ? "bg-white border border-green-200 hover:border-green-300"
                              : semester.inProgress ? "bg-white border border-blue-200 hover:border-blue-300"
                                : "bg-white border border-gray-200 hover:border-gray-300"
                              }`}>
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <div className="text-sm text-gray-900">{course.name}</div>
                                    {prerequisites[course.name] && (
                                      <Button
                                        variant="ghost" size="sm"
                                        className="h-5 px-2 text-xs text-[#2563EB] hover:text-[#1d4ed8]"
                                        onClick={() => setSelectedCourse(selectedCourse === course.name ? null : course.name)}
                                      >
                                        <Info className="w-3 h-3 mr-1" />
                                        Unlocks {prerequisites[course.name].length}
                                      </Button>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">{course.credits} Credits</div>
                                </div>
                                {course.grade && (
                                  <Badge variant="outline" className={`
                                    ${course.grade.startsWith("A") ? "border-green-300 text-green-700 bg-green-50" : ""}
                                    ${course.grade.startsWith("B") ? "border-blue-300 text-blue-700 bg-blue-50" : ""}
                                    ${course.grade.startsWith("C") ? "border-yellow-300 text-yellow-700 bg-yellow-50" : ""}
                                  `}>Grade: {course.grade}</Badge>
                                )}
                                {semester.inProgress && (
                                  <Badge variant="outline" className="border-blue-300 text-blue-700">Current</Badge>
                                )}
                              </div>

                              {/* Unlock popout */}
                              <AnimatePresence>
                                {selectedCourse === course.name && prerequisites[course.name] && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                                    className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg overflow-hidden"
                                  >
                                    <div className="flex items-center gap-2 mb-2">
                                      <ArrowRight className="w-4 h-4 text-[#2563EB]" />
                                      <div className="text-xs text-gray-900">This course unlocks:</div>
                                    </div>
                                    <div className="space-y-1 ml-6">
                                      {prerequisites[course.name].map((uc, i) => (
                                        <motion.div
                                          key={i}
                                          initial={{ opacity: 0, x: -12 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          transition={{ delay: 0.15 + i * 0.05 }}
                                          className="text-xs text-gray-700 flex items-center gap-1.5"
                                        >
                                          <div className="w-1 h-1 rounded-full bg-[#2563EB] shrink-0" />
                                          {uc}
                                        </motion.div>
                                      ))}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {/* Legend */}
            <Card className="border-none shadow-md">
              <CardHeader><CardTitle>Legend</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { icon: <CheckCircle2 className="w-5 h-5 text-green-600" />, label: "Completed" },
                    { icon: <Circle className="w-5 h-5 text-[#2563EB] fill-[#2563EB]" />, label: "In Progress" },
                    { icon: <Circle className="w-5 h-5 text-gray-400" />, label: "Upcoming" },
                    { icon: <Lock className="w-5 h-5 text-gray-400" />, label: "Locked" },
                  ].map(({ icon, label }) => (
                    <div key={label} className="flex items-center gap-2">
                      {icon}
                      <span className="text-sm text-gray-700">{label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ══ COURSE CATALOG TAB ══════════════════════════════════════════ */}
        {activeTab === "catalog" && (
          <motion.div
            key="catalog"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
          >
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-500" />
                  Full Course Catalog
                </CardTitle>
                <CardDescription>{ENRICHED_CATALOG.length} courses · {CURRENT_TERM} Semester</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        {["ID", "Name", "CH", "Year", "Prerequisites", "Available Terms", "Blocks"].map(h => (
                          <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {ENRICHED_CATALOG.map((c, i) => (
                        <motion.tr
                          key={c.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            delay: i * 0.02,
                            duration: 0.28,
                            ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
                          }}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="py-2 px-3 font-mono text-xs font-semibold text-indigo-600">{c.id}</td>
                          <td className="py-2 px-3 font-medium text-gray-800 max-w-[200px]">{c.name}</td>
                          <td className="py-2 px-3 text-center">
                            <Badge variant="outline" className="text-xs">{c.credits}</Badge>
                          </td>
                          <td className="py-2 px-3 text-center">
                            <Badge variant="outline" className="text-xs border-purple-200 text-purple-700">Y{c.yearLevel}</Badge>
                          </td>
                          <td className="py-2 px-3 max-w-[180px]">
                            {c.prerequisites.length === 0
                              ? <span className="text-gray-300 text-xs italic">None</span>
                              : <span className="text-xs text-gray-500">{c.prerequisites.join(", ")}</span>
                            }
                          </td>
                          <td className="py-2 px-3 text-xs text-gray-500">{c.availableTerms.join(", ")}</td>
                          <td className="py-2 px-3 text-center">
                            <span className={`text-xs font-bold ${(c.dependencyCount ?? 0) >= 3 ? "text-red-600"
                              : (c.dependencyCount ?? 0) >= 1 ? "text-orange-500"
                                : "text-gray-400"
                              }`}>
                              {c.dependencyCount ?? 0}
                            </span>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ══ DEPENDENCY GRAPH TAB ══════════════════════════════════════════ */}
        {activeTab === "graph" && (
          <motion.div
            key="graph"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
          >
            <PrerequisiteGraph
              catalog={ENRICHED_CATALOG}
              student={ROADMAP_STUDENT}
              currentTerm={CURRENT_TERM}
            />
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
