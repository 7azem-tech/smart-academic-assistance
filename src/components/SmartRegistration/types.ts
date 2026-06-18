import { StudentProfile, Course, RecommendedCourse, RegistrationPlan, Term } from "../../services/registrationEngine";

export interface StudentSelectorProps {
  students: StudentProfile[];
  studentIndex: number;
  onStudentChange: (index: number) => void;
  onGeneratePlan: () => void;
  onReset: () => void;
  phase: "idle" | "generating" | "plan" | "confirmed";
  registeredCount: number;
  passedCount: number;
  failedCount: number;
  progressPct: number;
  totalCourses: number;
  student: StudentProfile;
  catalog: Course[];
}

export interface RegistrationPlannerProps {
  plan: RegistrationPlan | null;
  checkedIds: Set<string>;
  onToggleCheck: (courseId: string) => void;
  onConfirm: () => void;
  onReset: () => void;
  phase: "idle" | "generating" | "plan" | "confirmed";
  confirmedCourses: RecommendedCourse[];
  student: StudentProfile;
  catalog: Course[];
}

export interface CourseCatalogProps {
  catalog: Course[];
  currentTerm: Term;
}

export interface AcademicHistoryProps {
  student: StudentProfile;
  catalog: Course[];
  currentTerm: Term;
}
