// ── js/pos.js ── Product Menu & Cart Logic (v2)

const PRODUCTS = [
  { id:'p1',  name:'ເຂົ້າໜົມປັງອົບ',         price:12000, icon:'🍞', defaultStock:50 },
  { id:'p2',  name:'ເຂົ້າໜົມປັງທາເນີຍ',       price:15000, icon:'🥖', defaultStock:40 },
  { id:'p3',  name:'ໝ້ອຍທອດ (5 ໜ່ວຍ)',       price:20000, icon:'🥟', defaultStock:30 },
  { id:'p4',  name:'ໝ້ອຍນຶ່ງ (5 ໜ່ວຍ)',      price:18000, icon:'🥟', defaultStock:30 },
  { id:'p5',  name:'ເຂົ້າໜົມປັງໄສ້ກ້ອນ',      price:25000, icon:'🥖', defaultStock:25 },
  { id:'p6',  name:'ໝ້ອຍຊີ້ນໝູ (3 ໜ່ວຍ)',    price:22000, icon:'🥟', defaultStock:35 },
  { id:'p7',  name:'ເຂົ້າໜົມປັງຮ້ອນ',         price:13000, icon:'🍞', defaultStock:60 },
  { id:'p8',  name:'ໝ້ອຍຜັກ (5 ໜ່ວຍ)',       price:16000, icon:'🥟', defaultStock:40 },
  { id:'p9',  name:'ເຂົ້າໜົມປັງຊ໊ອກໂກເລດ',   price:18000, icon:'🍞', defaultStock:20 },
  { id:'p10', name:'ໝ້ອຍກຸ້ງ (3 ໜ່ວຍ)',       price:30000, icon:'🥟', defaultStock:15 }
];

let cart = [];
let searchQuery = '';

