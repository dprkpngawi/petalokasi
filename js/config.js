/* =====================================================================
   PENGATURAN APLIKASI (diisi admin)
   ---------------------------------------------------------------------
   driveUploadUrl : URL Web App Google Apps Script (lihat apps-script/Code.gs
                    dan README bagian "Simpan otomatis ke Google Drive").
                    Contoh: 'https://script.google.com/macros/s/AKfycb..../exec'
                    Biarkan kosong '' bila belum dipakai.
   driveFolderUrl : tautan folder Drive tujuan (hanya untuk tombol "Buka folder").
   Catatan keamanan: file ini publik (bisa dilihat siapa pun). JANGAN taruh PIN,
   password, atau kunci API di sini. PIN hanya disimpan di Apps Script.
   ===================================================================== */
window.PETA_CONFIG = Object.freeze({
  driveUploadUrl: 'https://script.google.com/macros/s/AKfycbyHjeFI4btZkgaX6GM5cM_ERPLb5TPtAAbCfYj9wRZFUXxaBevlwahFciNuu_FxdcMp/exec',
  driveFolderUrl: 'https://drive.google.com/drive/folders/1p5t_D-r2YOCYQfmiblRFEaYZQ3XqGKaW'
});
