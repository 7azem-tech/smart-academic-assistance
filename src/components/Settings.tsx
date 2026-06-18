import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { User, Lock, Globe, Brain, Palette, Eye, Shield, Check, Crown, Mail, MessageCircle, Settings as SettingsIcon, Hash, Bot, Sun, Type, Activity, Volume2, BookOpen, GripHorizontal, ZoomIn, FileText, Terminal, Lightbulb, Moon, Minimize, Play, Key, History } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useCompactView } from "../contexts/CompactViewContext";
import { useSettings } from "../contexts/SettingsContext";
import { useAuth } from "../contexts/AuthContext";
import { adminService } from "../services/adminService";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "./ui/avatar";

export function Settings() {
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const { isCompact, toggleCompact } = useCompactView();
  const {
    darkMode,
    toggleDarkMode,
    highContrast,
    toggleHighContrast,
    largeText,
    toggleLargeText,
    animationsEnabled,
    toggleAnimations,
    reduceMotion,
    toggleReduceMotion,
    accentColor,
    setAccentColor,
    screenReaderSupport,
    toggleScreenReaderSupport,
    academicYear,
    setAcademicYear,
    speak,
    dyslexicFont,
    toggleDyslexicFont,
    colorBlindnessMode,
    setColorBlindnessMode,
    readingGuide,
    toggleReadingGuide,
    screenMagnifier,
    toggleScreenMagnifier,
    portalLogo,
    setPortalLogo,
  } = useSettings();

  const { user, userRole, refreshUser } = useAuth();
  const [fullName, setFullName] = useState(user ? `${user.firstName} ${user.lastName}` : "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phoneNumber || "");
  const [username, setUsername] = useState(user?.username || "");
  const [universityId, setUniversityId] = useState(user?.universityId || "");
  const [isSaving, setIsSaving] = useState(false);

  // Sync state if user changes independently
  useEffect(() => {
    if (user && !fullName) {
      setFullName(`${user.firstName} ${user.lastName}`);
      setEmail(user.email);
      setPhone(user.phoneNumber || "");
      setUsername(user.username || "");
      setUniversityId(user.universityId || "");
    }
  }, [user, fullName]);

  const handleSaveProfile = () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const parts = fullName.trim().split(" ");
      const firstName = parts[0] || "";
      const lastName = parts.slice(1).join(" ") || "";

      const updates: any = {};
      const changedFields: string[] = [];

      if (firstName !== user.firstName || lastName !== (user.lastName || "")) {
        updates.firstName = firstName;
        updates.lastName = lastName;
        changedFields.push("Name");
      }

      if (username !== user.username) {
        updates.username = username;
        changedFields.push("Username");
      }

      // University ID is read-only — cannot be updated by user

      if (email !== user.email) {
        updates.email = email;
        changedFields.push("Email");
      }

      if (phone !== (user.phoneNumber || "")) {
        updates.phoneNumber = phone;
        changedFields.push("Phone number");
      }

      if (changedFields.length === 0) {
        setIsSaving(false);
        return;
      }

      adminService.updateUser(user.id, updates);
      refreshUser();

      if (changedFields.length > 1) {
        toast.success("Profile updated successfully");
      } else {
        toast.success(`${changedFields[0]} updated successfully`);
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast.error("Invalid image type. Only JPG, PNG, GIF, and WebP are allowed.");
      return;
    }

    // Validate size (e.g. max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("Image is too large. Max size is 5MB.");
      return;
    }

    setIsSaving(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'demo_upload');

    try {
      // Upload to Cloudinary demo
      const res = await fetch('https://api.cloudinary.com/v1_1/demo/image/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (data.secure_url) {
        adminService.updateProfileImage(user.id, data.secure_url);
        refreshUser();
        toast.success("Profile picture updated successfully");
      } else {
        throw new Error("Upload failed");
      }
    } catch (err: any) {
      // Fallback: Use base64 if cloud upload fails, and user accepts local storage limits
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        try {
          adminService.updateProfileImage(user.id, base64);
          refreshUser();
          toast.success("Profile picture updated (local fallback)");
        } catch (storageErr) {
          toast.error("Storage limit exceeded, please use a smaller image.");
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsSaving(false);
    }
  };
  const handlePortalLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setPortalLogo(base64);
      toast.success("Portal logo updated successfully");
    };
    reader.readAsDataURL(file);
  };
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
                <SettingsIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-gray-900 mb-0">Settings</h1>
                <p className="text-sm text-gray-500 mt-1">Manage your account, preferences, and platform settings</p>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Personal Information */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
      >
        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-[#2563EB]" />
              Personal Information
            </CardTitle>
            <CardDescription>Update your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-6 mb-6">
              <Avatar className="h-20 w-20 ring-2 ring-[#2563EB]/20">
                {user?.profileImage ? (
                  <img src={user.profileImage} alt="Profile" className="object-cover w-full h-full rounded-full" />
                ) : (
                  <AvatarFallback className="bg-gray-100 text-gray-500 text-xl">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </AvatarFallback>
                )}
              </Avatar>
              <div>
                <input
                  type="file"
                  id="avatar-upload"
                  hidden
                  accept="image/jpeg, image/png, image/webp"
                  onChange={handleImageUpload}
                />
                <Button
                  variant="outline"
                  className="mb-2"
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                >
                  Change Picture
                </Button>
                <div className="text-xs text-gray-500">JPG, PNG or WebP. Max 5MB.</div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="studentId" className="flex items-center gap-1.5">
                  University ID
                  <span className="text-xs text-gray-400 font-normal flex items-center gap-0.5">
                    <Lock className="w-3 h-3" /> Read-only
                  </span>
                </Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="studentId"
                    value={universityId}
                    readOnly
                    disabled
                    className="pl-9 bg-gray-50 text-gray-500 cursor-not-allowed border-dashed font-mono"
                    title="University ID cannot be changed. Contact an administrator if this needs to be updated."
                  />
                </div>
                <p className="text-xs text-gray-400">University ID is assigned by administration and cannot be modified.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" value={username} onChange={e => setUsername(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="major">Major</Label>
                <Input id="major" defaultValue="Information Technology" disabled className="bg-gray-100 cursor-not-allowed opacity-75" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">Academic Year</Label>
                <div className="relative">
                  <select
                    id="year"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(parseInt(e.target.value))}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-sm bg-gray-100 cursor-not-allowed opacity-75"
                    aria-label="Academic year (read-only)"
                    style={{
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      MozAppearance: 'none',
                      backgroundImage: 'none',
                      paddingRight: '0.75rem'
                    }}
                  >
                    <option value={1}>Year 1</option>
                    <option value={2}>Year 2</option>
                    <option value={3}>Year 3</option>
                    <option value={4}>Year 4</option>
                  </select>
                </div>
                <p className="text-xs text-gray-500 mt-1">Academic year is automatically set based on your enrollment</p>
              </div>
            </div>
            <Button onClick={handleSaveProfile} disabled={isSaving} className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white">
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Notification Channels */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
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
            <motion.div
              className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              whileHover={{ scale: 1.02, transition: { duration: 0.15 } }}
            >
              <div className="flex items-center gap-3">
                <motion.div
                  animate={whatsappEnabled ? {
                    rotate: [0, -10, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  } : {}}
                  transition={{ duration: 0.5 }}
                >
                  <MessageCircle className="w-5 h-5 text-green-600" />
                </motion.div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-900">WhatsApp Alerts</span>
                    <motion.div
                      animate={whatsappEnabled ? {
                        scale: [1, 1.15, 1],
                        rotate: [0, 5, -5, 0]
                      } : {}}
                      transition={{ duration: 0.4 }}
                    >
                      <Badge className="bg-[#D4AF37] text-white border-none">Premium</Badge>
                    </motion.div>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Get instant WhatsApp notifications</div>
                </div>
              </div>
              <motion.div
                animate={whatsappEnabled ? {
                  scale: [1, 1.1, 1]
                } : {}}
                transition={{ duration: 0.3 }}
              >
                <Switch
                  checked={whatsappEnabled}
                  onCheckedChange={setWhatsappEnabled}
                />
              </motion.div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Premium Packages - Only show if WhatsApp is enabled */}
      <AnimatePresence>
        {whatsappEnabled && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
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
                  <motion.div
                    className="p-5 border-2 border-gray-300 rounded-lg hover:border-[#2563EB] transition-all cursor-pointer group"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    whileHover={{ scale: 1.03, y: -4, transition: { duration: 0.2 } }}
                    whileTap={{ scale: 0.98 }}
                  >
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
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button className="w-full mt-4 bg-white border-2 border-[#2563EB] text-[#2563EB] hover:bg-[#2563EB] hover:text-white group-hover:bg-[#2563EB] group-hover:text-white transition-all">
                        Select Basic
                      </Button>
                    </motion.div>
                  </motion.div>

                  {/* Premium Package */}
                  <motion.div
                    className="p-5 bg-gradient-to-br from-[#2563EB] to-[#1e40af] rounded-lg text-white shadow-lg relative overflow-hidden"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.15 }}
                    whileHover={{ scale: 1.03, y: -4, transition: { duration: 0.2 } }}
                    whileTap={{ scale: 0.98 }}
                  >
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
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button className="w-full mt-4 bg-white text-[#2563EB] hover:bg-gray-100">
                          Select Premium
                        </Button>
                      </motion.div>
                    </div>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>


      {/* AI Assistant Preferences */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.4, ease: [0.4, 0, 0.2, 1] }}
      >
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
      </motion.div>

      {/* Appearance & Interface */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.5, ease: [0.4, 0, 0.2, 1] }}
      >
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
              <Switch checked={darkMode} onCheckedChange={(val: boolean) => {
                toggleDarkMode();
                speak(`Dark mode ${val ? "enabled" : "disabled"}`);
              }} />
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
              <motion.div
                animate={isCompact ? {
                  scale: [1, 1.1, 1]
                } : {}}
                transition={{ duration: 0.2 }}
              >
                <Switch
                  checked={isCompact}
                  onCheckedChange={toggleCompact}
                />
              </motion.div>
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
              <Switch checked={animationsEnabled} onCheckedChange={(val: boolean) => {
                toggleAnimations();
                speak(`Animations ${val ? "enabled" : "disabled"}`);
              }} />
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
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-sm"
              >
                <option value="cobalt-blue">Cobalt Blue (Default)</option>
                <option value="royal-purple">Royal Purple</option>
                <option value="emerald-green">Emerald Green</option>
                <option value="sunset-orange">Sunset Orange</option>
                <option value="rose-pink">Rose Pink</option>
              </select>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Portal Identity - Admin Only */}
      {userRole === 'admin' && (
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.55, ease: [0.4, 0, 0.2, 1] }}
        >
          <Card className="border-none shadow-md border-l-4 border-l-blue-600">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <CardTitle>University Identity</CardTitle>
              </div>
              <CardDescription>Customize the official visual identity of the AI-Powered Smart Academic Portal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="h-16 w-16 rounded-xl bg-gray-900 border border-white/10 flex items-center justify-center overflow-hidden shadow-lg bg-gradient-to-br from-gray-900 to-gray-800">
                  {portalLogo ? (
                    <img src={portalLogo} alt="University Emblem" className="w-full h-full object-cover" />
                  ) : (
                    <Bot className="w-8 h-8 text-blue-400" />
                  )}
                </div>
                <div className="flex-1">
                  <Label className="block mb-2 text-sm font-medium">Official University Emblem</Label>
                  <p className="text-xs text-gray-500 mb-3">This emblem will represent the university at the top of the portal sidebar across the entire system.</p>
                  <div className="flex items-center gap-3">
                    <Input
                      type="file"
                      id="portal-logo-upload"
                      className="hidden"
                      accept="image/*"
                      onChange={handlePortalLogoUpload}
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => document.getElementById('portal-logo-upload')?.click()}
                      className="border-blue-200 text-blue-600 hover:bg-blue-50"
                    >
                      Update Portal Emblem
                    </Button>
                    {portalLogo && (
                      <Button 
                        variant="ghost" 
                        onClick={() => setPortalLogo(null)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        Reset to Default
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Accessibility */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.6, ease: [0.4, 0, 0.2, 1] }}
      >
        <Card className="border-none shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-[#2563EB]" />
                <CardTitle>Accessibility</CardTitle>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs h-8 text-gray-500 hover:text-red-600"
                onClick={() => {
                  if (highContrast) toggleHighContrast();
                  if (largeText) toggleLargeText();
                  if (reduceMotion) toggleReduceMotion();
                  if (screenReaderSupport) toggleScreenReaderSupport();
                  if (dyslexicFont) toggleDyslexicFont();
                  if (readingGuide) toggleReadingGuide();
                  if (screenMagnifier) toggleScreenMagnifier();
                  setColorBlindnessMode("none");
                  speak("All accessibility settings have been reset to default.");
                }}
              >
                Reset to Default
              </Button>
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
              <Switch checked={highContrast} onCheckedChange={(val: boolean) => {
                toggleHighContrast();
                speak(`High contrast mode ${val ? "enabled" : "disabled"}`);
              }} />
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
              <Switch checked={largeText} onCheckedChange={(val: boolean) => {
                toggleLargeText();
                speak(`Large text mode ${val ? "enabled" : "disabled"}`);
              }} />
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
              <Switch checked={reduceMotion} onCheckedChange={(val: boolean) => {
                toggleReduceMotion();
                speak(`Motion Reduction ${val ? "enabled" : "disabled"}`);
              }} />
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
              <Switch checked={screenReaderSupport} onCheckedChange={(val: boolean) => {
                toggleScreenReaderSupport();
                speak(`Screen reader mode ${val ? "enabled" : "disabled"}`);
              }} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Dyslexia Friendly Font</div>
                  <div className="text-xs text-gray-500">Enable font designed for better readability</div>
                </div>
              </div>
              <Switch checked={dyslexicFont} onCheckedChange={(val: boolean) => {
                toggleDyslexicFont();
                speak(`Dyslexia font ${val ? "enabled" : "disabled"}`);
              }} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center flex-shrink-0">
                  <GripHorizontal className="w-4 h-4 text-teal-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Reading Guide</div>
                  <div className="text-xs text-gray-500">Horizontal ruler to help with focus</div>
                </div>
              </div>
              <Switch checked={readingGuide} onCheckedChange={(val: boolean) => {
                toggleReadingGuide();
                speak(`Reading guide ${val ? "enabled" : "disabled"}`);
              }} />
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
              <Switch checked={screenMagnifier} onCheckedChange={(val: boolean) => {
                toggleScreenMagnifier();
                speak(`Screen magnifier ${val ? "enabled" : "disabled"}`);
              }} />
            </div>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Palette className="w-4 h-4 text-pink-600" />
                <Label htmlFor="colorBlindness" className="font-medium text-gray-900">Color Blindness Filter</Label>
              </div>
              <select
                id="colorBlindness"
                value={colorBlindnessMode}
                onChange={(e) => {
                  setColorBlindnessMode(e.target.value);
                  speak(`Color blindness mode set to ${e.target.value}`);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-sm"
              >
                <option value="none">None (Default)</option>
                <option value="protanopia">Protanopia (Red-Blind)</option>
                <option value="deuteranopia">Deuteranopia (Green-Blind)</option>
                <option value="tritanopia">Tritanopia (Blue-Blind)</option>
                <option value="achromatopsia">Achromatopsia (Monochrome)</option>
              </select>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Privacy & Security */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.7, ease: [0.4, 0, 0.2, 1] }}
      >
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
          </CardContent>
        </Card>
      </motion.div>

    </div>
  );
}
