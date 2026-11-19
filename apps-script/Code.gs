/* =====================================================================
   Google Apps Script – penerima ekspor "Peta Lokasi DPRKP Kabupaten Ngawi"
   Menyimpan file PNG / JPG / PDF dari aplikasi ke folder Google Drive dinas.

   KEAMANAN
   - Folder tujuan ditetapkan DI SINI (server), tidak bisa diubah dari browser.
   - Unggahan hanya diterima bila PIN cocok dengan Script Property UPLOAD_PIN
     (PIN tidak pernah ditulis di kode aplikasi web yang publik).
   - Hanya menerima PNG, JPEG, PDF (dicek dari isi file, bukan hanya nama).
   - Batas ukuran 45 MB per file dan maks. 60 unggahan / 10 menit.
   - Salah PIN 10× dalam 10 menit → upload dikunci sementara.
   - Script ini hanya bisa MEMBUAT file baru; tidak bisa membaca/menghapus file lain.

   CARA PASANG (sekali saja) – lihat juga README.md
   1. Buka https://script.google.com → New project → tempel isi file ini.
   2. Project Settings (ikon ⚙) → Script Properties → Add property:
        UPLOAD_PIN = (PIN rahasia, mis. 6–8 digit)
   3. Deploy → New deployment → Type: Web app
        Execute as: Me   |   Who has access: Anyone
      → Authorize → salin "Web app URL" (…/exec).
   4. Tempel URL itu ke js/config.js → driveUploadUrl.
   ===================================================================== */

const FOLDER_ID = '1p5t_D-r2YOCYQfmiblRFEaYZQ3XqGKaW';
const MAX_BYTES = 45 * 1024 * 1024;
const ALLOWED = { 'image/png': 'png', 'image/jpeg': 'jpg', 'application/pdf': 'pdf' };

function doPost(e) {
  const cache = CacheService.getScriptCache();
  try {
    if (Number(cache.get('badpin') || 0) >= 10) return out_({ ok: false, error: 'Terlalu banyak PIN salah. Coba lagi 10 menit lagi.' });
    if (!e || !e.postData || !e.postData.contents) return out_({ ok: false, error: 'Data kosong' });
    if (e.postData.contents.length > MAX_BYTES * 1.4) return out_({ ok: false, error: 'File terlalu besar' });

    const body = JSON.parse(e.postData.contents);
    const pin = PropertiesService.getScriptProperties().getProperty('UPLOAD_PIN');
    if (!pin) return out_({ ok: false, error: 'PIN belum diatur (Script Properties → UPLOAD_PIN)' });
    if (!safeEqual_(String(body.pin || ''), pin)) {
      cache.put('badpin', String(Number(cache.get('badpin') || 0) + 1), 600);
      Utilities.sleep(1500);
      return out_({ ok: false, error: 'PIN salah' });
    }

    const n = Number(cache.get('count') || 0);
    if (n >= 60) return out_({ ok: false, error: 'Batas unggahan tercapai, coba lagi beberapa menit lagi' });
    cache.put('count', String(n + 1), 600);

    const mime = String(body.mime || '');
    if (!ALLOWED[mime]) return out_({ ok: false, error: 'Jenis file tidak diizinkan' });
    const bytes = Utilities.base64Decode(String(body.data || ''));
    if (!bytes.length || bytes.length > MAX_BYTES) return out_({ ok: false, error: 'Ukuran file tidak valid' });
    if (!magicOk_(bytes, mime)) return out_({ ok: false, error: 'Isi file tidak sesuai jenisnya' });

    let name = String(body.name || 'Peta Lokasi').replace(/[^\w\s\-().,]/g, '').replace(/\s+/g, ' ').trim().slice(0, 120) || 'Peta Lokasi';
    const ts = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd_HHmmss');
    const file = DriveApp.getFolderById(FOLDER_ID).createFile(Utilities.newBlob(bytes, mime, name + '_' + ts + '.' + ALLOWED[mime]));
    file.setDescription('Diekspor dari aplikasi Peta Lokasi DPRKP Kabupaten Ngawi pada ' + ts);
    return out_({ ok: true, name: file.getName() });
  } catch (err) {
    return out_({ ok: false, error: 'Gagal menyimpan: ' + err.message });
  }
}

function doGet() { return out_({ ok: true, app: 'peta-lokasi-upload' }); }

function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

function safeEqual_(a, b) {          // perbandingan waktu-konstan
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

function magicOk_(b, mime) {
  const u = i => b[i] & 255;
  if (mime === 'image/png') return u(0) === 0x89 && u(1) === 0x50 && u(2) === 0x4E && u(3) === 0x47;
  if (mime === 'image/jpeg') return u(0) === 0xFF && u(1) === 0xD8 && u(2) === 0xFF;
  if (mime === 'application/pdf') return u(0) === 0x25 && u(1) === 0x50 && u(2) === 0x44 && u(3) === 0x46;
  return false;
}
