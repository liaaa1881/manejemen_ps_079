# Workflow — Tugas Konsumsi API (SIAKAD)

**Deadline:** Senin, 5 Oktober 2026
**Isi tugas:**
1. CRUD Master Asset
2. CRUD Master Mahasiswa
3. CR Transaksi Peminjaman

**Base URL API:** `https://api.melangkah.my.id`

---

## 1. Struktur File

```
siakad/
├── js/
│   └── api.js              ← helper konsumsi API (BARU)
├── asset.html              ← CRUD Master Asset (BARU)
├── mahasiswa-api.html      ← CRUD Master Mahasiswa (BARU)
├── peminjaman.html         ← CR Transaksi Peminjaman (BARU)
├── index.html              ← sidebar ditambah menu baru
├── mahasiswa.html          ← (lama, data statis, TIDAK diubah)
├── prodi.html              ← sidebar ditambah menu baru
└── penilaian.html          ← sidebar ditambah menu baru
```

> `mahasiswa.html` lama sengaja **tidak ditimpa**. Halaman versi API ada di
> `mahasiswa-api.html`. Jika dosen meminta nama file `mahasiswa.html`, tinggal
> timpa isi `mahasiswa.html` dengan isi `mahasiswa-api.html`.

Template yang dipakai: **SB Admin 2** (Bootstrap 4) — sudah ada di folder
`vendor/`, jadi tidak perlu unduh template dari internet dan tetap konsisten
dengan halaman SIAKAD lainnya.

---

## 2. Workflow Pengembangan

### Langkah 1 — Baca Postman collection
Buka `postman_collection.json` dan catat untuk tiap endpoint:
method, URL, header, dan body. Jangan lupa catat juga **field name**-nya
(`nama_asset` bukan `nama`, `id_peminjaman` bukan `id`).

### Langkah 2 — Tes endpoint langsung (sebelum menulis kode)
Cek response asli lewat browser / Postman, karena struktur JSON sering berbeda
dari yang disangka.

Hasil tes yang saya lakukan:

| Endpoint | Method | Response |
|---|---|---|
| `/asset/read.php` | GET | array `{id, nama_asset, kategori, jumlah, kondisi, lokasi, status, created_at}` |
| `/asset/detail.php?id=` | GET | objek, atau `404 {"message":"..."}` |
| `/asset/create.php` | POST | `201 {"message","id":"38"}` |
| `/asset/update.php` | POST | body + field `id` |
| `/asset/delete.php?id=` | DELETE | `{"message":"Asset berhasil dihapus"}` |
| `/mahasiswa/*` | — | `{id, nim, nama, jurusan, angkatan, email, telepon}` |
| `/peminjaman/read.php` | GET | **sudah JOIN**: `+ nim, nama_mahasiswa, jurusan, id_asset, nama_asset, kategori_asset` |
| `/peminjaman/detail.php?id_peminjaman=` | GET | objek detail |
| `/peminjaman/create.php` | POST | `id_mahasiswa, id_asset, jumlah, tanggal_pinjam, tanggal_kembali, keterangan, status_peminjaman` |

**Catatan penting:** API sudah mengirim header
`Access-Control-Allow-Origin: *`, sehingga frontend statis (HTML biasa) boleh
langsung memanggil API tanpa perlu backend proxy.

### Langkah 3 — Buat helper bersama `js/api.js`
Satu file untuk semua halaman, supaya URL, penanganan error, dan notifikasi
tidak ditulis ulang tiga kali.

Isinya:
- `API_BASE` — base URL
- `api.get(path, params)` / `api.post(path, body)` / `api.del(path, params)`
- `apiRequest()` — membungkus `fetch`, melempar `Error` berisi `message` dari API
  bila status bukan 2xx (ini yang membuat pesan error API muncul di toast)
- `escapeHtml()` — cegah XSS dari data API
- `formatDate()` — `"2026-10-06"` → `"6 Okt 2026"`
- `statusBadge()` — warna badge otomatis per status
- `showToast()` — notifikasi sukses/gagal
- `drawTable()` — render baris + init DataTables (bahasa Indonesia)
- `loadingRow()` / `emptyRow()` / `errorRow()` — baris placeholder
- `getFormValues()` / `setFormValues()` / `resetForm()` — baca/tulis form modal

### Langkah 4 — Buat halaman
Pola tiap halaman sama:

