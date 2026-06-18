/**
 * Smart Registration Engine
 * -------------------------
 * Self-contained registration logic module.
 * All business rules are numbered and commented to map directly to the spec.
 * Swap the mock data imports for real API calls with minimal changes.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type Term = "Fall" | "Spring" | "Summer";

export interface Course {
  id: string;
  name: string;
  credits: number;
  prerequisites: string[]; // Array of course IDs
  availableTerms: Term[];
  yearLevel: number;
  semester: number; // 1 to 8
  /** Computed at runtime — number of courses that list this as a prerequisite */
  dependencyCount?: number;
}

export type CourseStatus = "passed" | "failed" | "registered" | "none";

export interface StudentProfile {
  id: string;
  name: string;
  level: number;
  passed: string[];   // Course IDs the student has PASSED
  failed: string[];   // Course IDs the student has FAILED
  registered: string[]; // Course IDs currently registered (will be populated at runtime)
  /** Per-student term overrides — used to simulate MATH2 unavailability for Student C */
  unavailableOverrides?: string[];
}

export interface RecommendedCourse {
  course: Course;
  isChecked: boolean;
  badge: "Critical retake" | "On-track" | "Prerequisite unlock";
  reason: string;
  priority: number;
}

export interface UnavailableCourse {
  course: Course;
  reason: string;
}

export interface RegistrationPlan {
  recommended: RecommendedCourse[];
  unavailable: UnavailableCourse[];
  totalCredits: number;
  warnings: string[];
  upcomingSemester: number;
}

// ─── Course Catalog (Single Source of Truth) ──────────────────────────────────
// Derived from the Academic Roadmap tab data. This is the canonical reference.

