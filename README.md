# Peta Lokasi – DPRKP Kabupaten Ngawi

Untuk **peta lokasi apa pun**: perumahan, PSU, RTLH, kegiatan, aset, fasilitas umum, dan lain-lain. Atur di kolom *Tema / jenis lokasi peta*.

Aplikasi web statis untuk membuat **layout peta lokasi** (perumahan, PSU, RTLH, dll.) ukuran **F4 landscape/portrait** dengan citra satelit, lalu dicetak ke **PDF**. Berjalan penuh di browser, sehingga bisa di-hosting gratis di **GitHub Pages** tanpa server.

## Fitur

- Kertas **F4** (215 × 330 mm), juga A4 dan A3, **landscape atau portrait**
- **Kualitas citra otomatis HD/4K**: aplikasi mengecek level detail citra tertinggi yang tersedia di lokasi peta, lalu memakai ubin 2–4× lebih detail agar hasil cetak PDF dan PNG 4K (±5000 piksel) tajam
- **Satu citra saja: Esri World Imagery 2026.** Aplikasi otomatis memilih rilis World Imagery (Wayback) paling baru di tahun 2026. Jika katalog rilis tidak terbaca, dipakai World Imagery live (versi terkini Esri). Tanggal rilis dan tanggal perekaman citra di lokasi peta ditampilkan dan dicantumkan di Sumber Data.
- **Upload KML, KMZ, SHP (.zip, atau .shp + .dbf + .prj sekaligus), GeoJSON**, dengan reproyeksi otomatis dari .prj (misalnya UTM 49S)
- **Edit geometri**: gambar poligon/garis/titik, edit vertex, geser, potong, hapus (toolbar kiri atas peta)
- Pengaturan warna isi, warna garis, transparansi, tebal garis, dan garis putus per layer
- **Pisah per atribut**: satu file KML/SHP bisa dipecah jadi beberapa layer (misalnya Lama / Pengembangan)
- **Label dengan garis penunjuk** dan **label koordinat otomatis** (X/Y desimal) yang ikut berubah saat titiknya digeser
- **Skala terkunci** (1:500 – 1:100.000), sehingga skala di kertas akurat. Scroll mouse di peta untuk ganti skala
- **Grid koordinat bergaya ArcGIS** yang ikut bergerak saat peta digeser:
  - jenis grid: garis graticule penuh, tanda silang (+), atau tick tepi saja
  - **pilih sisi label koordinat** (atas, bawah, kiri, kanan)
  - format DMS, derajat-menit, atau desimal
  - interval otomatis atau manual
  - label lintang tegak, warna dan tebal garis bisa diatur
- **Panah utara** (9 gaya: ArcGIS, sederhana, jarum kompas, lingkaran, garis, segitiga U, blok N, mata angin 4 dan 8 arah; ukuran bisa diatur)
- **Skala batang** 6 gaya (hitam-putih, dua baris, kosong bersekat, batang utuh, garis tick, bertangga), pembagian ⅛/4/5/3/2, satuan otomatis/meter/kilometer, satuan singkat, desimal koma
- **Teks skala** 6 format: 1:2,000 / 1:2.000 / Skala 1:2.000 / 1 cm = 20 m / gabungan / tanpa teks
- Sebelumnya: panah utara dan **skala batang dinamis**: panjang dan angkanya menyesuaikan skala serta lebar kotak
- **Legenda otomatis**: hanya kelas jalan/sungai yang benar-benar tampak di bingkai peta yang masuk legenda. Ukurannya mengecil atau pecah 2 kolom bila isinya banyak
- **Tambah perumahan** lewat tombol 🏘️ (di peta atau sidebar): beri nama, gambar batasnya, lalu label dan koordinat dibuat otomatis dan legenda langsung diperbarui. Tombol **✏️ Edit bentuk** dan **＋ Tambah bidang** tersedia per perumahan, dan klik poligon di peta untuk memilihnya.
- **Judul & keterangan lokasi otomatis**: nama perumahan diambil dari nama layer yang tampak di peta, dan "Desa …, Kecamatan …, Kabupaten Ngawi" dari batas desa tempat layer berada (atau titik tengah peta). Keduanya ikut berubah saat peta digeser. Mengetik manual di kotaknya mematikan mode otomatis, dan centang lagi untuk kembali otomatis.
- **Semua tersinkron dua arah**: mengedit di mana pun (label di peta, legenda, judul di lembar peta, atau sidebar) otomatis memperbarui yang lain. Mengganti nama di label lokasi mengubah nama layer, legenda, dan judul. Mengubah bentuk poligon membuat label lokasi dan koordinat ikut pindah, angka koordinatnya ikut diperbarui, dan judul, desa, legenda, serta inset menyesuaikan.
- **Format teks**: saat mengedit (klik 2×), muncul toolbar untuk **tebal**, *miring*, garis bawah, ukuran huruf, rata kiri/tengah/kanan, jenis huruf, warna, dan ↺ kembali ke bawaan. Berlaku untuk kop, judul, lokasi, sumber, inset, legenda, dan label di peta.
- Penulisan wilayah tidak disingkat: "Kecamatan", "Kabupaten".
- Upload file yang sama dua kali tidak membuat layer dobel, dan nama yang sama dalam satu grup legenda hanya tampil sekali.
- **Klik 2× teks di lembar peta** (kop, judul, lokasi, sumber, judul inset, nama di legenda, judul grup legenda) untuk mengedit langsung.
- **Klik 2× untuk edit langsung di peta**:
  - pada teks label lokasi/koordinat: ketik langsung (Enter = simpan, Shift+Enter = baris baru, Esc = batal)
  - pada label koordinat, mengganti angka X/Y lalu Enter akan memindahkan titiknya ke koordinat tersebut
  - pada poligon perumahan: masuk/keluar mode edit bentuk
