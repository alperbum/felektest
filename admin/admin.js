// ─── SUPABASE BAĞLANTISI ─────────────────────────────────────────────
let sb = null;

function initSupabase() {
    const url = window.SUPABASE_URL;
    const key = window.SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    if (window.supabase && window.supabase.createClient) {
        return window.supabase.createClient(url, key);
    }
    return null;
}

// ─── UI ELEMENTS ─────────────────────────────────────────────────────
const loginScreen = document.getElementById('login-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');

let categories = [];
let items = [];

// ─── TOAST BİLDİRİM SİSTEMİ ─────────────────────────────────────────
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ─── ONAY DİYALOĞU ──────────────────────────────────────────────────
function showConfirm(message) {
    return new Promise((resolve) => {
        const dialog = document.getElementById('confirm-dialog');
        const msgEl = document.getElementById('confirm-message');
        const yesBtn = document.getElementById('confirm-yes');
        const noBtn = document.getElementById('confirm-no');

        msgEl.textContent = message;
        dialog.classList.add('visible');

        const cleanup = () => {
            dialog.classList.remove('visible');
            yesBtn.onclick = null;
            noBtn.onclick = null;
        };

        yesBtn.onclick = () => { cleanup(); resolve(true); };
        noBtn.onclick = () => { cleanup(); resolve(false); };
    });
}

// ─── BOOT ────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    sb = initSupabase();
    if (sb) {
        checkSession();
    } else {
        if (loginError) loginError.textContent = 'Bağlantı kurulamadı. Lütfen yöneticiyle iletişime geçin.';
    }
    setupImageUploads();
});

// ─── AUTHENTICATION ──────────────────────────────────────────────────
async function checkSession() {
    if (!sb) return;
    try {
        const { data: { session } } = await sb.auth.getSession();
        if (session) showDashboard();
    } catch (e) {
        console.error('Session kontrolü hatası:', e);
    }
}

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!sb) return;

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const btn = e.target.querySelector('button[type="submit"]');

        btn.disabled = true;
        btn.textContent = 'Giriş yapılıyor...';
        if (loginError) loginError.textContent = '';

        const { error } = await sb.auth.signInWithPassword({ email, password });

        if (error) {
            loginError.textContent = 'E-posta veya şifre hatalı.';
            btn.disabled = false;
            btn.textContent = 'Giriş Yap';
        } else {
            showDashboard();
        }
    });
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        try {
            if (sb) await sb.auth.signOut();
        } catch (e) { /* ignore */ }
        showLogin();
    });
}

function showDashboard() {
    loginScreen.style.display = 'none';
    dashboardScreen.style.display = 'block';
    loadData();
}

function showLogin() {
    loginScreen.style.display = 'flex';
    dashboardScreen.style.display = 'none';
}

// ─── TAB NAVIGATION ─────────────────────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('tab-' + btn.getAttribute('data-tab')).classList.add('active');
    });
});