export const COURSE_CATALOG: Course[] = [
  // Year 1 — Semester 1
  { id: "MATH1",   name: "Mathematics-1",              credits: 3, prerequisites: [],                    availableTerms: ["Fall","Spring"], yearLevel: 1, semester: 1 },
  { id: "CS101",   name: "Introduction to Computers",  credits: 3, prerequisites: [],                    availableTerms: ["Fall","Spring"], yearLevel: 1, semester: 1 },
  { id: "ELEC101", name: "Electronics",                credits: 3, prerequisites: [],                    availableTerms: ["Fall","Spring"], yearLevel: 1, semester: 1 },
  { id: "TRW101",  name: "Technical Report Writing",   credits: 2, prerequisites: [],                    availableTerms: ["Fall","Spring"], yearLevel: 1, semester: 1 },
  { id: "HR101",   name: "Human Rights",               credits: 2, prerequisites: [],                    availableTerms: ["Fall","Spring"], yearLevel: 1, semester: 1 },
  { id: "DM101",   name: "Discrete Math",              credits: 3, prerequisites: [],                    availableTerms: ["Fall","Spring"], yearLevel: 1, semester: 1 },

  // Year 1 — Semester 2
  { id: "MATH2",   name: "Mathematics-2",              credits: 3, prerequisites: ["MATH1"],             availableTerms: ["Fall","Spring"], yearLevel: 1, semester: 2 },
  { id: "STAT1",   name: "Probability and Statistics-1", credits: 3, prerequisites: ["MATH1"],           availableTerms: ["Fall","Spring"], yearLevel: 1, semester: 2 },
  { id: "CST101",  name: "Creative and Scientific Thinking", credits: 2, prerequisites: [],             availableTerms: ["Fall","Spring"], yearLevel: 1, semester: 2 },
  { id: "ECON101", name: "Micro Economics",            credits: 2, prerequisites: [],                    availableTerms: ["Fall","Spring"], yearLevel: 1, semester: 2 },
  { id: "LD101",   name: "Logic Design",               credits: 3, prerequisites: ["ELEC101"],           availableTerms: ["Fall","Spring"], yearLevel: 1, semester: 2 },
  { id: "PL101",   name: "Programming Language",       credits: 3, prerequisites: ["CS101"],             availableTerms: ["Fall","Spring"], yearLevel: 1, semester: 2 },

  // Year 2 — Semester 3
  { id: "OOP201",  name: "Object Oriented Programming",     credits: 3, prerequisites: ["PL101"],        availableTerms: ["Fall","Spring"], yearLevel: 2, semester: 3 },
  { id: "DB201",   name: "Introduction to Database Systems", credits: 3, prerequisites: ["PL101"],       availableTerms: ["Fall","Spring"], yearLevel: 2, semester: 3 },
  { id: "MATH3",   name: "Mathematics-3",              credits: 3, prerequisites: ["MATH2"],             availableTerms: ["Fall","Spring"], yearLevel: 2, semester: 3 },
  { id: "NET201",  name: "Computer Networks Technology", credits: 3, prerequisites: ["CS101"],           availableTerms: ["Fall","Spring"], yearLevel: 2, semester: 3 },
  { id: "STAT2",   name: "Probability and Statistics-2", credits: 3, prerequisites: ["STAT1"],           availableTerms: ["Fall","Spring"], yearLevel: 2, semester: 3 },
  { id: "SE201",   name: "Introduction to Software Engineering", credits: 3, prerequisites: ["PL101"],   availableTerms: ["Fall","Spring"], yearLevel: 2, semester: 3 },

  // Year 2 — Semester 4
  { id: "OR201",   name: "Introduction to Operation Research", credits: 3, prerequisites: ["STAT1","PL101"], availableTerms: ["Fall","Spring"], yearLevel: 2, semester: 4 },
  { id: "DS201",   name: "Data Structure",             credits: 3, prerequisites: ["OOP201"],            availableTerms: ["Fall","Spring"], yearLevel: 2, semester: 4 },
  { id: "ML201",   name: "Machine Learning Fundamentals", credits: 3, prerequisites: ["MATH3","STAT2"],  availableTerms: ["Fall","Spring"], yearLevel: 2, semester: 4 },
  { id: "WT201",   name: "Web Technology",             credits: 3, prerequisites: ["PL101"],             availableTerms: ["Fall","Spring"], yearLevel: 2, semester: 4 },
  { id: "ENT201",  name: "Entrepreneurship",           credits: 2, prerequisites: [],                    availableTerms: ["Fall","Spring"], yearLevel: 2, semester: 4 },
  { id: "NFL201",  name: "Networking Fundamentals Lab", credits: 2, prerequisites: ["NET201"],           availableTerms: ["Fall","Spring"], yearLevel: 2, semester: 4 },

  // Year 3 — Semester 5
  { id: "NRS301",  name: "Network Routing and Switching-Lab", credits: 2, prerequisites: ["NET201"],    availableTerms: ["Fall","Spring"], yearLevel: 3, semester: 5 },
  { id: "AI301",   name: "Artificial Intelligence",    credits: 3, prerequisites: ["DS201"],             availableTerms: ["Fall","Spring"], yearLevel: 3, semester: 5 },
  { id: "OS301",   name: "Operating Systems",          credits: 3, prerequisites: ["DS201"],             availableTerms: ["Fall","Spring"], yearLevel: 3, semester: 5 },
  { id: "DSP301",  name: "Digital Signal Processing",  credits: 3, prerequisites: ["MATH3"],             availableTerms: ["Fall","Spring"], yearLevel: 3, semester: 5 },
  { id: "CO301",   name: "Computer Organization",      credits: 3, prerequisites: ["DS201"],             availableTerms: ["Fall","Spring"], yearLevel: 3, semester: 5 },
  { id: "AAD301",  name: "Algorithms Analysis and Design", credits: 3, prerequisites: ["DS201"],         availableTerms: ["Fall","Spring"], yearLevel: 3, semester: 5 },

  // Year 3 — Semester 6
  { id: "PR301",   name: "Pattern Recognition",        credits: 3, prerequisites: ["DSP301"],            availableTerms: ["Fall","Spring"], yearLevel: 3, semester: 6 },
  { id: "SEC301",  name: "Information Computer Networks Security", credits: 3, prerequisites: ["NET201"], availableTerms: ["Fall","Spring"], yearLevel: 3, semester: 6 },
  { id: "NLP301",  name: "Natural Language Processing", credits: 3, prerequisites: ["ML201"],            availableTerms: ["Fall","Spring"], yearLevel: 3, semester: 6 },
  { id: "ASE301",  name: "Advanced Software Engineering", credits: 3, prerequisites: ["SE201"],          availableTerms: ["Fall","Spring"], yearLevel: 3, semester: 6 },
  { id: "MC301",   name: "Microcontroller",            credits: 3, prerequisites: ["NET201"],            availableTerms: ["Fall","Spring"], yearLevel: 3, semester: 6 },
  { id: "EHL301",  name: "Ethical Hacking-Lab",        credits: 2, prerequisites: ["NET201"],            availableTerms: ["Fall","Spring"], yearLevel: 3, semester: 6 },

  // Year 4 — Semester 7
  { id: "LSE401",  name: "Selected Labs in Software Engineering", credits: 2, prerequisites: ["SE201","ASE301"], availableTerms: ["Fall","Spring"], yearLevel: 4, semester: 7 },
  { id: "ES401",   name: "Embedded Systems",           credits: 3, prerequisites: ["MC301"],             availableTerms: ["Fall","Spring"], yearLevel: 4, semester: 7 },
  { id: "CG401",   name: "Computer Graphics",          credits: 3, prerequisites: ["DS201"],             availableTerms: ["Fall","Spring"], yearLevel: 4, semester: 7 },
  { id: "ACN401",  name: "Advanced Computer Networks", credits: 3, prerequisites: ["NET201"],            availableTerms: ["Fall","Spring"], yearLevel: 4, semester: 7 },
  { id: "PRJ401",  name: "Project (1)",                credits: 3, prerequisites: ["SE201"],             availableTerms: ["Fall","Spring"], yearLevel: 4, semester: 7 },
  { id: "CT401",   name: "Communication Technology",   credits: 3, prerequisites: ["NET201"],            availableTerms: ["Fall","Spring"], yearLevel: 4, semester: 7 },

  // Year 4 — Semester 8
  { id: "CCN401",  name: "Cloud Computing Networking", credits: 3, prerequisites: ["ACN401"],            availableTerms: ["Fall","Spring"], yearLevel: 4, semester: 8 },
  { id: "SWO401",  name: "Semantic Web and Ontology",  credits: 3, prerequisites: ["WT201"],             availableTerms: ["Fall","Spring"], yearLevel: 4, semester: 8 },
  { id: "WMN401",  name: "Wireless and Mobile Networks", credits: 3, prerequisites: ["ACN401"],          availableTerms: ["Fall","Spring"], yearLevel: 4, semester: 8 },
  { id: "FM401",   name: "Fundamental of Management",  credits: 2, prerequisites: [],                    availableTerms: ["Fall","Spring"], yearLevel: 4, semester: 8 },
  { id: "PRJ402",  name: "Project (2)",                credits: 4, prerequisites: ["PRJ401"],            availableTerms: ["Fall","Spring"], yearLevel: 4, semester: 8 },
  { id: "LAI401",  name: "Selected Labs in AI",        credits: 2, prerequisites: ["AI301"],             availableTerms: ["Fall","Spring"], yearLevel: 4, semester: 8 },
];

