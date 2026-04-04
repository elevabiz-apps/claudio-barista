import { supabase } from "./supabase";
import { getLocalDate } from "./date";

export interface CoffeeEntry {
  id: string;
  created_at: string;
  date: string; // YYYY-MM-DD
}

export async function addCoffee(): Promise<CoffeeEntry | null> {
  const today = getLocalDate();
  const { data, error } = await supabase
    .from("coffees")
    .insert({ date: today })
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

export async function addCoffeeForDate(date: string): Promise<CoffeeEntry | null> {
  const { data, error } = await supabase
    .from("coffees")
    .insert({ date })
    .select()
    .single();

  if (error) {
    console.error("Error adding coffee:", error);
    return null;
  }
  return data;
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
