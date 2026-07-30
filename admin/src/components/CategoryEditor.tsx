import { motion } from "framer-motion";
import { Check, Image as ImageIcon, ImagePlus, Trash2, X } from "lucide-react";
import { FormEvent, useState } from "react";
import { createId, uploadImageToStorage } from "../lib/data";
import type { Category } from "../lib/types";

type Lang = "tr" | "en" | "ar" | "ru";

export default function CategoryEditor({
  category,
  onClose,
  onSave,
}: {
  category: Category | null;
  onClose: () => void;
  onSave: (category: Category) => void;
}) {
  const [lang, setLang] = useState<Lang>("tr");
  const [nameTr, setNameTr] = useState(category?.name ?? "");
  const [nameEn, setNameEn] = useState(category?.name_en ?? "");
  const [nameAr, setNameAr] = useState(category?.name_ar ?? "");
  const [nameRu, setNameRu] = useState(category?.name_ru ?? "");
  const [sortOrder, setSortOrder] = useState<number>(category?.sort_order ?? 0);
  const [image, setImage] = useState(category?.image ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleImage = async (file?: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    setUploading(true);
    const uploadedUrl = await uploadImageToStorage(file, "categories");
    setUploading(false);
    if (uploadedUrl) {
      setImage(uploadedUrl);
    } else {
      const reader = new FileReader();
      reader.onload = () => setImage(String(reader.result));
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!nameTr.trim()) {
      setError("Türkçe kategori adını yazın.");
      return;
    }
    onSave({
      id: category?.id ?? createId("category"),
      name: nameTr.trim(),
      name_en: nameEn.trim() || undefined,
      name_ar: nameAr.trim() || undefined,
      name_ru: nameRu.trim() || undefined,
      image,
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
        className="drawer drawer-small"
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-editor-title"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 34 }}
      >
        <form className="drawer-form" onSubmit={handleSubmit}>
          <header className="drawer-header">
            <div>
              <span className="drawer-kicker">
                {category ? "Kategoriyi düzenle" : "Yeni kategori"}
              </span>
              <h2 id="category-editor-title">
                {category ? category.name : "Kategori ekleyin"}
              </h2>
            </div>
            <button type="button" className="icon-button" onClick={onClose}>
              <X size={22} />
              <span className="sr-only">Kapat</span>
            </button>
          </header>

          {/* DİL SEKMELERİ */}
          <div style={{ display: "flex", gap: "6px", background: "var(--sidebar)", padding: "8px 24px", borderBottom: "1px solid var(--line)" }}>
            <button
              type="button"
              className={`button ${lang === "tr" ? "button-primary" : "button-secondary"}`}
              onClick={() => setLang("tr")}
              style={{ height: "34px", padding: "0 10px", fontSize: "11px" }}
            >
              🇹🇷 TR
            </button>
            <button
              type="button"
              className={`button ${lang === "en" ? "button-primary" : "button-secondary"}`}
              onClick={() => setLang("en")}
              style={{ height: "34px", padding: "0 10px", fontSize: "11px" }}
            >
              🇬🇧 EN {nameEn && "✓"}
            </button>
            <button
              type="button"
              className={`button ${lang === "ar" ? "button-primary" : "button-secondary"}`}
              onClick={() => setLang("ar")}
              style={{ height: "34px", padding: "0 10px", fontSize: "11px" }}
            >
              🇸🇦 AR {nameAr && "✓"}
            </button>
            <button
              type="button"
              className={`button ${lang === "ru" ? "button-primary" : "button-secondary"}`}
              onClick={() => setLang("ru")}
              style={{ height: "34px", padding: "0 10px", fontSize: "11px" }}
            >
              🇷🇺 RU {nameRu && "✓"}
            </button>
          </div>

          <div className="drawer-body">
            <div className="photo-field">
              <div className="photo-preview">
                {image ? (
                  <img src={image} alt="Kategori fotoğrafı" />
                ) : (
                  <ImageIcon size={24} strokeWidth={1.5} />
                )}
              </div>
              <div>
                <strong>Kapak fotoğrafı</strong>
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

            {lang === "tr" && (
              <div className="field-group">
                <label htmlFor="category-name-tr">Kategori adı (TR) <span style={{ color: "var(--danger)" }}>*</span></label>
                <input
                  id="category-name-tr"
                  value={nameTr}
                  className={error ? "has-error" : ""}
                  onChange={(event) => {
                    setNameTr(event.target.value);
                    setError("");
                  }}
                  placeholder="Örn. Mezeler"
                  autoFocus
                />
                {error && <span className="field-error">{error}</span>}
              </div>
            )}

            {lang === "en" && (
              <div className="field-group">
                <label htmlFor="category-name-en">Category Name (EN)</label>
                <input
                  id="category-name-en"
                  value={nameEn}
                  onChange={(event) => setNameEn(event.target.value)}
                  placeholder="e.g. Appetizers"
                />
              </div>
            )}

            {lang === "ar" && (
              <div className="field-group">
                <label htmlFor="category-name-ar">اسم الفئة (AR)</label>
                <input
                  id="category-name-ar"
                  dir="rtl"
                  value={nameAr}
                  onChange={(event) => setNameAr(event.target.value)}
                  placeholder="مثال: مقبلات"
                />
              </div>
            )}

            {lang === "ru" && (
              <div className="field-group">
                <label htmlFor="category-name-ru">Название категории (RU)</label>
                <input
                  id="category-name-ru"
                  value={nameRu}
                  onChange={(event) => setNameRu(event.target.value)}
                  placeholder="например: Закуски"
                />
              </div>
            )}

            <div className="field-group">
              <label htmlFor="category-sort-order">Sıralama (Sıra No)</label>
              <input
                id="category-sort-order"
                type="number"
                value={sortOrder}
                onChange={(event) => setSortOrder(parseInt(event.target.value) || 0)}
                placeholder="0"
              />
            </div>
          </div>

          <footer className="drawer-footer">
            <button type="button" className="button button-secondary" onClick={onClose}>
              Vazgeç
            </button>
            <button type="submit" className="button button-primary save-button">
              <Check size={17} />
              {category ? "Kaydet" : "Kategoriyi ekle"}
            </button>
          </footer>
        </form>
      </motion.aside>
    </>
  );
}
