import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Home, Brain, Bell, Settings, LogOut, Map, GraduationCap, Shield, ClipboardList, Bot } from "lucide-react";

function TypingBrand() {
  const [tickIndex, setTickIndex] = useState(0);
  const [showCursor, setShowCursor] = useState(true);

  const p1Text = "AI-Powered ";
  const p2Text = "Smart";
  const line2Text = "Academic Assistance";
  const totalLength = p1Text.length + p2Text.length + line2Text.length;

  useEffect(() => {
    const interval = setInterval(() => {
      setTickIndex((prev) => {
        if (prev >= totalLength) {
          clearInterval(interval);
          setTimeout(() => {
            setShowCursor(false);
          }, 3000);
          return prev;
        }
        return prev + 1;
      });
    }, 50);

    return () => {
      clearInterval(interval);
    };
  }, [totalLength]);

  const line1Part1 = p1Text.slice(0, Math.min(tickIndex, p1Text.length));
  const line1Part2 = p2Text.slice(0, Math.min(Math.max(0, tickIndex - p1Text.length), p2Text.length));
  const line2 = line2Text.slice(0, Math.min(Math.max(0, tickIndex - p1Text.length - p2Text.length), line2Text.length));

  return (
    <div className="flex flex-col text-left">
      <h1 className="text-sm font-bold text-white tracking-tight leading-none group-hover:text-blue-100 transition-colors duration-300 whitespace-nowrap">
        <span>{line1Part1}</span>
        <span className="text-blue-400">{line1Part2}</span>
      </h1>
      <span className="text-[10px] font-semibold tracking-[0.12em] text-blue-300/60 uppercase mt-1.5 group-hover:text-blue-300 transition-colors duration-300 min-h-[15px] whitespace-nowrap">
        {line2}
        {showCursor && (
          <span className="inline-block w-0.5 h-3 bg-blue-400 ml-1 animate-pulse" style={{ verticalAlign: "middle" }}></span>
        )}
      </span>
    </div>
  );
}
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Separator } from "./ui/separator";
import { useAuth } from "../contexts/AuthContext";
import { useSettings } from "../contexts/SettingsContext";

interface SidebarProps {
  activeScreen: string;
  onNavigate: (screen: string) => void;
  onLogout: () => void;
  userRole?: string;
}

