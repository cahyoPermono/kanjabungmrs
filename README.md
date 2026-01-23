# KanJabungMRS - Sistem Manajemen Laporan & Tugas

KanJabungMRS adalah aplikasi web yang dirancang untuk memfasilitasi pengelolaan laporan, tugas, dan target kinerja di lingkungan organisasi. Sistem ini menyediakan platform terpadu untuk Admin, Manajer, dan Karyawan dalam mengelola alur kerja harian, memantau kemajuan target (Goals), serta menghasilkan laporan kinerja secara efisien.

## Fitur Utama

### 🔧 Manajemen Pengguna & Divisi (Admin)
- Pengelolaan akun pengguna (User Management) dengan sistem Role (Admin, Manager, Employee).
- Pengelolaan struktur organisasi/divisi unit kerja.
- Fitur aktivasi/deaktivasi akun dan divisi (Soft Delete) untuk keamanan data.

### 🎯 Manajemen Target (Goals) & Tugas (Tasks)
- **Goals**: Pembuatan dan pemantauan target kinerja per divisi.
- **Tasks**: Pembuatan tugas spesifik yang terkait dengan Goals.
- **Monitoring**: Dashboard interaktif untuk melihat status tugas (To Do, In Progress, Completed).

### 📊 Laporan & Analitik
- **Laporan Manajer**: View khusus bagi manajer untuk memantau seluruh tugas dalam divisinya.
- **Laporan Karyawan**: View personal bagi karyawan untuk melihat riwayat kinerja sendiri.
- **Ekspor Data**: Fitur unduh laporan dalam format **Excel** dan **PDF** (dengan tampilan tabel profesional).
- **Filtering**: Penyaringan data berdasarkan status, prioritas, pemberi tugas, dan rentang waktu.

### 🔐 Keamanan & Akses
- Otentikasi berbasis JWT (JSON Web Token).
- Kontrol akses berbasis peran (Role-Based Access Control - RBAC).
- Validasi data yang ketat dan penanganan error yang komprehensif.

## Teknologi yang Digunakan

### Frontend
- **React** (via Vite): Library UI modern yang cepat dan efisien.
- **TypeScript**: Menjamin keamanan tipe data dan skalabilitas kode.
- **Tailwind CSS**: Framework utility-first untuk styling tampilan yang responsif.
- **Shadcn/UI**: Komponen UI yang reusable dan aksesibel (menggunakan Radix UI).
- **Zustand**: Manajemen state global yang ringan.

### Backend
- **Node.js & Express**: Runtime dan framework server yang handal.
- **TypeScript**: Untuk konsistensi tipe data antara frontend dan backend.
- **Prisma ORM**: Interaksi database yang aman dan intuitif.
- **PostgreSQL**: Database relasional untuk penyimpanan data utama.
- **PDFKit-Table & ExcelJS**: Library untuk pembuatan laporan dokumen.

## Prasyarat Instalasi

Pastikan Anda telah menginstal perangkat lunak berikut di komputer Anda:
- **Node.js** (v18 atau lebih baru)
- **pnpm** (Package manager yang direkomendasikan)
- **PostgreSQL** (Database server)

## Cara Menjalankan Aplikasi

Ikuti langkah-langkah berikut untuk menjalankan aplikasi di lingkungan lokal (development):

### 1. Persiapan Server (Backend)

Masuk ke folder backend, instal dependensi, dan siapkan database.

```bash
cd backend
pnpm install

# Buat file .env berdasarkan contoh (sesuaikan DATABASE_URL)
# cp .env.example .env

# Jalankan migrasi database
pnpm prisma migrate dev

# (Opsional) Isi database dengan data awal
pnpm prisma db seed

# Jalankan server development
pnpm dev
```

Server backend akan berjalan di `http://localhost:3000`.

### 2. Persiapan Client (Frontend)

Buka terminal baru, masuk ke folder frontend, dan jalankan aplikasi.

```bash
cd frontend
pnpm install

# Jalankan server development
pnpm dev
```

Aplikasi frontend dapat diakses melalui browser di alamat yang muncul di terminal (biasanya `http://localhost:5173`).

---
*Dibuat oleh Tim Pengembang KanJabungMRS*
