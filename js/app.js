/* =====================================================================
   PETA LOKASI – DPRKP Kabupaten Ngawi
   Aplikasi statis (GitHub Pages) untuk membuat layout peta lokasi
   ukuran F4 dengan citra satelit, upload KML/SHP, edit, label, legenda.
   ===================================================================== */
(function () {
'use strict';

/* ---------------------------------------------------------------
   KONSTANTA
--------------------------------------------------------------- */
const STORAGE_KEY = 'petaLokasiNgawi.v14';
const M_PER_SCREEN_PX = 0.0254 / 96;            // 1 px CSS = 1/96 inci
const EARTH_CIRC = 40075016.686;
const PX_PER_MM = 96 / 25.4;
const PAPERS = { F4: [215, 330], A4: [210, 297], A3: [297, 420] };
const SCALE_PRESETS = [500, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 7500, 10000, 15000, 20000, 25000, 50000, 100000];
const LAYER_COLORS = ['#ffbe00', '#fff005', '#ffdc00', '#fffa4b', '#f59b1e', '#ffff9b', '#eb9b3c', '#ffbe00'];
const DEFAULT_LOGO = window.LOGO_NGAWI || 'assets/logo-ngawi.png';

/* Simbolisasi sesuai Permen ATR/BPN No. 14 Tahun 2021, Lampiran VII,
   Tabel VII.6 (Struktur Ruang RTRW Kabupaten). Ukuran dalam point (pt).
   casing = outline hitam; tick = garis tegak (tinggi pt) seperti simbol irigasi/kereta api. */
const PERMEN_14_2021 = 'Permen ATR/BPN No. 14 Tahun 2021';
const REF_DEFAULTS = {
  jalan: {
    file: 'data/jalan.js', visible: true, field: 'NAMOBJ',
    classes: {
      'Jalan Tol':                           { color: '#f50000', width: 1.8, casing: '#000000', casingW: 3, visible: true },
      'Jalan Arteri Primer':                 { color: '#ff5100', width: 3,   casing: '#000000', casingW: 4, visible: true },
      'Jalan Arteri Sekunder':               { color: '#ff5100', width: 1.8, casing: '#000000', casingW: 2.8, visible: true },
      'Jalan Kolektor Primer':               { color: '#ff8c00', width: 3,   visible: true },
      'Jalan Kolektor Sekunder':             { color: '#ffc800', width: 1.8, visible: true },
      'Jalan Lokal Primer':                  { color: '#9b5aff', width: 1.7, visible: true },
      'Jalan Lokal Sekunder':                { color: '#b2b2ff', width: 1.5, visible: true },
      'Jalan Lingkungan Primer':             { color: '#828282', width: 1,   visible: true },
      'Jalan Lingkungan Sekunder':           { color: '#9c9c9c', width: 0.8, visible: true },
      'Jaringan Jalur Kereta Api Antarkota': { color: '#000000', width: 0.8, tick: 5, visible: true, label: 'Jaringan Jalur Kereta Api' }
    }
  },
  sungai: {
    file: 'OpenStreetMap (otomatis)', visible: true, field: 'KELAS',
    classes: {
      // Badan Air: warna standar 151,219,242 (Tabel VII.7 / VII.17)
      'Badan Air (Sungai)': { color: '#5aaee0', width: 0.4, fill: '#97dbf2', visible: true },
      'Sungai':             { color: '#2f9bd8', width: 1.6, visible: true },
      'Anak Sungai':        { color: '#5aaee0', width: 0.9, visible: true },
      'Kanal / Saluran':    { color: '#5aaee0', width: 0.9, dash: '5 2', visible: true }
    }
  },
  air: {
    file: 'data/sungai.js', visible: true, field: 'NAMOBJ',
    classes: {
      'Jaringan Irigasi Primer':      { color: '#004ca8', width: 1.4, tick: 6, visible: true },
      'Jaringan Irigasi Sekunder':    { color: '#ff0000', width: 1.2, tick: 6, visible: true },
      'Jaringan Irigasi Tersier':     { color: '#a900e6', width: 1,   tick: 6, visible: true },
      'Jaringan Pengendalian Banjir': { color: '#004da8', width: 1,   cross: 15, visible: true }
    }
  },
  admin: {
    file: 'data/batas_admin.js', visible: true, field: 'TIPE',
    classes: {
      'kabupaten': { label: 'Batas Kabupaten', color: '#000000', width: 2,   dash: '10 3 2 3 2 3', halo: true, visible: true },
      'kecamatan': { label: 'Batas Kecamatan', color: '#000000', width: 1.4, dash: '8 3 2 3', halo: true, visible: true },
      'desa':      { label: 'Batas Desa',      color: '#000000', width: 0.9, dash: '4 2.5', halo: true, visible: true }
    }
  }
};
/* palet warna cepat */
const PALETTE = [
  ['#ffbe00', 'Kuning tua'], ['#fff005', 'Kuning'], ['#ff8c00', 'Oranye'], ['#ff5100', 'Oranye merah'], ['#ff0000', 'Merah'],
  ['#c2185b', 'Merah marun'], ['#ff4fd8', 'Merah muda'], ['#c000ff', 'Ungu'], ['#7b1fa2', 'Ungu tua'], ['#1e88e5', 'Biru'],
  ['#00b0ff', 'Biru muda'], ['#00bfa5', 'Toska'], ['#00c853', 'Hijau'], ['#2e7d32', 'Hijau tua'], ['#8d6e63', 'Cokelat'],
  ['#000000', 'Hitam'], ['#9e9e9e', 'Abu-abu'], ['#ffffff', 'Putih']
];
function swatches(attr, current) {
  return `<div class="swatches">${PALETTE.map(([c, n]) => `<button type="button" class="sw ${current && current.toLowerCase() === c ? 'on' : ''}" ${attr}="${c}" title="${n}" style="background:${c}"></button>`).join('')}</div>`;
}
/* Warna zona perumahan standar (Tabel VII.17 RDTR & VII.7 RTRW Kabupaten) */
const STD_PERUMAHAN = [
  ['#ffbe00', 'R-1 Perumahan Kepadatan Sangat Tinggi'],
  ['#ffdc00', 'R-2 Perumahan Kepadatan Tinggi'],
  ['#fff005', 'R-3 Perumahan Kepadatan Sedang'],
  ['#fffa4b', 'R-4 Perumahan Kepadatan Rendah'],
  ['#ffff9b', 'R-5 Perumahan Kepadatan Sangat Rendah'],
  ['#f59b1e', 'Kawasan Permukiman Perkotaan'],
  ['#eb9b3c', 'Kawasan Permukiman Perdesaan']
];
const PT = 96 / 72;   // 1 point = 1,333 px

/* ---------------------------------------------------------------
   STATE
--------------------------------------------------------------- */
const DEFAULT_STATE = () => ({
  paper: 'F4', orient: 'landscape',
  basemap: 'esri', imgQuality: 'auto',
  grid: true, gridFormat: 'dms', gridStyle: 'lines', gridInterval: 'auto', gridLatVertical: true,
  gridSides: { top: true, bottom: true, left: true, right: true },
  gridColor: '#ffffff', gridWidth: 0.6,
  freeScale: false, northStyle: 'arcgis', northSize: 9,
  scaleBarStyle: 'alternating', scaleDivs: 'arcgis', scaleUnit: 'auto', scaleUnitShort: false, scaleDecComma: false, scaleTextStyle: 'en',
  insetAutoDesa: true, insetLegend: false, citraAuto: true,
  insetMode: 'kab', insetBoxFrac: 0.15, autoLabels: true, autoJudul: true, autoLokasi: true,
  tema: 'Perumahan',
  textStyle: {},
  jalanEdits: { removed: [], added: [], reclass: {} },
  scale: 5000, center: [-7.4045, 111.4460],
  texts: {
    instansi: 'DINAS PERUMAHAN RAKYAT\nDAN KAWASAN PERMUKIMAN\nKABUPATEN NGAWI',
    judul: 'PETA LOKASI PERUMAHAN\nNAMA PERUMAHAN',
    lokasi: 'Desa …\nKecamatan …, Kabupaten Ngawi',
    sumber: 'Sumber Data:\nSurvey Lapang, 2026',
    inset: 'INSET', insetSub: 'Kabupaten Ngawi', legendTitle: 'Legenda'
  },
  groupTitles: { jalan: 'Sistem Jaringan Jalan', sungai: 'Sungai / Badan Air', air: 'Sistem Jaringan Irigasi', admin: 'Batas Administrasi' },
  adminLabels: { kecamatan: true, desa: true },
  refCustom: {},
  logo: null,
  layers: [],
  labels: [],
  activeLayer: null,
  ref: JSON.parse(JSON.stringify(REF_DEFAULTS)),
  insetData: null
});

let S;                    // diisi setelah fungsi keamanan terdefinisi (lihat bawah)
const R = {               // objek runtime (tidak disimpan)
  userGroups: {},
  labelObjs: {},
  refData: {},
  refGroups: {},
  base: null, baseLabels: null,
  insetBatas: null, insetOverlay: null,
  preview: 1, previewAuto: true
};

/* ---------------------------------------------------------------
   UTIL
--------------------------------------------------------------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const uid = () => Math.random().toString(36).slice(2, 10);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtNum = n => Number(n).toLocaleString('en-US');

function toast(msg, ms = 2600) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), ms);
}
let saveTimer;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(S)); }
    catch (e) {
      // kemungkinan kuota penuh (logo/inset besar) — simpan tanpa itu
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...S, insetData: null, refCustom: {} })); } catch (_) {}
    }
  }, 400);
}
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE();
    return mergeState(JSON.parse(raw));
  } catch (e) { return DEFAULT_STATE(); }
}
/* ---------- keamanan: bersihkan data dari file proyek / penyimpanan ----------
   Semua warna, angka, huruf, dan gambar divalidasi agar file proyek yang dimodifikasi
   tidak bisa menyisipkan kode (XSS) lewat atribut style/SVG. */
const SAFE_FONTS = ['', "'Times New Roman', serif", "Calibri, 'Segoe UI', sans-serif", 'Tahoma, sans-serif', "'Bookman Old Style', serif", "'Courier New', monospace"];
const isColor = c => typeof c === 'string' && /^#[0-9a-f]{3,8}$/i.test(c);
const safeColor = (c, def) => isColor(c) ? c : def;
const safeNum = (n, def, min = -Infinity, max = Infinity) => { const v = Number(n); return isFinite(v) ? Math.min(max, Math.max(min, v)) : def; };
const safeFont = f => SAFE_FONTS.includes(f) ? f : '';
const safeStr = (t, max = 2000) => String(t ?? '').slice(0, max);
const safeDash = d => (typeof d === 'string' && /^[\d.\s,]{1,40}$/.test(d)) ? d : null;
function sanitizeState(s) {
  s.gridColor = safeColor(s.gridColor, '#ffffff');
  s.gridWidth = safeNum(s.gridWidth, 0.6, 0.1, 5);
  s.scale = safeNum(s.scale, 2500, 100, 5e6);
  s.northSize = safeNum(s.northSize, 9, 4, 30);
  s.center = Array.isArray(s.center) ? [safeNum(s.center[0], -7.4, -90, 90), safeNum(s.center[1], 111.4, -180, 180)] : [-7.4045, 111.446];
  if (s.logo && !/^data:image\/(png|jpe?g|gif|webp);base64,[a-z0-9+/=]+$/i.test(s.logo)) s.logo = null;
  for (const k in s.texts) s.texts[k] = safeStr(s.texts[k]);
  for (const k in s.groupTitles) s.groupTitles[k] = safeStr(s.groupTitles[k], 200);
  s.tema = safeStr(s.tema, 100);
  const ts = {};
  for (const k in (s.textStyle || {})) {
    if (!['instansi', 'judul', 'lokasi', 'sumber', 'inset', 'insetSub', 'legendTitle', 'legend', 'scale'].includes(k)) continue;
    const v = s.textStyle[k] || {};
    ts[k] = { b: v.b == null ? undefined : !!v.b, i: !!v.i, u: !!v.u, size: v.size ? safeNum(v.size, 10, 4, 72) : undefined,
      align: ['left', 'center', 'right'].includes(v.align) ? v.align : undefined, color: isColor(v.color) ? v.color : undefined, font: safeFont(v.font) || undefined };
  }
  s.textStyle = ts;
  s.layers = (Array.isArray(s.layers) ? s.layers : []).filter(l => l && l.data && Array.isArray(l.data.features)).map(l => ({
    ...l, id: safeStr(l.id, 40).replace(/[^\w-]/g, '') || uid(), name: safeStr(l.name, 300), group: safeStr(l.group, 200),
    color: safeColor(l.color, '#ffbe00'), stroke: isColor(l.stroke) ? l.stroke : null,
    fillOpacity: safeNum(l.fillOpacity, 0.25, 0, 1), weight: safeNum(l.weight, 2.4, 0, 20), dash: !!l.dash, visible: l.visible !== false, legend: l.legend !== false,
    kind: ['polygon', 'line', 'point'].includes(l.kind) ? l.kind : 'polygon'
  }));
  s.labels = (Array.isArray(s.labels) ? s.labels : []).filter(l => l && Array.isArray(l.anchor) && Array.isArray(l.pos)).map(l => ({
    ...l, id: safeStr(l.id, 40).replace(/[^\w-]/g, '') || uid(), type: l.type === 'coord' ? 'coord' : 'text', text: safeStr(l.text, 1000),
    anchor: [safeNum(l.anchor[0], 0, -90, 90), safeNum(l.anchor[1], 0, -180, 180)], pos: [safeNum(l.pos[0], 0, -90, 90), safeNum(l.pos[1], 0, -180, 180)],
    size: safeNum(l.size, 11, 4, 72), color: safeColor(l.color, '#000000'), halo: safeColor(l.halo, '#ffffff'), line: safeColor(l.line, '#ffe600'),
    ptColor: isColor(l.ptColor) ? l.ptColor : undefined, font: safeFont(l.font), align: ['left', 'center', 'right'].includes(l.align) ? l.align : undefined
  }));
  for (const key in s.ref) for (const c in s.ref[key].classes) {
    const k = s.ref[key].classes[c], d = (REF_DEFAULTS[key]?.classes || {})[c] || {};
    k.color = safeColor(k.color, d.color || '#000000');
    if (k.fill || d.fill) k.fill = safeColor(k.fill, d.fill || '#97dbf2');
    if (k.casing || d.casing) k.casing = safeColor(k.casing, d.casing || '#000000');
    k.width = safeNum(k.width, d.width || 1, 0.1, 20);
    k.dash = safeDash(k.dash) || d.dash || null;
    if (k.label != null) k.label = safeStr(k.label, 200);
  }
  return s;
}
function mergeState(obj) {
  const d = DEFAULT_STATE();
  const s = Object.assign(d, obj);
  s.texts = Object.assign(DEFAULT_STATE().texts, obj.texts || {});
  s.textStyle = obj.textStyle || {};
  s.jalanEdits = Object.assign({ removed: [], added: [], reclass: {} }, obj.jalanEdits || {});
  s.groupTitles = Object.assign(DEFAULT_STATE().groupTitles, obj.groupTitles || {});
  s.gridSides = Object.assign(DEFAULT_STATE().gridSides, obj.gridSides || {});
  s.adminLabels = Object.assign(DEFAULT_STATE().adminLabels, obj.adminLabels || {});
  const ref = JSON.parse(JSON.stringify(REF_DEFAULTS));
  for (const k in ref) {
    if (obj.ref && obj.ref[k]) {
      ref[k].visible = obj.ref[k].visible;
      for (const c in ref[k].classes) Object.assign(ref[k].classes[c], (obj.ref[k].classes || {})[c] || {});
    }
  }
  s.ref = ref;
  return sanitizeState(s);
}

/* skala <-> zoom (Web Mercator, pada lintang tengah peta) */
function zoomForScale(scale, lat) {
  const mpp = scale * M_PER_SCREEN_PX;
  return Math.log2(EARTH_CIRC * Math.cos(lat * Math.PI / 180) / (256 * mpp));
}
function scaleForZoom(zoom, lat) {
  const mpp = EARTH_CIRC * Math.cos(lat * Math.PI / 180) / (256 * Math.pow(2, zoom));
  return mpp / M_PER_SCREEN_PX;
}

/* geometri */
function ringArea(r) { let a = 0; for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += (r[j][0] + r[i][0]) * (r[j][1] - r[i][1]); return a / 2; }
function ringCentroid(r) {
  let x = 0, y = 0, a = 0;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const f = r[j][0] * r[i][1] - r[i][0] * r[j][1];
    x += (r[j][0] + r[i][0]) * f; y += (r[j][1] + r[i][1]) * f; a += f;
  }
  if (Math.abs(a) < 1e-14) return r[0];
  return [x / (3 * a), y / (3 * a)];
}
function pointInRing(p, r) {
  let inside = false;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const xi = r[i][0], yi = r[i][1], xj = r[j][0], yj = r[j][1];
    if (((yi > p[1]) !== (yj > p[1])) && (p[0] < (xj - xi) * (p[1] - yi) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}
/* titik representatif [lng, lat] di dalam fitur terbesar */
function representativePoint(fc) {
  let bestPoly = null, bestArea = -1, firstLine = null, firstPt = null;
  const visit = g => {
    if (!g) return;
    if (g.type === 'Polygon') { const a = Math.abs(ringArea(g.coordinates[0])); if (a > bestArea) { bestArea = a; bestPoly = g.coordinates; } }
    else if (g.type === 'MultiPolygon') g.coordinates.forEach(c => visit({ type: 'Polygon', coordinates: c }));
    else if (g.type === 'LineString') firstLine = firstLine || g.coordinates;
    else if (g.type === 'MultiLineString') firstLine = firstLine || g.coordinates[0];
    else if (g.type === 'Point') firstPt = firstPt || g.coordinates;
    else if (g.type === 'MultiPoint') firstPt = firstPt || g.coordinates[0];
    else if (g.type === 'GeometryCollection') g.geometries.forEach(visit);
  };
  (fc.features || []).forEach(f => visit(f.geometry));
  if (bestPoly) {
    const outer = bestPoly[0];
    let c = ringCentroid(outer);
    if (pointInRing(c, outer)) return c;
    // cari titik grid di dalam poligon yang paling dekat ke centroid
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    outer.forEach(p => { minX = Math.min(minX, p[0]); maxX = Math.max(maxX, p[0]); minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]); });
    let best = outer[0], bd = Infinity;
    for (let i = 1; i < 30; i++) for (let j = 1; j < 30; j++) {
      const p = [minX + (maxX - minX) * i / 30, minY + (maxY - minY) * j / 30];
      if (pointInRing(p, outer)) { const d = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2; if (d < bd) { bd = d; best = p; } }
    }
    return best;
  }
  if (firstLine) return firstLine[Math.floor(firstLine.length / 2)];
  if (firstPt) return firstPt;
  return null;
}
function geomKind(fc) {
  const t = new Set();
  (fc.features || []).forEach(f => {
    const g = f.geometry; if (!g) return;
    if (/Polygon/.test(g.type)) t.add('polygon');
    else if (/LineString/.test(g.type)) t.add('line');
    else if (/Point/.test(g.type)) t.add('point');
    else if (g.type === 'GeometryCollection') t.add('polygon');
  });
  if (t.has('polygon')) return 'polygon';
  if (t.has('line')) return 'line';
  if (t.has('point')) return 'point';
  return 'polygon';
}

/* ---------------------------------------------------------------
   PETA UTAMA
--------------------------------------------------------------- */
S = loadState();

const map = L.map('map', {
  zoomControl: false, zoomSnap: 0, zoomDelta: 0.25,
  scrollWheelZoom: false, doubleClickZoom: false, boxZoom: false, touchZoom: false,
  maxZoom: 24, minZoom: 5, inertia: false, attributionControl: true
});
map.attributionControl.setPrefix(false);
const refPane = map.createPane('refPane');
refPane.style.zIndex = 405;              // jalan & sungai di atas poligon lokasi
refPane.style.pointerEvents = 'none';    // klik tetap tembus ke poligon (untuk edit)
const refRenderer = L.canvas({ pane: 'refPane', padding: 0.3 });

map.setView(S.center, zoomForScale(S.scale, S.center[0]), { animate: false });

/* ---- peta dasar ---- */
const ESRI_IMG = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const ESRI_ATTR = 'Citra &copy; Esri, Maxar, Earthstar Geographics';
/* Rilis citra Esri terbaru (dibaca dari katalog Wayback setiap kali aplikasi dibuka) */
const WAYBACK_CONFIG = 'https://s3-us-west-2.amazonaws.com/config.maptiles.arcgis.com/waybackconfig.json';
R.latest = null;
async function loadLatestRelease() {
  try {
    const r = await fetch(WAYBACK_CONFIG, { cache: 'no-store' });
    const cfg = await r.json();
    // satu citra saja: rilis World Imagery paling baru di tahun 2026 (atau yang lebih baru)
    const rels = Object.keys(cfg).map(k => ({ num: +k, it: cfg[k], date: ((cfg[k].itemTitle || '').match(/\d{4}-\d{2}-\d{2}/) || [''])[0] }))
      .filter(r => !isNaN(r.num) && r.date >= '2026-01-01')
      .sort((a, b) => b.date.localeCompare(a.date));
    if (!rels.length) throw new Error('rilis 2026 tidak ditemukan');
    const { num, it, date } = rels[0];
    R.latest = {
      num, date,
      url: it.itemURL.replace('{level}', '{z}').replace('{row}', '{y}').replace('{col}', '{x}'),
      meta: it.metadataLayerUrl
    };
    setBasemap();
    const tgl = new Date(date + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    $('#imagery-release').textContent = `Rilis ${tgl} (World Imagery Wayback, rilis 2026 terbaru)`;
  } catch (e) {
    console.warn('Katalog rilis citra tidak terbaca, pakai World Imagery live', e);
    $('#imagery-release').textContent = 'Katalog rilis tidak terbaca – memakai World Imagery live (versi terkini Esri).';
  }
  updateImageryInfo();
}
/* Tanggal perekaman citra di titik tengah peta (layanan metadata Esri) */
let metaTimer;
function updateImageryInfo() {
  clearTimeout(metaTimer);
  metaTimer = setTimeout(async () => {
    const st = $('#imagery-date');
    if (!S.basemap.startsWith('esri')) { st.textContent = ''; R.captureText = ''; applyCitraLine(); return; }
    const metaUrl = (R.latest && R.latest.meta) || 'https://metadata.maptiles.arcgis.com/arcgis/rest/services/World_Imagery_Metadata/MapServer';
    const c = map.getCenter(), b = map.getBounds(), sz = map.getSize();
    const q = new URLSearchParams({
      f: 'json', geometry: `${c.lng},${c.lat}`, geometryType: 'esriGeometryPoint', sr: '4326',
      layers: 'visible', tolerance: '0', returnGeometry: 'false',
      mapExtent: `${b.getWest()},${b.getSouth()},${b.getEast()},${b.getNorth()}`, imageDisplay: `${sz.x},${sz.y},96`
    });
    try {
      const r = await fetch(`${metaUrl}/identify?${q}`);
      const j = await r.json();
      const at = (j.results || []).map(x => x.attributes).find(a => a && Object.keys(a).some(k => /SRC_DATE/i.test(k)));
      if (!at) throw new Error('no metadata');
      const get = re => { const k = Object.keys(at).find(k => re.test(k)); return k ? at[k] : null; };
      let d = get(/^SRC_DATE2$/i) ?? get(/SRC_DATE/i);
      let dt = null;
      if (typeof d === 'number' && d > 1e10) dt = new Date(d);
      else if (d) { const s = String(d); dt = s.length === 8 ? new Date(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8)) : new Date(s); }
      const src = get(/SRC_DESC|NICE_DESC/i) || '';
      const res = get(/SAMP_RES/i);
      const tgl = dt && !isNaN(dt) ? dt.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : String(d);
      R.captureText = `Citra Satelit: Esri World Imagery${R.latest ? ' ' + R.latest.date.slice(0, 4) : ''}${src ? ' (' + src + ')' : ''}, perekaman ${tgl}`;
      st.innerHTML = `📅 Tanggal perekaman citra di tengah peta: <b>${esc(tgl)}</b>${src ? ' · ' + esc(src) : ''}${res ? ' · resolusi ' + (+res).toLocaleString('id-ID') + ' m' : ''}`;
    } catch (e) {
      R.captureText = R.latest ? `Citra Satelit: Esri World Imagery 2026 (rilis ${R.latest.date})` : 'Citra Satelit: Esri World Imagery';
      st.textContent = '';
    }
    applyCitraLine();
  }, 600);
}
function applyCitraLine() {
  const el = $('#out-citra');
  el.textContent = S.citraAuto ? (R.captureText || '') : '';
}

function detailFactor() {
  if (S.imgQuality !== 'auto') return Number(S.imgQuality) || 1;
  const d = Math.round((R.availZ || 18) - map.getZoom());
  return Math.pow(2, Math.max(0, Math.min(2, d)));
}
/* cek level zoom citra Esri tertinggi yang tersedia di tengah peta (tilemap) */
let probeTimer;
function probeImagery() {
  clearTimeout(probeTimer);
  probeTimer = setTimeout(async () => {
    if (!S.basemap.startsWith('esri')) return;
    const c = map.getCenter();
    const tile = z => {
      const n = Math.pow(2, z), lr = c.lat * Math.PI / 180;
      return [Math.floor((1 - Math.log(Math.tan(lr) + 1 / Math.cos(lr)) / Math.PI) / 2 * n), Math.floor((c.lng + 180) / 360 * n)];
    };
    let found = 18;
    for (const z of [21, 20, 19]) {
      try {
        const [y, x] = tile(z);
        const r = await fetch(`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tilemap/${z}/${y}/${x}/1/1`);
        const j = await r.json();
        if (j && j.data && j.data[0] === 1) { found = z; break; }
      } catch (e) { break; }
    }
    if (found !== R.availZ) { R.availZ = found; setBasemap(); }
    else if (detailFactor() !== R.curF) setBasemap();
    const mpp = (EARTH_CIRC * Math.cos(c.lat * Math.PI / 180) / (256 * Math.pow(2, found))).toFixed(2);
    $('#imagery-quality').textContent = `Detail citra tertinggi di lokasi ini: level ${found} (±${mpp.replace('.', ',')} m/piksel) · dipakai detail ${R.curF}×`;
  }, 500);
}
function setBasemap() {
  if (R.base) map.removeLayer(R.base);
  if (R.baseLabels) map.removeLayer(R.baseLabels);
  R.base = R.baseLabels = null;
  /* Kualitas citra: detail 1× / 2× / 4× = memakai ubin 1 atau 2 level zoom lebih tinggi
     sehingga tiap piksel layar/cetak berisi 2–4× lebih banyak detail citra (setara cetak HD/4K).
     Level tertinggi dibatasi pada level yang benar-benar tersedia di lokasi (R.availZ). */
  const f = detailFactor();
  R.curF = f;
  const lf = Math.log2(f);
  const opt = { maxZoom: 24, crossOrigin: 'anonymous', tileSize: 256 / f, zoomOffset: lf, keepBuffer: 4 };
  const top = R.availZ || 18;
  const nz = n => Math.max(1, (n === 18 ? top : n) - lf);
  // satu citra: Esri World Imagery rilis 2026 terbaru (Wayback); cadangan: World Imagery live
  R.base = L.tileLayer(R.latest ? R.latest.url : ESRI_IMG, { ...opt, maxNativeZoom: nz(18),
    attribution: ESRI_ATTR + (R.latest ? ` · rilis ${R.latest.date}` : '') });
  if (R.base) {
    let ok = 0, err = 0;
    const st = $('#imagery-status');
    st.textContent = '';
    R.base.on('tileload', () => { ok++; });
    R.base.on('tileerror', () => {
      err++;
      if (err === 5 && ok === 0) {
        st.textContent = '⚠️ Citra gagal dimuat. Periksa koneksi internet, atau coba pilihan citra lain.';
        toast('Citra satelit gagal dimuat. Periksa koneksi / ganti sumber citra.', 5000);
      }
    });
    R.base.on('load', () => {
      if (!ok) return;
      st.textContent = '✔ Citra satelit termuat.';
    });
    R.base.addTo(map);
  }
  if (R.baseLabels) R.baseLabels.addTo(map);
}

/* ---- skala ---- */
function setScale(scale, center) {
  scale = Math.max(100, Math.round(Number(scale) || 2500));
  S.scale = scale;
  const c = center || map.getCenter();
  map.setView(c, zoomForScale(scale, c.lat ?? c[0]), { animate: false });
  $('#scale-input').value = scale;
  updateScaleUI();
  save();
}
function roundScale(s) {
  const step = s < 2000 ? 10 : s < 10000 ? 50 : s < 50000 ? 100 : 500;
  return Math.max(100, Math.round(s / step) * step);
}
function stepScale(dir) {
  const s = S.scale;
  let next;
  if (dir > 0) next = SCALE_PRESETS.find(p => p > s) || s * 2;
  else next = [...SCALE_PRESETS].reverse().find(p => p < s) || Math.max(100, Math.round(s / 2));
  setScale(next);
}
function updateScaleUI() {
  $('#out-scale').textContent = scaleText();
  $('#out-scale').hidden = S.scaleTextStyle === 'none';
  const zs = document.querySelector('.zt-scale'); if (zs) zs.textContent = '1:' + fmtNum(S.scale);
  $$('#scale-presets button').forEach(b => b.classList.toggle('on', Number(b.dataset.v) === S.scale));
  drawScaleBar();
}
function niceLengthFloor(x) {
  const p = Math.pow(10, Math.floor(Math.log10(x)));
  const c = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].map(v => v * p).filter(v => v <= x);
  return c.length ? c[c.length - 1] : p;
}
/* skala batang: panjang menyesuaikan lebar kotak & skala peta */
/* ---------- skala batang: banyak gaya ---------- */
const SCALE_DIVS = {
  arcgis: [0, 1 / 8, 1 / 4, 1 / 2, 3 / 4, 1],
  4: [0, 1 / 4, 1 / 2, 3 / 4, 1],
  5: [0, 0.2, 0.4, 0.6, 0.8, 1],
  2: [0, 1 / 2, 1],
  3: [0, 1 / 3, 2 / 3, 1]
};
function drawScaleBar() {
  const svg = $('#scalebar');
  const style = S.scaleBarStyle || 'alternating';
  if (style === 'none') { svg.setAttribute('width', 0); svg.setAttribute('height', 0); svg.innerHTML = ''; return; }
  const box = $('.box-skala');
  const boxMm = (box.clientWidth || 260) / PX_PER_MM;
  const targetMm = Math.max(18, Math.min(S.orient === 'landscape' ? 46 : 36, boxMm - 18));
  const fr0 = SCALE_DIVS[S.scaleDivs] || SCALE_DIVS.arcgis;
  // panjang total "bulat" yang semua angka pembaginya rapi (maks. 1 desimal)
  const target = targetMm / 1000 * S.scale;
  const cands = [];
  for (let e = -1; e <= 6; e++) [1, 1.2, 1.5, 2, 2.4, 2.5, 3, 4, 5, 6, 8].forEach(m => cands.push(+(m * Math.pow(10, e)).toFixed(6)));
  const kmMode = S.scaleUnit === 'km' || (S.scaleUnit !== 'm' && target >= 2000);
  const tidy = (t, dec) => fr0.every(f => { const v = t * f / (kmMode ? 1000 : 1) * Math.pow(10, dec); return Math.abs(v - Math.round(v)) < 1e-6; });
  const ok = cands.filter(c => c <= target).sort((a, b) => b - a);
  // utamakan angka bulat (tanpa desimal) selama panjangnya masih ≥ 60% ruang
  const total = ok.find(c => c >= target * 0.6 && tidy(c, 0)) || ok.find(c => tidy(c, 1)) || niceLengthFloor(target);
  const useKm = kmMode;
  const unit = useKm ? (S.scaleUnitShort ? 'km' : 'Kilometer') : (S.scaleUnitShort ? 'm' : 'Meter');
  const div = useKm ? 1000 : 1;
  const barMm = total / S.scale * 1000;
  const W = barMm * PX_PER_MM, H = 1.4 * PX_PER_MM;
  const fr = SCALE_DIVS[S.scaleDivs] || SCALE_DIVS.arcgis;
  const padL = 6, padR = 30, top = 5;
  const fmt = v => String(+v.toFixed(2)).replace('.', S.scaleDecComma ? ',' : '.');
  const x = f => padL + f * W;
  let g = '';
  const rect = (x0, x1, y, h, fill) => `<rect x="${x0}" y="${y}" width="${x1 - x0}" height="${h}" fill="${fill}" stroke="#000" stroke-width="0.7"/>`;
  const line = (x1, y1, x2, y2, w = 0.8) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#000" stroke-width="${w}"/>`;
  switch (style) {
    case 'double':      // dua baris hitam-putih bersilang
      for (let i = 0; i < fr.length - 1; i++) {
        g += rect(x(fr[i]), x(fr[i + 1]), top, H / 2, i % 2 ? '#fff' : '#000');
        g += rect(x(fr[i]), x(fr[i + 1]), top + H / 2, H / 2, i % 2 ? '#000' : '#fff');
      }
      break;
    case 'hollow':      // batang kosong bersekat
      g += rect(x(0), x(1), top, H, '#fff');
      fr.slice(1, -1).forEach(f => { g += line(x(f), top, x(f), top + H, 0.7); });
      break;
    case 'single':      // satu batang hitam utuh dengan tanda
      g += rect(x(0), x(1), top, H, '#000');
      fr.forEach(f => { g += line(x(f), top - 2, x(f), top, 0.7); });
      break;
    case 'line':        // garis dengan tick
      g += line(x(0), top + H, x(1), top + H, 1);
      fr.forEach((f, i) => { const big = i === 0 || i === fr.length - 1 || f === 0.5; g += line(x(f), top + H - (big ? H + 2 : H * 0.6), x(f), top + H, 0.9); });
      break;
    case 'stepped':     // garis bertangga (naik-turun)
      for (let i = 0; i < fr.length - 1; i++) {
        const y = i % 2 ? top + H : top;
        g += line(x(fr[i]), y, x(fr[i + 1]), y, 1.3);
        g += line(x(fr[i + 1]), top, x(fr[i + 1]), top + H, 0.8);
      }
      g += line(x(0), top, x(0), top + H, 0.8);
      break;
    default:            // 'alternating' – hitam/putih bergantian
      for (let i = 0; i < fr.length - 1; i++) g += rect(x(fr[i]), x(fr[i + 1]), top, H, i % 2 ? '#fff' : '#000');
  }
  const labelY = top + H + 8.5;
  fr.forEach(f => {
    if (fr.length > 5 && f === 1 / 8 && W / 8 < 20) return;   // angka ⅛ dilewati bila terlalu rapat
    g += `<text x="${x(f)}" y="${labelY}" font-size="7" text-anchor="middle" font-family="Arial">${fmt(total * f / div)}</text>`;
  });
  g += `<text x="${x(1) + 3}" y="${top + 1}" font-size="7" font-family="Arial" dominant-baseline="middle">${unit}</text>`;
  svg.setAttribute('width', padL + W + padR);
  svg.setAttribute('height', top + H + 11);
  svg.innerHTML = g;
}
/* teks skala: beberapa format */
function scaleText() {
  const n = S.scale;
  const en = n.toLocaleString('en-US'), id = n.toLocaleString('id-ID');
  const cm = n / 100;                                   // 1 cm di kertas = … meter
  const cmTxt = cm >= 1000 ? `1 cm = ${(+(cm / 1000).toFixed(2)).toLocaleString('id-ID')} km` : `1 cm = ${(+cm.toFixed(2)).toLocaleString('id-ID')} m`;
  switch (S.scaleTextStyle) {
    case 'id': return `1:${id}`;
    case 'skala': return `Skala 1:${id}`;
    case 'skala-en': return `Skala 1:${en}`;
    case 'cm': return cmTxt;
    case 'both': return `1:${id}\n(${cmTxt})`;
    case 'none': return '';
    default: return `1:${en}`;
  }
}
/* panah utara (Web Mercator: utara selalu ke atas peta) */
const NORTH_SVG = {
  arcgis: `<svg viewBox="0 0 40 64"><text x="20" y="12" text-anchor="middle" font-size="12" font-weight="bold" font-family="Arial">N</text>
    <polygon points="20,15 31,56 20,48" fill="#000"/><polygon points="20,15 9,56 20,48" fill="#fff" stroke="#000" stroke-width="1.2" stroke-linejoin="round"/>
    <polygon points="20,15 31,56 20,48" fill="none" stroke="#000" stroke-width="1.2" stroke-linejoin="round"/></svg>`,
  simple: `<svg viewBox="0 0 40 64"><text x="20" y="12" text-anchor="middle" font-size="12" font-family="Arial">N</text>
    <polygon points="20,16 30,58 20,50 10,58" fill="#000"/></svg>`,
  triangle: `<svg viewBox="0 0 40 60"><polygon points="20,4 34,44 6,44" fill="#000"/>
    <text x="20" y="40" text-anchor="middle" font-size="14" font-weight="bold" fill="#fff" font-family="Arial">U</text></svg>`,
  circle: `<svg viewBox="0 0 50 66"><text x="25" y="11" text-anchor="middle" font-size="11" font-weight="bold" font-family="Arial">N</text>
    <circle cx="25" cy="40" r="20" fill="none" stroke="#000" stroke-width="1.4"/>
    <polygon points="25,16 32,44 25,39 18,44" fill="#000"/><polygon points="25,64 32,36 25,41 18,36" fill="#fff" stroke="#000" stroke-width="1"/></svg>`,
  needle: `<svg viewBox="0 0 30 70"><text x="15" y="11" text-anchor="middle" font-size="11" font-weight="bold" font-family="Arial">N</text>
    <polygon points="15,14 20,42 15,40 10,42" fill="#000"/><polygon points="15,68 20,42 15,44 10,42" fill="#fff" stroke="#000" stroke-width="1"/></svg>`,
  line: `<svg viewBox="0 0 30 64"><text x="15" y="12" text-anchor="middle" font-size="12" font-family="Arial">N</text>
    <line x1="15" y1="18" x2="15" y2="62" stroke="#000" stroke-width="1.6"/><polyline points="7,30 15,17 23,30" fill="none" stroke="#000" stroke-width="1.6" stroke-linejoin="round"/></svg>`,
  star: `<svg viewBox="0 0 60 70"><text x="30" y="11" text-anchor="middle" font-size="11" font-weight="bold" font-family="Arial">U</text>
    <g transform="translate(30,42)" stroke="#000" stroke-width="0.9" stroke-linejoin="round">
    <polygon points="0,-28 5,-5 0,0" fill="#000"/><polygon points="0,-28 -5,-5 0,0" fill="#fff"/>
    <polygon points="0,26 5,5 0,0" fill="#fff"/><polygon points="0,26 -5,5 0,0" fill="#000"/>
    <polygon points="26,0 5,-5 0,0" fill="#fff"/><polygon points="26,0 5,5 0,0" fill="#000"/>
    <polygon points="-26,0 -5,-5 0,0" fill="#000"/><polygon points="-26,0 -5,5 0,0" fill="#fff"/>
    <circle r="16" fill="none" stroke-width="0.8"/></g></svg>`,
  rose: `<svg viewBox="0 0 80 80"><g transform="translate(40,42)" stroke="#000" stroke-width="0.8" stroke-linejoin="round">
    ${[0, 90, 180, 270].map(a => `<g transform="rotate(${a})"><polygon points="0,-30 6,-6 0,0" fill="#000"/><polygon points="0,-30 -6,-6 0,0" fill="#fff"/></g>`).join('')}
    ${[45, 135, 225, 315].map(a => `<g transform="rotate(${a})"><polygon points="0,-18 4,-4 0,0" fill="#fff"/><polygon points="0,-18 -4,-4 0,0" fill="#000"/></g>`).join('')}
    <circle r="22" fill="none" stroke-width="0.6"/></g>
    <g font-family="Arial" font-size="9" font-weight="bold" text-anchor="middle"><text x="40" y="9">U</text><text x="40" y="80">S</text><text x="76" y="45">T</text><text x="4" y="45">B</text></g></svg>`,
  arrowN: `<svg viewBox="0 0 40 60"><polygon points="20,2 36,26 26,26 26,58 14,58 14,26 4,26" fill="#000"/>
    <text x="20" y="50" text-anchor="middle" font-size="13" font-weight="bold" fill="#fff" font-family="Arial">N</text></svg>`
};
function drawNorth() {
  const el = $('#north');
  el.innerHTML = NORTH_SVG[S.northStyle] || NORTH_SVG.arcgis;
  const svg = el.querySelector('svg');
  // tinggi panah menyesuaikan ukuran pilihan & orientasi kertas
  const h = S.northSize * (S.orient === 'portrait' ? 0.9 : 1);
  svg.style.height = h + 'mm';
  svg.style.width = 'auto';
}

