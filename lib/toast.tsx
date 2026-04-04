import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "./theme";

type ToastType = "success" | "error";

interface ToastMessage {
  text: string;
  type: ToastType;
}

let showToastFn: ((msg: ToastMessage) => void) | null = null;

export function showToast(text: string, type: ToastType = "success") {
  showToastFn?.({ text, type });
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timeout = useRef<ReturnType<typeof setTimeout>>();

  const show = useCallback(
    (msg: ToastMessage) => {
      if (timeout.current) clearTimeout(timeout.current);
      setToast(msg);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
      timeout.current = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setToast(null));
      }, 2000);
    },
    [opacity]
  );

  useEffect(() => {
    showToastFn = show;
    return () => {
      showToastFn = null;
    };
  }, [show]);

  return (
    <>
      {children}
      {toast && (
        <Animated.View
          style={[
            styles.toast,
            { opacity },
            toast.type === "error" ? styles.toastError : styles.toastSuccess,
          ]}
          pointerEvents="none"
        >
          <Ionicons
            name={toast.type === "error" ? "alert-circle" : "checkmark-circle"}
            size={18}
            color={toast.type === "error" ? colors.danger : colors.success}
          />
          <Text style={styles.toastText}>{toast.text}</Text>
        </Animated.View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    top: 60,
    left: 24,
    right: 24,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  toastSuccess: {
    borderColor: colors.success + "40",
  },
  toastError: {
    borderColor: colors.danger + "40",
  },
  toastText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
});