export function Sidebar({ activeScreen, onNavigate, onLogout, userRole }: SidebarProps) {
  const { user } = useAuth();
  const { portalLogo } = useSettings();
  const navigationItems = [
    { id: "dashboard",     label: "Dashboard",           icon: Home },
    { id: "smartreg",      label: "Smart Registration",   icon: Brain },
    { id: "roadmap",       label: "Academic Roadmap",     icon: Map },
    { id: "lms", label: "Learning System", icon: GraduationCap },
    { id: "assistant", label: "Student Assistant", icon: Bot },
    { id: "alerts", label: "Alerts Center", icon: Bell },
    { id: "quiz", label: "Quiz System", icon: ClipboardList },
  ];

  if (userRole === 'admin') {
    navigationItems.push({ id: "admin", label: "Admin Portal", icon: Shield });
  }

  return (
    <div 
      className="fixed left-0 top-0 h-screen w-64 text-white flex flex-col z-50 border-r border-white/5"
      style={{
        background: "linear-gradient(145deg, rgba(15,23,42,0.98), rgba(30,41,59,0.95))",
        backdropFilter: "blur(24px)",
        boxShadow: "4px 0 24px rgba(0,0,0,0.35)",
      }}
    >
      {/* Subtle Ambient Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[120%] h-[40%] bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[120%] h-[40%] bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      {/* Logo and Brand */}
      <div className="relative p-6 z-10">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="relative group cursor-pointer flex items-center gap-4 mb-2">
            <div className="relative w-12 h-12 flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 rounded-2xl blur-sm opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
              <div className="relative h-full w-full bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-white/10 flex items-center justify-center overflow-hidden shadow-xl ring-1 ring-white/5 group-hover:ring-blue-500/30 transition-all duration-500 group-hover:scale-105">
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Custom Portal Logo if set, else SVG */}
                {portalLogo ? (
                  <motion.img 
                    src={portalLogo} 
                    alt="Logo" 
                    className="w-full h-full object-cover"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                ) : (
                  <motion.svg 
                    className="w-6 h-6 text-blue-400 group-hover:text-white transition-colors duration-500" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="1.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    initial="hidden"
                    animate="visible"
                  >
                    <motion.path 
                      d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" 
                      className="text-blue-500/80 fill-blue-500/20" 
                      variants={{
                        hidden: { pathLength: 0, opacity: 0 },
                        visible: { pathLength: 1, opacity: 1, transition: { duration: 1.2, ease: "easeInOut" } }
                      }}
                    />
                    <motion.path 
                      d="M12 15l-3-3a2.828 2.828 0 1 1 4-4l3 3" 
                      variants={{
                        hidden: { pathLength: 0, opacity: 0 },
                        visible: { pathLength: 1, opacity: 1, transition: { duration: 1.2, ease: "easeInOut", delay: 0.3 } }
                      }}
                    />
                    <motion.path 
                      d="M21 21l-7-7" 
                      variants={{
                        hidden: { pathLength: 0, opacity: 0 },
                        visible: { pathLength: 1, opacity: 1, transition: { duration: 0.8, ease: "easeInOut", delay: 0.6 } }
                      }}
                    />
                    <motion.path 
                      d="m9 9 5 5" 
                      variants={{
                        hidden: { pathLength: 0, opacity: 0 },
                        visible: { pathLength: 1, opacity: 1, transition: { duration: 0.8, ease: "easeInOut", delay: 0.9 } }
                      }}
                    />
                  </motion.svg>
                )}

                {/* Micro-animation shine */}
                <div className="absolute -inset-full top-0 block h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 left-[-100%] transition-transform duration-1000 group-hover:translate-x-[500%]" />
              </div>
            </div>

            <TypingBrand />
          </div>
        </motion.div>
      </div>

      <div className="px-6 mb-2 relative z-10">
        <Separator className="bg-white/5" />
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto relative z-10 no-scrollbar">
        {navigationItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeScreen === item.id;

          return (
            <motion.button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden ${isActive
                ? "text-white shadow-lg shadow-blue-500/10"
                : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              style={isActive ? {
                background: "linear-gradient(135deg, rgba(37,99,235,0.15), rgba(124,58,237,0.08))",
                border: "1px solid rgba(37,99,235,0.3)",
              } : {
                border: "1px solid transparent",
              }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="relative z-10 flex items-center gap-3">
                <div className={`p-1.5 rounded-lg transition-colors duration-300 ${isActive ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "text-gray-500 group-hover:text-blue-400"}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-sm font-medium tracking-wide ${isActive ? "text-white" : "text-gray-400 group-hover:text-white"}`}>
                  {item.label}
                </span>
              </div>

              {!isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-blue-500/50 rounded-r-full group-hover:h-6 transition-all duration-300 opacity-0 group-hover:opacity-100" />
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-4 relative z-10">
        {/* Settings Link */}
        <div className="mb-4">
          <motion.button
            onClick={() => onNavigate("settings")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${activeScreen === "settings"
              ? "text-white shadow-lg shadow-blue-500/10"
              : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            style={activeScreen === "settings" ? {
              background: "linear-gradient(135deg, rgba(37,99,235,0.15), rgba(124,58,237,0.08))",
              border: "1px solid rgba(37,99,235,0.3)",
            } : {
              border: "1px solid transparent",
            }}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className={`p-1.5 rounded-lg transition-colors duration-300 ${activeScreen === "settings" ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "text-gray-500 group-hover:text-blue-400"}`}>
              <Settings className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium tracking-wide">Settings</span>
          </motion.button>
        </div>

        <Separator className="bg-white/5 mb-4" />

        {/* User Profile */}
        <div className="rounded-2xl bg-white/5 p-3 border border-white/5 hover:border-white/10 transition-colors group">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-10 w-10 ring-2 ring-blue-500/30 transition-shadow duration-300 group-hover:ring-blue-500/60">
              {user?.profileImage ? (
                <img src={user.profileImage} alt="Profile" className="object-cover w-full h-full rounded-full" />
              ) : (
                <AvatarFallback className="bg-gradient-to-br from-gray-900 to-gray-800">
                  <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="brainGradientSmall" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#2563EB', stopOpacity: 0.9 }} />
                        <stop offset="100%" style={{ stopColor: '#D4AF37', stopOpacity: 0.7 }} />
                      </linearGradient>
                    </defs>
                    <circle cx="50" cy="50" r="25" fill="url(#brainGradientSmall)" />
                  </svg>
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="text-sm font-medium text-white truncate group-hover:text-blue-200 transition-colors">{user ? `${user.firstName} ${user.lastName}` : "User"}</div>
              <div className="text-xs text-gray-500 truncate font-mono">ID: {user?.universityId || "N/A"}</div>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all text-xs font-medium uppercase tracking-wide border border-transparent hover:border-red-500/20"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div >
  );
}