// ─── Student Profiles (Mock Data) ────────────────────────────────────────────

export const STUDENT_PROFILES: StudentProfile[] = [
  {
    id: "STU-A",
    name: "Ahmed Hassan",
    level: 3,
    // Passed: All of Semester 1 + 2 + partial Semester 3
    passed: [
      "MATH1","CS101","ELEC101","TRW101","HR101","DM101",  // Sem 1
      "MATH2","STAT1","CST101","ECON101","LD101","PL101",  // Sem 2
      "OOP201","DB201","NET201","STAT2","SE201",            // Sem 3 (no MATH3 yet)
    ],
    failed: [],
    registered: [],
  },
  {
    id: "STU-B",
    name: "Sara Khalil",
    level: 3,
    // Has failed MATH2 — which IS available in Fall
    passed: [
      "MATH1","CS101","ELEC101","TRW101","HR101","DM101",
      "STAT1","CST101","ECON101","LD101","PL101",
      "OOP201","DB201","NET201","SE201",
    ],
    failed: ["MATH2"],
    registered: [],
  },
  {
    id: "STU-C",
    name: "Omar Fathy",
    level: 3,
    // Has failed MATH2 — which is NOT available this term for this student
    passed: [
      "MATH1","CS101","ELEC101","TRW101","HR101","DM101",
      "STAT1","CST101","ECON101","LD101","PL101",
      "OOP201","DB201","NET201","STAT2","SE201",
    ],
    failed: ["MATH2"],
    registered: [],
    unavailableOverrides: ["MATH2"], // Simulates MATH2 not being offered this term
  },
];

// ─── Current Term ────────────────────────────────────────────────────────────

export const CURRENT_TERM: Term = "Fall";
export const MAX_CREDITS = 18;

// ─── Utility: Compute Dependency Counts ─────────────────────────────────────

/**
 * For each course, count how many OTHER courses list it as a prerequisite.
 * Higher = more courses blocked if this course is not passed.
 */
