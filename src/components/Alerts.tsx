import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bell, AlertCircle, CheckCircle2, Clock, Zap, Mail, MessageCircle, Lock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { adminService } from "../services/adminService";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { Switch } from "./ui/switch";

export function Alerts() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [sendingEmailTest, setSendingEmailTest] = useState(false);

  const [settings, setSettings] = useState({
    emailEnabled: true,
    whatsappEnabled: false,
    quizTiming: "1day",
    midtermTiming: "3days",
    finalTiming: "1week",
    projectTiming: "2days",
    assignmentTiming: "1day"
  });

  const [alertTimings, setAlertTimings] = useState({
    quizzes: "1day",
    midterms: "3days",
    finals: "1week",
    projects: "2days",
    assignments: "1day"
  });

  useEffect(() => {
    if (user) {
      syncUserAndLoadSettings();
    }
  }, [user]);

  const syncUserAndLoadSettings = async () => {
    try {
      setLoading(true);
      // 1. Sync user to backend
      if (user) {
        await fetch('http://localhost:3005/api/users/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(user)
        });

        // 2. Load settings
        const response = await fetch(`http://localhost:3005/api/notifications/settings/${user.id}`);
        const data = await response.json();
        if (data && !data.error) {
          setSettings({
            emailEnabled: !!data.emailEnabled,
            whatsappEnabled: !!data.whatsappEnabled,
            quizTiming: data.quizTiming,
            midtermTiming: data.midtermTiming,
            finalTiming: data.finalTiming,
            projectTiming: data.projectTiming,
            assignmentTiming: data.assignmentTiming
          });

          // Sync the UI alertTimings state as well
          setAlertTimings({
            quizzes: data.quizTiming,
            midterms: data.midtermTiming,
            finals: data.finalTiming,
            projects: data.projectTiming,
            assignments: data.assignmentTiming
          });
        }
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: any) => {
    if (!user) return;
    try {
      setUpdating(true);
      const updated = { ...settings, ...newSettings };
      await fetch(`http://localhost:3005/api/notifications/settings/${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      setSettings(updated);

      // Also update alertTimings if they were part of the update
      if (newSettings.quizTiming) setAlertTimings(prev => ({ ...prev, quizzes: newSettings.quizTiming }));
      if (newSettings.midtermTiming) setAlertTimings(prev => ({ ...prev, midterms: newSettings.midtermTiming }));
      if (newSettings.finalTiming) setAlertTimings(prev => ({ ...prev, finals: newSettings.finalTiming }));
      if (newSettings.projectTiming) setAlertTimings(prev => ({ ...prev, projects: newSettings.projectTiming }));
      if (newSettings.assignmentTiming) setAlertTimings(prev => ({ ...prev, assignments: newSettings.assignmentTiming }));

    } catch (error) {
      toast.error("Failed to update settings");
    } finally {
      setUpdating(false);
    }
  };

  const handleSendEmailTest = async () => {
    try {
      setSendingEmailTest(true);
      const response = await fetch('http://localhost:3005/api/notifications/test-email', {
        method: 'POST'
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Test email sent successfully!");
        if (data.previewUrl) {
          const openPreview = confirm("Email sent to Ethereal (Test Inbox). Would you like to view it in your browser?");
          if (openPreview) {
            window.open(data.previewUrl, '_blank');
          }
        }
      } else {
        toast.error("Failed to send test email");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setSendingEmailTest(false);
    }
  };
  const [isSending, setIsSending] = useState(false);

  const handleSendTestWhatsApp = async () => {
    setIsSending(true);
    try {
      const recipient = "+201141229525";

      const message = "Ramadan Kareem";

      const result = await adminService.sendWhatsAppMessage([recipient], message);

      if (result.success) {
        toast.success(`Test message sent successfully to ${recipient}`);
      } else {
        toast.error("Failed to send test message. Try again.");
      }
    } catch (error) {
      toast.error("Failed to send test message. Try again.");
    } finally {
      setIsSending(false);
    }
  };

  const allAlerts = [
    {
      id: 1,
      title: "Quiz: CS101 - Object Oriented Programming",
      description: "Chapter 5-6 Quiz",
      date: "Tomorrow at 10:00 AM",
      type: "quiz",
      priority: "high",
      daysLeft: "1 day left",
      read: false,
    },
    {
      id: 2,
      title: "Assignment: MATH204 - Mathematics-3",
      description: "Problem Set #4",
      date: "Oct 30 at 11:59 PM",
      type: "assignment",
      priority: "medium",
      daysLeft: "2 days left",
      read: false,
    },
    {
      id: 3,
      title: "Midterm Exam: DB301 - Database Systems",
      description: "Chapters 1-5",
      date: "Nov 2 at 9:00 AM",
      type: "exam",
      priority: "medium",
      daysLeft: "5 days left",
      read: true,
    },
    {
      id: 4,
      title: "Registration Reminder",
      description: "Spring 2026 registration closes soon",
      date: "Nov 15",
      type: "system",
      priority: "high",
      daysLeft: "18 days left",
      read: false,
    },
    {
      id: 5,
      title: "Project Submission: SE202",
      description: "Software Engineering Project - Phase 2",
      date: "Nov 5 at 11:59 PM",
      type: "project",
      priority: "low",
      daysLeft: "8 days left",
      read: true,
    },
    {
      id: 6,
      title: "Lab Report: CS101",
      description: "OOP Lab 3 Report Due",
      date: "Nov 1 at 2:00 PM",
      type: "assignment",
      priority: "medium",
      daysLeft: "3 days left",
      read: false,
    },
    {
      id: 7,
      title: "Grade Posted: MATH204",
      description: "Assignment 3 grade is now available",
      date: "Today",
      type: "system",
      priority: "low",
      daysLeft: "Just now",
      read: false,
    },
  ];

  const unreadCount = allAlerts.filter(a => !a.read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        className="relative"
      >
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1">
            <motion.div
              className="flex items-center gap-3 mb-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center shadow-lg">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-gray-900 mb-0">Alerts Center</h1>
                <p className="text-sm text-gray-500 mt-1">Stay updated with important notifications and deadlines</p>
              </div>
            </motion.div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleSendTestWhatsApp}
              disabled={isSending}
              className="group relative overflow-hidden text-white font-semibold shadow-lg hover:shadow-green-500/50 hover:-translate-y-0.5 active:scale-95 transition-all duration-300 flex items-center gap-3 px-6 py-6 rounded-full border-none"
              style={{ background: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)' }}
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              {isSending ? (
                <Loader2 className="w-5 h-5 animate-spin text-white relative z-10" />
              ) : (
                <div className="w-8 h-8 bg-white text-[#22c55e] rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300 relative z-10">
                  <svg viewBox="0 0 448 512" className="w-5 h-5 fill-current">
                    <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.7 17.8 69.4 27.2 106.2 27.2h.1c122.3 0 222-99.6 222-222 0-59.3-23.1-115.1-65.1-157.1zM223.9 446.3c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 365.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 54 81.2 54.1 130.5 0 101.7-82.8 184.4-184.6 184.4zm101.3-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-5.5-2.8-23.4-8.6-44.5-27.4-16.4-14.6-27.5-32.7-30.7-38.2-3.2-5.6-.3-8.6 2.5-11.3 2.5-2.5 5.5-6.5 8.3-9.7 2.8-3.3 3.7-5.6 5.6-9.3 1.8-3.3.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 13.2 5.7 23.5 9.2 31.6 11.8 13.3 4.2 25.4 3.6 35 2.2 10.7-1.5 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
                  </svg>
                </div>
              )}
              <span className="relative z-10 text-base">{isSending ? "Sending..." : "Send WhatsApp Test"}</span>
            </Button>

            <Button
              onClick={handleSendEmailTest}
              disabled={sendingEmailTest}
              className="group relative overflow-hidden text-white font-semibold shadow-lg hover:shadow-blue-500/50 hover:-translate-y-0.5 active:scale-95 transition-all duration-300 flex items-center justify-center gap-3 px-6 py-6 rounded-full border-none"
              style={{ background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)' }}
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              {sendingEmailTest ? (
                <Loader2 className="w-5 h-5 animate-spin text-white relative z-10" />
              ) : (
                <div className="w-8 h-8 bg-white text-[#2563EB] rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300 relative z-10">
                  <Mail className="w-5 h-5" />
                </div>
              )}
              <span className="relative z-10 text-base">{sendingEmailTest ? "Sending..." : "Send Email Test"}</span>
            </Button>
          </div>
        </div>
      </motion.div>
      <div className="flex items-center justify-end">
        <Badge className="bg-[#2563EB] text-white px-4 py-2">
          {unreadCount} Unread
        </Badge>
      </div>

      {/* Notification Channels */}
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle>Notification Channels</CardTitle>
          <CardDescription>Choose how you want to receive alerts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Alerts (Free) */}
          <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-green-600" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-900">Email Alerts</span>
                  <Badge className="bg-green-100 text-green-700 border-green-300">Free</Badge>
                </div>
                <div className="text-xs text-gray-600 mt-1">Receive alerts via email</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-100/50 px-3 py-1.5 rounded-full border border-green-200">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="font-semibold italic">Always Active</span>
              </div>
              <Badge variant="outline" className="text-gray-400 border-gray-200 bg-gray-50 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Mandatory
              </Badge>
            </div>
          </div>

          <Separator />

          {/* WhatsApp Alerts (Premium) */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg">
            <div className="flex items-center gap-3">
              <MessageCircle className="w-5 h-5 text-green-600" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-900">WhatsApp Alerts</span>
                  <Badge className="bg-[#D4AF37] text-white border-none">Premium</Badge>
                </div>
                <div className="text-xs text-gray-600 mt-1">Get instant WhatsApp notifications</div>
              </div>
            </div>
            <Switch
              checked={settings.whatsappEnabled}
              onCheckedChange={(checked: boolean) => updateSettings({ whatsappEnabled: checked })}
              disabled={updating}
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "High Priority", count: allAlerts.filter(a => a.priority === 'high').length, color: "red" },
          { label: "Medium Priority", count: allAlerts.filter(a => a.priority === 'medium').length, color: "yellow" },
          { label: "Low Priority", count: allAlerts.filter(a => a.priority === 'low').length, color: "green" },
          { label: "Total Alerts", count: allAlerts.length, color: "blue" },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 + index * 0.1, ease: [0.4, 0, 0.2, 1] }}
            whileHover={{ scale: 1.05, y: -4 }}
          >
            <Card className={`border-none shadow-sm bg-${stat.color}-50 border-l-4 border-l-${stat.color}-500`}>
              <CardContent className="p-4">
                <div className={`text-sm text-${stat.color}-700 mb-1`}>{stat.label}</div>
                <div className="text-gray-900">{stat.count} Alerts</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Smart Alert Timing Control */}
      <Card className="border-none shadow-md border-l-4 border-l-[#D4AF37]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#D4AF37]" />
            <CardTitle>Smart Alert Timing</CardTitle>
          </div>
          <CardDescription>Customize when you receive notifications for different event types</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Quizzes */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              whileHover={{ scale: 1.02, y: -2 }}
              className="p-4 bg-orange-50 border-2 border-orange-200 rounded-lg"
            >
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                <span className="text-sm text-gray-900">Quizzes</span>
              </div>
              <motion.select
                value={alertTimings.quizzes}
                onChange={(e) => updateSettings({ quizTiming: e.target.value })}
                className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm bg-white cursor-pointer transition-all appearance-none"
                style={{
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23374151\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.75rem center',
                  paddingRight: '2.5rem'
                }}
                initial={{ scale: 1 }}
                whileFocus={{ scale: 1.02 }}
                whileHover={{ scale: 1.01, borderColor: "#fb923c" }}
                transition={{ duration: 0.2 }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(249, 115, 22, 0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <option value="1hour">1 hour before</option>
                <option value="3hours">3 hours before</option>
                <option value="6hours">6 hours before</option>
                <option value="12hours">12 hours before</option>
                <option value="1day">1 day before</option>
                <option value="2days">2 days before</option>
                <option value="3days">3 days before</option>
                <option value="1week">1 week before</option>
              </motion.select>
              <AnimatePresence mode="wait">
                <motion.div
                  key={alertTimings.quizzes}
                  className="mt-2 flex items-center gap-1"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 0.4 }}
                  >
                    <Zap className="w-3 h-3 text-orange-600" />
                  </motion.div>
                  <span className="text-xs text-orange-700">
                    {alertTimings.quizzes === "1hour" && "Last-minute alert"}
                    {alertTimings.quizzes === "3hours" && "Short notice"}
                    {alertTimings.quizzes === "6hours" && "Half-day notice"}
                    {alertTimings.quizzes === "12hours" && "Half-day notice"}
                    {alertTimings.quizzes === "1day" && "One day advance"}
                    {alertTimings.quizzes === "2days" && "Good preparation time"}
                    {alertTimings.quizzes === "3days" && "Ample time to prepare"}
                    {alertTimings.quizzes === "1week" && "Maximum preparation"}
                  </span>
                </motion.div>
              </AnimatePresence>
            </motion.div>

            {/* Midterms */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              whileHover={{ scale: 1.02, y: -2 }}
              className="p-4 bg-red-50 border-2 border-red-200 rounded-lg"
            >
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-sm text-gray-900">Midterms</span>
              </div>
              <motion.select
                value={alertTimings.midterms}
                onChange={(e) => updateSettings({ midtermTiming: e.target.value })}
                className="w-full px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm bg-white appearance-none"
                style={{
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23374151\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.75rem center',
                  paddingRight: '2.5rem'
                }}
                initial={{ scale: 1 }}
                whileFocus={{ scale: 1.02 }}
                whileHover={{ scale: 1.01, borderColor: "#dc2626" }}
                transition={{ duration: 0.2 }}
              >
                <option value="1hour">1 hour before</option>
                <option value="3hours">3 hours before</option>
                <option value="6hours">6 hours before</option>
                <option value="12hours">12 hours before</option>
                <option value="1day">1 day before</option>
                <option value="2days">2 days before</option>
                <option value="3days">3 days before</option>
                <option value="1week">1 week before</option>
              </motion.select>
              <AnimatePresence mode="wait">
                <motion.div
                  key={alertTimings.midterms}
                  className="mt-2 flex items-center gap-1"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 0.4 }}
                  >
                    <Zap className="w-3 h-3 text-red-600" />
                  </motion.div>
                  <span className="text-xs text-red-700">
                    {alertTimings.midterms === "1hour" && "Last-minute alert"}
                    {alertTimings.midterms === "3hours" && "Short notice"}
                    {alertTimings.midterms === "6hours" && "Half-day notice"}
                    {alertTimings.midterms === "12hours" && "Half-day notice"}
                    {alertTimings.midterms === "1day" && "One day advance"}
                    {alertTimings.midterms === "2days" && "Good preparation time"}
                    {alertTimings.midterms === "3days" && "Ample time to prepare"}
                    {alertTimings.midterms === "1week" && "Maximum preparation"}
                  </span>
                </motion.div>
              </AnimatePresence>
            </motion.div>

            {/* Finals */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              whileHover={{ scale: 1.02, y: -2 }}
              className="p-4 bg-purple-50 border-2 border-purple-200 rounded-lg"
            >
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-purple-600" />
                <span className="text-sm text-gray-900">Finals</span>
              </div>
              <motion.select
                value={alertTimings.finals}
                onChange={(e) => updateSettings({ finalTiming: e.target.value })}
                className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm bg-white appearance-none"
                style={{
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23374151\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.75rem center',
                  paddingRight: '2.5rem'
                }}
                initial={{ scale: 1 }}
                whileFocus={{ scale: 1.02 }}
                whileHover={{ scale: 1.01, borderColor: "#9333ea" }}
                transition={{ duration: 0.2 }}
              >
                <option value="1hour">1 hour before</option>
                <option value="3hours">3 hours before</option>
                <option value="6hours">6 hours before</option>
                <option value="12hours">12 hours before</option>
                <option value="1day">1 day before</option>
                <option value="2days">2 days before</option>
                <option value="3days">3 days before</option>
                <option value="1week">1 week before</option>
              </motion.select>
              <AnimatePresence mode="wait">
                <motion.div
                  key={alertTimings.finals}
                  className="mt-2 flex items-center gap-1"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 0.4 }}
                  >
                    <Zap className="w-3 h-3 text-purple-600" />
                  </motion.div>
                  <span className="text-xs text-purple-700">
                    {alertTimings.finals === "1hour" && "Last-minute alert"}
                    {alertTimings.finals === "3hours" && "Short notice"}
                    {alertTimings.finals === "6hours" && "Half-day notice"}
                    {alertTimings.finals === "12hours" && "Half-day notice"}
                    {alertTimings.finals === "1day" && "One day advance"}
                    {alertTimings.finals === "2days" && "Good preparation time"}
                    {alertTimings.finals === "3days" && "Ample time to prepare"}
                    {alertTimings.finals === "1week" && "Maximum preparation"}
                  </span>
                </motion.div>
              </AnimatePresence>
            </motion.div>

            {/* Projects */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              whileHover={{ scale: 1.02, y: -2 }}
              className="p-4 bg-indigo-50 border-2 border-indigo-200 rounded-lg"
            >
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                <span className="text-sm text-gray-900">Projects</span>
              </div>
              <motion.select
                value={alertTimings.projects}
                onChange={(e) => updateSettings({ projectTiming: e.target.value })}
                className="w-full px-3 py-2 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white appearance-none"
                style={{
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23374151\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.75rem center',
                  paddingRight: '2.5rem'
                }}
                initial={{ scale: 1 }}
                whileFocus={{ scale: 1.02 }}
                whileHover={{ scale: 1.01, borderColor: "#6366f1" }}
                transition={{ duration: 0.2 }}
              >
                <option value="1hour">1 hour before</option>
                <option value="3hours">3 hours before</option>
                <option value="6hours">6 hours before</option>
                <option value="12hours">12 hours before</option>
                <option value="1day">1 day before</option>
                <option value="2days">2 days before</option>
                <option value="3days">3 days before</option>
                <option value="1week">1 week before</option>
              </motion.select>
              <AnimatePresence mode="wait">
                <motion.div
                  key={alertTimings.projects}
                  className="mt-2 flex items-center gap-1"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 0.4 }}
                  >
                    <Zap className="w-3 h-3 text-indigo-600" />
                  </motion.div>
                  <span className="text-xs text-indigo-700">
                    {alertTimings.projects === "1hour" && "Last-minute alert"}
                    {alertTimings.projects === "3hours" && "Short notice"}
                    {alertTimings.projects === "6hours" && "Half-day notice"}
                    {alertTimings.projects === "12hours" && "Half-day notice"}
                    {alertTimings.projects === "1day" && "One day advance"}
                    {alertTimings.projects === "2days" && "Good preparation time"}
                    {alertTimings.projects === "3days" && "Ample time to prepare"}
                    {alertTimings.projects === "1week" && "Maximum preparation"}
                  </span>
                </motion.div>
              </AnimatePresence>
            </motion.div>

            {/* Assignments */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
              whileHover={{ scale: 1.02, y: -2 }}
              className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg"
            >
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-gray-900">Assignments</span>
              </div>
              <motion.select
                value={alertTimings.assignments}
                onChange={(e) => updateSettings({ assignmentTiming: e.target.value })}
                className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white appearance-none"
                style={{
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23374151\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.75rem center',
                  paddingRight: '2.5rem'
                }}
                initial={{ scale: 1 }}
                whileFocus={{ scale: 1.02 }}
                whileHover={{ scale: 1.01, borderColor: "#3b82f6" }}
                transition={{ duration: 0.2 }}
              >
                <option value="1hour">1 hour before</option>
                <option value="3hours">3 hours before</option>
                <option value="6hours">6 hours before</option>
                <option value="12hours">12 hours before</option>
                <option value="1day">1 day before</option>
                <option value="2days">2 days before</option>
                <option value="3days">3 days before</option>
                <option value="1week">1 week before</option>
              </motion.select>
              <AnimatePresence mode="wait">
                <motion.div
                  key={alertTimings.assignments}
                  className="mt-2 flex items-center gap-1"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 0.4 }}
                  >
                    <Zap className="w-3 h-3 text-blue-600" />
                  </motion.div>
                  <span className="text-xs text-blue-700">
                    {alertTimings.assignments === "1hour" && "Last-minute alert"}
                    {alertTimings.assignments === "3hours" && "Short notice"}
                    {alertTimings.assignments === "6hours" && "Half-day notice"}
                    {alertTimings.assignments === "12hours" && "Half-day notice"}
                    {alertTimings.assignments === "1day" && "One day advance"}
                    {alertTimings.assignments === "2days" && "Good preparation time"}
                    {alertTimings.assignments === "3days" && "Ample time to prepare"}
                    {alertTimings.assignments === "1week" && "Maximum preparation"}
                  </span>
                </motion.div>
              </AnimatePresence>
            </motion.div>

            {/* System Events */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.6 }}
              whileHover={{ scale: 1.02, y: -2 }}
              className="p-4 bg-gray-50 border-2 border-gray-200 rounded-lg"
            >
              <div className="flex items-center gap-2 mb-3">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="text-sm text-gray-900">System Events</span>
              </div>
              <div className="text-sm text-gray-600 py-2">
                Instant notifications
              </div>
              <div className="mt-2 flex items-center gap-1">
                <Zap className="w-3 h-3 text-gray-600" />
                <span className="text-xs text-gray-700">Always immediate</span>
              </div>
            </motion.div>
          </div>

          <Separator className="my-6" />

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span className="text-gray-900">💡 Smart Tip:</span> We recommend at least 3 days notice for exams and 1 day for quizzes
            </div>
            <Button
              className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white"
              onClick={() => updateSettings({})}
              disabled={updating}
            >
              <Clock className="w-4 h-4 mr-2" />
              {updating ? "Saving..." : "Save Timing Preferences"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* All Alerts List */}
      <Card className="border-none shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Alerts</CardTitle>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="text-[#2563EB]">
                Mark All as Read
              </Button>
              <Button variant="outline" size="sm" className="border-gray-300">
                Filter
              </Button>
            </div>
          </div>
          <CardDescription>Your complete alert history and notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {allAlerts.map((alert, index) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  duration: 0.4,
                  delay: index * 0.1,
                  ease: [0.4, 0, 0.2, 1]
                }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className={`p-4 rounded-lg border transition-all cursor-pointer ${alert.read
                  ? 'bg-white border-gray-200 hover:border-gray-300'
                  : 'bg-blue-50 border-[#2563EB] hover:shadow-md'
                  }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {alert.type === 'quiz' && <AlertCircle className="w-5 h-5 text-orange-500" />}
                    {alert.type === 'assignment' && <CheckCircle2 className="w-5 h-5 text-blue-500" />}
                    {alert.type === 'exam' && <AlertCircle className="w-5 h-5 text-red-500" />}
                    {alert.type === 'project' && <CheckCircle2 className="w-5 h-5 text-purple-500" />}
                    {alert.type === 'system' && <Bell className="w-5 h-5 text-[#2563EB]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-sm text-gray-900">{alert.title}</div>
                      {!alert.read && (
                        <div className="w-2 h-2 rounded-full bg-[#2563EB] flex-shrink-0 mt-1"></div>
                      )}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">{alert.description}</div>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="text-xs text-gray-500">{alert.date}</div>
                      <Badge
                        variant="outline"
                        className={`text-xs ${alert.priority === 'high'
                          ? 'border-red-300 text-red-700'
                          : alert.priority === 'medium'
                            ? 'border-yellow-300 text-yellow-700'
                            : 'border-green-300 text-green-700'
                          }`}
                      >
                        {alert.daysLeft}
                      </Badge>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
