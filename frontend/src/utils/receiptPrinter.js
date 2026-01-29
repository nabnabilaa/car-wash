// Receipt printing utility for all payment types

export const printReceipt = ({ type, data }) => {
    const printWindow = window.open('', '', 'height=600,width=400');

    if (!printWindow) {
        alert('Popup blocked! Please allow popups to print receipt.');
        return;
    }

    let receiptHTML = '';

    switch (type) {
        case 'membership':
            receiptHTML = generateMembershipReceipt(data);
            break;
        case 'transaction':
            receiptHTML = generateTransactionReceipt(data);
            break;
        case 'membership_renewal':
            receiptHTML = generateRenewalReceipt(data);
            break;
        default:
            receiptHTML = '<p>Invalid receipt type</p>';
    }

    printWindow.document.write(receiptHTML);
    printWindow.document.close();

    // Auto print after a short delay
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 250);
};

const generateMembershipReceipt = (data) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Receipt - New Membership</title>
  <style>
    @media print {
      @page { margin: 0; }
      body { margin: 1cm; }
    }
    body {
      font-family: 'Courier New', monospace;
      width: 80mm;
      margin: 0 auto;
      padding: 10px;
      font-size: 12px;
    }
    .header {
      text-align: center;
      border-bottom: 2px dashed #000;
      padding-bottom: 10px;
      margin-bottom: 10px;
    }
    .logo {
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .company-info {
      font-size: 10px;
      line-height: 1.4;
    }
    .title {
      text-align: center;
      font-weight: bold;
      font-size: 14px;
      margin: 10px 0;
    }
    .row {
      display: flex;
      justify-content: space-between;
      margin: 5px 0;
    }
    .row-label {
      font-weight: bold;
    }
    .divider {
      border-top: 1px dashed #000;
      margin: 10px 0;
    }
    .total-section {
      border-top: 2px solid #000;
      border-bottom: 2px solid #000;
      padding: 10px 0;
      margin: 10px 0;
    }
    .total {
      font-size: 16px;
      font-weight: bold;
    }
    .footer {
      text-align: center;
      margin-top: 20px;
      font-size: 10px;
      border-top: 2px dashed #000;
      padding-top: 10px;
    }
    .qr-code {
      text-align: center;
      margin: 15px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">OTOPIA CAR WASH</div>
    <div class="company-info">
      by PPM Autoworks<br>
      ${data.outlet_address || 'Jl. Sudirman No. 123, Jakarta'}<br>
      Telp: ${data.outlet_phone || '021-12345678'}
    </div>
  </div>

  <div class="title">MEMBERSHIP BARU</div>

  <div class="row">
    <span>Tanggal:</span>
    <span>${new Date(data.created_at || new Date()).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
})}</span>
  </div>

  <div class="divider"></div>

  <div class="row">
    <span class="row-label">Customer:</span>
    <span>${data.customer_name}</span>
  </div>
  <div class="row">
    <span class="row-label">Phone:</span>
    <span>${data.customer_phone}</span>
  </div>

  <div class="divider"></div>

  <div class="row">
    <span class="row-label">Tipe Membership:</span>
  </div>
  <div class="row">
    <span>${data.membership_type_label}</span>
  </div>

  <div class="row">
    <span class="row-label">Periode:</span>
    <span>${data.period_days} hari</span>
  </div>

  <div class="row">
    <span class="row-label">Berlaku s/d:</span>
    <span>${new Date(data.end_date).toLocaleDateString('id-ID')}</span>
  </div>

  <div class="total-section">
    <div class="row total">
      <span>TOTAL:</span>
      <span>Rp ${data.price.toLocaleString('id-ID')}</span>
    </div>
    <div class="row">
      <span>Metode Bayar:</span>
      <span>${data.payment_method === 'cash' ? 'Tunai' : data.payment_method === 'card' ? 'Debit/Credit' : 'QRIS'}</span>
    </div>
    ${data.payment_method === 'cash' ? `
    <div class="row">
      <span>Bayar:</span>
      <span>Rp ${(data.amount_paid || data.price).toLocaleString('id-ID')}</span>
    </div>
    <div class="row">
      <span>Kembali:</span>
      <span>Rp ${((data.amount_paid || data.price) - data.price).toLocaleString('id-ID')}</span>
    </div>
    ` : ''}
  </div>

  <div class="footer">
    <p><strong>TERIMA KASIH</strong></p>
    <p>Membership Anda telah aktif!<br>
    Nikmati benefit cuci unlimited.</p>
    <p style="margin-top: 10px; font-size: 9px;">
      Simpan struk ini sebagai bukti<br>
      membership Anda
    </p>
  </div>
