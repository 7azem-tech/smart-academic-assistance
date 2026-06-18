import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ZoomIn, ZoomOut, Maximize2, Search, X,
  CheckCircle2, Lock, ArrowRight, Zap,
  Network, Info, BookOpen, AlertTriangle, GraduationCap,
} from "lucide-react";
import { Course, StudentProfile, Term } from "../../services/registrationEngine";

// ── Layout constants ──────────────────────────────────────────────────────────
const NODE_W = 152;
const NODE_H = 62;
const COL_W = 190;  // distance between column left-edges
const ROW_H = 86;
const PAD_X = 56;
const PAD_Y = 54;

// ── Types ─────────────────────────────────────────────────────────────────────
type NodeStatus = "passed" | "failed" | "registered" | "available" | "locked";

interface GraphNode {
  course: Course;
  status: NodeStatus;
  x: number;
  y: number;
}

interface GraphEdge {
  fromId: string; toId: string;
  fromX: number; fromY: number;
  toX: number; toY: number;
  edgeType: "chain" | "unlocked" | "locked";
}

// ── Status style config ───────────────────────────────────────────────────────
const STATUS_CFG = {
  passed: {
    label: "Passed", Icon: CheckCircle2,
    bg: "linear-gradient(135deg,#059669 0%,#0d9488 100%)",
    border: "#10b981",
    glow: "0 0 20px 5px rgba(16,185,129,0.28)",
    text: "#fff", dot: "#6ee7b7",
    edgeColor: "#10b981", edgeDash: "",
    badgeCls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  },
  failed: {
    label: "Failed", Icon: AlertTriangle,
    bg: "linear-gradient(135deg,#e11d48 0%,#be123c 100%)",
    border: "#f43f5e",
    glow: "0 0 20px 5px rgba(244,63,94,0.28)",
    text: "#fff", dot: "#fda4af",
    edgeColor: "#f43f5e", edgeDash: "",
    badgeCls: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  },
  registered: {
    label: "Enrolled", Icon: GraduationCap,
    bg: "linear-gradient(135deg,#0284c7 0%,#2563eb 100%)",
    border: "#0ea5e9",
    glow: "0 0 20px 5px rgba(14,165,233,0.28)",
    text: "#fff", dot: "#7dd3fc",
    edgeColor: "#0ea5e9", edgeDash: "",
    badgeCls: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  },
  available: {
    label: "Available", Icon: Zap,
    bg: "linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%)",
    border: "#818cf8",
    glow: "0 0 16px 4px rgba(99,102,241,0.22)",
    text: "#fff", dot: "#a5b4fc",
    edgeColor: "#6366f1", edgeDash: "",
    badgeCls: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
  },
  locked: {
    label: "Locked", Icon: Lock,
    bg: "linear-gradient(135deg,#1e2937 0%,#0f172a 100%)",
    border: "#334155",
    glow: "none",
    text: "#64748b", dot: "#475569",
    edgeColor: "#334155", edgeDash: "5,4",
    badgeCls: "bg-gray-700/40 text-gray-500 border-gray-700/60",
  },
} satisfies Record<NodeStatus, {
  label: string; Icon: React.FC<any>;
  bg: string; border: string; glow: string;
  text: string; dot: string;
  edgeColor: string; edgeDash: string;
  badgeCls: string;
}>;

// ── Helper ────────────────────────────────────────────────────────────────────
function getNodeStatus(course: Course, student: StudentProfile): NodeStatus {
  if (student.passed.includes(course.id)) return "passed";
  if (student.failed.includes(course.id)) return "failed";
  if (student.registered.includes(course.id)) return "registered";
  const met = course.prerequisites.every(p => student.passed.includes(p));
  return met ? "available" : "locked";
}

