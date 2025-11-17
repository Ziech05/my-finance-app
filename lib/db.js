import { sql } from "@vercel/postgres";

// Fungsi untuk membuat tabel jika belum ada
export async function createTable() {
  try {
    const result = await sql`
            CREATE TABLE IF NOT EXISTS transactions (
                id SERIAL PRIMARY KEY,
                jenis VARCHAR(20) NOT NULL,
                deskripsi TEXT NOT NULL,
                jumlah INT NOT NULL,
                tanggal DATE NOT NULL
            );
        `;
    console.log("Tabel 'transactions' siap digunakan.");
    return result;
  } catch (error) {
    console.error("Gagal membuat tabel:", error);
    throw error;
  }
}
