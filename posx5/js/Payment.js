// ── js/payment.js ── Payment Handling, VAT & Receipt (v2)

const VAT_RATE = 0.10;
let selectedPayment = 'cash';
let lastOrder = null; // store for printing

const PAYMENT = {
  init() {
    document.getElementById('pay-cash').addEventListener('click', () => {
      SOUNDS.playClick(); this.selectPayment('cash');
    });
    document.getElementById('pay-transfer').addEventListener('click', () => {
      SOUNDS.playClick(); this.selectPayment('transfer');
    });
    document.getElementById('cash-received').addEventListener('input', () => this.updateChange());
    document.getElementById('btn-checkout').addEventListener('click', () => this.checkout());
    document.getElementById('btn-new-order').addEventListener('click', () => {
      SOUNDS.playClick(); this.newOrder();
    });
    const printBtn = document.getElementById('btn-print-receipt');
    if (printBtn) printBtn.addEventListener('click', () => RECEIPT.print(lastOrder));
  },

  selectPayment(type) {
    selectedPayment = type;
    document.getElementById('pay-cash').classList.toggle('active', type === 'cash');
    document.getElementById('pay-transfer').classList.toggle('active', type === 'transfer');
    document.getElementById('cash-input-section').classList.toggle('visible', type === 'cash');
    document.getElementById('change-display').classList.remove('visible');
    document.getElementById('cash-received').value = '';
    this.updateTotals();
  },

  calcTotals() {
    const subtotal = cart.reduce((s,i) => s + i.price * i.qty, 0);
    const vat   = subtotal * VAT_RATE;
    const total = subtotal + vat;
    return { subtotal, vat, total };
  },

  updateTotals() {
    const { subtotal, vat, total } = this.calcTotals();
    document.getElementById('subtotal-display').textContent = subtotal.toLocaleString('en-US') + ' KIP';
    document.getElementById('vat-display').textContent      = vat.toLocaleString('en-US')      + ' KIP';
    document.getElementById('total-display').textContent    = total.toLocaleString('en-US')    + ' KIP';
    document.getElementById('btn-checkout').disabled = cart.length === 0;
    if (selectedPayment === 'cash' && document.getElementById('cash-received').value) {
      this.updateChange();
    }
  },

  updateChange() {
    const { total } = this.calcTotals();
    const received  = parseFloat(document.getElementById('cash-received').value.replace(/,/g,'')) || 0;
    const change    = received - total;
    const display   = document.getElementById('change-display');
    const amt       = document.getElementById('change-amount');
    if (received > 0) {
      display.classList.add('visible');
      if (change >= 0) {
        amt.textContent = change.toLocaleString('en-US') + ' KIP';
        amt.style.color = 'var(--green)';
      } else {
        amt.textContent = '⚠ ບໍ່ພໍ ' + Math.abs(change).toLocaleString('en-US') + ' KIP';
        amt.style.color = 'var(--red)';
      }
    } else {
      display.classList.remove('visible');
    }
  },

  checkout() {
    if (cart.length === 0) return;
    const { subtotal, vat, total } = this.calcTotals();
    if (selectedPayment === 'cash') {
      const received = parseFloat(document.getElementById('cash-received').value) || 0;
      if (received < total) {
        SOUNDS.playError();
        showToast('ຈຳນວນເງິນບໍ່ພໍ!', 'error');
        return;
      }
    }
    const received = parseFloat(document.getElementById('cash-received').value) || total;
    const order = {
      items: cart.map(i => ({ id:i.id, name:i.name, icon:i.icon, price:i.price, qty:i.qty })),
      subtotal, vat, total,
      paymentType: selectedPayment,
      cashReceived: selectedPayment === 'cash' ? received : 0,
      change: selectedPayment === 'cash' ? received - total : 0
    };
    STORAGE.saveOrder(order);
    cart.forEach(item => STORAGE.updateProductStock(item.id, item.qty));
    lastOrder = order;
    SOUNDS.playSuccess();
    this.showReceipt(order);
  },

  showReceipt(order) {
    const change       = order.change || 0;
    const itemsSummary = order.items.map(i => `${i.icon} ${i.name} ×${i.qty}`).join(', ');

    document.getElementById('receipt-order-id').textContent   = order.id;
    document.getElementById('receipt-items').textContent      = itemsSummary;
    document.getElementById('receipt-subtotal').textContent   = order.subtotal.toLocaleString('en-US') + ' KIP';
    document.getElementById('receipt-vat').textContent        = order.vat.toLocaleString('en-US')      + ' KIP';
    document.getElementById('receipt-total').textContent      = order.total.toLocaleString('en-US')    + ' KIP';
    document.getElementById('receipt-payment').textContent    = order.paymentType === 'cash' ? '💵 ເງິນສົດ' : '📲 ໂອນເງິນ';

    const changeRow = document.getElementById('receipt-change-row');
    if (order.paymentType === 'cash') {
      changeRow.style.display = 'flex';
      document.getElementById('receipt-change').textContent = change.toLocaleString('en-US') + ' KIP';
    } else {
      changeRow.style.display = 'none';
    }
    document.getElementById('success-modal').classList.add('visible');
    showToast('ຊຳລະເງິນສຳເລັດ! ✓', 'success');
  },

  newOrder() {
    document.getElementById('success-modal').classList.remove('visible');
    document.getElementById('cash-received').value = '';
    document.getElementById('change-display').classList.remove('visible');
    lastOrder = null;
    POS.clearCart();
  }
};

function showToast(msg, type = '') {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast'; toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.className   = 'toast ' + type;
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => toast.classList.remove('show'), 3000);
}