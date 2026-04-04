"use client";

import { useEffect, useState } from "react";

export default function Dashboard() {
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
    }
  }, []);

  const handleUpload = () => {
    if (!file) {
      alert("Please select a file");
      return;
    }

    alert("File ready to send 🚀");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      
      <div className="bg-white p-8 rounded-2xl shadow-lg w-96">
        
        <h1 className="text-2xl font-bold mb-6 text-center">
          Dashboard 🎉
        </h1>

        <input
          type="file"
          className="w-full mb-4"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />

        <button
          onClick={handleUpload}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
        >
          Upload Contract
        </button>

      </div>
    </div>
  );
}