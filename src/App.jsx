import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Check, Circle, Flame, Zap, Trophy, Star, Plus, Pencil, Trash2,
  Dumbbell, Bike, Droplets, Pill, Target, ChevronLeft, BarChart3,
  Award, Swords, Heart, X, Settings, Sparkles, Crown, Shield,
  Rocket, Brain, BookOpen, Music, Moon, Apple, Footprints,
  Timer, Coffee, Salad, ArrowUp, Medal, TrendingUp, CalendarCheck,
  CircleDot, Loader2, Sunrise, Sun, Sunset
} from "lucide-react";

// ═══════════════════════════════════════════════════
//  SUPABASE CONFIG — reads from Vercel env variables
// ═══════════════════════════════════════════════════
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// ═══════════════════════════════════════════════════
//  STORAGE LAYER
// ═══════════════════════════════════════════════════
const useSupabase = SUPABASE_URL && SUPABASE_ANON_KEY;

const supabaseHeaders = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=minimal",
};

async function loadFromSupabase() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/app_state?id=eq.default&select=data`, {
      headers: supabaseHeaders,
    });
    const rows = await res.json();
    return rows?.[0]?.data || null;
  } catch (e) {
    console.warn("Supabase load failed:", e);
    return null;
  }
}

async function saveToSupabase(data) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/app_state`, {
      method: "POST",
      headers: { ...supabaseHeaders, Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify({ id: "default", data, updated_at: new Date().toISOString() }),
    });
  } catch (e) {
    console.warn("Supabase save failed:", e);
  }
}

