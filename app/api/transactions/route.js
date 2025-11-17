import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
// Pastikan path ini benar sesuai struktur Anda
import { createTable } from "@/lib/db";

// Handler untuk metode GET (mengambil semua transaksi)
export async function GET(request) {
  try {
    // Panggil fungsi untuk memastikan tabel sudah ada
    await createTable();

    // Mengambil semua transaksi
    const result = await sql`
            SELECT id, jenis, deskripsi, jumlah, tanggal
            FROM transactions
            ORDER BY tanggal DESC, id DESC;
        `;

    return NextResponse.json(result.rows, { status: 200 });
  } catch (error) {
    console.error("Kesalahan saat mengambil data:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data transaksi." },
      { status: 500 }
    );
  }
}

// Handler untuk metode POST (menambah transaksi baru)
export async function POST(request) {
  try {
    const { jenis, deskripsi, jumlah, tanggal } = await request.json();

    if (!jenis || !deskripsi || !jumlah || !tanggal) {
      return NextResponse.json(
        { error: "Semua field wajib diisi." },
        { status: 400 }
      );
    }

    // Menyimpan transaksi ke database
    const result = await sql`
            INSERT INTO transactions (jenis, deskripsi, jumlah, tanggal)
            VALUES (${jenis}, ${deskripsi}, ${jumlah}, ${tanggal})
            RETURNING id;
        `;

    return NextResponse.json(
      { id: result.rows[0].id, message: "Transaksi berhasil ditambahkan." },
      { status: 201 }
    );
  } catch (error) {
    console.error("Kesalahan saat menambah data:", error);
    return NextResponse.json(
      { error: "Gagal menambahkan transaksi." },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const url = new URL(request.url);
    // Mengambil ID dari URL query parameter
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID transaksi wajib diisi." },
        { status: 400 }
      );
    }

    // Menghapus transaksi dari database
    const result = await sql`
            DELETE FROM transactions
            WHERE id = ${id};
        `;

    // Baris yang dihapus (rowCount) harus 1 jika berhasil
    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Transaksi tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Transaksi berhasil dihapus." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Kesalahan saat menghapus data:", error);
    return NextResponse.json(
      { error: "Gagal menghapus transaksi." },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { transactions } = body;

    if (!transactions || !Array.isArray(transactions)) {
      return NextResponse.json(
        { error: "Format data impor tidak valid." },
        { status: 400 }
      );
    }

    // 1. Hapus semua data lama (Pendekatan Restore Sederhana)
    await sql`DELETE FROM transactions;`;

    // 2. Masukkan data baru
    if (transactions.length > 0) {
      // Kita akan menggunakan Promise.all untuk memasukkan banyak data sekaligus
      const insertPromises = transactions.map((t) => {
        // Pastikan tipe data sesuai (jumlah adalah integer)
        const jumlah = parseInt(t.jumlah);
        return sql`
                    INSERT INTO transactions (jenis, deskripsi, jumlah, tanggal)
                    VALUES (${t.jenis}, ${t.deskripsi}, ${jumlah}, ${t.tanggal});
                `;
      });
      await Promise.all(insertPromises);
    }

    return NextResponse.json(
      {
        message: `${transactions.length} transaksi berhasil diimpor dan di-restore.`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Kesalahan saat mengimpor data:", error);
    return NextResponse.json(
      { error: "Gagal mengimpor dan me-restore transaksi." },
      { status: 500 }
    );
  }
}
