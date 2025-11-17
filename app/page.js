// File: my-finance-app/app/page.js

"use client";

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
    tanggal: new Date().toISOString().split("T")[0],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Data Fetching dan API Handlers (Sama seperti sebelumnya) ---

  const fetchTransactions = async () => {
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

  // --- Perhitungan Saldo ---
  const totalIncome = transactions
    .filter((t) => t.jenis === "pemasukan")
    .reduce((sum, t) => sum + t.jumlah, 0);

  const totalExpense = transactions
    .filter((t) => t.jenis === "pengeluaran")
    .reduce((sum, t) => sum + t.jumlah, 0);

  const currentBalance = totalIncome - totalExpense;

  // --- Render Component ---

  if (loading)
    return (
      <div className="max-w-4xl mx-auto p-4 mt-10 text-center">
        Memuat data...
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-xl rounded-lg mt-10">
      <h1 className="text-3xl font-bold text-indigo-700 border-b pb-2 mb-6">
        💰 Dashboard Keuangan Pribadi
      </h1>
      {error && (
        <p className="text-red-600 font-medium mb-4 p-3 bg-red-100 border border-red-300 rounded-md">
          Error: {error}
        </p>
      )}

      {/* Ringkasan Saldo (Summary Cards) */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <SummaryCard
          title="Total Pemasukan"
          amount={totalIncome}
          color="text-green-600"
          bg="bg-green-50"
        />
        <SummaryCard
          title="Total Pengeluaran"
          amount={totalExpense}
          color="text-red-600"
          bg="bg-red-50"
        />
        <SummaryCard
          title="Saldo Bersih"
          amount={currentBalance}
          color={currentBalance >= 0 ? "text-indigo-600" : "text-red-800"}
          bg="bg-indigo-50"
        />
      </div>

      {/* Formulir Input Transaksi */}
      <h2 className="text-2xl font-semibold mb-4 text-gray-700 border-b pb-2">
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
          className="col-span-1 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
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
          className="col-span-2 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
        />
        <input
          type="number"
          name="jumlah"
          placeholder="Jumlah (Rp)"
          value={formData.jumlah}
          onChange={handleChange}
          required
          min="1"
          className="col-span-1 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
        />
        <input
          type="date"
          name="tanggal"
          value={formData.tanggal}
          onChange={handleChange}
          required
          className="col-span-1 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
        />
        <button
          type="submit"
          className="col-span-1 bg-indigo-600 text-white font-semibold py-2 rounded-md hover:bg-indigo-700 transition duration-150"
        >
          Simpan
        </button>
      </form>

      {/* Daftar Transaksi */}
      <h2 className="text-2xl font-semibold mb-4 text-gray-700 border-b pb-2">
        Riwayat Transaksi
      </h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <TableHeader title="Tanggal" />
              <TableHeader title="Deskripsi" />
              <TableHeader title="Jenis" />
              <TableHeader title="Jumlah" align="text-right" />
              {/* <TableHeader title="Aksi" /> */}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  Belum ada transaksi yang tercatat.
                </td>
              </tr>
            ) : (
              transactions.map((t) => (
                <tr
                  key={t.id}
                  className={
                    t.jenis === "pemasukan"
                      ? "hover:bg-green-50/50"
                      : "hover:bg-red-50/50"
                  }
                >
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                    {t.tanggal}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    {t.deskripsi}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        t.jenis === "pemasukan"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {t.jenis.charAt(0).toUpperCase() + t.jenis.slice(1)}
                    </span>
                  </td>
                  <td
                    className={`px-6 py-3 whitespace-nowrap text-sm font-semibold ${
                      t.jenis === "pemasukan"
                        ? "text-green-600"
                        : "text-red-600"
                    } text-right`}
                  >
                    {formatRupiah(t.jumlah)}
                  </td>
                  {/* <td className="px-6 py-3 whitespace-nowrap text-sm font-medium">
                                        <button className="text-indigo-600 hover:text-indigo-900">Hapus</button>
                                    </td> */}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Komponen Pembantu (Auxiliary Components)
const SummaryCard = ({ title, amount, color, bg }) => (
  <div
    className={`p-4 rounded-lg shadow-md flex flex-col items-center ${bg} border border-gray-100`}
  >
    <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
    <p className={`text-2xl font-extrabold ${color}`}>{formatRupiah(amount)}</p>
  </div>
);

const TableHeader = ({ title, align = "text-left" }) => (
  <th
    scope="col"
    className={`px-6 py-3 ${align} text-xs font-medium text-gray-500 uppercase tracking-wider`}
  >
    {title}
  </th>
);
