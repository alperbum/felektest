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

export function parsePrice(input: string): number | null {
  const cleaned = input.replace(/\s|₺/g, "").replace(/\./g, "").replace(",", ".");
  if (!cleaned) return null;
  const value = Number(cleaned);
  if (Number.isNaN(value) || value < 0) return null;
  return value;
}

export function formatExtra(extra: Extra) {
  if (extra.label.includes("₺")) {
    return extra.label;
  }
  if (extra.price !== null && extra.price > 0) {
    const priceStr = new Intl.NumberFormat("tr-TR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(extra.price);
    return `+₺${priceStr} ${extra.label}`;
  }
  return extra.label;
}

function parseExtrasString(str: string | null | undefined, prefix: string): Extra[] {
  if (!str) return [];
  const parts = str.split(",").map((s) => s.trim()).filter(Boolean);
  return parts.map((p, idx) => {
    const match = p.match(/\+?\s*₺\s*([\d\.]+(?:,\d+)?)/);
    let pPrice: number | null = null;
    let pLabel = p;
    if (match) {
      pPrice = parsePrice(match[1]);
      pLabel = p.replace(/\+?\s*₺\s*[\d\.]+(?:,\d+)?/, "").replace(/^:\s*/, "").replace(/:\s*$/, "").trim();
    }
    if (!pLabel) pLabel = p;
    return { id: `ex-${prefix}-${idx}`, label: pLabel, price: pPrice };
  });
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
    name_en: c.name_en || "",
    name_ar: c.name_ar || "",
    name_ru: c.name_ru || "",
    image: c.image || "",
    sort_order: c.sort_order ?? 0,
  }));
}

export async function saveCategoryToSupabase(category: Category): Promise<boolean> {
  const payload = {
    id: category.id,
    name_tr: category.name,
    name_en: category.name_en || null,
    name_ar: category.name_ar || null,
    name_ru: category.name_ru || null,
    image: category.image || "",
    sort_order: category.sort_order ?? 0,
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

  const groups: Record<string, {
    baseName: string;
    name_en?: string;
    name_ar?: string;
    name_ru?: string;
    categoryId: string;
    image: string;
    active: boolean;
    sort_order: number;
    variants: Variant[];
    extras: Extra[];
    extras_en: Extra[];
    extras_ar: Extra[];
    extras_ru: Extra[];
  }> = {};

  const standaloneProducts: Product[] = [];

  data.forEach((row) => {
    const rawName = row.name_tr || "";
    const priceVal = parseFloat(row.price) || 0;
    const clMatch = rawName.match(/\s+(\d+(?:,\d+)?\s*(?:cl|kg)\.?)\b/i);

    const extrasTrList = parseExtrasString(row.extras_tr, `tr-${row.id}`);
    const extrasEnList = parseExtrasString(row.extras_en, `en-${row.id}`);
    const extrasArList = parseExtrasString(row.extras_ar, `ar-${row.id}`);
    const extrasRuList = parseExtrasString(row.extras_ru, `ru-${row.id}`);

    if (clMatch) {
      const sizeStr = clMatch[1].trim();
      const baseName = rawName.replace(clMatch[0], "").replace(/\s+/g, " ").trim();
      const groupKey = `${row.category_id}_${baseName.toLowerCase()}`;

      if (!groups[groupKey]) {
        groups[groupKey] = {
          baseName,
          name_en: row.name_en || "",
          name_ar: row.name_ar || "",
          name_ru: row.name_ru || "",
          categoryId: row.category_id,
          image: row.image || "",
          active: row.is_active ?? true,
          sort_order: row.sort_order ?? 0,
          variants: [],
          extras: extrasTrList,
          extras_en: extrasEnList,
          extras_ar: extrasArList,
          extras_ru: extrasRuList,
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
        name_en: row.name_en || "",
        name_ar: row.name_ar || "",
        name_ru: row.name_ru || "",
        categoryId: row.category_id,
        image: row.image || "",
        active: row.is_active ?? true,
        priceMode: "single",
        price: priceVal,
        variants: [],
        extras: extrasTrList,
        extras_en: extrasEnList,
        extras_ar: extrasArList,
        extras_ru: extrasRuList,
        sort_order: row.sort_order ?? 0,
      });
    }
  });

  const groupedProducts: Product[] = Object.keys(groups).map((key) => {
    const g = groups[key];
    g.variants.sort((a, b) => {
      const aVal = parseFloat(a.label.replace(",", "."));
      const bVal = parseFloat(b.label.replace(",", "."));
      return (aVal || 0) - (bVal || 0);
    });

    return {
      id: `group_${key}`,
      name: g.baseName,
      name_en: g.name_en,
      name_ar: g.name_ar,
      name_ru: g.name_ru,
      categoryId: g.categoryId,
      image: g.image,
      active: g.active,
      priceMode: "variants",
      price: null,
      variants: g.variants,
      extras: g.extras,
      extras_en: g.extras_en,
      extras_ar: g.extras_ar,
      extras_ru: g.extras_ru,
      sort_order: g.sort_order,
    };
  });

  return [...groupedProducts, ...standaloneProducts];
}

export async function saveProductToSupabase(product: Product): Promise<boolean> {
  try {
    const extrasTrStr = product.extras && product.extras.length > 0
      ? product.extras.map((e) => formatExtra(e)).join(", ")
      : null;
    const extrasEnStr = product.extras_en && product.extras_en.length > 0
      ? product.extras_en.map((e) => formatExtra(e)).join(", ")
      : null;
    const extrasArStr = product.extras_ar && product.extras_ar.length > 0
      ? product.extras_ar.map((e) => formatExtra(e)).join(", ")
      : null;
    const extrasRuStr = product.extras_ru && product.extras_ru.length > 0
      ? product.extras_ru.map((e) => formatExtra(e)).join(", ")
      : null;

    if (product.priceMode === "single") {
      const isExistingUuid = product.id && !product.id.startsWith("product-") && !product.id.startsWith("group_");
      const payload: any = {
        category_id: product.categoryId,
        name_tr: product.name,
        name_en: product.name_en || null,
        name_ar: product.name_ar || null,
        name_ru: product.name_ru || null,
        price: product.price ?? 0,
        is_active: product.active,
        image: product.image || "",
        extras_tr: extrasTrStr,
        extras_en: extrasEnStr,
        extras_ar: extrasArStr,
        extras_ru: extrasRuStr,
        sort_order: product.sort_order ?? 0,
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
      for (const v of product.variants) {
        const sizeNameTr = `${product.name} ${v.label}`.trim();
        const sizeNameEn = product.name_en ? `${product.name_en} ${v.label}`.trim() : null;
        const sizeNameAr = product.name_ar ? `${product.name_ar} ${v.label}`.trim() : null;
        const sizeNameRu = product.name_ru ? `${product.name_ru} ${v.label}`.trim() : null;

        const isExistingUuid = v.id && !v.id.startsWith("variant-") && !v.id.startsWith("v");
        const payload: any = {
          category_id: product.categoryId,
          name_tr: sizeNameTr,
          name_en: sizeNameEn,
          name_ar: sizeNameAr,
          name_ru: sizeNameRu,
          price: v.price,
          is_active: product.active,
          image: product.image || "",
          extras_tr: extrasTrStr,
          extras_en: extrasEnStr,
          extras_ar: extrasArStr,
          extras_ru: extrasRuStr,
          sort_order: product.sort_order ?? 0,
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
