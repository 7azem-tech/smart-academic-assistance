import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";

interface SettingsContextType {
  // Appearance
  darkMode: boolean;
  toggleDarkMode: () => void;
  highContrast: boolean;
  toggleHighContrast: () => void;
  largeText: boolean;
  toggleLargeText: () => void;
  animationsEnabled: boolean;
  toggleAnimations: () => void;
  reduceMotion: boolean;
  toggleReduceMotion: () => void;
  accentColor: string;
  setAccentColor: (color: string) => void;
  // Screen Reader
  screenReaderSupport: boolean;
  toggleScreenReaderSupport: () => void;
  speak: (text: string) => void;
  
  // Advanced Accessibility
  dyslexicFont: boolean;
  toggleDyslexicFont: () => void;
  colorBlindnessMode: string;
  setColorBlindnessMode: (mode: string) => void;
  readingGuide: boolean;
  toggleReadingGuide: () => void;
  screenMagnifier: boolean;
  toggleScreenMagnifier: () => void;
  
  // Academic
  academicYear: number;
  setAcademicYear: (year: number) => void;
  // Portal Identity
  portalLogo: string | null;
  setPortalLogo: (logo: string | null) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  // Load from localStorage or use defaults
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("darkMode");
        return saved ? JSON.parse(saved) : false;
      } catch {
        return false;
      }
    }
    return false;
  });

  const [highContrast, setHighContrast] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("highContrast");
        return saved ? JSON.parse(saved) : false;
      } catch {
        return false;
      }
    }
    return false;
  });

  const [largeText, setLargeText] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("largeText");
        return saved ? JSON.parse(saved) : false;
      } catch {
        return false;
      }
    }
    return false;
  });

  const [animationsEnabled, setAnimationsEnabled] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("animationsEnabled");
        return saved ? JSON.parse(saved) : true;
      } catch {
        return true;
      }
    }
    return true;
  });

  const [reduceMotion, setReduceMotion] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("reduceMotion");
        return saved ? JSON.parse(saved) : false;
      } catch {
        return false;
      }
    }
    return false;
  });

  // Calculate academic year based on current semester
  const calculateAcademicYear = (): number => {
    const now = new Date();
    const month = now.getMonth() + 1; // 1-12
    const year = now.getFullYear();
    
    // Academic year typically runs from September to May
    // Fall semester: September (9) - December (12)
    // Spring semester: January (1) - May (5)
    // Summer: June (6) - August (8)
    
    // Determine current semester
    let currentSemester: 'fall' | 'spring' | 'summer';
    if (month >= 9 || month <= 1) {
      currentSemester = 'fall';
    } else if (month >= 2 && month <= 5) {
      currentSemester = 'spring';
    } else {
      currentSemester = 'summer';
    }
    
    // For demo purposes, calculate based on enrollment year
    // Assuming enrollment in 2022 (adjust as needed)
    const enrollmentYear = 2022;
    const yearsSinceEnrollment = year - enrollmentYear;
    
    // Adjust based on semester
    // If it's fall and we're in a new academic year, increment
    if (currentSemester === 'fall' && month >= 9) {
      return Math.min(4, Math.max(1, yearsSinceEnrollment + 1));
    }
    
    return Math.min(4, Math.max(1, yearsSinceEnrollment + 1));
  };

  const [academicYear, setAcademicYear] = useState<number>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("academicYear");
        if (saved) {
          return parseInt(saved);
        }
        // Calculate based on current semester
        return calculateAcademicYear();
      } catch {
        return calculateAcademicYear();
      }
    }
    return calculateAcademicYear();
  });

  const [accentColor, setAccentColor] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("accentColor");
        return saved || "cobalt-blue";
      } catch {
        return "cobalt-blue";
      }
    }
    return "cobalt-blue";
  });

  const [portalLogo, setPortalLogoState] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      try {
        return localStorage.getItem("portalLogo");
      } catch {
        return null;
      }
    }
    return null;
  });

  const setPortalLogo = (logo: string | null) => {
    setPortalLogoState(logo);
    if (logo) {
      localStorage.setItem("portalLogo", logo);
    } else {
      localStorage.removeItem("portalLogo");
    }
  };

  const [screenReaderSupport, setScreenReaderSupport] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("screenReaderSupport");
        return saved ? JSON.parse(saved) : false;
      } catch {
        return false;
      }
    }
    return false;
  });

  const [dyslexicFont, setDyslexicFont] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("dyslexicFont");
        return saved ? JSON.parse(saved) : false;
      } catch {
        return false;
      }
    }
    return false;
  });

  const [colorBlindnessMode, setColorBlindnessMode] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("colorBlindnessMode");
        return saved || "none";
      } catch {
        return "none";
      }
    }
    return "none";
  });

  const [readingGuide, setReadingGuide] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("readingGuide");
        return saved ? JSON.parse(saved) : false;
      } catch {
        return false;
      }
    }
    return false;
  });

  const [screenMagnifier, setScreenMagnifier] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("screenMagnifier");
        return saved ? JSON.parse(saved) : false;
      } catch {
        return false;
      }
    }
    return false;
  });

  // Apply dark mode
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("darkMode", JSON.stringify(darkMode));
        const root = document.documentElement;
        if (darkMode) {
          root.classList.add("dark");
        } else {
          root.classList.remove("dark");
        }
      } catch (error) {
        console.error("Failed to save dark mode preference:", error);
      }
    }
  }, [darkMode]);

  // Apply high contrast
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("highContrast", JSON.stringify(highContrast));
        const root = document.documentElement;
        const body = document.body;
        
        if (highContrast) {
          root.classList.add("high-contrast");
          body.classList.add("high-contrast");
          
          // Force apply high contrast styles
          root.style.setProperty("--background", "#ffffff", "important");
          root.style.setProperty("--foreground", "#000000", "important");
          root.style.setProperty("--border", "#000000", "important");
          root.style.setProperty("--primary", "#000000", "important");
          root.style.setProperty("--primary-foreground", "#ffffff", "important");
        } else {
          root.classList.remove("high-contrast");
          body.classList.remove("high-contrast");
          
          // Reset to default
          root.style.removeProperty("--background");
          root.style.removeProperty("--foreground");
          root.style.removeProperty("--border");
          root.style.removeProperty("--primary");
          root.style.removeProperty("--primary-foreground");
        }
      } catch (error) {
        console.error("Failed to save high contrast preference:", error);
      }
    }
  }, [highContrast]);

  // Apply large text
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("largeText", JSON.stringify(largeText));
        const root = document.documentElement;
        if (largeText) {
          root.classList.add("large-text");
          root.style.fontSize = "18px";
        } else {
          root.classList.remove("large-text");
          root.style.fontSize = "16px";
        }
      } catch (error) {
        console.error("Failed to save large text preference:", error);
      }
    }
  }, [largeText]);

  // Apply animations
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("animationsEnabled", JSON.stringify(animationsEnabled));
        const root = document.documentElement;
        if (!animationsEnabled || reduceMotion) {
          root.classList.add("reduce-motion");
        } else {
          root.classList.remove("reduce-motion");
        }
      } catch (error) {
        console.error("Failed to save animations preference:", error);
      }
    }
  }, [animationsEnabled, reduceMotion]);

  // Apply reduce motion
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("reduceMotion", JSON.stringify(reduceMotion));
        const root = document.documentElement;
        if (reduceMotion) {
          root.classList.add("reduce-motion");
        } else {
          if (animationsEnabled) {
            root.classList.remove("reduce-motion");
          }
        }
      } catch (error) {
        console.error("Failed to save reduce motion preference:", error);
      }
    }
  }, [reduceMotion, animationsEnabled]);

  // Update academic year based on current semester on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      const enrollmentYear = 2022;
      const yearsSinceEnrollment = year - enrollmentYear;
      const calculatedYear = Math.min(4, Math.max(1, yearsSinceEnrollment + 1));
      
      // Only update if different and not manually set by user
      const saved = localStorage.getItem("academicYear");
      if (!saved && calculatedYear !== academicYear) {
        setAcademicYear(calculatedYear);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // Save academic year
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("academicYear", academicYear.toString());
      } catch (error) {
        console.error("Failed to save academic year:", error);
      }
    }
  }, [academicYear]);

  // Apply accent color
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("accentColor", accentColor);
        const root = document.documentElement;
        
        // Remove all accent color classes
        root.classList.remove(
          "accent-cobalt-blue",
          "accent-royal-purple",
          "accent-emerald-green",
          "accent-sunset-orange",
          "accent-rose-pink"
        );
        
        // Add the selected accent color class
        root.classList.add(`accent-${accentColor}`);
        
        // Apply CSS variables based on accent color
        const accentColors: Record<string, { primary: string; secondary: string }> = {
          "cobalt-blue": { primary: "#2563EB", secondary: "#1e40af" },
          "royal-purple": { primary: "#7C3AED", secondary: "#5B21B6" },
          "emerald-green": { primary: "#10B981", secondary: "#059669" },
          "sunset-orange": { primary: "#F97316", secondary: "#EA580C" },
          "rose-pink": { primary: "#EC4899", secondary: "#DB2777" },
        };
        
        const colors = accentColors[accentColor] || accentColors["cobalt-blue"];
        root.style.setProperty("--accent-primary", colors.primary);
        root.style.setProperty("--accent-secondary", colors.secondary);
      } catch (error) {
        console.error("Failed to save accent color preference:", error);
      }
    }
  }, [accentColor]);

  // Apply screen reader support
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("screenReaderSupport", JSON.stringify(screenReaderSupport));
        const root = document.documentElement;
        if (screenReaderSupport) {
          root.classList.add("screen-reader-support");
          root.setAttribute("aria-live", "polite");
          
          const handleGlobalFocus = (e: FocusEvent) => {
            const target = e.target as HTMLElement;
            if (target && screenReaderSupport) {
              const label = target.getAttribute("aria-label") || target.innerText || target.getAttribute("placeholder");
              if (label && label.length < 100) { // Don't read huge blocks
                speak(label);
              }
            }
          };

          document.addEventListener("focusin", handleGlobalFocus);
          speak("Screen reader support enabled. Navigating through the portal will now provide audio feedback.");
          
          return () => {
            document.removeEventListener("focusin", handleGlobalFocus);
          };
        } else {
          root.classList.remove("screen-reader-support");
          root.removeAttribute("aria-live");
          window.speechSynthesis.cancel();
        }
      } catch (error) {
        console.error("Failed to save screen reader support preference:", error);
      }
    }
  }, [screenReaderSupport]);

  const speak = (text: string) => {
    if (typeof window !== "undefined" && screenReaderSupport) {
      window.speechSynthesis.cancel(); // Stop current speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Apply dyslexic font
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("dyslexicFont", JSON.stringify(dyslexicFont));
        const root = document.documentElement;
        if (dyslexicFont) {
          root.classList.add("dyslexic-font");
          speak("Dyslexia friendly font enabled.");
        } else {
          root.classList.remove("dyslexic-font");
        }
      } catch (error) {
        console.error("Failed to save dyslexic font preference:", error);
      }
    }
  }, [dyslexicFont]);

  // Apply color blindness mode
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("colorBlindnessMode", colorBlindnessMode);
        const root = document.documentElement;
        
        // Remove all color blindness classes
        root.classList.remove(
          "color-blind-protanopia",
          "color-blind-deuteranopia",
          "color-blind-tritanopia",
          "color-blind-achromatopsia"
        );
        
        if (colorBlindnessMode !== "none") {
          root.classList.add(`color-blind-${colorBlindnessMode}`);
          speak(`Color blindness mode set to ${colorBlindnessMode}.`);
        }
      } catch (error) {
        console.error("Failed to save color blindness preference:", error);
      }
    }
  }, [colorBlindnessMode]);

  // Apply reading guide
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("readingGuide", JSON.stringify(readingGuide));
        const root = document.documentElement;
        if (readingGuide) {
          root.classList.add("reading-guide-active");
          speak("Reading guide enabled. A highlighting ruler will follow your pointer.");
        } else {
          root.classList.remove("reading-guide-active");
        }
      } catch (error) {
        console.error("Failed to save reading guide preference:", error);
      }
    }
  }, [readingGuide]);

  // Reading guide and magnifier mouse movement
  useEffect(() => {
    if (!readingGuide && !screenMagnifier) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (readingGuide) {
        const guide = document.querySelector(".reading-guide") as HTMLElement;
        if (guide) {
          guide.style.top = `${e.clientY - 12.5}px`;
        }
      }
      
      if (screenMagnifier) {
        // Calculate offset for transform-origin
        const x = (e.clientX / window.innerWidth) * 100;
        const y = (e.clientY / window.innerHeight) * 100;
        document.body.style.transformOrigin = `${x}% ${y}%`;

        // Update the visible HUD lens indicator over the cursor
        const lens = document.querySelector(".smart-lens-hud") as HTMLElement;
        if (lens) {
          // Adjust position considering the body is scaled to 1.4, so mouse coordinates don't directly map 
          // to unscaled fixed positions unless we place the lens outside the scaled body, or calculate locally.
          // Since the lens is fixed and the body is scaled, fixed elements attached to body stay viewport-relative,
          // BUT if body has a transform, `fixed` becomes relative to the body!
          // We'll update the left/top directly.
          lens.style.left = `${e.clientX}px`;
          lens.style.top = `${e.clientY}px`;
        }
      }
    };

    if (screenMagnifier) {
      document.body.style.transform = 'scale(1.4)';
      document.body.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
      document.body.style.overflowX = 'hidden';
      // Enhance cursor experience
      document.body.style.cursor = 'crosshair';
    }

    window.addEventListener("mousemove", handleMouseMove);
    
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (screenMagnifier) {
        document.body.style.transform = '';
        document.body.style.transformOrigin = '';
        document.body.style.transition = '';
        document.body.style.overflowX = '';
        document.body.style.cursor = '';
      }
    };
  }, [readingGuide, screenMagnifier]);

  // Apply screen magnifier
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("screenMagnifier", JSON.stringify(screenMagnifier));
        const root = document.documentElement;
        if (screenMagnifier) {
          root.classList.add("screen-magnifier-active");
          speak("Screen magnifier enabled.");
        } else {
          root.classList.remove("screen-magnifier-active");
        }
      } catch (error) {
        console.error("Failed to save screen magnifier preference:", error);
      }
    }
  }, [screenMagnifier]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);
  const toggleHighContrast = () => setHighContrast((prev) => !prev);
  const toggleLargeText = () => setLargeText((prev) => !prev);
  const toggleAnimations = () => setAnimationsEnabled((prev) => !prev);
  const toggleReduceMotion = () => setReduceMotion((prev) => !prev);
  const toggleScreenReaderSupport = () => setScreenReaderSupport((prev) => !prev);
  const toggleDyslexicFont = () => setDyslexicFont((prev) => !prev);
  const toggleReadingGuide = () => setReadingGuide((prev) => !prev);
  const toggleScreenMagnifier = () => setScreenMagnifier((prev) => !prev);

  return (
    <SettingsContext.Provider
      value={{
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
      }}
    >
      {children}
      
      {/* Accessibility Elements */}
      <div className="reading-guide" />
      
      {/* Hyper-Realistic Magnifying Glass */}
      <AnimatePresence>
        {screenMagnifier && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, rotate: -20 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.9, rotate: 10 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="smart-lens-hud fixed pointer-events-none z-[9999] rounded-full flex items-center justify-center"
            style={{ 
              width: '320px', 
              height: '320px', 
              top: '50%', 
              left: '50%',
              // The primary glass refraction setup: Thick inner and outer shading
              boxShadow: `
                inset 0 0 20px rgba(255, 255, 255, 0.4),
                inset 10px 0 40px rgba(255, 255, 255, 0.5),
                inset -15px 0 40px rgba(0, 0, 0, 0.2),
                inset 0 -15px 40px rgba(0, 0, 0, 0.2),
                0 30px 60px rgba(0, 0, 0, 0.5),
                0 0 0 4px rgba(200, 200, 200, 0.9),
                0 0 0 8px rgba(100, 100, 100, 0.6),
                0 0 0 12px rgba(40, 40, 40, 0.8)
              `,
              // This is a CSS trick: the actual element doesn't have a background to let the DOM below show.
              // We'll mimic the glass 'glow' without obscuring.
              background: 'radial-gradient(130% 130% at 30% 30%, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 50%)',
              // Native CSS backdrop pushing some light distortion
              backdropFilter: 'brightness(1.05) contrast(1.1) saturate(1.2)'
            }}
          >
            {/* Top-Left Glass Arc Glare (Reflection) */}
            <div className="absolute top-[3%] left-[8%] right-[8%] h-[35%] bg-gradient-to-b from-white/40 to-transparent rounded-[100px/40px] mix-blend-overlay" />
            
            {/* Bottom-Right Subtle Inner Rim Lighting */}
            <div className="absolute bottom-[2%] left-[10%] right-[10%] h-[15%] bg-gradient-to-t from-white/10 to-transparent rounded-[100px/30px] mix-blend-overlay" />

            {/* A small exact-center pip to guide the user's actual mouse point */}
            <div className="w-1.5 h-1.5 rounded-full bg-black/30 shadow-[0_0_2px_rgba(255,255,255,0.5)]" />
            
            {/* The Heavy Physical Handle */}
            <div 
              className="absolute w-12 h-44 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-900 rounded-b-xl shadow-2xl border-l border-gray-600/50" 
              style={{ 
                // Positioned EXACTLY to sprout out from the bottom right glass rim 
                bottom: '-120px', 
                right: '-40px', 
                transform: 'rotate(-45deg)',
                transformOrigin: 'top left' 
              }}
            >
              {/* Chrome connecting hinge */}
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-14 h-8 bg-gradient-to-r from-gray-300 via-white to-gray-400 rounded-sm shadow-md border-b-2 border-gray-500" />
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-16 h-3 bg-gradient-to-r from-gray-400 via-gray-200 to-gray-500 rounded-full shadow-lg z-10" />
              
              {/* Wooden or Rubber Grip Texture */}
              <div className="absolute inset-x-2 top-6 bottom-4 rounded-sm bg-[repeating-linear-gradient(0deg,transparent,transparent_6px,rgba(0,0,0,0.3)_6px,rgba(0,0,0,0.3)_8px)]" />
            </div>
            
          </motion.div>
        )}
      </AnimatePresence>
      
      <svg style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden="true">
        <defs>
          <filter id="protanopia">
            <feColorMatrix type="matrix" values="0.567, 0.433, 0, 0, 0, 0.558, 0.442, 0, 0, 0, 0, 0.242, 0.758, 0, 0, 0, 0, 0, 1, 0" />
          </filter>
          <filter id="deuteranopia">
            <feColorMatrix type="matrix" values="0.625, 0.375, 0, 0, 0, 0.7, 0.3, 0, 0, 0, 0, 0.3, 0.7, 0, 0, 0, 0, 0, 1, 0" />
          </filter>
          <filter id="tritanopia">
            <feColorMatrix type="matrix" values="0.95, 0.05, 0, 0, 0, 0, 0.433, 0.567, 0, 0, 0, 0.475, 0.525, 0, 0, 0, 0, 0, 1, 0" />
          </filter>
        </defs>
      </svg>
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}