```
HTML (struktur + modal + tabel)
  └─ <script src="js/api.js">
       └─ muatData()          → Read, gambar ke DataTable
       └─ bukaTambah()        → buka modal kosong
       └─ bukaEdit(id)        → GET detail.php → isi modal
       └─ bukaHapus(id)       → konfirmasi → DELETE
       └─ submit handler      → POST create.php ATAU update.php
```

### Langkah 5 — Uji tiap alur lewat browser
Buka `http://localhost/siakad/<halaman>.html`, lalu tes:
Read → Create → Update → Delete, dan pastikan **data benar-benar berubah di
server**, bukan hanya di tampilan (cek ulang lewat `read.php`).

### Langkah 6 — Bersihkan data uji
Hapus semua record yang dibuat saat testing supaya data tugas tetap bersih.

---

## 3. Pemetaan Fitur → Endpoint

### asset.html — CRUD Master Asset
| Aksi | Endpoint |
|---|---|
| Tampil data | `GET /asset/read.php` |
| Tambah | `POST /asset/create.php` |
| Ubah | `GET /asset/detail.php?id=` → `POST /asset/update.php` |
| Hapus | `DELETE /asset/delete.php?id=` |
| Detail (modal) | `GET /asset/detail.php?id=` |

### mahasiswa-api.html — CRUD Master Mahasiswa
| Aksi | Endpoint |
|---|---|
| Tampil data | `GET /mahasiswa/read.php` |
| Tambah | `POST /mahasiswa/create.php` |
| Ubah | `GET /mahasiswa/detail.php?id=` → `POST /mahasiswa/update.php` |
| Hapus | `DELETE /mahasiswa/delete.php?id=` |
| Detail (modal) | `GET /mahasiswa/detail.php?id=` |

### peminjaman.html — CR Transaksi Peminjaman
| Aksi | Endpoint |
|---|---|
| Tampil data | `GET /peminjaman/read.php` |
| Tambah | `POST /peminjaman/create.php` |
| Dropdown Mahasiswa | `GET /mahasiswa/read.php` |
| Dropdown Asset | `GET /asset/read.php` |
| Detail (modal) | `GET /peminjaman/detail.php?id_peminjaman=` |

Sesuai spek tugas hanya **C + R**, jadi tidak ada tombol ubah/hapus.

---

## 4. Cara Menjalankan

1. Pastikan XAMPP (Apache) sudah nyala.
2. Buka `http://localhost/siakad/` → menu sidebar **Tugas Konsumsi API**.
   - `asset.html`
   - `mahasiswa-api.html`
   - `peminjaman.html`
3. Pastikan ada koneksi internet, karena data diambil dari
   `https://api.melangkah.my.id`.

Indikator di pojok kanan atas halaman:
- `● API Terhubung · n data` = koneksi OK
- `● API Error` = cek internet / status API

---

## 5. Bug yang Ditemui & Cara Mengatasinya

**Gejala:** tabel tidak pernah termuat, console error:

```
TypeError: Cannot set properties of undefined (setting '_DT_CellIndex')
```

**Penyebab:** baris placeholder (`Memuat data...`, `Belum ada data`,
`Gagal memuat`) ditulis dengan `<td colspan="8">`, sehingga jumlah sel di
tbody (1) tidak sama dengan jumlah kolom header (8). DataTables tidak
mendukung `colspan` di tbody.

**Hasil tes:**

| Isi tbody | Hasil |
|---|---|
| `<td colspan="8">` | ❌ error |
| 8 sel penuh | ✅ ok |
| tbody kosong | ✅ ok |

**Solusi** (di `js/api.js` → `drawTable`): baris placeholder dirender biasa
tanpa inisialisasi DataTables; DataTables baru dipasang saat baris data asli
masuk.

```js
$t.find("tbody").html(rowsHtml);
if (rowsHtml.indexOf("colspan=") > -1) return;   // ← placeholder dilewati
$t.DataTable({ ... });
```

---

## 6. Catatan Presentasi

Bukti bahwa benar-benar konsumsi API (bukan data dummy):

1. Refresh halaman → jumlah data mengikuti server.
2. Tambah record → refresh → record masih ada (tersimpan di server).
3. Buka DevTools → tab **Network** → terlihat request ke
   `api.melangkah.my.id/asset/read.php` dll.
4. Ubah data dari Postman → tombol **Muat Ulang** → perubahan muncul.
5. Matikan internet → tombol **Muat Ulang** → muncul toast error dari API.