- **Label lokasi & koordinat otomatis**: begitu KML/SHP di-upload, label "Lokasi …" dan label koordinat langsung muncul. Keduanya bisa dimatikan atau dinyalakan per layer (centang *Label lokasi* / *Label koordinat*). Label lokasi ikut berubah saat nama layer diganti. Fitur otomatis ini juga bisa dimatikan sepenuhnya.
- **Impor titik XY dari Excel/CSV** (.xlsx, .xls, .csv):
  - pilih sheet, kolom X dan Y, serta kolom nama titik; kolom terdeteksi otomatis
  - sistem koordinat: Geografis WGS84 (desimal, desimal berkoma "111,45", atau DMS) atau UTM 49S/48S/50S
  - ada pratinjau tabel dan pengecekan desa titik pertama
  - hasil bisa langsung dijadikan titik, garis (urut baris), atau poligon
- **Ubah tipe geometri** per layer: Titik ⇄ Garis ⇄ Poligon (titik disambung sesuai urutan; poligon/garis dipecah ke titik sudutnya lengkap dengan kolom URUT, X, Y)
- **Cari desa/kelurahan/kecamatan** di kotak 🔍 atas peta: ketik sebagian nama, pilih (↑ ↓ Enter), lalu peta langsung zoom ke wilayah tersebut, batasnya ditandai sementara, dan judul lokasi menyesuaikan.
- **Pilihan warna cepat** (palet) untuk layer lokasi, teks label, garis penunjuk, dan di toolbar format teks. Pemilih warna bebas tetap tersedia.
- **Edit jalan sementara**: tambah ruas jalan baru (pilih fungsi jalan dan nama), sembunyikan ruas, atau ubah fungsi jalan untuk peta/proyek ini saja. Data SHP asli tidak pernah diubah, dan tombol **↺ Asli** mengembalikan semuanya.
- Panel **Upload & Layer Lokasi** ada di paling atas sidebar.
- **Klik jalan, sungai, atau saluran irigasi** di peta untuk melihat keterangannya: nama ruas, fungsi jalan, panjang ruas, desa/kecamatan, koordinat, dan sumber data. Ruas yang diklik disorot, dan popup tidak ikut tercetak.
- **Ikon 🎯** di peta: kembali (zoom) ke lokasi yang di-upload atau digambar beserta labelnya
- **Ikon 📍 titik koordinat** di peta: titik bisa digeser, label ikut bergeser, dan angka X/Y berubah otomatis. Titik merahnya ikut tercetak (bisa dimatikan).
- **Peta inset** (kanan bawah, berjudul *INSET*). Mode *Mengikuti peta*: inset ikut bergeser dan zoom bersama peta utama, kotak merah menunjukkan cakupan peta, dan nama desa sekitar ditampilkan. Mode *Seluruh Kabupaten*: inset tetap menampilkan seluruh Ngawi. berisi batas desa Kabupaten Ngawi, dengan kotak penanda lokasi dan desa lokasi yang disorot
- Teks kop, judul, lokasi, sumber data, dan logo bisa diedit
- **Simpan otomatis** di browser, dan **simpan/buka file proyek (.json)**
- Unduh layer hasil edit ke **KML / GeoJSON**
- Ekspor **PDF** (gambar resolusi tinggi atau lewat Cetak untuk vektor), **PNG**, dan **JPG**, semuanya bisa otomatis tersimpan ke **Google Drive** dinas; (resolusi bisa dipilih: 96, 150, 200 (default), 300, atau 400 dpi, atau lebar piksel kustom). Citra digambar langsung dari ubin yang sudah tampil sehingga ekspor stabil.

