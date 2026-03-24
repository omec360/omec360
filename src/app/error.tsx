"use client";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  return (
    <html>
      <body style={{ padding: 40, color: "white", background: "#0a0a0a", minHeight: "100vh" }}>
        <h2 style={{ color: "#C9A84C" }}>שגיאה</h2>
        <pre style={{ color: "#ff6b6b", whiteSpace: "pre-wrap", fontSize: 12 }}>
          {error?.message || "Unknown error"}
          {"\n\n"}
          {error?.stack || ""}
          {"\n\nDigest: "}
          {error?.digest || ""}
        </pre>
      </body>
    </html>
  );
}
