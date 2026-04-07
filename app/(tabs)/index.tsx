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
  getStreaks,
} from "../../lib/coffee";
import { getLocalDate, getLocalDateDisplay } from "../../lib/date";
import { showToast } from "../../lib/toast";
import { signOut } from "../../lib/auth";
import CoffeeTypePicker from "../../components/CoffeeTypePicker";

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
  const [pickerVisible, setPickerVisible] = useState(false);
  const [weekTotal, setWeekTotal] = useState(0);
  const [weekAvg, setWeekAvg] = useState("0");
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);

  const fetchData = useCallback(async () => {
    const [c, week, streaks] = await Promise.all([
      getTodayCount(),
      getWeekSummary(),
      getStreaks(),
    ]);
    setCount(c);
    setWeekTotal(week.total);
    setWeekAvg(week.avg);
    setStreak(streaks.current);
    setMaxStreak(streaks.max);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const handleAdd = async (type?: string | null) => {
    setAdding(true);
    const result = await addCoffee(type);
    if (result) {
      setCount((prev) => prev + 1);
      setWeekTotal((prev) => prev + 1);
      haptic("success");
    } else {
      showToast("No se pudo añadir el café", "error");
    }
    setAdding(false);
  };

  const handleAddWithType = (typeId: string) => {
    handleAdd(typeId);
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
        <TouchableOpacity style={styles.signOutButton} onPress={signOut} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.centerContent}>
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
          <View style={styles.streakValueRow}>
            <Text style={[styles.weekValue, streak > 0 && styles.streakValue]}>
              {streak}
            </Text>
            {streak > 0 && <Text style={styles.streakFire}>🔥</Text>}
          </View>
          <Text style={[styles.weekLabel, styles.streakLabel]}>
            {streak === 1 ? "día seguido" : "días seguidos"}
            {maxStreak > streak ? ` · max ${maxStreak}` : ""}
          </Text>
        </View>
        <View style={styles.weekDivider} />
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

        <View style={styles.addButtonGroup}>
          <TouchableOpacity
            style={[styles.addButton, adding && styles.addButtonDisabled]}
            onPress={() => handleAdd(null)}
            disabled={adding}
            activeOpacity={0.8}
          >
            {adding ? (
              <ActivityIndicator size="small" color={colors.background} />
            ) : (
              <>
                <Ionicons name="cafe" size={28} color={colors.background} />
                <Text style={styles.addButtonText}>Añadir café</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.typeButton, adding && styles.addButtonDisabled]}
            onPress={() => setPickerVisible(true)}
            disabled={adding}
            activeOpacity={0.8}
          >
            <Ionicons name="chevron-up" size={18} color={colors.background} />
          </TouchableOpacity>
        </View>

        <View style={styles.removeButton} />

        <CoffeeTypePicker
          visible={pickerVisible}
          onClose={() => setPickerVisible(false)}
          onSelect={handleAddWithType}
        />
      </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 24,
  },
  header: {
    paddingTop: Platform.OS === "web" ? 36 : 60,
    paddingBottom: 16,
    alignItems: "center",
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  signOutButton: {
    position: "absolute",
    right: -120,
    top: Platform.OS === "web" ? 36 : 60,
    padding: 8,
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
    marginTop: Platform.OS === "web" ? 6 : 16,
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
  streakValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  streakValue: {
    color: colors.accent,
  },
  streakFire: {
    fontSize: 14,
    lineHeight: 24,
  },
  streakLabel: {
    fontSize: 10,
  },
  weekValue: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },
  weekLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: "center",
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
  addButtonGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  addButton: {
    backgroundColor: colors.accent,
    height: 56,
    paddingHorizontal: 20,
    borderTopLeftRadius: 28,
    borderBottomLeftRadius: 28,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  typeButton: {
    backgroundColor: colors.accent,
    width: 40,
    height: 56,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    borderTopRightRadius: 28,
    borderBottomRightRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    borderLeftWidth: 1,
    borderLeftColor: "rgba(0,0,0,0.15)",
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
