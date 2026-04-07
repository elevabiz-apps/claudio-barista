import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../lib/theme";
import { COFFEE_TYPES, CoffeeType } from "../lib/coffeeTypes";

interface CoffeeTypePickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (typeId: string) => void;
}

export default function CoffeeTypePicker({
  visible,
  onClose,
  onSelect,
}: CoffeeTypePickerProps) {
  const handleSelect = (type: CoffeeType) => {
    onSelect(type.id);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      />

      {/* Sheet */}
      <View style={styles.sheet}>
        <View style={styles.handle} />

        <View style={styles.header}>
          <Text style={styles.title}>Elegí un café</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={COFFEE_TYPES}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.typeItem}
              onPress={() => handleSelect(item)}
              activeOpacity={0.7}
            >
              <Text style={styles.typeEmoji}>{item.emoji}</Text>
              <Text style={styles.typeLabel}>{item.label}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 36,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },
  row: {
    gap: 12,
    marginBottom: 12,
  },
  typeItem: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    gap: 8,
  },
  typeEmoji: {
    fontSize: 32,
  },
  typeLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },
});