function loadFromLocal() {
  try {
    const raw = localStorage.getItem("daily-quest-data");
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveToLocal(data) {
  try {
    localStorage.setItem("daily-quest-data", JSON.stringify(data));
  } catch {}
}

async function loadState() {
  if (useSupabase) {
    const data = await loadFromSupabase();
    if (data) return data;
  }
  return loadFromLocal();
}

function persistState(data) {
  saveToLocal(data);
  if (useSupabase) saveToSupabase(data);
}

// ═══════════════════════════════════════════════════
//  ICON REGISTRY
// ═══════════════════════════════════════════════════
const ICONS = {
  dumbbell: { component: Dumbbell, label: "Forza" },
  footprints: { component: Footprints, label: "Salti" },
  bike: { component: Bike, label: "Bici" },
  droplets: { component: Droplets, label: "Acqua" },
  pill: { component: Pill, label: "Pillola" },
  heart: { component: Heart, label: "Salute" },
  brain: { component: Brain, label: "Mente" },
  target: { component: Target, label: "Obiettivo" },
  timer: { component: Timer, label: "Tempo" },
  coffee: { component: Coffee, label: "Drink" },
  salad: { component: Salad, label: "Cibo" },
  moon: { component: Moon, label: "Sonno" },
  bookOpen: { component: BookOpen, label: "Lettura" },
  music: { component: Music, label: "Musica" },
  rocket: { component: Rocket, label: "Sprint" },
  apple: { component: Apple, label: "Frutta" },
};

const ICON_KEYS = Object.keys(ICONS);

const TaskIcon = ({ icon, size = 22, color = "currentColor", ...props }) => {
  const entry = ICONS[icon];
  if (!entry) return <Target size={size} color={color} {...props} />;
  const Comp = entry.component;
  return <Comp size={size} color={color} {...props} />;
};

// ═══════════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════════
const PERIODS = [
  { id: "morning", label: "Mattina", Icon: Sunrise, color: "#F59E0B" },
  { id: "afternoon", label: "Pomeriggio", Icon: Sun, color: "#EF4444" },
  { id: "evening", label: "Sera", Icon: Sunset, color: "#8B5CF6" },
];

const DEFAULT_TASKS = [
  { id: "t1", name: "Integratori", target: "dose giornaliera", icon: "pill", xp: 10, period: "morning" },
  { id: "t2", name: "Addominali", target: "10 ripetizioni", icon: "dumbbell", xp: 15, period: "morning" },
  { id: "t3", name: "Salti con la corda", target: "100 salti", icon: "footprints", xp: 20, period: "afternoon" },
  { id: "t4", name: "Bici", target: "10 km", icon: "bike", xp: 30, period: "afternoon" },
  { id: "t5", name: "Bere acqua", target: "2 litri", icon: "droplets", xp: 10, period: "evening" },
];

const LEVELS = [
  { level: 1, title: "Principiante", xpNeeded: 0, Icon: Footprints, color: "#78B87A" },
  { level: 2, title: "Apprendista", xpNeeded: 100, Icon: TrendingUp, color: "#4ECDC4" },
  { level: 3, title: "Guerriero", xpNeeded: 300, Icon: Swords, color: "#45B7D1" },
  { level: 4, title: "Campione", xpNeeded: 600, Icon: Shield, color: "#667eea" },
  { level: 5, title: "Eroe", xpNeeded: 1000, Icon: Star, color: "#A855F7" },
  { level: 6, title: "Leggenda", xpNeeded: 1500, Icon: Crown, color: "#F59E0B" },
  { level: 7, title: "Mito", xpNeeded: 2500, Icon: Zap, color: "#EF4444" },
  { level: 8, title: "Titano", xpNeeded: 4000, Icon: Flame, color: "#EC4899" },
  { level: 9, title: "Semidio", xpNeeded: 6000, Icon: Sparkles, color: "#8B5CF6" },
  { level: 10, title: "Immortale", xpNeeded: 10000, Icon: Trophy, color: "#FFD700" },
];

const BADGES = [
  { id: "first_task", name: "Primo Passo", Icon: Footprints, desc: "Completa il tuo primo task", condition: (s) => s.totalCompleted >= 1 },
  { id: "full_day", name: "Giornata Perfetta", Icon: Sparkles, desc: "Completa tutti i task in un giorno", condition: (s) => s.perfectDays >= 1 },
  { id: "streak_3", name: "Tre di Fuoco", Icon: Flame, desc: "3 giorni di streak", condition: (s) => s.maxStreak >= 3 },
  { id: "streak_7", name: "Settimana d'Oro", Icon: Medal, desc: "7 giorni di streak", condition: (s) => s.maxStreak >= 7 },
  { id: "streak_14", name: "Due Settimane!", Icon: Dumbbell, desc: "14 giorni di streak", condition: (s) => s.maxStreak >= 14 },
  { id: "streak_30", name: "Mese Leggendario", Icon: Crown, desc: "30 giorni di streak", condition: (s) => s.maxStreak >= 30 },
  { id: "tasks_10", name: "Dieci e Lode", Icon: Target, desc: "Completa 10 task totali", condition: (s) => s.totalCompleted >= 10 },
  { id: "tasks_50", name: "Cinquanta!", Icon: Rocket, desc: "50 task completati", condition: (s) => s.totalCompleted >= 50 },
  { id: "tasks_100", name: "Centurione", Icon: Shield, desc: "100 task completati", condition: (s) => s.totalCompleted >= 100 },
  { id: "tasks_500", name: "Macchina da Guerra", Icon: Swords, desc: "500 task completati", condition: (s) => s.totalCompleted >= 500 },
  { id: "xp_1000", name: "Mille XP!", Icon: Zap, desc: "Accumula 1000 XP", condition: (s) => s.totalXP >= 1000 },
  { id: "xp_5000", name: "XP Master", Icon: Sparkles, desc: "Accumula 5000 XP", condition: (s) => s.totalXP >= 5000 },
  { id: "perfect_5", name: "Cinque Perfetti", Icon: Star, desc: "5 giornate perfette", condition: (s) => s.perfectDays >= 5 },
  { id: "perfect_20", name: "Perfezione Assoluta", Icon: Trophy, desc: "20 giornate perfette", condition: (s) => s.perfectDays >= 20 },
  { id: "level_5", name: "Livello Eroe", Icon: Award, desc: "Raggiungi il livello 5", condition: (s) => s.currentLevel >= 5 },
  { id: "level_10", name: "Immortale", Icon: Trophy, desc: "Raggiungi il livello 10", condition: (s) => s.currentLevel >= 10 },
];

const getToday = () => new Date().toISOString().slice(0, 10);
const getLevel = (xp) => { let l = LEVELS[0]; for (const lv of LEVELS) { if (xp >= lv.xpNeeded) l = lv; else break; } return l; };
const getNextLevel = (xp) => { for (const l of LEVELS) { if (xp < l.xpNeeded) return l; } return null; };
const uid = () => "t" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

// ═══════════════════════════════════════════════════
//  CONFETTI
// ═══════════════════════════════════════════════════
const Confetti = ({ active }) => {
  const canvasRef = useRef(null);
  const particles = useRef([]);
  const frame = useRef(null);

  useEffect(() => {
    if (!active) return;
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    c.width = window.innerWidth;
    c.height = window.innerHeight;
    const colors = ["#FF6B6B", "#FFE66D", "#4ECDC4", "#45B7D1", "#96E6A1", "#DDA0DD", "#FF9A8B", "#FAD961", "#A855F7", "#667eea"];

    for (let i = 0; i < 90; i++) {
      particles.current.push({
        x: Math.random() * c.width,
        y: -20 - Math.random() * 300,
        vx: (Math.random() - 0.5) * 8,
        vy: Math.random() * 4 + 2,
        size: Math.random() * 7 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 12,
        life: 1,
        shape: Math.random() > 0.5 ? "rect" : "circle",
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      let alive = false;
      particles.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08;
        p.rotation += p.rotSpeed;
        p.life -= 0.006;
        if (p.life <= 0) return;
        alive = true;
        ctx.globalAlpha = p.life;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        }
        ctx.restore();
      });
      ctx.globalAlpha = 1;
      if (alive) frame.current = requestAnimationFrame(animate);
      else particles.current = [];
    };
    animate();
    return () => { cancelAnimationFrame(frame.current); particles.current = []; };
  }, [active]);

  if (!active) return null;
  return <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9999 }} />;
};

