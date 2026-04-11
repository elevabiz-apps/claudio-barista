import { supabase } from "./supabase";
import { getStreaks } from "./coffee";
import { COFFEE_TYPES } from "./coffeeTypes";

type Category = "streak" | "volume" | "variety" | "records" | "timing";

export const CATEGORY_LABELS: Record<Category, string> = {
  streak: "Rachas",
  volume: "Volumen",
  variety: "Variedad",
  records: "Récords",
  timing: "Horarios",
};

export const CATEGORIES: Category[] = ["streak", "volume", "variety", "records", "timing"];

export interface Achievement {
  id: string;
  title: string;
  description: string;
  emoji: string;
  category: Category;
  check: (stats: AchievementStats) => boolean;
}

export interface AchievementStats {
  totalCoffees: number;
  maxStreak: number;
  uniqueTypes: number;
  maxCoffeesInDay: number;
  hadPerfectWeek: boolean;
  hadFullMonth: boolean;
  hadMorningCoffee: boolean;
  hadNightCoffee: boolean;
}

export interface AchievementResult {
  achievement: Achievement;
  unlocked: boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  // Rachas
  { id: "streak_1",   title: "Primer sorbo",       description: "Registrá café 1 día",            emoji: "☕", category: "streak",  check: (s) => s.maxStreak >= 1 },
  { id: "streak_7",   title: "Semana cafetera",     description: "Racha de 7 días seguidos",       emoji: "🔥", category: "streak",  check: (s) => s.maxStreak >= 7 },
  { id: "streak_14",  title: "Ritual diario",       description: "Racha de 14 días seguidos",      emoji: "🔥", category: "streak",  check: (s) => s.maxStreak >= 14 },
  { id: "streak_30",  title: "Un mes imparable",    description: "Racha de 30 días seguidos",      emoji: "🔥", category: "streak",  check: (s) => s.maxStreak >= 30 },
  { id: "streak_50",  title: "Medio centenar",      description: "Racha de 50 días seguidos",      emoji: "🔥", category: "streak",  check: (s) => s.maxStreak >= 50 },
  { id: "streak_100", title: "Club de los 100",     description: "Racha de 100 días seguidos",     emoji: "🔥", category: "streak",  check: (s) => s.maxStreak >= 100 },
  { id: "streak_180", title: "Medio año",           description: "Racha de 180 días seguidos",     emoji: "🔥", category: "streak",  check: (s) => s.maxStreak >= 180 },
  { id: "streak_365", title: "Año completo",        description: "Racha de 365 días seguidos",     emoji: "🔥", category: "streak",  check: (s) => s.maxStreak >= 365 },
  // Volumen
  { id: "volume_1",    title: "Primera taza",       description: "Registrá tu primer café",        emoji: "☕", category: "volume",  check: (s) => s.totalCoffees >= 1 },
  { id: "volume_50",   title: "Cincuenta cafés",    description: "Llegá a 50 cafés registrados",   emoji: "📊", category: "volume",  check: (s) => s.totalCoffees >= 50 },
  { id: "volume_100",  title: "Centenario",         description: "Llegá a 100 cafés registrados",  emoji: "📊", category: "volume",  check: (s) => s.totalCoffees >= 100 },
  { id: "volume_200",  title: "Doscientos",         description: "Llegá a 200 cafés registrados",  emoji: "📊", category: "volume",  check: (s) => s.totalCoffees >= 200 },
  { id: "volume_500",  title: "Quinientos",         description: "Llegá a 500 cafés registrados",  emoji: "📊", category: "volume",  check: (s) => s.totalCoffees >= 500 },
  { id: "volume_1000", title: "Mil cafés",          description: "Llegá a 1000 cafés registrados", emoji: "📊", category: "volume",  check: (s) => s.totalCoffees >= 1000 },
  // Variedad
  { id: "variety_3",  title: "Explorador",          description: "Probá 3 tipos distintos de café",                    emoji: "🎨", category: "variety", check: (s) => s.uniqueTypes >= 3 },
  { id: "variety_8",  title: "Conocedor",           description: `Probá los ${COFFEE_TYPES.length} tipos de café`,     emoji: "🎨", category: "variety", check: (s) => s.uniqueTypes >= COFFEE_TYPES.length },
  // Récords
  { id: "rec_triple",  title: "Día triple",         description: "Tomá 3+ cafés en un solo día",                       emoji: "⚡", category: "records", check: (s) => s.maxCoffeesInDay >= 3 },
  { id: "rec_record",  title: "Día récord",         description: "Tomá 5+ cafés en un solo día",                       emoji: "⚡", category: "records", check: (s) => s.maxCoffeesInDay >= 5 },
  { id: "rec_perfect", title: "Semana perfecta",    description: "7 días seguidos con 2+ cafés cada uno",              emoji: "💎", category: "records", check: (s) => s.hadPerfectWeek },
  { id: "rec_month",   title: "Mes completo",       description: "Café todos los días de un mes calendario",           emoji: "📅", category: "records", check: (s) => s.hadFullMonth },
  // Horarios
  { id: "time_early",  title: "Madrugador",         description: "Registrá un café antes de las 8am",                 emoji: "🌅", category: "timing",  check: (s) => s.hadMorningCoffee },
  { id: "time_night",  title: "Noctámbulo",         description: "Registrá un café después de las 22hs",              emoji: "🦉", category: "timing",  check: (s) => s.hadNightCoffee },
];

