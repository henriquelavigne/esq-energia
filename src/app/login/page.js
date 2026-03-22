"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Credenciais incorretas.');
        setLoading(false);
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      setError('Erro ao conectar. Tente novamente.');
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "radial-gradient(ellipse at 30% 20%, rgba(16, 185, 129, 0.08), transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(59, 130, 246, 0.05), transparent 50%), var(--bg-darker)",
      position: "relative", overflow: "hidden"
    }}>
      {/* Background glow */}
      <div style={{
        position: "absolute", top: "-20%", left: "-10%", width: "500px", height: "500px",
        background: "radial-gradient(circle, rgba(16, 185, 129, 0.06), transparent 70%)",
        borderRadius: "50%", filter: "blur(60px)", pointerEvents: "none"
      }} />

      <div className="animate-in" style={{
        padding: "2.5rem", width: "100%", maxWidth: "420px",
        background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(24px)",
        border: "1px solid var(--glass-border)", borderRadius: "20px",
        boxShadow: "0 25px 60px rgba(0, 0, 0, 0.4)",
        position: "relative", zIndex: 1
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{
            width: 52, height: 52, borderRadius: "14px", margin: "0 auto 16px",
            background: "linear-gradient(135deg, var(--primary), #059669)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.5rem", boxShadow: "0 8px 24px rgba(16, 185, 129, 0.3)"
          }}>⚡</div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "6px", letterSpacing: "-0.02em" }}>
            Acesse o <span className="gradient-text">ESQ</span>
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
            Entre com suas credenciais para continuar
          </p>
        </div>

        {error && (
          <div style={{
            background: "var(--danger-bg)", color: "var(--danger)",
            padding: "10px 14px", borderRadius: "10px", fontSize: "0.82rem",
            marginBottom: "16px", textAlign: "center",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "6px"
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label className="form-label">E-mail</label>
            <input
              type="text" name="email" placeholder="email@exemplo.com" required
              className="form-input"
            />
          </div>

          <div>
            <label className="form-label">Senha</label>
            <input
              type="password" name="password" placeholder="••••••••" required
              className="form-input"
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary" style={{
            textAlign: "center", marginTop: "8px", width: "100%",
            justifyContent: "center", padding: "12px",
            opacity: loading ? 0.7 : 1
          }}>
            {loading ? (
              <><span className="spinner" style={{ width: 16, height: 16 }} /> Entrando...</>
            ) : 'Entrar'}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.78rem", color: "var(--text-muted)" }}>
          ESQ Energia © 2026 · Gestão Solar
        </div>
      </div>
    </div>
  );
}
