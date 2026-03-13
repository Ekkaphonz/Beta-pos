// ── js/storage.js ── LocalStorage Data Management (v2)

const STORAGE = {
  KEYS: {
    ORDERS:       'pos_orders',
    STOCK:        'pos_stock',
    ORDER_NUM:    'pos_order_num',
    CLOSED_DAYS:  'pos_closed_days'
  },

  // ── ORDER NUMBER ──────────────────────────────────────────────
  getNextOrderNum() {
    const n = parseInt(localStorage.getItem(this.KEYS.ORDER_NUM) || '1000');
    const next = n + 1;
    localStorage.setItem(this.KEYS.ORDER_NUM, String(next));
    return next;
  },

  // ── ORDERS ────────────────────────────────────────────────────
  getOrders() {
    try { return JSON.parse(localStorage.getItem(this.KEYS.ORDERS)) || []; }
    catch { return []; }
  },

  saveOrder(order) {
    const orders = this.getOrders();
    const num = this.getNextOrderNum();
    order.id     = `#${num}`;
    order.num    = num;
    order.date   = new Date().toISOString();
    orders.push(order);
    localStorage.setItem(this.KEYS.ORDERS, JSON.stringify(orders));
    return order;
  },

  getTodayOrders() {
    const today = new Date().toDateString();
    return this.getOrders().filter(o => new Date(o.date).toDateString() === today);
  },

  getOrdersByDateRange(from, to) {
    // from/to are Date objects (start of day / end of day)
    return this.getOrders().filter(o => {
      const d = new Date(o.date);
      return d >= from && d <= to;
    });
  },

  // ── STOCK ─────────────────────────────────────────────────────
  getStock() {
    try { return JSON.parse(localStorage.getItem(this.KEYS.STOCK)) || null; }
    catch { return null; }
  },

  saveStock(stock) {
    localStorage.setItem(this.KEYS.STOCK, JSON.stringify(stock));
  },

  updateProductStock(productId, quantity) {
    const stock = this.getStock() || {};
    if (stock[productId] !== undefined) {
      stock[productId] = Math.max(0, stock[productId] - quantity);
    }
    this.saveStock(stock);
  },

  // ── DAILY SUMMARY ─────────────────────────────────────────────
  getDailySummary(orders) {
    const list = orders || this.getTodayOrders();
    const s = {
      totalRevenue: 0, orderCount: list.length,
      totalItems: 0, cashRevenue: 0,
      transferRevenue: 0, totalVAT: 0, productSales: {}
    };
    list.forEach(o => {
      s.totalRevenue    += o.total;
      s.totalVAT        += o.vat;
      if (o.paymentType === 'cash') s.cashRevenue    += o.total;
      else                          s.transferRevenue += o.total;
      o.items.forEach(item => {
        s.totalItems += item.qty;
        s.productSales[item.name] = (s.productSales[item.name] || 0) + item.qty;
      });
    });
    const best = Object.entries(s.productSales).sort((a,b) => b[1]-a[1])[0];
    s.bestProduct = best ? best[0] : '-';
    return s;
  },

  // ── DAY CLOSE ─────────────────────────────────────────────────
  getClosedDays() {
    try { return JSON.parse(localStorage.getItem(this.KEYS.CLOSED_DAYS)) || []; }
    catch { return []; }
  },

  closeDay() {
    const summary = this.getDailySummary();
    const record = {
      date:            new Date().toISOString(),
      dateLabel:       new Date().toLocaleDateString('lo-LA'),
      totalRevenue:    summary.totalRevenue,
      cashRevenue:     summary.cashRevenue,
      transferRevenue: summary.transferRevenue,
      orderCount:      summary.orderCount,
      totalVAT:        summary.totalVAT,
      bestProduct:     summary.bestProduct
    };
    const closed = this.getClosedDays();
    closed.push(record);
    localStorage.setItem(this.KEYS.CLOSED_DAYS, JSON.stringify(closed));
    return record;
  },

  // ── CSV EXPORT ────────────────────────────────────────────────
  _buildCSV(orders) {
    const rows = [['Order ID','Date','Product','Price','Quantity','Line Total','VAT','Order Total','Payment Type']];
    orders.forEach(o => {
      const d = new Date(o.date).toLocaleString('lo-LA');
      o.items.forEach(item => {
        rows.push([
          o.id, d, item.name, item.price, item.qty,
          item.price * item.qty,
          o.vat.toFixed(0), o.total.toFixed(0), o.paymentType
        ]);
      });
    });
    return rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  },

  _downloadCSV(csv, filename) {
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  },

  exportCSV()                  { this._downloadCSV(this._buildCSV(this.getOrders()), 'sales-all.csv'); },
  exportCSVToday()             { this._downloadCSV(this._buildCSV(this.getTodayOrders()), `sales-today-${new Date().toISOString().slice(0,10)}.csv`); },
  exportCSVRange(from, to)     { this._downloadCSV(this._buildCSV(this.getOrdersByDateRange(from, to)), `sales-${from.toISOString().slice(0,10)}-to-${to.toISOString().slice(0,10)}.csv`); }
};