export function computeDependencyCounts(catalog: Course[]): Record<string, number> {
  const counts: Record<string, number> = {};
  catalog.forEach(c => { counts[c.id] = 0; });

  catalog.forEach(course => {
    course.prerequisites.forEach(prereqId => {
      if (counts[prereqId] !== undefined) {
        counts[prereqId]++;
      }
    });
  });
  return counts;
}

/**
 * Return a new catalog with dependencyCount populated.
 */
export function enrichCatalog(catalog: Course[]): Course[] {
  const counts = computeDependencyCounts(catalog);
  return catalog.map(c => ({ ...c, dependencyCount: counts[c.id] ?? 0 }));
}

// ─── Utility: Effective Availability ─────────────────────────────────────────

/**
 * A course is available if it is offered this term AND not in the student's unavailableOverrides.
 */
export function isCourseAvailable(
  course: Course,
  currentTerm: Term,
  student: StudentProfile,
): boolean {
  const notInOverride = !(student.unavailableOverrides ?? []).includes(course.id);
  const offeredThisTerm = course.availableTerms.includes(currentTerm);
  return offeredThisTerm && notInOverride;
}

// ─── Registration Engine ─────────────────────────────────────────────────────

/**
 * generateRegistrationPlan
 * ─────────────────────────
 * Produces a RegistrationPlan for the given student using the 6 rules in the spec.
 *
 * @param student   The student profile (passed/failed/registered arrays)
 * @param catalog   Enriched course catalog (with dependencyCount populated)
 * @param term      The current academic term
 */
export function generateRegistrationPlan(
  student: StudentProfile,
  catalog: Course[],
  term: Term,
): RegistrationPlan {
  // Destructure for brevity
  const passed = new Set(student.passed);
  const failed = new Set(student.failed);
  const registered = new Set(student.registered);

  // Find S_min: lowest semester containing any course the student has not yet passed
  const unpassedCourses = catalog.filter(c => !passed.has(c.id));
  const minUnpassedSemester = unpassedCourses.length > 0
    ? Math.min(...unpassedCourses.map(c => c.semester))
    : 8;
  
  // Only suggest courses for the upcoming semester (S_min and S_min + 1)
  const maxAllowedSemester = Math.min(minUnpassedSemester + 1, 8);

  const plan: RegistrationPlan = {
    recommended: [],
    unavailable: [],
    totalCredits: 0,
    warnings: [],
    upcomingSemester: minUnpassedSemester,
  };

  // ── Helper: Rule 1 — Prerequisite enforcement ───────────────────────────
  // Prerequisites are checked ONLY against the passed set — never failed/registered.
  function prereqsMet(course: Course): boolean {
    return course.prerequisites.every(prereqId => passed.has(prereqId));
  }

  // ── Helper: Rule 5 — Basic eligibility check ────────────────────────────
  // A course must: have all prereqs, not be already passed, not already registered,
  // not already in the plan, and not already failed unless we explicitly want retakes.
  function isEligible(course: Course, allowFailed = false): boolean {
    if (passed.has(course.id)) return false;        // Already passed
    if (registered.has(course.id)) return false;    // Already registered
    if (plan.recommended.some(r => r.course.id === course.id)) return false; // Already in plan
    if (!allowFailed && failed.has(course.id)) return false; // Not a retake slot
    if (!prereqsMet(course)) return false;          // Prerequisites not met
    return true;
  }

  // ── Helper: add to plan if credits allow ───────────────────────────────
  function addToPlan(rec: RecommendedCourse): boolean {
    // Rule 5 — Never exceed 18 credit hours
    if (plan.totalCredits + rec.course.credits > MAX_CREDITS) return false;
    plan.recommended.push(rec);
    plan.totalCredits += rec.course.credits;
    return true;
  }

  // ── Rule 2 — Failed course prioritization ──────────────────────────────
  // Sort failed courses by dependencyCount DESC (most blocking = highest priority).
  // Restricted to semesters <= maxAllowedSemester.
  const failedCourses = catalog
    .filter(c => failed.has(c.id) && c.semester <= maxAllowedSemester)
    .sort((a, b) => (b.dependencyCount ?? 0) - (a.dependencyCount ?? 0));

  for (const course of failedCourses) {
    const available = isCourseAvailable(course, term, student);

    if (!available) {
      // ── Rule 3 — Availability fallback ─────────────────────────────────
      // If failed critical-path course is NOT offered this term, put it in unavailable section.
      plan.unavailable.push({
        course,
        reason: `"${course.name}" is not offered in ${term} semester. ` +
          `It will be available in: ${course.availableTerms.filter(t => t !== term).join(", ")}. ` +
          `Slots have been filled with the next best eligible courses.`,
      });
      plan.warnings.push(
        `⚠️ You failed "${course.name}" which blocks ${course.dependencyCount} course(s), ` +
        `but it is not offered this term. Alternative courses have been selected.`
      );
      continue; // Skip — Rule 3 says fill slot with alternatives
    }

    if (!prereqsMet(course)) {
      // Prerequisites themselves are not passed — course is locked
      const missing = course.prerequisites.filter(p => !passed.has(p));
      const missingNames = missing
        .map(id => catalog.find(c => c.id === id)?.name ?? id)
        .join(", ");
      plan.unavailable.push({
        course,
        reason: `Cannot retake — missing prerequisite(s): ${missingNames}.`,
      });
      continue;
    }

    // Eligible for retake
    const depCount = course.dependencyCount ?? 0;
    addToPlan({
      course,
      isChecked: true,
      badge: "Critical retake",
      reason:
        `Failed course — retaking. ` +
        `This course blocks ${depCount} future course${depCount !== 1 ? "s" : ""} if not passed. ` +
        `${depCount >= 3 ? "High priority critical-path subject." : depCount >= 1 ? "Important prerequisite." : ""}`.trim(),
      priority: 1000 + (depCount * 10),
    });
  }

  // ── Rule 4 — Standard path (no failures) or fill remaining slots ────────
  // Courses ordered by yearLevel ASC then dependencyCount DESC.
  // Restricted to semesters <= maxAllowedSemester.
  const standardCourses = catalog
    .filter(c => !failed.has(c.id) && c.semester <= maxAllowedSemester)
    .sort((a, b) => {
      if (a.yearLevel !== b.yearLevel) return a.yearLevel - b.yearLevel;
      return (b.dependencyCount ?? 0) - (a.dependencyCount ?? 0);
    });

  for (const course of standardCourses) {
    if (plan.totalCredits >= MAX_CREDITS) break;

    if (!isEligible(course)) continue;
    if (!isCourseAvailable(course, term, student)) continue;

    const depCount = course.dependencyCount ?? 0;
    const isFillingFallbackSlot = plan.unavailable.length > 0;

    addToPlan({
      course,
      isChecked: true,
      badge: depCount >= 2 ? "Prerequisite unlock" : "On-track",
      reason: isFillingFallbackSlot && plan.unavailable.some(u => u.course.id !== course.id)
        ? `Selected as alternative — a failed critical course is unavailable this term. ` +
          `${depCount > 0 ? `Unlocks ${depCount} future course(s) when passed.` : "On your standard academic path."}`
        : `Standard path — Year ${course.yearLevel} course matching your academic plan. ` +
          `${depCount > 0 ? `Unlocks ${depCount} future course(s) when passed.` : ""}`.trim(),
      priority: 100 - course.yearLevel * 10 + (depCount * 2),
    });
  }

  return plan;
}

