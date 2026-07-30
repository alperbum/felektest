import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronDown,
  Globe,
  Image as ImageIcon,
  ImagePlus,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import {
  EXTRA_PRESETS,
  VARIANT_PRESETS,
  createId,
  formatPrice,
  parsePrice,
  uploadImageToStorage,
} from "../lib/data";
import type { Category, Extra, Product } from "../lib/types";

type DraftRow = { id: string; label: string; price: string };
type Lang = "tr" | "en" | "ar" | "ru";

type Errors = {
  name?: string;
  category?: string;
  price?: string;
  variants?: string;
};

function toDraftPrice(value: number | null) {
  return value === null ? "" : String(value).replace(".", ",");
}

function extrasToDraft(list?: Extra[]): DraftRow[] {
  if (!list || list.length === 0) return [];
  return list.map((extra) => ({
    id: extra.id,
    label: extra.label,
    price: toDraftPrice(extra.price),
  }));
}

function draftToExtras(rows: DraftRow[]): Extra[] {
  return rows
    .filter((row) => row.label.trim())
    .map((row) => {
      const value = parsePrice(row.price);
      return {
        id: row.id,
        label: row.label.trim(),
        price: value !== null && value > 0 ? value : null,
      };
    });
}

export default function ProductEditor({
  product,
  categories,
  defaultCategoryId,
  onClose,
  onSave,
}: {
  product: Product | null;
  categories: Category[];
  defaultCategoryId: string;
  onClose: () => void;
  onSave: (product: Product) => void;
}) {
  const [lang, setLang] = useState<Lang>("tr");

  // Multi-language names
  const [nameTr, setNameTr] = useState(product?.name ?? "");
  const [nameEn, setNameEn] = useState(product?.name_en ?? "");
  const [nameAr, setNameAr] = useState(product?.name_ar ?? "");
  const [nameRu, setNameRu] = useState(product?.name_ru ?? "");

  const [categoryId, setCategoryId] = useState(
    product?.categoryId ?? defaultCategoryId ?? categories[0]?.id ?? ""
  );
  const [sortOrder, setSortOrder] = useState<number>(product?.sort_order ?? 0);
  const [image, setImage] = useState(product?.image ?? "");
  const [uploading, setUploading] = useState(false);
  const [active, setActive] = useState(product?.active ?? true);
  const [priceMode, setPriceMode] = useState<"single" | "variants">(
    product?.priceMode ?? "single"
  );
  const [price, setPrice] = useState(toDraftPrice(product?.price ?? null));
  const [variants, setVariants] = useState<DraftRow[]>(
    product?.variants.length
      ? product.variants.map((variant) => ({
          id: variant.id,
          label: variant.label,
          price: toDraftPrice(variant.price),
        }))
      : [{ id: createId("variant"), label: "", price: "" }]
  );

  // Multi-language extras
  const [extrasTr, setExtrasTr] = useState<DraftRow[]>(extrasToDraft(product?.extras));
  const [extrasEn, setExtrasEn] = useState<DraftRow[]>(extrasToDraft(product?.extras_en));
  const [extrasAr, setExtrasAr] = useState<DraftRow[]>(extrasToDraft(product?.extras_ar));
  const [extrasRu, setExtrasRu] = useState<DraftRow[]>(extrasToDraft(product?.extras_ru));

  const [extrasOpen, setExtrasOpen] = useState(
    Boolean(product?.extras.length || product?.extras_en?.length || product?.extras_ar?.length || product?.extras_ru?.length)
  );
  const [errors, setErrors] = useState<Errors>({});

  const handleImage = async (file?: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    setUploading(true);
    const uploadedUrl = await uploadImageToStorage(file, categoryId || "items");
    setUploading(false);
    if (uploadedUrl) {
      setImage(uploadedUrl);
    } else {
      const reader = new FileReader();
      reader.onload = () => setImage(String(reader.result));
      reader.readAsDataURL(file);
    }
  };

  const updateRow = (
    setter: React.Dispatch<React.SetStateAction<DraftRow[]>>,
    id: string,
    field: "label" | "price",
    value: string
  ) => {
    setter((current) =>
      current.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const addVariant = (label = "") => {
    setVariants((current) => [
      ...current,
      { id: createId("variant"), label, price: "" },
    ]);
    setErrors((current) => ({ ...current, variants: undefined }));
  };

  const currentExtrasSetter = () => {
    if (lang === "en") return setExtrasEn;
    if (lang === "ar") return setExtrasAr;
    if (lang === "ru") return setExtrasRu;
    return setExtrasTr;
  };

  const currentExtrasList = () => {
    if (lang === "en") return extrasEn;
    if (lang === "ar") return extrasAr;
    if (lang === "ru") return extrasRu;
    return extrasTr;
  };

  const addExtra = (label = "") => {
    currentExtrasSetter()((current) => [...current, { id: createId("extra"), label, price: "" }]);
    setExtrasOpen(true);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: Errors = {};

    if (!nameTr.trim()) nextErrors.name = "Türkçe ürün adını yazın.";
    if (!categoryId) nextErrors.category = "Bir kategori seçin.";

    let singlePrice: number | null = null;
    let cleanVariants: Array<{ id: string; label: string; price: number }> = [];

    if (priceMode === "single") {
      singlePrice = parsePrice(price);
      if (singlePrice === null || singlePrice <= 0) {
        nextErrors.price = "Geçerli bir fiyat yazın. Örn: 350";
      }
    } else {
      const filled = variants.filter((row) => row.label.trim() || row.price.trim());
      if (filled.length === 0) {
        nextErrors.variants = "En az bir boyut ve fiyatı ekleyin.";
      } else if (
        filled.some(
          (row) =>
            !row.label.trim() ||
            parsePrice(row.price) === null ||
            (parsePrice(row.price) ?? 0) <= 0
        )
      ) {
        nextErrors.variants = "Her boyutun adı ve fiyatı dolu olmalı.";
      } else {
        cleanVariants = filled.map((row) => ({
          id: row.id,
          label: row.label.trim(),
          price: parsePrice(row.price) as number,
        }));
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onSave({
      id: product?.id ?? createId("product"),
      name: nameTr.trim(),
      name_en: nameEn.trim() || undefined,
      name_ar: nameAr.trim() || undefined,
      name_ru: nameRu.trim() || undefined,
      categoryId,
      image,
      active,
      priceMode,
      price: priceMode === "single" ? singlePrice : null,
      variants: priceMode === "variants" ? cleanVariants : [],
      extras: draftToExtras(extrasTr),
      extras_en: draftToExtras(extrasEn),
      extras_ar: draftToExtras(extrasAr),
      extras_ru: draftToExtras(extrasRu),
      sort_order: sortOrder,
    });
  };

  return (
    <>
      <motion.button
        type="button"
        className="drawer-backdrop"
        aria-label="Pencereyi kapat"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      <motion.aside
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-editor-title"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 34 }}
      >
        <form className="drawer-form" onSubmit={handleSubmit}>
          <header className="drawer-header">
            <div>
              <span className="drawer-kicker">
                {product ? "Ürünü düzenle" : "Yeni ürün"}
              </span>
              <h2 id="product-editor-title">{product ? product.name : "Ürün ekleyin"}</h2>
            </div>
            <button type="button" className="icon-button" onClick={onClose}>
              <X size={22} />
              <span className="sr-only">Kapat</span>
            </button>
          </header>

          {/* ─── DİL SEKMELERİ (LANG TABS) ───────────────────────────────── */}
          <div style={{ display: "flex", gap: "6px", background: "var(--sidebar)", padding: "8px 24px", borderBottom: "1px solid var(--line)" }}>
            <button
              type="button"
              className={`button ${lang === "tr" ? "button-primary" : "button-secondary"}`}
              onClick={() => setLang("tr")}
              style={{ height: "34px", padding: "0 12px", fontSize: "12px" }}
            >
              🇹🇷 Türkçe
            </button>
            <button
              type="button"
              className={`button ${lang === "en" ? "button-primary" : "button-secondary"}`}
              onClick={() => setLang("en")}
              style={{ height: "34px", padding: "0 12px", fontSize: "12px" }}
            >
              🇬🇧 English {nameEn && "✓"}
            </button>
            <button
              type="button"
              className={`button ${lang === "ar" ? "button-primary" : "button-secondary"}`}
              onClick={() => setLang("ar")}
              style={{ height: "34px", padding: "0 12px", fontSize: "12px" }}
            >
              🇸🇦 العربية {nameAr && "✓"}
            </button>
            <button
              type="button"
              className={`button ${lang === "ru" ? "button-primary" : "button-secondary"}`}
              onClick={() => setLang("ru")}
              style={{ height: "34px", padding: "0 12px", fontSize: "12px" }}
            >
              🇷🇺 Русский {nameRu && "✓"}
            </button>
          </div>

          <div className="drawer-body">
            <div className="photo-field">
              <div className="photo-preview">
                {image ? (
                  <img src={image} alt="Ürün fotoğrafı" />
                ) : (
                  <ImageIcon size={24} strokeWidth={1.5} />
                )}
              </div>
              <div>
                <strong>Fotoğraf</strong>
                <span>İsteğe bağlı</span>
                <label className="text-button file-button">
                  <ImagePlus size={15} />
                  {uploading ? "Yükleniyor..." : image ? "Değiştir" : "Fotoğraf seç"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => handleImage(event.target.files?.[0])}
                  />
                </label>
              </div>
              {image && (
                <button
                  type="button"
                  className="icon-button remove-photo"
                  onClick={() => setImage("")}
                  aria-label="Fotoğrafı kaldır"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            {/* DİLE GÖRE ÜRÜN ADI GİRİŞİ */}
            {lang === "tr" && (
              <div className="field-group">
                <label htmlFor="product-name-tr">1. Ürün adı (TR) <span style={{ color: "var(--danger)" }}>*</span></label>
                <input
                  id="product-name-tr"
                  className={errors.name ? "has-error" : ""}
                  value={nameTr}
                  onChange={(event) => {
                    setNameTr(event.target.value);
                    setErrors((current) => ({ ...current, name: undefined }));
                  }}
                  placeholder="Örn. Yeni Rakı, Çoban Salata"
                  autoFocus
                />
                {errors.name && <span className="field-error">{errors.name}</span>}
              </div>
            )}

            {lang === "en" && (
              <div className="field-group">
                <label htmlFor="product-name-en">1. Product Name (EN)</label>
                <input
                  id="product-name-en"
                  value={nameEn}
                  onChange={(event) => setNameEn(event.target.value)}
                  placeholder="English product name... (Optional)"
                />
                <span style={{ fontSize: "11px", color: "var(--muted)" }}>Boş bırakırsanız menüde Türkçe isim görünür.</span>
              </div>
            )}

            {lang === "ar" && (
              <div className="field-group">
                <label htmlFor="product-name-ar">1. اسم المنتج (AR)</label>
                <input
                  id="product-name-ar"
                  dir="rtl"
                  value={nameAr}
                  onChange={(event) => setNameAr(event.target.value)}
                  placeholder="اسم المنتج باللغة العربية..."
                />
                <span style={{ fontSize: "11px", color: "var(--muted)" }}>Boş bırakırsanız menüde Türkçe isim görünür.</span>
              </div>
            )}

            {lang === "ru" && (
              <div className="field-group">
                <label htmlFor="product-name-ru">1. Название (RU)</label>
                <input
                  id="product-name-ru"
                  value={nameRu}
                  onChange={(event) => setNameRu(event.target.value)}
                  placeholder="Название продукта на русском..."
                />
                <span style={{ fontSize: "11px", color: "var(--muted)" }}>Boş bırakırsanız menüde Türkçe isim görünür.</span>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px" }}>
              <div className="field-group">
                <label htmlFor="product-category">2. Hangi kategoride görünsün?</label>
                <div className={`select-wrap ${errors.category ? "has-error" : ""}`}>
                  <select
                    id="product-category"
                    value={categoryId}
                    onChange={(event) => {
                      setCategoryId(event.target.value);
                      setErrors((current) => ({ ...current, category: undefined }));
                    }}
                  >
                    <option value="">Kategori seçin</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={17} />
                </div>
                {errors.category && <span className="field-error">{errors.category}</span>}
              </div>

              <div className="field-group">
                <label htmlFor="product-sort-order">Sıralama</label>
                <input
                  id="product-sort-order"
                  type="number"
                  value={sortOrder}
                  onChange={(event) => setSortOrder(parseInt(event.target.value) || 0)}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="field-group">
              <label>3. Fiyat nasıl gösterilsin?</label>
              <div className="segmented" role="group" aria-label="Fiyat türü">
                <button
                  type="button"
                  className={priceMode === "single" ? "is-active" : ""}
                  onClick={() => setPriceMode("single")}
                >
                  <strong>Tek fiyat</strong>
                  <small>Örn. Çoban Salata ₺350</small>
                </button>
                <button
                  type="button"
                  className={priceMode === "variants" ? "is-active" : ""}
                  onClick={() => setPriceMode("variants")}
                >
                  <strong>Boyutlu fiyat</strong>
                  <small>Örn. 35 cl / 70 cl</small>
                </button>
              </div>
            </div>

            {priceMode === "single" ? (
              <div className="field-group">
                <label htmlFor="product-price">Fiyat</label>
                <div className={`price-input ${errors.price ? "has-error" : ""}`}>
                  <span>₺</span>
                  <input
                    id="product-price"
                    inputMode="decimal"
                    value={price}
                    onChange={(event) => {
                      setPrice(event.target.value);
                      setErrors((current) => ({ ...current, price: undefined }));
                    }}
                    placeholder="0,00"
                  />
                </div>
                {errors.price && <span className="field-error">{errors.price}</span>}
              </div>
            ) : (
              <div className="field-group">
                <label>Boyutlar ve fiyatları</label>
                <div className="row-stack">
                  {variants.map((row, index) => (
                    <div className="editor-row" key={row.id}>
                      <input
                        className="row-label"
                        value={row.label}
                        onChange={(event) =>
                          updateRow(setVariants, row.id, "label", event.target.value)
                        }
                        placeholder={index === 0 ? "70 cl" : "Boyut adı"}
                        aria-label="Boyut adı"
                      />
                      <div className="price-input row-price">
                        <span>₺</span>
                        <input
                          inputMode="decimal"
                          value={row.price}
                          onChange={(event) =>
                            updateRow(setVariants, row.id, "price", event.target.value)
                          }
                          placeholder="0,00"
                          aria-label="Boyut fiyatı"
                        />
                      </div>
                      <button
                        type="button"
                        className="icon-button delete-button"
                        onClick={() =>
                          setVariants((current) =>
                            current.length === 1
                              ? [{ id: createId("variant"), label: "", price: "" }]
                              : current.filter((item) => item.id !== row.id)
                          )
                        }
                        aria-label="Bu boyutu sil"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="chip-row">
                  {VARIANT_PRESETS.map((preset) => (
                    <button
                      type="button"
                      className="chip-button"
                      key={preset}
                      onClick={() => addVariant(preset)}
                    >
                      + {preset}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className="button button-soft add-row-button"
                  onClick={() => addVariant()}
                >
                  <Plus size={16} />
                  Boş boyut satırı ekle
                </button>

                {errors.variants && <span className="field-error">{errors.variants}</span>}
              </div>
            )}

            <div className="visibility-field">
              <div>
                <strong>Menüde göster</strong>
                <span>Kapalıyken müşteriler bu ürünü göremez.</span>
              </div>
              <button
                type="button"
                className={`status-toggle is-compact ${active ? "is-on" : ""}`}
                onClick={() => setActive((current) => !current)}
                role="switch"
                aria-checked={active}
                aria-label="Menüde göster"
              >
                <span className="toggle-track">
                  <span className="toggle-thumb" />
                </span>
              </button>
            </div>

            {/* DİLE GÖRE EKSTRALAR / ALT NOTLAR */}
            <div className={`optional-section ${extrasOpen ? "is-open" : ""}`}>
              <button
                type="button"
                className="optional-trigger"
                onClick={() => setExtrasOpen((current) => !current)}
                aria-expanded={extrasOpen}
              >
                <span>
                  <strong>
                    Ekstra açıklama ({lang.toUpperCase()}) {currentExtrasList().length > 0 ? `(${currentExtrasList().length})` : ""}
                  </strong>
                  <small>Seçili dilde ürünün altında not olarak görünür.</small>
                </span>
                <ChevronDown size={18} />
              </button>

              <AnimatePresence initial={false}>
                {extrasOpen && (
                  <motion.div
                    className="optional-content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="row-stack">
                      {currentExtrasList().map((row) => (
                        <div className="editor-row" key={row.id}>
                          <input
                            className="row-label"
                            dir={lang === "ar" ? "rtl" : "ltr"}
                            value={row.label}
                            onChange={(event) =>
                              updateRow(currentExtrasSetter(), row.id, "label", event.target.value)
                            }
                            placeholder={lang === "en" ? "e.g. Single Portion" : lang === "ar" ? "مثال: وجبة واحدة" : "Örn. Duble Porsiyon"}
                            aria-label="Ekstra açıklama"
                          />
                          <div className="price-input row-price">
                            <span>₺</span>
                            <input
                              inputMode="decimal"
                              value={row.price}
                              onChange={(event) =>
                                updateRow(currentExtrasSetter(), row.id, "price", event.target.value)
                              }
                              placeholder="Fark yoksa boş"
                              aria-label="Ekstra fiyatı"
                            />
                          </div>
                          <button
                            type="button"
                            className="icon-button delete-button"
                            onClick={() =>
                              currentExtrasSetter()((current) =>
                                current.filter((item) => item.id !== row.id)
                              )
                            }
                            aria-label="Bu açıklamayı sil"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="chip-row">
                      {EXTRA_PRESETS.map((preset) => (
                        <button
                          type="button"
                          className="chip-button"
                          key={preset}
                          onClick={() => addExtra(preset)}
                        >
                          + {preset}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      className="button button-soft add-row-button"
                      onClick={() => addExtra()}
                    >
                      <Plus size={16} />
                      Boş açıklama satırı ekle
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <footer className="drawer-footer">
            <button type="button" className="button button-secondary" onClick={onClose}>
              Vazgeç
            </button>
            <button type="submit" className="button button-primary save-button">
              <Check size={17} />
              {product ? "Değişiklikleri kaydet" : "Ürünü ekle"}
            </button>
          </footer>
        </form>
      </motion.aside>
    </>
  );
}
