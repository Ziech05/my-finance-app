"use client"; // WAJIB ada di baris pertama untuk Client Component React

import { useState, useEffect } from "react";

// Helper untuk format mata uang Rupiah
const formatRupiah = (amount) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

export default function FinanceTracker() {
  const [transactions, setTransactions] = useState([]);
  const [formData, setFormData] = useState({
    jenis: "",
    deskripsi: "",
    jumlah: "",
    // Format tanggal yyyy-mm-dd
    tanggal: new Date().toISOString().split("T")[0],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Data Fetching ---

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      // Memanggil Next.js API Route yang telah kita buat: /api/transactions
      const response = await fetch("/api/transactions");
      if (!response.ok) {
        throw new Error("Gagal mengambil data dari server.");
      }
      const data = await response.json();
      setTransactions(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // --- Form Handling ---

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const transactionToSend = {
        ...formData,
        // Konversi jumlah dari string menjadi integer
        jumlah: parseInt(formData.jumlah),
      };

      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transactionToSend),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal menambahkan transaksi.");
      }

      // Berhasil, reset form dan refresh data
      setFormData({
        jenis: "",
        deskripsi: "",
        jumlah: "",
        tanggal: new Date().toISOString().split("T")[0],
      });
      await fetchTransactions(); // Muat ulang data terbaru
    } catch (err) {
      setError(err.message);
    }
  };

  // --- Perhitungan Saldo ---

  const totalIncome = transactions
    .filter((t) => t.jenis === "pemasukan")
    .reduce((sum, t) => sum + t.jumlah, 0);

  const totalExpense = transactions
    .filter((t) => t.jenis === "pengeluaran")
    .reduce((sum, t) => sum + t.jumlah, 0);

  const currentBalance = totalIncome - totalExpense;

  // --- Render Component ---

  if (loading) return <div className="container">Memuat data...</div>;
  // Hapus baris if(error) ini saat pertama kali dijalankan di lokal,
  // karena akan error sebelum koneksi database dikonfigurasi.
  // if (error) return <div className="container" style={{color: 'red'}}>Error: {error}</div>;

  return (
    <div className="container">
      <h1>💸 Pencatat Keuangan (Full-Stack)</h1>
      {/* Tampilkan pesan error jika ada */}
      {error && (
        <p style={{ color: "red", fontWeight: "bold" }}>Error: {error}</p>
      )}

      {/* Ringkasan Saldo */}
      <div
        className="summary"
        style={{
          display: "flex",
          justifyContent: "space-around",
          margin: "20px 0",
          padding: "15px",
          border: "1px solid #ccc",
          borderRadius: "5px",
        }}
      >
        <div>
          Total Pemasukan:{" "}
          <p style={{ color: "green", fontWeight: "bold" }}>
            {formatRupiah(totalIncome)}
          </p>
        </div>
        <div>
          Total Pengeluaran:{" "}
          <p style={{ color: "red", fontWeight: "bold" }}>
            {formatRupiah(totalExpense)}
          </p>
        </div>
        <div>
          Saldo Saat Ini:
          <p
            style={{
              color: currentBalance >= 0 ? "blue" : "darkred",
              fontWeight: "bold",
            }}
          >
            {formatRupiah(currentBalance)}
          </p>
        </div>
      </div>

      {/* Formulir Input Transaksi */}
      <h2>Tambah Transaksi</h2>
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", gap: "10px", marginBottom: "30px" }}
      >
        <select
          name="jenis"
          value={formData.jenis}
          onChange={handleChange}
          required
        >
          <option value="">Jenis</option>
          <option value="pemasukan">Pemasukan</option>
          <option value="pengeluaran">Pengeluaran</option>
        </select>
        <input
          type="text"
          name="deskripsi"
          placeholder="Deskripsi Transaksi"
          value={formData.deskripsi}
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="jumlah"
          placeholder="Jumlah (Rp)"
          value={formData.jumlah}
          onChange={handleChange}
          required
          min="1"
        />
        <input
          type="date"
          name="tanggal"
          value={formData.tanggal}
          onChange={handleChange}
          required
        />
        <button type="submit">Tambah</button>
      </form>

      <hr />

      {/* Daftar Transaksi */}
      <h2>Riwayat Transaksi</h2>
      <table
        style={{ width: "100%", borderCollapse: "collapse", marginTop: "15px" }}
      >
        <thead>
          <tr style={{ backgroundColor: "#f2f2f2" }}>
            <th style={{ padding: "8px", border: "1px solid #ddd" }}>
              Tanggal
            </th>
            <th style={{ padding: "8px", border: "1px solid #ddd" }}>
              Deskripsi
            </th>
            <th style={{ padding: "8px", border: "1px solid #ddd" }}>Jenis</th>
            <th style={{ padding: "8px", border: "1px solid #ddd" }}>Jumlah</th>
          </tr>
        </thead>
        <tbody>
          {transactions.length === 0 ? (
            <tr>
              <td colSpan="4" style={{ textAlign: "center", padding: "10px" }}>
                Belum ada transaksi.
              </td>
            </tr>
          ) : (
            transactions.map((t) => (
              <tr
                key={t.id}
                style={{
                  backgroundColor:
                    t.jenis === "pemasukan" ? "#e6ffe6" : "#ffe6e6",
                }}
              >
                <td style={{ padding: "8px", border: "1px solid #ddd" }}>
                  {t.tanggal}
                </td>
                <td style={{ padding: "8px", border: "1px solid #ddd" }}>
                  {t.deskripsi}
                </td>
                <td style={{ padding: "8px", border: "1px solid #ddd" }}>
                  {t.jenis.charAt(0).toUpperCase() + t.jenis.slice(1)}
                </td>
                <td
                  style={{
                    padding: "8px",
                    border: "1px solid #ddd",
                    fontWeight: "bold",
                  }}
                >
                  {formatRupiah(t.jumlah)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