</body>
</html>
`;

const generateRenewalReceipt = (data) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Receipt - Membership Renewal</title>
  <style>
    @media print {
      @page { margin: 0; }
      body { margin: 1cm; }
    }
    body {
      font-family: 'Courier New', monospace;
      width: 80mm;
      margin: 0 auto;
      padding: 10px;
      font-size: 12px;
    }
    .header {
      text-align: center;
      border-bottom: 2px dashed #000;
      padding-bottom: 10px;
      margin-bottom: 10px;
    }
    .logo {
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .company-info {
      font-size: 10px;
      line-height: 1.4;
    }
    .title {
      text-align: center;
      font-weight: bold;
      font-size: 14px;
      margin: 10px 0;
    }
    .row {
      display: flex;
      justify-content: space-between;
      margin: 5px 0;
    }
    .row-label {
      font-weight: bold;
    }
    .divider {
      border-top: 1px dashed #000;
      margin: 10px 0;
    }
    .total-section {
      border-top: 2px solid #000;
      border-bottom: 2px solid #000;
      padding: 10px 0;
      margin: 10px 0;
    }
    .total {
      font-size: 16px;
      font-weight: bold;
    }
    .footer {
      text-align: center;
      margin-top: 20px;
      font-size: 10px;
      border-top: 2px dashed #000;
      padding-top: 10px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">OTOPIA CAR WASH</div>
    <div class="company-info">
      by PPM Autoworks<br>
      ${data.outlet_address || 'Jl. Sudirman No. 123, Jakarta'}<br>
      Telp: ${data.outlet_phone || '021-12345678'}
    </div>
  </div>

  <div class="title">PERPANJANGAN MEMBERSHIP</div>

  <div class="row">
    <span>Tanggal:</span>
    <span>${new Date().toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
})}</span>
  </div>

  <div class="divider"></div>

  <div class="row">
    <span class="row-label">Customer:</span>
    <span>${data.customer_name}</span>
  </div>
  <div class="row">
    <span class="row-label">Phone:</span>
    <span>${data.customer_phone}</span>
  </div>

  <div class="divider"></div>

  <div class="row">
    <span class="row-label">Tipe:</span>
    <span>${data.membership_type_label}</span>
  </div>

  <div class="row">
    <span class="row-label">Perpanjangan:</span>
    <span>+${data.extend_days} hari</span>
  </div>

  <div class="row">
    <span class="row-label">Berlaku s/d Baru:</span>
    <span>${new Date(data.new_end_date).toLocaleDateString('id-ID')}</span>
  </div>

  <div class="total-section">
    <div class="row total">
      <span>TOTAL:</span>
      <span>Rp ${data.renewal_price.toLocaleString('id-ID')}</span>
    </div>
    <div class="row">
      <span>Metode Bayar:</span>
      <span>${data.payment_method === 'cash' ? 'Tunai' : data.payment_method === 'card' ? 'Debit/Credit' : 'QRIS'}</span>
    </div>
    ${data.payment_method === 'cash' ? `
    <div class="row">
      <span>Bayar:</span>
      <span>Rp ${data.amount_paid.toLocaleString('id-ID')}</span>
    </div>
    <div class="row">
      <span>Kembali:</span>
      <span>Rp ${(data.amount_paid - data.renewal_price).toLocaleString('id-ID')}</span>
    </div>
    ` : ''}
  </div>

  <div class="footer">
    <p><strong>TERIMA KASIH</strong></p>
    <p>Membership Anda telah diperpanjang!<br>
    Selamat menikmati layanan kami.</p>
    <p style="margin-top: 10px; font-size: 9px;">
      Simpan struk ini sebagai bukti<br>
      perpanjangan membership
    </p>
  </div>
</body>
</html>
`;