/* ---------------------------------------------------------------
   LAYER REFERENSI (jalan, irigasi)
--------------------------------------------------------------- */
async function loadRefData() {
  for (const key of Object.keys(REF_DEFAULTS)) {
    try {
      // data jalan & sungai Ngawi disertakan sebagai file .js agar selalu termuat (juga saat dibuka tanpa server)
      if (key === 'sungai') { loadSungai(); continue; }
      const src = { jalan: 'jalan', air: 'sungai', admin: 'admin' }[key];
      R.refData[key] = key === 'jalan' ? composeJalan() : (S.refCustom && S.refCustom[key]) || (window.PETA_DATA || {})[src];
      if (!R.refData[key]) throw new Error('data ' + key + ' tidak ditemukan');
      // tambahkan kelas yang belum dikenal
      const field = S.ref[key].field;
      R.refData[key].features.forEach(f => {
        const c = f.properties[field];
        if (c && !S.ref[key].classes[c]) S.ref[key].classes[c] = { color: '#ffffff', width: 1.5, visible: true };
      });
      renderRef(key);
    } catch (e) {
      console.warn('Gagal memuat', key, e);
      toast('Data ' + key + ' tidak ditemukan di folder data/.', 5000);
    }
  }
  renderRefList();
  updateLegend();
}
/* ---------- edit jalan SEMENTARA (data SHP asli tidak diubah) ----------
   S.jalanEdits.removed = id ruas asli yang disembunyikan
   S.jalanEdits.added   = ruas tambahan (GeoJSON) untuk peta ini saja
   S.jalanEdits.reclass = { id: fungsi jalan baru } untuk ruas asli */
function composeJalan() {
  const base = (window.PETA_DATA || {}).jalan; if (!base) return null;
  const E = S.jalanEdits, rm = new Set(E.removed.map(String));
  const feats = base.features.map((f, i) => ({ type: 'Feature', geometry: f.geometry,
    properties: { ...f.properties, _id: String(i), NAMOBJ: E.reclass[i] || f.properties.NAMOBJ, _orig: f.properties.NAMOBJ } }))
    .filter(f => !rm.has(f.properties._id));
  return { type: 'FeatureCollection', features: feats.concat(E.added) };
}
function rebuildJalan() {
  R.refData.jalan = composeJalan();
  renderRef('jalan'); updateLegend(); renderRefList(); save();
}
function roadEditStatus() {
  const E = S.jalanEdits;
  const n = E.removed.length + E.added.length + Object.keys(E.reclass).length;
  return n ? `✏️ Perubahan sementara: ${E.removed.length} ruas disembunyikan, ${E.added.length} ruas ditambah, ${Object.keys(E.reclass).length} fungsi diubah. Data SHP asli tetap utuh.`
           : 'Jalan sesuai data SHP asli.';
}
function startDrawRoad() {
  const cls = $('#road-cls')?.value || 'Jalan Lokal Sekunder';
  const name = $('#road-name')?.value.trim() || '';
  R.drawingRoad = { cls, name };
  map.pm.enableDraw('Line', { snappable: true });
  toast(`Gambar ${cls} baru: klik titik-titik di peta, klik titik terakhir sekali lagi untuk selesai.`, 5000);
}
document.addEventListener('click', e => {
  const b = e.target.closest('.rp-act'); if (!b) return;
  const E = S.jalanEdits, id = b.dataset.id;
  if (b.dataset.act === 'hide') { if (id.startsWith('a')) E.added = E.added.filter(f => f.properties._id !== id); else E.removed.push(id); toast('Ruas jalan disembunyikan (sementara).'); }
  map.closePopup(); rebuildJalan();
});
document.addEventListener('change', e => {
  const sel = e.target.closest('.rp-reclass'); if (!sel) return;
  const E = S.jalanEdits, id = sel.dataset.id;
  if (id.startsWith('a')) { const f = E.added.find(f => f.properties._id === id); if (f) f.properties.NAMOBJ = sel.value; }
  else if (sel.value === sel.dataset.orig) delete E.reclass[id]; else E.reclass[id] = sel.value;
  map.closePopup(); rebuildJalan(); toast('Fungsi jalan diubah (sementara).');
});

