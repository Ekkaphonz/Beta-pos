// ── js/receipt.js ── Print Receipt Feature

const RECEIPT = {
  print(order) {
    if (!order) { showToast('ບໍ່ມີຂໍ້ມູນໃບບິນ', 'error'); return; }

    const change = order.change || 0;
    const date   = new Date(order.date || Date.now()).toLocaleString('lo-LA');

    const itemRows = order.items.map(item => {
      const lineTotal = (item.price * item.qty).toLocaleString('en-US');
      const unitPrice = item.price.toLocaleString('en-US');
      return `
        <tr>
          <td>${item.icon} ${item.name}</td>
          <td style="text-align:center;">${item.qty}</td>
          <td style="text-align:right;">${unitPrice}</td>
          <td style="text-align:right;">${lineTotal}</td>
        </tr>`;
    }).join('');

    const changeRow = order.paymentType === 'cash'
      ? `<tr class="change-row"><td colspan="3">ເງິນທອນ</td><td style="text-align:right;">${change.toLocaleString('en-US')} KIP</td></tr>`
      : '';

    const html = `<!DOCTYPE html>
<html lang="lo">
<head>
  <meta charset="UTF-8">
  <title>ໃບບິນ ${order.id}</title>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Lao:wght@400;700&display=swap" rel="stylesheet">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; font-family:"Noto Sans Lao",sans-serif; }
    body { width:80mm; margin:0 auto; padding:6mm 4mm; font-size:12px; color:#2a1a0a; }

    .header { text-align:center; border-bottom:2px dashed #c8702a; padding-bottom:8px; margin-bottom:8px; }
    .header .brand { font-size:18px; font-weight:800; color:#c8702a; letter-spacing:1px; }
    .header .sub   { font-size:10px; color:#888; margin-top:2px; }
    .header .order-id { font-size:13px; font-weight:700; margin-top:6px; }

    .meta { font-size:10px; color:#666; margin-bottom:8px; }
    .meta span { display:block; }

    table { width:100%; border-collapse:collapse; margin-bottom:8px; }
    th { background:#f5e8d0; padding:5px 4px; font-size:10px; text-transform:uppercase; font-weight:700; color:#7a5c3e; }
    td { padding:5px 4px; border-bottom:1px solid #eedcc4; font-size:11px; vertical-align:top; }

    .totals { border-top:2px dashed #c8702a; padding-top:8px; margin-top:4px; }
    .totals tr td { border:none; padding:3px 4px; }
    .totals .grand td { font-size:14px; font-weight:800; color:#c8702a; padding-top:6px; border-top:1px solid #c8702a; }
    .totals .change-row td { color:#5a9e6f; font-weight:700; }

    .payment-row { margin: 8px 0; padding:6px 8px; background:#f5e8d0; border-radius:6px; font-size:11px; font-weight:700; }

    .footer { text-align:center; border-top:2px dashed #c8702a; padding-top:8px; margin-top:8px; }
    .footer .thanks { font-size:13px; font-weight:800; color:#c8702a; }
    .footer .sub    { font-size:10px; color:#888; margin-top:3px; }

    @media print {
      body { margin:0; padding:4mm; }
      @page { margin:0; size:80mm auto; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">🍞 Bakery POS</div>
    <div class="sub">ໂຮງຮຽນ · ລະບົບຂາຍສິນຄ້າ</div>
    <div class="order-id">ໃບບິນ ${order.id}</div>
  </div>

  <div class="meta">
    <span>📅 ${date}</span>
    <span>💳 ${order.paymentType === 'cash' ? 'ຊຳລະດ້ວຍເງິນສົດ' : 'ຊຳລະດ້ວຍການໂອນ'}</span>
  </div>

  <table>
    <thead>
      <tr>
        <th>ສິນຄ້າ</th>
        <th style="text-align:center;">ຈຳນວນ</th>
        <th style="text-align:right;">ລາຄາ</th>
        <th style="text-align:right;">ລວມ</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  <table class="totals">
    <tr><td colspan="3">ລາຄາກ່ອນ VAT</td><td style="text-align:right;">${order.subtotal.toLocaleString('en-US')} KIP</td></tr>
    <tr><td colspan="3">ພາສີ VAT (10%)</td><td style="text-align:right;">${order.vat.toLocaleString('en-US')} KIP</td></tr>
    <tr class="grand"><td colspan="3">ທັງໝົດ</td><td style="text-align:right;">${order.total.toLocaleString('en-US')} KIP</td></tr>
    ${changeRow}
  </table>

  <div class="footer">
    <div class="thanks">ຂໍຂອບໃຈທີ່ໃຊ້ບໍລິການ! 🙏</div>
    <div class="sub">ໂຮງຮຽນ Bakery POS · ພົບໃໝ່ອີກ</div>
  </div>

  <script>
    window.onload = function() {
      window.print();
      setTimeout(() => window.close(), 800);
    };
  <\/script>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=400,height=600');
    if (win) {
      win.document.write(html);
      win.document.close();
    } else {
      showToast('ກະລຸນາອະນຸຍາດ popup ໃນ browser', 'error');
    }
  }
};