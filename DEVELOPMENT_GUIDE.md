# Panduan Pengembangan (Development Guide) - KanJabungMRS

Dokumen ini disusun untuk membantu pengembang selanjutnya memahami struktur, standar kode, dan alur pengembangan aplikasi KanJabungMRS.

---

## 🏗️ Struktur Proyek

Aplikasi ini menggunakan arsitektur **Monorepo** (folder terpisah dalam satu repositori):
- `/frontend`: Aplikasi React (Client-side).
- `/backend`: Server Express & Database (Server-side).

---

## 🖥️ Panduan Frontend (/frontend)

Frontend dibangun menggunakan **React + Vite** dengan **TypeScript**. Fokus utama pengembangan di sini adalah antarmuka pengguna (UI) dan integrasi API.

### Struktur Folder Utama
- `src/components`: Komponen UI yang dapat digunakan kembali (reusable). Gunakan subfolder `ui` untuk komponen dasar (button, input, card) dan folder fitur (misal `task/`) untuk komponen spesifik.
- `src/pages`: Halaman-halaman utama aplikasi (sesuai rute/routing).
- `src/store`: State management global menggunakan **Zustand**. File `authStore.ts` menyimpan status login user.
- `src/lib`: Utility functions dan konfigurasi (misal `utils.ts` untuk fungsi helper classname).

### Menambahkan Halaman Baru
1. Buat file komponen baru di dalam folder `src/pages/` (misal `NewPage.tsx`).
2. Daftarkan rute (route) baru di `src/App.tsx`.
3. Jika halaman membutuhkan otentikasi, bungkus dengan komponen `<PrivateRoute />`.

### Styling & UI
- Gunakan **Tailwind CSS** untuk styling. Hindari penggunaan CSS file terpisah kecuali mendesak.
- Manfaatkan komponen **Shadcn/UI** yang sudah ada di `src/components/ui`. Jika butuh komponen baru, instal via CLI shadcn atau copy manual sesuai dokumentasi mereka.

### Integrasi API
- Gunakan `axios` untuk melakukan request HTTP.
- Pastikan menangani state `loading` dan handling `error` (seperti `try-catch`) saat memanggil API.

---

## ⚙️ Panduan Backend (/backend)

Backend menggunakan **Express.js** dengan **Prisma ORM**. Fokus pengembangan adalah pada logika bisnis, keamanan data, dan penyediaan API.

### Struktur Folder Utama
- `src/controllers`: Logika bisnis utama. Setiap fitur biasanya memiliki controller sendiri (misal `taskController.ts`, `reportController.ts`).
- `src/routes`: Definisi rute API (endpoint) yang memetakan URL ke fungsi controller.
- `src/middleware`: Fungsi perantara, terutama `authMiddleware.ts` untuk memverifikasi token JWT.
- `prisma/schema.prisma`: Definisi skema database dan model.

### Menambahkan Endpoint API Baru
1. **Controller**: Buat fungsi baru di file controller yang relevan (atau buat file controller baru jika fitur baru). Pastikan fungsi berupa `async` dan menangani request/response Express.
2. **Route**: Daftarkan endpoint di file route yang sesuai (misal `src/routes/taskRoutes.ts`).
3. **Server**: Jika membuat file route baru, jangan lupa men-daftarkannya di `src/index.ts` (`app.use('/api/v1/resource', resourceRoutes)`).

### Bekerja dengan Database (Prisma)
- **Modifikasi Skema**: Jika perlu mengubah struktur database, edit `prisma/schema.prisma`.
- **Migrasi**: Setelah mengedit schema, jalankan perintah:
  ```bash
  npx prisma migrate dev --name nama_perubahan
  ```
  Ini akan memperbarui database lokal dan membuat file history migrasi.
- **Query**: Gunakan `prisma client` di dalam controller untuk melakukan CRUD (misal `prisma.task.findMany()`).

### Pembuatan Laporan (PDF/Excel)
- Gunakan `exceljs` untuk laporan Excel.
- Gunakan `pdfkit-table` untuk laporan PDF yang membutuhkan format tabel rapi. Hindari menggunakan `pdfkit` standar secara manual untuk tabel karena rentan berantakan.

---

## 📝 Standar Kode & Best Practices

1. **Tipe Data (TypeScript)**: Selalu definisikan tipe data (interface/type) untuk props komponen, respon API, dan parameter fungsi. Hindari penggunaan `any` sebisa mungkin.
2. **Penamaan**:
   - Gunakan `PascalCase` untuk nama komponen React dan nama Model Prisma.
   - Gunakan `camelCase` untuk nama variabel, fungsi, nama file TS/JS, dan field database.
3. **Komitmen Git**: Gunakan pesan commit yang deskriptif (misal: "feat: menambahkan filter tanggal pada laporan" atau "fix: memperbaiki bug login manager").

---

Dibuat dengan ❤️ untuk kemudahan pengembangan selanjutnya. Selamat berkarya!