function refCls(key, cls) { return S.ref[key].classes[cls] || { color: '#ffffff', width: 1 }; }
/* gambar jaringan dalam beberapa lapis: outline (casing) → garis utama → tick tegak */
function renderRef(key) {
  if (R.refGroups[key]) { map.removeLayer(R.refGroups[key]); R.refGroups[key] = null; }
  const data = R.refData[key]; if (!data) return;
  const cfg = S.ref[key];
  if (!cfg.visible) return;
  const field = cfg.field;
  const vis = f => (cfg.classes[f.properties[field]] || {}).visible !== false;
  const lineFeat = f => f.geometry && !/Point/.test(f.geometry.type);
  const sorted = { ...data, features: data.features.filter(f => lineFeat(f) && vis(f)).sort((a, b) => (refCls(key, a.properties[field]).width) - (refCls(key, b.properties[field]).width)) };
  const base = { pane: 'refPane', renderer: refRenderer, interactive: false, pmIgnore: true };
  const has = p => ({ ...sorted, features: sorted.features.filter(f => p(refCls(key, f.properties[field]))) });
  const ptDash = d => d ? d.split(/[ ,]+/).map(v => (Number(v) * PT).toFixed(1)).join(' ') : null;
  const casing = L.geoJSON(has(c => c.casing || c.halo), { ...base, style: f => {
    const c = refCls(key, f.properties[field]);
    return c.halo ? { color: '#ffffff', weight: (c.width + 1.6) * PT, opacity: 0.55, lineCap: 'round', lineJoin: 'round', fill: false }
                  : { color: c.casing, weight: c.casingW * PT, lineCap: 'butt', lineJoin: 'round', opacity: 1 };
  } });
  const main = L.geoJSON(sorted, { ...base, style: f => {
    const c = refCls(key, f.properties[field]);
    return { color: c.color, weight: Math.max(0.5, c.width * PT), lineCap: c.casing || c.dash ? 'butt' : 'round', lineJoin: 'round', opacity: 1,
      dashArray: ptDash(c.dash), fill: !!c.fill, fillColor: c.fill, fillOpacity: c.fill ? 0.9 : 0 };
  } });
  const ticks = L.geoJSON(has(c => c.tick), { ...base, style: f => { const c = refCls(key, f.properties[field]); return { color: c.color, weight: c.tick * PT, dashArray: '1 8', lineCap: 'butt', lineJoin: 'miter', opacity: 1 }; } });
  // tanda silang (×) di ujung jaringan pengendalian banjir
  const crosses = L.layerGroup();
  sorted.features.forEach(f => {
    const c = refCls(key, f.properties[field]); if (!c.cross) return;
    const g = f.geometry; const lines = g.type === 'LineString' ? [g.coordinates] : g.type === 'MultiLineString' ? g.coordinates : [];
    lines.forEach(ln => [ln[0], ln[ln.length - 1]].forEach(pt => L.marker([pt[1], pt[0]], {
      pane: 'refPane', interactive: false, keyboard: false, pmIgnore: true,
      icon: L.divIcon({ className: 'ref-cross', html: `<span style="color:${c.color};font-size:${c.cross * PT}px">×</span>`, iconSize: [0, 0] })
    }).addTo(crosses)));
  });
  R.refMain = R.refMain || {};
  R.refMain[key] = main;
  const parts = [casing, main, ticks, crosses];
  if (key === 'admin') parts.push(adminLabelLayer(data));
  R.refGroups[key] = L.featureGroup(parts).addTo(map);
}
/* nama desa & kecamatan di peta utama (gaya ArcGIS: miring/halo putih) */
function adminLabelLayer(data) {
  const g = L.layerGroup();
  R.adminLabelGroup = g;
  R.adminLabelData = data.features.filter(f => f.geometry && f.geometry.type === 'Point');
  refreshAdminLabels();
  return g;
}
function refreshAdminLabels() {
  const g = R.adminLabelGroup; if (!g) return;
  g.clearLayers();
  const vb = map.getBounds().pad(0.05);
  const showDesa = S.adminLabels.desa && S.scale <= 25000 && S.ref.admin.classes.desa.visible !== false;
  const showKec = S.adminLabels.kecamatan && S.ref.admin.classes.kecamatan.visible !== false;
  (R.adminLabelData || []).forEach(f => {
    const ll = [f.geometry.coordinates[1], f.geometry.coordinates[0]];
    if (!vb.contains(ll)) return;
    const p = f.properties;
    let html = null;
    if (p.KECAMATAN_LABEL && showKec) html = `<span class="adm-kec">KECAMATAN ${esc(p.KECAMATAN_LABEL.toUpperCase())}</span>`;
    else if (p.DESA && showDesa) html = `<span class="adm-desa">Desa ${esc(p.DESA)}</span>`;
    if (html) L.marker(ll, { pane: 'refPane', interactive: false, keyboard: false, pmIgnore: true, icon: L.divIcon({ className: 'adm-lbl', html, iconSize: [0, 0] }) }).addTo(g);
  });
}

