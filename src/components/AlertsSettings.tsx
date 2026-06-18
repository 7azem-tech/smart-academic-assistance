import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bell, BellOff, Mail, Smartphone, Calendar, CheckCircle2, AlertCircle, User, Lock, Globe, MessageCircle, Crown, Check, Brain, Target, Zap, BookOpen, Palette, Volume2, Eye, Shield, Download, Trash2, Loader2, Sun, Type, Activity, GripHorizontal, ZoomIn, FileText, Terminal, Lightbulb, Clock, CalendarDays, TrendingUp, Moon, Minimize, Play, Key, History, BarChart } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Switch } from "./ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useAuth } from "../contexts/AuthContext";
import { useSettings } from "../contexts/SettingsContext";

export function AlertsSettings() {
  const { user } = useAuth();
  const { 
    highContrast, toggleHighContrast,
    largeText, toggleLargeText,
    reduceMotion, toggleReduceMotion,
    screenReaderSupport, toggleScreenReaderSupport,
    screenMagnifier, toggleScreenMagnifier
  } = useSettings();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const [settings, setSettings] = useState({
    emailEnabled: true,
    whatsappEnabled: false,
    quizTiming: "1day",
    midtermTiming: "3days",
    finalTiming: "1week",
    projectTiming: "2days",
    assignmentTiming: "1day"
  });

  const [whatsappEnabled, setWhatsappEnabled] = useState(false); // Kept for UI logic if needed

  useEffect(() => {
    if (user) {
      syncUserAndLoadSettings();
    }
  }, [user]);

  const [sendingTest, setSendingTest] = useState(false);

  const sendTestEmail = async () => {
    try {
      setSendingTest(true);
      const response = await fetch('http://localhost:3005/api/notifications/test-email', {
        method: 'POST'
      });
      const data = await response.json();
      if (data.success) {
        alert("Test email sent successfully to hazem-j@outlook.com!");
      } else {
        alert("Failed to send test email: " + data.error);
      }
    } catch (error) {
      console.error("Test email error:", error);
      alert("An error occurred while sending the test email.");
    } finally {
      setSendingTest(false);
    }
  };

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
          setWhatsappEnabled(!!data.whatsappEnabled);
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
    } catch (error) {
      console.error("Failed to update settings:", error);
    } finally {
      setUpdating(false);
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
  ];

  const unreadCount = allAlerts.filter(a => !a.read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 mb-2">Alerts & Settings</h1>
          <p className="text-gray-600">Manage your notifications and account preferences</p>
        </div>
        <Badge className="bg-[#2563EB] text-white px-4 py-2">
          {unreadCount} Unread
        </Badge>
      </div>

      <Tabs defaultValue="alerts" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Alerts
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Account
          </TabsTrigger>
        </TabsList>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6 mt-6">
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
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <div className={`w-2 h-2 rounded-full ${settings.emailEnabled ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <span>{settings.emailEnabled ? 'Active' : 'Inactive'}</span>
                  </div>
                  <Switch
                    checked={settings.emailEnabled}
                    onCheckedChange={(checked: boolean) => updateSettings({ emailEnabled: checked })}
                    disabled={updating}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-[#2563EB] border-[#2563EB] hover:bg-blue-50 gap-2"
                  onClick={sendTestEmail}
                  disabled={sendingTest}
                >
                  {sendingTest ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  Send Email Test
                </Button>
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
                  onCheckedChange={(checked: boolean) => {
                    setWhatsappEnabled(checked);
                    updateSettings({ whatsappEnabled: checked });
                  }}
                  disabled={updating}
                />
              </div>
            </CardContent>
          </Card>

          {/* Premium Packages - Only show if WhatsApp is enabled */}
          {whatsappEnabled && (
            <Card className="border-none shadow-md border-l-4 border-l-[#D4AF37]">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-[#D4AF37]" />
                  <CardTitle>Premium Packages</CardTitle>
                </div>
                <CardDescription>Choose the plan that fits your needs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Basic Package */}
                  <div className="p-5 border-2 border-gray-300 rounded-lg hover:border-[#2563EB] transition-all cursor-pointer group">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-gray-900 mb-1">Basic Package</div>
                        <div className="text-xs text-gray-500">Essential notifications</div>
                      </div>
                      <Badge variant="outline" className="border-gray-300">Standard</Badge>
                    </div>
                    <div className="mb-4">
                      <div className="flex items-baseline gap-1">
                        <span className="text-[#2563EB]">10 EGP</span>
                        <span className="text-sm text-gray-500">/term</span>
                      </div>
                    </div>
                    <Separator className="my-3" />
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-gray-700">
                        <Check className="w-4 h-4 text-green-600" />
                        <span>Up to 41 messages</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-700">
                        <Check className="w-4 h-4 text-green-600" />
                        <span>Quiz & exam reminders</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-700">
                        <Check className="w-4 h-4 text-green-600" />
                        <span>Assignment deadlines</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-700">
                        <Check className="w-4 h-4 text-green-600" />
                        <span>Registration alerts</span>
                      </div>
                    </div>
                    <Button className="w-full mt-4 bg-white border-2 border-[#2563EB] text-[#2563EB] hover:bg-[#2563EB] hover:text-white group-hover:bg-[#2563EB] group-hover:text-white transition-all">
                      Select Basic
                    </Button>
                  </div>

                  {/* Premium Package */}
                  <div className="p-5 bg-gradient-to-br from-[#2563EB] to-[#1e40af] rounded-lg text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                    <div className="relative">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="text-white mb-1">Premium Package</div>
                          <div className="text-xs text-blue-200">Complete coverage</div>
                        </div>
                        <Badge className="bg-[#D4AF37] text-white border-none">
                          <Crown className="w-3 h-3 mr-1" />
                          Popular
                        </Badge>
                      </div>
                      <div className="mb-4">
                        <div className="flex items-baseline gap-1">
                          <span className="text-white">25 EGP</span>
                          <span className="text-sm text-blue-200">/term</span>
                        </div>
                      </div>
                      <Separator className="my-3 bg-blue-400" />
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-blue-100">
                          <Check className="w-4 h-4 text-[#D4AF37]" />
                          <span>Unlimited messages</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-blue-100">
                          <Check className="w-4 h-4 text-[#D4AF37]" />
                          <span>All Basic features</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-blue-100">
                          <Check className="w-4 h-4 text-[#D4AF37]" />
                          <span>Grade notifications</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-blue-100">
                          <Check className="w-4 h-4 text-[#D4AF37]" />
                          <span>Custom timing settings</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-blue-100">
                          <Check className="w-4 h-4 text-[#D4AF37]" />
                          <span>Priority support</span>
                        </div>
                      </div>
                      <Button className="w-full mt-4 bg-white text-[#2563EB] hover:bg-gray-100">
                        Select Premium
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Customize Alert Timing */}
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle>Customize Alert Timing</CardTitle>
              <CardDescription>Set when you want to receive alerts for different events</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Quizzes */}
              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <Label htmlFor="quizzes" className="text-sm text-gray-900">Quizzes</Label>
                <motion.select
                  id="quizzes"
                  value={settings.quizTiming}
                  onChange={(e) => setSettings({ ...settings, quizTiming: e.target.value })}
                  whileFocus={{ scale: 1.02 }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent text-sm"
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
              </motion.div>

              <Separator />

              {/* Midterms */}
              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <Label htmlFor="midterms" className="text-sm text-gray-900">Midterms</Label>
                <motion.select
                  id="midterms"
                  value={settings.midtermTiming}
                  onChange={(e) => setSettings({ ...settings, midtermTiming: e.target.value })}
                  whileFocus={{ scale: 1.02 }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent text-sm"
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
              </motion.div>

              <Separator />

              {/* Finals */}
              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                <Label htmlFor="finals" className="text-sm text-gray-900">Finals</Label>
                <motion.select
                  id="finals"
                  value={settings.finalTiming}
                  onChange={(e) => setSettings({ ...settings, finalTiming: e.target.value })}
                  whileFocus={{ scale: 1.02 }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent text-sm"
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
              </motion.div>

              <Separator />

              {/* Projects */}
              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
              >
                <Label htmlFor="projects" className="text-sm text-gray-900">Projects</Label>
                <motion.select
                  id="projects"
                  value={settings.projectTiming}
                  onChange={(e) => setSettings({ ...settings, projectTiming: e.target.value })}
                  whileFocus={{ scale: 1.02 }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent text-sm"
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
              </motion.div>

              <Separator />

              {/* Assignments */}
              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.5 }}
              >
                <Label htmlFor="assignments" className="text-sm text-gray-900">Assignments</Label>
                <motion.select
                  id="assignments"
                  value={settings.assignmentTiming}
                  onChange={(e) => setSettings({ ...settings, assignmentTiming: e.target.value })}
                  whileFocus={{ scale: 1.02 }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent text-sm"
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
              </motion.div>

              <div className="pt-4">
                <Button
                  className="w-full bg-[#2563EB] hover:bg-[#1d4ed8] text-white flex items-center justify-center gap-2"
                  onClick={() => updateSettings({})}
                  disabled={updating}
                >
                  {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Save Timing Preferences
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* All Alerts List */}
          <Card className="border-none shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>All Alerts</CardTitle>
                <Button variant="ghost" size="sm" className="text-[#2563EB]">
                  Mark All as Read
                </Button>
              </div>
              <CardDescription>Your complete alert history</CardDescription>
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
                      delay: index * 0.08,
                      ease: [0.4, 0, 0.2, 1]
                    }}
                    whileHover={{ scale: 1.02, y: -2, transition: { duration: 0.2 } }}
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
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-6 mt-6">
          {/* Personal Information */}
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-[#2563EB]" />
                Personal Information
              </CardTitle>
              <CardDescription>Update your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" defaultValue="Hazem Ehab" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="studentId">Student ID</Label>
                  <Input id="studentId" defaultValue="2021-0456" disabled />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" defaultValue="hazem.ehab@eelu.edu.eg" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" type="tel" defaultValue="+20 123 456 7890" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="major">Major</Label>
                  <Input id="major" defaultValue="Computer Science" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Academic Year</Label>
                  <select
                    id="year"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-sm"
                  >
                    <option>Year 1</option>
                    <option>Year 2</option>
                    <option selected>Year 3</option>
                    <option>Year 4</option>
                  </select>
                </div>
              </div>
              <Button className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white">
                Save Changes
              </Button>
            </CardContent>
          </Card>

          {/* AI Assistant Preferences */}
          <Card className="border-none shadow-md border-l-4 border-l-[#2563EB]">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-[#2563EB]" />
                <CardTitle>AI Assistant Preferences</CardTitle>
              </div>
              <CardDescription>Customize how the AI chatbot interacts with you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="responseStyle">Response Style</Label>
                <select
                  id="responseStyle"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-sm"
                >
                  <option>Concise (Short answers)</option>
                  <option selected>Detailed (Comprehensive explanations)</option>
                  <option>Tutorial (Step-by-step guidance)</option>
                  <option>Professional (Formal tone)</option>
                  <option>Friendly (Conversational tone)</option>
                </select>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Always Show Sources</div>
                    <div className="text-xs text-gray-500">Include document citations in every response</div>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center flex-shrink-0">
                    <Terminal className="w-4 h-4 text-slate-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Code Examples</div>
                    <div className="text-xs text-gray-500">Include code snippets when relevant</div>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <Lightbulb className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Smart Suggestions</div>
                    <div className="text-xs text-gray-500">Get AI-powered follow-up questions</div>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="chatLanguage">Chat Language Preference</Label>
                <select
                  id="chatLanguage"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-sm"
                >
                  <option selected>English</option>
                  <option>العربية (Arabic)</option>
                  <option>Auto-detect</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Study & Learning Preferences */}
          <Card className="border-none shadow-md border-l-4 border-l-[#D4AF37]">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#D4AF37]" />
                <CardTitle>Study & Learning Preferences</CardTitle>
              </div>
              <CardDescription>Personalize your learning experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="learningStyle">Learning Style</Label>
                <select
                  id="learningStyle"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-sm"
                >
                  <option selected>Visual (Diagrams, charts)</option>
                  <option>Auditory (Audio explanations)</option>
                  <option>Reading/Writing (Text-based)</option>
                  <option>Kinesthetic (Hands-on examples)</option>
                  <option>Mixed (Combination)</option>
                </select>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Daily Study Reminders</div>
                    <div className="text-xs text-gray-500">Get reminded to study during your optimal time</div>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="studyTime">Preferred Study Time</Label>
                <select
                  id="studyTime"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-sm"
                >
                  <option>Early Morning (6 AM - 9 AM)</option>
                  <option>Morning (9 AM - 12 PM)</option>
                  <option>Afternoon (12 PM - 5 PM)</option>
                  <option selected>Evening (5 PM - 9 PM)</option>
                  <option>Night (9 PM - 12 AM)</option>
                  <option>Late Night (12 AM - 3 AM)</option>
                </select>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <CalendarDays className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Smart Study Plans</div>
                    <div className="text-xs text-gray-500">Generate AI-powered study schedules before exams</div>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* Academic Goals */}
          <Card className="border-none shadow-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-[#2563EB]" />
                <CardTitle>Academic Goals</CardTitle>
              </div>
              <CardDescription>Set and track your academic objectives</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="targetGPA">Target GPA</Label>
                <Input id="targetGPA" type="number" step="0.01" min="0" max="4" defaultValue="3.75" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="graduationDate">Expected Graduation</Label>
                <Input id="graduationDate" type="month" defaultValue="2026-06" />
              </div>
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">GPA Tracking & Insights</div>
                    <div className="text-xs text-gray-500">Get AI recommendations to improve your GPA</div>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* Appearance & Interface */}
          <Card className="border-none shadow-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-[#2563EB]" />
                <CardTitle>Appearance & Interface</CardTitle>
              </div>
              <CardDescription>Customize the look and feel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <Moon className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Dark Mode</div>
                    <div className="text-xs text-gray-500">Toggle dark mode theme</div>
                  </div>
                </div>
                <Switch />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center flex-shrink-0">
                    <Minimize className="w-4 h-4 text-teal-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Compact View</div>
                    <div className="text-xs text-gray-500">Show more information in less space</div>
                  </div>
                </div>
                <Switch />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center flex-shrink-0">
                    <Play className="w-4 h-4 text-rose-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Animations</div>
                    <div className="text-xs text-gray-500">Enable smooth transitions and animations</div>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="language">Interface Language</Label>
                <select
                  id="language"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-sm"
                >
                  <option>English</option>
                  <option>العربية (Arabic)</option>
                </select>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="accentColor">Accent Color</Label>
                <select
                  id="accentColor"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-sm"
                >
                  <option selected>Cobalt Blue (Default)</option>
                  <option>Royal Purple</option>
                  <option>Emerald Green</option>
                  <option>Sunset Orange</option>
                  <option>Rose Pink</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Accessibility */}
          <Card className="border-none shadow-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-[#2563EB]" />
                <CardTitle>Accessibility</CardTitle>
              </div>
              <CardDescription>Make the platform work better for you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <Sun className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">High Contrast Mode</div>
                    <div className="text-xs text-gray-500">Increase contrast for better visibility</div>
                  </div>
                </div>
                <Switch checked={highContrast} onCheckedChange={toggleHighContrast} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Type className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Larger Text</div>
                    <div className="text-xs text-gray-500">Increase base font size</div>
                  </div>
                </div>
                <Switch checked={largeText} onCheckedChange={toggleLargeText} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <Activity className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Reduce Motion</div>
                    <div className="text-xs text-gray-500">Minimize animations and transitions</div>
                  </div>
                </div>
                <Switch checked={reduceMotion} onCheckedChange={toggleReduceMotion} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
                    <Volume2 className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Screen Reader Support</div>
                    <div className="text-xs text-gray-500">Optimize for assistive technologies</div>
                  </div>
                </div>
                <Switch checked={screenReaderSupport} onCheckedChange={toggleScreenReaderSupport} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center flex-shrink-0">
                    <ZoomIn className="w-4 h-4 text-rose-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Screen Magnifier</div>
                    <div className="text-xs text-gray-500">Global lens for severe vision loss</div>
                  </div>
                </div>
                <Switch checked={screenMagnifier} onCheckedChange={toggleScreenMagnifier} />
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Security */}
          <Card className="border-none shadow-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#2563EB]" />
                <CardTitle>Privacy & Security</CardTitle>
              </div>
              <CardDescription>Control your data and privacy</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input id="currentPassword" type="password" placeholder="Enter current password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" type="password" placeholder="Enter new password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input id="confirmPassword" type="password" placeholder="Confirm new password" />
              </div>
              <Button className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white">
                Update Password
              </Button>
              <Separator className="my-4" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-stone-50 flex items-center justify-center flex-shrink-0">
                    <Key className="w-4 h-4 text-stone-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Two-Factor Authentication</div>
                    <div className="text-xs text-gray-500">Add an extra layer of security</div>
                  </div>
                </div>
                <Switch />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-sky-50 flex items-center justify-center flex-shrink-0">
                    <History className="w-4 h-4 text-sky-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Chat History</div>
                    <div className="text-xs text-gray-500">Save conversation history with AI chatbots</div>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
                    <BarChart className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Usage Analytics</div>
                    <div className="text-xs text-gray-500">Help improve the platform with anonymous data</div>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card className="border-none shadow-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-[#2563EB]" />
                <CardTitle>Data Management</CardTitle>
              </div>
              <CardDescription>Export or delete your data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Download className="w-5 h-5 text-[#2563EB] mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm text-gray-900 mb-1">Export Your Data</div>
                    <div className="text-xs text-gray-600 mb-3">Download all your academic data, chat history, and settings</div>
                    <Button variant="outline" className="border-[#2563EB] text-[#2563EB] hover:bg-[#2563EB] hover:text-white text-sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export Data
                    </Button>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Trash2 className="w-5 h-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm text-gray-900 mb-1">Delete Account</div>
                    <div className="text-xs text-gray-600 mb-3">Permanently delete your account and all associated data</div>
                    <Button variant="outline" className="border-red-400 text-red-700 hover:bg-red-600 hover:text-white text-sm">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Account
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
