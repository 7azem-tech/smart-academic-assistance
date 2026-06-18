import { useState, lazy, Suspense, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Login } from "./components/Login";
import { Sidebar } from "./components/Sidebar";
import { Toaster } from "sonner";
import { useAuth } from "./contexts/AuthContext";

// Lazy load components for better performance
const Dashboard = lazy(() => import("./components/Dashboard").then(m => ({ default: m.Dashboard })));

const AcademicRoadmap = lazy(() => import("./components/AcademicRoadmap").then(m => ({ default: m.AcademicRoadmap })));
const SmartRegistrationPage = lazy(() => import("./components/SmartRegistrationPage").then(m => ({ default: m.SmartRegistrationPage })));
const LMS = lazy(() => import("./components/LMS").then(m => ({ default: m.LMS })));
const CoursesChat = lazy(() => import("./components/CoursesChat").then(m => ({ default: m.CoursesChat })));
const Alerts = lazy(() => import("./components/Alerts").then(m => ({ default: m.Alerts })));
const Settings = lazy(() => import("./components/Settings").then(m => ({ default: m.Settings })));
const AdminDashboard = lazy(() => import("./components/AdminDashboard").then(m => ({ default: m.AdminDashboard })));
const QuizDashboard = lazy(() => import("./components/Quiz/QuizDashboard").then(m => ({ default: m.QuizDashboard })));
const SmartAssistantTab = lazy(() => import("./components/SmartAssistantTab").then(m => ({ default: m.SmartAssistantTab })));

export default function App() {
  const [activeScreen, setActiveScreen] = useState<string>("dashboard");
  const { isLoggedIn, userRole, login, logout } = useAuth();

  const handleLogin = (role: string, userId: string) => {
    login(role, userId);
    if (role === 'admin') setActiveScreen('admin');
  };

  const handleLogout = useCallback(() => {
    logout();
    setActiveScreen("dashboard");
  }, [logout]);

  const handleNavigate = useCallback((screen: string) => {
    setActiveScreen(screen);
  }, []);

  const renderScreen = () => {
    switch (activeScreen) {

      case "smartreg":  return <SmartRegistrationPage />;
      case "roadmap":   return <AcademicRoadmap onNavigate={handleNavigate} />;
      case "lms": return <LMS />;
      case "courses": return <CoursesChat />;
      case "assistant": return <SmartAssistantTab studentOnly />;
      case "alerts": return <Alerts />;
      case "settings": return <Settings />;
      case "admin": return <AdminDashboard />;
      case "quiz": return <QuizDashboard />;
      case "dashboard":
      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  if (!isLoggedIn) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <Toaster />
        <Login onLogin={handleLogin} />
      </motion.div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-[#F9FAFB]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <Toaster />
      {/* Screen Reader Live Region */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        id="screen-reader-announcements"
      >
        {activeScreen && `Navigated to ${activeScreen} page`}
      </div>

      {/* Fixed Sidebar */}
      <Sidebar activeScreen={activeScreen} onNavigate={handleNavigate} onLogout={handleLogout} userRole={userRole} />

      {/* Main Content Area */}
      <div className="ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeScreen}
              initial={{ opacity: 0, y: 8, scale: 0.99, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, scale: 0.99, filter: "blur(4px)" }}
              transition={{
                duration: 0.35,
                ease: [0.22, 1, 0.36, 1]
              }}
            >
              <Suspense fallback={
                <div className="flex items-center justify-center min-h-[400px]">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563EB]"></div>
                </div>
              }>
                {renderScreen()}
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
