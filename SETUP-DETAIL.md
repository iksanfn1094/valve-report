# Valve Inspection Report - Setup Guide SANGAT DETAIL

> **Panduan ini dibuat se-detail mungkin, langkah demi langkah, seperti mengajari orang yang belum pernah sama sekali.**

---

## Yang Sudah Selesai

Steps 1-3 sudah dikerjakan:
- ✅ Akun Supabase sudah dibuat
- ✅ Database schema sudah dijalankan
- ✅ Storage bucket sudah dibuat
- ✅ Project lokal sudah terinstall

**Sekarang yang belum: Step 4, 5, 6, 7**

---

## STEP 4 - Edit File .env.local

> **Tujuan:** Memberitahu aplikasi di mana database Supabase Anda berada.

### 4.1 - Buka Terminal

**Mac:**
1. Tekan **Cmd + Space** di keyboard (tombol Command dan spasi bersamaan)
2. Muncul kolom pencarian Spotlight di tengah layar
3. Ketik: `terminal`
4. Aplikasi **Terminal** akan muncul di hasil pencarian
5. Tekan **Enter** untuk membuka Terminal
6. Aplikasi Terminal akan terbuka ( layar hitam dengan teks )

**Windows:**
1. Tekan tombol **Windows** di keyboard
2. Ketik: `cmd`
3. **Command Prompt** akan muncul di hasil pencarian
4. Tekan **Enter**

### 4.2 - Buka Folder Project di Terminal

Ketik command berikut PERSIS seperti di bawah, lalu tekan **Enter**:

```bash
cd "/Users/fahrudinnuriksan/Documents/Default Project/valve-report"
```

**Cara cepat (tidak perlu ketik manual):**
1. Ketik dulu: `cd ` (cd + spasi, JANGAN tekan Enter dulu)
2. Buka **Finder** → buka folder **Documents** → buka **Default Project** → buka **valve-report**
3. **Drag folder `valve-report`** dari Finder ke Terminal (lepaskan di area Terminal)
4. Path akan otomatis terisi di Terminal
5. Tekan **Enter**

**Hasil yang diharapkan:**
```
fahrudinnuriksan@mac valve-report %
```
atau
```
valve-report $
```

Jika muncul `No such file atau directory`, berarti path salah. Ketik lagi dengan benar.

### 4.3 - Buka File .env.local

Ketik command berikut di Terminal, lalu tekan **Enter**:

```bash
open .env.local
```

**Alternatif jika VS Code sudah terinstall:**
```bash
code .env.local
```

**Alternatif jika tidak bisa:**
```bash
nano .env.local
```
(Akan terbuka editor di Terminal. Untuk menyimpan: tekan **Ctrl+X**, lalu **Y**, lalu **Enter**)

### 4.4 - Isi File .env.local

File akan terbuka di TextEdit (Mac) atau Notepad (Windows).

**HAPUS SEMUA isi yang ada**, lalu ganti dengan ini:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Dimana dapat nilai yang benar?**

Buka browser → buka **https://supabase.com** → Login → Klik project Anda → Klik **"Project Settings"** (icon gear di sidebar kiri bawah) → Klik **"API"** di sidebar kiri

Anda akan melihat:

**Bagian "Project URL":**
```
https://abcdefghij.supabase.co
```
→ Copy nilai ini → paste ke baris pertama setelah `NEXT_PUBLIC_SUPABASE_URL=`

**Bagian "Project API keys" → "anon public":**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6...
```
→ Copy nilai ini → paste ke baris kedua setelah `NEXT_PUBLIC_SUPABASE_ANON_KEY=`

### 4.5 - Contoh File .env.local yang BENAR

```
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYyMDAxMDAwMCwiZXhwIjoxOTM1NTg2MDAwfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 4.6 - Contoh File .env.local yang SALAH

❌ **SALAH** - Ada tanda kutip:
```
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbG..."
```

❌ **SALAH** - Ada spasi di awal:
```
 NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
 NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
```

❌ **SALAH** - URL Supabase salah (bukan project Anda):
```
NEXT_PUBLIC_SUPABASE_URL=https://supabase.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=salah
```

### 4.7 - Simpan File

- **Mac (TextEdit):** Tekan **Cmd + S**
- **Windows (Notepad):** Tekan **Ctrl + S**
- **VS Code:** Tekan **Cmd + S** (Mac) atau **Ctrl + S** (Windows)
- **Nano (Terminal):** Tekan **Ctrl + X**, lalu **Y**, lalu **Enter**

Setelah disimpan, **tutup file** (tidak perlu ditutup manual, yang penting sudah tersimpan).

---

## STEP 5 - Jalankan Aplikasi

