export interface CoffeeType {
  id: string;
  label: string;
  emoji: string;
}

export const COFFEE_TYPES: CoffeeType[] = [
  { id: "espresso",  label: "Espresso",  emoji: "☕" },
  { id: "americano", label: "Americano", emoji: "🫖" },
  { id: "cortado",   label: "Cortado",   emoji: "🥃" },
  { id: "latte",     label: "Latte",     emoji: "🥛" },
  { id: "capuchino", label: "Capuchino", emoji: "🧋" },
  { id: "macchiato", label: "Macchiato", emoji: "🍶" },
  { id: "mocha",     label: "Mocha",     emoji: "🍫" },
  { id: "otro",      label: "Otro",      emoji: "✨" },
];

export const UNSPECIFIED_TYPE: CoffeeType = {
  id: "unspecified",
  label: "Sin especificar",
  emoji: "·",
};

export function getTypeById(id: string | null | undefined): CoffeeType {
  if (!id) return UNSPECIFIED_TYPE;
  return COFFEE_TYPES.find((t) => t.id === id) ?? UNSPECIFIED_TYPE;
}