// ─── ÜRÜN MODALI: DİL SEKMESİ GEÇİŞİ ─────────────────────────────────
// NOT: Bu fonksiyon HTML'de ve closeModal/openItemModal içinde çağrılıyordu
// ama hiçbir yerde tanımlı değildi — dil sekmeleri (EN/AR/RU) bu yüzden
// çalışmıyordu ve modal açma/kapama bu hatadan dolayı yarıda kesiliyordu.
window.switchLangTab = function (lang) {
    document.querySelectorAll('.lang-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    });
    document.querySelectorAll('.lang-pane').forEach(pane => {
        const isActive = pane.classList.contains('lang-pane-' + lang);
        pane.style.display = isActive ? 'block' : 'none';
        pane.classList.toggle('active', isActive);
    });
};

// ─── DATA FETCHING ───────────────────────────────────────────────────
// ─── DATA FETCHING & STATS ───────────────────────────────────────────
async function loadData() {
    if (!sb) return;

    const { data: catData } = await sb.from('categories').select('*').order('sort_order', { ascending: true });
    categories = catData || [];

    const { data: itemData } = await sb.from('menu_items').select('*').order('sort_order', { ascending: true });
    items = itemData || [];

    updateStats();

    const filterSelect = document.getElementById('filter-category');
    const searchInput = document.getElementById('search-input');
    const currentFilter = filterSelect ? filterSelect.value : '';
    const currentSearch = searchInput ? searchInput.value : '';

    renderCategoriesList();
    updateCategorySelects(currentFilter);
    renderItemsList(currentFilter, currentSearch);
}

function updateStats() {
    const totalEl = document.getElementById('stat-total-items');
    const activeEl = document.getElementById('stat-active-items');
    const variantEl = document.getElementById('stat-variant-items');
    const catsEl = document.getElementById('stat-total-cats');

    if (totalEl) totalEl.textContent = items.length;
    if (activeEl) activeEl.textContent = items.filter(i => i.is_active).length;
    if (catsEl) catsEl.textContent = categories.length;

    if (variantEl) {
        // Count items with CL / size indicators
        const variantCount = items.filter(i => i.name_tr && /\b\d+(?:,\d+)?\s*(?:cl|kg)\b/i.test(i.name_tr)).length;
        variantEl.textContent = variantCount;
    }
}

// ─── RENDER: ÜRÜN KARTLARI (ÜRÜN AĞACI DESTEKLİ) ────────────────────
window.toggleProductTree = function(treeId) {
    const el = document.getElementById(treeId);
    const btn = document.getElementById('btn-' + treeId);
    if (!el) return;
    const isOpen = el.style.display !== 'none';
    el.style.display = isOpen ? 'none' : 'block';
    if (btn) btn.textContent = isOpen ? '▼ Boyutları Göster' : '▲ Gizle';
};

window.addVariantToParent = function(baseName, categoryId) {
    openItemModal();
    document.getElementById('item-category').value = categoryId;
    document.getElementById('item-name-tr').value = baseName + ' ';
    document.getElementById('item-name-tr').focus();
};

function renderItemsList(filterCatId = '', searchQuery = '') {
    const container = document.getElementById('items-list');
    const countEl = document.getElementById('items-count');
    if (!container) return;

    let filtered = items;
    if (filterCatId) filtered = filtered.filter(i => i.category_id === filterCatId);
    
    if (searchQuery && searchQuery.trim() !== '') {
        const queryLower = searchQuery.trim().toLowerCase();
        filtered = filtered.filter(i => 
            (i.name_tr && i.name_tr.toLowerCase().includes(queryLower)) ||
            (i.name_en && i.name_en.toLowerCase().includes(queryLower)) ||
            (i.extras_tr && i.extras_tr.toLowerCase().includes(queryLower))
        );
    }

    countEl.textContent = `${filtered.length} ürün${(filterCatId || searchQuery) ? ' (filtrelenmiş)' : ''}`;

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <p>${(filterCatId || searchQuery) ? 'Aramaya veya filtreye uygun ürün bulunamadı.' : 'Henüz ürün eklenmemiş.'}</p>
            </div>`;
        return;
    }

    // ─── GRUPLAMA MANTIĞI (ÜRÜN AĞACI) ─────────────────────────────
    const groups = {};
    const standaloneItems = [];

    filtered.forEach(item => {
        const clMatch = item.name_tr ? item.name_tr.match(/\s+(\d+(?:,\d+)?\s*(?:cl|kg)\.?)\b/i) : null;
        if (clMatch) {
            const baseName = item.name_tr.replace(clMatch[0], '').replace(/\s+/g, ' ').trim();
            const groupKey = `${item.category_id}_${baseName.toLowerCase()}`;
            if (!groups[groupKey]) {
                groups[groupKey] = {
                    baseName: baseName,
                    categoryId: item.category_id,
                    image: item.image,
                    variants: []
                };
            }
            groups[groupKey].variants.push({
                sizeStr: clMatch[1].trim(),
                item: item
            });
        } else {
            standaloneItems.push(item);
        }
    });

    container.innerHTML = '';
    let treeSeq = 0;

    // 1. Ağaç Tipi Varyantlı Ürün Kartları (Örn: Yeni Rakı, Beylerbeyi Göbek...)
    Object.keys(groups).forEach(key => {
        const group = groups[key];
        treeSeq++;
        const treeId = 'tree-group-' + treeSeq;
        const cat = categories.find(c => c.id === group.categoryId);
        const catName = cat ? cat.name_tr : '—';
        
        // Boyut sırasına göre diz
        group.variants.sort((a, b) => {
            const aVal = parseFloat(a.sizeStr.replace(',', '.'));
            const bVal = parseFloat(b.sizeStr.replace(',', '.'));
            return (bVal || 0) - (aVal || 0);
        });

        const activeCount = group.variants.filter(v => v.item.is_active).length;
        const minPrice = Math.min(...group.variants.map(v => v.item.price || 0));
        const maxPrice = Math.max(...group.variants.map(v => v.item.price || 0));
        const priceRange = minPrice === maxPrice 
            ? new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(minPrice)
            : `${new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(minPrice)} - ${new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(maxPrice)}`;

        const parentCard = document.createElement('div');
        parentCard.className = 'product-tree-card';
        parentCard.innerHTML = `
            <div class="tree-header">
                ${group.image
                    ? `<img src="${escapeAttr(group.image)}" class="item-thumb" alt="" loading="lazy">`
                    : `<div class="item-thumb-empty">🍾</div>`
                }
                <div class="tree-info">
                    <div class="tree-title">${esc(group.baseName)} <span class="badge badge-variant">${group.variants.length} Boyut Ağacı</span></div>
                    <div class="item-meta">
                        <span class="cat-pill">${esc(catName)}</span>
                        <span>·</span>
                        <span class="text-success">${activeCount}/${group.variants.length} Aktif</span>
                    </div>
                </div>
                <div class="tree-price-box">
                    <span class="item-price">${priceRange}</span>
                </div>
                <div class="tree-actions">
                    <button type="button" class="btn btn-outline btn-xs" id="btn-${treeId}" onclick="toggleProductTree('${treeId}')">▼ Boyutları Göster</button>
                    <button type="button" class="btn btn-primary btn-xs" onclick="addVariantToParent('${escapeAttr(group.baseName)}', '${escapeAttr(group.categoryId)}')">＋ Boyut Ekle</button>
                </div>
            </div>
            <div class="tree-children" id="${treeId}" style="display:none;">
                ${group.variants.map(v => {
                    const subItem = v.item;
                    const priceFormatted = subItem.price
                        ? new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(subItem.price)
                        : '—';
                    return `
                        <div class="variant-subrow ${!subItem.is_active ? 'item-card-inactive' : ''}">
                            <div class="subrow-left">
                                <span class="badge badge-variant">🏷️ ${esc(v.sizeStr)}</span>
                                <span class="subrow-name">${esc(subItem.name_tr)}</span>
                            </div>
                            <div class="subrow-right">
                                <span class="item-price">${priceFormatted}</span>
                                <button type="button" class="badge-toggle ${subItem.is_active ? 'badge-active' : 'badge-inactive'}" onclick="toggleItemActive('${escapeAttr(subItem.id)}')" title="Tıklayarak durumu değiştirin">
                                    ${subItem.is_active ? '🟢 Aktif' : '🔴 Pasif'}
                                </button>
                                <button class="btn-icon" onclick="editItem('${escapeAttr(subItem.id)}')" title="Düzenle">✏️</button>
                                <button class="btn-icon danger" onclick="handleDeleteItem('${escapeAttr(subItem.id)}')" title="Sil">🗑️</button>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
        container.appendChild(parentCard);
    });

    // 2. Tekil Ürün Kartları (Örn: Adana Kebap, Salatalar...)
    standaloneItems.forEach(item => {
        const cat = categories.find(c => c.id === item.category_id);
        const catName = cat ? cat.name_tr : '—';
        const priceText = item.price
            ? new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(item.price)
            : '—';

        const card = document.createElement('div');
        card.className = `item-card ${!item.is_active ? 'item-card-inactive' : ''}`;
        card.innerHTML = `
            ${item.image
                ? `<img src="${escapeAttr(item.image)}" class="item-thumb" alt="" loading="lazy">`
                : `<div class="item-thumb-empty">🍖</div>`
            }
            <div class="item-info">
                <div class="item-name">${esc(item.name_tr)}</div>
                <div class="item-meta">
                    <span class="cat-pill">${esc(catName)}</span>
                    <span>·</span>
                    <button type="button" class="badge-toggle ${item.is_active ? 'badge-active' : 'badge-inactive'}" onclick="toggleItemActive('${escapeAttr(item.id)}')" title="Tıklayarak durumu değiştirin">
                        ${item.is_active ? '🟢 Aktif' : '🔴 Pasif'}
                    </button>
                    ${item.extras_tr ? `<span class="badge badge-extras" style="margin-left: 5px;" title="${esc(item.extras_tr)}">📝 ${esc(item.extras_tr)}</span>` : ''}
                </div>
            </div>
            <span class="item-price">${priceText}</span>
            <div class="item-actions">
                <button class="btn-icon" onclick="editItem('${escapeAttr(item.id)}')" title="Düzenle">✏️</button>
                <button class="btn-icon danger" onclick="handleDeleteItem('${escapeAttr(item.id)}')" title="Sil">🗑️</button>
            </div>
        `;
        container.appendChild(card);
    });
}

// ─── 1-CLICK ACTIVE TOGGLE ──────────────────────────────────────────
window.toggleItemActive = async function(id) {
    const item = items.find(i => i.id === id);
    if (!item || !sb) return;

    const newStatus = !item.is_active;
    item.is_active = newStatus; // optimistic UI update
    renderItemsList(
        document.getElementById('filter-category')?.value || '',
        document.getElementById('search-input')?.value || ''
    );
    updateStats();

    const { error } = await sb.from('menu_items').update({ is_active: newStatus }).eq('id', id);
    if (error) {
        showToast('Durum güncellenemedi: ' + error.message, 'error');
        item.is_active = !newStatus; // revert
        loadData();
    } else {
        showToast(`"${item.name_tr}" ${newStatus ? 'Aktif yapıldı 🟢' : 'Pasife alındı 🔴'}`);
    }
};

// ─── SEARCH INPUT LISTENER ──────────────────────────────────────────
document.getElementById('search-input')?.addEventListener('input', (e) => {
    const filterCatId = document.getElementById('filter-category')?.value || '';
    renderItemsList(filterCatId, e.target.value);
});

// ─── HIZLI VARYANT & EKSTRA ASİSTANI ───────────────────────────────
window.applySizeChip = function(sizeStr) {
    const input = document.getElementById('item-name-tr');
    if (!input) return;

    let val = input.value.trim();

    // Mevcut cl/kg ifadesi varsa temizle
    val = val.replace(/\s+\d+(?:,\d+)?\s*(?:cl|kg)\.?\b/gi, '').trim();

    // Yeni boyutu ekle
    input.value = val ? `${val} ${sizeStr}` : sizeStr;
    updateVariantPreview();
};

window.clearSizeChip = function() {
    const input = document.getElementById('item-name-tr');
    if (!input) return;

    let val = input.value.trim();
    input.value = val.replace(/\s+\d+(?:,\d+)?\s*(?:cl|kg)\.?\b/gi, '').trim();
    updateVariantPreview();
};

// ─── DİNAMİK EKSTRA SATIRLARI (Multi-Extra Manager) ────────────────
// HTML "+ Ekstra Ekle" ve hızlı şablon butonları addExtraRow / addPresetExtra
// çağırıyordu ama bu fonksiyonlar hiç yazılmamıştı — o yüzden bu bölüm
// tamamen görünmez ve işlevsizdi. Aşağıdaki fonksiyonlar bunu tamamlıyor.
let extraRowSeq = 0;

window.addExtraRow = function (tr = '', en = '', ar = '', ru = '') {
    const container = document.getElementById('extras-container');
    if (!container) return;
    extraRowSeq += 1;
    const rowId = 'xrow' + extraRowSeq;
    const hasTranslations = !!(en || ar || ru);

    const row = document.createElement('div');
    row.className = 'extra-row-card';
    row.dataset.rowId = rowId;
    row.innerHTML = `
        <div class="extra-row-main">
            <input type="text" class="extra-field extra-field-tr" placeholder="Örn: Tek Rakı: ₺240,00" value="${escapeAttr(tr)}">
            <button type="button" class="btn-icon danger" onclick="removeExtraRow('${rowId}')" title="Bu satırı sil">🗑️</button>
        </div>
        <div class="extra-translations-toggle">
            <button type="button" class="btn-ghost-sm" onclick="toggleExtraTranslations('${rowId}')">🌐 EN / AR / RU çevirisi ekle</button>
        </div>
        <div class="extra-row-details${hasTranslations ? ' open' : ''}" id="details-${rowId}">
            <input type="text" class="extra-field extra-field-en" placeholder="English" value="${escapeAttr(en)}">
            <input type="text" class="extra-field extra-field-ar" placeholder="العربية" dir="rtl" value="${escapeAttr(ar)}">
            <input type="text" class="extra-field extra-field-ru" placeholder="Русский" value="${escapeAttr(ru)}">
        </div>
    `;
    container.appendChild(row);
};

window.removeExtraRow = function (rowId) {
    const row = document.querySelector(`.extra-row-card[data-row-id="${rowId}"]`);
    if (row) row.remove();
};

window.toggleExtraTranslations = function (rowId) {
    const details = document.getElementById('details-' + rowId);
    if (details) details.classList.toggle('open');
};

// Hızlı şablon butonları — artık mevcut alanı EZMEK yerine YENİ bir satır ekliyor,
// böylece birden fazla şablonu (Tek Rakı + Duble Porsiyon gibi) yan yana kullanabilirsiniz.
window.addPresetExtra = function (tr, en, ar, ru) {
    addExtraRow(tr, en, ar, ru);
};

// Form kaydedilmeden hemen önce çağrılır: ekrandaki tüm ekstra satırlarını
// toplayıp gizli input'lara (item-extras-tr/en/ar/ru) yazar.
function collectExtrasPayload() {
    const rows = document.querySelectorAll('#extras-container .extra-row-card');
    const parts = { tr: [], en: [], ar: [], ru: [] };

    rows.forEach(row => {
        const tr = row.querySelector('.extra-field-tr')?.value.trim() || '';
        const en = row.querySelector('.extra-field-en')?.value.trim() || '';
        const ar = row.querySelector('.extra-field-ar')?.value.trim() || '';
        const ru = row.querySelector('.extra-field-ru')?.value.trim() || '';
        if (!tr && !en && !ar && !ru) return; // tamamen boş satırı atla
        if (tr) parts.tr.push(tr);
        if (en) parts.en.push(en);
        if (ar) parts.ar.push(ar);
        if (ru) parts.ru.push(ru);
    });

    document.getElementById('item-extras-tr').value = parts.tr.join(', ');
    document.getElementById('item-extras-en').value = parts.en.join(', ');
    document.getElementById('item-extras-ar').value = parts.ar.join(', ');
    document.getElementById('item-extras-ru').value = parts.ru.join(', ');
}

function updateVariantPreview() {
    const input = document.getElementById('item-name-tr');
    const preview = document.getElementById('variant-preview');
    if (!input || !preview) return;

    const val = input.value.trim();
    const clMatch = val.match(/\s+(\d+(?:,\d+)?\s*(?:cl|kg)\.?)\b/i);

    if (clMatch) {
        const sizeStr = clMatch[1].trim();
        const baseName = val.replace(clMatch[0], '').replace(/\s+/g, ' ').trim();
        preview.innerHTML = `✨ <strong>Canlı Menü Önizlemesi:</strong> Ana Başlık: <span style="color:var(--accent);">${esc(baseName)}</span> | Buton Varyantı: <span style="color:#2ecc71;">[ ${esc(sizeStr)} ]</span>`;
        preview.style.background = 'rgba(46, 204, 113, 0.1)';
        preview.style.borderColor = 'rgba(46, 204, 113, 0.3)';
    } else {
        preview.innerHTML = `💡 <em>Ürün ismine cl/kg eklendiğinde menüde şık bir varyant butonu olarak görünecektir. Unutmayın: her boyut kendi başına ayrı bir üründür.</em>`;
        preview.style.background = 'rgba(212, 163, 85, 0.05)';
        preview.style.borderColor = 'rgba(212, 163, 85, 0.2)';
    }
}

document.getElementById('item-name-tr')?.addEventListener('input', updateVariantPreview);

// ─── RENDER: KATEGORİ KARTLARI ──────────────────────────────────────
function renderCategoriesList() {
    const container = document.getElementById('categories-list');
    const countEl = document.getElementById('cats-count');
    if (!container) return;

    countEl.textContent = `${categories.length} kategori`;

    if (categories.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📂</div>
                <p>Henüz kategori eklenmemiş.</p>
            </div>`;
        return;
    }

    container.innerHTML = '';
    categories.forEach(cat => {
        const itemCount = items.filter(i => i.category_id === cat.id).length;
        const card = document.createElement('div');
        card.className = 'cat-card';
        card.innerHTML = `
            <div class="cat-order">${cat.sort_order}</div>
            ${cat.image
                ? `<img src="${escapeAttr(cat.image)}" class="item-thumb" alt="" loading="lazy">`
                : `<div class="item-thumb-empty">📂</div>`
            }
            <div class="cat-info">
                <div class="cat-name">${esc(cat.name_tr)}</div>
                <div class="cat-item-count">${itemCount} ürün</div>
            </div>
            <div class="item-actions">
                <button class="btn-icon" onclick="editCategory('${escapeAttr(cat.id)}')" title="Düzenle">✏️</button>
                <button class="btn-icon danger" onclick="handleDeleteCategory('${escapeAttr(cat.id)}')" title="Sil">🗑️</button>
            </div>
        `;
        container.appendChild(card);
    });
}

function updateCategorySelects(currentFilter = '') {
    const filterSelect = document.getElementById('filter-category');
    const formSelect = document.getElementById('item-category');

    if (filterSelect && formSelect) {
        const options = categories.map(c => `<option value="${escapeAttr(c.id)}">${esc(c.name_tr)}</option>`).join('');
        filterSelect.innerHTML = '<option value="">Tüm Kategoriler</option>' + options;
        if (currentFilter) filterSelect.value = currentFilter;
        formSelect.innerHTML = options;
        filterSelect.onchange = (e) => renderItemsList(e.target.value);
    }
}

// ─── HELPERS ─────────────────────────────────────────────────────────
function esc(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function escapeAttr(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

// Türkçe isimden slug oluştur (kategori ID için)
function slugify(text) {
    const charMap = {'ç':'c','ğ':'g','ı':'i','ö':'o','ş':'s','ü':'u','Ç':'c','Ğ':'g','İ':'i','Ö':'o','Ş':'s','Ü':'u'};
    return text.toLowerCase()
        .replace(/[çğıöşüÇĞİÖŞÜ]/g, c => charMap[c] || c)
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
}

// ─── GÖRSEL ÖNİZLEME & UPLOAD ───────────────────────────────────────
function setupImageUploads() {
    setupSingleUpload('item-image-file', 'item-image-preview', 'item-upload-placeholder');
    setupSingleUpload('cat-image-file', 'cat-image-preview', 'cat-upload-placeholder');
}

function setupSingleUpload(inputId, previewId, placeholderId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        const preview = document.getElementById(previewId);
        const placeholder = document.getElementById(placeholderId);
        if (file && preview && placeholder) {
            const url = URL.createObjectURL(file);
            preview.src = url;
            preview.style.display = 'block';
            placeholder.style.display = 'none';
        }
    });
}

function resetImagePreview(previewId, placeholderId) {
    const preview = document.getElementById(previewId);
    const placeholder = document.getElementById(placeholderId);
    if (preview) { preview.style.display = 'none'; preview.src = ''; }
    if (placeholder) placeholder.style.display = '';
}

// ─── IMAGE COMPRESSION (Canvas API) ──────────────────────────────────
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_RAW_SIZE = 10 * 1024 * 1024;
const MAX_DIMENSION = 1200;
const COMPRESS_QUALITY = 0.82;

// WebP desteğini bir kez test et
const WEBP_SUPPORTED = (() => {
    try {
        const c = document.createElement('canvas');
        c.width = 1; c.height = 1;
        return c.toDataURL('image/webp').startsWith('data:image/webp');
    } catch (e) { return false; }
})();

async function compressImage(file) {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        showToast('Desteklenmeyen dosya tipi. JPEG, PNG veya WebP yükleyin.', 'error');
        return null;
    }
    if (file.size > MAX_RAW_SIZE) {
        showToast(`Dosya çok büyük (${(file.size / 1024 / 1024).toFixed(1)}MB). Maks 10MB.`, 'error');
        return null;
    }
    return new Promise((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(url);
            let { width, height } = img;
            if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
                if (width > height) { height = Math.round(height * (MAX_DIMENSION / width)); width = MAX_DIMENSION; }
                else { width = Math.round(width * (MAX_DIMENSION / height)); height = MAX_DIMENSION; }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width; canvas.height = height;
            canvas.getContext('2d').drawImage(img, 0, 0, width, height);

            if (WEBP_SUPPORTED) {
                // WebP destekleniyor — doğrudan WebP üret
                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' }));
                    } else {
                        // Blob boş döndü, JPEG'e düş
                        canvas.toBlob((jpgBlob) => {
                            resolve(jpgBlob
                                ? new File([jpgBlob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })
                                : file);
                        }, 'image/jpeg', COMPRESS_QUALITY);
                    }
                }, 'image/webp', COMPRESS_QUALITY);
            } else {
                // WebP desteklenmiyor (Safari vb.) — JPEG üret
                canvas.toBlob((jpgBlob) => {
                    resolve(jpgBlob
                        ? new File([jpgBlob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })
                        : file);
                }, 'image/jpeg', COMPRESS_QUALITY);
            }
        };
        img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
        img.src = url;
    });
}

