import { useMemo } from "react";
import { motion } from "motion/react";
import { CheckCircle2, XCircle, GraduationCap, Info, Calendar, Award, Check, AlertTriangle, HelpCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Badge } from "../ui/badge";
import { StudentProfile, Course } from "../../services/registrationEngine";

export function AcademicHistory({
  student,
  catalog,
  currentTerm
}: {
  student: StudentProfile;
  catalog: Course[];
  currentTerm: string;
}) {

  // Calculate overall metrics
  const totalCredits = useMemo(() => catalog.reduce((s, c) => s + c.credits, 0), [catalog]);
  
  const passedCredits = useMemo(() => {
    return catalog
      .filter(c => student.passed.includes(c.id))
      .reduce((s, c) => s + c.credits, 0);
  }, [catalog, student.passed]);

  const registeredCredits = useMemo(() => {
    return catalog
      .filter(c => student.registered.includes(c.id))
      .reduce((s, c) => s + c.credits, 0);
  }, [catalog, student.registered]);

  // Group all courses by semester (1 to 8)
  const semesterModules = useMemo(() => {
    const semesters: Record<number, Course[]> = {};
    for (let s = 1; s <= 8; s++) {
      semesters[s] = [];
    }
    catalog.forEach(c => {
      if (c.semester >= 1 && c.semester <= 8) {
        semesters[c.semester].push(c);
      }
    });
    return semesters;
  }, [catalog]);

  // Determine completion stats for each semester
  const getSemesterProgress = (semCourses: Course[]) => {
    const total = semCourses.length;
    const passed = semCourses.filter(c => student.passed.includes(c.id)).length;
    const registered = semCourses.filter(c => student.registered.includes(c.id)).length;
    const failed = semCourses.filter(c => student.failed.includes(c.id)).length;
    
    return {
      total,
      passed,
      registered,
      failed,
      isFullyCompleted: passed === total && total > 0
    };
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Overall Progress Header Widget */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Passed Credits summary */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-250 dark:border-emerald-900/40 bg-emerald-50/10 dark:bg-emerald-950/5 p-4 flex items-center gap-4 shadow-xs">
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
            <Award className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-450 uppercase tracking-widest block">Completed Credits</span>
            <div className="text-xl font-black text-gray-900 dark:text-white font-mono leading-none">
              {passedCredits} <span className="text-xs font-semibold text-gray-400">/ {totalCredits} CH</span>
            </div>
          </div>
        </div>

        {/* Failed Blocks check */}
        <div className="relative overflow-hidden rounded-2xl border border-rose-250 dark:border-rose-900/40 bg-rose-50/10 dark:bg-rose-950/5 p-4 flex items-center gap-4 shadow-xs">
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-455 border border-rose-100/50 dark:border-rose-900/30">
            <XCircle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <span className="text-[8px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest block">Path Failures</span>
            <div className="text-xl font-black text-gray-900 dark:text-white font-mono leading-none">
              {student.failed.length} <span className="text-xs font-semibold text-gray-400">Blocked Node{student.failed.length !== 1 ? "s" : ""}</span>
            </div>
          </div>
        </div>

        {/* Registered Load summary */}
        <div className="relative overflow-hidden rounded-2xl border border-sky-250 dark:border-sky-900/40 bg-sky-50/10 dark:bg-sky-950/5 p-4 flex items-center gap-4 shadow-xs">
          <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-900/30">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <span className="text-[8px] font-black text-sky-600 dark:text-sky-400 uppercase tracking-widest block">Staged Load</span>
            <div className="text-xl font-black text-gray-900 dark:text-white font-mono leading-none">
              {registeredCredits} <span className="text-xs font-semibold text-gray-400">CH Enrolling</span>
            </div>
          </div>
        </div>

      </div>

      {/* 2. Semester Timeline Roadmap Grid */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-200/50 dark:border-gray-800/80 bg-white/60 dark:bg-gray-950/65 backdrop-blur-lg p-5 shadow-md">
        
        {/* Dynamic header title */}
        <div className="flex items-center gap-2 pb-3 mb-5 border-b border-gray-200 dark:border-gray-850">
          <Calendar className="w-4.5 h-4.5 text-indigo-500" />
          <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Curriculum Semester Progression Roadmap
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(s => {
            const courses = semesterModules[s] || [];
            const progress = getSemesterProgress(courses);
            
            return (
              <motion.div
                key={s}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: s * 0.04 }}
                className={`flex flex-col p-4 rounded-2xl border relative ${
                  progress.isFullyCompleted
                    ? "bg-emerald-500/5 dark:bg-emerald-950/5 border-emerald-300 dark:border-emerald-900/40"
                    : progress.failed > 0
                      ? "bg-rose-500/5 dark:bg-rose-950/5 border-rose-300 dark:border-rose-900/40"
                      : progress.registered > 0
                        ? "bg-sky-500/5 dark:bg-sky-950/5 border-sky-300 dark:border-sky-900/40"
                        : "bg-gray-50/50 dark:bg-gray-950/20 border-gray-200 dark:border-gray-850"
                }`}
              >
                
                {/* Visual state line header */}
                <div className={`absolute top-0 left-0 right-0 h-[1.5px] rounded-t-2xl ${
                  progress.isFullyCompleted 
                    ? "bg-emerald-500" 
                    : progress.failed > 0 
                      ? "bg-rose-500" 
                      : progress.registered > 0 
                        ? "bg-sky-500" 
                        : "bg-gray-300 dark:bg-gray-700"
                }`} />

                {/* Card title with check nodes */}
                <div className="flex items-center justify-between mb-3 mt-1">
                  <span className="text-xs font-black text-gray-900 dark:text-white">Semester {s}</span>
                  <div className="flex items-center gap-1.5">
                    {progress.isFullyCompleted ? (
                      <span className="p-0.5 rounded-full bg-emerald-500 text-white shadow-sm" title="Semester Completed">
                        <Check className="w-2.5 h-2.5 stroke-[3.5px]" />
                      </span>
                    ) : progress.failed > 0 ? (
                      <span className="p-0.5 rounded-full bg-rose-500 text-white animate-pulse" title="Prerequisite Blockage Alert">
                        <AlertTriangle className="w-2.5 h-2.5" />
                      </span>
                    ) : null}
                    <span className="text-[9px] font-mono text-gray-400 font-bold">
                      {progress.passed}/{progress.total}
                    </span>
                  </div>
                </div>

                {/* Course List nodes inside Semester block */}
                <div className="flex-1 space-y-2">
                  {courses.map(c => {
                    const isPassed = student.passed.includes(c.id);
                    const isFailed = student.failed.includes(c.id);
                    const isRegistered = student.registered.includes(c.id);
                    
                    return (
                      <div 
                        key={c.id} 
                        className={`p-2 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                          isPassed 
                            ? "bg-white dark:bg-gray-950 border-emerald-200 dark:border-emerald-950/60 shadow-xs" 
                            : isFailed 
                              ? "bg-white dark:bg-gray-950 border-rose-200 dark:border-rose-950/60 shadow-xs"
                              : isRegistered 
                                ? "bg-white dark:bg-gray-950 border-sky-200 dark:border-sky-950/60 shadow-xs"
                                : "bg-white/80 dark:bg-gray-950/30 border-gray-200/60 dark:border-gray-800/40 text-gray-500"
                        }`}
                      >
                        <div className="flex flex-col min-w-0">
                          <span className={`font-mono text-[8px] font-extrabold ${
                            isPassed 
                              ? "text-emerald-600 dark:text-emerald-400" 
                              : isFailed 
                                ? "text-rose-600 dark:text-rose-455" 
                                : isRegistered 
                                  ? "text-sky-655 dark:text-sky-400" 
                                  : "text-gray-400"
                          }`}>
                            {c.id}
                          </span>
                          <span className="text-[9px] font-bold text-gray-850 dark:text-gray-250 truncate max-w-[110px]" title={c.name}>
                            {c.name}
                          </span>
                        </div>

                        {/* Status label chips */}
                        {isPassed ? (
                          <Badge className="bg-emerald-500/10 border-emerald-500/20 text-emerald-600 text-[7px] font-black px-1 py-0 shadow-xs">PASSED</Badge>
                        ) : isFailed ? (
                          <Badge className="bg-rose-500/10 border-rose-500/20 text-rose-600 text-[7px] font-black px-1 py-0 shadow-xs">FAILED</Badge>
                        ) : isRegistered ? (
                          <Badge className="bg-sky-500/10 border-sky-500/20 text-sky-600 text-[7px] font-black px-1 py-0 shadow-xs animate-pulse">STAGED</Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-400 border-gray-200 dark:border-gray-800 text-[7px] font-black px-1 py-0 border-dashed">PENDING</Badge>
                        )}
                      </div>
                    );
                  })}
                </div>

              </motion.div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