// --- Helpers ---

function daysBetween(a: string, b: string): number {
  const da = new Date(a + "T12:00:00");
  const db = new Date(b + "T12:00:00");
  return Math.round((db.getTime() - da.getTime()) / (1000 * 60 * 60 * 24));
}

function getArgentinaHour(timestamp: string): number {
  // created_at from Supabase is UTC. Argentina = UTC-3.
  const d = new Date(timestamp);
  const utcHour = d.getUTCHours();
  const utcMinutes = d.getUTCMinutes();
  // Shift by -3 hours
  let argHour = utcHour - 3;
  if (argHour < 0) argHour += 24;
  return argHour + utcMinutes / 60;
}

function checkPerfectWeek(countByDate: Record<string, number>): boolean {
  const dates = Object.keys(countByDate)
    .filter((d) => countByDate[d] >= 2)
    .sort();
  if (dates.length < 7) return false;

  let run = 1;
  for (let i = 1; i < dates.length; i++) {
    if (daysBetween(dates[i - 1], dates[i]) === 1) {
      run++;
      if (run >= 7) return true;
    } else {
      run = 1;
    }
  }
  return false;
}

function checkFullMonth(countByDate: Record<string, number>): boolean {
  const months: Record<string, Set<number>> = {};
  for (const dateStr of Object.keys(countByDate)) {
    const monthKey = dateStr.slice(0, 7);
    if (!months[monthKey]) months[monthKey] = new Set();
    months[monthKey].add(parseInt(dateStr.slice(8, 10)));
  }
  for (const [monthKey, days] of Object.entries(months)) {
    const [y, m] = monthKey.split("-").map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();
    if (days.size >= daysInMonth) return true;
  }
  return false;
}

// --- Data fetching ---

export async function getAchievementStats(): Promise<AchievementStats> {
  const [streaks, allCoffees] = await Promise.all([
    getStreaks(),
    supabase.from("coffees").select("date, created_at, type"),
  ]);

  const coffees = allCoffees.data ?? [];
  const totalCoffees = coffees.length;
  const uniqueTypes = new Set(
    coffees.filter((c) => c.type).map((c) => c.type)
  ).size;

  // Count per day
  const countByDate: Record<string, number> = {};
  for (const c of coffees) {
    countByDate[c.date] = (countByDate[c.date] ?? 0) + 1;
  }
  const maxCoffeesInDay = Math.max(0, ...Object.values(countByDate));

  // Complex checks
  const hadPerfectWeek = checkPerfectWeek(countByDate);
  const hadFullMonth = checkFullMonth(countByDate);

  // Time-based checks
  const hadMorningCoffee = coffees.some(
    (c) => c.created_at && getArgentinaHour(c.created_at) < 8
  );
  const hadNightCoffee = coffees.some(
    (c) => c.created_at && getArgentinaHour(c.created_at) >= 22
  );

  return {
    totalCoffees,
    maxStreak: streaks.max,
    uniqueTypes,
    maxCoffeesInDay,
    hadPerfectWeek,
    hadFullMonth,
    hadMorningCoffee,
    hadNightCoffee,
  };
}

// --- Evaluation ---

export function evaluateAchievements(stats: AchievementStats): AchievementResult[] {
  return ACHIEVEMENTS.map((a) => ({
    achievement: a,
    unlocked: a.check(stats),
  }));
}

export function getNewlyUnlocked(
  before: AchievementStats,
  after: AchievementStats
): Achievement[] {
  return ACHIEVEMENTS.filter((a) => !a.check(before) && a.check(after));
}
