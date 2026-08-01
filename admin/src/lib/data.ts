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

export function stripSizeFromName(name: string): string {
  if (!name) return "";
  let cleaned = name.replace(/\s*\b(?:\(?\d+(?:,\d+)?\s*(?:cl|kg|l|litre)\.?\)?)\b/gi, "");
  cleaned = cleaned.replace(/\s*\(\s*Kg\s*\)/gi, "");
  return cleaned.replace(/\s+/g, " ").trim();
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
  // Split on commas that are NOT between digits (to preserve Turkish decimal like 120,00)
  const parts = str.split(/,(?!\d)/).map((s) => s.trim()).filter(Boolean);
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

  const groupCandidates: Record<string, {
    baseName: string;
    rows: any[];
  }> = {};

  const standaloneRows: any[] = [];

  // Pass 1: Identify items with size patterns
  data.forEach((row) => {
    const rawName = row.name_tr || "";
    const clMatch = rawName.match(/\s+(\d+(?:,\d+)?\s*(?:cl|kg)\.?)\b/i);

    if (clMatch) {
      const baseName = stripSizeFromName(rawName);
      const groupKey = `${row.category_id}_${baseName.toLowerCase()}`;

      if (!groupCandidates[groupKey]) {
        groupCandidates[groupKey] = {
          baseName,
          rows: [],
        };
      }
      groupCandidates[groupKey].rows.push(row);
    } else {
      standaloneRows.push(row);
    }
  });

  const products: Product[] = [];

  // Pass 2: Process group candidates (only group if count >= 2)
  Object.keys(groupCandidates).forEach((groupKey) => {
    const candidate = groupCandidates[groupKey];
    if (candidate.rows.length >= 2) {
      // Multiple items share baseName -> Form a Variant Product
      const firstRow = candidate.rows[0];
      const extrasTrList = parseExtrasString(firstRow.extras_tr, `tr-${firstRow.id}`);
      const extrasEnList = parseExtrasString(firstRow.extras_en, `en-${firstRow.id}`);
      const extrasArList = parseExtrasString(firstRow.extras_ar, `ar-${firstRow.id}`);
      const extrasRuList = parseExtrasString(firstRow.extras_ru, `ru-${firstRow.id}`);

      let groupImage = "";
      let groupActive = false;

      const variants: Variant[] = candidate.rows.map((r) => {
        if (r.is_active) groupActive = true;
        if (r.image && !groupImage) groupImage = r.image;

        const sizeMatch = r.name_tr.match(/\s+(\d+(?:,\d+)?\s*(?:cl|kg)\.?)\b/i);
        const sizeStr = sizeMatch ? sizeMatch[1].trim() : r.name_tr;
        return {
          id: r.id,
          label: sizeStr,
          price: parseFloat(r.price) || 0,
        };
      });

      variants.sort((a, b) => {
        const aVal = parseFloat(a.label.replace(",", "."));
        const bVal = parseFloat(b.label.replace(",", "."));
        return (aVal || 0) - (bVal || 0);
      });

      products.push({
        id: `group_${groupKey}`,
        name: candidate.baseName,
        name_en: stripSizeFromName(firstRow.name_en || ""),
        name_ar: stripSizeFromName(firstRow.name_ar || ""),
        name_ru: stripSizeFromName(firstRow.name_ru || ""),
        categoryId: firstRow.category_id,
        image: groupImage || firstRow.image || "",
        active: groupActive,
        priceMode: "variants",
        price: null,
        variants,
        extras: extrasTrList,
        extras_en: extrasEnList,
        extras_ar: extrasArList,
        extras_ru: extrasRuList,
        sort_order: firstRow.sort_order ?? 0,
      });
    } else {
      // Only 1 item had size pattern (e.g., "Corona 33 cl") -> Keep as Standalone Single Price Product
      candidate.rows.forEach((r) => standaloneRows.push(r));
    }
  });

  // Pass 3: Process standalone single price products (preserve full name_tr as-is)
  standaloneRows.forEach((row) => {
    products.push({
      id: row.id,
      name: row.name_tr || "", // PRESERVE FULL NAME AS IS (e.g. "Corona 33 cl", "X Rakı 70 cl")
      name_en: row.name_en || "",
      name_ar: row.name_ar || "",
      name_ru: row.name_ru || "",
      categoryId: row.category_id,
      image: row.image || "",
      active: row.is_active ?? true,
      priceMode: "single",
      price: parseFloat(row.price) || 0,
      variants: [],
      extras: parseExtrasString(row.extras_tr, `tr-${row.id}`),
      extras_en: parseExtrasString(row.extras_en, `en-${row.id}`),
      extras_ar: parseExtrasString(row.extras_ar, `ar-${row.id}`),
      extras_ru: parseExtrasString(row.extras_ru, `ru-${row.id}`),
      sort_order: row.sort_order ?? 0,
    });
  });

  return products;
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
      // Single price mode: Preserve product.name EXACTLY as entered by user (e.g. "X Rakı 70 cl")
      const isExistingUuid = product.id && !product.id.startsWith("product-") && !product.id.startsWith("group_");
      const payload: any = {
        category_id: product.categoryId,
        name_tr: product.name, // NO STRIPPING FOR SINGLE PRICE!
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
      // Variant mode: Base name is stripped of size, variants get "${cleanName} ${v.label}"
      const cleanNameTr = stripSizeFromName(product.name);
      const cleanNameEn = product.name_en ? stripSizeFromName(product.name_en) : null;
      const cleanNameAr = product.name_ar ? stripSizeFromName(product.name_ar) : null;
      const cleanNameRu = product.name_ru ? stripSizeFromName(product.name_ru) : null;

      for (const v of product.variants) {
        const cleanVariantLabel = stripSizeFromName(v.label) || v.label;
        const sizeNameTr = `${cleanNameTr} ${cleanVariantLabel}`.trim();
        const sizeNameEn = cleanNameEn ? `${cleanNameEn} ${cleanVariantLabel}`.trim() : null;
        const sizeNameAr = cleanNameAr ? `${cleanNameAr} ${cleanVariantLabel}`.trim() : null;
        const sizeNameRu = cleanNameRu ? `${cleanNameRu} ${cleanVariantLabel}`.trim() : null;

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
