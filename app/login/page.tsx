"use client";

export default function LoginPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: "#f8fafc",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "white",
          border: "1px solid rgba(0,0,0,0.08)",
          borderRadius: 20,
          padding: 24,
          boxShadow: "0 14px 36px rgba(0,0,0,0.08)",
        }}
      >
        <div
          style={{
            fontSize: 32,
            fontWeight: 1000,
            color: "#0f172a",
            marginBottom: 10,
          }}
        >
          Login
        </div>

        <div
          style={{
            fontSize: 14,
            color: "#475569",
            fontWeight: 800,
            marginBottom: 18,
          }}
        >
          SIMLOG-WEB authentication page.
        </div>

        <input
          type="email"
          placeholder="Email"
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 12,
            border: "1px solid #cbd5e1",
            marginBottom: 12,
            fontWeight: 900,
          }}
        />

        <input
          type="password"
          placeholder="Password"
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 12,
            border: "1px solid #cbd5e1",
            marginBottom: 16,
            fontWeight: 900,
          }}
        />

        <button
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 12,
            border: "1px solid rgba(0,0,0,0.10)",
            background: "#0f172a",
            color: "white",
            fontWeight: 1000,
            cursor: "pointer",
          }}
        >
          Sign In
        </button>
      </div>
    </main>
  );
}