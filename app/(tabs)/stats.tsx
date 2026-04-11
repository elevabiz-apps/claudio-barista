import { useCallback, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { LineChart, BarChart } from "react-native-chart-kit";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../lib/theme";
import { getCoffeesInRange, getCoffeeTypeBreakdown } from "../../lib/coffee";
import { getTypeById } from "../../lib/coffeeTypes";
import {
  getAchievementStats,
  evaluateAchievements,
  AchievementResult,
  CATEGORIES,
  CATEGORY_LABELS,
} from "../../lib/achievements";

type Period = "week" | "month" | "year";

const screenWidth = Dimensions.get("window").width - 48;

const chartConfig = {
  backgroundGradientFrom: colors.surface,
  backgroundGradientTo: colors.surface,
  color: (opacity = 1) => `rgba(200, 162, 110, ${opacity})`,
  labelColor: () => colors.textSecondary,
  strokeWidth: 2,
  barPercentage: 0.6,
  decimalCount: 0,
  propsForBackgroundLines: {
    strokeDasharray: "",
    stroke: colors.border,
    strokeWidth: 0.5,
  },
  propsForLabels: {
    fontSize: 11,
  },
};

function getDateRange(period: Period): { start: string; end: string } {
  const now = new Date();
  const end = now.toISOString().split("T")[0];
  let start: Date;

  switch (period) {
    case "week": {
      const daysSinceMonday = (now.getDay() + 6) % 7;
      start = new Date(now);
      start.setDate(start.getDate() - daysSinceMonday);
      break;
    }
    case "month":
      start = new Date(now);
      start.setDate(start.getDate() - 29);
      break;
    case "year":
      start = new Date(now.getFullYear(), 0, 1);
      break;
  }

  return { start: start.toISOString().split("T")[0], end };
}

function getDayLabel(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("es-ES", { weekday: "short" }).slice(0, 2);
}

function getDayOfMonthLabel(dateStr: string): string {
  return new Date(dateStr + "T12:00:00").getDate().toString();
}

function getMonthLabel(dateStr: string): string {
  return new Date(dateStr + "T12:00:00")
    .toLocaleDateString("es-ES", { month: "short" })
    .slice(0, 3);
}

export default function StatsScreen() {
  const [period, setPeriod] = useState<Period>("week");
  const [data, setData] = useState<{ date: string; count: number }[]>([]);
  const [breakdown, setBreakdown] = useState<{ type: string | null; count: number }[]>([]);
  const [achievements, setAchievements] = useState<AchievementResult[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { start, end } = getDateRange(period);
    const [coffees, types, achStats] = await Promise.all([
      getCoffeesInRange(start, end),
      getCoffeeTypeBreakdown(start, end),
      getAchievementStats(),
    ]);
    setData(coffees);
    setBreakdown(types);
    setAchievements(evaluateAchievements(achStats));
    setLoading(false);
  }, [period]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const totalCoffees = data.reduce((sum, d) => sum + d.count, 0);
  const avgPerDay =
    data.length > 0 ? (totalCoffees / getDaysInPeriod(period)).toFixed(1) : "0";
  const maxDay = data.length > 0 ? Math.max(...data.map((d) => d.count)) : 0;

  function getDaysInPeriod(p: Period): number {
    switch (p) {
      case "week": return (new Date().getDay() + 6) % 7 + 1;
      case "month": return 30;
      case "year": {
        const now = new Date();
        const jan1 = new Date(now.getFullYear(), 0, 1);
        return Math.floor((now.getTime() - jan1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      }
    }
  }

  const chartData = buildChartData(period, data);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Estadísticas</Text>
      </View>

      <View style={styles.periodSelector}>
        {(["week", "month", "year"] as Period[]).map((p) => (
          <TouchableOpacity
            key={p}
            style={[
              styles.periodButton,
              period === p && styles.periodButtonActive,
            ]}
            onPress={() => setPeriod(p)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.periodText,
                period === p && styles.periodTextActive,
              ]}
            >
              {p === "week" ? "Semana" : p === "month" ? "Mes" : "Año"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalCoffees}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{avgPerDay}</Text>
          <Text style={styles.statLabel}>Promedio/día</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{maxDay}</Text>
          <Text style={styles.statLabel}>Máximo</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.chartPlaceholder}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <>
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>
              {period === "week"
                ? "Esta semana"
                : period === "month"
                ? "Últimos 30 días"
                : new Date().getFullYear().toString()}
            </Text>
            {period === "year" ? (
              <BarChart
                data={chartData}
                width={screenWidth}
                height={220}
                chartConfig={chartConfig}
                style={styles.chart}
                fromZero
                showValuesOnTopOfBars
                yAxisLabel=""
                yAxisSuffix=""
              />
            ) : (
              <LineChart
                data={chartData}
                width={screenWidth}
                height={220}
                chartConfig={{
                  ...chartConfig,
                  propsForDots: {
                    r: period === "week" ? "5" : "3",
                    strokeWidth: "2",
                    stroke: colors.accent,
                  },
                }}
                style={styles.chart}
                bezier
                fromZero
              />
            )}
          </View>

          <View style={styles.breakdownContainer}>
            <Text style={styles.breakdownTitle}>Por tipo</Text>
            {breakdown.filter((b) => b.type !== null).length === 0 ? (
              <Text style={styles.breakdownEmpty}>
                Aún no etiquetaste cafés — usá el botón ∧ para elegir el tipo al añadir.
              </Text>
            ) : (
              breakdown.filter((b) => b.type !== null).map((item) => {
                const typeInfo = getTypeById(item.type);
                const pct = totalCoffees > 0
                  ? Math.round((item.count / totalCoffees) * 100)
                  : 0;
                return (
                  <View key={item.type} style={styles.breakdownRow}>
                    <Text style={styles.breakdownEmoji}>{typeInfo.emoji}</Text>
                    <View style={styles.breakdownInfo}>
                      <View style={styles.breakdownLabelRow}>
                        <Text style={styles.breakdownLabel}>{typeInfo.label}</Text>
                        <Text style={styles.breakdownCount}>
                          {item.count} · {pct}%
                        </Text>
                      </View>
                      <View style={styles.barTrack}>
                        <View
                          style={[styles.barFill, { width: `${pct}%` as any }]}
                        />
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>

          <View style={styles.achievementsContainer}>
            <Text style={styles.achievementsTitle}>Logros</Text>
            <Text style={styles.achievementsSubtitle}>
              {achievements.filter((a) => a.unlocked).length} de {achievements.length} desbloqueados
            </Text>
            {CATEGORIES.map((cat) => {
              const catAchievements = achievements.filter(
                (a) => a.achievement.category === cat
              );
              const catLabel = CATEGORY_LABELS[cat];
              return (
                <View key={cat} style={styles.achievementCategory}>
                  <Text style={styles.categoryLabel}>{catLabel}</Text>
                  {catAchievements.map(({ achievement, unlocked }) => (
                    <View
                      key={achievement.id}
                      style={[
                        styles.achievementRow,
                        !unlocked && styles.achievementLocked,
                      ]}
                    >
                      <Text style={styles.achievementEmoji}>
                        {achievement.emoji}
                      </Text>
                      <View style={styles.achievementInfo}>
                        <Text
                          style={[
                            styles.achievementName,
                            !unlocked && styles.achievementNameLocked,
                          ]}
                        >
                          {achievement.title}
                        </Text>
                        <Text style={styles.achievementDesc}>
                          {achievement.description}
                        </Text>
                      </View>
                      {unlocked && (
                        <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
                      )}
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        </>
      )}
    </ScrollView>
  );
}

function buildChartData(period: Period, data: { date: string; count: number }[]) {
  const dataMap = new Map(data.map((d) => [d.date, d.count]));

  if (period === "week") {
    const labels: string[] = [];
    const values: number[] = [];
    const now = new Date();
    const daysSinceMonday = (now.getDay() + 6) % 7;
    for (let i = daysSinceMonday; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      labels.push(getDayLabel(key));
      values.push(dataMap.get(key) ?? 0);
    }
    return { labels, datasets: [{ data: values }] };
  }

  if (period === "month") {
    const labels: string[] = [];
    const values: number[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      labels.push(i % 5 === 0 ? getDayOfMonthLabel(key) : "");
      values.push(dataMap.get(key) ?? 0);
    }
    return { labels, datasets: [{ data: values }] };
  }

  // Year: group by month (January → current month)
  const labels: string[] = [];
  const values: number[] = [];
  const now = new Date();
  const currentMonth = now.getMonth(); // 0-indexed
  const year = now.getFullYear();
  for (let m = 0; m <= currentMonth; m++) {
    const d = new Date(year, m, 1);
    const monthStr = `${year}-${String(m + 1).padStart(2, "0")}`;
    const monthTotal = data
      .filter((entry) => entry.date.startsWith(monthStr))
      .reduce((sum, entry) => sum + entry.count, 0);
    labels.push(getMonthLabel(d.toISOString().split("T")[0]));
    values.push(monthTotal);
  }
  return { labels, datasets: [{ data: values }] };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    paddingTop: 70,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
  },
  periodSelector: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  periodButtonActive: {
    backgroundColor: colors.accent,
  },
  periodText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  periodTextActive: {
    color: colors.background,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  chartContainer: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 12,
  },
  chart: {
    borderRadius: 12,
    marginLeft: -16,
  },
  chartPlaceholder: {
    height: 260,
    backgroundColor: colors.surface,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  breakdownContainer: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 14,
  },
  breakdownEmpty: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    paddingVertical: 8,
    lineHeight: 20,
  },
  breakdownRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  breakdownEmoji: {
    fontSize: 22,
    width: 28,
    textAlign: "center",
  },
  breakdownInfo: {
    flex: 1,
    gap: 6,
  },
  breakdownLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  breakdownLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  breakdownCount: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  barTrack: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: "hidden",
  },
  barFill: {
    height: 6,
    backgroundColor: colors.accent,
    borderRadius: 3,
  },
  achievementsContainer: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  achievementsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 2,
  },
  achievementsSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  achievementCategory: {
    marginBottom: 12,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.accent,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  achievementRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: colors.surfaceLight,
  },
  achievementLocked: {
    opacity: 0.4,
  },
  achievementEmoji: {
    fontSize: 22,
    width: 28,
    textAlign: "center",
  },
  achievementInfo: {
    flex: 1,
  },
  achievementName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  achievementNameLocked: {
    color: colors.textSecondary,
  },
  achievementDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