## Standar simbol (Permen ATR/BPN No. 14 Tahun 2021)

Simbol jaringan mengikuti Lampiran VII, Tabel VII.6 (Struktur Ruang RTRW Kabupaten):

| Unsur | Warna (RGB) | Ukuran |
|---|---|---|
| Jalan Tol | inner 245,0,0 + outline hitam | inner 1,8 pt, outline 3 pt |
| Jalan Arteri Primer | inner 255,81,0 + outline hitam | inner 3 pt, outline 4 pt |
| Jalan Kolektor Primer | 255,140,0 | 3 pt |
| Jalan Kolektor Sekunder | 255,200,0 | 1,8 pt |
| Jalan Lokal Primer | 155,90,255 | 1,7 pt |
| Jalan Lokal Sekunder | 178,178,255 | 1,5 pt |
| Jalan Lingkungan Primer / Sekunder | 130,130,130 / 156,156,156 | 1 / 0,8 pt |
| Jalur Kereta Api | hitam + tick tegak | 0,8 pt, tick 5 pt |
| Jaringan Irigasi Primer | 0,76,168 + tick tegak | 1,4 pt, tick 6 pt |
| Jaringan Irigasi Sekunder | 255,0,0 + tick tegak | 1,2 pt, tick 6 pt |
| Jaringan Irigasi Tersier | 169,0,230 + tick tegak | 1 pt, tick 6 pt |
| Jaringan Pengendalian Banjir | 0,77,168 + tanda × | 1 pt |

Warna perumahan dapat dipilih dari zona perumahan standar (R-1 sampai R-5, Tabel VII.17) atau Kawasan Permukiman (Tabel VII.7). Tombol **📘 Kembalikan simbol ke standar** mengembalikan semua simbol jaringan.

## Sungai & batas administrasi

- **Sungai / Badan Air** diambil otomatis dari **OpenStreetMap** (sungai, anak sungai, kanal, dan badan air sungai di wilayah Ngawi) saat aplikasi dibuka, lalu disimpan di cache browser selama 30 hari. Data sungai resmi (misalnya RBI BIG) bisa dipakai lewat tombol **⬆ Ganti dengan data sendiri** di panel 6.
- **Batas administrasi** (kabupaten, kecamatan, desa) beserta nama desa dan kecamatan berasal dari ADMINISTRASIDESA_AR_25K. Garis batas digambar sekali per sisi (tidak dobel) dengan pola garis putus khas peta administrasi dan halo putih agar terlihat di atas citra. Nama desa tampil pada skala 1:25.000 atau lebih detail.

## Struktur folder

```
peta-lokasi/
├── index.html
├── css/style.css
├── js/app.js
├── assets/logo-ngawi.png
├── data/
│   ├── jalan.js                  ← dari Sistem_Jaringan_Transportasi.shp
│   ├── sungai.js                 ← dari Sistem_Jaringan_Sumber_Daya_Air.shp
│   ├── batas_desa.js             ← dari ADMINISTRASIDESA_AR_25K (desa Ngawi; potongan desa bernama sama dalam satu kecamatan sudah digabung, 252 → 214 desa)
│   ├── batas_kabupaten.js        ← garis batas Kabupaten Ngawi (hasil dissolve desa)
│   └── batas_admin.js            ← garis batas kab/kec/desa + titik nama (peta utama)
├── js/config.js                  ← pengaturan admin (URL Apps Script, link folder Drive)
├── apps-script/Code.gs           ← penerima upload Google Drive (dipasang di script.google.com)
└── lib/                          ← Leaflet, Geoman, shpjs, togeojson, JSZip, html-to-image
```

Semua library sudah disertakan di folder `lib/`, jadi aplikasi tidak bergantung pada CDN.

## Cara upload ke GitHub & aktifkan GitHub Pages

1. Buat repository baru di GitHub, misalnya `peta-lokasi` (Public).
2. Upload **isi** folder ini (bukan foldernya) lewat **Add file → Upload files**, lalu drag semua file dan folder. Klik **Commit changes**.
   Alternatif lewat Git:
   ```bash
   cd peta-lokasi
   git init
   git add .
   git commit -m "Aplikasi peta lokasi"
   git branch -M main
   git remote add origin https://github.com/USERNAME/peta-lokasi.git
   git push -u origin main
   ```