// ═══════════════════════════════════════════════════
//  ANIMATED NUMBER
// ═══════════════════════════════════════════════════
const AnimNum = ({ value, duration = 500 }) => {
  const [disp, setDisp] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    const s = prev.current, d = value - s;
    if (d === 0) return;
    const t0 = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - t0) / duration, 1);
      setDisp(Math.round(s + d * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(tick);
    };
    tick();
    prev.current = value;
  }, [value, duration]);
  return <span>{disp}</span>;
};

// ═══════════════════════════════════════════════════
//  MAIN APP
// ═══════════════════════════════════════════════════
const INITIAL_STATE = {
  tasks: DEFAULT_TASKS,
  completedByDate: {},
  totalXP: 0,
  totalCompleted: 0,
  streak: 0,
  maxStreak: 0,
  perfectDays: 0,
  earnedBadges: [],
  lastPerfectDate: null,
  lastActiveDate: null,
};

export default function DailyQuestTracker() {
  const [loaded, setLoaded] = useState(false);
  const [tasks, setTasks] = useState(INITIAL_STATE.tasks);
  const [completedByDate, setCompletedByDate] = useState({});
  const [totalXP, setTotalXP] = useState(0);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [perfectDays, setPerfectDays] = useState(0);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [lastPerfectDate, setLastPerfectDate] = useState(null);

  const [showConfetti, setShowConfetti] = useState(false);
  const [newBadge, setNewBadge] = useState(null);
  const [levelUpInfo, setLevelUpInfo] = useState(null);
  const [lastDoneId, setLastDoneId] = useState(null);
  const [view, setView] = useState("tasks");
  const [addForm, setAddForm] = useState({ name: "", target: "", icon: "dumbbell", xp: 15, period: "morning" });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", target: "", icon: "", xp: 0, period: "morning" });
  const [setupMode, setSetupMode] = useState(false);

  const today = getToday();
  const completed = completedByDate[today] || {};
  const completedCount = tasks.filter((t) => completed[t.id]).length;
  const progress = tasks.length > 0 ? completedCount / tasks.length : 0;
  const allDone = tasks.length > 0 && completedCount === tasks.length;
  const currentLevel = getLevel(totalXP);
  const nextLevel = getNextLevel(totalXP);
  const xpForLevel = nextLevel ? nextLevel.xpNeeded - currentLevel.xpNeeded : 1;
  const xpInLevel = totalXP - currentLevel.xpNeeded;
  const levelProgress = nextLevel ? xpInLevel / xpForLevel : 1;
  const LevelIcon = currentLevel.Icon;

  // ─── PERSISTENCE ───
  const stateRef = useRef(null);

  const gatherState = useCallback(() => ({
    tasks, completedByDate, totalXP, totalCompleted, streak, maxStreak, perfectDays, earnedBadges, lastPerfectDate,
  }), [tasks, completedByDate, totalXP, totalCompleted, streak, maxStreak, perfectDays, earnedBadges, lastPerfectDate]);

  // Load on mount
  useEffect(() => {
    (async () => {
      const saved = await loadState();
      if (saved) {
        setTasks(saved.tasks || INITIAL_STATE.tasks);
        setCompletedByDate(saved.completedByDate || {});
        setTotalXP(saved.totalXP || 0);
        setTotalCompleted(saved.totalCompleted || 0);
        setStreak(saved.streak || 0);
        setMaxStreak(saved.maxStreak || 0);
        setPerfectDays(saved.perfectDays || 0);
        setEarnedBadges(saved.earnedBadges || []);
        setLastPerfectDate(saved.lastPerfectDate || null);
      }
      setLoaded(true);
    })();
  }, []);

  // Auto-save on change
  useEffect(() => {
    if (!loaded) return;
    const state = gatherState();
    const json = JSON.stringify(state);
    if (json !== stateRef.current) {
      stateRef.current = json;
      persistState(state);
    }
  }, [loaded, gatherState]);

  // ─── BADGE CHECK ───
  const checkBadges = useCallback((stats) => {
    const newOnes = [];
    BADGES.forEach((b) => {
      if (!stats.earnedBadges.includes(b.id) && b.condition(stats)) newOnes.push(b.id);
    });
    if (newOnes.length > 0) {
      const updated = [...stats.earnedBadges, ...newOnes];
      setEarnedBadges(updated);
      const badge = BADGES.find((b) => b.id === newOnes[0]);
      setNewBadge(badge);
      setTimeout(() => setNewBadge(null), 3500);
      return updated;
    }
    return stats.earnedBadges;
  }, []);

  // ─── TOGGLE TASK ───
  const toggleTask = (taskId) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const wasDone = completed[taskId];
    const newCompleted = { ...completed, [taskId]: !wasDone };
    const newByDate = { ...completedByDate, [today]: newCompleted };
    setCompletedByDate(newByDate);

    const newCount = tasks.filter((t) => newCompleted[t.id]).length;

    if (!wasDone) {
      const newXP = totalXP + task.xp;
      const newTotal = totalCompleted + 1;
      const oldLvl = getLevel(totalXP);
      const newLvl = getLevel(newXP);
      setTotalXP(newXP);
      setTotalCompleted(newTotal);
      setLastDoneId(taskId);
      setTimeout(() => setLastDoneId(null), 700);

      if (newLvl.level > oldLvl.level) {
        setLevelUpInfo(newLvl);
        setShowConfetti(true);
        setTimeout(() => { setLevelUpInfo(null); setShowConfetti(false); }, 4000);
      }

      let newStreak = streak, newMax = maxStreak, newPerfect = perfectDays, newLastPerfect = lastPerfectDate;

      if (newCount === tasks.length && lastPerfectDate !== today) {
        newPerfect = perfectDays + 1;
        // Check if yesterday was also perfect for streak
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        newStreak = lastPerfectDate === yesterday ? streak + 1 : 1;
        newMax = Math.max(maxStreak, newStreak);
        newLastPerfect = today;
        setStreak(newStreak);
        setMaxStreak(newMax);
        setPerfectDays(newPerfect);
        setLastPerfectDate(newLastPerfect);
        if (!levelUpInfo) { setShowConfetti(true); setTimeout(() => setShowConfetti(false), 3500); }
      }

      checkBadges({
        totalCompleted: newTotal, totalXP: newXP, maxStreak: newMax, perfectDays: newPerfect,
        currentLevel: newLvl.level, earnedBadges,
      });
    } else {
      setTotalXP(Math.max(0, totalXP - task.xp));
      setTotalCompleted(Math.max(0, totalCompleted - 1));
    }
  };

  const addTask = () => {
    if (!addForm.name.trim()) return;
    setTasks((p) => [...p, { id: uid(), ...addForm, xp: Number(addForm.xp) || 10 }]);
    setAddForm({ name: "", target: "", icon: "dumbbell", xp: 15, period: "morning" });
    setView("tasks");
  };

  const removeTask = (id) => {
    setTasks((p) => p.filter((t) => t.id !== id));
  };

  const startEdit = (t) => { setEditingId(t.id); setEditForm({ name: t.name, target: t.target, icon: t.icon, xp: t.xp, period: t.period || "morning" }); };
  const saveEdit = () => { setTasks((p) => p.map((t) => t.id === editingId ? { ...t, ...editForm, xp: Number(editForm.xp) || 10 } : t)); setEditingId(null); };

  // ─── LOADING ───
  if (!loaded) {
    return (
      <div style={S.loadingWrap}>
        <Loader2 size={36} color="#fff" style={{ animation: "spin 1s linear infinite" }} />
        <p style={{ color: "rgba(255,255,255,0.8)", marginTop: 12, fontSize: 14 }}>Caricamento...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={S.root}>
      <Confetti active={showConfetti} />

      {/* ── LEVEL UP OVERLAY ── */}
      {levelUpInfo && (
        <div style={S.overlay}>
          <div style={{ ...S.levelUpCard, borderColor: levelUpInfo.color }}>
            <levelUpInfo.Icon size={52} color={levelUpInfo.color} strokeWidth={2.5} />
            <div style={S.levelUpTitle}>LEVEL UP!</div>
            <div style={S.levelUpSub}>Livello {levelUpInfo.level} — {levelUpInfo.title}</div>
          </div>
        </div>
      )}

      {/* ── BADGE TOAST ── */}
      {newBadge && (
        <div style={S.toast}>
          <newBadge.Icon size={24} color="#fff" />
          <div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>Nuovo Badge!</div>
            <div style={{ fontSize: 12, opacity: 0.9 }}>{newBadge.name}</div>
          </div>
        </div>
      )}

      <div style={S.container}>
        {/* ── HEADER ── */}
        <div style={S.header}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Target size={24} color="#fff" strokeWidth={2.5} />
            <h1 style={S.title}>Daily Quest</h1>
          </div>
          <div style={S.dateText}>
            {new Date().toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}
          </div>
          <div style={S.storageChip}>
            {useSupabase
              ? <><CircleDot size={10} color="#4ECDC4" /> Cloud</>
              : <><CircleDot size={10} color="#FFD700" /> Locale</>}
          </div>
        </div>

        {/* ── STATS CARDS ── */}
        <div style={S.statsGrid}>
          <div style={S.statCard}>
            <Flame size={22} color={streak > 0 ? "#FF6B6B" : "#ffffff55"} />
            <div style={S.statNum}><AnimNum value={streak} /></div>
            <div style={S.statLabel}>STREAK</div>
          </div>
          <div style={S.statCard}>
            <LevelIcon size={22} color={currentLevel.color} />
            <div style={S.statNum}>Lv.{currentLevel.level}</div>
            <div style={S.statLabel}>{currentLevel.title.toUpperCase()}</div>
          </div>
          <div style={S.statCard}>
            <Zap size={22} color="#FFD700" />
            <div style={S.statNum}><AnimNum value={totalXP} /></div>
            <div style={S.statLabel}>XP</div>
          </div>
        </div>

        {/* ── XP BAR ── */}
        <div style={S.xpBar}>
          <div style={S.xpBarLabel}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <LevelIcon size={13} color={currentLevel.color} /> Lv.{currentLevel.level}
            </span>
            <span>
              {nextLevel ? `${xpInLevel}/${xpForLevel} XP` : "MAX LEVEL!"}
            </span>
          </div>
          <div style={S.barTrack}>
            <div style={{ ...S.barFill, width: `${levelProgress * 100}%`, background: `linear-gradient(90deg, ${currentLevel.color}, #FFD700)` }} />
          </div>
        </div>

        {/* ── DAILY PROGRESS ── */}
        <div style={S.dailyProgress}>
          <div style={S.dailyHeader}>
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, fontSize: 14, color: "#fff" }}>
              {allDone ? <><Sparkles size={16} /> Giornata completata!</> : <><CalendarCheck size={16} /> Progresso di oggi</>}
            </span>
            <span style={{ ...S.dailyBadge, background: allDone ? "rgba(255,215,0,0.25)" : "rgba(255,255,255,0.12)", color: allDone ? "#FFD700" : "#fff" }}>
              {completedCount}/{tasks.length}
            </span>
          </div>
          <div style={{ ...S.barTrack, height: 12 }}>
            <div style={{
              ...S.barFill, height: 12,
              width: `${progress * 100}%`,
              background: allDone ? "linear-gradient(90deg, #FFD700, #FFA500, #FF6B6B)" : "linear-gradient(90deg, #4ECDC4, #45B7D1)",
              boxShadow: allDone ? "0 0 16px rgba(255,215,0,0.5)" : "0 0 8px rgba(78,205,196,0.3)",
            }} />
          </div>
        </div>

        {/* ── NAV ── */}
        <div style={S.nav}>
          {[
            { key: "tasks", label: "Quest", Icon: Swords },
            { key: "badges", label: "Badge", Icon: Award },
            { key: "stats", label: "Stats", Icon: BarChart3 },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setView(tab.key)}
              style={{
                ...S.navBtn,
                background: view === tab.key ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.12)",
                color: view === tab.key ? "#764ba2" : "rgba(255,255,255,0.85)",
              }}
            >
              <tab.Icon size={16} /> {tab.label}
            </button>
          ))}
        </div>

        {/* ══════ TASKS VIEW ══════ */}
        {view === "tasks" && (
          <div>
            {PERIODS.map((period) => {
              const periodTasks = tasks.filter((t) => (t.period || "morning") === period.id);
              if (periodTasks.length === 0 && !editingId) return null;
              const periodDone = periodTasks.filter((t) => completed[t.id]).length;
              const allPeriodDone = periodTasks.length > 0 && periodDone === periodTasks.length;

              return (
                <div key={period.id} style={{ marginBottom: 16 }}>
                  {/* Period Header */}
                  <div style={S.periodHeader}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <period.Icon size={16} color={period.color} />
                      <span style={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.9)", letterSpacing: 0.3 }}>
                        {period.label}
                      </span>
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 12,
                      background: allPeriodDone ? "rgba(255,215,0,0.25)" : "rgba(255,255,255,0.1)",
                      color: allPeriodDone ? "#FFD700" : "rgba(255,255,255,0.5)",
                    }}>
                      {periodDone}/{periodTasks.length}
                    </span>
                  </div>

                  {periodTasks.map((task) => {
                    const isDone = completed[task.id];
                    const pop = lastDoneId === task.id;

                    if (editingId === task.id) {
                      return (
                        <div key={task.id} style={S.editCard}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#555", marginBottom: 8 }}>Modifica Quest</div>
                          <label style={S.label}>MOMENTO</label>
                          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                            {PERIODS.map((p) => (
                              <button key={p.id} onClick={() => setEditForm({ ...editForm, period: p.id })} style={{
                                ...S.periodPick,
                                border: editForm.period === p.id ? `2px solid ${p.color}` : "2px solid #eee",
                                background: editForm.period === p.id ? `${p.color}12` : "#fff",
                                color: editForm.period === p.id ? p.color : "#aaa",
                              }}>
                                <p.Icon size={14} /> {p.label}
                              </button>
                            ))}
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                            {ICON_KEYS.map((k) => (
                              <button key={k} onClick={() => setEditForm({ ...editForm, icon: k })} style={{
                                ...S.iconPick,
                                border: editForm.icon === k ? "2px solid #764ba2" : "2px solid #eee",
                                background: editForm.icon === k ? "rgba(118,75,162,0.08)" : "#fff",
                              }}>
                                <TaskIcon icon={k} size={18} color={editForm.icon === k ? "#764ba2" : "#aaa"} />
                              </button>
                            ))}
                          </div>
                          <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} placeholder="Nome" style={S.input} />
                          <input value={editForm.target} onChange={(e) => setEditForm({ ...editForm, target: e.target.value })} placeholder="Obiettivo" style={S.input} />
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                            <Zap size={14} color="#999" />
                            <span style={{ fontSize: 12, color: "#666" }}>XP:</span>
                            <input type="number" value={editForm.xp} onChange={(e) => setEditForm({ ...editForm, xp: e.target.value })} style={{ ...S.input, width: 64, textAlign: "center", marginBottom: 0 }} />
                          </div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={saveEdit} style={{ ...S.btnPrimary, flex: 1 }}><Check size={16} /> Salva</button>
                            <button onClick={() => setEditingId(null)} style={{ ...S.btnSecondary, flex: 1 }}><X size={16} /> Annulla</button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={task.id}
                        onClick={() => toggleTask(task.id)}
                        style={{
                          ...S.taskCard,
                          transform: pop ? "scale(1.03)" : "scale(1)",
                          border: isDone ? "2px solid #4ECDC4" : "2px solid transparent",
                          boxShadow: isDone ? "0 4px 20px rgba(78,205,196,0.25)" : "0 2px 8px rgba(0,0,0,0.08)",
                        }}
                      >
                        <div style={{
                          ...S.checkbox,
                          background: isDone ? "linear-gradient(135deg, #4ECDC4, #44B09E)" : "transparent",
                          border: isDone ? "none" : "2.5px solid #ccc",
                        }}>
                          {isDone && <Check size={18} color="#fff" strokeWidth={3} />}
                        </div>

                        <div style={{
                          ...S.taskIconWrap,
                          background: isDone ? `linear-gradient(135deg, ${currentLevel.color}22, ${currentLevel.color}11)` : "#f5f5f5",
                        }}>
                          <TaskIcon icon={task.icon} size={20} color={isDone ? currentLevel.color : "#aaa"} />
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 15, fontWeight: 700, color: isDone ? "#bbb" : "#333", textDecoration: isDone ? "line-through" : "none", transition: "all 0.2s" }}>
                            {task.name}
                          </div>
                          <div style={{ fontSize: 12, color: "#aaa", marginTop: 1 }}>{task.target}</div>
                        </div>

                        <div style={{
                          ...S.xpChip,
                          background: isDone ? "linear-gradient(135deg, #FFD700, #FFA500)" : "#f0f0f0",
                          color: isDone ? "#fff" : "#bbb",
                        }}>
                          <Zap size={11} /> {task.xp}
                        </div>

                        <div style={{ display: "flex", gap: 2 }} onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => startEdit(task)} style={S.tinyBtn} aria-label="Modifica">
                            <Pencil size={13} color="#bbb" />
                          </button>
                          <button onClick={() => removeTask(task.id)} style={{ ...S.tinyBtn, background: "rgba(239,68,68,0.06)" }} aria-label="Elimina">
                            <Trash2 size={13} color="#e88" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}

            <button onClick={() => setView("add")} style={S.addBtn}>
              <Plus size={18} /> Aggiungi Quest
            </button>
          </div>
        )}

        {/* ══════ ADD TASK VIEW ══════ */}
        {view === "add" && (
          <div style={S.editCard}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
              <Plus size={18} color="#764ba2" />
              <span style={{ fontSize: 17, fontWeight: 800, color: "#333" }}>Nuova Quest</span>
            </div>

            <label style={S.label}>MOMENTO DELLA GIORNATA</label>
            <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
              {PERIODS.map((p) => (
                <button key={p.id} onClick={() => setAddForm({ ...addForm, period: p.id })} style={{
                  ...S.periodPick,
                  border: addForm.period === p.id ? `2px solid ${p.color}` : "2px solid #eee",
                  background: addForm.period === p.id ? `${p.color}12` : "#fff",
                  color: addForm.period === p.id ? p.color : "#aaa",
                }}>
                  <p.Icon size={14} /> {p.label}
                </button>
              ))}
            </div>

            <label style={S.label}>ICONA</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
              {ICON_KEYS.map((k) => (
                <button key={k} onClick={() => setAddForm({ ...addForm, icon: k })} style={{
                  ...S.iconPick,
                  width: 40, height: 40,
                  border: addForm.icon === k ? "2px solid #764ba2" : "2px solid #eee",
                  background: addForm.icon === k ? "rgba(118,75,162,0.08)" : "#fff",
                }}>
                  <TaskIcon icon={k} size={18} color={addForm.icon === k ? "#764ba2" : "#aaa"} />
                </button>
              ))}
            </div>

            <label style={S.label}>NOME</label>
            <input value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} placeholder="es. Corsa mattutina" style={S.input} />

            <label style={S.label}>OBIETTIVO</label>
            <input value={addForm.target} onChange={(e) => setAddForm({ ...addForm, target: e.target.value })} placeholder="es. 5 km" style={S.input} />

            <label style={S.label}>XP REWARD</label>
            <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
              {[5, 10, 15, 20, 30, 50].map((v) => (
                <button key={v} onClick={() => setAddForm({ ...addForm, xp: v })} style={{
                  ...S.xpOption,
                  border: Number(addForm.xp) === v ? "2px solid #764ba2" : "2px solid #eee",
                  color: Number(addForm.xp) === v ? "#764ba2" : "#aaa",
                  background: Number(addForm.xp) === v ? "rgba(118,75,162,0.08)" : "#fff",
                }}>
                  {v}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={addTask} style={{ ...S.btnPrimary, flex: 1 }}><Check size={16} /> Aggiungi</button>
              <button onClick={() => setView("tasks")} style={{ ...S.btnSecondary, flex: 1 }}><ChevronLeft size={16} /> Indietro</button>
            </div>
          </div>
        )}

        {/* ══════ BADGES VIEW ══════ */}
        {view === "badges" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {BADGES.map((badge) => {
              const earned = earnedBadges.includes(badge.id);
              return (
                <div key={badge.id} style={{
                  ...S.badgeCard,
                  background: earned ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.12)",
                  border: earned ? "2px solid #FFD700" : "1px solid rgba(255,255,255,0.12)",
                }}>
                  <div style={{ opacity: earned ? 1 : 0.25 }}>
                    <badge.Icon size={32} color={earned ? "#FFD700" : "#fff"} strokeWidth={earned ? 2.5 : 1.5} />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: earned ? "#333" : "rgba(255,255,255,0.4)", marginTop: 6 }}>{badge.name}</div>
                  <div style={{ fontSize: 11, color: earned ? "#999" : "rgba(255,255,255,0.25)", marginTop: 2 }}>{badge.desc}</div>
                  {earned && (
                    <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 5, fontSize: 10, color: "#FFD700", fontWeight: 700 }}>
                      <Check size={10} /> SBLOCCATO
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ══════ STATS VIEW ══════ */}
        {view === "stats" && (
          <div>
            <div style={S.editCard}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <BarChart3 size={20} color="#764ba2" />
                <span style={{ fontSize: 17, fontWeight: 800, color: "#333" }}>Statistiche</span>
              </div>
              {[
                { label: "Task completati", value: totalCompleted, Icon: Check, color: "#4ECDC4" },
                { label: "XP totali", value: totalXP, Icon: Zap, color: "#FFD700" },
                { label: "Streak attuale", value: streak, Icon: Flame, color: "#FF6B6B" },
                { label: "Streak record", value: maxStreak, Icon: Trophy, color: "#F59E0B" },
                { label: "Giornate perfette", value: perfectDays, Icon: Sparkles, color: "#A855F7" },
                { label: "Badge sbloccati", value: `${earnedBadges.length}/${BADGES.length}`, Icon: Award, color: "#EC4899" },
                { label: "Livello", value: `${currentLevel.level} — ${currentLevel.title}`, Icon: LevelIcon, color: currentLevel.color },
              ].map((s, i) => (
                <div key={i} style={S.statRow}>
                  <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#666" }}>
                    <s.Icon size={16} color={s.color} /> {s.label}
                  </span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: "#333" }}>{s.value}</span>
                </div>
              ))}
            </div>

            <div style={S.mottoCard}>
              <Rocket size={24} color="rgba(255,255,255,0.8)" />
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.9)", fontWeight: 600, marginTop: 8, fontStyle: "italic" }}>
                {totalCompleted === 0 ? "Ogni grande viaggio inizia con un singolo passo!"
                  : totalCompleted < 10 ? "Ottimo inizio! Continua così!"
                  : totalCompleted < 50 ? "Stai costruendo abitudini di ferro!"
                  : totalCompleted < 100 ? "Sei una forza della natura!"
                  : "Leggenda vivente! Niente ti può fermare!"}
              </div>
            </div>
          </div>
        )}

        <div style={{ textAlign: "center", padding: "20px 0 8px", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
          Daily Quest Tracker v2.0
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes popIn { from { transform: scale(0.5); opacity: 0 } to { transform: scale(1); opacity: 1 } }
        @keyframes slideDown { from { transform: translateX(-50%) translateY(-120%); opacity: 0 } to { transform: translateX(-50%) translateY(0); opacity: 1 } }
        @keyframes spin { to { transform: rotate(360deg) } }
        button:active { transform: scale(0.97); }
        input:focus { border-color: #764ba2 !important; outline: none; }
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════
//  STYLES
// ═══════════════════════════════════════════════════
const S = {
  root: {
    minHeight: "100vh",
    minHeight: "100dvh",
    background: "linear-gradient(150deg, #667eea 0%, #764ba2 40%, #f093fb 100%)",
    fontFamily: "'SF Pro Display', 'Segoe UI', system-ui, -apple-system, sans-serif",
    padding: "12px 12px env(safe-area-inset-bottom, 12px)",
    WebkitFontSmoothing: "antialiased",
  },
  loadingWrap: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(150deg, #667eea 0%, #764ba2 40%, #f093fb 100%)",
  },
  container: { maxWidth: 420, margin: "0 auto" },
  header: { textAlign: "center", marginBottom: 16, paddingTop: "env(safe-area-inset-top, 8px)" },
  title: { fontSize: 24, fontWeight: 900, color: "#fff", margin: 0, letterSpacing: -0.5 },
  dateText: { color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 2, textTransform: "capitalize" },
  storageChip: {
    display: "inline-flex", alignItems: "center", gap: 4, marginTop: 6,
    fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.6)",
    background: "rgba(255,255,255,0.1)", padding: "3px 10px", borderRadius: 20,
  },
  statsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 },
  statCard: {
    background: "rgba(255,255,255,0.12)", backdropFilter: "blur(12px)",
    borderRadius: 14, padding: "10px 6px", textAlign: "center",
    border: "1px solid rgba(255,255,255,0.15)",
    display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
  },
  statNum: { fontSize: 20, fontWeight: 800, color: "#fff" },
  statLabel: { fontSize: 9, color: "rgba(255,255,255,0.6)", fontWeight: 700, letterSpacing: 0.5 },
  xpBar: {
    background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: "8px 12px", marginBottom: 12,
    border: "1px solid rgba(255,255,255,0.1)",
  },
  xpBarLabel: {
    display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(255,255,255,0.7)",
    marginBottom: 5, fontWeight: 600,
  },
  barTrack: { background: "rgba(0,0,0,0.2)", borderRadius: 8, height: 8, overflow: "hidden" },
  barFill: { height: 8, borderRadius: 8, transition: "width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)" },
  dailyProgress: {
    background: "rgba(255,255,255,0.12)", backdropFilter: "blur(12px)", borderRadius: 14,
    padding: 14, marginBottom: 12, border: "1px solid rgba(255,255,255,0.15)",
  },
  dailyHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  dailyBadge: { fontSize: 13, fontWeight: 800, padding: "2px 10px", borderRadius: 20 },
  nav: { display: "flex", gap: 6, marginBottom: 14 },
  navBtn: {
    flex: 1, padding: "9px 6px", border: "none", borderRadius: 12, cursor: "pointer",
    fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
    transition: "all 0.25s ease",
  },
  taskCard: {
    background: "rgba(255,255,255,0.92)", borderRadius: 14, padding: "10px 12px",
    marginBottom: 8, display: "flex", alignItems: "center", gap: 10,
    cursor: "pointer", transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
    WebkitTapHighlightColor: "transparent", minHeight: 56,
  },
  checkbox: {
    width: 32, height: 32, borderRadius: 10, display: "flex",
    alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s",
  },
  taskIconWrap: {
    width: 36, height: 36, borderRadius: 10, display: "flex",
    alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s",
  },
  xpChip: {
    display: "flex", alignItems: "center", gap: 3,
    padding: "3px 8px", borderRadius: 20, fontSize: 11, fontWeight: 800,
    flexShrink: 0, transition: "all 0.2s",
  },
  tinyBtn: {
    width: 28, height: 28, border: "none", borderRadius: 8, background: "rgba(0,0,0,0.04)",
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
  },
  periodHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "6px 4px", marginBottom: 6,
  },
  periodPick: {
    flex: 1, padding: "8px 4px", borderRadius: 10, cursor: "pointer",
    fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center",
    justifyContent: "center", gap: 4, transition: "all 0.15s",
  },
  addBtn: {
    width: "100%", padding: 13, border: "2px dashed rgba(255,255,255,0.35)",
    borderRadius: 14, background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.85)",
    fontSize: 13, fontWeight: 700, cursor: "pointer", marginTop: 4,
    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
  },
  editCard: { background: "rgba(255,255,255,0.95)", borderRadius: 18, padding: 18 },
  label: { fontSize: 11, fontWeight: 700, color: "#888", display: "block", marginBottom: 4, letterSpacing: 0.5 },
  input: {
    width: "100%", padding: "10px 12px", border: "2px solid #eee", borderRadius: 10,
    fontSize: 14, marginBottom: 10, boxSizing: "border-box",
  },
  iconPick: {
    width: 36, height: 36, borderRadius: 10, cursor: "pointer", padding: 0,
    display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s",
  },
  xpOption: {
    flex: 1, padding: "8px 2px", borderRadius: 10, cursor: "pointer",
    fontSize: 13, fontWeight: 700, background: "#fff",
  },
  btnPrimary: {
    padding: "10px 14px", border: "none", borderRadius: 12,
    background: "linear-gradient(135deg, #4ECDC4, #44B09E)", color: "#fff",
    fontSize: 14, fontWeight: 700, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
  },
  btnSecondary: {
    padding: "10px 14px", border: "none", borderRadius: 12,
    background: "#eee", color: "#666", fontSize: 14, fontWeight: 700, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
  },
  badgeCard: {
    borderRadius: 16, padding: 14, textAlign: "center", transition: "all 0.2s",
  },
  statRow: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "10px 0", borderBottom: "1px solid #f0f0f0",
  },
  mottoCard: {
    background: "rgba(255,255,255,0.12)", borderRadius: 16, padding: 18,
    textAlign: "center", border: "1px solid rgba(255,255,255,0.12)", marginTop: 12,
  },
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9998,
    animation: "fadeIn 0.3s ease",
  },
  levelUpCard: {
    background: "#fff", borderRadius: 24, padding: "36px 44px", textAlign: "center",
    animation: "popIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)", border: "3px solid",
    display: "flex", flexDirection: "column", alignItems: "center",
  },
  levelUpTitle: { fontSize: 26, fontWeight: 900, color: "#333", marginTop: 10, letterSpacing: 1 },
  levelUpSub: { fontSize: 16, color: "#888", marginTop: 4 },
  toast: {
    position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)",
    background: "linear-gradient(135deg, #4ECDC4, #44B09E)", color: "#fff",
    padding: "10px 20px", borderRadius: 14, boxShadow: "0 8px 28px rgba(0,0,0,0.25)",
    zIndex: 9999, display: "flex", alignItems: "center", gap: 10,
    animation: "slideDown 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
    maxWidth: "90vw",
  },
};