/**
 * getLockedCourses
 * ─────────────────
 * Returns all courses that are NOT eligible due to missing prerequisites.
 * Used in the idle state to show what's locked and why.
 */
export function getLockedCourses(student: StudentProfile, catalog: Course[]): Array<{
  course: Course;
  missingPrereqs: string[];
}> {
  const passed = new Set(student.passed);

  return catalog
    .filter(c => {
      if (passed.has(c.id)) return false; // Already passed
      if (student.registered.includes(c.id)) return false;
      return c.prerequisites.some(prereqId => !passed.has(prereqId));
    })
    .map(c => ({
      course: c,
      missingPrereqs: c.prerequisites
        .filter(prereqId => !passed.has(prereqId))
        .map(prereqId => catalog.find(x => x.id === prereqId)?.name ?? prereqId),
    }));
}

/**
 * getUnlockedByPassing
 * ─────────────────────
 * Given a set of newly registered course IDs, return all courses that are now unlocked
 * (i.e., all prereqs met if we assume those new courses will be passed).
 */
export function getUnlockedByPassing(
  newlyPassedIds: string[],
  student: StudentProfile,
  catalog: Course[],
): Course[] {
  const futurePassed = new Set([...student.passed, ...newlyPassedIds]);
  return catalog.filter(c => {
    if (futurePassed.has(c.id)) return false;
    if (student.registered.includes(c.id)) return false;
    return c.prerequisites.length > 0 &&
      c.prerequisites.every(p => futurePassed.has(p)) &&
      !student.passed.includes(c.id);
  });
}
