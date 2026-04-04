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
import { colors } from "../../lib/theme";
import { getCoffeesInRange } from "../../lib/coffee";

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
    case "week":
      start = new Date(now);
      start.setDate(start.getDate() - 6);
      break;
    case "month":
      start = new Date(now);
      start.setDate(start.getDate() - 29);
      break;
    case "year":
      start = new Date(now);
      start.setMonth(start.getMonth() - 11);
      start.setDate(1);
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
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { start, end } = getDateRange(period);
    const coffees = await getCoffeesInRange(start, end);
    setData(coffees);
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
      case "week": return 7;
      case "month": return 30;
      case "year": return 365;
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
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>
            {period === "week"
              ? "Últimos 7 días"
              : period === "month"
              ? "Últimos 30 días"
              : "Últimos 12 meses"}
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
      )}
    </ScrollView>
  );
}

function buildChartData(period: Period, data: { date: string; count: number }[]) {
  const dataMap = new Map(data.map((d) => [d.date, d.count]));

  if (period === "week") {
    const labels: string[] = [];
    const values: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
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

  // Year: group by month
  const labels: string[] = [];
  const values: number[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    d.setDate(1);
    const monthStr = d.toISOString().split("T")[0].slice(0, 7);
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
});
