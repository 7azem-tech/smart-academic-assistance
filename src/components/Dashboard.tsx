import { memo, useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, Calendar, CheckCircle2, MessageSquare, AlertCircle, Target, TrendingUp, Award, BookOpen, Clock, BarChart3, Sparkles, ChevronRight, Activity, Star, Trophy, Megaphone } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Separator } from "./ui/separator";
import { adminService, Announcement } from "../services/adminService"; // Import service
import { useAuth } from "../contexts/AuthContext";

interface DashboardProps {
  onNavigate: (screen: string) => void;
}

export const Dashboard = memo(function Dashboard({ onNavigate }: DashboardProps) {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    // Load announcements from adminService
    setAnnouncements(adminService.getAnnouncements());

    // Optional: Poll for updates or just load once
    const interval = setInterval(() => {
      const latest = adminService.getAnnouncements();
      setAnnouncements(prev => {
        if (latest.length !== prev.length) {
          return latest;
        }
        return prev;
      });
    }, 5000); // Check every 5 seconds for simulation

    return () => clearInterval(interval);
  }, []);

  const upcomingDeadlines = [
    { title: "Quiz: CS101", course: "Object Oriented Programming", dueDate: "Tomorrow at 10:00 AM", urgency: "high", daysLeft: "1 Day Left", type: "quiz" },
    { title: "Assignment: MATH204", course: "Mathematics-3", dueDate: "Oct 30 at 11:59 PM", urgency: "medium", daysLeft: "2 Days Left", type: "assignment" },
    { title: "Midterm: DB301", course: "Database Systems", dueDate: "Nov 2 at 9:00 AM", urgency: "medium", daysLeft: "5 Days Left", type: "exam" },
    { title: "Project Submission", course: "Software Engineering", dueDate: "Nov 5 at 11:59 PM", urgency: "low", daysLeft: "8 Days Left", type: "project" },
  ];

  const courses = [
    { code: "CS101", name: "Object Oriented Programming", status: "active", progress: 78 },
    { code: "MATH204", name: "Mathematics-3", status: "active", progress: 82 },
    { code: "DB301", name: "Database Systems", status: "active", progress: 71 },
    { code: "SE202", name: "Software Engineering", status: "active", progress: 85 },
  ];

  const insights = [
    {
      title: "Strong Performance",
      description: "Your grades have improved by 12% this semester. Keep up the momentum!",
      icon: TrendingUp,
      color: "green"
    },
    {
      title: "On Track",
      description: "You're progressing well toward your graduation timeline",
      icon: Target,
      color: "blue"
    },
    {
      title: "Registration Ready",
      description: "Your course plan unlocks 14 courses for future semesters",
      icon: Sparkles,
      color: "purple"
    }
  ];

  const creditsCompleted = 102;
  const totalCredits = 134;
  const progressPercentage = (creditsCompleted / totalCredits) * 100;
  const currentGPA = 3.65;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        className="relative"
      >
        <Card className="border-none shadow-2xl bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#334155] text-white relative overflow-hidden">
          {/* Optimized static background patterns - removed infinite animations for performance */}
          <div
            className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDEzNGgxMnYxMkgzNnptMjQgMGgxMnYxMkg2MHptLTI0LTI0aDEydjEySDM2em0yNCAwaDEydjEySDYwem0tMjQgNDhoMTJ2MTJIMzZ6bTI0IDBoMTJ2MTJINjB6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"
          />
          <div
            className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#2563EB]/20 to-transparent rounded-full blur-3xl"
          />
          <div
            className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-[#7C3AED]/20 to-transparent rounded-full blur-3xl"
          />
          <CardContent className="p-8 relative z-10">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex-1">
                <motion.div
                  className="flex items-center gap-3 mb-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <div
                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] backdrop-blur-sm flex items-center justify-center border-2 border-white/20 shadow-2xl"
                    style={{ boxShadow: "0 0 30px rgba(37, 99, 235, 0.4)" }}
                  >
                    <span className="text-white text-2xl">👋</span>
                  </div>
                  <div>
                    <motion.div
                      className="flex items-center gap-2 mb-1"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <span className="text-sm text-gray-300">Welcome Back</span>
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-green-500/20 rounded-full border border-green-400/30">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
                        <span className="text-xs text-green-300">System Active</span>
                      </div>
                    </motion.div>
                    <h1 className="text-white mb-0">{user ? `${user.firstName} ${user.lastName}` : "Student"}</h1>
                    <div className="text-sm text-gray-400 mt-1">Student ID: {user?.universityId || "N/A"}</div>
                  </div>
                </motion.div>
                <motion.div
                  className="flex items-start gap-3 pl-1"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <div className="w-1 h-16 bg-gradient-to-b from-[#2563EB] to-[#7C3AED] rounded-full shadow-lg"></div>
                  <div>
                    <p className="text-gray-200 text-lg mb-2">Your Smart Academic Dashboard</p>
                    <div className="flex items-center gap-4 text-sm text-gray-300 flex-wrap">
                      <span>Semester 3, Year 2</span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Trophy className="w-4 h-4 text-yellow-400" />
                        <span>GPA: {currentGPA}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
              <motion.div
                className="flex flex-col gap-3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <div className="flex gap-2">
                  {/* Live Announcements Badge */}
                  {announcements.length > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="bg-amber-500/20 text-amber-300 px-4 py-2 rounded-lg border border-amber-500/30 flex items-center gap-2"
                    >
                      <Megaphone className="w-4 h-4 animate-bounce" />
                      <span className="text-sm font-medium">{announcements.length} New Update{announcements.length > 1 ? 's' : ''}</span>
                    </motion.div>
                  )}
                </div>

                <motion.div
                  className="bg-gradient-to-br from-[#10B981] via-[#059669] to-[#047857] px-6 py-4 rounded-xl shadow-2xl border border-white/20 backdrop-blur-sm relative overflow-hidden group cursor-pointer"
                  whileHover={{ scale: 1.05, y: -2 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-5 h-5 text-white" />
                      <span className="text-xs text-emerald-100">Registration Period</span>
                    </div>
                    <div className="text-white mb-2 flex items-center gap-2">
                      <span className="text-xl">🎓</span>
                      <span>Registration is Open</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-emerald-100">
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
                        <span>Nov 1 - Nov 15</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Announcements Section (if any) */}
      {announcements.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="border-l-4 border-l-amber-500 shadow-md">
            <CardHeader className="py-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-amber-500" />
                Latest Announcements
              </CardTitle>
            </CardHeader>
            <CardContent className="py-3 grid gap-4">
              {announcements.slice(0, 2).map(ann => (
                <div key={ann.id} className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                  <h4 className="font-bold text-gray-800">{ann.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{ann.content}</p>
                  <span className="text-xs text-gray-400 mt-2 block">{ann.date}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Insights Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {insights.map((insight, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              duration: 0.5,
              delay: 0.1 + index * 0.1,
              ease: [0.4, 0, 0.2, 1]
            }}
            whileHover={{ scale: 1.03, y: -4 }}
          >
            <Card className={`border-none shadow-lg hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden ${insight.color === 'green' ? 'bg-gradient-to-br from-green-50 to-emerald-50' :
              insight.color === 'blue' ? 'bg-gradient-to-br from-blue-50 to-indigo-50' :
                'bg-gradient-to-br from-purple-50 to-violet-50'
              }`}>
              <motion.div
                className={`absolute top-0 left-0 w-1 h-full ${insight.color === 'green' ? 'bg-gradient-to-b from-green-500 to-emerald-600' :
                  insight.color === 'blue' ? 'bg-gradient-to-b from-blue-500 to-indigo-600' :
                    'bg-gradient-to-b from-purple-500 to-violet-600'
                  }`}
                initial={{ height: 0 }}
                animate={{ height: "100%" }}
                transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
              />
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <motion.div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${insight.color === 'green' ? 'bg-green-200' :
                      insight.color === 'blue' ? 'bg-blue-200' :
                        'bg-purple-200'
                      }`}
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <insight.icon className={`w-5 h-5 ${insight.color === 'green' ? 'text-green-700' :
                      insight.color === 'blue' ? 'text-blue-700' :
                        'text-purple-700'
                      }`} />
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-900 mb-1">{insight.title}</div>
                    <div className="text-xs text-gray-600 leading-relaxed">{insight.description}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Academic Performance - Large */}
        <motion.div
          className="lg:col-span-2 space-y-6"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* Performance Overview */}
          <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <motion.div
                    className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center shadow-lg"
                    whileHover={{ rotate: 180 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Activity className="w-5 h-5 text-white" />
                  </motion.div>
                  Academic Performance
                </CardTitle>
              </div>
              <CardDescription>Track your progress and achievements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* GPA Progress Circle */}
                <div className="flex flex-col items-center">
                  <div className="relative w-40 h-40 mb-4">
                    <svg className="w-40 h-40 transform -rotate-90">
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="#E5E7EB"
                        strokeWidth="10"
                        fill="none"
                      />
                      <motion.circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="url(#gpagradient)"
                        strokeWidth="10"
                        fill="none"
                        initial={{ strokeDasharray: "0 440" }}
                        animate={{ strokeDasharray: `${(currentGPA / 4.0) * 440} 440` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        strokeLinecap="round"
                      />
                      <defs>
                        <linearGradient id="gpagradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#2563EB" />
                          <stop offset="100%" stopColor="#7C3AED" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <motion.div
                      className="absolute inset-0 flex flex-col items-center justify-center"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.6, delay: 0.3 }}
                    >
                      <div className="text-3xl text-gray-900">{currentGPA}</div>
                      <div className="text-xs text-gray-500">Current GPA</div>
                    </motion.div>
                  </div>
                </div>

                {/* Credits Progress */}
                <div className="flex flex-col items-center">
                  <div className="relative w-40 h-40 mb-4">
                    <svg className="w-40 h-40 transform -rotate-90">
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="#E5E7EB"
                        strokeWidth="10"
                        fill="none"
                      />
                      <motion.circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="url(#creditsgradient)"
                        strokeWidth="10"
                        fill="none"
                        initial={{ strokeDasharray: "0 440" }}
                        animate={{ strokeDasharray: `${progressPercentage * 4.4} 440` }}
                        transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                        strokeLinecap="round"
                      />
                      <defs>
                        <linearGradient id="creditsgradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#10B981" />
                          <stop offset="100%" stopColor="#059669" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <motion.div
                      className="absolute inset-0 flex flex-col items-center justify-center"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.6, delay: 0.5 }}
                    >
                      <div className="text-3xl text-gray-900">{creditsCompleted}</div>
                      <div className="text-xs text-gray-500">of {totalCredits} Credits</div>
                    </motion.div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Award className="w-4 h-4 text-[#D4AF37]" />
                      <span className="text-sm text-gray-600">Completion Progress:</span>
                    </div>
                    <div className="text-2xl text-[#2563EB]">{Math.round(progressPercentage)}%</div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "This Semester", value: "15 Cr", color: "blue" },
                  { label: "Semesters Left", value: "4", color: "purple" },
                  { label: "Graduation", value: "Spring 2026", color: "green" },
                  { label: "Track Status", value: "On Time", color: "amber" }
                ].map((metric, index) => (
                  <motion.div
                    key={index}
                    className={`p-3 bg-gradient-to-br rounded-lg border ${metric.color === 'blue' ? 'from-blue-50 to-indigo-50 border-blue-100' :
                      metric.color === 'purple' ? 'from-purple-50 to-violet-50 border-purple-100' :
                        metric.color === 'green' ? 'from-green-50 to-emerald-50 border-green-100' :
                          'from-amber-50 to-yellow-50 border-amber-100'
                      }`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                  >
                    <div className="text-xs text-gray-600 mb-1">{metric.label}</div>
                    <div className={`${metric.label === "Graduation" || metric.label === "Track Status" ? "text-sm text-green-700" : "text-xl text-gray-900"}`}>
                      {metric.value}
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <Button
                  onClick={() => onNavigate("registration")}
                  className="w-full bg-gradient-to-r from-[#2563EB] to-[#7C3AED] hover:from-[#1d4ed8] hover:to-[#6d28d9] text-white shadow-lg group"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Academic Roadmap
                  <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>
            </CardContent>
          </Card>

          {/* Course Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5, ease: [0.4, 0, 0.2, 1] }}
          >
            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <motion.div
                      className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-yellow-600 flex items-center justify-center shadow-lg"
                      whileHover={{ rotate: 180 }}
                      transition={{ duration: 0.5 }}
                    >
                      <BookOpen className="w-5 h-5 text-white" />
                    </motion.div>
                    Current Courses
                  </CardTitle>
                </div>
                <CardDescription>Your active courses this semester</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {courses.map((course, index) => (
                    <motion.div
                      key={course.code}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
                      whileHover={{ x: 5, scale: 1.02 }}
                      className="p-4 border border-gray-200 rounded-lg hover:border-[#2563EB] hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="text-gray-900">{course.code}</div>
                          </div>
                          <div className="text-sm text-gray-500">{course.name}</div>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                          <span>Course Progress</span>
                          <span>{course.progress}%</span>
                        </div>
                        <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${course.progress}%` }}
                            transition={{ duration: 1, delay: 0.9 + index * 0.15 }}
                            className={`h-full rounded-full ${course.progress >= 80 ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
                              course.progress >= 70 ? 'bg-gradient-to-r from-blue-500 to-indigo-600' :
                                'bg-gradient-to-r from-yellow-500 to-orange-600'
                              }`}
                          ></motion.div>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-3">
                        <motion.div className="flex-1" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            onClick={() => onNavigate("lms")}
                            size="sm"
                            variant="outline"
                            className="w-full border-[#2563EB] text-[#2563EB] hover:bg-[#2563EB] hover:text-white text-xs"
                          >
                            View Course
                          </Button>
                        </motion.div>
                        <motion.div className="flex-1" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            onClick={() => onNavigate("courses")}
                            size="sm"
                            variant="outline"
                            className="w-full border-purple-500 text-purple-600 hover:bg-purple-600 hover:text-white text-xs"
                          >
                            <MessageSquare className="w-3 h-3 mr-1" />
                            Chat
                          </Button>
                        </motion.div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Right Column - Deadlines */}
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* Upcoming Deadlines Widget */}
          <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-white" />
                  </div>
                  What's Next
                </CardTitle>
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onNavigate("alerts")}
                    className="text-[#2563EB] hover:text-[#1d4ed8]"
                  >
                    View All
                  </Button>
                </motion.div>
              </div>
              <CardDescription>Upcoming deadlines and events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingDeadlines.slice(0, 4).map((deadline, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 1 + index * 0.1 }}
                    whileHover={{ x: 5, scale: 1.02 }}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-all cursor-pointer border border-gray-100 hover:border-gray-300 group"
                  >
                    <motion.div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${deadline.urgency === 'high' ? 'bg-red-100' :
                        deadline.urgency === 'medium' ? 'bg-yellow-100' : 'bg-green-100'
                        }`}
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      {deadline.type === 'quiz' && <AlertCircle className={`w-4 h-4 ${deadline.urgency === 'high' ? 'text-red-600' :
                        deadline.urgency === 'medium' ? 'text-yellow-600' : 'text-green-600'
                        }`} />}
                      {deadline.type === 'assignment' && <BookOpen className={`w-4 h-4 ${deadline.urgency === 'high' ? 'text-red-600' :
                        deadline.urgency === 'medium' ? 'text-yellow-600' : 'text-green-600'
                        }`} />}
                      {deadline.type === 'exam' && <Target className={`w-4 h-4 ${deadline.urgency === 'high' ? 'text-red-600' :
                        deadline.urgency === 'medium' ? 'text-yellow-600' : 'text-green-600'
                        }`} />}
                      {deadline.type === 'project' && <Star className={`w-4 h-4 ${deadline.urgency === 'high' ? 'text-red-600' :
                        deadline.urgency === 'medium' ? 'text-yellow-600' : 'text-green-600'
                        }`} />}
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-900 truncate">{deadline.title}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{deadline.course}</div>
                      <div className="text-xs text-gray-400 mt-1">{deadline.dueDate}</div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs ${deadline.urgency === 'high' ? 'border-red-300 text-red-700 bg-red-50' :
                        deadline.urgency === 'medium' ? 'border-yellow-300 text-yellow-700 bg-yellow-50' :
                          'border-green-300 text-green-700 bg-green-50'
                        }`}
                    >
                      {deadline.daysLeft}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#2563EB]" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { label: "Ask Course Chatbot", icon: MessageSquare, screen: "courses", color: "purple" },
                  { label: "View Academic Roadmap", icon: BarChart3, screen: "roadmap", color: "blue" },
                  { label: "Update Settings", icon: Target, screen: "settings", color: "gray" }
                ].map((action, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 1.3 + index * 0.1 }}
                    whileHover={{ x: 5, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      onClick={() => onNavigate(action.screen)}
                      variant="outline"
                      className={`w-full justify-start ${action.color === 'purple' ? 'border-purple-200 hover:bg-purple-50' :
                        action.color === 'blue' ? 'border-blue-200 hover:bg-blue-50' :
                          'border-gray-200 hover:bg-gray-50'
                        } group`}
                    >
                      <action.icon className={`w-4 h-4 mr-2 ${action.color === 'purple' ? 'text-purple-600' :
                        action.color === 'blue' ? 'text-blue-600' :
                          'text-gray-600'
                        }`} />
                      <span>{action.label}</span>
                      <ChevronRight className="w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
});
