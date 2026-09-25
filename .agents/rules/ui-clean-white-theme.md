---
name: ui-clean-white-theme
description: "Aturan untuk memastikan antarmuka selalu menggunakan tema terang (light mode) yang bersih, dengan seluruh token desain terdefinisi secara terpusat pada file CSS global."
---

# UI Clean White Theme Rule

## 1. Default Light Mode
- Antarmuka harus selalu menggunakan desain "Clean White" (Light Mode) secara default. 
- Jangan menggunakan dark-mode kecuali diminta secara eksplisit.
- Latar belakang utama (background) harus terang, menggunakan warna seperti `#F8FAFC` atau `#FAFAFA`, sedangkan elemen *card* (surface) harus menggunakan putih murni `#FFFFFF`.

## 2. Sentralisasi CSS (Design Tokens)
- Seluruh token desain (warna background, surface, teks, border, bayangan) **WAJIB** didefinisikan sebagai CSS variable (contoh: `--color-primary`, `--background`, `--surface`, `--border`) di dalam root `globals.css`.
- Jangan menggunakan `data-theme="light"` lagi sebagai *override*, jadikan nilai-nilai terang sebagai nilai `:root` utama.

## 3. Penggunaan di Komponen (No Hardcoded Colors)
- **Jangan pernah meng-hardcode warna hex** di dalam kelas Tailwind pada komponen React (misalnya: hindari `bg-[#ffffff]` atau `text-[#121212]`).
- Gunakan token CSS yang sudah dibuat. Anda bisa merujuknya langsung menggunakan sintaks Tailwind arbitrary (misal: `bg-[var(--surface)]`, `text-[var(--text-primary)]`, `border-[var(--border)]`).

## 4. Estetika Clean & Depth
- Gunakan *shadow* yang lembut (blur tinggi, opacity sangat rendah) untuk menciptakan hierarki visual (kedalaman/*depth*) antara *background* abu-abu terang dan *card* putih murni.
- Gunakan *border* halus (contoh: `#E2E8F0` atau `#F1F5F9`) untuk memisahkan area yang berdekatan.