### 5.1 - Pastikan di Folder yang Benar

Buka Terminal. Pastikan Anda melihat:

```
valve-report %
```
atau
```
fahrudinnuriksan@mac valve-report %
```

Jika TIDAK, ketik lagi:
```bash
cd "/Users/fahrudinnuriksan/Documents/Default Project/valve-report"
```

### 5.2 - Jalankan Server

Ketik command berikut di Terminal, lalu tekan **Enter**:

```bash
npm run dev
```

**TUNGGU beberapa detik.** Anda akan melihat output seperti:

```
  ▲ Next.js 16.3.1
  - Local:   http://localhost:3000
  - Network: http://192.168.1.xxx:3000

 ✓ Starting...
 ✓ Ready in 2.4s
```

**PENTING:**
- **JANGAN tutup Terminal ini!** Server harus tetap berjalan.
- Jika Anda tutup, aplikasi akan mati.
- Jika ingin menjalankan lagi, buka Terminal baru, masuk ke folder project, lalu `npm run dev` lagi.

### 5.3 - Buka Aplikasi di Browser

1. Buka **browser** (Chrome, Safari, Firefox, atau Edge)
2. Di **address bar** (kolom URL di bagian atas browser), ketik:
   ```
   http://localhost:3000
   ```
3. Tekan **Enter**

**Hasil yang diharapkan:**
- Halaman website akan terbuka
- Ada judul **"Valve Inspection Report"**
- Ada tombol **"Lihat Reports"** dan **"+ New Report"**

### 5.4 - Jika Halaman Tidak Muncul / Error

**Kemungkinan 1: "This site can't be reached" atau "localhost refused to connect"**
- Server belum jalan atau gagal jalan
- Buka Terminal, pastikan tidak ada error merah
- Jika ada error "supabaseUrl is required": file `.env.local` belum benar (kembali ke Step 4)

**Kemungkinan 2: Halaman putih kosong**
- Tekan **F12** di keyboard (atau **Cmd+Option+I** di Mac)
- Klik tab **"Console"**
- Lihat error merah, copy pesannya
- Kirim pesan error tersebut untuk bantuan

**Kemungkinan 3: "localhost:3000" sudah dipakai**
- Ketik di browser: `http://localhost:3001`
- Atau di Terminal, tekan **Ctrl+C**, lalu jalankan:
  ```bash
  npm run dev -- -p 3001
  ```
- Buka: `http://localhost:3001`

### 5.5 - Test Aplikasi

1. Di halaman utama, klik tombol **"+ New Report"** (di pojok kanan atas)
2. Form akan terbuka
3. Isi **Job Number** (WAJIB): ketik `IR-2026-001`
4. Isi field lainnya sesuai kebutuhan (Project, Customer, Valve Type, dll)
5. Klik tombol **"Simpan & Lanjut"**
6. Halaman detail report akan terbuka
7. Klik **"+ Tambah Baris"** untuk tambah komponen
8. Pilih komponen dari dropdown, isi qty, condition, recommendation
9. Klik **"Simpan Semua"**
10. Lihat ringkasan di bawah (Total, Clean, Repair, Replace)

**Jika semua test berhasil, lanjut ke Step 6 (Deploy).**

### 5.6 - Stop Server

Ketika sudah selesai test:
1. Buka **Terminal** yang menjalankan server
2. Tekan **Ctrl + C** di keyboard
3. Server akan berhenti
4. Untuk menjalankan lagi, ketik: `npm run dev`

---

## STEP 6 - Push ke GitHub

> **Tujuan:** Menyimpan code ke internet (GitHub) agar bisa di-deploy ke Vercel.

### 6.1 - Buat Akun GitHub (jika belum punya)

1. Buka browser → ketik **https://github.com**
2. Klik tombol **"Sign up"** (pojok kanan atas)
3. Isi:
   - **Email**: email Anda
   - **Password**: buat password
   - **Username**: pilih username (contoh: `fahrudin-dev`)
4. Klik **"Create account"**
5. Verifikasi email Anda (buka email, klik link verifikasi)

### 6.2 - Buat Repository di GitHub

1. Login ke **https://github.com**
2. Di pojok kanan atas, klik tombol **"+"** (icon plus)
3. Pilih **"New repository"**
4. Isi form:
   - **Repository name**: ketik `valve-report`
   - **Description**: ketik `Valve Inspection Report Web App`
   - **Public**: pilih **Public** ✅
   - **Add a README file**: JANGAN dicentang
   - **Add .gitignore**: JANGAN dipilih
   - **Choose a license**: JANGAN dipilih
5. Klik tombol **"Create repository"** (hijau)
6. Anda akan melihat halaman repository kosong dengan instructions

### 6.3 - Catat URL Repository

