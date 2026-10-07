/* =========================================================================
   js/api.js — Helper konsumsi API Praktikum (SIAKAD)
   Base URL : https://api.melangkah.my.id
   Dipakai oleh: asset.html, mahasiswa-api.html, peminjaman.html
   ========================================================================= */

const API_BASE = "https://api.melangkah.my.id";

/* ---------------------------------------------------------------- inti request
   Semua request lewat sini. Melempar Error berisi pesan dari API bila gagal. */
/* Samakan bentuk respons: API Rental PS mengirim {status, message, data},
   API SIAKAD mengirim array/objek langsung -> kembalikan isi "data". */
function unwrap(res) {
  if (res && typeof res === "object" && !Array.isArray(res) &&
      res.data !== undefined && res.data !== null &&
      (Array.isArray(res.data) || typeof res.data === "object")) {
    return res.data;
  }
  return res;
}

async function apiRequest(path, options) {
  options = options || {};
  const method = options.method || "GET";
  const body = "body" in options ? options.body : null;
  const params = options.params || null;

  let url = API_BASE + path;
  if (params) {
    const qs = new URLSearchParams(
      Object.keys(params)
        .filter(function (k) {
          return params[k] !== null && params[k] !== undefined && params[k] !== "";
        })
        .reduce(function (acc, k) { acc[k] = params[k]; return acc; }, {})
    ).toString();
    if (qs) url += url.indexOf("?") > -1 ? "&" + qs : "?" + qs;
  }

  const init = { method: method, headers: { "Content-Type": "application/json", "Accept": "application/json" } };
  if (body !== null && method !== "GET") init.body = JSON.stringify(body);

  let res;
  try {
    res = await fetch(url, init);
  } catch (e) {
    throw new Error("Gagal terhubung ke API. Periksa koneksi internet Anda.");
  }

  const raw = await res.text();
  let data = null;
  try { data = raw ? JSON.parse(raw) : null; } catch (e) { data = raw; }

  if (!res.ok) {
    const err = new Error(
      (data && data.message) || "Permintaan gagal (HTTP " + res.status + ")"
    );
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return unwrap(data);
}

const api = {
  /** GET  — contoh: api.get("/asset/read.php") */
  get: function (path, params) { return apiRequest(path, { params: params }); },
  /** POST — contoh: api.post("/asset/create.php", {...}) */
  post: function (path, body) { return apiRequest(path, { method: "POST", body: body }); },
  /** PUT - contoh: api.put("/unit/update.php", {id_unit: 1, nama_unit: "..."}) */
  put: function (path, body) { return apiRequest(path, { method: "PUT", body: body }); },
  /** DELETE - id dikirim sebagai query string DAN body JSON, supaya kompatibel
      dengan endpoint SIAKAD (baca ?id=) maupun endpoint Rental PS (baca body) */
  del: function (path, params) {
    return apiRequest(path, { method: "DELETE", params: params, body: params || {} });
  }
};

/* ------------------------------------------------------------- utilitarians */
function escapeHtml(v) {
  if (v === null || v === undefined) return "";
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDate(v) {
  if (!v) return "-";
  const s = String(v);
  // "2026-10-02 08:38:23" atau "2026-10-02"
  const d = s.substring(0, 10).split("-");
  if (d.length !== 3) return s;
  const bulan = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
  const i = parseInt(d[1], 10) - 1;
  return parseInt(d[2], 10) + " " + (bulan[i] || d[1]) + " " + d[0];
}

function badge(text, cls) {
  return '<span class="badge badge-' + cls + '">' + escapeHtml(text) + "</span>";
}

/** Badge warna otomatis untuk status yang dipakai API ini. */
function statusBadge(status) {
  const s = String(status || "");
  const map = {
    "Tersedia": "success", "Dikembalikan": "success", "Selesai": "success", "Baik": "success",
    "Dipinjam": "info", "Diproses": "info",
    "Pending": "warning", "Menunggu": "warning", "Rusak Ringan": "warning",
    "Ditolak": "danger", "Rusak Berat": "danger", "Hilang": "danger", "Tidak Tersedia": "danger"
  };
  return badge(s || "-", map[s] || "secondary");
}

/* --------------------------------------------------------------- notifikasi */
function _toastHost() {
  let c = document.getElementById("apiToastHost");
  if (!c) {
    c = document.createElement("div");
    c.id = "apiToastHost";
    c.style.cssText = "position:fixed;top:78px;right:16px;z-index:1080;width:330px;max-width:90vw;";
    document.body.appendChild(c);
  }
  return c;
}

/** Toast sukses / error di pojok kanan atas. Butuh jQuery + bootstrap.bundle. */
function showToast(message, type) {
  type = type || "success";
  const conf = {
    success: { title: "Berhasil", icon: "fa-check-circle", cls: "border-success" },
    danger:  { title: "Gagal",     icon: "fa-times-circle", cls: "border-danger" },
    warning: { title: "Perhatian", icon: "fa-exclamation-triangle", cls: "border-warning" },
    info:    { title: "Informasi", icon: "fa-info-circle", cls: "border-info" }
  }[type] || {};

  const el = document.createElement("div");
  el.className = "toast shadow " + (conf.cls || "");
  el.setAttribute("role", "alert");
  el.setAttribute("aria-live", "assertive");
  el.setAttribute("aria-atomic", "true");
  el.style.cssText = "background:#fff;margin-bottom:.5rem;";
  el.innerHTML =
    '<div class="toast-header ' + (conf.cls || "") + '">' +
      '<i class="fas ' + (conf.icon || "fa-info-circle") + ' mr-2"></i>' +
      '<strong class="mr-auto">' + (conf.title || "Notifikasi") + "</strong>" +
      '<button type="button" class="ml-2 mb-1 close" data-dismiss="toast" aria-label="Close">' +
        '<span aria-hidden="true">&times;</span></button>' +
    "</div>" +
    '<div class="toast-body">' + escapeHtml(message) + "</div>";

  _toastHost().appendChild(el);
  $(el).toast({ delay: 4500, autohide: true }).toast("show");
  $(el).on("hidden.bs.toast", function () { el.remove(); });
}

/** Baris "Memuat data..." / "Gagal memuat" di tengah tabel. */
function loadingRow(colspan) {
  return '<tr><td colspan="' + colspan + '" class="text-center text-muted py-4">' +
    '<i class="fas fa-spinner fa-spin mr-2"></i>Memuat data dari API...</td></tr>';
}
function emptyRow(colspan, msg) {
  return '<tr><td colspan="' + colspan + '" class="text-center text-muted py-4">' +
    '<i class="fas fa-inbox fa-2x mb-2 d-block text-gray-300"></i>' + escapeHtml(msg || "Belum ada data.") +
    "</td></tr>";
}
function errorRow(colspan, msg) {
  return '<tr><td colspan="' + colspan + '" class="text-center py-4">' +
    '<i class="fas fa-exclamation-triangle text-danger mr-2"></i>' +
    escapeHtml(msg || "Gagal memuat data.") + "</td></tr>";
}

/* ------------------------------------------------------------------ DataTable
   Gambar ulang isi tabel + init ulang DataTables (Indonesia). */
function drawTable(tableSel, rowsHtml, opts) {
  const $t = $(tableSel);
  if ($.fn.dataTable.isDataTable(tableSel)) {
    $t.DataTable().clear().destroy();
  }
  $t.find("tbody").html(rowsHtml);

  /* Baris placeholder (loading/empty/error) memakai colspan, dan DataTables
     tidak kompatibel dengan colspan di tbody -> "Cannot set properties of
     undefined (setting '_DT_CellIndex')". Karena itu baris placeholder hanya
     dirender biasa tanpa inisialisasi DataTables; DataTables baru dipasang
     saat baris data asli (jumlah sel = jumlah header) masuk. */
  if (rowsHtml.indexOf("colspan=") > -1) return;

  $t.DataTable(Object.assign({
    order: [],
    columnDefs: [{ orderable: false, targets: [0, -1] }],
    language: {
      emptyTable: "Tidak ada data yang tersedia",
      zeroRecords: "Data tidak ditemukan",
      search: "Cari:",
      lengthMenu: "Tampilkan _MENU_ data",
      info: "Menampilkan _START_ &ndash; _END_ dari _TOTAL_ data",
      infoEmpty: "Menampilkan 0 &ndash; 0 dari 0 data",
      infoFiltered: "(disaring dari _MAX_ total data)",
      paginate: { first: "Awal", last: "Akhir", next: "&raquo;", previous: "&laquo;" }
    }
  }, opts || {}));
}

/* ------------------------------------------------------- ambil nilai form modal
   id  : id atribut elemen (tanpa tanda #)
   Contoh: getFormValues("form-asset") -> {nama_asset: "...", ...} */
function getFormValues(formId) {
  const out = {};
  $("#" + formId + " [data-field]").each(function () {
    out[this.getAttribute("data-field")] = String(this.value || "").trim();
  });
  return out;
}

function setFormValues(formId, data) {
  $("#" + formId + " [data-field]").each(function () {
    const f = this.getAttribute("data-field");
    this.value = data && data[f] !== undefined && data[f] !== null ? data[f] : "";
  });
}

function resetForm(formId) {
  const el = document.getElementById(formId);
  if (el) el.reset();
}