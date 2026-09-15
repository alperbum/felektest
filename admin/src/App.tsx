import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  Eye,
  Folder,
  Image as ImageIcon,
  LayoutGrid,
  ListOrdered,
  LogOut,
  Menu as MenuIcon,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import CategoryEditor from "./components/CategoryEditor";
import MenuPreview from "./components/MenuPreview";
import ProductEditor from "./components/ProductEditor";
import {
  deleteCategoryFromSupabase,
  deleteProductFromSupabase,
  fetchCategoriesFromSupabase,
  fetchProductsFromSupabase,
  formatExtra,
  formatPrice,
  saveCategoryToSupabase,
  saveProductToSupabase,
  toggleProductActiveInSupabase,
} from "./lib/data";
import { supabase } from "./lib/supabase";
import type { Category, ConfirmState, Product, Toast } from "./lib/types";

type Screen =
  | { name: "categories" }
  | { name: "category"; id: string }
  | { name: "search" };

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      F<i />
    </span>
  );
}

function ProductPrice({ product }: { product: Product }) {
  if (product.priceMode === "single") {
    return (
      <span className="price-cell">
        <b>{product.price !== null ? formatPrice(product.price) : "—"}</b>
      </span>
    );
  }
  if (product.variants.length === 0) {
    return (
      <span className="price-cell">
        <b>—</b>
      </span>
    );
  }
  return (
    <span className="price-cell">
      {product.variants.map((variant) => (
        <span className="variant-line" key={variant.id}>
          <span>{variant.label}</span>
          <b>{formatPrice(variant.price)}</b>
        </span>
      ))}
    </span>
  );
}

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [screen, setScreen] = useState<Screen>({ name: "categories" });
  const [search, setSearch] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [productEditor, setProductEditor] = useState<{ product: Product | null; categoryId: string } | null>(null);
  const [categoryEditor, setCategoryEditor] = useState<{ category: Category | null } | null>(null);
  const [preview, setPreview] = useState<{ categoryId?: string } | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);

  const notify = (message: string, tone: Toast["tone"] = "success") =>
    setToast({ id: Date.now(), message, tone });

  // ─── AUTHENTICATION CHECK ──────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ─── LOAD DATA FROM SUPABASE ───────────────────────────────────────
  const loadData = async () => {
    setLoading(true);
    const [cats, prods] = await Promise.all([
      fetchCategoriesFromSupabase(),
      fetchProductsFromSupabase(),
    ]);
    setCategories(cats);
    setProducts(prods);
    setLoading(false);
  };

  useEffect(() => {
    if (session) {
      loadData();
    }
  }, [session]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoginError("E-posta veya şifre hatalı.");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const overlayOpen = Boolean(productEditor || categoryEditor || preview || confirm);

  useEffect(() => {
    document.body.style.overflow = overlayOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [overlayOpen]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setProductEditor(null);
      setCategoryEditor(null);
      setPreview(null);
      setConfirm(null);
      setMobileNavOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const countByCategory = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((product) => {
      map.set(product.categoryId, (map.get(product.categoryId) ?? 0) + 1);
    });
    return map;
  }, [products]);

  const categoryName = (id: string) =>
    categories.find((category) => category.id === id)?.name ?? "Kategorisiz";

  const searchResults = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("tr-TR");
    if (!query) return [];
    return products.filter(
      (product) =>
        product.name.toLocaleLowerCase("tr-TR").includes(query) ||
        product.extras.some((extra) =>
          extra.label.toLocaleLowerCase("tr-TR").includes(query),
        ),
    );
  }, [products, search]);

  const openCategory = (id: string) => {
    setScreen({ name: "category", id });
    setMobileNavOpen(false);
  };

  const goHome = () => {
    setScreen({ name: "categories" });
    setSearch("");
    setMobileNavOpen(false);
  };

  const saveProduct = async (next: Product) => {
    const ok = await saveProductToSupabase(next);
    if (ok) {
      setProductEditor(null);
      notify("Ürün kaydedildi.");
      loadData();
    } else {
      notify("Ürün kaydedilemedi. Lütfen tekrar deneyin.", "warning");
    }
  };

  const toggleProduct = async (product: Product) => {
    const ok = await toggleProductActiveInSupabase(product);
    if (ok) {
      notify(product.active ? "Ürün menüden gizlendi." : "Ürün menüde gösteriliyor.");
      loadData();
    } else {
      notify("Durum güncellenemedi.", "warning");
    }
  };

  const deleteProduct = (product: Product) =>
    setConfirm({
      title: "Ürün silinsin mi?",
      message: `“${product.name}” menüden kalıcı olarak kaldırılacak.`,
      actionLabel: "Evet, sil",
      onConfirm: async () => {
        const ok = await deleteProductFromSupabase(product);
        setConfirm(null);
        if (ok) {
          notify("Ürün silindi.");
          loadData();
        } else {
          notify("Ürün silinemedi.", "warning");
        }
      },
    });

  const saveCategory = async (next: Category) => {
    const ok = await saveCategoryToSupabase(next);
    if (ok) {
      setCategoryEditor(null);
      notify("Kategori kaydedildi.");
      loadData();
    } else {
      notify("Kategori kaydedilemedi.", "warning");
    }
  };

  const deleteCategory = (category: Category) => {
    const count = countByCategory.get(category.id) ?? 0;
    if (count > 0) {
      notify(`Önce bu kategorideki ${count} ürünü silin.`, "warning");
      return;
    }
    setConfirm({
      title: "Kategori silinsin mi?",
      message: `“${category.name}” kaldırılacak.`,
      actionLabel: "Evet, sil",
      onConfirm: async () => {
        const ok = await deleteCategoryFromSupabase(category.id);
        setConfirm(null);
        if (ok) {
          notify("Kategori silindi.");
          loadData();
        } else {
          notify("Kategori silinemedi.", "warning");
        }
      },
    });
  };

  const renderProductRow = (
    product: Product,
    options: { showCategory?: boolean } = {}
  ) => (
    <li className={`product-row ${product.active ? "" : "is-hidden"}`} key={product.id}>
      <button
        type="button"
        className="product-main"
        onClick={() => setProductEditor({ product, categoryId: product.categoryId })}
      >
        <span className="product-image">
          {product.image ? (
            <img src={product.image} alt="" />
          ) : (
            <ImageIcon size={20} strokeWidth={1.5} />
          )}
        </span>
        <span className="product-copy">
          <strong>{product.name}</strong>
          <span className="product-meta">
            {options.showCategory && <em className="tag">{categoryName(product.categoryId)}</em>}
            {product.priceMode === "variants" && (
              <em className="tag tag-variant">{product.variants.length} boyut</em>
            )}
            {product.extras.map((extra) => (
              <em className="tag tag-extra" key={extra.id}>
                {formatExtra(extra)}
              </em>
            ))}
          </span>
        </span>
      </button>

      <ProductPrice product={product} />

      <div className="product-status">
        <button
          type="button"
          className={`status-toggle ${product.active ? "is-on" : ""}`}
          onClick={() => toggleProduct(product)}
          role="switch"
          aria-checked={product.active}
          aria-label={`${product.name} menüde görünsün`}
        >
          <span className="toggle-track">
            <span className="toggle-thumb" />
          </span>
          <span>{product.active ? "Menüde" : "Gizli"}</span>
        </button>
      </div>

      <div className="row-actions">
        <button
          type="button"
          className="button edit-button"
          onClick={() => setProductEditor({ product, categoryId: product.categoryId })}
        >
          <Pencil size={15} />
          Düzenle
        </button>
        <button
          type="button"
          className="icon-button delete-button"
          onClick={() => deleteProduct(product)}
          aria-label={`${product.name} ürününü sil`}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </li>
  );

  // ─── LOGIN SCREEN ──────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="app-shell" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "var(--muted)", fontStyle: "italic" }}>Yükleniyor...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="app-shell" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "var(--canvas)" }}>
        <form onSubmit={handleLogin} style={{ background: "var(--paper)", padding: "40px", borderRadius: "16px", boxShadow: "0 10px 30px rgba(0,0,0,0.08)", width: "100%", maxWidth: "380px" }}>
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <BrandMark />
            <h2 style={{ margin: "16px 0 4px", fontSize: "22px", fontFamily: "Georgia, serif" }}>Felek Yönetim</h2>
            <p style={{ margin: 0, color: "var(--muted)", fontSize: "13px" }}>Menüyü yönetmek için giriş yapın.</p>
          </div>
          {loginError && (
            <div style={{ background: "var(--danger-soft)", color: "var(--danger)", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", marginBottom: "16px" }}>
              {loginError}
            </div>
          )}
          <div className="field-group" style={{ marginBottom: "16px" }}>
            <label htmlFor="auth-email">E-Posta</label>
            <input id="auth-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field-group" style={{ marginBottom: "24px" }}>
            <label htmlFor="auth-password">Şifre</label>
            <input id="auth-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button type="submit" className="button button-primary" style={{ width: "100%", height: "46px", fontSize: "15px" }}>
            Giriş Yap
          </button>
        </form>
      </div>
    );
  }

  const currentCategory =
    screen.name === "category"
      ? categories.find((category) => category.id === screen.id) ?? null
      : null;

  const currentProducts = currentCategory
    ? products.filter((product) => product.categoryId === currentCategory.id)
    : [];

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNavOpen ? "is-mobile-open" : ""}`}>
        <div className="sidebar-top">
          <button className="brand" type="button" onClick={goHome}>
            <BrandMark />
            <span>
              <strong>FELEK</strong>
              <small>Menü Yönetimi</small>
            </span>
          </button>
          <button
            className="icon-button mobile-nav-close"
            type="button"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Menüyü kapat"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="main-nav" aria-label="Bölümler">
          <button
            type="button"
            className={screen.name === "categories" ? "active" : ""}
            onClick={goHome}
          >
            <LayoutGrid size={18} />
            Menü kategorileri
            <span className="nav-count">{categories.length}</span>
          </button>
          <button
            type="button"
            className={screen.name === "search" ? "active" : ""}
            onClick={() => {
              setScreen({ name: "search" });
              setMobileNavOpen(false);
            }}
          >
            <Search size={18} />
            Ürün ara
            <span className="nav-count">{products.length}</span>
          </button>

          <span className="nav-label">Kategoriler</span>
          <div className="nav-scroll">
            {categories.map((category) => (
              <button
                type="button"
                className={screen.name === "category" && screen.id === category.id ? "active" : ""}
                key={category.id}
                onClick={() => openCategory(category.id)}
              >
                <span>{category.name}</span>
                <span className="nav-count">{countByCategory.get(category.id) ?? 0}</span>
              </button>
            ))}
          </div>
        </nav>

        <div className="sidebar-foot">
          <button
            type="button"
            className="preview-link"
            onClick={() => setPreview({})}
          >
            <Eye size={17} />
            <span>Menü Önizleme</span>
          </button>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--line)" }}>
            <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 600 }}>{session.user.email}</span>
            <button type="button" className="icon-button" onClick={handleLogout} title="Çıkış yap">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <div className="mobile-bar">
        <button
          type="button"
          className="icon-button"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Menüyü aç"
        >
          <MenuIcon size={22} />
        </button>
        <button type="button" className="brand" onClick={goHome}>
          <BrandMark />
          <strong>FELEK</strong>
        </button>
        <button type="button" className="icon-button" onClick={() => setPreview({})}>
          <Eye size={20} />
        </button>
      </div>

      <main className="main-area">
        <AnimatePresence mode="wait">
          {screen.name === "categories" && (
            <motion.section
              key="categories"
              className="page"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              <header className="page-header">
                <div>
                  <span className="page-kicker">Dijital Menü</span>
                  <h1>Kategoriler</h1>
                  <p>Kategori seçerek ürünleri düzenleyin veya yeni bir kategori ekleyin.</p>
                </div>
                <button
                  type="button"
                  className="button button-primary"
                  onClick={() => setCategoryEditor({ category: null })}
                >
                  <Plus size={17} />
                  Yeni kategori ekle
                </button>
              </header>

              <div className="category-grid">
                {categories.map((category) => {
                  const count = countByCategory.get(category.id) ?? 0;
                  return (
                    <div
                      className="category-card"
                      key={category.id}
                      style={{
                        height: "250px",
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden",
                        border: "1px solid var(--line)",
                        borderRadius: "13px",
                        background: "var(--paper)",
                        cursor: "pointer",
                      }}
                      onClick={() => openCategory(category.id)}
                    >
                      <div
                        className="card-media"
                        style={{
                          width: "100%",
                          height: "140px",
                          flex: "0 0 140px",
                          overflow: "hidden",
                          background: "#ebeae2",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "var(--green)",
                        }}
                      >
                        {category.image ? (
                          <img
                            src={category.image}
                            alt=""
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              objectPosition: "center",
                              display: "block",
                            }}
                          />
                        ) : (
                          <Folder size={26} strokeWidth={1.5} />
                        )}
                      </div>
                      <div
                        className="card-body"
                        style={{
                          padding: "12px 16px 4px",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        <h3
                          style={{
                            margin: 0,
                            fontFamily: "Georgia, serif",
                            fontSize: "16px",
                            fontWeight: 500,
                            color: "var(--ink)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {category.name}
                        </h3>
                        <span style={{ marginTop: "2px", color: "var(--muted)", fontSize: "12px" }}>
                          {count} ürün
                        </span>
                      </div>
                      <div
                        className="card-actions"
                        style={{ display: "flex", alignItems: "center", gap: "6px", padding: "4px 16px 12px" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          className="icon-button"
                          onClick={() => setCategoryEditor({ category })}
                          title="Düzenle"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          className="icon-button delete-button"
                          onClick={() => deleteCategory(category)}
                          title="Sil"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.section>
          )}

          {screen.name === "category" && currentCategory && (
            <motion.section
              key={`cat-${currentCategory.id}`}
              className="page"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              <header className="page-header">
                <div>
                  <button type="button" className="back-link" onClick={goHome}>
                    <ArrowLeft size={16} />
                    Tüm kategorilere dön
                  </button>
                  <h1>{currentCategory.name}</h1>
                  <p>{currentProducts.length} ürün listeleniyor.</p>
                </div>
                <button
                  type="button"
                  className="button button-primary"
                  onClick={() =>
                    setProductEditor({ product: null, categoryId: currentCategory.id })
                  }
                >
                  <Plus size={17} />
                  Bu kategoriye ürün ekle
                </button>
              </header>

              <div className="list-heading">
                <span>Ürün</span>
                <span className="col-price">Fiyat</span>
                <span className="col-status">Durum</span>
                <span className="col-actions">İşlem</span>
              </div>

              {currentProducts.length > 0 ? (
                <ul className="product-list">
                  {currentProducts.map((product) => renderProductRow(product))}
                </ul>
              ) : (
                <div className="empty-state">
                  <span>
                    <ListOrdered size={22} />
                  </span>
                  <h2>Bu kategori henüz boş</h2>
                  <p>İlk ürünü ekleyerek menünüzü doldurmaya başlayın.</p>
                  <button
                    type="button"
                    className="button button-primary"
                    onClick={() =>
                      setProductEditor({ product: null, categoryId: currentCategory.id })
                    }
                  >
                    <Plus size={17} />
                    Ürün ekle
                  </button>
                </div>
              )}
            </motion.section>
          )}

          {screen.name === "search" && (
            <motion.section
              key="search"
              className="page"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              <header className="page-header">
                <div>
                  <span className="page-kicker">Hızlı arama</span>
                  <h1>Ürün ara</h1>
                  <p>Kategori fark etmeksizin tüm ürünlerde arama yapın.</p>
                </div>
              </header>

              <div className="search-field big">
                <Search size={19} />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Örn. Chivas, Çoban Salata, Rakı"
                  aria-label="Ürün ara"
                  autoFocus
                />
                {search && (
                  <button type="button" onClick={() => setSearch("")} aria-label="Temizle">
                    <X size={16} />
                  </button>
                )}
              </div>

              {search.trim() === "" ? (
                <div className="empty-state">
                  <span>
                    <Search size={22} />
                  </span>
                  <h2>Aramak için yazmaya başlayın</h2>
                  <p>Ürün adı veya ekstra açıklama içinde arama yapılır.</p>
                </div>
              ) : searchResults.length > 0 ? (
                <>
                  <div className="list-heading">
                    <span>{searchResults.length} sonuç</span>
                    <span className="col-price">Fiyat</span>
                    <span className="col-status">Durum</span>
                    <span className="col-actions">İşlem</span>
                  </div>
                  <ul className="product-list">
                    {searchResults.map((product) =>
                      renderProductRow(product, { showCategory: true })
                    )}
                  </ul>
                </>
              ) : (
                <div className="empty-state">
                  <span>
                    <Search size={22} />
                  </span>
                  <h2>Sonuç bulunamadı</h2>
                  <p>Farklı bir kelime deneyin.</p>
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => setSearch("")}
                  >
                    Aramayı temizle
                  </button>
                </div>
              )}
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {productEditor && (
          <ProductEditor
            key={productEditor.product?.id ?? "new-product"}
            product={productEditor.product}
            categories={categories}
            defaultCategoryId={productEditor.categoryId}
            onClose={() => setProductEditor(null)}
            onSave={saveProduct}
          />
        )}

        {categoryEditor && (
          <CategoryEditor
            key={categoryEditor.category?.id ?? "new-category"}
            category={categoryEditor.category}
            onClose={() => setCategoryEditor(null)}
            onSave={saveCategory}
          />
        )}

        {preview && (
          <MenuPreview
            categories={categories}
            products={products}
            initialCategoryId={preview.categoryId}
            onClose={() => setPreview(null)}
          />
        )}

        {confirm && (
          <motion.div
            className="confirm-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="confirm-modal"
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
            >
              <div className="confirm-icon">
                <AlertTriangle size={24} />
              </div>
              <h3>{confirm.title}</h3>
              <p>{confirm.message}</p>
              <div className="confirm-actions">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setConfirm(null)}
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  className="button button-danger"
                  onClick={confirm.onConfirm}
                >
                  {confirm.actionLabel}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {toast && (
          <motion.div
            className={`toast-banner toast-${toast.tone}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <Check size={16} />
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