Di halaman repository, Anda akan melihat bagian **"Quick setup"**. Catat URL ini:

```
https://github.com/fahrudin-dev/valve-report.git
```

(ganti `fahrudin-dev` dengan username GitHub Anda)

### 6.4 - Push Code dari Terminal

Buka Terminal, jalankan command berikut **SATU PER SATU** (tekan Enter setelah setiap command):

**Command 1 - Masuk ke folder project:**
```bash
cd "/Users/fahrudinnuriksan/Documents/Default Project/valve-report"
```

**Command 2 - Inisialisasi Git:**
```bash
git init
```
Output: `Initialized empty Git repository...`

**Command 3 - Tambah semua file:**
```bash
git add .
```
(Tidak ada output jika berhasil)

**Command 4 - Commit (simpan):**
```bash
git commit -m "Initial commit - valve inspection report"
```
Output: `[main (root-commit) xxxxxxx] Initial commit...`

**Command 5 - Hubungkan ke GitHub:**
```bash
git remote add origin https://github.com/fahrudin-dev/valve-report.git
```
(Ganti `fahrudin-dev` dengan username GitHub Anda)

**Command 6 - Set branch ke main:**
```bash
git branch -M main
```
(Tidak ada output)

**Command 7 - Push ke GitHub:**
```bash
git push -u origin main
```

**Jika diminta login GitHub:**
- **Username:** ketik username GitHub Anda
- **Password:** JANGAN ketik password biasa! Harus pakai **Personal Access Token**
  - Buka browser → https://github.com/settings/tokens
  - Klik **"Generate new token (classic)"**
  - **Note:** ketik `valve-report`
  - **Expiration:** pilih `90 days`
  - **Scopes:** centang **`repo`** (paling atas)
  - Klik **"Generate token"**
  - Copy token yang muncul (simpan, hanya ditampilkan sekali!)
  - Kembali ke Terminal → paste token sebagai password

**Output yang diharapkan:**
```
Enumerating objects: 42, done.
Counting objects: 100% (42/42), done.
Delta compression using up to 10 threads
...
To https://github.com/fahrudin-dev/valve-report.git
 * [new branch]      main -> main
Branch 'main' set up to track 'origin/main'.
```

**Verifikasi:**
- Buka browser → https://github.com/fahrudin-dev/valve-report
- Semua file project sudah ada di GitHub ✅

---

## STEP 7 - Deploy ke Vercel

> **Tujuan:** Menjalankan aplikasi di internet agar bisa diakses 10 user dari mana saja.

### 7.1 - Buat Akun Vercel

1. Buka browser → ketik **https://vercel.com**
2. Klik tombol **"Log In"** (pojok kanan atas)
3. Pilih **"Continue with GitHub"**
4. Anda akan diminta authorize Vercel → klik **"Authorize Vercel"**
5. Anda akan masuk ke dashboard Vercel

### 7.2 - Buat Project Baru di Vercel

1. Di dashboard Vercel, klik tombol **"Add New..."** (pojok kanan atas)
2. Pilih **"Project"** dari dropdown
3. Anda akan melihat halaman **"Import Git Repository"**

### 7.3 - Import Repository

1. Di halaman Import, Anda akan melihat daftar repository GitHub Anda
2. Cari repository **`valve-report`**
3. Klik tombol **"Import"** di sebelah repository tersebut

**Jika tidak muncul:**
- Klik **"Adjust GitHub App permissions"**
- Atau klik **"Install"** untuk memberikan akses Vercel ke GitHub
- Atau paste URL repository manual: `https://github.com/fahrudin-dev/valve-report`

### 7.4 - Configure Project

Anda akan melihat halaman **"Configure Project"**. Isi sebagai berikut:

**Bagian atas:**
- **Project Name**: `valve-report` (sudah terisi otomatis)
- **Framework Preset**: `Next.js` (sudah terisi otomatis)
- **Root Directory**: `./` (sudah terisi otomatis)
- **Build Command**: `next build` (sudah terisi otomatis)
- **Output Directory**: `.next` (sudah terisi otomatis)

**Bagian Environment Variables (PALING PENTING):**

Scroll ke bawah sampai Anda melihat bagian **"Environment Variables"**. Klik **"Add"** untuk menambah variabel:

**Variabel 1:**
- Di kolom **"Name"**: ketik `NEXT_PUBLIC_SUPABASE_URL`
- Di kolom **"Value"**: paste URL Supabase Anda (contoh: `https://abcdefghijklmn.supabase.co`)
- Klik tombol **"Add"**

