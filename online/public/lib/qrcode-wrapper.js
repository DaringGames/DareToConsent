// Lightweight ES module wrapper for QRCodeJS (qrcode.min.js)
let qrLoadPromise = null;

function ensureQRCode() {
  if (typeof window !== 'undefined' && window.QRCode) return Promise.resolve(window.QRCode);
  if (!qrLoadPromise) {
    qrLoadPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-lib="qrcodejs"]');
      if (existing) {
        existing.addEventListener('load', () => resolve(window.QRCode));
        existing.addEventListener('error', reject);
        if (window.QRCode) resolve(window.QRCode);
        return;
      }
      const s = document.createElement('script');
      s.src = '/lib/qrcode.min.js';
      s.async = true;
      s.defer = true;
      s.dataset.lib = 'qrcodejs';
      s.onload = () => resolve(window.QRCode);
      s.onerror = () => reject(new Error('Failed to load qrcode.min.js'));
      document.head.appendChild(s);
    });
  }
  return qrLoadPromise;
}

export async function renderQRCode(el, text, opts = {}) {
  if (!el) return null;
  const QRCode = await ensureQRCode();
  // Clear any previous render
  try { el.innerHTML = ''; } catch {}
  const size = Math.max(160, Math.min(260, opts.size || 220));
  const colorDark = opts.colorDark || '#000000';
  const colorLight = opts.colorLight || '#ffffff';
  const correctLevel = (QRCode && QRCode.CorrectLevel && QRCode.CorrectLevel.M) || 1;
  const cfg = {
    text: String(text || ''),
    width: size,
    height: size,
    colorDark,
    colorLight,
    correctLevel
  };
  const instance = new QRCode(el, cfg);
  return instance;
}

export default renderQRCode;