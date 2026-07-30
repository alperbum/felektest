import { motion } from "framer-motion";
import { Check, Image as ImageIcon, ImagePlus, Trash2, X } from "lucide-react";
import { FormEvent, useState } from "react";
import { createId, uploadImageToStorage } from "../lib/data";
import type { Category } from "../lib/types";

export default function CategoryEditor({
  category,
  onClose,
  onSave,
}: {
  category: Category | null;
  onClose: () => void;
  onSave: (category: Category) => void;
}) {
  const [name, setName] = useState(category?.name ?? "");
  const [image, setImage] = useState(category?.image ?? "");
  const [error, setError] = useState("");

  const handleImage = async (file?: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    const uploadedUrl = await uploadImageToStorage(file, "categories");
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
    if (!name.trim()) {
      setError("Kategori adını yazın.");
      return;
    }
    onSave({
      id: category?.id ?? createId("category"),
      name: name.trim(),
      image,
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
                  {image ? "Değiştir" : "Fotoğraf seç"}
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

            <div className="field-group">
              <label htmlFor="category-name">Kategori adı</label>
              <input
                id="category-name"
                value={name}
                className={error ? "has-error" : ""}
                onChange={(event) => {
                  setName(event.target.value);
                  setError("");
                }}
                placeholder="Örn. Mezeler"
                autoFocus
              />
              {error && <span className="field-error">{error}</span>}
            </div>

            <p className="form-note">
              Müşteriler önce kategorileri görür, sonra içindeki ürünlere girer. Sıralamayı
              kategori listesindeki yukarı/aşağı okları ile değiştirebilirsiniz.
            </p>
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