**Variabel 2:**
- Di kolom **"Name"**: ketik `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Di kolom **"Value"**: paste Anon Key Supabase Anda (string panjang `eyJhbG...`)
- Klik tombol **"Add"**

**Hasil yang diharapkan:**
```
NEXT_PUBLIC_SUPABASE_URL    https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY    eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 7.5 - Deploy!

1. Setelah environment variables sudah ditambah, scroll ke bawah
2. Klik tombol **"Deploy"** (biru)
3. Tunggu 1-2 menit. Anda akan melihat:
   - **"Building..."** (sedang di-build, warna abu-abu)
   - **"Running Tests"** (sedang test)
   - **"Ready"** (sudah selesai, warna hijau ✅)

### 7.6 - Dapatkan URL Aplikasi

Setelah deploy selesai:
1. Anda akan melihat halaman deployment success
2. Ada URL deployment, contoh:
   ```
   https://valve-report-xxxxx-vercel.app
   ```
3. **Klik URL tersebut** untuk membuka aplikasi
4. Aplikasi harusnya berfungsi sama seperti di localhost

### 7.7 - Verifikasi Aplikasi

1. Buka URL Vercel di browser baru
2. Klik **"+ New Report"**
3. Isi form, simpan
4. Tambah komponen, simpan
5. Test semua fitur
6. Jika semua berhasil, aplikasi sudah siap digunakan! 🎉

### 7.8 - Share ke 10 User

Kirim **URL Vercel** ke 10 orang tersebut:

**Contoh pesan WhatsApp/Telegram:**
```
Halo, link Inspection Report sudah jadi:

https://valve-report-xxxxx-vercel.app

Buka link tersebut di browser (Chrome/Safari). 
Tidak perlu install apa pun, langsung bisa dipakai.
```

**Yang perlu diketahui user:**
- Buka link di browser → langsung bisa pakai
- Bisa diakses dari HP, laptop, tablet
- Tidak perlu install aplikasi apapun
- Data tersimpan di cloud, bisa diakses dari device apapun
- Setiap orang bisa buat report sendiri

### 7.9 - Update Code (Jika Ada Perubahan)

Jika Anda mengubah code dan ingin update di Vercel:

```bash
cd "/Users/fahrudinnuriksan/Documents/Default Project/valve-report"

# 1. Simpan perubahan ke Git
git add .
git commit -m "Deskripsi perubahan Anda"

# 2. Push ke GitHub
git push
```

**Vercel akan OTOMATIS deploy ulang dalam 1-2 menit.**

### 7.10 - Cek Status Deploy

1. Buka **https://vercel.com**
2. Login
3. Klik project **`valve-report`**
4. Di tab **"Deployments"**, Anda akan melihat daftar deployment
5. Deployment terbaru (paling atas) = versi yang sedang aktif

---

## RINGKASAN SINGKAT

| Step | Apa yang dilakukan | Command/Action |
|------|-------------------|----------------|
| **4** | Edit .env.local | Buka file → paste URL & Key → Save |
| **5** | Jalankan lokal | `npm run dev` → buka `localhost:3000` |
| **6** | Push ke GitHub | `git init` → `git add .` → `git commit` → `git push` |
| **7** | Deploy ke Vercel | Login Vercel → Import repo → Add env vars → Deploy |

---

## TROUBLESHOOTING

### Step 4
**Error: "No such file" saat buka .env.local**
- Pastikan sudah di folder project: `cd "/Users/fahrudinnuriksan/Documents/Default Project/valve-report"`

### Step 5
**Error: "supabaseUrl is required"**
- File `.env.local` belum benar
- Buka lagi, pastikan URL dan Key sudah benar
- Restart server: `Ctrl+C`, lalu `npm run dev`

**Error: "EADDRINUSE"**
- Port sudah dipakai. Gunakan port lain:
  ```bash
  npm run dev -- -p 3001
  ```
  Buka: `http://localhost:3001`

### Step 6
**Error: "fatal: remote origin already exists"**
- Repository sudah pernah di-add. Hapus dulu:
  ```bash
  git remote remove origin
  ```
  Lalu ulangi Command 5

**Error: "error: failed to push some refs"**
- Repository di GitHub punya file yang tidak ada di lokal. Force push:
  ```bash
  git push -u origin main --force
  ```

### Step 7
**Error: "Missing Environment Variables" di Vercel**
- Pastikan env vars sudah di-set dengan benar di Vercel
- Klik tab **"Settings"** → **"Environment Variables"**
- Pastikan NAMA dan VALUE tidak ada spasi tambahan
- Setelah update, klik **"Redeploy"**

**Aplikasi di Vercel error/blank page**
- Cek build log: Vercel → project → tab **"Deployments"** → klik deployment → lihat **"Building"** log
- Pastikan code jalan di localhost dulu sebelum push ke GitHub
