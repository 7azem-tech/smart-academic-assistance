import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BookOpen, Search, Filter, Layers, LayoutGrid, List, ChevronRight, Unlock, HelpCircle, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Badge } from "../ui/badge";

export function CourseCatalog({ catalog, currentTerm }: { catalog: any[]; currentTerm: string }) {
  const [search, setSearch] = useState("");
  const [semesterFilter, setSemesterFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredCatalog = useMemo(() => {
    return catalog.filter(c => {
      const matchesSearch = 
        c.name.toLowerCase().includes(search.toLowerCase()) || 
        c.id.toLowerCase().includes(search.toLowerCase());
      
      const matchesSemester = semesterFilter === "all" || c.semester.toString() === semesterFilter;

      return matchesSearch && matchesSemester;
    });
  }, [catalog, search, semesterFilter]);

  const toggleExpand = (courseId: string) => {
    setExpandedId(prev => (prev === courseId ? null : courseId));
  };

  return (
    <Card className="border border-gray-200/50 dark:border-gray-800/80 bg-white/60 dark:bg-gray-950/65 backdrop-blur-lg shadow-xl rounded-2xl overflow-hidden">
      {/* Dynamic branding header */}
      <CardHeader className="pb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1">
            <CardTitle className="text-gray-900 dark:text-white font-black flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 text-[#2563EB] dark:text-indigo-400 border border-blue-100/50 dark:border-blue-900/20">
                <BookOpen className="w-5 h-5 animate-pulse" />
              </div>
              Curriculum Exploration Center
            </CardTitle>
            <CardDescription className="text-gray-450 dark:text-gray-500 font-semibold mt-1">
              Search and filter {catalog.length} cataloged courses for the current {currentTerm} academic term.
            </CardDescription>
          </div>

          {/* Action consoles */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            
            {/* Layout view toggle */}
            <div className="flex bg-gray-100 dark:bg-gray-900 rounded-xl p-1 border border-gray-200 dark:border-gray-800 shrink-0">
              <button 
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg cursor-pointer transition-all duration-200 ${viewMode === "grid" ? "bg-white dark:bg-gray-800 shadow-sm text-blue-600 dark:text-white" : "text-gray-400"}`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-lg cursor-pointer transition-all duration-200 ${viewMode === "table" ? "bg-white dark:bg-gray-800 shadow-sm text-blue-600 dark:text-white" : "text-gray-400"}`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input bar */}
            <div className="relative w-full md:w-56 group">
              <Search className="w-4 h-4 text-gray-455 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                placeholder="Search catalog ID/name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200/80 rounded-xl text-xs font-extrabold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-55/40 hover:bg-gray-55 focus:bg-white transition-all shadow-inner"
              />
            </div>

          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        
        {/* Semester Filter Pill Navigation */}
        <div className="space-y-2">
          <div className="text-[9px] font-black text-gray-400 dark:text-gray-555 uppercase tracking-widest pl-1">
            Curriculum Semesters Selection
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 max-w-full">
            <button
              onClick={() => setSemesterFilter("all")}
              className={`px-4 py-1.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer shrink-0 ${
                semesterFilter === "all"
                  ? "bg-blue-600 text-white border-transparent shadow-md shadow-blue-600/10"
                  : "bg-gray-55/60 dark:bg-gray-900/50 text-gray-500 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
              }`}
            >
              All Semesters
            </button>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
              <button
                key={s}
                onClick={() => setSemesterFilter(s.toString())}
                className={`px-4 py-1.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer shrink-0 ${
                  semesterFilter === s.toString()
                    ? "bg-blue-600 text-white border-transparent shadow-md shadow-blue-600/10"
                    : "bg-gray-55/60 dark:bg-gray-900/50 text-gray-500 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
                }`}
              >
                Semester {s}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic content area */}
        <AnimatePresence mode="wait">
          {filteredCatalog.length > 0 ? (
            viewMode === "grid" ? (
              
              // ── 1. Modern Interactive Course Node Grid ──
              <motion.div
                key="grid-view"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[480px] overflow-y-auto no-scrollbar pr-1"
              >
                {filteredCatalog.map((c, i) => {
                  const isExpanded = expandedId === c.id;
                  const weightPct = Math.min((c.dependencyCount / 5) * 100, 100);
                  
                  return (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: Math.min(i * 0.02, 0.2) }}
                      onClick={() => toggleExpand(c.id)}
                      className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer text-left ${
                        isExpanded 
                          ? "bg-blue-500/5 dark:bg-blue-950/10 border-blue-400 dark:border-blue-900/60 shadow-md"
                          : "bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-850 hover:border-gray-300 dark:hover:border-gray-800 hover:shadow-sm"
                      }`}
                    >
                      {/* Top Header info */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-mono text-[9px] font-black text-[#2563EB] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-900/30">
                          {c.id}
                        </span>
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="border-indigo-100 dark:border-indigo-900/50 text-[#2563EB] dark:text-indigo-400 bg-indigo-50/10 dark:bg-indigo-950/10 text-[8px] font-bold">
                            Sem {c.semester}
                          </Badge>
                          <Badge variant="outline" className="border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 bg-gray-55/50 dark:bg-gray-900/30 text-[8px] font-bold">
                            {c.credits} CH
                          </Badge>
                        </div>
                      </div>

                      {/* Course Title */}
                      <h4 className="text-xs font-black text-gray-900 dark:text-white truncate mb-3 group-hover:text-blue-600 transition-colors">
                        {c.name}
                      </h4>

                      {/* Dependency Weight telemetry */}
                      <div className="space-y-1 mb-2.5">
                        <div className="flex justify-between items-center text-[8px] font-black text-gray-450 uppercase tracking-wider">
                          <span>Curriculum Blockage Impact</span>
                          <span className={`${c.dependencyCount >= 3 ? "text-rose-500" : c.dependencyCount >= 1 ? "text-amber-500" : "text-gray-400"}`}>
                            {c.dependencyCount} Paths
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-900 rounded-full overflow-hidden border border-gray-200/30 dark:border-gray-800/50">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              c.dependencyCount >= 3 
                                ? "bg-rose-500" 
                                : c.dependencyCount >= 1 
                                  ? "bg-amber-500" 
                                  : "bg-blue-500"
                            }`}
                            style={{ width: `${weightPct}%` }}
                          />
                        </div>
                      </div>

                      {/* Expanded description block */}
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden"
                          >
                            <div className="pt-2 border-t border-gray-150 dark:border-gray-850/80 space-y-3">
                              <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed font-semibold">
                                Professional curriculum module covering the core domains, theoretical constructs, and computational methodologies of {c.name}.
                              </p>
                              
                              {/* Prerequisites nodes listing */}
                              <div className="space-y-1">
                                <span className="text-[8px] font-black text-gray-400 dark:text-gray-550 uppercase tracking-widest flex items-center gap-1">
                                  <Unlock className="w-3 h-3 text-emerald-500" />
                                  Course Prerequisite Path
                                </span>
                                {c.prerequisites.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {c.prerequisites.map((pId: string) => (
                                      <Badge 
                                        key={pId} 
                                        variant="outline" 
                                        className="text-[8px] font-bold font-mono px-1 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-405"
                                      >
                                        {pId}
                                      </Badge>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-[9px] text-gray-400 dark:text-gray-500 italic font-semibold pl-0.5">No prerequisite gates required.</span>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Indicator arrow */}
                      <div className="flex justify-end pt-1 mt-1 text-[8px] font-bold text-gray-400 dark:text-gray-500 items-center gap-0.5 border-t border-gray-100 dark:border-gray-900">
                        <span>{isExpanded ? "Collapse Details" : "Expand Module"}</span>
                        <ChevronRight className={`w-3 h-3 transform transition-transform duration-300 ${isExpanded ? "rotate-90 text-blue-500" : ""}`} />
                      </div>

                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              
              // ── 2. Telemetry List View (Highly Polished Table) ──
              <motion.div
                key="table-view"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-xl shadow-inner max-h-[480px] overflow-y-auto no-scrollbar"
              >
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60 backdrop-blur-md sticky top-0 z-10">
                      <th className="py-3 px-4 text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Course ID</th>
                      <th className="py-3 px-4 text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Subject Title</th>
                      <th className="py-3 px-4 text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest text-center">Semester</th>
                      <th className="py-3 px-4 text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest text-center">Credits</th>
                      <th className="py-3 px-4 text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Prerequisites</th>
                      <th className="py-3 px-4 text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest text-center">Block Impact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-850 bg-card">
                    {filteredCatalog.map((c, i) => (
                      <tr 
                        key={c.id}
                        className="hover:bg-gray-50/50 dark:hover:bg-gray-900/40 transition-colors group text-xs text-card-foreground"
                      >
                        <td className="py-3 px-4 font-mono font-black text-[#2563EB] dark:text-blue-400">{c.id}</td>
                        <td className="py-3 px-4 font-black text-gray-900 dark:text-white max-w-[200px] truncate">{c.name}</td>
                        
                        <td className="py-3 px-4 text-center">
                          <Badge variant="outline" className="border-indigo-100 dark:border-indigo-900/50 text-[#2563EB] dark:text-indigo-400 bg-indigo-50/10 dark:bg-indigo-950/20 text-[9px] font-bold">
                            S{c.semester}
                          </Badge>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <Badge variant="outline" className="border-gray-250 dark:border-gray-800 text-gray-500 dark:text-gray-450 bg-gray-55/50 dark:bg-gray-900/30 font-mono text-[9px] font-bold">
                            {c.credits}
                          </Badge>
                        </td>

                        <td className="py-3 px-4 max-w-[200px] truncate">
                          {c.prerequisites.length === 0 ? (
                            <span className="text-gray-400 dark:text-gray-555 font-semibold italic text-[10px]">None</span>
                          ) : (
                            <div className="flex gap-1 overflow-hidden truncate">
                              {c.prerequisites.map((p: string) => (
                                <span key={p} className="text-[9px] font-bold font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-1 py-0.2 rounded border border-gray-200/50 dark:border-gray-700/50">
                                  {p}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4 text-center font-mono">
                          <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black border ${
                            c.dependencyCount >= 3 
                              ? "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-100/50 dark:border-rose-900/30" 
                              : c.dependencyCount >= 1 
                                ? "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-100/50 dark:border-amber-900/30" 
                                : "bg-gray-50 dark:bg-gray-900/30 text-gray-400 dark:text-gray-500 border border-gray-150 dark:border-gray-800"
                          }`}>
                            {c.dependencyCount} courses
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            )
          ) : (
            <motion.div
              key="empty-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-16 text-center text-gray-450 dark:text-gray-500 font-semibold text-xs border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl"
            >
              <HelpCircle className="w-8 h-8 mx-auto mb-2.5 opacity-30 text-gray-500" />
              No matching courses found in catalog filters.
            </motion.div>
          )}
        </AnimatePresence>

      </CardContent>
    </Card>
  );
}
