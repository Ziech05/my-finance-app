// File: my-finance-app/app/page.js

"use client";

import { useState, useEffect, useRef } from "react";

// Helper untuk format mata uang Rupiah (SAMA)
const formatRupiah = (amount) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

// Helper untuk memformat tanggal (SAMA)
const formatDate = (dateString) => {
  if (!dateString) return "";
  return dateString.split("T")[0];
};

export default function FinanceTracker() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const importFileInputRef = useRef(null); // Ref untuk input file

  // ... (Logika Dark Mode, State, fetchTransactions, handleChange, handleSubmit, deleteTransaction - SEMUA SAMA) ...
  // (Pindahkan fungsi fetchTransactions, handleChange, handleSubmit, deleteTransaction dari kode sebelumnya ke sini)

  // --- State dan Logic Lainnya ---
  const [transactions, setTransactions] = useState([]);
  const [formData, setFormData] = useState({
    jenis: "",
    deskripsi: "",
    jumlah: "",
    tanggal: new Date().toISOString().split("T")[0],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null); // State untuk pesan sukses

  const clearMessages = () => {
    setTimeout(() => {
      setError(null);
      setMessage(null);
    }, 5000); // Pesan hilang setelah 5 detik
  };

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/transactions");
      if (!response.ok) {
        throw new Error("Gagal mengambil data dari server.");
      }
      const data = await response.json();
      // Membersihkan kolom 'id' dan 'created_at' agar data siap di-export
      const cleanData = data.map(({ id, created_at, ...rest }) => rest);
      setTransactions(cleanData);
    } catch (err) {
      setError(err.message);
      clearMessages();
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
    e.preventDefault();
    setError(null);
    setMessage(null);

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
      setMessage("Transaksi berhasil ditambahkan!");
      clearMessages();
    } catch (err) {
      setError(err.message);
      clearMessages();
    }
  };

  const deleteTransaction = async (id) => {
    if (!confirm("Anda yakin ingin menghapus transaksi ini?")) return;

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/transactions?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal menghapus transaksi.");
      }

      await fetchTransactions();
      setMessage("Transaksi berhasil dihapus!");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      clearMessages();
    }
  };

  // --- FITUR EXPORT (BARU) ---
  const handleExport = () => {
    const jsonString = JSON.stringify(transactions, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `backup_keuangan_${
      new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setMessage("Data berhasil diekspor ke file JSON!");
    clearMessages();
  };

  // --- FITUR IMPORT (BARU) ---
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      setLoading(true);
      setError(null);
      setMessage(null);

      try {
        const importedData = JSON.parse(event.target.result);

        if (!Array.isArray(importedData)) {
          throw new Error(
            "File JSON tidak valid. Data harus berupa array transaksi."
          );
        }

        // Kirim data ke API PUT untuk restore
        const response = await fetch("/api/transactions", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transactions: importedData }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Gagal memproses data impor.");
        }

        // Refresh data setelah impor
        await fetchTransactions();
        setMessage(
          `Berhasil mengimpor dan me-restore ${importedData.length} transaksi!`
        );
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
        e.target.value = null; // Reset input file
        clearMessages();
      }
    };
    reader.readAsText(file);
  };

  const handleImportClick = () => {
    importFileInputRef.current.click();
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
        {/* Header, Tombol Dark Mode, dan Aksi Backup/Restore */}
        <div className="flex justify-between items-center border-b pb-2 mb-6 border-gray-200 dark:border-gray-700">
          <h1 className="text-3xl font-bold text-indigo-700 dark:text-indigo-400">
            💰 Dashboard Keuangan Pribadi
          </h1>
          <div className="flex space-x-2">
            {/* Tombol Import (Restore) */}
            <button
              onClick={handleImportClick}
              className="text-sm font-semibold py-2 px-3 rounded-md bg-yellow-500 text-white hover:bg-yellow-600 transition"
              disabled={loading}
            >
              Import & Restore
            </button>
            {/* Input File tersembunyi */}
            <input
              type="file"
              ref={importFileInputRef}
              onChange={handleFileChange}
              accept=".json"
              style={{ display: "none" }}
            />

            {/* Tombol Export (Backup) */}
            <button
              onClick={handleExport}
              className="text-sm font-semibold py-2 px-3 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition"
              disabled={loading}
            >
              Export Backup
            </button>

            {/* Tombol Dark Mode */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              title={
                isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"
              }
              disabled={loading}
            >
              {isDarkMode ? "🌞" : "🌙"}
            </button>
          </div>
        </div>

        {/* Pesan Error & Sukses */}
        {error && (
          <p className="text-red-600 dark:text-red-400 font-medium mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-md">
            Error: {error}
          </p>
        )}
        {message && (
          <p className="text-green-600 dark:text-green-400 font-medium mb-4 p-3 bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 rounded-md">
            {message}
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
            disabled={loading}
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
            disabled={loading}
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
            disabled={loading}
          />
          <input
            type="date"
            name="tanggal"
            value={formData.tanggal}
            onChange={handleChange}
            required
            className="col-span-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-200"
            disabled={loading}
          />
          <button
            type="submit"
            className="col-span-1 bg-indigo-600 text-white font-semibold py-2 rounded-md hover:bg-indigo-700 transition duration-150"
            disabled={loading}
          >
            {loading ? "Menyimpan..." : "Simpan"}
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
                <TableHeader title="Aksi" />
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
                transactions.map((t, index) => (
                  <tr
                    key={index}
                    className={`
                                        ${
                                          t.jenis === "pemasukan"
                                            ? "hover:bg-green-50/50 dark:hover:bg-green-900/50"
                                            : "hover:bg-red-50/50 dark:hover:bg-red-900/50"
                                        }
                                    `}
                  >
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
