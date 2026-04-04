import { useCallback, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../lib/theme";
import {
  getCoffeesInRange,
  addCoffeeForDate,
  removeCoffee,
} from "../../lib/coffee";
import { getLocalDate } from "../../lib/date";
import { showToast } from "../../lib/toast";

interface DayEntry {
  date: string;
  count: number;
  label: string;
  isToday: boolean;
}

function buildDayList(
  data: { date: string; count: number }[],
  today: string
): DayEntry[] {
  const dataMap = new Map(data.map((d) => [d.date, d.count]));
  const days: DayEntry[] = [];

  for (let i = 0; i < 90; i++) {
    const d = new Date(today + "T12:00:00");
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const isToday = dateStr === today;

    const label = isToday
      ? "Hoy"
      : i === 1
      ? "Ayer"
      : d.toLocaleDateString("es-ES", {
          weekday: "short",
          day: "numeric",
          month: "short",
        });

    days.push({
      date: dateStr,
      count: dataMap.get(dateStr) ?? 0,
      label,
      isToday,
    });
  }

  return days;
}

export default function HistoryScreen() {
  const [days, setDays] = useState<DayEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const today = getLocalDate();
    const start = new Date(today + "T12:00:00");
    start.setDate(start.getDate() - 89);
    const startStr = start.toISOString().split("T")[0];

    const data = await getCoffeesInRange(startStr, today);
    setDays(buildDayList(data, today));
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const handleAdd = async (date: string) => {
    const result = await addCoffeeForDate(date);
    if (result) {
      setDays((prev) =>
        prev.map((d) => (d.date === date ? { ...d, count: d.count + 1 } : d))
      );
    } else {
      showToast("No se pudo añadir", "error");
    }
  };

  const handleRemove = async (date: string, count: number) => {
    if (count === 0) return;
    const success = await removeCoffee(date);
    if (success) {
      setDays((prev) =>
        prev.map((d) =>
          d.date === date ? { ...d, count: Math.max(0, d.count - 1) } : d
        )
      );
    } else {
      showToast("No se pudo quitar", "error");
    }
  };

  const renderDay = ({ item }: { item: DayEntry }) => (
    <View style={[styles.dayRow, item.isToday && styles.dayRowToday]}>
      <View style={styles.dayInfo}>
        <Text
          style={[styles.dayLabel, item.isToday && styles.dayLabelToday]}
        >
          {item.label}
        </Text>
        <Text style={styles.dayDate}>{item.date}</Text>
      </View>

      <View style={styles.dayActions}>
        <TouchableOpacity
          style={styles.smallButton}
          onPress={() => handleRemove(item.date, item.count)}
          disabled={item.count === 0}
          activeOpacity={0.7}
        >
          <Ionicons
            name="remove"
            size={18}
            color={item.count === 0 ? colors.border : colors.textSecondary}
          />
        </TouchableOpacity>

        <View style={styles.countBadge}>
          <Ionicons name="cafe" size={14} color={colors.accent} />
          <Text style={styles.countText}>{item.count}</Text>
        </View>

        <TouchableOpacity
          style={styles.smallButton}
          onPress={() => handleAdd(item.date)}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={18} color={colors.accent} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Historial</Text>
        <Text style={styles.subtitle}>Últimos 90 días</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={days}
          keyExtractor={(item) => item.date}
          renderItem={renderDay}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 70,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  list: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  dayRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
  },
  dayRowToday: {
    borderWidth: 1,
    borderColor: colors.accent + "60",
  },
  dayInfo: {
    flex: 1,
  },
  dayLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
    textTransform: "capitalize",
  },
  dayLabelToday: {
    color: colors.accent,
  },
  dayDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  dayActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  smallButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
  },
  countBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minWidth: 44,
    justifyContent: "center",
  },
  countText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
});