/* ---- Sungai dari OpenStreetMap (diambil otomatis di browser, disimpan di cache) ---- */
const NGAWI_BBOX = [-7.64, 111.10, -7.23, 111.69];   // S, W, N, E
const OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter', 'https://maps.mail.ru/osm/tools/overpass/api/interpreter'];
const SUNGAI_CACHE = 'peta-lokasi-sungai-v1';
function setSungaiStatus(t) { R.sungaiStatus = t; const el = $('#sungai-status'); if (el) el.textContent = t; }
async function loadSungai() {
  if (S.refCustom && S.refCustom.sungai) { R.refData.sungai = S.refCustom.sungai; renderRef('sungai'); updateLegend(); return; }
  const url = 'osm-sungai-ngawi.json';
  let data = null;
  try {
    if ('caches' in window) {
      const cache = await caches.open(SUNGAI_CACHE);
      const hit = await cache.match(url);
      if (hit) {
        const j = await hit.json();
        if (Date.now() - j.time < 30 * 864e5) data = j.data;   // segarkan tiap 30 hari
      }
    }
  } catch (e) { /* cache tidak tersedia (mis. dibuka via file://) */ }
  if (!data) {
    setSungaiStatus('⏳ Mengambil data sungai terbaru dari OpenStreetMap…');
    data = await fetchSungaiOSM();
    if (data) {
      try { if ('caches' in window) (await caches.open(SUNGAI_CACHE)).put(url, new Response(JSON.stringify({ time: Date.now(), data }))); } catch (e) {}
    }
  }
  if (!data) { setSungaiStatus('⚠️ Data sungai OSM gagal diambil (cek internet). Bisa upload SHP sungai sendiri.'); return; }
  R.refData.sungai = data;
  setSungaiStatus(`✔ ${data.features.length} ruas sungai/badan air (OpenStreetMap).`);
  renderRef('sungai'); renderRefList(); updateLegend();
}
async function fetchSungaiOSM() {
  const bb = NGAWI_BBOX.join(',');
  const q = `[out:json][timeout:90];(way["waterway"~"^(river|stream|canal)$"](${bb});way["natural"="water"]["water"~"^(river|riverbank|canal|oxbow)$"](${bb});relation["natural"="water"]["water"~"^(river|riverbank)$"](${bb});way["waterway"="riverbank"](${bb}););out geom;`;
  for (const ep of OVERPASS) {
    try {
      const r = await fetch(ep, { method: 'POST', body: 'data=' + encodeURIComponent(q), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
      if (!r.ok) continue;
      return osmToGeoJSON(await r.json());
    } catch (e) { console.warn('Overpass gagal', ep, e); }
  }
  return null;
}
function osmToGeoJSON(j) {
  const feats = [];
  const ring = g => g.map(p => [+p.lon.toFixed(6), +p.lat.toFixed(6)]);
  const closed = c => c.length > 3 && c[0][0] === c[c.length - 1][0] && c[0][1] === c[c.length - 1][1];
  // gabungkan potongan garis menjadi cincin tertutup (untuk relasi multipolygon)
  const assemble = parts => {
    parts = parts.map(p => p.slice()); const rings = [];
    while (parts.length) {
      let cur = parts.shift(), guard = 0;
      while (!closed(cur) && guard++ < 5000) {
        const end = cur[cur.length - 1];
        const i = parts.findIndex(p => (p[0][0] === end[0] && p[0][1] === end[1]) || (p[p.length - 1][0] === end[0] && p[p.length - 1][1] === end[1]));
        if (i < 0) break;
        let nx = parts.splice(i, 1)[0];
        if (!(nx[0][0] === end[0] && nx[0][1] === end[1])) nx = nx.reverse();
        cur = cur.concat(nx.slice(1));
      }
      if (closed(cur)) rings.push(cur);
    }
    return rings;
  };
  (j.elements || []).forEach(el => {
    const t = el.tags || {};
    const nama = t.name || '';
    if (el.type === 'way' && el.geometry) {
      const c = ring(el.geometry);
      if ((t.natural === 'water' || t.waterway === 'riverbank') && closed(c)) {
        feats.push({ type: 'Feature', properties: { KELAS: 'Badan Air (Sungai)', NAMA: nama }, geometry: { type: 'Polygon', coordinates: [c] } });
      } else if (t.waterway) {
        const k = t.waterway === 'river' ? 'Sungai' : t.waterway === 'stream' ? 'Anak Sungai' : 'Kanal / Saluran';
        feats.push({ type: 'Feature', properties: { KELAS: k, NAMA: nama }, geometry: { type: 'LineString', coordinates: c } });
      }
    } else if (el.type === 'relation' && el.members) {
      const outer = el.members.filter(m => m.role !== 'inner' && m.geometry).map(m => ring(m.geometry));
      assemble(outer).forEach(r => feats.push({ type: 'Feature', properties: { KELAS: 'Badan Air (Sungai)', NAMA: nama }, geometry: { type: 'Polygon', coordinates: [r] } }));
    }
  });
  return { type: 'FeatureCollection', features: feats };
}
/* ganti data referensi dengan file milik pengguna (SHP/KML/GeoJSON) */
async function replaceRefData(key, files) {
  const before = S.layers.length;
  await handleFiles(files, true);
  const added = S.layers.splice(before);
  S.activeLayer = S.layers.at(-1)?.id || null;
  added.forEach(l => { const g = R.userGroups[l.id]; if (g) { g.eachLayer(x => map.removeLayer(x)); map.removeLayer(g); delete R.userGroups[l.id]; } });
  if (!added.length) return;
  const feats = added.flatMap(l => l.data.features);
  const field = S.ref[key].field;
  feats.forEach(f => {
    const p = f.properties = f.properties || {};
    if (key === 'sungai') p.KELAS = /Polygon/.test(f.geometry.type) ? 'Badan Air (Sungai)' : (p.KELAS && S.ref.sungai.classes[p.KELAS] ? p.KELAS : 'Sungai');
    if (!p[field]) p[field] = Object.keys(S.ref[key].classes)[0];
  });
  const fc = { type: 'FeatureCollection', features: feats };
  S.refCustom = S.refCustom || {}; S.refCustom[key] = fc;
  R.refData[key] = fc;
  renderRef(key); renderRefList(); renderLayerList(); updateLegend(); save();
  toast(`Data ${S.groupTitles[key]} diganti (${feats.length} fitur).`);
}

/* ---------------------------------------------------------------
   LAYER PENGGUNA (lokasi)
--------------------------------------------------------------- */
function userStyle(ly) {
  return {
    color: ly.stroke || ly.color, weight: ly.weight, opacity: 1,
    fillColor: ly.color, fillOpacity: ly.fillOpacity,
    dashArray: ly.dash ? '6 4' : null
  };
}
function newLayer(name, data) {
  const i = S.layers.length;
  const ly = {
    id: uid(), name: name || (S.tema || 'Lokasi') + ' ' + (i + 1), group: S.tema || 'Lokasi',
    color: LAYER_COLORS[i % LAYER_COLORS.length], stroke: null,
    fillOpacity: 0.25, weight: 2.4, dash: false, visible: true, legend: true,
    data: data || { type: 'FeatureCollection', features: [] }
  };
  ly.kind = geomKind(ly.data);
  if (ly.kind !== 'polygon') ly.weight = 3;
  S.layers.push(ly);
  S.activeLayer = ly.id;
  return ly;
}
function renderUserLayer(ly) {
  const old = R.userGroups[ly.id];
  if (old) { old.eachLayer(l => map.removeLayer(l)); map.removeLayer(old); }
  delete R.userGroups[ly.id];
  if (!ly.visible) return;
  const st = userStyle(ly);
  const g = L.geoJSON(ly.data, {
    style: () => st,
    pointToLayer: (f, ll) => L.circleMarker(ll, { ...st, radius: 5, color: '#ffffff', weight: 1.5, fillColor: ly.color, fillOpacity: 1 }),
    onEachFeature: (f, l) => { const n = f.properties && (f.properties.name || f.properties.Name || f.properties.NAMA); if (n && f.geometry.type === 'Point') l.bindTooltip(esc(String(n)), { direction: 'top' }); }
  });
  g.addTo(map);
  g.on('pm:edit pm:dragend pm:rotateend pm:markerdragend', () => syncLayer(ly.id));
  g.on('dblclick', e => {
    L.DomEvent.stop(e);
    if (map.pm.globalDrawModeEnabled()) return;
    toggleEditLayer(ly.id);
  });
  g.on('click', () => {
    if (pickMode || map.pm.globalRemovalModeEnabled() || map.pm.globalDrawModeEnabled()) return;
    S.activeLayer = ly.id; renderLayerList();
    const card = document.querySelector(`#layer-list .card[data-id="${ly.id}"]`);
    if (card) { card.closest('details').open = true; card.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
  });
  if (R.editing === ly.id) g.eachLayer(l => l.pm && l.pm.enable({ allowSelfIntersection: true }));
  R.userGroups[ly.id] = g;
}
function renderAllUserLayers() { S.layers.forEach(renderUserLayer); }
function syncLayer(id) {
  const ly = S.layers.find(l => l.id === id); const g = R.userGroups[id];
  if (!ly || !g) return;
  const feats = [];
  g.eachLayer(l => { if (map.hasLayer(l)) { const gj = l.toGeoJSON(15); feats.push(gj.type === 'FeatureCollection' ? gj.features : gj); } });
  ly.data = { type: 'FeatureCollection', features: feats.flat() };
  ly.kind = geomKind(ly.data);
  refreshLabelCoords(ly);
  renderLayerList(); updateLegend(); updateInset(); save();
}
function syncAll() { S.layers.forEach(l => syncLayer(l.id)); }
function userBounds() {
  let b = null;
  Object.values(R.userGroups).forEach(g => {
    const gb = g.getBounds(); if (gb.isValid()) b = b ? b.extend(gb) : L.latLngBounds(gb.getSouthWest(), gb.getNorthEast());
  });
  return b;
}
/* kembali ke peta lokasi: semua layer lokasi + label, atau posisi terakhir yang disimpan */
function zoomHome() {
  let b = userBounds();
  S.labels.forEach(l => { const ll = L.latLng(l.anchor); b = b ? b.extend(ll) : L.latLngBounds(ll, ll); });
  if (b && b.isValid()) { fitToBounds(b); toast('Kembali ke lokasi peta.'); }
  else toast('Belum ada layer lokasi yang di-upload / digambar.');
}
function fitToBounds(b) {
  if (!b || !b.isValid()) { toast('Belum ada layer lokasi.'); return; }
  const z = map.getBoundsZoom(b, false, L.point(60, 60));
  const c = b.getCenter();
  const need = scaleForZoom(z, c.lat);
  const sc = SCALE_PRESETS.find(p => p >= need) || Math.ceil(need / 1000) * 1000;
  setScale(sc, c);
}

/* Geoman (alat gambar / edit) */
map.pm.setLang('id');
map.pm.addControls({
  position: 'topleft',
  drawCircle: false, drawCircleMarker: false, drawText: false, rotateMode: false,
  drawMarker: true, drawPolyline: true, drawRectangle: true, drawPolygon: true,
  editMode: true, dragMode: true, cutPolygon: true, removalMode: true
});
const QuickTools = L.Control.extend({
  options: { position: 'topleft' },
  onAdd() {
    const c = L.DomUtil.create('div', 'leaflet-bar quick-tools');
    c.innerHTML = `
      <a href="#" data-t="perum" title="Tambah lokasi baru (gambar batas)">➕</a>
      <a href="#" data-t="coord" title="Tambah titik koordinat (bisa digeser)">📍</a>
      <a href="#" data-t="text" title="Tambah label teks">🏷️</a>
      <a href="#" data-t="home" title="Kembali ke lokasi yang di-upload / digambar (zoom ke layer)">🎯</a>`;
    L.DomEvent.disableClickPropagation(c);
    c.addEventListener('click', e => {
      const a = e.target.closest('a'); if (!a) return; e.preventDefault();
      if (a.dataset.t === 'perum') addPerumahan();
      else if (a.dataset.t === 'home') zoomHome();
      else startPick(a.dataset.t);
    });
    return c;
  }
});
/* tombol zoom in / zoom out (mengikuti angka skala bulat agar skala cetak tetap akurat) */
const ZoomTools = L.Control.extend({
  options: { position: 'topright' },
  onAdd() {
    const c = L.DomUtil.create('div', 'leaflet-bar quick-tools zoom-tools');
    c.innerHTML = `
      <a href="#" data-z="in" title="Zoom in (perbesar)">＋</a>
      <div class="zt-scale" title="Skala saat ini"></div>
      <a href="#" data-z="out" title="Zoom out (perkecil)">－</a>
      <a href="#" data-z="home" title="Zoom ke lokasi">⌂</a>`;
    L.DomEvent.disableClickPropagation(c);
    L.DomEvent.disableScrollPropagation(c);
    c.addEventListener('click', e => {
      const a = e.target.closest('a'); if (!a) return; e.preventDefault();
      if (a.dataset.z === 'in') zoomStep(-1);
      else if (a.dataset.z === 'out') zoomStep(1);
      else zoomHome();
    });
    return c;
  }
});
new ZoomTools().addTo(map);
function zoomStep(dir) {
  if (S.freeScale) setScale(roundScale(S.scale * (dir > 0 ? 1.25 : 0.8)));
  else stepScale(dir);
}
new QuickTools().addTo(map);
map.pm.setGlobalOptions({ snappable: true, snapDistance: 12, allowSelfIntersection: true });
map.on('pm:create', e => {
  const gj = e.layer.toGeoJSON(15);
  map.removeLayer(e.layer);
  if (R.drawingRoad) {
    const d = R.drawingRoad; R.drawingRoad = null;
    if (gj.geometry.type !== 'LineString') { toast('Jalan harus berupa garis.'); return; }
    gj.properties = { NAMOBJ: d.cls, REMARK: d.name || '(jalan tambahan)', _id: 'a' + uid() };
    S.jalanEdits.added.push(gj);
    rebuildJalan(); toast(`${d.cls} ditambahkan (sementara).`);
    return;
  }
  let ly = S.layers.find(l => l.id === S.activeLayer);
  if (!ly) ly = newLayer();
  ly.data.features.push(gj);
  ly.kind = geomKind(ly.data);
  if (!ly.visible) ly.visible = true;
  renderUserLayer(ly); renderLayerList(); updateLegend(); updateInset(); save();
  if (ly.autoLabel) { delete ly.autoLabel; if (S.autoLabels) setTimeout(() => autoLabelsForLayer(ly), 50); }
  toast('Ditambahkan ke: ' + ly.name + ' (legenda diperbarui)');
});

/* ---------- tambah / edit perumahan ---------- */
function addPerumahan() {
  const tema = S.tema || 'Lokasi';
  const name = prompt(`Nama ${tema.toLowerCase()} (tampil di legenda & judul):`, tema + ' ' + (S.layers.length + 1));
  if (!name) return;
  const ly = newLayer(name);
  ly.autoLabel = true;
  renderUserLayer(ly); renderLayerList(); updateLegend(); save();
  map.pm.enableDraw('Polygon', { snappable: true });
  toast('Klik titik-titik batas lokasi di peta. Klik titik pertama untuk menutup.', 5000);
}
function toggleEditLayer(id) {
  const prev = R.editing;
  if (prev) {
    const g = R.userGroups[prev]; if (g) g.eachLayer(l => l.pm && l.pm.disable());
    R.editing = null; syncLayer(prev);
  }
  if (prev !== id) {
    const g = R.userGroups[id]; if (!g) return;
    g.eachLayer(l => l.pm && l.pm.enable({ allowSelfIntersection: true, snappable: true }));
    R.editing = id; S.activeLayer = id;
    toast('Geser titik sudut untuk mengubah bentuk. Klik "Selesai edit" bila sudah.', 4000);
  }
  renderLayerList();
}
map.on('pm:remove', () => setTimeout(syncAll, 0));
map.on('pm:drawend', () => { setTimeout(() => { R.drawingRoad = null; }, 50); });
map.on('pm:cut', e => {
  for (const id in R.userGroups) {
    const g = R.userGroups[id];
    if (g.hasLayer(e.originalLayer)) { g.removeLayer(e.originalLayer); if (e.layer) g.addLayer(e.layer); syncLayer(id); renderUserLayer(S.layers.find(l => l.id === id)); break; }
  }
});

/* ---------------------------------------------------------------
   LABEL & KOORDINAT
--------------------------------------------------------------- */
function haloCss(c, w = 1.3) {
  const o = [];
  for (let a = 0; a < 360; a += 45) { const r = a * Math.PI / 180; o.push(`${(Math.cos(r) * w).toFixed(2)}px ${(Math.sin(r) * w).toFixed(2)}px 0 ${c}`); }
  return o.join(',');
}
function coordText(lb) {
  return `Koordinat:\nX: ${lb.anchor[1].toFixed(6)}\nY: ${lb.anchor[0].toFixed(6)}`;
}
function labelText(lb) {
  if (lb.type === 'coord' && lb.auto !== false) return coordText(lb);
  if (lb.type === 'text' && lb.autoText && lb.layerId) {
    const ly = S.layers.find(l => l.id === lb.layerId);
    if (ly) return 'Lokasi ' + ly.name.replace(/\s*\(/, '\n(');
  }
  return lb.text;
}
function labelHtml(lb) {
  const st = `font-size:${lb.size}pt;color:${lb.color};text-shadow:${haloCss(lb.halo)};border-bottom-color:${lb.line};` +
    `font-weight:${lb.bold === false ? 'normal' : 'bold'};font-style:${lb.italic ? 'italic' : 'normal'};` +
    `text-decoration:${lb.underline ? 'underline' : 'none'};text-align:${lb.align || 'center'};${lb.font ? 'font-family:' + lb.font + ';' : ''}`;
  return `<div class="ml-inner" style="${st}">${esc(labelText(lb))}</div>`;
}
function newLabel(type, anchor, pos, text) {
  const lb = {
    id: uid(), type, auto: true, text: text || (type === 'coord' ? '' : 'Lokasi Perumahan'),
    anchor: [anchor.lat ?? anchor[0], anchor.lng ?? anchor[1]],
    pos: [pos.lat ?? pos[0], pos.lng ?? pos[1]],
    size: 11, color: '#000000', halo: '#ffffff', line: '#ffe600'
  };
  S.labels.push(lb);
  renderLabel(lb);
  renderLabelList(); save();
  return lb;
}
function renderLabel(lb) {
  removeLabelObj(lb.id);
  const showPt = lb.point ?? (lb.type === 'coord');
  const follow = lb.follow !== false;
  const line = L.polyline([lb.pos, lb.anchor], { color: lb.line, weight: 1.4, interactive: false, pmIgnore: true }).addTo(map);
  // titik koordinat yang ikut tercetak
  const pt = showPt ? L.circleMarker(lb.anchor, { radius: 3.6, color: '#ffffff', weight: 1.4, fillColor: lb.ptColor || '#ff0000', fillOpacity: 1, interactive: false, pmIgnore: true }).addTo(map) : null;
  const mkIcon = () => L.divIcon({ className: 'map-label', html: labelHtml(lb), iconSize: [0, 0], iconAnchor: [0, 0] });
  const mk = L.marker(lb.pos, { icon: mkIcon(), draggable: true, pmIgnore: true, zIndexOffset: 1000, keyboard: false }).addTo(map);
  const ah = L.marker(lb.anchor, {
    icon: L.divIcon({ className: 'anchor-handle' + (showPt ? ' with-pt' : ''), iconSize: [14, 14], html: '<span></span>' }),
    draggable: true, pmIgnore: true, zIndexOffset: 1100, keyboard: false, title: 'Geser titik (label ikut bergeser)'
  }).addTo(map);
  mk.on('drag', e => { line.setLatLngs([e.target.getLatLng(), ah.getLatLng()]); });
  mk.on('dragend', e => { const p = e.target.getLatLng(); lb.pos = [p.lat, p.lng]; save(); });
  let start = null;
  ah.on('dragstart', () => {
    const a = map.latLngToContainerPoint(ah.getLatLng()), b = map.latLngToContainerPoint(mk.getLatLng());
    start = b.subtract(a);              // jarak label terhadap titik (piksel)
  });
  ah.on('dragstart', () => { lb.anchorManual = true; });
  ah.on('drag', e => {
    const p = e.target.getLatLng(); lb.anchor = [p.lat, p.lng];
    if (follow && start) {
      const np = map.containerPointToLatLng(map.latLngToContainerPoint(p).add(start));
      mk.setLatLng(np); lb.pos = [np.lat, np.lng];
    }
    line.setLatLngs([mk.getLatLng(), p]);
    if (pt) pt.setLatLng(p);
    if (lb.type === 'coord') mk.setIcon(mkIcon());
  });
  ah.on('dragend', () => { renderLabelList(); save(); });
  // klik 2× pada teks → edit langsung di peta
  mk.on('dblclick', e => { L.DomEvent.stop(e); startInlineEdit(lb); });
  ah.on('dblclick', e => { L.DomEvent.stop(e); startInlineEdit(lb); });
  R.labelObjs[lb.id] = { line, mk, ah, pt };
}
/* ---------- edit label langsung di peta (klik 2×) ----------
   Enter = simpan, Shift+Enter = baris baru, Esc = batal.
   Label koordinat: ubah angka X/Y lalu Enter → titik pindah ke koordinat itu. */
function startInlineEdit(lb) {
  const o = R.labelObjs[lb.id]; if (!o) return;
  const el = o.mk.getElement()?.querySelector('.ml-inner'); if (!el) return;
  if (o.mk.dragging) o.mk.dragging.disable();
  map.dragging.disable();
  el.classList.add('editing');
  el.contentEditable = 'true';
  el.textContent = labelText(lb);
  el.focus();
  const r = document.createRange(); r.selectNodeContents(el);
  const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
  setTimeout(() => showFmtBar(el, labelFmtTarget(lb)), 0);
  let done = false;
  const stop = ev => ev.stopPropagation();
  ['mousedown', 'click', 'dblclick', 'wheel', 'pointerdown', 'touchstart'].forEach(t => el.addEventListener(t, stop));
  const finish = commit => {
    if (done) return; done = true;
    hideFmtBar();
    map.dragging.enable();
    const txt = el.innerText.replace(/\u00a0/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
    if (commit && txt) applyLabelEdit(lb, txt);
    renderLabel(lb); renderLabelList(); save();
  };
  el.addEventListener('keydown', ev => {
    ev.stopPropagation();
    if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); finish(true); }
    else if (ev.key === 'Escape') { ev.preventDefault(); finish(false); }
  });
  el.addEventListener('blur', () => setTimeout(() => {
    const a = document.activeElement;
    if (a && a.closest && a.closest('#fmt-bar')) { a.addEventListener('blur', () => { if (document.activeElement !== el) finish(true); }, { once: true }); return; }
    finish(true);
  }, 0));
  toast('Edit teks label. Enter = simpan, Shift+Enter = baris baru, Esc = batal.', 4000);
}
function applyLabelEdit(lb, txt) {
  if (lb.type === 'coord') {
    const num = v => parseFloat(String(v).replace(',', '.'));
    const m = txt.match(/X\s*[:=]\s*(-?\d+[.,]?\d*)[\s\S]*?Y\s*[:=]\s*(-?\d+[.,]?\d*)/i);
    if (m && lb.auto !== false) {
      const x = num(m[1]), y = num(m[2]);
      if (Math.abs(x) <= 180 && Math.abs(y) <= 90 && (Math.abs(x - lb.anchor[1]) > 1e-7 || Math.abs(y - lb.anchor[0]) > 1e-7)) {
        // pindahkan titik ke koordinat yang diketik; label ikut bergeser
        const a = map.latLngToContainerPoint(lb.anchor), p = map.latLngToContainerPoint(lb.pos);
        lb.anchor = [y, x];
        const np = map.containerPointToLatLng(map.latLngToContainerPoint(lb.anchor).add(p.subtract(a)));
        lb.pos = [np.lat, np.lng];
        toast('Titik koordinat dipindah ke X ' + x + ', Y ' + y);
      }
      if (/^koordinat:\s*\n\s*x:/i.test(txt)) return;     // format standar → tetap otomatis
    }
    lb.auto = false; lb.text = txt;                       // teks bebas → jadi label manual
  } else {
    const ly = lb.layerId && S.layers.find(l => l.id === lb.layerId);
    if (ly && lb.role === 'name') {
      // nama di label = nama layer → legenda, judul, sidebar ikut berubah
      ly.name = txt.replace(/^\s*lokasi\s+/i, '').replace(/\s*\n\s*/g, ' ').trim() || ly.name;
      lb.autoText = /^\s*lokasi\s+/i.test(txt) && labelText({ ...lb, autoText: true }) === txt;
      lb.text = txt;
      syncAllViews();
    } else { lb.text = txt; lb.autoText = false; }
  }
}
/* segarkan semua tampilan setelah ada perubahan dari mana pun */
function syncAllViews() {
  renderLayerList(); renderLabelList(); renderRefList();
  updateLegend(); updateInset(); applyTexts();
  ['instansi', 'judul', 'lokasi', 'sumber'].forEach(k => { const el = $('#txt-' + k); if (el && el.value !== S.texts[k]) el.value = S.texts[k]; });
  $('#txt-inset').value = S.texts.inset; $('#txt-inset-sub').value = S.texts.insetSub;
  $('#auto-judul').checked = !!S.autoJudul;
  $('#tema').value = S.tema || ''; $('#auto-lokasi').checked = !!S.autoLokasi;
  if ($('#tema')) $('#tema').value = S.tema || '';
  save();
}

/* ---------- toolbar format teks (muncul saat mengedit) ---------- */
const FMT = { target: null, el: null };
function showFmtBar(el, target) {
  FMT.el = el; FMT.target = target;
  const bar = $('#fmt-bar');
  bar.hidden = false;
  syncFmtBar();
  const r = el.getBoundingClientRect();
  const top = Math.max(8, r.top - bar.offsetHeight - 8);
  bar.style.top = top + 'px';
  bar.style.left = Math.min(window.innerWidth - bar.offsetWidth - 8, Math.max(8, r.left)) + 'px';
}
function hideFmtBar() { $('#fmt-bar').hidden = true; FMT.el = FMT.target = null; }
function syncFmtBar() {
  const t = FMT.target; if (!t) return;
  const v = t.get();
  $$('#fmt-bar [data-f]').forEach(b => {
    const f = b.dataset.f;
    if (['b', 'i', 'u'].includes(f)) b.classList.toggle('on', !!v[f]);
    if (f.startsWith('al-')) b.classList.toggle('on', (v.align || t.defAlign) === f.slice(3));
  });
  $('#fmt-size').textContent = (+v.size).toFixed(1).replace('.0', '') + ' pt';
  $('#fmt-color').value = v.color || '#000000';
  $('#fmt-font').value = v.font || '';
}
function bindFmtBar() {
  const bar = $('#fmt-bar');
  // jangan sampai klik toolbar membuat teks yang diedit kehilangan fokus
  bar.addEventListener('mousedown', e => { if (!/SELECT|INPUT/.test(e.target.tagName)) e.preventDefault(); });
  bar.addEventListener('click', e => {
    const b = e.target.closest('[data-f]'); if (!b || !FMT.target) return;
    const f = b.dataset.f, t = FMT.target, v = t.get();
    if (['b', 'i', 'u'].includes(f)) t.set({ [f]: !v[f] });
    else if (f === 'size+') t.set({ size: Math.min(48, +v.size + 0.5) });
    else if (f === 'size-') t.set({ size: Math.max(4, +v.size - 0.5) });
    else if (f.startsWith('al-')) t.set({ align: f.slice(3) });
    else if (f === 'reset') t.reset();
    syncFmtBar();
  });
  $('#fmt-sw').innerHTML = PALETTE.slice(0, 18).map(([c, n]) => `<button type="button" class="sw" data-fc="${c}" title="${n}" style="background:${c}"></button>`).join('');
  $('#fmt-sw').addEventListener('click', e => { const b = e.target.closest('[data-fc]'); if (b && FMT.target) { FMT.target.set({ color: b.dataset.fc }); syncFmtBar(); } });
  $('#fmt-color').addEventListener('input', e => { if (FMT.target) { FMT.target.set({ color: e.target.value }); } });
  $('#fmt-font').addEventListener('change', e => { if (FMT.target) { FMT.target.set({ font: e.target.value }); } });
}
/* target format untuk teks lembar peta */
function pageFmtTarget(key) {
  const el = $(FMT_TARGETS[key]);
  const cs = getComputedStyle(key === 'legend' ? ($('#legend .lg-label') || el) : el);
  return {
    defAlign: cs.textAlign === 'start' ? 'left' : cs.textAlign,
    get: () => {
      const st = S.textStyle[key] || {};
      return { b: st.b ?? (parseInt(cs.fontWeight) >= 600), i: st.i, u: st.u, size: st.size || +(parseFloat(cs.fontSize) * 0.75).toFixed(1),
        align: st.align, color: st.color || '#000000', font: st.font };
    },
    set: patch => { S.textStyle[key] = { ...(S.textStyle[key] || {}), ...baseStyle(key, cs), ...patch }; applyTextStyles(); if (key === 'legend') fitLegend(); save(); },
    reset: () => { delete S.textStyle[key]; applyTextStyles(); if (key === 'legend') fitLegend(); save(); }
  };
}
function baseStyle(key, cs) { const st = S.textStyle[key] || {}; return { size: st.size || +(parseFloat(cs.fontSize) * 0.75).toFixed(1) }; }
/* target format untuk label di peta */
function labelFmtTarget(lb) {
  const rer = () => { const o = R.labelObjs[lb.id]; const el = o && o.mk.getElement()?.querySelector('.ml-inner'); if (el) { const tmp = document.createElement('div'); tmp.innerHTML = labelHtml(lb); el.setAttribute('style', tmp.firstChild.getAttribute('style')); } save(); };
  return {
    defAlign: 'center',
    get: () => ({ b: lb.bold !== false, i: !!lb.italic, u: !!lb.underline, size: lb.size, align: lb.align || 'center', color: lb.color, font: lb.font }),
    set: patch => {
      if ('b' in patch) lb.bold = patch.b; if ('i' in patch) lb.italic = patch.i; if ('u' in patch) lb.underline = patch.u;
      if ('size' in patch) lb.size = patch.size; if ('align' in patch) lb.align = patch.align; if ('color' in patch) lb.color = patch.color;
      if ('font' in patch) lb.font = patch.font;
      rer();
    },
    reset: () => { delete lb.bold; delete lb.italic; delete lb.underline; delete lb.align; delete lb.font; lb.size = 11; lb.color = '#000000'; rer(); }
  };
}

/* ---------- klik 2× pada teks di halaman (kop, judul, legenda, sumber, inset) ---------- */
function editInline(el, initial, onCommit, fmtKey) {
  if (el.isContentEditable) return;
  if (fmtKey) setTimeout(() => showFmtBar(el, pageFmtTarget(fmtKey)), 0);
  const orig = el.innerHTML;
  el.classList.add('editing-page');
  el.contentEditable = 'true';
  el.textContent = initial;
  el.focus();
  const r = document.createRange(); r.selectNodeContents(el);
  const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
  let done = false;
  const finish = commit => {
    if (done) return; done = true;
    el.contentEditable = 'false'; el.classList.remove('editing-page');
    hideFmtBar();
    const txt = el.innerText.replace(/\u00a0/g, ' ').trim();
    if (commit && txt && txt !== initial) onCommit(txt); else el.innerHTML = orig;
    syncAllViews();
  };
  el.onkeydown = ev => {
    ev.stopPropagation();
    if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); finish(true); }
    else if (ev.key === 'Escape') { ev.preventDefault(); finish(false); }
  };
  el.onblur = () => setTimeout(() => {           // tunggu: fokus mungkin pindah ke toolbar format
    const a = document.activeElement;
    if (a && a.closest && a.closest('#fmt-bar')) { a.addEventListener('blur', () => { if (!el.contains(document.activeElement) && !document.activeElement.closest('#fmt-bar')) finish(true); }, { once: true }); return; }
    finish(true);
  }, 0);
}
function bindPageEditing() {
  const page = $('#page');
  page.addEventListener('dblclick', e => {
    const t = e.target;
    const field = (id, key, autoKey) => {
      if (!t.closest('#' + id)) return false;
      editInline($('#' + id), S.texts[key], txt => {
        S.texts[key] = txt;
        if (autoKey) S[autoKey] = false;        // diedit manual → berhenti otomatis
      }, key);
      return true;
    };
    if (t.closest('.legend-title')) { editInline($('.legend-title'), S.texts.legendTitle || 'Legenda', txt => { S.texts.legendTitle = txt; }, 'legendTitle'); return; }
    if (field('out-instansi', 'instansi') || field('out-judul', 'judul', 'autoJudul') || field('out-lokasi', 'lokasi', 'autoLokasi') ||
        field('out-sumber', 'sumber') || field('out-inset', 'inset') || field('out-inset-sub', 'insetSub')) return;
    // legenda
    const lab = t.closest('.lg-label'), grp = t.closest('.lg-group');
    if (lab) {
      const it = lab.closest('.lg-item');
      if (it.dataset.layer) {
        const ly = S.layers.find(l => l.id === it.dataset.layer);
        editInline(lab, ly.name, txt => { S.layers.filter(l => l.name === ly.name && l.group === ly.group).forEach(l => { l.name = txt; refreshLayerLabels(l); }); }, 'legend');
      } else if (it.dataset.ref) {
        const c = S.ref[it.dataset.ref].classes[it.dataset.cls];
        editInline(lab, c.label || it.dataset.cls, txt => { c.label = txt; }, 'legend');
      }
    } else if (grp) {
      const b = grp.closest('.lg-block');
      if (b.dataset.group != null) {
        const old = b.dataset.group;
        editInline(grp, old, txt => { S.layers.forEach(l => { if (l.group === old) l.group = txt; }); if (S.tema === old) S.tema = txt; }, 'legend');
      } else if (b.dataset.ref) {
        editInline(grp, S.groupTitles[b.dataset.ref], txt => { S.groupTitles[b.dataset.ref] = txt; }, 'legend');
      }
    }
  });
}
function removeLabelObj(id) {
  const o = R.labelObjs[id]; if (!o) return;
  [o.line, o.mk, o.ah, o.pt].forEach(l => l && map.removeLayer(l));
  delete R.labelObjs[id];
}
function renderAllLabels() { S.labels.forEach(renderLabel); }

function offsetLatLng(ll, dx, dy) {
  const p = map.latLngToContainerPoint(ll).add([dx, dy]);
  return map.containerPointToLatLng(p);
}
/* label lokasi (role 'name') & koordinat (role 'coord') yang terikat pada satu layer */
function layerLabel(ly, role) { return S.labels.find(l => l.layerId === ly.id && l.role === role); }
function setLayerLabel(ly, role, on, slot = 0) {
  const ex = layerLabel(ly, role);
  if (!on) { if (ex) { removeLabelObj(ex.id); S.labels = S.labels.filter(l => l !== ex); renderLabelList(); save(); } return; }
  if (ex) return;
  const rp = representativePoint(ly.data); if (!rp) return;
  const a = L.latLng(rp[1], rp[0]);
  const dy = slot % 2 === 0 ? -110 : 110;          // layer berikutnya diletakkan bergantian atas/bawah agar tidak menumpuk
  let lb;
  if (role === 'name') {
    lb = newLabel('text', a, offsetLatLng(a, -150, dy), '');
    lb.autoText = true;
  } else {
    const a2 = offsetLatLng(a, 16, 8);
    lb = newLabel('coord', a2, offsetLatLng(a2, 140, dy));
  }
  lb.layerId = ly.id; lb.role = role;
  renderLabel(lb); renderLabelList(); save();
}
function autoLabelsForLayer(ly, slot = 0) {
  setLayerLabel(ly, 'name', true, slot);
  setLayerLabel(ly, 'coord', true, slot);
}
function removeLayerLabels(id) {
  S.labels.filter(l => l.layerId === id).forEach(l => removeLabelObj(l.id));
  S.labels = S.labels.filter(l => l.layerId !== id);
  renderLabelList();
}
function refreshLayerLabels(ly) { S.labels.filter(l => l.layerId === ly.id).forEach(renderLabel); }
/* bentuk layer berubah → label lokasi & koordinat ikut pindah (kecuali titiknya sudah digeser manual) */
function refreshLabelCoords(ly) {
  if (!ly) return;
  const rp = representativePoint(ly.data); if (!rp) return;
  S.labels.filter(l => l.layerId === ly.id && !l.anchorManual).forEach(lb => {
    let a = L.latLng(rp[1], rp[0]);
    if (lb.role === 'coord') a = offsetLatLng(a, 16, 8);
    const oldA = map.latLngToContainerPoint(lb.anchor), oldP = map.latLngToContainerPoint(lb.pos);
    const np = map.containerPointToLatLng(map.latLngToContainerPoint(a).add(oldP.subtract(oldA)));
    lb.anchor = [a.lat, a.lng]; lb.pos = [np.lat, np.lng];
    renderLabel(lb);
  });
  renderLabelList();
}
let pickMode = null;
function startPick(type) {
  pickMode = type;
  document.body.classList.add('picking');
  toast(type === 'coord' ? 'Klik titik di peta untuk koordinat…' : 'Klik titik di peta yang ditunjuk label…', 4000);
}
map.on('click', e => {
  if (!pickMode) { showRefInfo(e); return; }
  e.originalEvent._picked = true;
  const type = pickMode; pickMode = null;
  document.body.classList.remove('picking');
  const pos = offsetLatLng(e.latlng, type === 'coord' ? 110 : -110, -100);
  newLabel(type, e.latlng, pos, type === 'coord' ? '' : 'Lokasi Perumahan');
});

/* ---------- klik jalan / sungai / irigasi → keterangan ---------- */
function anyPmMode() {
  const pm = map.pm;
  return pm.globalDrawModeEnabled() || pm.globalEditModeEnabled() || pm.globalRemovalModeEnabled() ||
         pm.globalDragModeEnabled() || (pm.globalCutModeEnabled && pm.globalCutModeEnabled()) || !!R.editing;
}
function flatLines(lls) { return Array.isArray(lls[0]) ? lls.flatMap(flatLines) : [lls]; }
function hitRef(latlng, tolPx) {
  const cp = map.latLngToContainerPoint(latlng);
  let best = null;
  for (const key of ['jalan', 'sungai', 'air']) {
    const main = R.refMain && R.refMain[key];
    if (!main || !S.ref[key].visible || !R.refGroups[key]) continue;
    main.eachLayer(l => {
      const b = l.getBounds();
      const a = map.latLngToContainerPoint(b.getNorthWest()), c = map.latLngToContainerPoint(b.getSouthEast());
      if (cp.x < a.x - tolPx || cp.x > c.x + tolPx || cp.y < a.y - tolPx || cp.y > c.y + tolPx) return;
      const isPoly = l instanceof L.Polygon;
      if (isPoly && flatLines(l.getLatLngs()).some(r => pointInRing([latlng.lng, latlng.lat], r.map(p => [p.lng, p.lat])))) {
        if (!best || best.d > 0) best = { d: 0, l, key };
        return;
      }
      flatLines(l.getLatLngs()).forEach(line => {
        const pts = line.map(p => map.latLngToContainerPoint(p));
        if (isPoly) pts.push(pts[0]);
        for (let i = 1; i < pts.length; i++) {
          const d = L.LineUtil.pointToSegmentDistance(cp, pts[i - 1], pts[i]);
          if (d <= tolPx && (!best || d < best.d)) best = { d, l, key };
        }
      });
    });
  }
  return best;
}
function lineLength(l) {
  let m = 0;
  flatLines(l.getLatLngs()).forEach(line => { for (let i = 1; i < line.length; i++) m += line[i - 1].distanceTo(line[i]); });
  return m;
}
function showRefInfo(e) {
  if (e.originalEvent && e.originalEvent._picked) return;
  if (anyPmMode()) return;
  const hit = hitRef(e.latlng, 7);
  if (!hit) return;
  const { l, key } = hit;
  const p = l.feature.properties || {};
  const cfg = S.ref[key], cls = p[cfg.field], k = cfg.classes[cls] || {};
  const d = desaAt(e.latlng);
  const lokasi = d ? `Desa ${desaName(d)}, Kecamatan ${kecName(d)}` : '–';
  const len = lineLength(l);
  const fmtLen = len >= 1000 ? (len / 1000).toLocaleString('id-ID', { maximumFractionDigits: 2 }) + ' km' : Math.round(len).toLocaleString('id-ID') + ' m';
  const rows = [];
  if (key === 'jalan') {
    rows.push(['Nama ruas', p.REMARK || { em: 'tidak tercatat' }], ['Fungsi jalan', k.label || cls], ['Panjang ruas', fmtLen]);
  } else if (key === 'sungai') {
    rows.push(['Nama', p.NAMA || { em: 'tanpa nama' }], ['Jenis', k.label || cls]);
    if (!(l instanceof L.Polygon)) rows.push(['Panjang ruas', fmtLen]);
  } else {
    rows.push(['Jenis', k.label || cls], ['Panjang ruas', fmtLen]);
  }
  rows.push(['Lokasi klik', lokasi], ['Koordinat', `${e.latlng.lng.toFixed(6)}, ${e.latlng.lat.toFixed(6)}`]);
  let acts = '';
  if (key === 'jalan') {
    const id = p._id, added = String(id).startsWith('a');
    const opts = Object.keys(S.ref.jalan.classes).map(c => `<option value="${esc(c)}" ${c === cls ? 'selected' : ''}>${esc(S.ref.jalan.classes[c].label || c)}</option>`).join('');
    acts = `<div class="rp-edit"><div class="rp-edit-t">Edit sementara (peta ini saja)</div>
      <label>Fungsi: <select class="rp-reclass" data-id="${id}" data-orig="${esc(p._orig || cls)}">${opts}</select></label>
      <button class="rp-act" data-act="hide" data-id="${id}">${added ? '🗑️ Hapus ruas tambahan' : '🙈 Sembunyikan ruas ini'}</button></div>`;
  }
  const src = key === 'jalan' ? (String(p._id).startsWith('a') ? 'Tambahan sementara (proyek ini)' : 'SHP Sistem Jaringan Transportasi' + (S.jalanEdits.reclass[p._id] ? ' – fungsi diubah sementara' : '')) : key === 'air' ? 'SHP Sistem Jaringan Sumber Daya Air' : (S.refCustom?.sungai ? 'Data sungai (upload)' : 'OpenStreetMap');
  const html = `<div class="ref-pop"><div class="rp-title" style="border-color:${k.color || '#333'}">${esc(S.groupTitles[key])}</div>
    <table>${rows.map(([a, b]) => `<tr><th>${esc(a)}</th><td>${b && b.em ? '<i>' + esc(b.em) + '</i>' : esc(b)}</td></tr>`).join('')}</table>
    <div class="rp-src">Sumber: ${esc(src)}</div>${acts}</div>`;
  if (R.hiLite) map.removeLayer(R.hiLite);
  R.hiLite = L.geoJSON(l.feature, { pane: 'overlayPane', interactive: false, pmIgnore: true,
    style: { color: '#00e5ff', weight: Math.max(6, (k.width || 1) * PT + 5), opacity: 0.55, fill: false } }).addTo(map);
  L.popup({ maxWidth: 300, className: 'ref-popup' }).setLatLng(e.latlng).setContent(html).openOn(map)
    .on('remove', () => { if (R.hiLite) { map.removeLayer(R.hiLite); R.hiLite = null; } });
}

/* ---------------------------------------------------------------
   GRID KOORDINAT DI TEPI
--------------------------------------------------------------- */
function fmtCoord(v, isLat) {
  const hem = isLat ? (v < 0 ? 'S' : 'N') : (v < 0 ? 'W' : 'E');
  let a = Math.abs(v);
  if (S.gridFormat === 'dd') return `${a.toFixed(a < 10 ? 4 : 4)}°${hem}`;
  let d = Math.floor(a + 1e-9);
  if (S.gridFormat === 'dm') {
    let m = +((a - d) * 60).toFixed(2); if (m >= 60) { m = 0; d++; }
    return `${d}°${m.toFixed(2)}'${hem}`;
  }
  let m = Math.floor((a - d) * 60 + 1e-9), sec = Math.round(((a - d) * 60 - m) * 60);
  if (sec === 60) { sec = 0; m++; } if (m === 60) { m = 0; d++; }
  return `${d}°${m}'${sec}"${hem}`;
}
const GRID_STEPS_SEC = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600, 7200];
function gridIntervalDeg(spanDeg, maxTicks) {
  if (S.gridInterval !== 'auto') return Number(S.gridInterval) / 3600;
  const st = GRID_STEPS_SEC.map(s => s / 3600);
  return st.find(s => spanDeg / s <= maxTicks) || 2;
}
/* margin bingkai (mm) per sisi: lebar jika sisi itu memuat label */
function gridMargins() {
  if (!S.grid) return { top: 0, bottom: 0, left: 0, right: 0 };
  const sd = S.gridSides, tick = 2.4;
  const vert = S.gridLatVertical;
  const latW = vert ? 6 : (S.gridFormat === 'dd' ? 14 : 15);
  return {
    top: sd.top ? 6 : tick, bottom: sd.bottom ? 6 : tick,
    left: sd.left ? latW : tick, right: sd.right ? latW : tick
  };
}
function applyMapInset() {
  const m = gridMargins(), el = $('#map');
  el.style.top = m.top + 'mm'; el.style.bottom = m.bottom + 'mm';
  el.style.left = m.left + 'mm'; el.style.right = m.right + 'mm';
}
/* Grid koordinat bergaya ArcGIS: garis graticule / tanda silang, tick di bingkai,
   label koordinat di sisi yang dipilih. Diperbarui setiap kali peta digeser. */
