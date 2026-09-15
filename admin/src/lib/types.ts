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
  name: string; // name_tr
  name_en?: string;
  name_ar?: string;
  name_ru?: string;
  categoryId: string;
  image: string;
  active: boolean;
  priceMode: "single" | "variants";
  price: number | null;
  variants: Variant[];
  extras: Extra[]; // extras_tr
  extras_en?: Extra[];
  extras_ar?: Extra[];
  extras_ru?: Extra[];
  sort_order?: number;
};

export type Category = {
  id: string;
  name: string; // name_tr
  name_en?: string;
  name_ar?: string;
  name_ru?: string;
  image: string;
  sort_order?: number;
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