const generateTransactionReceipt = (data) => {
    // POS transaction receipt - will be used from POSPage
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Receipt - Transaction</title>
  <style>
    @media print {
      @page { margin: 0; }
      body { margin: 1cm; }
    }
    body {
      font-family: 'Courier New', monospace;
      width: 80mm;
      margin: 0 auto;
      padding: 10px;
      font-size: 12px;
    }
    .header {
      text-align: center;
      border-bottom: 2px dashed #000;
      padding-bottom: 10px;
      margin-bottom: 10px;
    }
    .logo {
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .company-info {
      font-size: 10px;
      line-height: 1.4;
    }
    .title {
      text-align: center;
      font-weight: bold;
      font-size: 14px;
      margin: 10px 0;
    }
    .row {
      display: flex;
      justify-content: space-between;
      margin: 5px 0;
    }
    .item {
      margin: 8px 0;
    }
    .item-name {
      font-weight: bold;
    }
    .row-label {
      font-weight: bold;
    }
    .divider {
      border-top: 1px dashed #000;
      margin: 10px 0;
    }
    .total-section {
      border-top: 2px solid #000;
      border-bottom: 2px solid #000;
      padding: 10px 0;
      margin: 10px 0;
    }
    .total {
      font-size: 16px;
      font-weight: bold;
    }
    .footer {
      text-align: center;
      margin-top: 20px;
      font-size: 10px;
      border-top: 2px dashed #000;
      padding-top: 10px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">OTOPIA CAR WASH</div>
    <div class="company-info">
      by PPM Autoworks<br>
      ${data.outlet_address || 'Jl. Sudirman No. 123, Jakarta'}<br>
      Telp: ${data.outlet_phone || '021-12345678'}
    </div>
  </div>

  <div class="title">STRUK PEMBAYARAN</div>

  <div class="row">
    <span>Invoice:</span>
    <span>${data.invoice_number}</span>
  </div>
  <div class="row">
    <span>Tanggal:</span>
    <span>${new Date(data.created_at || new Date()).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })}</span>
  </div>
  <div class="row">
    <span>Kasir:</span>
    <span>${data.kasir_name}</span>
  </div>

  <div class="divider"></div>

  ${data.customer_name ? `
  <div class="row">
    <span>Customer:</span>
    <span>${data.customer_name}</span>
  </div>
  <div class="divider"></div>
  ` : ''}

  ${(data.items || []).map(item => `
    <div class="item">
      <div class="item-name">${item.service_name || item.product_name}</div>
      <div class="row">
        <span>${item.quantity}x @ Rp ${item.price.toLocaleString('id-ID')}</span>
        <span>Rp ${item.subtotal.toLocaleString('id-ID')}</span>
      </div>
    </div>
  `).join('')}

  <div class="divider"></div>

  <div class="row">
    <span>Subtotal:</span>
    <span>Rp ${data.subtotal.toLocaleString('id-ID')}</span>
  </div>

  ${data.discount > 0 ? `
  <div class="row">
    <span>Diskon:</span>
    <span>- Rp ${data.discount.toLocaleString('id-ID')}</span>
  </div>
  ` : ''}

  <div class="row">
    <span>Pajak (11%):</span>
    <span>Rp ${data.tax.toLocaleString('id-ID')}</span>
  </div>

  <div class="total-section">
    <div class="row total">
      <span>TOTAL:</span>
      <span>Rp ${data.total.toLocaleString('id-ID')}</span>
    </div>
    <div class="row">
      <span>Metode Bayar:</span>
      <span>${data.payment_method === 'cash' ? 'Tunai' :
            data.payment_method === 'card' ? 'Debit/Credit' :
                data.payment_method === 'qr' ? 'QRIS' :
                    'Subscription'
        }</span>
    </div>
    ${data.payment_method === 'cash' ? `
    <div class="row">
      <span>Bayar:</span>
      <span>Rp ${data.amount_paid.toLocaleString('id-ID')}</span>
    </div>
    <div class="row">
      <span>Kembali:</span>
      <span>Rp ${data.change.toLocaleString('id-ID')}</span>
    </div>
    ` : ''}
  </div>

  <div class="footer">
    <p><strong>TERIMA KASIH</strong></p>
    <p>Atas kepercayaan Anda<br>
    menggunakan layanan kami</p>
    <p style="margin-top: 10px; font-size: 9px;">
      Barang yang sudah dibeli<br>
      tidak dapat dikembalikan
    </p>
  </div>
</body>
</html>
`;
};