3. Buka **Settings → Pages**. Pada *Build and deployment*, pilih **Source: Deploy from a branch**, **Branch: main / (root)**, lalu **Save**.
4. Tunggu 1–2 menit. Aplikasi bisa diakses di `https://USERNAME.github.io/peta-lokasi/`.

> Data jalan, sungai, dan batas desa disimpan sebagai file `.js`, jadi selalu termuat, bahkan saat `index.html` dibuka langsung dengan klik dua kali.

## Cara membuat peta

1. **Kertas**: pilih F4, lalu Landscape atau Portrait.
2. **Upload** file KML/SHP lokasi. Peta otomatis zoom ke lokasi dengan skala bulat terdekat.
3. Jika satu file berisi beberapa bagian, klik **✂️ Pisah per atribut** (misalnya berdasarkan `name`).
4. Atur **nama layer** (dipakai di legenda), **warna**, dan **transparansi**.
5. Klik **🏷️ Label otomatis** untuk membuat label nama dan koordinat. Geser teks label ke posisi yang pas, dan geser **titik kuning** ke titik yang ditunjuk.
6. Atur **skala** (misalnya 1:2.500) dan geser peta sampai komposisinya pas.
7. Isi **judul, keterangan lokasi, dan sumber data** di bagian 5.
8. Klik **🖨️ Cetak / PDF**. Di jendela cetak Chrome/Edge, pilih:
   - Tujuan: **Simpan sebagai PDF**
   - Ukuran kertas: otomatis F4 (330 × 215 mm)
   - Margin: **Tidak ada**
   - **Grafik latar belakang**: dicentang
9. Simpan **file proyek (.json)** jika peta ingin diedit lagi nanti.

## Mengganti data referensi

- Untuk **jaringan jalan atau sungai**, ekspor dari QGIS ke GeoJSON (EPSG:4326, kolom kelas `NAMOBJ`). Buka file hasilnya, tambahkan `window.PETA_DATA = window.PETA_DATA || {}; window.PETA_DATA.jalan = ` di awal dan `;` di akhir, lalu simpan sebagai `data/jalan.js` (untuk sungai: `PETA_DATA.sungai`, file `data/sungai.js`). Warna per kelas diatur di `REF_DEFAULTS` dalam `js/app.js`, atau langsung dari panel 6.
- Untuk **batas inset**, ganti `data/batas_desa.js` (`PETA_DATA.desa`) dan `data/batas_kabupaten.js` (`PETA_DATA.kabupaten`) dengan cara yang sama.

Konversi SHP ke GeoJSON bisa dilakukan di QGIS: klik kanan layer → **Export → Save Features As → GeoJSON**, dengan CRS **EPSG:4326**.

## Simpan otomatis ke Google Drive

Setiap ekspor **PNG / JPG / PDF** bisa otomatis tersimpan ke folder Drive dinas:
https://drive.google.com/drive/folders/1p5t_D-r2YOCYQfmiblRFEaYZQ3XqGKaW

Aplikasi web ini statis, jadi penyimpanan ke Drive memakai **Google Apps Script** milik akun dinas sebagai perantara. File `apps-script/Code.gs` sudah disiapkan.

**Cara termudah:** di aplikasi, klik **🔗 Hubungkan Google Drive** di bawah tombol ekspor. Dialognya berisi langkah-langkah, tombol salin kode Apps Script, dan kotak untuk menempel *Web app URL*, lalu **Tes & simpan**. URL tersimpan di browser tersebut. Agar berlaku untuk semua komputer tanpa menghubungkan satu per satu, isi juga `driveUploadUrl` di `js/config.js` (langkah 5 di bawah).

1. Login dengan akun Google **pemilik folder** di atas, lalu buka https://script.google.com → **New project**.
2. Hapus isi editor, tempel seluruh isi `apps-script/Code.gs`, lalu simpan (Ctrl+S). Beri nama proyek, misalnya "Upload Peta Lokasi".
3. Klik **⚙ Project Settings** → bagian **Script Properties** → **Add script property**:
   - Property: `UPLOAD_PIN`
   - Value: PIN rahasia, misalnya 6–8 digit. Bagikan hanya ke petugas.
