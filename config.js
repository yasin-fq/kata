// ============================================================
// KATAKITA - KONFIGURASI APLIKASI
// ============================================================
// File ini untuk mengatur URL Google Apps Script TANPA perlu rebuild aplikasi.
//
// CARA PAKAI (untuk versi static / katakita-static-deploy.zip):
// 1. Buka file config.js ini di text editor (Notepad, VS Code, dll)
// 2. Ganti URL di bawah dengan URL Google Apps Script Web App Anda
// 3. Simpan file
// 4. Aplikasi langsung pakai URL baru (tidak perlu build ulang)
//
// CARA DAPAT URL GOOGLE APPS SCRIPT:
// 1. Buka https://sheets.google.com, buat spreadsheet baru
// 2. Extensions > Apps Script
// 3. Paste kode dari file "google-apps-script.js"
// 4. Set SPREADSHEET_ID dan VALID_ACCESS_CODES
// 5. Deploy > New deployment > Web app
// 6. Execute as: Me, Who has access: Anyone
// 7. Copy URL yang muncul (format: https://script.google.com/macros/s/AKfycb.../exec)
// 8. Paste URL tersebut di bawah ini
// ============================================================

window.KATAKITA_CONFIG = {
  // URL Google Apps Script Web App untuk login/register
  // Ganti dengan URL Anda!
  appsScriptUrl: "https://script.google.com/macros/s/AKfycbzLeQjLPp4jEfw7SwNiADtrUv72YD5B9mFWW6SNiv9VtNNnvaCxCLZxUDUAV9u3bWG7/exec",

  // Mode Pengujian: ON (true) / OFF (false)
  // Saat ON: semua level & pelajaran terbuka (tanpa perlu selesaikan level sebelumnya)
  // Saat OFF: level terkunci sampai selesaikan level sebelumnya (default)
  devMode: false,

  // Link untuk mendapatkan kode akses (tampil di halaman pendaftaran)
  // Ganti dengan link Anda (lynk.id, wa.me, website, dll)
  // Default: https://lynk.id/qafstudio
  accessCodeUrl: "https://lynk.id/qafstudio/o7d0pzlrjp6n/checkout",

  // Opsional: pesan custom saat login gagal
  // loginErrorMessage: "Login gagal. Hubungi admin.",
};