let gridRaf = 0;
function scheduleGrid() { if (!gridRaf) gridRaf = requestAnimationFrame(() => { gridRaf = 0; drawGrid(); }); }
function drawGrid() {
  const svg = $('#grid-svg');
  if (!S.grid) { svg.innerHTML = ''; return; }
  const mapEl = $('#map');
  const ox = mapEl.offsetLeft, oy = mapEl.offsetTop, W = mapEl.clientWidth, H = mapEl.clientHeight;
  if (!W || !H) return;
  const b = map.getBounds();
  const sd = S.gridSides;
  const tick = 1.8 * PX_PER_MM, fs = 9.3;          // 7 pt
  const col = S.gridColor, lw = S.gridWidth;
  const out = [];
  const iLng = gridIntervalDeg(b.getEast() - b.getWest(), Math.max(2, Math.round(W / 170)));
  const iLat = gridIntervalDeg(b.getNorth() - b.getSouth(), Math.max(2, Math.round(H / 150)));
  const xs = [], ys = [];
  const eps = 1e-9;
  for (let v = Math.ceil(b.getWest() / iLng - eps) * iLng; v <= b.getEast() + eps; v += iLng) {
    const x = map.latLngToContainerPoint([b.getCenter().lat, v]).x;
    if (x > 1 && x < W - 1) xs.push([x, v]);
  }
  for (let v = Math.ceil(b.getSouth() / iLat - eps) * iLat; v <= b.getNorth() + eps; v += iLat) {
    const y = map.latLngToContainerPoint([v, b.getCenter().lng]).y;
    if (y > 1 && y < H - 1) ys.push([y, v]);
  }
  // garis / tanda silang di dalam peta
  out.push(`<g stroke="${col}" stroke-width="${lw}" fill="none">`);
  if (S.gridStyle === 'lines') {
    xs.forEach(([x]) => out.push(`<line x1="${ox + x}" y1="${oy}" x2="${ox + x}" y2="${oy + H}"/>`));
    ys.forEach(([y]) => out.push(`<line x1="${ox}" y1="${oy + y}" x2="${ox + W}" y2="${oy + y}"/>`));
  } else if (S.gridStyle === 'cross') {
    const c = 2.2 * PX_PER_MM;
    xs.forEach(([x]) => ys.forEach(([y]) => {
      out.push(`<line x1="${ox + x - c}" y1="${oy + y}" x2="${ox + x + c}" y2="${oy + y}"/><line x1="${ox + x}" y1="${oy + y - c}" x2="${ox + x}" y2="${oy + y + c}"/>`);
    }));
  }
  out.push('</g>');
  // tick di luar bingkai (semua sisi) + tick kecil ke dalam bingkai
  out.push('<g stroke="#000" stroke-width="0.8">');
  const tin = 1.2 * PX_PER_MM;
  xs.forEach(([x]) => {
    out.push(`<line x1="${ox + x}" y1="${oy - tick}" x2="${ox + x}" y2="${oy + tin}"/>`);
    out.push(`<line x1="${ox + x}" y1="${oy + H - tin}" x2="${ox + x}" y2="${oy + H + tick}"/>`);
  });
  ys.forEach(([y]) => {
    out.push(`<line x1="${ox - tick}" y1="${oy + y}" x2="${ox + tin}" y2="${oy + y}"/>`);
    out.push(`<line x1="${ox + W - tin}" y1="${oy + y}" x2="${ox + W + tick}" y2="${oy + y}"/>`);
  });
  out.push('</g>');
  // label
  out.push(`<g font-family="Arial" font-size="${fs}" fill="#000">`);
  const minGap = 28;
  xs.forEach(([x, v]) => {
    if (x < minGap || x > W - minGap) return;
    const t = esc(fmtCoord(v, false));
    if (sd.top) out.push(`<text x="${ox + x}" y="${oy - tick - 2}" text-anchor="middle">${t}</text>`);
    if (sd.bottom) out.push(`<text x="${ox + x}" y="${oy + H + tick + fs}" text-anchor="middle">${t}</text>`);
  });
  ys.forEach(([y, v]) => {
    if (y < minGap || y > H - minGap) return;
    const t = esc(fmtCoord(v, true));
    if (S.gridLatVertical) {
      if (sd.left) { const x = ox - tick - 2; out.push(`<text x="${x}" y="${oy + y}" text-anchor="middle" transform="rotate(-90 ${x} ${oy + y})">${t}</text>`); }
      if (sd.right) { const x = ox + W + tick + 2 + fs * 0.75; out.push(`<text x="${x}" y="${oy + y}" text-anchor="middle" transform="rotate(-90 ${x} ${oy + y})">${t}</text>`); }
    } else {
      if (sd.left) out.push(`<text x="${ox - tick - 2}" y="${oy + y + fs / 3}" text-anchor="end">${t}</text>`);
      if (sd.right) out.push(`<text x="${ox + W + tick + 2}" y="${oy + y + fs / 3}" text-anchor="start">${t}</text>`);
    }
  });
  out.push('</g>');
  svg.innerHTML = out.join('');
}

/* ---------------------------------------------------------------
   LEGENDA
--------------------------------------------------------------- */
/* simbol legenda jaringan sesuai bentuk simbol Permen 14/2021 */
function refSymSvg(k) {
  const y = 8, w = Math.max(0.8, k.width * 1.1);
  let s = '';
  if (k.fill) return `<svg viewBox="0 0 34 16"><rect x="1.5" y="2" width="31" height="12" fill="${k.fill}" stroke="${k.color}" stroke-width="0.8"/></svg>`;
  if (k.dash) return `<svg viewBox="0 0 34 16"><line x1="1" y1="${y}" x2="33" y2="${y}" stroke="${k.color}" stroke-width="${w}" stroke-dasharray="${k.dash.split(/[ ,]+/).map(v => v * 0.9).join(' ')}"/></svg>`;
  if (k.casing) s += `<line x1="1" y1="${y}" x2="33" y2="${y}" stroke="${k.casing}" stroke-width="${k.casingW * 1.1}"/>`;
  s += `<line x1="1" y1="${y}" x2="33" y2="${y}" stroke="${k.color}" stroke-width="${w}" ${k.casing ? '' : 'stroke-linecap="round"'}/>`;
  if (k.tick) for (let x = 3; x <= 31; x += 3.5) s += `<line x1="${x}" y1="${y - k.tick * 0.55}" x2="${x}" y2="${y + k.tick * 0.55}" stroke="${k.color}" stroke-width="0.7"/>`;
  if (k.cross) [3, 31].forEach(x => { s += `<path d="M${x - 3} ${y - 3}L${x + 3} ${y + 3}M${x - 3} ${y + 3}L${x + 3} ${y - 3}" stroke="${k.color}" stroke-width="0.9"/>`; });
  return `<svg viewBox="0 0 34 16">${s}</svg>`;
}
function symSvg(kind, o) {
  if (kind === 'line') {
    return `<svg viewBox="0 0 34 16"><line x1="1" y1="8" x2="33" y2="8" stroke="${o.color}" stroke-width="${Math.max(1.2, o.width)}" ${o.dash ? `stroke-dasharray="${o.dash}"` : ''} stroke-linecap="round"/>${o.color.toLowerCase() === '#ffffff' ? `<line x1="1" y1="8" x2="33" y2="8" stroke="#999" stroke-width="${Math.max(1.2, o.width) + 1}" stroke-opacity=".35"/><line x1="1" y1="8" x2="33" y2="8" stroke="#fff" stroke-width="${Math.max(1.2, o.width)}"/>` : ''}</svg>`;
  }
  if (kind === 'point') return `<svg viewBox="0 0 34 16"><circle cx="17" cy="8" r="5" fill="${o.fill}" stroke="${o.stroke}" stroke-width="1"/></svg>`;
  return `<svg viewBox="0 0 34 16"><rect x="1.5" y="1.5" width="31" height="13" fill="${o.fill}" fill-opacity="${o.opacity}" stroke="${o.stroke}" stroke-width="${Math.min(2.6, Math.max(0.8, o.weight))}" ${o.dash ? 'stroke-dasharray="4 3"' : ''}/></svg>`;
}
/* apakah garis benar-benar melintas di dalam bingkai peta (Cohen–Sutherland) */
function lineInView(lls, b) {
  if (lls.length && Array.isArray(lls[0])) return lls.some(part => lineInView(part, b));
  const W = b.getWest(), E = b.getEast(), Sx = b.getSouth(), N = b.getNorth();
  const code = (x, y) => (x < W ? 1 : x > E ? 2 : 0) | (y < Sx ? 4 : y > N ? 8 : 0);
  for (let i = 0; i < lls.length; i++) {
    if (code(lls[i].lng, lls[i].lat) === 0) return true;
    if (i === 0) continue;
    let x0 = lls[i - 1].lng, y0 = lls[i - 1].lat, x1 = lls[i].lng, y1 = lls[i].lat;
    let c0 = code(x0, y0), c1 = code(x1, y1);
    for (let k = 0; k < 6; k++) {
      if (!(c0 | c1)) return true;
      if (c0 & c1) break;
      const c = c0 || c1; let x, y;
      if (c & 8) { x = x0 + (x1 - x0) * (N - y0) / (y1 - y0); y = N; }
      else if (c & 4) { x = x0 + (x1 - x0) * (Sx - y0) / (y1 - y0); y = Sx; }
      else if (c & 2) { y = y0 + (y1 - y0) * (E - x0) / (x1 - x0); x = E; }
      else { y = y0 + (y1 - y0) * (W - x0) / (x1 - x0); x = W; }
      if (c === c0) { x0 = x; y0 = y; c0 = code(x0, y0); } else { x1 = x; y1 = y; c1 = code(x1, y1); }
    }
  }
  return false;
}
function updateLegend() {
  const blocks = [];
  const item = (sym, label, attrs = '') => `<div class="lg-item" ${attrs}><span class="lg-sym">${sym}</span><span class="lg-label">${esc(label)}</span></div>`;
  // satu grup = satu blok utuh (judul + semua isinya tidak boleh terpisah kolom)
  const block = (title, items, attrs = '') => { if (items.length) blocks.push(`<div class="lg-block" ${attrs}>${title ? `<div class="lg-group">${esc(title)}</div>` : ''}${items.join('')}</div>`); };
  const vb = map.getBounds();
  // 1) lokasi (perumahan dsb.) ditaruh paling atas karena tema utama peta
  const groups = [];
  S.layers.filter(l => l.visible && l.legend && l.data.features.length).forEach(l => {
    let g = groups.find(x => x.name === l.group); if (!g) groups.push(g = { name: l.group, items: [] }); g.items.push(l);
  });
  // nama sama dalam satu grup → cukup satu baris legenda
  groups.forEach(g => { const seen = new Set(); g.items = g.items.filter(l => { const k = l.name.trim().toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; }); });
  groups.forEach(g => block(g.name, g.items.map(l =>
    item(symSvg(l.kind, { fill: l.color, stroke: l.stroke || l.color, opacity: l.fillOpacity, weight: l.weight, color: l.color, width: l.weight, dash: l.dash ? '5 3' : null }), l.name, `data-layer="${l.id}"`)),
    `data-group="${esc(g.name)}"`));
  // 2) jaringan & batas referensi (hanya kelas yang tampak di bingkai peta)
  for (const key of Object.keys(S.ref)) {
    const cfg = S.ref[key], g = R.refMain && R.refMain[key];
    if (!cfg.visible || !g || !R.refGroups[key]) continue;
    const present = new Set();
    g.eachLayer(l => {
      const cls = l.feature.properties[cfg.field];
      if (present.has(cls) || !l.getBounds || !vb.intersects(l.getBounds())) return;
      if (lineInView(l.getLatLngs(), vb)) present.add(cls);
    });
    block(S.groupTitles[key], Object.keys(cfg.classes).filter(c => present.has(c) && cfg.classes[c].visible !== false)
      .map(c => item(refSymSvg(cfg.classes[c]), cfg.classes[c].label || c, `data-ref="${key}" data-cls="${esc(c)}"`)), `data-ref="${key}"`);
  }
  // 3) keterangan inset (opsional)
  if (S.insetLegend && R.insetDesa) {
    const dl = lokasiDesa();
    const it = [
      item(symSvg('line', { color: '#000000', width: 1.6 }), 'Batas Kabupaten'),
      item(symSvg('polygon', { fill: '#ffffff', stroke: '#7a7a7a', opacity: 1, weight: 0.8 }), 'Batas Desa'),
      item('<svg viewBox="0 0 34 16"><rect x="1" y="1" width="32" height="14" fill="none" stroke="#ff0000" stroke-width="1.6"/></svg>', S.insetMode === 'follow' ? 'Cakupan Peta' : 'Lokasi Peta')
    ];
    if (dl.length) it.push(item(symSvg('polygon', { fill: '#ff1744', stroke: '#d50000', opacity: S.insetMode === 'follow' ? 0.18 : 0.85, weight: 0.8 }), 'Desa Lokasi (' + dl.map(desaName).join(', ') + ')'));
    block('Keterangan Inset', it);
  }
  $('#legend').innerHTML = blocks.join('');
  fitLegend();
  updateAutoTitle();
}

/* ---------- judul & keterangan lokasi otomatis ----------
   Nama diambil dari layer lokasi yang tampak di bingkai peta; desa/kecamatan dari
   batas desa tempat layer itu berada (atau titik tengah peta bila tidak ada layer). */
function escRe(t) { return t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function cleanName(n) {
  let t = String(n || '').replace(/\(.*?\)/g, '').replace(/^\s*lokasi\s+/i, '');
  const tema = (S.tema || '').trim();
  if (tema) t = t.replace(new RegExp('^\\s*' + escRe(tema) + '\\s+', 'i'), '');
  t = t.replace(/^\s*(perumahan|perum\.?)\s+/i, '');
  return t.replace(/[_]+/g, ' ').replace(/\s+/g, ' ').trim();
}
function joinDan(arr) { return arr.length <= 1 ? arr.join('') : arr.slice(0, -1).join(', ') + ' dan ' + arr[arr.length - 1]; }
function updateAutoTitle() {
  if (!S.autoJudul && !S.autoLokasi) return;
  const vb = map.getBounds();
  const inView = S.layers.filter(l => l.visible && l.data.features.length && R.userGroups[l.id] && vb.intersects(R.userGroups[l.id].getBounds()));
  let changed = false;
  if (S.autoJudul) {
    const src = inView.length ? inView : S.layers.filter(l => l.visible && l.data.features.length);
    const names = [...new Set(src.map(l => cleanName(l.name)).filter(Boolean))];
    const tema = (S.tema || '').trim().toUpperCase();
    const t = 'PETA LOKASI' + (tema ? ' ' + tema : '') + '\n' + (names.length ? joinDan(names).toUpperCase() : 'NAMA ' + (tema || 'LOKASI'));
    if (S.texts.judul !== t) { S.texts.judul = t; $('#txt-judul').value = t; changed = true; }
  }
  if (S.autoLokasi && R.insetDesa) {
    const found = new Map();
    inView.forEach(l => l.data.features.forEach(f => {
      const rp = representativePoint({ features: [f] }); if (!rp) return;
      const ll = L.latLng(rp[1], rp[0]); if (!vb.contains(ll)) return;
      const d = desaAt(ll); if (d) found.set(desaName(d) + '|' + kecName(d), d);
    }));
    if (!found.size) { const d = desaAt(map.getCenter()); if (d) found.set('c', d); }
    let t;
    if (found.size) {
      const byKec = {};
      [...found.values()].forEach(d => { const k = kecName(d); (byKec[k] = byKec[k] || []).push(desaName(d)); });
      const kecs = Object.keys(byKec);
      const desaLine = kecs.length === 1 ? 'Desa ' + joinDan([...new Set(byKec[kecs[0]])]) : kecs.map(k => 'Desa ' + joinDan([...new Set(byKec[k])]) + ' (Kecamatan ' + k + ')').join(', ');
      t = kecs.length === 1 ? `${desaLine}\nKecamatan ${kecs[0]}, Kabupaten Ngawi` : `${desaLine}\nKabupaten Ngawi`;
    } else t = 'Kabupaten Ngawi';
    if (S.texts.lokasi !== t) { S.texts.lokasi = t; $('#txt-lokasi').value = t; changed = true; }
  }
  if (changed) { applyTexts(); save(); }
}

/* legenda mengecil otomatis bila isinya tidak muat di kotak */
function fitLegend() {
  const box = $('.box-legenda'), lg = $('#legend');
  const over = () => box.scrollHeight > box.clientHeight + 1;
  const tryFit = (cols, minFs) => {
    lg.style.columnCount = cols;
    let fs = (S.textStyle && S.textStyle.legend && S.textStyle.legend.size) || (S.orient === 'portrait' ? 7.5 : 8);
    lg.style.fontSize = fs + 'pt';
    while (over() && fs > minFs) { fs -= 0.25; lg.style.fontSize = fs + 'pt'; }
    return !over();
  };
  // 1 kolom dulu; jika terlalu kecil, pecah jadi 2 kolom
  if (!tryFit(1, 6.5)) tryFit(2, 5);
}

/* ---------------------------------------------------------------
   PETA INSET (lokasi di Kabupaten Ngawi)
--------------------------------------------------------------- */
const inset = L.map('inset', {
  zoomControl: false, attributionControl: false, dragging: false, scrollWheelZoom: false,
  doubleClickZoom: false, boxZoom: false, keyboard: false, touchZoom: false, zoomSnap: 0
});
inset.setView([-7.43, 111.39], 9);
async function loadInset() {
  let desa = S.insetData, kab = null;
  try {
    if (!desa) desa = (window.PETA_DATA || {}).desa;
    kab = (window.PETA_DATA || {}).kabupaten;
  } catch (e) { console.warn('Inset', e); }
  if (R.insetBatas) inset.removeLayer(R.insetBatas);
  if (!desa) return;
  R.insetDesa = desa;
  R.insetBatas = L.featureGroup([
    L.geoJSON(desa, { style: { color: '#7a7a7a', weight: 0.35, fillColor: '#ffffff', fillOpacity: 1 }, interactive: false }),
    ...(kab && !S.insetData ? [L.geoJSON(kab, { style: { color: '#000', weight: 1.1, fill: false }, interactive: false })] : [])
  ]).addTo(inset);
  fitInset();
  updateLegend();
}
function fitInset() {
  if (!R.insetBatas) return;
  inset.invalidateSize({ animate: false });
  R.insetMinZoom = inset.getBoundsZoom(R.insetBatas.getBounds(), false, L.point(8, 8));
  // seluruh kabupaten harus muat utuh (tidak terpotong) dengan sedikit ruang tepi
  if (S.insetMode !== 'follow') inset.fitBounds(R.insetBatas.getBounds(), { padding: [7, 7], animate: false });
  updateInset();
}
/* inset mengikuti peta utama: pusat sama, zoom lebih jauh (beberapa level) */
function positionInset() {
  if (!R.insetBatas) return;
  if (S.insetMode === 'follow') {
    // pilih zoom inset agar kotak cakupan peta utama ≈ S.insetBoxFrac dari lebar inset
    const mw = map.getSize().x, iw = inset.getSize().x || 200;
    const z = Math.max(R.insetMinZoom ?? 8, map.getZoom() + Math.log2(S.insetBoxFrac * iw / mw));
    inset.setView(map.getCenter(), z, { animate: false });
  }
}
let insetRaf = 0;
function scheduleInset() { if (!insetRaf) insetRaf = requestAnimationFrame(() => { insetRaf = 0; updateInset(); }); }
/* ---------- cari desa / kelurahan / kecamatan → zoom ke wilayahnya ---------- */
function desaIndex() {
  if (R.desaIdx) return R.desaIdx;
  const items = [];
  const kec = {};
  (R.insetDesa?.features || []).forEach(f => {
    const d = desaName(f), k = kecName(f);
    items.push({ type: 'Desa', name: d, kec: k, feats: [f] });
    (kec[k] = kec[k] || []).push(f);
  });
  Object.keys(kec).forEach(k => items.push({ type: 'Kecamatan', name: k, kec: k, feats: kec[k] }));
  return (R.desaIdx = items);
}
function searchDesa(q) {
  q = q.trim().toLowerCase().replace(/^(desa|kelurahan|kel\.?|kecamatan|kec\.?)\s+/, '');
  if (q.length < 2) return [];
  const all = desaIndex();
  const starts = all.filter(it => it.name.toLowerCase().startsWith(q));
  const inc = all.filter(it => !it.name.toLowerCase().startsWith(q) && it.name.toLowerCase().includes(q));
  return [...starts, ...inc].slice(0, 12);
}
function goToArea(it) {
  const g = L.geoJSON({ type: 'FeatureCollection', features: it.feats });
  const b = g.getBounds();
  fitToBounds(b);
  if (R.searchHi) map.removeLayer(R.searchHi);
  R.searchHi = L.geoJSON({ type: 'FeatureCollection', features: it.feats }, { interactive: false, pmIgnore: true,
    style: { color: '#ff1744', weight: 3, dashArray: '8 5', fill: false } }).addTo(map);
  clearTimeout(R.searchHiT);
  R.searchHiT = setTimeout(() => { if (R.searchHi) { map.removeLayer(R.searchHi); R.searchHi = null; } }, 8000);
  toast(`${it.type} ${it.name}${it.type === 'Desa' ? ', Kecamatan ' + it.kec : ''} – batas ditandai garis merah putus-putus (8 detik).`, 5000);
}
function bindDesaSearch() {
  const q = $('#desa-q'), box = $('#desa-res');
  let results = [], idx = -1;
  const render = () => {
    box.hidden = !results.length;
    box.innerHTML = results.map((it, i) => `<div class="dr ${i === idx ? 'on' : ''}" data-i="${i}"><b>${it.type === 'Desa' ? 'Desa/Kelurahan' : 'Kecamatan'} ${esc(it.name)}</b>${it.type === 'Desa' ? `<small>Kecamatan ${esc(it.kec)}</small>` : `<small>${it.feats.length} desa/kelurahan</small>`}</div>`).join('');
  };
  q.addEventListener('input', () => { results = searchDesa(q.value); idx = results.length ? 0 : -1; render(); });
  q.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { idx = Math.min(results.length - 1, idx + 1); render(); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { idx = Math.max(0, idx - 1); render(); e.preventDefault(); }
    else if (e.key === 'Enter' && results[idx]) { goToArea(results[idx]); box.hidden = true; q.blur(); }
    else if (e.key === 'Escape') { box.hidden = true; }
  });
  box.addEventListener('mousedown', e => {
    const d = e.target.closest('.dr'); if (!d) return; e.preventDefault();
    const it = results[+d.dataset.i]; q.value = it.name; box.hidden = true; goToArea(it);
  });
  q.addEventListener('blur', () => setTimeout(() => { box.hidden = true; }, 150));
}

