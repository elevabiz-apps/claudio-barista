import { supabase } from "./supabase";
import { getLocalDate } from "./date";

export interface CoffeeEntry {
  id: string;
  created_at: string;
  date: string; // YYYY-MM-DD
  type: string | null;
}

export async function addCoffee(type?: string | null): Promise<CoffeeEntry | null> {
  const today = getLocalDate();
  const { data, error } = await supabase
    .from("coffees")
    .insert({ date: today, ...(type ? { type } : {}) })
    .select()
    .single();

  if (error) {
    console.error("Error adding coffee:", error);
    return null;
  }
  return data;
}

export async function removeCoffee(date: string): Promise<boolean> {
  // Remove the most recent coffee for the given date
  const { data } = await supabase
    .from("coffees")
    .select("id")
    .eq("date", date)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!data) return false;

  const { error } = await supabase.from("coffees").delete().eq("id", data.id);
  return !error;
}

export async function getTodayCount(): Promise<number> {
  const today = getLocalDate();
  const { count, error } = await supabase
    .from("coffees")
    .select("*", { count: "exact", head: true })
    .eq("date", today);

  if (error) {
    console.error("Error getting today count:", error);
    return 0;
  }
  return count ?? 0;
}

export async function getWeekSummary(): Promise<{
  total: number;
  avg: string;
}> {
  const today = getLocalDate();
  const start = new Date(today + "T12:00:00");
  start.setDate(start.getDate() - 6);
  const startStr = start.toISOString().split("T")[0];

  const { count, error } = await supabase
    .from("coffees")
    .select("*", { count: "exact", head: true })
    .gte("date", startStr)
    .lte("date", today);

  if (error) {
    console.error("Error getting week summary:", error);
    return { total: 0, avg: "0" };
  }
  const total = count ?? 0;
  return { total, avg: (total / 7).toFixed(1) };
}

export async function addCoffeeForDate(date: string, type?: string | null): Promise<CoffeeEntry | null> {
  const { data, error } = await supabase
    .from("coffees")
    .insert({ date, ...(type ? { type } : {}) })
    .select()
    .single();

  if (error) {
    console.error("Error adding coffee:", error);
    return null;
  }
  return data;
}

export async function getStreaks(): Promise<{ current: number; max: number }> {
  const { data, error } = await supabase
    .from("coffees")
    .select("date")
    .order("date", { ascending: true });

  if (error || !data || data.length === 0) return { current: 0, max: 0 };

  const dates = [...new Set(data.map((e) => e.date))].sort();
  const today = getLocalDate();

  function daysBetween(a: string, b: string): number {
    const da = new Date(a + "T12:00:00");
    const db = new Date(b + "T12:00:00");
    return Math.round((db.getTime() - da.getTime()) / (1000 * 60 * 60 * 24));
  }

  function subtractDays(date: string, n: number): string {
    const d = new Date(date + "T12:00:00");
    d.setDate(d.getDate() - n);
    return d.toISOString().split("T")[0];
  }

  // Current streak: consecutive days going back from today.
  // If today has no coffees yet, anchor on yesterday so the streak survives
  // during the day until the user adds their first coffee.
  const dateSet = new Set(dates);
  const anchor = dateSet.has(today) ? today : subtractDays(today, 1);
  let current = 0;
  let cursor = anchor;
  while (dateSet.has(cursor)) {
    current++;
    cursor = subtractDays(cursor, 1);
  }

  // Max streak
  let max = 1;
  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    if (daysBetween(dates[i - 1], dates[i]) === 1) {
      streak++;
      if (streak > max) max = streak;
    } else {
      streak = 1;
    }
  }

  return { current, max };
}

export async function getCoffeeTypeBreakdown(
  startDate: string,
  endDate: string
): Promise<{ type: string | null; count: number }[]> {
  const { data, error } = await supabase
    .from("coffees")
    .select("type")
    .gte("date", startDate)
    .lte("date", endDate);

  if (error || !data) return [];

  const grouped: Record<string, number> = {};
  for (const entry of data) {
    const key = entry.type ?? "__null__";
    grouped[key] = (grouped[key] ?? 0) + 1;
  }

  const result = Object.entries(grouped)
    .map(([key, count]) => ({ type: key === "__null__" ? null : key, count }))
    .sort((a, b) => b.count - a.count);

  // Move null (sin especificar) to the end
  const specified = result.filter((r) => r.type !== null);
  const unspecified = result.filter((r) => r.type === null);
  return [...specified, ...unspecified];
}

export async function getCoffeesInRange(
  startDate: string,
  endDate: string
): Promise<{ date: string; count: number }[]> {
  const { data, error } = await supabase
    .from("coffees")
    .select("date")
    .gte("date", startDate)
    .lte("date", endDate);

  if (error) {
    console.error("Error getting coffees:", error);
    return [];
  }

  // Group by date
  const grouped: Record<string, number> = {};
  for (const entry of data) {
    grouped[entry.date] = (grouped[entry.date] ?? 0) + 1;
  }

  return Object.entries(grouped)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
