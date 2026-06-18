import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GraduationCap, Lock, User, KeyRound, Sparkles, Shield, Users, ChevronRight } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { adminService } from "../services/adminService";
import { toast } from "sonner";

interface LoginProps {
  onLogin: (role: string, userId: string) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [userType, setUserType] = useState<"student" | "admin" | "staff">("student");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const userTypes = [
    {
      id: "student" as const,
      label: "Student",
      icon: GraduationCap,
      color: "from-[#2563EB] to-[#1e40af]",
      description: "Access your courses and academic portal"
    },
    {
      id: "admin" as const,
      label: "Admin",
      icon: Shield,
      color: "from-[#7C3AED] to-[#5B21B6]",
      description: "System administration and management"
    },
    {
      id: "staff" as const,
      label: "Staff",
      icon: Users,
      color: "from-[#D4AF37] to-[#B8941E]",
      description: "Faculty and staff portal access"
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = adminService.verifyUser(username, password, userType);

    if (result.success && result.userId) {
      toast.success(`Welcome back, ${username}!`);
      onLogin(userType, result.userId);
    } else {
      switch (result.error) {
        case 'user_not_found':
          toast.error("You are not registered in the system. Please contact administration.");
          break;
        case 'role_mismatch':
          toast.error(`Account exists but not as ${userType}. Please check your role selection.`);
          break;
        case 'wrong_password':
          toast.error("Incorrect password. Please try again.");
          break;
        case 'account_suspended':
          toast.error("Your account has been suspended. Please contact administration.");
          break;
        case 'credentials_revoked':
          toast.error("Your access credentials have been revoked.");
          break;
        case 'credentials_expired':
          toast.warning("Your session has expired. Please login again.");
          break;
        default:
          toast.error("Login failed. Please try again.");
      }
    }
  };

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-[#1A202C] via-[#2D3748] to-[#1A202C] flex items-center justify-center p-4 relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-[#2563EB] opacity-10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.15, 0.1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-[#D4AF37] opacity-10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.1, 0.15, 0.1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#2563EB] opacity-5 rounded-full blur-3xl"
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: 60,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      {/* Main Login Container */}
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
        {/* Left Side - Branding */}
        <motion.div
          className="hidden lg:flex flex-col justify-center text-white space-y-8 px-8"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
        >
          <div>
            <motion.div
              className="flex items-center gap-3 mb-6"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <motion.div
                className="w-16 h-16 bg-gradient-to-br from-[#2563EB] to-[#1e40af] rounded-2xl flex items-center justify-center shadow-2xl"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <GraduationCap className="w-9 h-9 text-white" />
              </motion.div>
              <div>
                <h1 className="text-white mb-1">Academic Portal</h1>
                <div className="flex items-center gap-2">
                  <Badge className="bg-[#D4AF37] text-white border-none">
                    <Sparkles className="w-3 h-3 mr-1" />
                    AI-Powered
                  </Badge>
                </div>
              </div>
            </motion.div>
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <h2 className="text-white">
                Student Information System
              </h2>
              <p className="text-gray-300 text-lg leading-relaxed">
                Access your personalized academic dashboard, intelligent course chatbots, and smart registration tools.
              </p>
            </motion.div>
          </div>

          {/* Feature Cards */}
          <div className="space-y-3">
            <motion.div
              className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 hover:bg-white/15 transition-all"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              whileHover={{ x: 10, scale: 1.02, transition: { duration: 0.2 } }}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#2563EB] rounded-lg flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-white text-sm mb-1">Course Chatbots</div>
                  <div className="text-gray-300 text-xs">Get instant answers from intelligent course assistants</div>
                </div>
              </div>
            </motion.div>
            <motion.div
              className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 hover:bg-white/15 transition-all"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              whileHover={{ x: 10, scale: 1.02, transition: { duration: 0.2 } }}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#D4AF37] rounded-lg flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-white text-sm mb-1">Smart Registration</div>
                  <div className="text-gray-300 text-xs">Intelligent course recommendations and planning</div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Right Side - Login Form */}
        <motion.div
          className="flex items-center justify-center"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
        >
          <Card className="w-full max-w-md border-none shadow-2xl bg-white/95 backdrop-blur-lg">
            <CardContent className="p-8">
              <motion.div
                className="text-center mb-8"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4, ease: [0.4, 0, 0.2, 1] }}
              >
                <motion.div
                  className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#2563EB] to-[#1e40af] rounded-2xl shadow-lg mb-4"
                  whileHover={{ scale: 1.1, rotate: 360 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <Lock className="w-8 h-8 text-white" />
                </motion.div>
                <h2 className="text-gray-900 mb-2">Welcome Back</h2>
                <p className="text-gray-600">Sign in to access your academic portal</p>
              </motion.div>

              {/* User Type Selection */}
              <motion.div
                className="mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <Label className="text-sm text-gray-700 mb-3 block">Select Account Type</Label>
                <div className="grid grid-cols-3 gap-2">
                  <AnimatePresence mode="wait">
                    {userTypes.map((type, index) => {
                      const Icon = type.icon;
                      const isSelected = userType === type.id;
                      return (
                        <motion.button
                          key={`${type.id}-${userType}`}
                          onClick={() => setUserType(type.id)}
                          className={`p-3 rounded-xl border-2 transition-all relative overflow-hidden ${isSelected
                            ? `border-[#2563EB] text-white shadow-lg`
                            : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                            }`}
                          initial={{ opacity: 0, y: 20, scale: 0.95 }}
                          animate={{
                            opacity: 1,
                            y: 0,
                            scale: 1,
                            z: isSelected ? 10 : 0
                          }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          transition={{
                            duration: 0.5,
                            delay: 0.6 + index * 0.1,
                            type: "spring",
                            stiffness: 200,
                            damping: 20
                          }}
                          whileHover={{
                            scale: 1.05,
                            y: -2,
                            transition: { duration: 0.2 }
                          }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {isSelected && (
                            <motion.div
                              className={`absolute inset-0 bg-gradient-to-br ${type.color}`}
                              initial={{ scale: 0, opacity: 0, x: "-100%" }}
                              animate={{ scale: 1, opacity: 1, x: 0 }}
                              exit={{ scale: 0, opacity: 0, x: "100%" }}
                              transition={{
                                duration: 0.15,
                                type: "spring",
                                stiffness: 300,
                                damping: 30
                              }}
                            />
                          )}
                          <motion.div
                            className="relative z-10"
                            animate={{
                              scale: isSelected ? [1, 1.08, 1] : 1,
                              rotate: isSelected ? [0, 3, -3, 0] : 0
                            }}
                            transition={{
                              duration: 0.2,
                              ease: [0.34, 1.56, 0.64, 1]
                            }}
                          >
                            <motion.div
                              animate={{
                                rotate: isSelected ? 360 : 0
                              }}
                              transition={{
                                duration: 0.3,
                                ease: "easeInOut"
                              }}
                            >
                              <Icon className={`w-5 h-5 mx-auto mb-1 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
                            </motion.div>
                            <div className={`text-xs font-medium ${isSelected ? 'text-white' : 'text-gray-700'}`}>
                              {type.label}
                            </div>
                          </motion.div>
                        </motion.button>
                      );
                    })}
                  </AnimatePresence>
                </div>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={userType}
                    className="text-xs text-gray-500 mt-3 text-center min-h-[32px] flex items-center justify-center"
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{
                      duration: 0.15,
                      ease: [0.4, 0, 0.2, 1]
                    }}
                  >
                    {userTypes.find(t => t.id === userType)?.description}
                  </motion.p>
                </AnimatePresence>
              </motion.div>

              {/* Login Form */}
              <motion.form
                onSubmit={handleSubmit}
                className="space-y-5"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7, ease: [0.4, 0, 0.2, 1] }}
              >
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm text-gray-700">
                    Username
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10 h-12 border-gray-300 focus:border-[#2563EB] focus:ring-[#2563EB]"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm text-gray-700">
                    Password
                  </Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 h-12 border-gray-300 focus:border-[#2563EB] focus:ring-[#2563EB]"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    className="text-sm text-[#2563EB] hover:text-[#1d4ed8] transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-[#2563EB] to-[#1e40af] hover:from-[#1d4ed8] hover:to-[#1e3a8a] text-white shadow-lg hover:shadow-xl transition-all group"
                  >
                    <span>Sign In</span>
                    <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </motion.div>
              </motion.form>

              {/* Footer */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="text-center text-xs text-gray-500">
                  <div className="mb-2">Powered by AI-Powered Smart Academic Portal</div>
                  <div className="flex items-center justify-center gap-2">
                    <Shield className="w-3 h-3" />
                    <span>Secure Login • Protected by SSL Encryption</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Mobile Branding */}
        <motion.div
          className="lg:hidden text-center text-white px-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-[#2563EB] to-[#1e40af] rounded-xl flex items-center justify-center">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-white">Academic Portal</h2>
          </div>
          <p className="text-gray-300 text-sm">Student Information System</p>
        </motion.div>
      </div>
    </motion.div>
  );
}