/* desa tempat titik tengah peta berada (untuk disorot di inset) */
function desaAt(ll) {
  if (!R.insetDesa) return null;
  const p = [ll.lng, ll.lat];
  return R.insetDesa.features.find(f => {
    const g = f.geometry; if (!g) return false;
    const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
    return polys.some(pl => pointInRing(p, pl[0]) && !pl.slice(1).some(h => pointInRing(p, h)));
  }) || null;
}
/* nama desa/kecamatan dari atribut batas desa */
const desaName = f => { const p = f.properties || {}; return p.DESA || p.NAMOBJ || p.WADMKD || p.Desa || p.desa || ''; };
const kecName = f => { const p = f.properties || {}; return p.KECAMATAN || p.WADMKC || p.Kecamatan || ''; };
/* desa tempat lokasi perumahan berada (dari layer yang di-upload/digambar) */
function lokasiDesa() {
  if (!R.insetDesa) return [];
  const found = new Map();
  S.layers.filter(l => l.visible && l.data.features.length).forEach(l => {
    l.data.features.forEach(f => {
      const rp = representativePoint({ features: [f] });
      if (!rp) return;
      const d = desaAt(L.latLng(rp[1], rp[0]));
      if (d) found.set(desaName(d) + '|' + kecName(d), d);
    });
  });
  return [...found.values()];
}
function lokasiDesaText(list) {
  if (!list.length) return '';
  const byKec = {};
  list.forEach(d => { (byKec[kecName(d)] = byKec[kecName(d)] || []).push(desaName(d)); });
  // urutan: Desa …, Kecamatan …, (lalu Kabupaten Ngawi dari teks keterangan inset)
  return Object.entries(byKec).map(([k, ds]) => `Desa ${joinDan([...new Set(ds)])}${k ? ', Kecamatan ' + k : ''}`).join('; ') + ', ';
}
function updateInset() {
  positionInset();
  if (R.insetOverlay) inset.removeLayer(R.insetOverlay);
  const grp = L.layerGroup();
  const follow = S.insetMode === 'follow';
  const desaList = lokasiDesa();
  const auto = $('#out-inset-desa');
  if (auto) {
    const t = S.insetAutoDesa ? lokasiDesaText(desaList) : '';
    if (auto.textContent !== t) { auto.textContent = t; requestAnimationFrame(fitInset); return; }   // judul berubah tinggi → pas-kan ulang
  }
  if (desaList.length) {
    // desa lokasi diarsir merah + dikotakin merah
    const dg = L.geoJSON({ type: 'FeatureCollection', features: desaList }, {
      style: follow ? { color: '#d50000', weight: 1.6, fillColor: '#ff1744', fillOpacity: 0.18 }
                    : { color: '#d50000', weight: 0.8, fillColor: '#ff1744', fillOpacity: 0.85 }, interactive: false
    }).addTo(grp);
  }
  if (!follow) {
    // kotak merah = posisi peta utama; ikut bergeser & berubah ukuran saat peta digeser / di-zoom
    const b = map.getBounds();
    const p1 = inset.latLngToContainerPoint(b.getNorthWest()), p2 = inset.latLngToContainerPoint(b.getSouthEast());
    const min = 12;
    let x0 = p1.x, y0 = p1.y, x1 = p2.x, y1 = p2.y;
    if (x1 - x0 < min) { const c = (x0 + x1) / 2; x0 = c - min / 2; x1 = c + min / 2; }
    if (y1 - y0 < min) { const c = (y0 + y1) / 2; y0 = c - min / 2; y1 = c + min / 2; }
    if ([x0, y0, x1, y1].every(isFinite) && inset.getSize().x > 0)
      L.rectangle([inset.containerPointToLatLng([x0, y0]), inset.containerPointToLatLng([x1, y1])],
        { color: '#ff0000', weight: 1.6, fill: false, interactive: false }).addTo(grp);
  }
  if (follow) {
    // kotak = cakupan peta utama, bergerak & berubah ukuran saat peta digeser/di-zoom
    L.rectangle(map.getBounds(), { color: '#ff0000', weight: 1.8, fill: false, interactive: false }).addTo(grp);
    // nama desa di sekitar lokasi
    const vb = inset.getBounds(); const lbls = [];
    (R.insetDesa?.features || []).forEach(f => {
      const rp = representativePoint({ features: [f] }); if (!rp) return;
      if (vb.contains([rp[1], rp[0]])) lbls.push([rp, desaName(f)]);
    });
    if (lbls.length <= 45) lbls.forEach(([rp, n]) => L.marker([rp[1], rp[0]], {
      icon: L.divIcon({ className: 'inset-lbl', html: `<span>${esc(n)}</span>`, iconSize: [0, 0] }), interactive: false, keyboard: false
    }).addTo(grp));
  }
  R.insetOverlay = grp.addTo(inset);
}

/* ---------------------------------------------------------------
   UPLOAD FILE (KML / KMZ / SHP / GeoJSON)
--------------------------------------------------------------- */
function cleanFC(fc) {
  if (Array.isArray(fc)) fc = { type: 'FeatureCollection', features: fc.flatMap(x => x.features || []) };
  if (fc.type === 'Feature') fc = { type: 'FeatureCollection', features: [fc] };
  if (fc.type !== 'FeatureCollection' && fc.type && fc.coordinates) fc = { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: fc }] };
  fc.features = (fc.features || []).filter(f => f && f.geometry);
  // buang properti styling KML yang tidak perlu
  fc.features.forEach(f => { f.properties = f.properties || {}; ['styleUrl', 'styleHash', 'styleMapHash', 'stroke', 'stroke-opacity', 'stroke-width', 'fill', 'fill-opacity', 'icon'].forEach(k => delete f.properties[k]); });
  return { type: 'FeatureCollection', features: fc.features };
}
function checkCoords(fc) {
  const rp = representativePoint(fc);
  return rp && Math.abs(rp[0]) <= 180 && Math.abs(rp[1]) <= 90;
}
function addFromGeoJSON(fc, name) {
  fc = cleanFC(fc);
  if (!fc.features.length) { toast(`"${name}" tidak berisi geometri.`); return null; }
  if (!checkCoords(fc)) { toast(`"${name}": koordinat tidak dikenali. Sertakan file .prj atau gunakan WGS84.`, 5000); return null; }
  const nm = name.replace(/\.(kml|kmz|zip|shp|geojson|json)$/i, '').replace(/_/g, ' ');
  // file yang sama di-upload lagi → jangan dobel
  const sig = JSON.stringify(fc.features.map(f => f.geometry));
  const dup = S.layers.find(l => JSON.stringify(l.data.features.map(f => f.geometry)) === sig);
  if (dup) { toast(`"${nm}" sudah ada di peta (layer "${dup.name}") – tidak ditambahkan lagi.`, 5000); return null; }
  const ly = newLayer(nm, fc);
  renderUserLayer(ly);
  return ly;
}
async function parseKmlText(txt) {
  const dom = new DOMParser().parseFromString(txt, 'text/xml');
  return toGeoJSON.kml(dom);
}
async function handleFiles(fileList, asRef) {
  const files = [...fileList];
  const added = [];
  const lower = f => f.name.toLowerCase();
  const baseName = f => f.name.replace(/\.[^.]+$/, '');
  try {
    // SHP lepas (.shp + .dbf + .prj)
    for (const f of files.filter(f => lower(f).endsWith('.shp'))) {
      const b = baseName(f).toLowerCase();
      const part = ext => files.find(x => lower(x) === b + ext);
      const prj = part('.prj') ? await part('.prj').text() : undefined;
      const geoms = shp.parseShp(await f.arrayBuffer(), prj);
      const props = part('.dbf') ? shp.parseDbf(await part('.dbf').arrayBuffer(), part('.cpg') ? await part('.cpg').arrayBuffer() : undefined) : geoms.map(() => ({}));
      const ly = addFromGeoJSON(shp.combine([geoms, props]), baseName(f)); if (ly) added.push(ly);
      if (!prj) toast('Peringatan: file .prj tidak ada, dianggap WGS84.', 4000);
    }
    for (const f of files) {
      const n = lower(f);
      let ly = null;
      if (n.endsWith('.zip')) {
        const res = await shp(await f.arrayBuffer());
        const arr = Array.isArray(res) ? res : [res];
        arr.forEach(fc => { const l = addFromGeoJSON(fc, (fc.fileName || baseName(f)).split('/').pop()); if (l) added.push(l); });
      } else if (n.endsWith('.kml')) {
        ly = addFromGeoJSON(await parseKmlText(await f.text()), baseName(f));
      } else if (n.endsWith('.kmz')) {
        const zip = await JSZip.loadAsync(await f.arrayBuffer());
        const kmlName = Object.keys(zip.files).find(k => k.toLowerCase().endsWith('.kml'));
        if (!kmlName) throw new Error('KMZ tidak berisi .kml');
        ly = addFromGeoJSON(await parseKmlText(await zip.file(kmlName).async('text')), baseName(f));
      } else if (/\.(xlsx|xls|csv|ods)$/.test(n)) {
        await openXY(f);
      } else if (n.endsWith('.geojson') || n.endsWith('.json')) {
        ly = addFromGeoJSON(JSON.parse(await f.text()), baseName(f));
      }
      if (ly) added.push(ly);
    }
  } catch (e) {
    console.error(e); toast('Gagal membaca file: ' + e.message, 5000);
  }
  if (added.length && !asRef) {
    fitToBounds(userBounds());
    // label lokasi & koordinat langsung dibuat (bisa dimatikan per layer)
    if (S.autoLabels) added.forEach((ly, i) => { if (ly.kind !== 'point') autoLabelsForLayer(ly, i); });
    renderLayerList(); updateInset();
    updateLegend(); save();
    toast(`${added.length} layer ditambahkan${S.autoLabels ? ' + label lokasi & koordinat' : ''}.`);
  }
}

/* ekspor layer */
function download(name, content, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type }));
  a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
