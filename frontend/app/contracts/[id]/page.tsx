"use client";

import { useEffect, useState } from "react";
import {
  getContractStatus,
  getContractClauses,
} from "@/services/api";
import { translations } from "@/utils/translations";

export default function ContractDetailsPage() {
  const [status, setStatus] = useState("loading");
  const [clauses, setClauses] = useState<any[]>([]);
  const [lang, setLang] = useState("en");

  useEffect(() => {
    const savedLang = localStorage.getItem("lang") || "en";
    setLang(savedLang);

    const token = localStorage.getItem("token");

    const fetchData = async () => {
      try {
        if (!token) return;

        const statusData = await getContractStatus(1, token);
        setStatus(statusData.status);

        const clausesData = await getContractClauses(1, token);
        setClauses(clausesData.clauses);
      } catch {
        setStatus("failed");
      }
    };

    fetchData();
  }, []);

  const t = translations[lang as "en" | "ar"];

  return (
    <div style={{ padding: "30px" }}>
      <h1>Contract Details</h1>

      <p>Status: {t[status as keyof typeof t] || status}</p>

      <h2>Clauses</h2>

      {clauses.map((clause) => (
        <div
          key={clause.id}
          style={{
            border: "1px solid #ccc",
            padding: "10px",
            marginBottom: "10px",
            borderRadius: "8px",
          }}
        >
          <strong>{clause.heading}</strong>
          <p>{t[clause.category.toLowerCase() as keyof typeof t] || clause.category}</p>
          <p>{clause.text}</p>
        </div>
      ))}
    </div>
  );
}