// ── Minimap ───────────────────────────────────────────────────────────────────
function Minimap({
  nodes, canvasW, canvasH, pan, zoom, vpW, vpH,
}: {
  nodes: GraphNode[]; canvasW: number; canvasH: number;
  pan: { x: number; y: number }; zoom: number;
  vpW: number; vpH: number;
}) {
  const MW = 118, MH = 68;
  const sx = MW / canvasW, sy = MH / canvasH;

  const rx = (-pan.x / zoom) * sx;
  const ry = (-pan.y / zoom) * sy;
  const rw = Math.min((vpW / zoom) * sx, MW);
  const rh = Math.min((vpH / zoom) * sy, MH);

  return (
    <div className="absolute bottom-14 right-3 z-20 rounded-xl border border-gray-200/60 dark:border-gray-800/70 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md p-2 shadow-lg">
      <div className="text-[7px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-1.5 px-0.5">Minimap</div>
      <svg width={MW} height={MH} className="block rounded-lg overflow-hidden">
        <rect width={MW} height={MH} fill="rgba(0,0,0,0.04)" rx={4} />
        {nodes.map(n => {
          const cfg = STATUS_CFG[n.status];
          return (
            <rect
              key={n.course.id}
              x={n.x * sx} y={n.y * sy}
              width={NODE_W * sx} height={NODE_H * sy}
              rx={2} fill={cfg.border} opacity={0.65}
            />
          );
        })}
        <rect
          x={Math.max(0, rx)} y={Math.max(0, ry)}
          width={rw} height={rh}
          rx={2}
          fill="rgba(99,102,241,0.1)"
          stroke="rgba(99,102,241,0.7)" strokeWidth={1}
        />
      </svg>
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface PrerequisiteGraphProps {
  catalog: Course[];
  student: StudentProfile;
  currentTerm: Term;
}

// ── Main component ─────────────────────────────────────────────────────────────
export function PrerequisiteGraph({ catalog, student, currentTerm }: PrerequisiteGraphProps) {
  const viewportRef = useRef<HTMLDivElement>(null);

  // ── View state ────────────────────────────────────────────────────────────
  const [zoom, setZoom] = useState(0.82);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const zoomRef = useRef(zoom);
  const panRef = useRef(pan);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { panRef.current = pan; }, [pan]);

  const isDragging = useRef(false);
  const dragOrigin = useRef({ mx: 0, my: 0, px: 0, py: 0 });
  const [grabbing, setGrabbing] = useState(false);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<NodeStatus | "all">("all");
  const [vpSize, setVpSize] = useState({ w: 820, h: 570 });

  // Track viewport size
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      setVpSize({ w: e.contentRect.width, h: e.contentRect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Build graph ───────────────────────────────────────────────────────────
  const { nodes, edges, nodeMap, canvasW, canvasH, semesters } = useMemo(() => {
    const semMap = new Map<number, Course[]>();
    catalog.forEach(c => {
      const arr = semMap.get(c.semester) ?? [];
      arr.push(c);
      semMap.set(c.semester, arr);
    });
    const sems = Array.from(semMap.keys()).sort((a, b) => a - b);
    const maxRows = Math.max(...Array.from(semMap.values()).map(g => g.length));

    const cW = PAD_X * 2 + (sems.length - 1) * COL_W + NODE_W;
    const cH = PAD_Y * 2 + (maxRows - 1) * ROW_H + NODE_H;

    const nMap = new Map<string, GraphNode>();
    sems.forEach((sem, ci) => {
      const courses = semMap.get(sem)!;
      const totalH = (courses.length - 1) * ROW_H;
      const startY = (cH - totalH) / 2 - NODE_H / 2;
      courses.forEach((course, ri) => {
        nMap.set(course.id, {
          course,
          status: getNodeStatus(course, student),
          x: PAD_X + ci * COL_W,
          y: startY + ri * ROW_H,
        });
      });
    });

    const edgeList: GraphEdge[] = [];
    catalog.forEach(course => {
      const target = nMap.get(course.id);
      if (!target) return;
      course.prerequisites.forEach(prereqId => {
        const source = nMap.get(prereqId);
        if (!source) return;
        let edgeType: GraphEdge["edgeType"] = "locked";
        if (source.status === "passed")
          edgeType = target.status === "passed" ? "chain" : "unlocked";
        edgeList.push({
          fromId: prereqId, toId: course.id,
          fromX: source.x + NODE_W, fromY: source.y + NODE_H / 2,
          toX: target.x, toY: target.y + NODE_H / 2,
          edgeType,
        });
      });
    });

    return { nodes: Array.from(nMap.values()), edges: edgeList, nodeMap: nMap, canvasW: cW, canvasH: cH, semesters: sems };
  }, [catalog, student]);

  // ── Fit to view ───────────────────────────────────────────────────────────
  const fitToView = useCallback(() => {
    const { w, h } = vpSize;
    const z = Math.min(w / canvasW, h / canvasH) * 0.9;
    const px = (w - canvasW * z) / 2;
    const py = (h - canvasH * z) / 2;
    setZoom(z); setPan({ x: px, y: py });
  }, [vpSize, canvasW, canvasH]);

  useEffect(() => { fitToView(); }, [fitToView]);

  // ── Mouse / wheel events ──────────────────────────────────────────────────
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.1 : -0.1;
      const newZ = Math.max(0.25, Math.min(2, zoomRef.current + delta));
      const rect = el.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const scale = newZ / zoomRef.current;
      setZoom(newZ);
      setPan({ x: cx - scale * (cx - panRef.current.x), y: cy - scale * (cy - panRef.current.y) });
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);

  const onMouseDown = (e: React.MouseEvent) => {
    if ((e.target as Element).closest("[data-node]")) return;
    isDragging.current = true;
    setGrabbing(true);
    dragOrigin.current = { mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragOrigin.current.mx;
    const dy = e.clientY - dragOrigin.current.my;
    setPan({ x: dragOrigin.current.px + dx, y: dragOrigin.current.py + dy });
  };
  const onMouseUp = () => { isDragging.current = false; setGrabbing(false); };

  // ── Related nodes (hover highlight) ──────────────────────────────────────
  const related = useMemo(() => {
    const focusId = hoveredId ?? selectedId;
    if (!focusId) return { prereqs: new Set<string>(), deps: new Set<string>() };
    const prereqs = new Set<string>();
    const deps = new Set<string>();
    // upstream BFS
    const q1 = [focusId];
    while (q1.length) {
      const id = q1.shift()!;
      catalog.find(c => c.id === id)?.prerequisites.forEach(p => {
        if (!prereqs.has(p)) { prereqs.add(p); q1.push(p); }
      });
    }
    // downstream BFS
    const q2 = [focusId];
    while (q2.length) {
      const id = q2.shift()!;
      catalog.forEach(c => {
        if (c.prerequisites.includes(id) && !deps.has(c.id) && c.id !== focusId) {
          deps.add(c.id); q2.push(c.id);
        }
      });
    }
    return { prereqs, deps };
  }, [hoveredId, selectedId, catalog]);

  // ── Search / filter ───────────────────────────────────────────────────────
  const matchedIds = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return new Set(
      nodes.filter(n => {
        const matchQ = !q || n.course.id.toLowerCase().includes(q) || n.course.name.toLowerCase().includes(q);
        const matchF = statusFilter === "all" || n.status === statusFilter;
        return matchQ && matchF;
      }).map(n => n.course.id)
    );
  }, [nodes, searchQuery, statusFilter]);

  // ── Selected course detail ────────────────────────────────────────────────
  const selectedNode = selectedId ? nodeMap.get(selectedId) ?? null : null;
  const selPrereqs = selectedNode?.course.prerequisites.map(id => catalog.find(c => c.id === id)).filter(Boolean) as Course[];
  const selDeps = selectedNode ? catalog.filter(c => c.prerequisites.includes(selectedNode.course.id)) : [];

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const c: Record<NodeStatus, number> = { passed: 0, failed: 0, registered: 0, available: 0, locked: 0 };
    nodes.forEach(n => c[n.status]++);
    return c;
  }, [nodes]);

  const focusId = hoveredId ?? selectedId;
  const hasFilter = searchQuery || statusFilter !== "all";

  // ── Bezier path ───────────────────────────────────────────────────────────
  const bPath = (e: GraphEdge) => {
    const cx = Math.abs(e.toX - e.fromX) * 0.45;
    return `M${e.fromX},${e.fromY} C${e.fromX + cx},${e.fromY} ${e.toX - cx},${e.toY} ${e.toX},${e.toY}`;
  };

  return (
    <div className="space-y-5">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {/* Row 1: Icon + title */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
              boxShadow: "0 4px 14px rgba(124,58,237,0.35)",
            }}
          >
            <Network className="w-5 h-5" style={{ color: "#fff" }} />
          </div>
          <div>
            <h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tight leading-tight">
              Prerequisite Dependency Graph
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
              {nodes.length} courses · {semesters.length} semesters · scroll to zoom · drag to pan · click a node to inspect
            </p>
          </div>
        </div>

        {/* Row 2: Status filter pills */}
        <div className="flex items-center gap-2 flex-wrap pt-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mr-1">Filter:</span>
          {(Object.entries(STATUS_CFG) as [NodeStatus, typeof STATUS_CFG[NodeStatus]][]).map(([status, cfg]) => (
            <button
              key={status}
              onClick={() => setStatusFilter(prev => prev === status ? "all" : status)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all duration-200 cursor-pointer ${statusFilter === status
                  ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-transparent shadow-sm"
                  : "bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-700"
                }`}
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cfg.dot }} />
              {cfg.label}
              <span className="font-mono text-[10px] opacity-60">{stats[status]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-shrink-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by course ID or name…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 pr-9 py-2.5 text-sm font-medium w-64 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/50 transition-all shadow-sm"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer">
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        {statusFilter !== "all" && (
          <button
            onClick={() => setStatusFilter("all")}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-2.5 rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-900/50 text-violet-700 dark:text-violet-400 cursor-pointer hover:bg-violet-100 dark:hover:bg-violet-950/50 transition-colors shadow-sm"
          >
            <X className="w-3.5 h-3.5" /> Clear Filter
          </button>
        )}

        <div className="flex-1" />

        <button
          onClick={fitToView}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 transition-all cursor-pointer shadow-sm"
        >
          <Maximize2 className="w-4 h-4" /> Fit View
        </button>
      </div>

      {/* ── Graph Viewport ───────────────────────────────────────────────────── */}
      <div
        className="relative rounded-2xl overflow-hidden border border-gray-200/60 dark:border-gray-800/80 shadow-xl"
        style={{
          height: 570,
          background: "radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.04) 0%, transparent 70%), #f8fafc",
        }}
      >
        {/* Dot-grid background */}
        <div
          className="absolute inset-0 pointer-events-none dark:opacity-30 opacity-60"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(99,102,241,0.18) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
          }}
        />

        {/* Draggable canvas */}
        <div
          ref={viewportRef}
          className="w-full h-full select-none"
          style={{ cursor: grabbing ? "grabbing" : "grab" }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        >
          <div
            style={{
              position: "absolute", left: 0, top: 0,
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "0 0",
              width: canvasW, height: canvasH,
            }}
          >
            {/* ── SVG: edges + labels ─────────────────────────────────────── */}
            <svg
              width={canvasW} height={canvasH}
              style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}
            >
              <defs>
                {/* Animated flow gradient for passed chains */}
                <linearGradient id="grad-chain" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#059669" stopOpacity="0.55" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.9" />
                </linearGradient>
                <linearGradient id="grad-unlocked" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity="0.85" />
                </linearGradient>
                <linearGradient id="grad-locked" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#1e293b" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#334155" stopOpacity="0.2" />
                </linearGradient>

                {/* Arrow markers */}
                {(["chain", "unlocked", "locked"] as const).map(t => {
                  const color = t === "chain" ? "#10b981" : t === "unlocked" ? "#818cf8" : "#475569";
                  return (
                    <marker key={t} id={`arr-${t}`} markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                      <path d="M0,0 L0,6 L8,3 z" fill={color} fillOpacity={t === "locked" ? 0.25 : 0.7} />
                    </marker>
                  );
                })}

                {/* Glow filter */}
                <filter id="edge-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2.5" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>

                {/* Animated dash for flowing chain edges */}
                <style>{`
                  @keyframes dashflow { from { stroke-dashoffset: 20; } to { stroke-dashoffset: 0; } }
                  .edge-flow { animation: dashflow 1.8s linear infinite; }
                `}</style>
              </defs>

              {/* Semester column bands */}
              {semesters.map((sem, ci) => {
                const year = Math.ceil(sem / 2);
                const half = sem % 2 === 0 ? 2 : 1;
                return (
                  <g key={`col-${sem}`}>
                    <rect
                      x={PAD_X + ci * COL_W - 14} y={20}
                      width={NODE_W + 28} height={canvasH - 40}
                      rx={14}
                      fill={ci % 2 === 0 ? "rgba(255,255,255,0.45)" : "rgba(248,250,252,0.3)"}
                      stroke="rgba(99,102,241,0.06)"
                      strokeWidth={1}
                    />
                    <text
                      x={PAD_X + ci * COL_W + NODE_W / 2} y={36}
                      textAnchor="middle"
                      fill="#94a3b8"
                      fontSize={8.5} fontWeight={800}
                      fontFamily="ui-monospace,monospace"
                      letterSpacing="0.08em"
                    >
                      Y{year}·S{half}
                    </text>
                  </g>
                );
              })}

              {/* Edges */}
              {edges.map((edge, idx) => {
                const isRelated = focusId ? (
                  (related.prereqs.has(edge.fromId) && edge.toId === focusId) ||
                  (edge.fromId === focusId) ||
                  (related.prereqs.has(edge.fromId) && related.prereqs.has(edge.toId)) ||
                  (related.deps.has(edge.toId) && (related.deps.has(edge.fromId) || edge.fromId === focusId))
                ) : false;

                const isDimmed = !!focusId && !isRelated;
                const isSearchDimmed = hasFilter && !matchedIds.has(edge.fromId) && !matchedIds.has(edge.toId);
                const opacity = isSearchDimmed ? 0.04 : isDimmed ? 0.04 : isRelated ? 1 : focusId ? 0.08 : 0.42;
                const strokeW = isRelated ? 2.8 : 1.5;

                const gradId = `grad-${edge.edgeType}`;

                return (
                  <g key={idx}>
                    {/* Base edge */}
                    <path
                      d={bPath(edge)}
                      fill="none"
                      stroke={`url(#${gradId})`}
                      strokeWidth={strokeW}
                      strokeDasharray={edge.edgeType === "locked" ? "5,4" : undefined}
                      markerEnd={`url(#arr-${edge.edgeType})`}
                      opacity={opacity}
                      filter={isRelated ? "url(#edge-glow)" : undefined}
                      style={{ transition: "opacity 0.25s, stroke-width 0.2s" }}
                    />
                    {/* Animated flow line for passed chains */}
                    {edge.edgeType === "chain" && (
                      <path
                        className="edge-flow"
                        d={bPath(edge)}
                        fill="none"
                        stroke="rgba(16,185,129,0.55)"
                        strokeWidth={1}
                        strokeDasharray="6,10"
                        opacity={isRelated ? 1 : isDimmed || isSearchDimmed ? 0 : 0.55}
                        style={{ transition: "opacity 0.25s" }}
                      />
                    )}
                  </g>
                );
              })}
            </svg>

            {/* ── Nodes ───────────────────────────────────────────────────── */}
            {nodes.map(node => {
              const cfg = STATUS_CFG[node.status];
              const isSel = node.course.id === selectedId;
              const isHov = node.course.id === hoveredId;
              const isPrereq = focusId ? related.prereqs.has(node.course.id) : false;
              const isDep = focusId ? related.deps.has(node.course.id) : false;
              const isFocus = node.course.id === focusId;

              const dimmedByFocus = !!focusId && !isFocus && !isPrereq && !isDep;
              const dimmedByFilter = hasFilter && !matchedIds.has(node.course.id);
              const isDimmed = dimmedByFocus || dimmedByFilter;
              const isActive = isSel || isHov;

              const borderColor = isPrereq
                ? "#f59e0b"   // amber for prerequisites
                : isDep
                  ? "#a78bfa" // violet for dependents
                  : isFocus || isSel
                    ? cfg.border
                    : "rgba(255,255,255,0.10)";

              return (
                <div
                  key={node.course.id}
                  data-node="1"
                  style={{
                    position: "absolute",
                    left: node.x, top: node.y,
                    width: NODE_W, height: NODE_H,
                    background: cfg.bg,
                    border: `1.5px solid ${borderColor}`,
                    borderRadius: 14,
                    boxShadow: isActive
                      ? `${cfg.glow}, 0 6px 24px rgba(0,0,0,0.28)`
                      : "0 2px 10px rgba(0,0,0,0.20)",
                    opacity: isDimmed ? 0.1 : 1,
                    cursor: "pointer",
                    transform: isActive ? "scale(1.05)" : "scale(1)",
                    transition: "opacity 0.22s, transform 0.15s ease, box-shadow 0.2s, border-color 0.2s",
                    zIndex: isSel ? 20 : isHov ? 15 : 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    padding: "8px 11px",
                    gap: 2,
                    userSelect: "none",
                    overflow: "hidden",
                  }}
                  onMouseEnter={() => setHoveredId(node.course.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => setSelectedId(prev => prev === node.course.id ? null : node.course.id)}
                >
                  {/* Shimmer layer */}
                  <div style={{
                    position: "absolute", inset: 0, borderRadius: 13, pointerEvents: "none",
                    background: "linear-gradient(135deg,rgba(255,255,255,0.14) 0%,rgba(255,255,255,0) 55%)",
                  }} />

                  {/* Lock badge */}
                  {node.status === "locked" && (
                    <div style={{ position: "absolute", top: 6, right: 8, opacity: 0.45 }}>
                      <Lock size={11} color={cfg.dot} />
                    </div>
                  )}
                  {/* Prereq highlight badge */}
                  {isPrereq && focusId && (
                    <div style={{ position: "absolute", top: -6, right: -6, width: 14, height: 14, borderRadius: "50%", background: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <ArrowRight size={8} color="#fff" />
                    </div>
                  )}

                  {/* Course ID + credits */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{
                      fontFamily: "ui-monospace,monospace",
                      fontSize: 8.5, fontWeight: 900,
                      color: cfg.dot,
                      background: "rgba(0,0,0,0.22)",
                      padding: "1px 5px", borderRadius: 5,
                      letterSpacing: "0.06em",
                    }}>
                      {node.course.id}
                    </span>
                    <span style={{
                      fontSize: 7.5, fontWeight: 800,
                      color: "rgba(255,255,255,0.40)",
                      fontFamily: "ui-monospace,monospace",
                    }}>
                      {node.course.credits}CH
                    </span>
                  </div>

                  {/* Course name */}
                  <span style={{
                    fontSize: 9.5, fontWeight: 700, lineHeight: 1.3,
                    color: cfg.text,
                    opacity: node.status === "locked" ? 0.55 : 0.92,
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical" as const,
                  }}>
                    {node.course.name}
                  </span>

                  {/* Micro stats */}
                  <div style={{ display: "flex", gap: 6, marginTop: 1 }}>
                    {node.course.prerequisites.length > 0 && (
                      <span style={{ fontSize: 7, fontWeight: 800, color: "rgba(255,255,255,0.30)", fontFamily: "ui-monospace,monospace" }}>
                        ↑{node.course.prerequisites.length}
                      </span>
                    )}
                    {(node.course.dependencyCount ?? 0) > 0 && (
                      <span style={{ fontSize: 7, fontWeight: 800, color: "rgba(255,255,255,0.30)", fontFamily: "ui-monospace,monospace" }}>
                        ↓{node.course.dependencyCount}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Zoom Controls ──────────────────────────────────────────────────── */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-20">
          {[
            { icon: ZoomIn, fn: () => setZoom(z => Math.min(2, z + 0.12)) },
            { icon: ZoomOut, fn: () => setZoom(z => Math.max(0.25, z - 0.12)) },
            { icon: Maximize2, fn: fitToView },
          ].map(({ icon: Icon, fn }, i) => (
            <button
              key={i}
              onClick={fn}
              className="w-8 h-8 rounded-xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border border-gray-200/80 dark:border-gray-800/80 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-900 shadow-sm cursor-pointer transition-colors"
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}
          <div className="w-8 text-center text-[8.5px] font-black text-gray-400 dark:text-gray-600 font-mono mt-0.5">
            {Math.round(zoom * 100)}%
          </div>
        </div>

        {/* ── Legend ─────────────────────────────────────────────────────────── */}
        <div className="absolute bottom-3 left-3 z-20 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md rounded-xl border border-gray-200/60 dark:border-gray-800/70 p-2.5 shadow-md space-y-1">
          <div className="text-[7px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-1.5">Legend</div>
          {(Object.entries(STATUS_CFG) as [NodeStatus, typeof STATUS_CFG[NodeStatus]][]).map(([status, cfg]) => (
            <div key={status} className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-[4px] shrink-0" style={{ background: cfg.bg }} />
              <span className="text-[9px] font-bold text-gray-600 dark:text-gray-400 w-16">{cfg.label}</span>
            </div>
          ))}
          <div className="border-t border-gray-200 dark:border-gray-800 my-1.5 pt-1.5 space-y-1">
            {[
              { stroke: "#10b981", dash: "", label: "Passed chain" },
              { stroke: "#818cf8", dash: "", label: "Unlocked path" },
              { stroke: "#475569", dash: "4,3", label: "Locked path" },
            ].map(({ stroke, dash, label }) => (
              <div key={label} className="flex items-center gap-2">
                <svg width={22} height={8} className="shrink-0">
                  <line x1={0} y1={4} x2={22} y2={4} stroke={stroke} strokeWidth={1.5} strokeDasharray={dash || undefined} />
                </svg>
                <span className="text-[8.5px] font-semibold text-gray-500 dark:text-gray-500">{label}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 mt-1">
              <span className="w-3.5 h-3.5 rounded-full shrink-0 border-2 border-amber-400 bg-transparent" />
              <span className="text-[8.5px] font-semibold text-gray-500 dark:text-gray-500">Prerequisite</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full shrink-0 border-2 border-violet-400 bg-transparent" />
              <span className="text-[8.5px] font-semibold text-gray-500 dark:text-gray-500">Dependent</span>
            </div>
          </div>
        </div>

        {/* ── Minimap ─────────────────────────────────────────────────────────── */}
        <Minimap
          nodes={nodes} canvasW={canvasW} canvasH={canvasH}
          pan={pan} zoom={zoom} vpW={vpSize.w} vpH={vpSize.h}
        />

        {/* ── Node Detail Panel ────────────────────────────────────────────────── */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 20, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.97 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="absolute top-3 right-14 z-30 w-60 rounded-2xl border border-gray-200/70 dark:border-gray-800/80 bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl shadow-2xl overflow-hidden"
            >
              {/* Colored header */}
              <div className="relative overflow-hidden p-3.5" style={{ background: STATUS_CFG[selectedNode.status].bg }}>
                <div className="absolute inset-0" style={{ background: "linear-gradient(135deg,rgba(255,255,255,0.13) 0%,transparent 60%)", pointerEvents: "none" }} />
                <div className="relative">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="font-mono text-[8.5px] font-black bg-black/25 px-2 py-0.5 rounded-md text-white/80 tracking-wider">
                      {selectedNode.course.id}
                    </span>
                    <button
                      onClick={() => setSelectedId(null)}
                      className="w-5 h-5 rounded-full bg-black/20 flex items-center justify-center cursor-pointer shrink-0 hover:bg-black/35 transition-colors"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                  <div className="text-sm font-black text-white leading-tight">{selectedNode.course.name}</div>
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <span className="text-[8.5px] font-bold text-white/60">{selectedNode.course.credits} CH</span>
                    <span className="w-1 h-1 rounded-full bg-white/30" />
                    <span className="text-[8.5px] font-bold text-white/60">Sem {selectedNode.course.semester}</span>
                    <span className="w-1 h-1 rounded-full bg-white/30" />
                    <span className="text-[8.5px] font-black px-1.5 py-0.5 rounded-md bg-white/15 text-white">
                      {STATUS_CFG[selectedNode.status].label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-3.5 space-y-3.5">
                {/* Prerequisites */}
                <div>
                  <div className="text-[7.5px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-1.5 flex items-center gap-1.5">
                    <ArrowRight className="w-3 h-3 rotate-180" />
                    Requires ({selPrereqs?.length ?? 0})
                  </div>
                  {selPrereqs && selPrereqs.length > 0 ? (
                    <div className="space-y-1 max-h-28 overflow-y-auto">
                      {selPrereqs.map(c => {
                        const s = getNodeStatus(c, student);
                        const scfg = STATUS_CFG[s];
                        return (
                          <button
                            key={c.id}
                            onClick={() => setSelectedId(c.id)}
                            className="w-full flex items-center justify-between p-1.5 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-800/60 hover:border-gray-300 dark:hover:border-gray-700 transition-colors cursor-pointer text-left"
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: scfg.dot }} />
                              <span className="font-mono text-[8px] font-black text-gray-500 dark:text-gray-400 shrink-0">{c.id}</span>
                              <span className="text-[8px] font-semibold text-gray-400 dark:text-gray-500 truncate">{c.name}</span>
                            </div>
                            <span className="text-[7px] font-black shrink-0 ml-1" style={{ color: scfg.dot }}>{scfg.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[9px] text-gray-400 dark:text-gray-600 italic">No prerequisites — foundational course</p>
                  )}
                </div>

                {/* Unlocks */}
                <div>
                  <div className="text-[7.5px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-1.5 flex items-center gap-1.5">
                    <ArrowRight className="w-3 h-3" />
                    Unlocks ({selDeps.length})
                  </div>
                  {selDeps.length > 0 ? (
                    <div className="space-y-1 max-h-28 overflow-y-auto">
                      {selDeps.map(c => (
                        <button
                          key={c.id}
                          onClick={() => setSelectedId(c.id)}
                          className="w-full flex items-center gap-1.5 p-1.5 bg-indigo-50/50 dark:bg-indigo-950/10 rounded-lg border border-indigo-100/60 dark:border-indigo-900/20 hover:border-indigo-300/60 dark:hover:border-indigo-800/50 transition-colors cursor-pointer text-left"
                        >
                          <ArrowRight className="w-3 h-3 text-indigo-400 shrink-0" />
                          <span className="font-mono text-[8px] font-black text-indigo-500 dark:text-indigo-400 shrink-0">{c.id}</span>
                          <span className="text-[8px] font-semibold text-gray-500 dark:text-gray-400 truncate">{c.name}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[9px] text-gray-400 dark:text-gray-600 italic">Terminal course — no dependents</p>
                  )}
                </div>

                {/* Available terms */}
                <div className="flex items-center gap-2 pt-1 border-t border-gray-100 dark:border-gray-800/60">
                  <span className="text-[7.5px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-600">Offered:</span>
                  <div className="flex gap-1">
                    {selectedNode.course.availableTerms.map(t => (
                      <span key={t} className={`text-[8px] font-black px-2 py-0.5 rounded-md border ${t === currentTerm
                          ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                          : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400"
                        }`}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Idle hint ─────────────────────────────────────────────────────── */}
        {!selectedNode && !hoveredId && (
          <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 text-[8.5px] font-bold text-gray-400 dark:text-gray-600 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-gray-200/60 dark:border-gray-800/60">
            <Info className="w-3 h-3" />
            Click node to inspect · Hover to trace paths
          </div>
        )}
      </div>

      {/* ── Bottom stat cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 pt-1">
        {([
          { label: "Total Courses", value: nodes.length, Icon: BookOpen, color: "text-gray-700 dark:text-gray-300", bg: "bg-white dark:bg-gray-950" },
          { label: "Passed", value: stats.passed, Icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50/60 dark:bg-emerald-950/20" },
          { label: "Available", value: stats.available, Icon: Zap, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50/60 dark:bg-indigo-950/20" },
          { label: "Failed", value: stats.failed, Icon: AlertTriangle, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50/60 dark:bg-rose-950/20" },
          { label: "Locked", value: stats.locked, Icon: Lock, color: "text-gray-500 dark:text-gray-500", bg: "bg-gray-50 dark:bg-gray-900/50" },
        ] as const).map(({ label, value, Icon, color, bg }) => (
          <div key={label} className={`flex items-center gap-4 px-5 py-4 rounded-2xl border border-gray-200/70 dark:border-gray-800/80 shadow-sm ${bg}`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-white/80 dark:bg-gray-900/60 shadow-sm border border-gray-100 dark:border-gray-800`}>
              <Icon className={`w-4.5 h-4.5 ${color}`} style={{ width: 18, height: 18 }} />
            </div>
            <div>
              <div className={`text-2xl font-black font-mono leading-none tracking-tight ${color}`}>{value}</div>
              <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mt-1">{label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
