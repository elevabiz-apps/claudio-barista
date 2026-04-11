import { supabase } from "./supabase";
import { getStreaks } from "./coffee";
import { COFFEE_TYPES } from "./coffeeTypes";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  emoji: string;
  category: "streak" | "volume" | "variety";
  check: (stats: AchievementStats) => boolean;
}

export interface AchievementStats {
  totalCoffees: number;
  maxStreak: number;
  uniqueTypes: number;
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
  // Volumen
  { id: "volume_1",   title: "Primera taza",        description: "Registrá tu primer café",        emoji: "☕", category: "volume",  check: (s) => s.totalCoffees >= 1 },
  { id: "volume_50",  title: "Cincuenta cafés",     description: "Llegá a 50 cafés registrados",   emoji: "📊", category: "volume",  check: (s) => s.totalCoffees >= 50 },
  { id: "volume_100", title: "Centenario",          description: "Llegá a 100 cafés registrados",  emoji: "📊", category: "volume",  check: (s) => s.totalCoffees >= 100 },
  { id: "volume_500", title: "Quinientos",          description: "Llegá a 500 cafés registrados",  emoji: "📊", category: "volume",  check: (s) => s.totalCoffees >= 500 },
  // Variedad
  { id: "variety_3",  title: "Explorador",          description: "Probá 3 tipos distintos de café",  emoji: "🎨", category: "variety", check: (s) => s.uniqueTypes >= 3 },
  { id: "variety_8",  title: "Conocedor",           description: `Probá los ${COFFEE_TYPES.length} tipos de café`, emoji: "🎨", category: "variety", check: (s) => s.uniqueTypes >= COFFEE_TYPES.length },
];

export async function getAchievementStats(): Promise<AchievementStats> {
  const [streaks, totalResult, typesResult] = await Promise.all([
    getStreaks(),
    supabase.from("coffees").select("*", { count: "exact", head: true }),
    supabase.from("coffees").select("type").not("type", "is", null),
  ]);

  const totalCoffees = totalResult.count ?? 0;
  const uniqueTypes = new Set((typesResult.data ?? []).map((r) => r.type)).size;

  return {
    totalCoffees,
    maxStreak: streaks.max,
    uniqueTypes,
  };
}

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