const POS = {
  init() {
    if (!AUTH.requireUser()) return;
    this.initStock();
    this.renderProducts();
    this.updateCartUI();
    this.updateClock();
    setInterval(() => this.updateClock(), 1000);

    const user = AUTH.isUserLoggedIn();
    document.getElementById('username-display').textContent = user.username;

    // Search bar
    const searchEl = document.getElementById('product-search');
    if (searchEl) {
      searchEl.addEventListener('input', e => {
        searchQuery = e.target.value.toLowerCase().trim();
        this.renderProducts();
      });
    }

    // Cancel order button
    const cancelBtn = document.getElementById('btn-cancel-order');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.cancelOrder());
    }
  },

  initStock() {
    if (!STORAGE.getStock()) {
      const stock = {};
      PRODUCTS.forEach(p => { stock[p.id] = p.defaultStock; });
      STORAGE.saveStock(stock);
    }
  },

  getStock() { return STORAGE.getStock() || {}; },

  renderProducts() {
    const grid  = document.getElementById('menu-grid');
    const stock = this.getStock();
    grid.innerHTML = '';

    const filtered = searchQuery
      ? PRODUCTS.filter(p => p.name.toLowerCase().includes(searchQuery))
      : PRODUCTS;

    if (filtered.length === 0) {
      grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text3);">
        🔍 ບໍ່ພົບສິນຄ້າທີ່ຄົ້ນຫາ
      </div>`;
      return;
    }

    filtered.forEach(p => {
      const qty   = stock[p.id] ?? 0;
      const isOut = qty === 0;
      const isLow = qty > 0 && qty <= 5;

      const el = document.createElement('button');
      el.className = 'menu-item' + (isOut ? ' out-of-stock' : '');
      el.disabled  = isOut;

      el.onclick = () => {
        SOUNDS.playClick();
        this.addToCart(p);
      };

      // Stock status badge
      let stockBadgeClass = 'ok';
      let stockBadgeText  = `ສ/ຄ: ${qty}`;
      if (isOut)      { stockBadgeClass = 'out'; stockBadgeText = 'ໝົດສ/ຄ'; }
      else if (isLow) { stockBadgeClass = 'low'; stockBadgeText = `⚠ ໃກ້ໝົດ: ${qty}`; }

      el.innerHTML = `
        <span class="oos-badge">ໝົດ</span>
        <span class="stock-badge ${stockBadgeClass}">${stockBadgeText}</span>
        <span class="menu-icon">${p.icon}</span>
        <div class="menu-name">${p.name}</div>
        <div class="menu-price">${this.formatKIP(p.price)}</div>
        ${isLow && !isOut ? '<div class="low-stock-warning">⚠ Low Stock</div>' : ''}
      `;
      grid.appendChild(el);
    });
  },

  addToCart(product) {
    const stock    = this.getStock();
    const stockQty = stock[product.id] ?? 0;
    const inCart   = cart.find(i => i.id === product.id)?.qty || 0;

    if (inCart >= stockQty) {
      SOUNDS.playError();
      showToast('ສິນຄ້ານີ້ໝົດສ/ຄ ແລ້ວ!', 'error');
      return;
    }

    const existing = cart.find(i => i.id === product.id);
    if (existing) existing.qty++;
    else cart.push({ ...product, qty: 1 });

    this.updateCartUI();
    this.renderProducts();
  },

  removeFromCart(productId) {
    const item = cart.find(i => i.id === productId);
    if (!item) return;
    SOUNDS.playClick();
    item.qty--;
    if (item.qty <= 0) cart = cart.filter(i => i.id !== productId);
    this.updateCartUI();
    this.renderProducts();
  },

  removeItemCompletely(productId) {
    SOUNDS.playClick();
    cart = cart.filter(i => i.id !== productId);
    this.updateCartUI();
    this.renderProducts();
  },

  increaseQty(productId) {
    const stock = this.getStock();
    const item  = cart.find(i => i.id === productId);
    if (!item) return;
    if (item.qty >= (stock[productId] ?? 0)) {
      SOUNDS.playError();
      showToast('ສິນຄ້ານີ້ໝົດສ/ຄ ແລ້ວ!', 'error');
      return;
    }
    SOUNDS.playClick();
    item.qty++;
    this.updateCartUI();
    this.renderProducts();
  },

  cancelOrder() {
    if (cart.length === 0) return;
    if (typeof SOUNDS !== 'undefined' && SOUNDS.playError) SOUNDS.playError();
    cart = [];
    this.updateCartUI();
    this.renderProducts();
    showToast('ຍົກເລີກລາຍການແລ້ວ', 'error');
  },

  updateCartUI() {
    const cartItemsEl = document.getElementById('cart-items');
    const cartCountEl = document.getElementById('cart-count');
    const cancelBtn   = document.getElementById('btn-cancel-order');

    const totalItems = cart.reduce((s,i) => s + i.qty, 0);
    cartCountEl.textContent = totalItems;

    if (cancelBtn) cancelBtn.disabled = cart.length === 0;

    if (cart.length === 0) {
      cartItemsEl.innerHTML = `
        <div class="cart-empty">
          <span class="empty-icon">🧺</span>
          <span>ຍັງບໍ່ມີລາຍການ</span>
          <small style="color:var(--text3);">ກົດເລືອກສິນຄ້າ</small>
        </div>`;
    } else {
      cartItemsEl.innerHTML = cart.map(item => `
        <div class="cart-item">
          <span class="cart-item-icon">${item.icon}</span>
          <div class="cart-item-info">
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-price">${this.formatKIP(item.price)} × ${item.qty}
              = <strong>${this.formatKIP(item.price * item.qty)}</strong>
            </div>
          </div>
          <div class="qty-controls">
            <button class="qty-btn minus" onclick="POS.removeFromCart('${item.id}')">−</button>
            <span class="qty-value">${item.qty}</span>
            <button class="qty-btn plus"  onclick="POS.increaseQty('${item.id}')">+</button>
            <button class="qty-btn remove" onclick="POS.removeItemCompletely('${item.id}')" title="ລຶບ">🗑</button>
          </div>
        </div>
      `).join('');
    }

    PAYMENT.updateTotals();
  },

  clearCart() {
    cart = [];
    this.updateCartUI();
    this.renderProducts();
  },

  formatKIP(amount) {
    return amount.toLocaleString('en-US') + ' KIP';
  },

  updateClock() {
    const el = document.getElementById('clock');
    if (el) el.textContent = new Date().toLocaleTimeString('lo-LA');
  }
};