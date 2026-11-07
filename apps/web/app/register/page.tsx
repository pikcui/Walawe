"use client";

import { useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    org_name: "",
    agent_name: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successData, setSuccessData] = useState<{ api_key: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8080";
      
      const res = await fetch(`${apiUrl}/admin/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registrasi gagal. Coba lagi.");
      }

      setSuccessData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (successData) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 font-mono">
        <div className="max-w-md w-full border border-neutral-800 p-8 rounded-xl bg-neutral-950 text-center space-y-6">
          <h2 className="text-2xl font-bold">Registrasi Berhasil!</h2>
          <p className="text-neutral-400 text-sm">
            Simpan API Key ini baik-baik. Kunci ini <strong>hanya ditampilkan sekali</strong> dan tidak bisa dilihat lagi.
          </p>
          
          <div className="bg-black border border-neutral-700 p-4 rounded text-left break-all text-green-400 font-mono text-sm">
            {successData.api_key}
          </div>

          <button
            onClick={() => navigator.clipboard.writeText(successData.api_key)}
            className="w-full bg-white text-black font-bold py-3 rounded hover:bg-neutral-200 transition"
          >
            Copy API Key
          </button>

          <Link href="/login" className="block text-sm text-neutral-400 hover:text-white underline">
            Lanjut ke Halaman Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 font-mono">
      <div className="max-w-md w-full border border-neutral-800 p-8 rounded-xl bg-neutral-950 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Walawe.</h1>
          <p className="text-neutral-400 text-sm">Buat akun agen AI otonom kamu.</p>
        </div>

        {error && (
          <div className="bg-red-950 border border-red-900 text-red-400 text-sm p-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-neutral-400 mb-1">Email</label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full bg-black border border-neutral-800 rounded p-3 text-white focus:outline-none focus:border-neutral-500"
              placeholder="admin@perusahaan.com"
            />
          </div>

          <div>
            <label className="block text-xs text-neutral-400 mb-1">Password (Minimal 12 karakter)</label>
            <input
              type="password"
              name="password"
              required
              minLength={12}
              value={formData.password}
              onChange={handleChange}
              className="w-full bg-black border border-neutral-800 rounded p-3 text-white focus:outline-none focus:border-neutral-500"
              placeholder="••••••••••••"
            />
          </div>

          <div>
            <label className="block text-xs text-neutral-400 mb-1">Nama Organisasi</label>
            <input
              type="text"
              name="org_name"
              required
              value={formData.org_name}
              onChange={handleChange}
              className="w-full bg-black border border-neutral-800 rounded p-3 text-white focus:outline-none focus:border-neutral-500"
              placeholder="PT Teknologi Masa Depan"
            />
          </div>

          <div>
            <label className="block text-xs text-neutral-400 mb-1">Nama Agen AI (Opsional)</label>
            <input
              type="text"
              name="agent_name"
              value={formData.agent_name}
              onChange={handleChange}
              className="w-full bg-black border border-neutral-800 rounded p-3 text-white focus:outline-none focus:border-neutral-500"
              placeholder="Default Agent"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black font-bold py-3 rounded hover:bg-neutral-200 transition disabled:opacity-50"
          >
            {loading ? "Memproses..." : "Daftar Sekarang"}
          </button>
        </form>

        <div className="text-center text-sm text-neutral-500">
          Sudah punya akun?{" "}
          <Link href="/login" className="text-white hover:underline">
            Login di sini
          </Link>
        </div>
      </div>
    </div>
  );
}
