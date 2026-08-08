"use client";

import { useEffect } from "react";

export function PrintControls({ auto }: { auto: boolean }) {
  useEffect(() => {
    if (auto) {
      const t = setTimeout(() => window.print(), 300);
      return () => clearTimeout(t);
    }
  }, [auto]);

  return (
    <div className="no-print" style={{ textAlign: "center", margin: "8px 0" }}>
      <button
        onClick={() => window.print()}
        style={{
          padding: "8px 16px",
          fontSize: 14,
          cursor: "pointer",
          border: "1px solid #ccc",
          borderRadius: 6,
          background: "#f5f5f5",
        }}
      >
        🖨 Imprimir
      </button>
      <button
        onClick={() => window.close()}
        style={{
          padding: "8px 16px",
          fontSize: 14,
          cursor: "pointer",
          border: "1px solid #ccc",
          borderRadius: 6,
          background: "#f5f5f5",
          marginLeft: 8,
        }}
      >
        Cerrar
      </button>
    </div>
  );
}
