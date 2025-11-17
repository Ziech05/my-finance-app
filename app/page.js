// File: my-finance-app/app/page.js

"use client";

import { useState, useEffect } from "react";

// Helper untuk format mata uang Rupiah (SAMA)
const formatRupiah = (amount) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

// Helper untuk memformat tanggal (BARU: menghilangkan jam/zona waktu)
const formatDate = (dateString) => {
  if (!dateString) return "";
  // Mengambil hanya tanggal YYYY-MM-DD
  return dateString.split("T")[0];
};

export default function FinanceTracker() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Logika Dark Mode (SAMA)
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  // --- State dan Logic Lainnya (SAMA) ---

  const [transactions, setTransactions] = useState([]);
  const [formData, setFormData] = useState({
    jenis: "",
    deskripsi: "",
    jumlah: "",
    tanggal: new Date().toISOString().split("T")[0],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTransactions = async () => {
    /* ... (SAMA) ... */
    setLoading(true);
    setError(null);
    try {
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    /* ... (SAMA) ... */
    e.preventDefault();
    setError(null);

    try {
      const transactionToSend = {
        ...formData,
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

      setFormData({
        jenis: "",
        deskripsi: "",
        jumlah: "",
        tanggal: new Date().toISOString().split("T")[0],
      });
      await fetchTransactions();
    } catch (err) {
      setError(err.message);
    }
  };

  // Fungsi Hapus Transaksi (BARU)
  const deleteTransaction = async (id) => {
    if (!confirm("Anda yakin ingin menghapus transaksi ini?")) return;

    setLoading(true);
    setError(null);

    try {
      // Memanggil API DELETE dengan ID di URL query
      const response = await fetch(`/api/transactions?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal menghapus transaksi.");
      }

      // Refresh daftar transaksi setelah berhasil
      await fetchTransactions();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Perhitungan Saldo (SAMA) ---
  const totalIncome = transactions
    .filter((t) => t.jenis === "pemasukan")
    .reduce((sum, t) => sum + t.jumlah, 0);

  const totalExpense = transactions
    .filter((t) => t.jenis === "pengeluaran")
    .reduce((sum, t) => sum + t.jumlah, 0);

  const currentBalance = totalIncome - totalExpense;

  // --- Render Component dengan Class Dark Mode ---

  if (loading)
    return (
      <div className="max-w-4xl mx-auto p-4 mt-10 text-center dark:text-gray-200">
        Memuat data...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 shadow-xl rounded-lg mt-10">
        {/* Header dan Tombol Dark Mode */}
        <div className="flex justify-between items-center border-b pb-2 mb-6 border-gray-200 dark:border-gray-700">
          <h1 className="text-3xl font-bold text-indigo-700 dark:text-indigo-400">
            💰 Dashboard Keuangan Pribadi
          </h1>
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? "🌞" : "🌙"}
          </button>
        </div>

        {error && (
          <p className="text-red-600 dark:text-red-400 font-medium mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-md">
            Error: {error}
          </p>
        )}

        {/* Ringkasan Saldo (Summary Cards) */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <SummaryCard
            title="Total Pemasukan"
            amount={totalIncome}
            color="text-green-600 dark:text-green-400"
            bg="bg-green-50 dark:bg-gray-700"
            textColor="text-gray-500 dark:text-gray-300"
          />
          <SummaryCard
            title="Total Pengeluaran"
            amount={totalExpense}
            color="text-red-600 dark:text-red-400"
            bg="bg-red-50 dark:bg-gray-700"
            textColor="text-gray-500 dark:text-gray-300"
          />
          <SummaryCard
            title="Saldo Bersih"
            amount={currentBalance}
            color={
              currentBalance >= 0
                ? "text-indigo-600 dark:text-indigo-400"
                : "text-red-800 dark:text-red-500"
            }
            bg="bg-indigo-50 dark:bg-gray-700"
            textColor="text-gray-500 dark:text-gray-300"
          />
        </div>

        {/* Formulir Input Transaksi */}
        <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-200 border-b pb-2 border-gray-200 dark:border-gray-700">
          Tambah Transaksi Baru
        </h2>
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-6 gap-3 mb-8 items-center"
        >
          <select
            name="jenis"
            value={formData.jenis}
            onChange={handleChange}
            required
            className="col-span-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 dark:text-gray-200"
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
            className="col-span-2 p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-200"
          />
          <input
            type="number"
            name="jumlah"
            placeholder="Jumlah (Rp)"
            value={formData.jumlah}
            onChange={handleChange}
            required
            min="1"
            className="col-span-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-200"
          />
          <input
            type="date"
            name="tanggal"
            value={formData.tanggal}
            onChange={handleChange}
            required
            className="col-span-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-200"
          />
          <button
            type="submit"
            className="col-span-1 bg-indigo-600 text-white font-semibold py-2 rounded-md hover:bg-indigo-700 transition duration-150"
          >
            Simpan
          </button>
        </form>

        {/* Daftar Transaksi */}
        <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-200 border-b pb-2 border-gray-200 dark:border-gray-700">
          Riwayat Transaksi
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <TableHeader title="Tanggal" />
                <TableHeader title="Deskripsi" />
                <TableHeader title="Jenis" />
                <TableHeader title="Jumlah" align="text-right" />
                <TableHeader title="Aksi" /> {/* Tambah kolom aksi */}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {transactions.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                  >
                    Belum ada transaksi yang tercatat.
                  </td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr
                    key={t.id}
                    className={`
                                        ${
                                          t.jenis === "pemasukan"
                                            ? "hover:bg-green-50/50 dark:hover:bg-green-900/50"
                                            : "hover:bg-red-50/50 dark:hover:bg-red-900/50"
                                        }
                                    `}
                  >
                    {/* Perbaikan Format Tanggal */}
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(t.tanggal)}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {t.deskripsi}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          t.jenis === "pemasukan"
                            ? "bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100"
                            : "bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100"
                        }`}
                      >
                        {t.jenis.charAt(0).toUpperCase() + t.jenis.slice(1)}
                      </span>
                    </td>
                    <td
                      className={`px-6 py-3 whitespace-nowrap text-sm font-semibold text-right ${
                        t.jenis === "pemasukan"
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {formatRupiah(t.jumlah)}
                    </td>
                    {/* Tombol Hapus */}
                    <td className="px-6 py-3 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => deleteTransaction(t.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 transition"
                        disabled={loading}
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Komponen Pembantu (SAMA)
const SummaryCard = ({ title, amount, color, bg, textColor }) => (
  <div
    className={`p-4 rounded-lg shadow-md flex flex-col items-center border border-gray-100 dark:border-gray-700 ${bg}`}
  >
    <p className={`text-sm font-medium mb-1 ${textColor}`}>{title}</p>
    <p className={`text-2xl font-extrabold ${color}`}>{formatRupiah(amount)}</p>
  </div>
);

const TableHeader = ({ title, align = "text-left" }) => (
  <th
    scope="col"
    className={`px-6 py-3 ${align} text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider`}
  >
    {title}
  </th>
);
