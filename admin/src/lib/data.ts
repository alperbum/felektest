import { supabase } from "./supabase";
import type { Category, Extra, Product, Variant } from "./types";

export const VARIANT_PRESETS = [
  "Tek",
  "Duble",
  "35 cl",
  "50 cl",
  "70 cl",
  "100 cl",
  "1 Porsiyon",
  "Kg",
];

export const EXTRA_PRESETS = ["Duble Porsiyon", "Tek Viski", "Yarım Porsiyon"];

export function createId(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 10000)}`;
}

export function formatPrice(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/** Converts strings like "1.250,50" · "1250.5" · "1250" to float numbers */
export function parsePrice(input: string): number | null {
  const cleaned = input.replace(/\s|₺/g, "").replace(/\./g, "").replace(",", ".");
  if (!cleaned) return null;
  const value = Number(cleaned);
  if (Number.isNaN(value) || value < 0) return null;
  return value;
}

export function formatExtra(extra: Extra) {
  return extra.price !== null && extra.price > 0
    ? `${extra.label}: ${formatPrice(extra.price)}`
    : extra.label;
}

// ─── IMAGE COMPRESSION & STORAGE ──────────────────────────────────────
const MAX_DIMENSION = 1200;
const COMPRESS_QUALITY = 0.82;

export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round(height * (MAX_DIMENSION / width));
          width = MAX_DIMENSION;
        } else {
          width = Math.round(width * (MAX_DIMENSION / height));
          height = MAX_DIMENSION;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(file);
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), { type: "image/webp" }));
          } else {
            resolve(file);
          }
        },
        "image/webp",
        COMPRESS_QUALITY
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
}

export async function uploadImageToStorage(file: File, folder: string = "items"): Promise<string | null> {
  try {
    const compressed = await compressImage(file);
    const fileExt = compressed.name.split(".").pop() || "webp";
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { error } = await supabase.storage.from("images").upload(filePath, compressed, {
      cacheControl: "86400",
      upsert: false,
      contentType: compressed.type || "image/webp",
    });

    if (error) {
      console.error("Storage upload error:", error);
      return null;
    }

    const { data } = supabase.storage.from("images").getPublicUrl(filePath);
    return data.publicUrl;
  } catch (err) {
    console.error("Image upload failed:", err);
    return null;
  }
}

// ─── SUPABASE API: CATEGORIES ─────────────────────────────────────────
export async function fetchCategoriesFromSupabase(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error || !data) {
    console.error("Error fetching categories:", error);
    return [];
  }

  return data.map((c) => ({
    id: c.id,
    name: c.name_tr || c.id,
    image: c.image || "",
  }));
}

export async function saveCategoryToSupabase(category: Category): Promise<boolean> {
  const payload = {
    id: category.id,
    name_tr: category.name,
    image: category.image || "",
  };

  const { error } = await supabase.from("categories").upsert(payload);
  if (error) {
    console.error("Error saving category:", error);
    return false;
  }
  return true;
}

export async function deleteCategoryFromSupabase(categoryId: string): Promise<boolean> {
  const { error } = await supabase.from("categories").delete().eq("id", categoryId);
  if (error) {
    console.error("Error deleting category:", error);
    return false;
  }
  return true;
}

// ─── SUPABASE API: PRODUCTS & VARIANTS ───────────────────────────────
export async function fetchProductsFromSupabase(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("menu_items")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error || !data) {
    console.error("Error fetching menu items:", error);
    return [];
  }

  // Group items by base name if they are size variants (e.g. "Yeni Rakı 35 cl", "Yeni Rakı 50 cl")
  const groups: Record<string, {
    baseName: string;
    categoryId: string;
    image: string;
    active: boolean;
    variants: Variant[];
    extras: Extra[];
  }> = {};

  const standaloneProducts: Product[] = [];

  data.forEach((row) => {
    const rawName = row.name_tr || "";
    const priceVal = parseFloat(row.price) || 0;
    const clMatch = rawName.match(/\s+(\d+(?:,\d+)?\s*(?:cl|kg)\.?)\b/i);

    // Parse extras_tr if present
    const extrasList: Extra[] = [];
    if (row.extras_tr) {
      const parts = row.extras_tr.split(",").map((s: string) => s.trim()).filter(Boolean);
      parts.forEach((p: string, idx: number) => {
        const pPriceMatch = p.match(/\+?₺\s*([\d.,]+)/);
        const pPrice = pPriceMatch ? parsePrice(pPriceMatch[1]) : null;
        const pLabel = p.replace(/\+?₺\s*[\d.,]+/, "").trim() || p;
        extrasList.push({ id: `ex-${row.id}-${idx}`, label: pLabel, price: pPrice });
      });
    }

    if (clMatch) {
      const sizeStr = clMatch[1].trim();
      const baseName = rawName.replace(clMatch[0], "").replace(/\s+/g, " ").trim();
      const groupKey = `${row.category_id}_${baseName.toLowerCase()}`;

      if (!groups[groupKey]) {
        groups[groupKey] = {
          baseName,
          categoryId: row.category_id,
          image: row.image || "",
          active: row.is_active ?? true,
          variants: [],
          extras: extrasList,
        };
      }

      groups[groupKey].variants.push({
        id: row.id,
        label: sizeStr,
        price: priceVal,
      });

      if (row.is_active) groups[groupKey].active = true;
      if (row.image && !groups[groupKey].image) groups[groupKey].image = row.image;
    } else {
      standaloneProducts.push({
        id: row.id,
        name: rawName,
        categoryId: row.category_id,
        image: row.image || "",
        active: row.is_active ?? true,
        priceMode: "single",
        price: priceVal,
        variants: [],
        extras: extrasList,
      });
    }
  });

  const groupedProducts: Product[] = Object.keys(groups).map((key) => {
    const g = groups[key];
    // Sort variants by size float value
    g.variants.sort((a, b) => {
      const aVal = parseFloat(a.label.replace(",", "."));
      const bVal = parseFloat(b.label.replace(",", "."));
      return (aVal || 0) - (bVal || 0);
    });

    return {
      id: `group_${key}`,
      name: g.baseName,
      categoryId: g.categoryId,
      image: g.image,
      active: g.active,
      priceMode: "variants",
      price: null,
      variants: g.variants,
      extras: g.extras,
    };
  });

  return [...groupedProducts, ...standaloneProducts];
}

export async function saveProductToSupabase(product: Product): Promise<boolean> {
  try {
    const extrasString = product.extras.length > 0
      ? product.extras.map((e) => formatExtra(e)).join(", ")
      : null;

    if (product.priceMode === "single") {
      const isExistingUuid = product.id && !product.id.startsWith("product-") && !product.id.startsWith("group_");
      const payload: any = {
        category_id: product.categoryId,
        name_tr: product.name,
        price: product.price ?? 0,
        is_active: product.active,
        image: product.image || "",
        extras_tr: extrasString,
      };

      if (isExistingUuid) {
        payload.id = product.id;
        const { error } = await supabase.from("menu_items").update(payload).eq("id", product.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("menu_items").insert([payload]);
        if (error) throw error;
      }
    } else {
      // Variants mode (e.g. "Yeni Rakı" with 35 cl, 50 cl, 70 cl)
      // Save each size as a distinct row in menu_items so frontend menu.html reads it seamlessly
      for (const v of product.variants) {
        const sizeName = `${product.name} ${v.label}`.trim();
        const isExistingUuid = v.id && !v.id.startsWith("variant-") && !v.id.startsWith("v");
        const payload: any = {
          category_id: product.categoryId,
          name_tr: sizeName,
          price: v.price,
          is_active: product.active,
          image: product.image || "",
          extras_tr: extrasString,
        };

        if (isExistingUuid) {
          payload.id = v.id;
          const { error } = await supabase.from("menu_items").update(payload).eq("id", v.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("menu_items").insert([payload]);
          if (error) throw error;
        }
      }
    }

    return true;
  } catch (err) {
    console.error("Error saving product to Supabase:", err);
    return false;
  }
}

export async function toggleProductActiveInSupabase(product: Product): Promise<boolean> {
  try {
    const nextStatus = !product.active;
    if (product.priceMode === "single") {
      const { error } = await supabase.from("menu_items").update({ is_active: nextStatus }).eq("id", product.id);
      if (error) throw error;
    } else {
      // Toggle all variants in group
      const variantIds = product.variants.map((v) => v.id);
      const { error } = await supabase.from("menu_items").update({ is_active: nextStatus }).in("id", variantIds);
      if (error) throw error;
    }
    return true;
  } catch (err) {
    console.error("Error toggling product status:", err);
    return false;
  }
}

export async function deleteProductFromSupabase(product: Product): Promise<boolean> {
  try {
    if (product.priceMode === "single") {
      const { error } = await supabase.from("menu_items").delete().eq("id", product.id);
      if (error) throw error;
    } else {
      const variantIds = product.variants.map((v) => v.id);
      const { error } = await supabase.from("menu_items").delete().in("id", variantIds);
      if (error) throw error;
    }
    return true;
  } catch (err) {
    console.error("Error deleting product:", err);
    return false;
  }
}

export function priceSummary(product: Product) {
  if (product.priceMode === "single") {
    return product.price !== null ? formatPrice(product.price) : "Fiyat yok";
  }
  if (product.variants.length === 0) return "Fiyat yok";
  const prices = product.variants.map((v) => v.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? formatPrice(min) : `${formatPrice(min)} – ${formatPrice(max)}`;
}