async function uploadImage(file, categoryId) {
    if (!sb || !file) return null;
    const compressed = await compressImage(file);
    if (!compressed) return null;
    const fileExt = compressed.name.split('.').pop();
    const mimeType = compressed.type || (fileExt === 'webp' ? 'image/webp' : 'image/jpeg');
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 11)}.${fileExt}`;
    const filePath = categoryId ? `${categoryId}/${fileName}` : fileName;
    const { error } = await sb.storage.from('images').upload(filePath, compressed, {
        cacheControl: '86400',
        upsert: false,
        contentType: mimeType
    });
    if (error) { showToast('Görsel yüklenemedi: ' + error.message, 'error'); return null; }
    const { data } = sb.storage.from('images').getPublicUrl(filePath);
    return data.publicUrl;
}

// ─── MODAL LOGIC ─────────────────────────────────────────────────────
function openModal(id) {
    document.getElementById(id).style.display = 'block';
}

function closeModal(id) {
    document.getElementById(id).style.display = 'none';
    if (id === 'itemModal') {
        document.getElementById('item-form').reset();
        document.getElementById('item-id').value = '';
        document.getElementById('item-image').value = '';
        document.getElementById('item-extras-tr').value = '';
        document.getElementById('item-extras-en').value = '';
        document.getElementById('item-extras-ar').value = '';
        document.getElementById('item-extras-ru').value = '';
        document.getElementById('extras-container').innerHTML = '';
        switchLangTab('tr');
        resetImagePreview('item-image-preview', 'item-upload-placeholder');
        document.getElementById('itemModalTitle').textContent = 'Yeni Ürün Ekle';
    }
    if (id === 'categoryModal') {
        document.getElementById('category-form').reset();
        document.getElementById('cat-id').value = '';
        document.getElementById('cat-image').value = '';
        resetImagePreview('cat-image-preview', 'cat-upload-placeholder');
        document.getElementById('categoryModalTitle').textContent = 'Yeni Kategori Ekle';
    }
}

window.addEventListener('click', function (event) {
    if (event.target.classList.contains('modal')) {
        // Find which modal was clicked
        if (event.target.id === 'itemModal') closeModal('itemModal');
        if (event.target.id === 'categoryModal') closeModal('categoryModal');
    }
});

// ─── MODAL OPENERS ───────────────────────────────────────────────────
window.openItemModal = function () {
    closeModal('itemModal'); // reset first
    document.getElementById('item-is-active').checked = true;
    switchLangTab('tr');
    openModal('itemModal');
    updateVariantPreview();
};

window.openCategoryModal = function () {
    closeModal('categoryModal'); // reset first
    openModal('categoryModal');
};

// ─── CRUD: KATEGORİLER ──────────────────────────────────────────────
document.getElementById('category-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!sb) return showToast('Bağlantı yok.', 'error');

    let id = document.getElementById('cat-id').value;
    const name_tr = document.getElementById('cat-name-tr').value.trim();
    const sort_order = parseInt(document.getElementById('cat-order').value) || 0;
    let image = document.getElementById('cat-image').value;
    const imageFile = document.getElementById('cat-image-file').files[0];

    if (!name_tr) return showToast('Kategori adı boş olamaz.', 'error');

    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Kaydediliyor...';

    if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile, id || slugify(name_tr));
        if (uploadedUrl) image = uploadedUrl;
    }

    const isEdit = id && categories.some(c => c.id === id);

    if (isEdit) {
        const { error } = await sb.from('categories').update({ name_tr, sort_order, image }).eq('id', id);
        if (error) showToast('Hata: ' + error.message, 'error');
        else showToast('Kategori güncellendi ✓');
    } else {
        // Yeni kategori — ID otomatik oluştur
        id = slugify(name_tr);
        if (!id) { showToast('Geçersiz kategori adı.', 'error'); btn.disabled = false; btn.textContent = 'Kaydet'; return; }
        // ID çakışması kontrolü
        if (categories.some(c => c.id === id)) {
            id = id + '_' + Date.now().toString(36).slice(-4);
        }
        const { error } = await sb.from('categories').insert([{ id, name_tr, sort_order, image }]);
        if (error) showToast('Hata: ' + error.message, 'error');
        else showToast('Kategori eklendi ✓');
    }

    btn.disabled = false;
    btn.textContent = 'Kaydet';
    closeModal('categoryModal');
    loadData();
});

window.editCategory = function (id) {
    const cat = categories.find(c => c.id === id);
    if (!cat) return;
    document.getElementById('cat-id').value = cat.id;
    document.getElementById('cat-name-tr').value = cat.name_tr;
    document.getElementById('cat-order').value = cat.sort_order;
    document.getElementById('cat-image').value = cat.image || '';
    document.getElementById('categoryModalTitle').textContent = 'Kategori Düzenle';
    // Mevcut görseli önizle
    if (cat.image) {
        const preview = document.getElementById('cat-image-preview');
        const placeholder = document.getElementById('cat-upload-placeholder');
        preview.src = cat.image;
        preview.style.display = 'block';
        placeholder.style.display = 'none';
    }
    openModal('categoryModal');
};

window.handleDeleteCategory = async function (id) {
    const cat = categories.find(c => c.id === id);
    const itemCount = items.filter(i => i.category_id === id).length;
    const name = cat ? cat.name_tr : id;
    const msg = itemCount > 0
        ? `"${name}" kategorisini ve içindeki ${itemCount} ürünü silmek istediğinize emin misiniz?`
        : `"${name}" kategorisini silmek istediğinize emin misiniz?`;

    const confirmed = await showConfirm(msg);
    if (!confirmed) return;

    const { error } = await sb.from('categories').delete().eq('id', id);
    if (error) showToast('Silinemedi: ' + error.message, 'error');
    else { showToast('Kategori silindi.'); loadData(); }
};

// ─── CRUD: ÜRÜNLER ───────────────────────────────────────────────────
document.getElementById('item-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!sb) return showToast('Bağlantı yok.', 'error');

    collectExtrasPayload(); // Gather dynamic extra rows into hidden payload inputs

    const id = document.getElementById('item-id').value;
    const category_id = document.getElementById('item-category').value;
    const name_tr = document.getElementById('item-name-tr').value.trim();
    const name_en = document.getElementById('item-name-en')?.value.trim() || null;
    const name_ar = document.getElementById('item-name-ar')?.value.trim() || null;
    const name_ru = document.getElementById('item-name-ru')?.value.trim() || null;
    const price = document.getElementById('item-price').value;
    const sort_order = parseInt(document.getElementById('item-sort-order').value) || 0;
    const is_active = document.getElementById('item-is-active').checked;
    let image = document.getElementById('item-image').value;
    const imageFile = document.getElementById('item-image-file').files[0];
    const extras_tr = document.getElementById('item-extras-tr').value.trim();
    const extras_en = document.getElementById('item-extras-en').value.trim();
    const extras_ar = document.getElementById('item-extras-ar').value.trim();
    const extras_ru = document.getElementById('item-extras-ru').value.trim();

    if (!name_tr) return showToast('Ürün adı boş olamaz.', 'error');
    if (!price) return showToast('Fiyat girilmeli.', 'error');

    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Kaydediliyor...';

    if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile, category_id);
        if (uploadedUrl) image = uploadedUrl;
    }

    const payload = { 
        category_id, 
        name_tr,
        name_en,
        name_ar,
        name_ru,
        price: parseFloat(price), 
        sort_order, 
        is_active, 
        image,
        extras_tr: extras_tr || null,
        extras_en: extras_en || null,
        extras_ar: extras_ar || null,
        extras_ru: extras_ru || null
    };

    if (id) {
        const { error } = await sb.from('menu_items').update(payload).eq('id', id);
        if (error) showToast('Hata: ' + error.message, 'error');
        else showToast('Ürün güncellendi ✓');
    } else {
        const { error } = await sb.from('menu_items').insert([payload]);
        if (error) showToast('Hata: ' + error.message, 'error');
        else showToast('Ürün eklendi ✓');
    }

    btn.disabled = false;
    btn.textContent = 'Kaydet';
    closeModal('itemModal');
    loadData();
});

window.editItem = function (id) {
    const item = items.find(i => i.id === id);
    if (!item) return;
    document.getElementById('item-id').value = item.id;
    document.getElementById('item-category').value = item.category_id;
    document.getElementById('item-name-tr').value = item.name_tr;
    if (document.getElementById('item-name-en')) document.getElementById('item-name-en').value = item.name_en || '';
    if (document.getElementById('item-name-ar')) document.getElementById('item-name-ar').value = item.name_ar || '';
    if (document.getElementById('item-name-ru')) document.getElementById('item-name-ru').value = item.name_ru || '';
    document.getElementById('item-price').value = item.price || '';
    document.getElementById('item-sort-order').value = item.sort_order || 0;
    document.getElementById('item-is-active').checked = item.is_active;
    document.getElementById('item-image').value = item.image || '';
    document.getElementById('item-extras-tr').value = item.extras_tr || '';
    document.getElementById('item-extras-en').value = item.extras_en || '';
    document.getElementById('item-extras-ar').value = item.extras_ar || '';
    document.getElementById('item-extras-ru').value = item.extras_ru || '';
    document.getElementById('itemModalTitle').textContent = 'Ürün Düzenle';

    // Mevcut ekstraları düzenlenebilir satır olarak göster
    document.getElementById('extras-container').innerHTML = '';
    if (item.extras_tr || item.extras_en || item.extras_ar || item.extras_ru) {
        addExtraRow(item.extras_tr || '', item.extras_en || '', item.extras_ar || '', item.extras_ru || '');
    }

    // Mevcut görseli önizle
    if (item.image) {
        const preview = document.getElementById('item-image-preview');
        const placeholder = document.getElementById('item-upload-placeholder');
        preview.src = item.image;
        preview.style.display = 'block';
        placeholder.style.display = 'none';
    }
    switchLangTab('tr');
    openModal('itemModal');
    updateVariantPreview();
};

window.handleDeleteItem = async function (id) {
    const item = items.find(i => i.id === id);
    const name = item ? item.name_tr : 'Bu ürün';
    const confirmed = await showConfirm(`"${name}" ürününü silmek istediğinize emin misiniz?`);
    if (!confirmed) return;

    const { error } = await sb.from('menu_items').delete().eq('id', id);
    if (error) showToast('Silinemedi: ' + error.message, 'error');
    else { showToast('Ürün silindi.'); loadData(); }
};
