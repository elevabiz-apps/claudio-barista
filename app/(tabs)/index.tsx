import { useCallback, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { colors } from "../../lib/theme";
import {
  addCoffee,
  removeCoffee,
  getTodayCount,
  getWeekSummary,
} from "../../lib/coffee";
import { getLocalDate, getLocalDateDisplay } from "../../lib/date";
import { showToast } from "../../lib/toast";

function haptic(type: "success" | "light") {
  if (Platform.OS === "web") return;
  if (type === "success") {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } else {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

export default function HomeScreen() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [weekTotal, setWeekTotal] = useState(0);
  const [weekAvg, setWeekAvg] = useState("0");

  const fetchData = useCallback(async () => {
    const [c, week] = await Promise.all([getTodayCount(), getWeekSummary()]);
    setCount(c);
    setWeekTotal(week.total);
    setWeekAvg(week.avg);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const handleAdd = async () => {
    setAdding(true);
    const result = await addCoffee();
    if (result) {
      setCount((prev) => prev + 1);
      setWeekTotal((prev) => prev + 1);
      haptic("success");
    } else {
      showToast("No se pudo añadir el café", "error");
    }
    setAdding(false);
  };

  const handleRemove = async () => {
    if (count === 0) return;
    haptic("light");
    const today = getLocalDate();
    const success = await removeCoffee(today);
    if (success) {
      setCount((prev) => Math.max(0, prev - 1));
      setWeekTotal((prev) => Math.max(0, prev - 1));
    } else {
      showToast("No se pudo quitar el café", "error");
    }
  };

  const dateStr = getLocalDateDisplay();

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appName}>Contador de Cafés</Text>
        <Text style={styles.date}>{dateStr}</Text>
      </View>

      <View style={styles.counterSection}>
        <Text style={styles.counterLabel}>Cafés hoy</Text>
        <Text style={styles.counter}>{count}</Text>
        <View style={styles.coffeeIcons}>
          {Array.from({ length: Math.min(count, 10) }).map((_, i) => (
            <Ionicons
              key={i}
              name="cafe"
              size={20}
              color={colors.accent}
              style={styles.coffeeIcon}
            />
          ))}
          {count > 10 && (
            <Text style={styles.moreText}>+{count - 10}</Text>
          )}
        </View>
      </View>

      <View style={styles.weekSummary}>
        <View style={styles.weekStat}>
          <Text style={styles.weekValue}>{weekTotal}</Text>
          <Text style={styles.weekLabel}>esta semana</Text>
        </View>
        <View style={styles.weekDivider} />
        <View style={styles.weekStat}>
          <Text style={styles.weekValue}>{weekAvg}</Text>
          <Text style={styles.weekLabel}>promedio/día</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={handleRemove}
          disabled={count === 0}
          activeOpacity={0.7}
        >
          <Ionicons
            name="remove"
            size={28}
            color={count === 0 ? colors.textSecondary : colors.text}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.addButton, adding && styles.addButtonDisabled]}
          onPress={handleAdd}
          disabled={adding}
          activeOpacity={0.8}
        >
          {adding ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <>
              <Ionicons name="cafe" size={32} color={colors.background} />
              <Text style={styles.addButtonText}>Añadir café</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.removeButton} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  header: {
    position: "absolute",
    top: 70,
    alignItems: "center",
  },
  appName: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.accent,
    letterSpacing: 1,
  },
  date: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 6,
    textTransform: "capitalize",
  },
  counterSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  counterLabel: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: "500",
    marginTop: 6,
    marginBottom: 8,
  },
  counter: {
    fontSize: 120,
    fontWeight: "200",
    color: colors.text,
    lineHeight: 130,
  },
  coffeeIcons: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    height: 24,
  },
  coffeeIcon: {
    marginHorizontal: 2,
  },
  moreText: {
    color: colors.textSecondary,
    fontSize: 14,
    marginLeft: 4,
  },
  weekSummary: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 14,
    marginBottom: 32,
  },
  weekStat: {
    flex: 1,
    alignItems: "center",
  },
  weekValue: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },
  weekLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  weekDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
    marginHorizontal: 16,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  addButton: {
    backgroundColor: colors.accent,
    width: 160,
    height: 56,
    borderRadius: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  addButtonDisabled: {
    opacity: 0.7,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.background,
  },
  removeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
});