4. Klik **Deploy → New deployment** → ikon ⚙ → **Web app**:
   - *Execute as*: **Me**
   - *Who has access*: **Anyone**
   - Klik **Deploy** → **Authorize access** → pilih akun → *Advanced* → *Go to … (unsafe)* → **Allow**. Peringatan ini normal untuk script buatan sendiri.
5. Salin **Web app URL** (berakhiran `/exec`), lalu tempel ke `js/config.js`:
   ```js
   driveUploadUrl: 'https://script.google.com/macros/s/AKfy..../exec',
   ```
6. Upload ulang `js/config.js` ke GitHub. Di aplikasi, centang **☁️ Simpan otomatis ke Google Drive**. Saat pertama mengekspor, petugas diminta mengisi PIN satu kali per tab browser.

Nama file di Drive: `JUDUL PETA_2026-11-19_101500.jpg`. Kalau PIN diganti di Script Properties, PIN lama langsung tidak berlaku. Kalau isi `Code.gs` diubah, buat **Deploy → Manage deployments → Edit → New version**.

## Keamanan

Yang sudah diterapkan di kode:

- **Tidak ada password, PIN, atau kunci API di kode publik.** PIN upload hanya tersimpan di Script Properties Apps Script, yang hanya bisa dilihat pemilik akun.
- **Folder tujuan dikunci di server** (`Code.gs`), tidak bisa diganti dari browser.
- Apps Script hanya menerima PNG/JPEG/PDF yang **dicek dari isi file**, dengan batas ukuran 45 MB, maks. 60 unggahan per 10 menit, dan penguncian otomatis setelah 10× PIN salah. Script hanya bisa membuat file baru, tidak bisa membaca atau menghapus file lain di Drive.
- **Content Security Policy**: browser hanya menjalankan skrip dari situs ini sendiri. Skrip sisipan atau skrip dari situs lain diblokir, dan koneksi keluar dibatasi ke layanan peta (Esri, OpenStreetMap/Overpass) dan Google Apps Script.
- **Anti-XSS**: semua teks dari KML/SHP/Excel/file proyek ditampilkan sebagai teks biasa (di-escape), dan file proyek (.json) divalidasi: warna, angka, huruf, dan logo diperiksa sebelum dipakai. File proyek yang sengaja dimodifikasi tidak bisa menyisipkan kode.
- Semua library disimpan di folder `lib/` (tidak memuat dari CDN pihak ketiga), sehingga tidak bisa diganti dari luar.

Yang perlu dilakukan pemilik akun GitHub:

- Aktifkan **Two-factor authentication (2FA)** di GitHub: Settings → Password and authentication. Siapa pun yang tidak punya akses akun Anda **tidak bisa mengubah** situs ini.
- Jangan menambahkan *collaborator* sembarangan (repo → Settings → Collaborators).
- Opsional: Settings → Branches → tambahkan *branch protection* untuk `main`.
- Atur berbagi folder Drive: sebaiknya **bukan** "Anyone with the link", melainkan hanya akun pegawai terkait, karena hasil peta tersimpan di sana.

> Catatan jujur: kode situs web statis memang selalu bisa *dilihat* siapa pun (browser harus mengunduhnya untuk menjalankannya). Yang dilindungi adalah **tidak bisa diubah** (hanya pemilik akun GitHub), **tidak bisa disisipi kode berbahaya**, dan **tidak bisa mengunggah ke Drive tanpa PIN**.

## Catatan

- Citra satelit © Esri, Maxar, Earthstar Geographics. Cantumkan sumber citra di kotak *Sumber Data*.
- Skala dihitung pada lintang tengah peta (proyeksi Web Mercator). Untuk wilayah Ngawi selisihnya sangat kecil.
- Ekspor PNG/JPG memakai citra yang sudah tampil di layar. Tunggu sampai citra selesai dimuat sebelum ekspor.
- Batas desa inset berasal dari ADMINISTRASIDESA_AR_25K (hanya desa di Kabupaten Ngawi) dan sudah disederhanakan agar ringan.
- **Citra terbaru**: setiap kali dibuka, aplikasi membaca katalog rilis Esri World Imagery dan otomatis memakai **rilis paling baru**. Tanggal perekaman citra di titik tengah peta diambil dari layanan metadata Esri, lalu ditulis otomatis di kotak Sumber Data (bisa dimatikan).
- Tidak ada citra satelit resolusi tinggi gratis yang diperbarui setiap hari. Esri memperbarui mosaiknya bertahap, sehingga tanggal perekaman di suatu lokasi bisa beberapa bulan sampai beberapa tahun lalu.
