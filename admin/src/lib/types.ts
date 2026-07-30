export type Variant = {
  id: string;
  label: string;
  price: number;
};

export type Extra = {
  id: string;
  label: string;
  price: number | null;
};

export type Product = {
  id: string;
  name: string;
  categoryId: string;
  image: string;
  active: boolean;
  priceMode: "single" | "variants";
  price: number | null;
  variants: Variant[];
  extras: Extra[];
};

export type Category = {
  id: string;
  name: string;
  image: string;
};

export type Toast = {
  id: number;
  message: string;
  tone: "success" | "warning";
};

export type ConfirmState = {
  title: string;
  message: string;
  actionLabel: string;
  onConfirm: () => void;
} | null;
