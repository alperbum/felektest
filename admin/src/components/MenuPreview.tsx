import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, X } from "lucide-react";
import { useState } from "react";
import { formatExtra, formatPrice } from "../lib/data";
import type { Category, Product } from "../lib/types";

export default function MenuPreview({
  categories,
  products,
  initialCategoryId,
  onClose,
}: {
  categories: Category[];
  products: Product[];
  initialCategoryId?: string;
  onClose: () => void;
}) {
  const [openCategory, setOpenCategory] = useState<string | null>(
    initialCategoryId ?? null,
  );

  const activeProducts = products.filter((product) => product.active);
  const category = categories.find((item) => item.id === openCategory) ?? null;
  const categoryProducts = category
    ? activeProducts.filter((product) => product.categoryId === category.id)
    : [];

  return (
    <motion.div
      className="preview-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Menü önizlemesi"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <button className="preview-close button button-secondary" type="button" onClick={onClose}>
        <X size={17} />
        Önizlemeyi kapat
      </button>

      <motion.div
        className="phone"
        initial={{ y: 20, scale: 0.97 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 20, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
      >
        <div className="phone-notch" />
        <div className="phone-screen">
          <div className="phone-head">
            <span>FELEK MANGALBAŞI</span>
            <h2>Menü</h2>
            <p>Ateşin lezzetle buluştuğu nokta</p>
          </div>

          <AnimatePresence mode="wait">
            {!category ? (
              <motion.div
                key="categories"
                className="phone-body"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.18 }}
              >
                <div className="phone-category-grid">
                  {categories.map((item) => {
                    const count = activeProducts.filter(
                      (product) => product.categoryId === item.id,
                    ).length;
                    return (
                      <button
                        type="button"
                        className="phone-category"
                        key={item.id}
                        onClick={() => setOpenCategory(item.id)}
                      >
                        <span className="phone-category-media">
                          {item.image ? <img src={item.image} alt="" /> : <i>🔥</i>}
                        </span>
                        <strong>{item.name}</strong>
                        <small>{count} ürün</small>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={category.id}
                className="phone-body"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.18 }}
              >
                <button
                  type="button"
                  className="phone-back"
                  onClick={() => setOpenCategory(null)}
                >
                  <ArrowLeft size={13} />
                  Geri dön (kategoriler)
                </button>
                <h3 className="phone-category-title">{category.name}</h3>

                {categoryProducts.length === 0 ? (
                  <p className="phone-empty">Bu kategoride görünen ürün yok.</p>
                ) : (
                  categoryProducts.map((product) => (
                    <article className="menu-card" key={product.id}>
                      {product.image && (
                        <div className="menu-card-media">
                          <img src={product.image} alt="" />
                        </div>
                      )}
                      <div className="menu-card-body">
                        <div className="menu-card-title">
                          <h4>{product.name}</h4>
                          {product.priceMode === "single" && product.price !== null && (
                            <b>{formatPrice(product.price)}</b>
                          )}
                        </div>
                        {product.priceMode === "variants" && (
                          <ul className="menu-card-variants">
                            {product.variants.map((variant) => (
                              <li key={variant.id}>
                                <span>{variant.label}</span>
                                <b>{formatPrice(variant.price)}</b>
                              </li>
                            ))}
                          </ul>
                        )}
                        {product.extras.length > 0 && (
                          <p className="menu-card-extras">
                            {product.extras.map(formatExtra).join(" · ")}
                          </p>
                        )}
                      </div>
                    </article>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
