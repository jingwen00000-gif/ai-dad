/**
 * AI 爸爸虚拟形象的“外观”配置。家长在 /parent/avatar 里调成自己的样子。
 * 以后接后端时存到 dad_avatar 表（属于家长账号）。
 */

export type AvatarState = "idle" | "waving" | "listening" | "thinking" | "talking" | "happy";

export interface DadLook {
  skin: SkinTone;
  hairStyle: HairStyle;
  hairColor: HairColor;
  glasses: Glasses;
  beard: Beard;
  shirt: ShirtColor;
}

export type SkinTone = "light" | "medium" | "tan" | "deep";
export type HairStyle = "short" | "side" | "curly" | "buzz" | "bald";
export type HairColor = "black" | "brown" | "gray" | "blonde";
export type Glasses = "none" | "square" | "round";
export type Beard = "none" | "stubble" | "mustache" | "full";
export type ShirtColor = "blue" | "green" | "red" | "gray" | "yellow";

export const SKIN: Record<SkinTone, { face: string; shade: string; label: string }> = {
  light: { face: "#F8D2AE", shade: "#EDBD95", label: "Light" },
  medium: { face: "#EBB98F", shade: "#DCA57A", label: "Medium" },
  tan: { face: "#C98E63", shade: "#B67C52", label: "Tan" },
  deep: { face: "#8D5A3B", shade: "#7A4C31", label: "Deep" },
};

export const HAIR_COLORS: Record<HairColor, { color: string; label: string }> = {
  black: { color: "#2B211C", label: "Black" },
  brown: { color: "#5A3A22", label: "Brown" },
  gray: { color: "#8E8E8E", label: "Gray" },
  blonde: { color: "#C99A4B", label: "Blonde" },
};

export const SHIRTS: Record<ShirtColor, { color: string; collar: string; label: string }> = {
  blue: { color: "#2F6FED", collar: "#FFC93C", label: "Blue" },
  green: { color: "#22A06B", collar: "#FFFFFF", label: "Green" },
  red: { color: "#E5484D", collar: "#FFFFFF", label: "Red" },
  gray: { color: "#6B7390", collar: "#FFC93C", label: "Gray" },
  yellow: { color: "#FFC93C", collar: "#2F6FED", label: "Yellow" },
};

export const HAIR_STYLES: { value: HairStyle; label: string }[] = [
  { value: "short", label: "Short" },
  { value: "side", label: "Side part" },
  { value: "curly", label: "Curly" },
  { value: "buzz", label: "Buzz cut" },
  { value: "bald", label: "Bald" },
];

export const GLASSES: { value: Glasses; label: string }[] = [
  { value: "none", label: "None" },
  { value: "square", label: "Square" },
  { value: "round", label: "Round" },
];

export const BEARDS: { value: Beard; label: string }[] = [
  { value: "none", label: "None" },
  { value: "stubble", label: "Stubble" },
  { value: "mustache", label: "Mustache" },
  { value: "full", label: "Full beard" },
];

export const DEFAULT_LOOK: DadLook = {
  skin: "light",
  hairStyle: "short",
  hairColor: "black",
  glasses: "square",
  beard: "none",
  shirt: "blue",
};
