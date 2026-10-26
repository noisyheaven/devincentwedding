# Review repo — salinan perbaikan

Tanggal review: 2026-10-26
Branch ini hanya menambahkan salinan untuk ditinjau. File asli di branch main tidak diubah.

## Salinan yang diperbaiki
- `review-copies/camera.gs`: menghapus kode akses yang tertanam di source; menggunakan placeholder agar backend membaca Script Properties.
- `review-copies/qr-kamera.html`: memperbarui teks kartu QR dari 10 menjadi 15 foto per tamu.
- `review-copies/kamera.html`: menyamakan angka awal penghitung kamera dari 10 menjadi 15.

## Temuan penting
1. `apps-script/camera.gs` pada branch main berisi kode akses hardcoded. Karena repo bersifat publik, anggap kode lama sudah bocor. Ganti nilai Script Properties `ACCESS_CODE` dengan kode baru dan cetak ulang QR kamera. Jangan hanya mengubah file GitHub; backend Apps Script harus diperbarui dan deployment versi baru diterbitkan.
2. `js/camera-config.js` menetapkan `CAM_MAX = 15` dan backend menetapkan `MAX_PER_GUEST = 15`; keduanya sudah konsisten.
3. Alur tombol Ambil Foto pada `momen.html` sudah membuka pemindai langsung untuk tamu baru dan melewatkan scan bagi tamu yang memiliki `dc_k` tersimpan. Pemindai mendukung kamera dan memilih gambar QR; akses kamera di iPhone perlu diuji lewat HTTPS dan Safari.
4. `qr-kamera.html` punya teks kuota yang tertinggal di 10 meskipun kuota sistem sudah 15.
5. Periksa konfigurasi `ACCESS_CODE` dan URL Apps Script sebelum acara. Jangan menaruh kode rahasia di source publik.

## Cara pakai salinan
Buka file di folder `review-copies`, bandingkan, lalu salin perubahan manual ke file asli setelah Anda setuju. Tidak ada file asli di branch `main` yang ditimpa.