function toKml(ly) {
  const col = c => { const h = c.replace('#', ''); return h.slice(4, 6) + h.slice(2, 4) + h.slice(0, 2); };
  const alpha = Math.round(ly.fillOpacity * 255).toString(16).padStart(2, '0');
  const coords = r => r.map(p => `${p[0]},${p[1]},0`).join(' ');
  const geomKml = g => {
    switch (g.type) {
      case 'Point': return `<Point><coordinates>${g.coordinates[0]},${g.coordinates[1]},0</coordinates></Point>`;
      case 'LineString': return `<LineString><coordinates>${coords(g.coordinates)}</coordinates></LineString>`;
      case 'Polygon': return `<Polygon>${g.coordinates.map((r, i) => `<${i ? 'innerBoundaryIs' : 'outerBoundaryIs'}><LinearRing><coordinates>${coords(r)}</coordinates></LinearRing></${i ? 'innerBoundaryIs' : 'outerBoundaryIs'}>`).join('')}</Polygon>`;
      case 'MultiPoint': case 'MultiLineString': case 'MultiPolygon':
        return `<MultiGeometry>${g.coordinates.map(c => geomKml({ type: g.type.replace('Multi', ''), coordinates: c })).join('')}</MultiGeometry>`;
      case 'GeometryCollection': return `<MultiGeometry>${g.geometries.map(geomKml).join('')}</MultiGeometry>`;
      default: return '';
    }
  };
  const pms = ly.data.features.map((f, i) => {
    const nm = f.properties && (f.properties.name || f.properties.Name || f.properties.NAMOBJ) || `${ly.name} ${i + 1}`;
    const ext = Object.entries(f.properties || {}).map(([k, v]) => `<Data name="${esc(k)}"><value>${esc(v)}</value></Data>`).join('');
    return `<Placemark><name>${esc(nm)}</name><styleUrl>#s</styleUrl><ExtendedData>${ext}</ExtendedData>${geomKml(f.geometry)}</Placemark>`;
  }).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>${esc(ly.name)}</name>
<Style id="s"><LineStyle><color>ff${col(ly.stroke || ly.color)}</color><width>${ly.weight}</width></LineStyle><PolyStyle><color>${alpha}${col(ly.color)}</color></PolyStyle></Style>
${pms}
</Document></kml>`;
}

/* ---------------------------------------------------------------
   SIDEBAR: DAFTAR LAYER
--------------------------------------------------------------- */
function renderLayerList() {
  const el = $('#layer-list');
  if (!S.layers.length) { el.innerHTML = '<p class="hint">Belum ada layer. Upload file atau buat layer kosong lalu gambar dengan alat di kiri atas peta.</p>'; return; }
  el.innerHTML = S.layers.map(l => `
    <div class="card ${l.id === S.activeLayer ? 'active' : ''}" data-id="${l.id}">
      <div class="card-head">
        <input type="checkbox" data-k="visible" ${l.visible ? 'checked' : ''} title="Tampilkan">
        <input type="text" data-k="name" value="${esc(l.name)}" title="Nama (dipakai di legenda)">
      </div>
      <label class="stdsel">Warna standar Permen ATR/BPN 14/2021
        <select data-k="std">
          <option value="">— pilih zona perumahan —</option>
          ${STD_PERUMAHAN.map(([c, n]) => `<option value="${c}" ${l.color.toLowerCase() === c ? 'selected' : ''}>${n}</option>`).join('')}
        </select>
      </label>
      <div class="grid2">
        <div class="sw-wrap" style="grid-column:1/-1">Pilih warna cepat:${swatches('data-swatch', l.color)}</div>
        <label>Warna isi<input type="color" data-k="color" value="${l.color}"></label>
        <label>Warna garis<input type="color" data-k="stroke" value="${l.stroke || l.color}"></label>
        <label>Transparansi isi<input type="range" min="0" max="1" step="0.05" data-k="fillOpacity" value="${l.fillOpacity}"></label>
        <label>Tebal garis<input type="range" min="0" max="6" step="0.2" data-k="weight" value="${l.weight}"></label>
        <label>Grup legenda<input type="text" data-k="group" value="${esc(l.group)}"></label>
        <label style="display:flex;flex-direction:column;gap:3px">
          <span><input type="checkbox" data-k="dash" ${l.dash ? 'checked' : ''}> Garis putus</span>
          <span><input type="checkbox" data-k="legend" ${l.legend ? 'checked' : ''}> Di legenda</span>
        </label>
      </div>
      <div class="lbl-toggles">
        <label class="chk"><input type="checkbox" data-lbl="name" ${layerLabel(l, 'name') ? 'checked' : ''}> Label lokasi</label>
        <label class="chk"><input type="checkbox" data-lbl="coord" ${layerLabel(l, 'coord') ? 'checked' : ''}> Label koordinat</label>
      </div>
      <div class="conv">Ubah jadi:
        <button data-conv="point" ${l.kind === 'point' ? 'disabled' : ''}>• Titik</button>
        <button data-conv="line" ${l.kind === 'line' ? 'disabled' : ''}>〰 Garis</button>
        <button data-conv="polygon" ${l.kind === 'polygon' ? 'disabled' : ''}>▱ Poligon</button>
      </div>
      <div class="btns">
        <button data-a="edit" class="${R.editing === l.id ? 'on' : ''}">${R.editing === l.id ? '✔ Selesai edit' : '✏️ Edit bentuk'}</button>
        <button data-a="addpoly" title="Gambar bidang baru untuk perumahan ini">＋ Tambah bidang</button>
        <button data-a="zoom">🎯 Zoom</button>

        <button data-a="split">✂️ Pisah per atribut</button>
        <button data-a="up">▲</button><button data-a="down">▼</button>
        <button data-a="kml">⬇ KML</button>
        <button data-a="geojson">⬇ GeoJSON</button>
        <button data-a="del" class="danger">🗑️</button>
      </div>
      <div class="meta">${l.data.features.length} fitur · ${l.kind}</div>
    </div>`).join('');
}
$('#layer-list').addEventListener('input', e => {
  const card = e.target.closest('.card'); if (!card) return;
  const ly = S.layers.find(l => l.id === card.dataset.id);
  if (e.target.dataset.lbl) { setLayerLabel(ly, e.target.dataset.lbl, e.target.checked, S.layers.indexOf(ly)); return; }
  const k = e.target.dataset.k; if (!k) return;
  const v = e.target.type === 'checkbox' ? e.target.checked : e.target.type === 'range' ? Number(e.target.value) : e.target.value;
  if (k === 'std') {
    if (!v) return;
    ly.color = v; ly.stroke = null;
    renderUserLayer(ly); renderLayerList(); updateLegend(); save(); return;
  }
  ly[k] = v;
  if (k === 'name') { refreshLayerLabels(ly); updateLegend(); save(); return; }
  if (k === 'group') { updateLegend(); save(); return; }
  if (k === 'color' && !ly.stroke) { /* garis ikut warna isi */ }
  renderUserLayer(ly); updateLegend(); updateInset(); save();
});
$('#layer-list').addEventListener('click', e => {
  const btn = e.target.closest('button'); if (!btn) return;
  const card = btn.closest('.card'); const idx = S.layers.findIndex(l => l.id === card.dataset.id); const ly = S.layers[idx];
  if (btn.dataset.conv) { convertLayer(ly, btn.dataset.conv); return; }
  if (btn.dataset.swatch) { ly.color = btn.dataset.swatch; ly.stroke = null; renderUserLayer(ly); renderLayerList(); updateLegend(); save(); return; }
  switch (btn.dataset.a) {
    case 'edit': toggleEditLayer(ly.id); break;
    case 'addpoly': S.activeLayer = ly.id; renderLayerList(); map.pm.enableDraw(ly.kind === 'line' ? 'Line' : ly.kind === 'point' ? 'Marker' : 'Polygon'); toast('Gambar bidang baru untuk "' + ly.name + '".'); break;
    case 'zoom': { const g = R.userGroups[ly.id]; if (g) fitToBounds(g.getBounds()); break; }
    case 'labels': autoLabelsForLayer(ly); break;
    case 'split': splitLayer(ly); break;
    case 'up': if (idx > 0) { S.layers.splice(idx, 1); S.layers.splice(idx - 1, 0, ly); } renderAllUserLayers(); renderLayerList(); updateLegend(); break;
    case 'down': if (idx < S.layers.length - 1) { S.layers.splice(idx, 1); S.layers.splice(idx + 1, 0, ly); } renderAllUserLayers(); renderLayerList(); updateLegend(); break;
    case 'kml': download(ly.name + '.kml', toKml(ly), 'application/vnd.google-earth.kml+xml'); break;
    case 'geojson': download(ly.name + '.geojson', JSON.stringify(ly.data), 'application/geo+json'); break;
    case 'del':
      if (!confirm(`Hapus layer "${ly.name}"?`)) return;
      S.layers.splice(idx, 1); const g = R.userGroups[ly.id]; if (g) { g.eachLayer(l => map.removeLayer(l)); map.removeLayer(g); } delete R.userGroups[ly.id];
      removeLayerLabels(ly.id);
      if (S.activeLayer === ly.id) S.activeLayer = S.layers[0]?.id || null;
      renderLayerList(); updateLegend(); updateInset(); break;
  }
  save();
});
/* ubah tipe geometri layer: titik ⇄ garis ⇄ poligon */
function convertLayer(ly, to) {
  const feats = ly.data.features;
  const props0 = feats[0]?.properties || {};
  const same = (a, b) => a[0] === b[0] && a[1] === b[1];
  const xy = c => [c[0], c[1]];
  let out = [];
  if (ly.kind === 'point') {
    const pts = feats.flatMap(f => f.geometry.type === 'Point' ? [xy(f.geometry.coordinates)] : f.geometry.coordinates.map(xy));
    if (to === 'line') {
      if (pts.length < 2) { toast('Minimal 2 titik untuk membuat garis.'); return; }
      out = [{ type: 'Feature', properties: { name: ly.name }, geometry: { type: 'LineString', coordinates: pts } }];
    } else if (to === 'polygon') {
      if (pts.length < 3) { toast('Minimal 3 titik untuk membuat poligon.'); return; }
      const ring = same(pts[0], pts[pts.length - 1]) ? pts : [...pts, pts[0]];
      out = [{ type: 'Feature', properties: { name: ly.name }, geometry: { type: 'Polygon', coordinates: [ring] } }];
    }
  } else {
    // garis / poligon → kumpulan cincin/garis
    const parts = [];
    feats.forEach(f => {
      const g = f.geometry, p = f.properties || {};
      if (g.type === 'LineString') parts.push([g.coordinates.map(xy), p]);
      else if (g.type === 'MultiLineString') g.coordinates.forEach(c => parts.push([c.map(xy), p]));
      else if (g.type === 'Polygon') parts.push([g.coordinates[0].map(xy), p]);
      else if (g.type === 'MultiPolygon') g.coordinates.forEach(c => parts.push([c[0].map(xy), p]));
    });
    if (to === 'point') {
      parts.forEach(([c, p]) => {
        const pts = c.length > 1 && same(c[0], c[c.length - 1]) ? c.slice(0, -1) : c;
        pts.forEach((pt, i) => out.push({ type: 'Feature', properties: { ...p, URUT: i + 1, X: +pt[0].toFixed(6), Y: +pt[1].toFixed(6) }, geometry: { type: 'Point', coordinates: pt } }));
      });
    } else if (to === 'polygon') {
      parts.forEach(([c, p]) => {
        if (c.length < 3) return;
        const ring = same(c[0], c[c.length - 1]) ? c : [...c, c[0]];
        out.push({ type: 'Feature', properties: p, geometry: { type: 'Polygon', coordinates: [ring] } });
      });
    } else if (to === 'line') {
      parts.forEach(([c, p]) => out.push({ type: 'Feature', properties: p, geometry: { type: 'LineString', coordinates: c } }));
    }
  }
  if (!out.length) { toast('Tidak bisa diubah.'); return; }
  ly.data = { type: 'FeatureCollection', features: out };
  ly.kind = geomKind(ly.data);
  if (ly.kind === 'polygon') { ly.weight = 2.4; ly.fillOpacity = 0.25; } else if (ly.kind === 'line') ly.weight = 3;
  renderUserLayer(ly);
  // pindahkan label lokasi/koordinat ke bentuk baru
  const hadName = !!layerLabel(ly, 'name'), hadCoord = !!layerLabel(ly, 'coord');
  removeLayerLabels(ly.id);
  if (hadName) setLayerLabel(ly, 'name', true, S.layers.indexOf(ly));
  if (hadCoord) setLayerLabel(ly, 'coord', true, S.layers.indexOf(ly));
  renderLayerList(); updateLegend(); updateInset(); save();
  toast(`"${ly.name}" diubah menjadi ${{ point: 'titik', line: 'garis', polygon: 'poligon' }[ly.kind]}.`);
}

/* ---------------------------------------------------------------
   IMPOR TITIK XY DARI EXCEL / CSV
--------------------------------------------------------------- */
/* UTM (WGS84) → lintang/bujur */
function utmToLatLng(E, N, zone, south) {
  const a = 6378137, f = 1 / 298.257223563, k0 = 0.9996;
  const e2 = f * (2 - f), ep2 = e2 / (1 - e2);
  const x = E - 500000, y = south ? N - 10000000 : N;
  const M = y / k0, mu = M / (a * (1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 ** 3 / 256));
  const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
  const p1 = mu + (3 * e1 / 2 - 27 * e1 ** 3 / 32) * Math.sin(2 * mu) + (21 * e1 * e1 / 16 - 55 * e1 ** 4 / 32) * Math.sin(4 * mu)
    + (151 * e1 ** 3 / 96) * Math.sin(6 * mu) + (1097 * e1 ** 4 / 512) * Math.sin(8 * mu);
  const C1 = ep2 * Math.cos(p1) ** 2, T1 = Math.tan(p1) ** 2;
  const N1 = a / Math.sqrt(1 - e2 * Math.sin(p1) ** 2), R1 = a * (1 - e2) / (1 - e2 * Math.sin(p1) ** 2) ** 1.5;
  const D = x / (N1 * k0);
  const lat = p1 - (N1 * Math.tan(p1) / R1) * (D * D / 2 - (5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * ep2) * D ** 4 / 24
    + (61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * ep2 - 3 * C1 * C1) * D ** 6 / 720);
  const lon = (D - (1 + 2 * T1 + C1) * D ** 3 / 6 + (5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * ep2 + 24 * T1 * T1) * D ** 5 / 120) / Math.cos(p1);
  return [lat * 180 / Math.PI, (zone * 6 - 183) + lon * 180 / Math.PI];
}
/* angka dari sel: "111,4523" / "-7.40" / DMS 7°24'30"S */
function parseCoord(v) {
  if (typeof v === 'number') return v;
  if (v == null) return NaN;
  let t = String(v).trim();
  const dms = t.match(/^(-?\d+(?:[.,]\d+)?)\s*[°d:\s]\s*(\d+(?:[.,]\d+)?)?\s*['m:\s]?\s*(\d+(?:[.,]\d+)?)?\s*["s]?\s*([NSEWUTBLnsewutbl])?$/);
  if (dms && (dms[2] || dms[4])) {
    const n = x => parseFloat(String(x || 0).replace(',', '.'));
    let d = Math.abs(n(dms[1])) + n(dms[2]) / 60 + n(dms[3]) / 3600;
    if (/^-/.test(dms[1]) || /[SWsw]|LS|BB/.test(dms[4] || '')) d = -d;
    return d;
  }
  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(t)) t = t.replace(/\./g, '').replace(',', '.');  // 1.234,56
  else t = t.replace(',', '.');
  return parseFloat(t);
}
const XY = { rows: [], cols: [], name: '' };
async function openXY(file) {
  const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' });
  XY.wb = wb; XY.name = file.name.replace(/\.[^.]+$/, '');
  $('#xy-sheet').innerHTML = wb.SheetNames.map(n => `<option>${esc(n)}</option>`).join('');
  $('#xy-name').value = XY.name.replace(/_/g, ' ');
  loadXYSheet(wb.SheetNames[0]);
  $('#xy-modal').hidden = false;
}
function loadXYSheet(name) {
  const rows = XLSX.utils.sheet_to_json(XY.wb.Sheets[name], { defval: '', raw: true });
  XY.rows = rows; XY.cols = rows.length ? Object.keys(rows[0]) : [];
  const opt = sel => XY.cols.map(c => `<option ${c === sel ? 'selected' : ''}>${esc(c)}</option>`).join('');
  const find = re => XY.cols.find(c => re.test(c.trim())) || '';
  const xc = find(/^(x|lon|long|lng|longitude|bujur|easting|e|koordinat.?x|bt)$/i) || find(/bujur|long|lon|x/i);
  const yc = find(/^(y|lat|latitude|lintang|northing|n|koordinat.?y|ls)$/i) || find(/lintang|lat|y/i);
  const nc = find(/^(nama|name|keterangan|ket|lokasi|id|no)$/i);
  $('#xy-x').innerHTML = opt(xc); $('#xy-y').innerHTML = opt(yc);
  $('#xy-label').innerHTML = '<option value="">— tidak ada —</option>' + opt(nc);
  // tebak sistem koordinat dari nilai
  const sx = parseCoord(rows[0]?.[xc]);
  $('#xy-crs').value = Math.abs(sx) > 1000 ? 'utm49s' : 'wgs84';
  previewXY();
}
function xyPoints() {
  const xc = $('#xy-x').value, yc = $('#xy-y').value, crs = $('#xy-crs').value;
  const pts = [], bad = [];
  XY.rows.forEach((r, i) => {
    let x = parseCoord(r[xc]), y = parseCoord(r[yc]);
    if (!isFinite(x) || !isFinite(y)) { if (String(r[xc]).trim() || String(r[yc]).trim()) bad.push(i + 2); return; }
    let lat, lng;
    if (crs === 'wgs84') { lng = x; lat = y; if (Math.abs(lng) <= 90 && Math.abs(lat) > 90) [lng, lat] = [lat, lng]; }
    else if (crs === 'wgs84-swap') { lat = x; lng = y; }
    else { const zone = +crs.match(/\d+/)[0]; [lat, lng] = utmToLatLng(x, y, zone, crs.endsWith('s')); }
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) { bad.push(i + 2); return; }
    pts.push({ lat, lng, props: r });
  });
  return { pts, bad };
}
function previewXY() {
  const { pts, bad } = xyPoints();
  const head = XY.cols.slice(0, 6);
  $('#xy-preview').innerHTML = `<table><tr>${head.map(c => `<th>${esc(c)}</th>`).join('')}</tr>` +
    XY.rows.slice(0, 5).map(r => `<tr>${head.map(c => `<td>${esc(r[c])}</td>`).join('')}</tr>`).join('') + '</table>';
  const c = pts[0];
  $('#xy-info').innerHTML = `${XY.rows.length} baris · <b>${pts.length} titik valid</b>` + (bad.length ? ` · ⚠️ ${bad.length} baris dilewati (baris ${bad.slice(0, 8).join(', ')}${bad.length > 8 ? '…' : ''})` : '') +
    (c ? `<br>Titik pertama: ${c.lng.toFixed(6)}, ${c.lat.toFixed(6)}${desaAt(L.latLng(c.lat, c.lng)) ? ' · Desa ' + esc(desaName(desaAt(L.latLng(c.lat, c.lng)))) : ' · <i>di luar Kabupaten Ngawi?</i>'}` : '');
}
function importXY() {
  const { pts } = xyPoints();
  if (!pts.length) { toast('Tidak ada titik valid. Periksa kolom X/Y dan sistem koordinat.'); return; }
  const lblc = $('#xy-label').value;
  const fc = { type: 'FeatureCollection', features: pts.map((p, i) => ({ type: 'Feature',
    properties: { ...p.props, ...(lblc ? { name: String(p.props[lblc]) } : {}), URUT: i + 1 },
    geometry: { type: 'Point', coordinates: [+p.lng.toFixed(7), +p.lat.toFixed(7)] } })) };
  const ly = newLayer($('#xy-name').value || XY.name, fc);
  renderUserLayer(ly);
  const to = $('#xy-geom').value;
  $('#xy-modal').hidden = true;
  if (to !== 'point') convertLayer(ly, to);
  fitToBounds(R.userGroups[ly.id]?.getBounds());
  if (S.autoLabels && ly.kind !== 'point') autoLabelsForLayer(ly, S.layers.length - 1);
  renderLayerList(); updateLegend(); updateInset(); save();
  toast(`${pts.length} titik dari Excel ditambahkan.`);
}

function splitLayer(ly) {
  const fields = [...new Set(ly.data.features.flatMap(f => Object.keys(f.properties || {})))];
  if (!fields.length) { toast('Layer tidak punya atribut.'); return; }
  const fld = prompt('Pisah berdasarkan atribut apa?\nPilihan: ' + fields.join(', '), fields.includes('name') ? 'name' : fields[0]);
  if (!fld || !fields.includes(fld)) return;
  const groups = {};
  ly.data.features.forEach(f => { const v = String(f.properties?.[fld] ?? '(kosong)'); (groups[v] = groups[v] || []).push(f); });
  const keys = Object.keys(groups);
  if (keys.length > 30 && !confirm(`Akan membuat ${keys.length} layer. Lanjutkan?`)) return;
  const idx = S.layers.indexOf(ly);
  S.layers.splice(idx, 1);
  const g = R.userGroups[ly.id]; if (g) { g.eachLayer(l => map.removeLayer(l)); map.removeLayer(g); } delete R.userGroups[ly.id];
  const hadLabels = S.labels.some(l => l.layerId === ly.id);
  removeLayerLabels(ly.id);
  const made = keys.map(k => { const nl = newLayer(k, { type: 'FeatureCollection', features: groups[k] }); nl.group = ly.group; return nl; });
  renderAllUserLayers();
  if (hadLabels || S.autoLabels) made.forEach((nl, i) => { if (nl.kind !== 'point') autoLabelsForLayer(nl, i); });
  renderLayerList(); updateLegend(); updateInset(); save();
}

/* ---------------------------------------------------------------
   SIDEBAR: DAFTAR LABEL
--------------------------------------------------------------- */
function renderLabelList() {
  const el = $('#label-list');
  if (!S.labels.length) { el.innerHTML = ''; return; }
  el.innerHTML = S.labels.map((lb, i) => `
    <div class="card" data-id="${lb.id}">
      <div class="card-head"><strong style="flex:1">${lb.type === 'coord' ? '📍 Koordinat' : '🏷️ Label'} ${i + 1}</strong>
        ${lb.type === 'coord' ? `<label class="chk" style="margin:0"><input type="checkbox" data-k="auto" ${lb.auto !== false ? 'checked' : ''}> otomatis</label>` : ''}
      </div>
      <textarea data-k="text" rows="${lb.type === 'coord' ? 3 : 2}" ${lb.type === 'coord' && lb.auto !== false ? 'disabled' : ''}>${esc(labelText(lb))}</textarea>
      <div class="grid2">
        <label>Ukuran (pt)<input type="number" min="5" max="30" step="0.5" data-k="size" value="${lb.size}"></label>
        <div class="sw-wrap" style="grid-column:1/-1">Warna teks:${swatches('data-lsw-color', lb.color)}</div>
        <div class="sw-wrap" style="grid-column:1/-1">Warna garis penunjuk:${swatches('data-lsw-line', lb.line)}</div>
        <label>Warna teks<input type="color" data-k="color" value="${lb.color}"></label>
        <label>Warna halo<input type="color" data-k="halo" value="${lb.halo}"></label>
        <label>Warna garis<input type="color" data-k="line" value="${lb.line}"></label>
      </div>
      <div class="grid2">
        <label class="chk"><input type="checkbox" data-k="point" ${(lb.point ?? lb.type === 'coord') ? 'checked' : ''}> Tampilkan titik</label>
        <label class="chk"><input type="checkbox" data-k="follow" ${lb.follow !== false ? 'checked' : ''}> Label ikut titik</label>
      </div>
      <div class="btns"><button data-a="goto">🎯 Ke titik</button><button data-a="del" class="danger">🗑️ Hapus</button></div>
    </div>`).join('');
}
$('#label-list').addEventListener('input', e => {
  const card = e.target.closest('.card'); if (!card) return;
  const lb = S.labels.find(l => l.id === card.dataset.id); const k = e.target.dataset.k; if (!k) return;
  let v = e.target.type === 'checkbox' ? e.target.checked : e.target.type === 'number' ? Number(e.target.value) : e.target.value;
  if (k === 'auto' && !v) lb.text = coordText(lb);
  if (k === 'text') lb.autoText = false;
  lb[k] = v;
  renderLabel(lb);
  if (k === 'auto') renderLabelList();
  save();
});
$('#label-list').addEventListener('click', e => {
  const sw = e.target.closest('.sw');
  if (sw) {
    const lb = S.labels.find(l => l.id === sw.closest('.card').dataset.id);
    if (sw.dataset.lswColor) lb.color = sw.dataset.lswColor; else if (sw.dataset.lswLine) lb.line = sw.dataset.lswLine;
    renderLabel(lb); renderLabelList(); save(); return;
  }
  const g = e.target.closest('button[data-a="goto"]');
  if (g) { const lb = S.labels.find(l => l.id === g.closest('.card').dataset.id); map.panTo(lb.anchor, { animate: false }); return; }
  const btn = e.target.closest('button[data-a="del"]'); if (!btn) return;
  const id = btn.closest('.card').dataset.id;
  removeLabelObj(id); S.labels = S.labels.filter(l => l.id !== id);
  renderLabelList(); save();
});

/* ---------------------------------------------------------------
   SIDEBAR: LAYER REFERENSI
--------------------------------------------------------------- */
function renderRefList() {
  const el = $('#ref-list');
  el.innerHTML = Object.keys(S.ref).map(key => {
    const cfg = S.ref[key];
    const extra = key === 'sungai' ? `<p class="hint" id="sungai-status">${esc(R.sungaiStatus || '')}</p>` :
      key === 'admin' ? `<div class="sides"><label class="chk"><input type="checkbox" data-k="lblkec" ${S.adminLabels.kecamatan ? 'checked' : ''}> Nama kecamatan</label><label class="chk"><input type="checkbox" data-k="lbldesa" ${S.adminLabels.desa ? 'checked' : ''}> Nama desa</label></div>` : '';
    return `<div class="ref-group"><label class="chk" style="margin:0"><input type="checkbox" data-key="${key}" data-k="gvis" ${cfg.visible ? 'checked' : ''}>
        <input type="text" class="gtitle" data-key="${key}" data-k="gtitle" value="${esc(S.groupTitles[key])}"></label></div>` + extra +
      Object.keys(cfg.classes).map(c => {
        const k = cfg.classes[c];
        return `<div class="ref-item" data-key="${key}" data-cls="${esc(c)}">
          <input type="checkbox" data-k="visible" ${k.visible !== false ? 'checked' : ''}>
          <input type="text" data-k="label" value="${esc(k.label || c)}" title="${esc(c)}">
          <input type="color" data-k="color" value="${k.fill || k.color}">
        </div>`;
      }).join('') +
      (key === 'jalan' ? `<div class="road-edit">
          <div class="re-title">✏️ Edit jalan sementara</div>
          <p class="hint">Klik ruas jalan di peta untuk menyembunyikan atau mengubah fungsinya. Tambah ruas baru di bawah ini. Data SHP asli tidak berubah. Perubahan hanya tersimpan di peta/proyek ini.</p>
          <select id="road-cls">${Object.keys(cfg.classes).map(c => `<option value="${esc(c)}" ${c === 'Jalan Lokal Sekunder' ? 'selected' : ''}>${esc(cfg.classes[c].label || c)}</option>`).join('')}</select>
          <input id="road-name" type="text" placeholder="Nama ruas (opsional)">
          <div class="row"><button class="grow" data-road="draw">➕ Gambar jalan baru</button><button data-road="reset" title="Kembalikan semua jalan ke data SHP asli">↺ Asli</button></div>
          <p class="hint re-status">${esc(roadEditStatus())}</p>
        </div>` : `<label class="upload small"><input type="file" data-key="${key}" class="ref-upload" multiple accept=".kml,.kmz,.zip,.shp,.dbf,.prj,.cpg,.shx,.geojson,.json"><span>⬆ Ganti dengan data sendiri (SHP/KML)</span></label>`) +
      (S.refCustom && S.refCustom[key] ? `<button class="wide" data-reset="${key}">↺ Pakai data bawaan lagi</button>` : '');
  }).join('');
}
$('#ref-list').addEventListener('input', e => {
  const k = e.target.dataset.k;
  if (k === 'gvis') { const key = e.target.dataset.key; S.ref[key].visible = e.target.checked; renderRef(key); updateLegend(); save(); return; }
  if (k === 'gtitle') { S.groupTitles[e.target.dataset.key] = e.target.value; updateLegend(); save(); return; }
  if (k === 'lblkec' || k === 'lbldesa') { S.adminLabels[k === 'lblkec' ? 'kecamatan' : 'desa'] = e.target.checked; refreshAdminLabels(); save(); return; }
  if (e.target.classList.contains('ref-upload')) return;
  const row = e.target.closest('.ref-item'); if (!row) return;
  const key = row.dataset.key, cls = row.dataset.cls, c = S.ref[key].classes[cls];
  const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
  if (k === 'color' && c.fill) c.fill = val; else c[k] = val;
  if (k !== 'label') renderRef(key);
  updateLegend(); save();
});

$('#ref-list').addEventListener('change', e => {
  if (!e.target.classList.contains('ref-upload')) return;
  replaceRefData(e.target.dataset.key, e.target.files); e.target.value = '';
});
$('#ref-list').addEventListener('click', e => {
  const rb = e.target.closest('button[data-road]');
  if (rb) {
    if (rb.dataset.road === 'draw') startDrawRoad();
    else if (confirm('Kembalikan semua jalan ke data SHP asli? Semua tambahan/penyembunyian sementara akan dihapus.')) { S.jalanEdits = { removed: [], added: [], reclass: {} }; rebuildJalan(); toast('Jalan kembali sesuai SHP asli.'); }
    return;
  }
  const b = e.target.closest('button[data-reset]'); if (!b) return;
  const key = b.dataset.reset; delete S.refCustom[key];
  if (key === 'sungai') loadSungai();
  else { R.refData[key] = (window.PETA_DATA || {})[{ air: 'sungai', admin: 'admin' }[key]]; renderRef(key); }
  renderRefList(); updateLegend(); save();
});

/* ---------------------------------------------------------------
   HALAMAN: ukuran, orientasi, teks, pratinjau
--------------------------------------------------------------- */
function applyPage() {
  const [w, h] = PAPERS[S.paper] || PAPERS.F4;
  const pw = S.orient === 'landscape' ? h : w, ph = S.orient === 'landscape' ? w : h;
  const root = document.documentElement.style;
  root.setProperty('--pw', pw + 'mm'); root.setProperty('--ph', ph + 'mm');
  $('#page-size-style').textContent = `@page { size: ${pw}mm ${ph}mm; margin: 0; }`;
  const page = $('#page');
  page.classList.toggle('landscape', S.orient === 'landscape');
  page.classList.toggle('portrait', S.orient === 'portrait');
  page.classList.toggle('with-grid', !!S.grid);
  applyMapInset();
  $$('#orientation button').forEach(b => b.classList.toggle('on', b.dataset.v === S.orient));
  const c = map.getCenter();
  map.invalidateSize({ animate: false });
  map.setView(c, zoomForScale(S.scale, c.lat), { animate: false });
  drawNorth(); drawScaleBar(); drawGrid(); fitInset(); updateLegend();
  fitPreview();
  updateExportLabels();
}
/* gaya teks (tebal, miring, garis bawah, ukuran, rata, warna) per elemen lembar peta */
const FMT_TARGETS = {
  instansi: '#out-instansi', judul: '#out-judul', lokasi: '#out-lokasi', sumber: '.box-sumber',
  inset: '#out-inset', insetSub: '#out-inset-sub', legendTitle: '.legend-title', legend: '#legend', scale: '#out-scale'
};
function applyTextStyles() {
  for (const k in FMT_TARGETS) {
    const el = $(FMT_TARGETS[k]); if (!el) continue;
    const st = (S.textStyle || {})[k] || {};
    el.style.fontWeight = st.b == null ? '' : (st.b ? 'bold' : 'normal');
    el.style.fontStyle = st.i ? 'italic' : '';
    el.style.textDecoration = st.u ? 'underline' : '';
    if (k !== 'legend') el.style.fontSize = st.size ? st.size + 'pt' : '';
    el.style.textAlign = st.align || '';
    el.style.color = st.color || '';
    if (k === 'legend') el.style.fontFamily = st.font || '';
    else el.style.fontFamily = st.font || '';
  }
}
function applyTexts() {
  $('#out-instansi').textContent = S.texts.instansi;
  $('#out-judul').textContent = S.texts.judul;
  $('#out-lokasi').textContent = S.texts.lokasi;
  $('#out-sumber').textContent = S.texts.sumber;
  $('#out-inset').textContent = S.texts.inset;
  $('#out-inset-sub').textContent = S.texts.insetSub;
  $('.legend-title').textContent = S.texts.legendTitle || 'Legenda';
  $('#logo-img').src = S.logo || DEFAULT_LOGO;
  applyTextStyles();
  document.title = (S.texts.judul.replace(/\n/g, ' ').trim() || 'Peta Lokasi');
}
function setPreview(scale) {
  R.preview = Math.max(0.2, Math.min(2.5, scale));
  const page = $('#page');
  page.style.transformOrigin = '0 0';
  page.style.transform = `scale(${R.preview})`;
  const holder = $('#page-holder');
  holder.style.width = (page.offsetWidth * R.preview + 48) + 'px';
  holder.style.height = (page.offsetHeight * R.preview + 60) + 'px';
  $('#pv-val').textContent = Math.round(R.preview * 100) + '%';
}
function fitPreview() {
  const ws = $('#workspace'); const page = $('#page');
  const s = Math.min((ws.clientWidth - 48) / page.offsetWidth, (ws.clientHeight - 70) / page.offsetHeight);
  setPreview(s);
}

/* ---------------------------------------------------------------
   CETAK & PNG
--------------------------------------------------------------- */
window.addEventListener('beforeprint', () => { applyTexts(); });
$('#btn-print').onclick = () => {
  toast('Pilih "Simpan sebagai PDF", Margin: Tidak ada, centang "Grafik latar belakang".', 5000);
  setTimeout(() => window.print(), 300);
};
/* Ekspor gambar (PNG / JPG):
   1) ubin citra digambar langsung dari gambar yang sudah termuat di peta (tidak diunduh ulang),
   2) seluruh lembar (garis, label, legenda, panel) dirender di atasnya dengan latar transparan. */
/* gambar seluruh lembar peta ke kanvas (citra + lembar) */
async function renderPageCanvas(reloadTiles = false) {
  const page = $('#page');
  const W = page.offsetWidth, H = page.offsetHeight;
  const ratio = exportRatio();
  const sc = R.preview || 1;
  const cv = document.createElement('canvas');
  cv.width = Math.round(W * ratio); cv.height = Math.round(H * ratio);
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, cv.width, cv.height);
  const pr = page.getBoundingClientRect(), mr = $('#map').getBoundingClientRect();
  const X = v => (v - pr.left) / sc * ratio, Y = v => (v - pr.top) / sc * ratio;
  const tilesImgs = $$('#map .leaflet-tile-pane img').filter(img => {
    if (!img.complete || !img.naturalWidth) return false;
    const r = img.getBoundingClientRect();
    return !(r.right < mr.left || r.left > mr.right || r.bottom < mr.top || r.top > mr.bottom);
  });
  const load = src => new Promise(res => { const im = new Image(); im.crossOrigin = 'anonymous'; im.onload = () => res(im); im.onerror = () => res(null); im.src = src + (src.includes('?') ? '&' : '?') + '_x=' + Date.now(); });
  const sources = reloadTiles ? await Promise.all(tilesImgs.map(img => load(img.src))) : tilesImgs;
  ctx.save();
  ctx.beginPath(); ctx.rect(X(mr.left), Y(mr.top), mr.width / sc * ratio, mr.height / sc * ratio); ctx.clip();
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  tilesImgs.forEach((img, k) => {
    const src = sources[k]; if (!src) return;
    const r = img.getBoundingClientRect();
    ctx.drawImage(src, X(r.left) - 0.25, Y(r.top) - 0.25, r.width / sc * ratio + 0.5, r.height / sc * ratio + 0.5);
  });
  ctx.restore();
  const ov = await htmlToImage.toCanvas(page, {
    pixelRatio: ratio, width: W, height: H, cacheBust: false, skipFonts: true,
    filter: n => !(n.classList && (n.classList.contains('leaflet-tile-pane') || n.classList.contains('leaflet-popup-pane') ||
      (n.classList.contains('leaflet-control') && !n.classList.contains('leaflet-control-attribution')) ||
      n.classList.contains('anchor-handle') || n.classList.contains('marker-icon'))),
    imagePlaceholder: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    style: { transform: 'none', boxShadow: 'none', margin: '0' }
  });
  ctx.drawImage(ov, 0, 0, cv.width, cv.height);
  return cv;
}
const canvasBlob = (cv, type, q) => new Promise((res, rej) => { try { cv.toBlob(res, type, q); } catch (e) { rej(e); } });
async function exportImage(fmt, reloadTiles = false) {
  const page = $('#page');
  const W = page.offsetWidth, H = page.offsetHeight, ratio = exportRatio();
  toast(`Membuat ${fmt.toUpperCase()} (${Math.round(W * ratio)} × ${Math.round(H * ratio)} px)…`, 20000);
  map.closePopup();
  document.body.classList.add('exporting');
  let blob, cv;
  try {
    await new Promise(r => setTimeout(r, 80));
    cv = await renderPageCanvas(reloadTiles);
    try {
      if (fmt === 'pdf') {
        // PDF seukuran kertas (mm) berisi gambar peta resolusi tinggi
        const jpg = await canvasBlob(cv, 'image/jpeg', 0.92);
        if (!jpg) throw new Error('ukuran');
        const url = await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(jpg); });
        const [pw, ph] = [W / PX_PER_MM, H / PX_PER_MM];
        const pdf = new jspdf.jsPDF({ orientation: pw > ph ? 'landscape' : 'portrait', unit: 'mm', format: [Math.min(pw, ph), Math.max(pw, ph)], compress: true });
        pdf.addImage(url, 'JPEG', 0, 0, pw, ph, undefined, 'FAST');
        pdf.setProperties({ title: document.title, creator: 'Peta Lokasi – DPRKP Kabupaten Ngawi' });
        blob = pdf.output('blob');
      } else {
        blob = await canvasBlob(cv, fmt === 'jpg' ? 'image/jpeg' : 'image/png', 0.95);
      }
    } catch (e) {
      if (e && e.name === 'SecurityError' && !reloadTiles) { document.body.classList.remove('exporting'); return exportImage(fmt, true); }
      if (e && e.name === 'SecurityError') throw new Error('server citra tidak mengizinkan ekspor gambar');
      throw e;
    }
    if (!blob) throw new Error('ukuran gambar terlalu besar untuk browser – pilih resolusi lebih kecil');
    const name = (document.title || 'peta-lokasi').replace(/[\\/:*?"<>|]+/g, '').trim();
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name + '.' + fmt;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 8000);
    toast(`${fmt.toUpperCase()} diunduh (${cv.width} × ${cv.height} px).`, 4000);

  } catch (e) {
    console.error(e);
    const msg = e && e.message ? e.message : (e && e.type ? 'ada gambar yang tidak bisa dibaca' : String(e));
    toast('Gagal membuat gambar: ' + msg + '. Coba resolusi lebih kecil atau gunakan Cetak / PDF.', 8000);
  } finally {
    document.body.classList.remove('exporting');
  }
}

/* resolusi ekspor: dpi kertas (1 px CSS = 1/96 inci) atau lebar piksel kustom */
function exportRatio() {
  const v = $('#export-res').value;
  if (v === 'custom') return Math.max(0.5, (Number($('#export-px').value) || 3000) / $('#page').offsetWidth);
  return (Number(v) || 200) / 96;
}
function updateExportLabels() {
  const W = $('#page').offsetWidth, H = $('#page').offsetHeight;
  $$('#export-res option').forEach(o => {
    if (o.value === 'custom') return;
    const r = Number(o.value) / 96;
    const base = o.textContent.split(' (')[0].split(' — ')[0];
    o.textContent = `${base} — ${Math.round(W * r).toLocaleString('id-ID')} × ${Math.round(H * r).toLocaleString('id-ID')} px`;
  });
  $('#export-px').hidden = $('#export-res').value !== 'custom';
}
$('#export-res').onchange = e => { S.exportRes = e.target.value; updateExportLabels(); save(); };
$('#export-px').onchange = e => { S.exportPx = Number(e.target.value); save(); };
$('#btn-png').onclick = () => exportImage('png');
$('#btn-jpg').onclick = () => exportImage('jpg');
$('#btn-pdfimg').onclick = () => exportImage('pdf');

/* ---------------------------------------------------------------
   PROYEK
--------------------------------------------------------------- */
$('#btn-save-project').onclick = () => {
  S.center = [map.getCenter().lat, map.getCenter().lng];
  const nm = (S.texts.judul.split('\n').pop() || 'peta-lokasi').trim().replace(/[^\w\- ]+/g, '').replace(/\s+/g, '_');
  download(`proyek_${nm || 'peta'}.json`, JSON.stringify(S), 'application/json');
};
$('#project-input').onchange = async e => {
  const f = e.target.files[0]; if (!f) return;
  if (f.size > 60 * 1024 * 1024) { toast('File proyek terlalu besar.'); e.target.value = ''; return; }
  try {
    const obj = JSON.parse(await f.text());
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) throw new Error('format');
    clearMapObjects();
    S = mergeState(obj);
    initFromState();
    toast('Proyek dibuka.');
  } catch (err) { toast('File proyek tidak valid.'); }
  e.target.value = '';
};
$('#btn-reset').onclick = () => {
  if (!confirm('Hapus semua layer, label, dan teks lalu mulai dari awal?')) return;
  clearMapObjects();
  S = DEFAULT_STATE();
  initFromState(); save();
};
function clearMapObjects() {
  Object.keys(R.userGroups).forEach(id => { const g = R.userGroups[id]; g.eachLayer(l => map.removeLayer(l)); map.removeLayer(g); });
  R.userGroups = {};
  Object.keys(R.labelObjs).forEach(removeLabelObj);
}

/* ---------------------------------------------------------------
   KONTROL SIDEBAR
--------------------------------------------------------------- */
function bindControls() {
  $('#paper-size').onchange = e => { S.paper = e.target.value; applyPage(); save(); };
  $$('#orientation button').forEach(b => b.onclick = () => { S.orient = b.dataset.v; applyPage(); save(); });

  $('#img-quality').onchange = e => { S.imgQuality = e.target.value; setBasemap(); probeImagery(); save(); };
  const regrid = () => { applyMapInset(); map.invalidateSize({ animate: false }); drawGrid(); updateLegend(); updateInset(); save(); };
  $('#show-grid').onchange = e => { S.grid = e.target.checked; $('#page').classList.toggle('with-grid', S.grid); regrid(); };
  $('#grid-format').onchange = e => { S.gridFormat = e.target.value; regrid(); };
  $('#grid-style').onchange = e => { S.gridStyle = e.target.value; regrid(); };
  $('#grid-interval').onchange = e => { S.gridInterval = e.target.value; regrid(); };
  $('#grid-lat-vertical').onchange = e => { S.gridLatVertical = e.target.checked; regrid(); };
  $('#grid-color').oninput = e => { S.gridColor = e.target.value; drawGrid(); save(); };
  $('#grid-width').oninput = e => { S.gridWidth = Number(e.target.value); drawGrid(); save(); };
  $$('#grid-sides input').forEach(cb => cb.onchange = () => { S.gridSides[cb.dataset.side] = cb.checked; regrid(); });
  $('#free-scale').onchange = e => { S.freeScale = e.target.checked; save(); toast(S.freeScale ? 'Scroll di peta untuk zoom halus. Skala dibulatkan otomatis.' : 'Skala kembali mengikuti angka preset.'); };
  $('#north-style').onchange = e => { S.northStyle = e.target.value; drawNorth(); save(); };
  const sb = (id, key, conv = v => v) => { $(id).onchange = e => { S[key] = e.target.type === 'checkbox' ? e.target.checked : conv(e.target.value); updateScaleUI(); save(); }; };
  sb('#scale-bar-style', 'scaleBarStyle'); sb('#scale-divs', 'scaleDivs'); sb('#scale-unit', 'scaleUnit');
  sb('#scale-unit-short', 'scaleUnitShort'); sb('#scale-dec-comma', 'scaleDecComma'); sb('#scale-text-style', 'scaleTextStyle');
  $('#north-size').oninput = e => { S.northSize = Number(e.target.value); drawNorth(); save(); };
  $('#txt-inset').oninput = e => { S.texts.inset = e.target.value; applyTexts(); save(); };
  $('#txt-inset-sub').oninput = e => { S.texts.insetSub = e.target.value; applyTexts(); save(); };
  $('#inset-mode').onchange = e => { S.insetMode = e.target.value; fitInset(); updateLegend(); save(); };
  $('#inset-zoom').oninput = e => { S.insetBoxFrac = Number(e.target.value) / 100; updateInset(); save(); };
  $('#btn-add-perum').onclick = addPerumahan;
  $('#auto-labels').onchange = e => { S.autoLabels = e.target.checked; save(); };
  $('#xy-input').onchange = e => { const f = e.target.files[0]; if (f) openXY(f); e.target.value = ''; };
  $('#xy-sheet').onchange = e => loadXYSheet(e.target.value);
  ['#xy-x', '#xy-y', '#xy-crs'].forEach(sel => $(sel).onchange = previewXY);
  $('#xy-cancel').onclick = () => { $('#xy-modal').hidden = true; };
  $('#xy-ok').onclick = importXY;
  $('#citra-auto').onchange = e => { S.citraAuto = e.target.checked; applyCitraLine(); save(); };
  $('#inset-auto-desa').onchange = e => { S.insetAutoDesa = e.target.checked; updateInset(); save(); };
  $('#inset-legend').onchange = e => { S.insetLegend = e.target.checked; updateLegend(); save(); };
  $('#btn-transparent').onclick = () => {
    S.layers.forEach(l => { if (l.kind === 'polygon') { l.fillOpacity = 0.25; l.weight = 2.4; l.stroke = null; } });
    renderAllUserLayers(); renderLayerList(); updateLegend(); save();
    toast('Semua poligon: isi transparan, garis batas tegas.');
  };

  $('#scale-input').onchange = e => setScale(e.target.value);
  $('#scale-down').onclick = () => stepScale(-1);
  $('#scale-up').onclick = () => stepScale(1);
  $('#scale-presets').innerHTML = SCALE_PRESETS.slice(0, 12).map(p => `<button data-v="${p}">${fmtNum(p)}</button>`).join('');
  $('#scale-presets').onclick = e => { const b = e.target.closest('button'); if (b) setScale(b.dataset.v); };
  $('#btn-fit').onclick = () => fitToBounds(userBounds());

  $('#file-input').onchange = e => { handleFiles(e.target.files); e.target.value = ''; };
  $('#btn-new-layer').onclick = () => {
    const ly = newLayer(); renderUserLayer(ly); renderLayerList(); save();
    toast('Layer kosong dibuat. Gunakan alat gambar (kiri atas peta).', 4000);
  };
  $('#btn-add-label').onclick = () => startPick('text');
  $('#btn-add-coord').onclick = () => startPick('coord');

  const txt = { '#txt-instansi': 'instansi', '#txt-judul': 'judul', '#txt-lokasi': 'lokasi', '#txt-sumber': 'sumber' };
  for (const sel in txt) $(sel).oninput = e => {
    S.texts[txt[sel]] = e.target.value;
    // diketik manual → mode otomatis kotak itu dimatikan
    if (sel === '#txt-judul' && S.autoJudul) { S.autoJudul = false; $('#auto-judul').checked = false; }
    if (sel === '#txt-lokasi' && S.autoLokasi) { S.autoLokasi = false; $('#auto-lokasi').checked = false; }
    applyTexts(); save();
  };
  $('#tema').oninput = e => {
    const old = S.tema; S.tema = e.target.value.trim();
    S.layers.forEach(l => { if (l.group === old || (!old && !l.group)) l.group = S.tema || 'Lokasi'; });
    updateLegend(); renderLayerList(); updateAutoTitle(); applyTexts(); save();
  };
  $('#auto-judul').onchange = e => { S.autoJudul = e.target.checked; updateAutoTitle(); save(); };
  $('#auto-lokasi').onchange = e => { S.autoLokasi = e.target.checked; updateAutoTitle(); save(); };
  $('#logo-input').onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader(); r.onload = () => { S.logo = r.result; applyTexts(); save(); }; r.readAsDataURL(f);
  };
  $('#btn-logo-reset').onclick = () => { S.logo = null; applyTexts(); save(); };
  $('#btn-ref-std').onclick = () => {
    S.ref = JSON.parse(JSON.stringify(REF_DEFAULTS));
    S.groupTitles = DEFAULT_STATE().groupTitles;
    Object.keys(R.refData).forEach(renderRef); renderRefList(); updateLegend(); save();
    toast('Simbol jalan & sungai dikembalikan ke standar ' + PERMEN_14_2021);
  };


  $('#pv-in').onclick = () => setPreview(R.preview * 1.15);
  $('#pv-out').onclick = () => setPreview(R.preview / 1.15);
  $('#pv-fit').onclick = fitPreview;
  window.addEventListener('resize', () => fitPreview());

  // roda mouse di peta = ganti skala (mengikuti preset)
  map.getContainer().addEventListener('wheel', e => {
    e.preventDefault();
    clearTimeout(R.wheelT);
    if (S.freeScale) {
      // zoom halus 8% per langkah, lalu skala dibulatkan agar angka skala tetap rapi & akurat
      R.wheelT = setTimeout(() => setScale(roundScale(S.scale * (e.deltaY > 0 ? 1.08 : 1 / 1.08))), 20);
    } else {
      R.wheelT = setTimeout(() => stepScale(e.deltaY > 0 ? 1 : -1), 40);
    }
  }, { passive: false });

  // keyboard: + / - untuk zoom (kecuali sedang mengetik)
  document.addEventListener('keydown', e => {
    if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || e.target.isContentEditable || e.ctrlKey || e.metaKey) return;
    if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomStep(-1); }
    else if (e.key === '-' || e.key === '_') { e.preventDefault(); zoomStep(1); }
  });
  // tombol Escape membatalkan mode pilih titik
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && pickMode) { pickMode = null; document.body.classList.remove('picking'); } });

  // upload drag & drop ke area kerja
  const ws = $('#workspace');
  ws.addEventListener('dragover', e => { e.preventDefault(); });
  ws.addEventListener('drop', e => { e.preventDefault(); if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files); });
}

map.on('move zoom', () => { scheduleGrid(); scheduleInset(); });
map.on('moveend', () => { updateImageryInfo(); probeImagery(); refreshAdminLabels(); });
map.on('moveend', () => {
  const c = map.getCenter(); S.center = [c.lat, c.lng];
  drawGrid(); updateLegend(); updateInset(); save();
});

/* ---------------------------------------------------------------
   INISIALISASI
--------------------------------------------------------------- */
function initFromState() {
  if (R.refData && window.PETA_DATA) R.refData.jalan = composeJalan();
  $('#paper-size').value = S.paper;
  S.basemap = 'esri';   // hanya satu citra
  $('#img-quality').value = S.imgQuality;
  $('#show-grid').checked = !!S.grid;
  $('#grid-format').value = S.gridFormat;
  $('#grid-style').value = S.gridStyle;
  $('#grid-interval').value = S.gridInterval;
  $('#grid-lat-vertical').checked = !!S.gridLatVertical;
  $('#grid-color').value = S.gridColor;
  $('#grid-width').value = S.gridWidth;
  $$('#grid-sides input').forEach(cb => cb.checked = !!S.gridSides[cb.dataset.side]);
  $('#free-scale').checked = !!S.freeScale;
  $('#north-style').value = S.northStyle;
  $('#scale-bar-style').value = S.scaleBarStyle; $('#scale-divs').value = S.scaleDivs; $('#scale-unit').value = S.scaleUnit;
  $('#scale-unit-short').checked = !!S.scaleUnitShort; $('#scale-dec-comma').checked = !!S.scaleDecComma; $('#scale-text-style').value = S.scaleTextStyle;
  $('#north-size').value = S.northSize;
  $('#txt-inset').value = S.texts.inset;
  $('#txt-inset-sub').value = S.texts.insetSub;
  $('#inset-auto-desa').checked = !!S.insetAutoDesa;
  $('#citra-auto').checked = !!S.citraAuto;
  $('#auto-labels').checked = !!S.autoLabels;
  $('#export-res').value = S.exportRes || '200';
  $('#export-px').value = S.exportPx || 3000;
  $('#inset-mode').value = S.insetMode;
  $('#inset-zoom').value = Math.round(S.insetBoxFrac * 100);
  $('#inset-legend').checked = !!S.insetLegend;
  $('#scale-input').value = S.scale;
  $('#txt-instansi').value = S.texts.instansi;
  $('#txt-judul').value = S.texts.judul;
  $('#txt-lokasi').value = S.texts.lokasi;
  $('#auto-judul').checked = !!S.autoJudul;
  $('#auto-lokasi').checked = !!S.autoLokasi;
  $('#txt-sumber').value = S.texts.sumber;

  applyTexts();
  setBasemap();
  applyPage();
  map.setView(S.center, zoomForScale(S.scale, S.center[0]), { animate: false });
  Object.keys(R.refData).forEach(renderRef);
  renderAllUserLayers();
  renderAllLabels();
  renderLayerList(); renderLabelList(); renderRefList();
  updateScaleUI(); drawGrid(); updateLegend(); updateInset();
}

bindControls();
bindDesaSearch();
bindPageEditing();
bindFmtBar();
initFromState();
// pas-kan ulang inset setiap ukuran kotaknya berubah (orientasi, judul, kertas)
if ('ResizeObserver' in window) {
  let lastSz = '';
  new ResizeObserver(() => {
    const el = $('#inset'), sz = el.clientWidth + 'x' + el.clientHeight;
    if (sz !== lastSz) { lastSz = sz; fitInset(); }
  }).observe($('#inset'));
}
loadLatestRelease();
loadRefData();
loadInset();

// API kecil untuk debug di console
window.PetaLokasi = { state: () => S, map, inset, setScale, handleFiles };
})();
