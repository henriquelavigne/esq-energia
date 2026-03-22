"use client";
import React, { useState } from 'react';

function Toast({ message, type, onClose }) {
  React.useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return <div className={`toast toast-${type}`}>{type === 'success' ? '✅' : '❌'} {message}</div>;
}

export default function Configuracoes() {
  const [nomeEmpresa, setNomeEmpresa] = useState("ESQ Energia");
  const [email, setEmail] = useState("contato@esqenergia.com.br");
  const [telefone, setTelefone] = useState("(31) 99999-0000");
  const [notif, setNotif] = useState(true);
  const [notifFatura, setNotifFatura] = useState(true);
  const [notifCredito, setNotifCredito] = useState(false);
  const [toast, setToast] = useState(null);

  const handleSave = () => {
    setToast({ message: 'Configurações salvas com sucesso!', type: 'success' });
  };

  const Toggle = ({ value, onChange }) => (
    <div onClick={onChange} style={{
      width: "44px", height: "24px", borderRadius: "12px", cursor: "pointer", transition: "all var(--transition-fast)",
      background: value ? "var(--primary)" : "rgba(255,255,255,0.1)", position: "relative",
      boxShadow: value ? "0 0 12px rgba(16, 185, 129, 0.3)" : "none"
    }}>
      <div style={{
        width: "18px", height: "18px", borderRadius: "50%", background: "#fff",
        position: "absolute", top: "3px", left: value ? "23px" : "3px",
        transition: "left var(--transition-fast)",
        boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
      }} />
    </div>
  );

  return (
    <div style={{ flex: 1, maxWidth: "800px" }}>
      {toast && <div className="toast-container"><Toast {...toast} onClose={() => setToast(null)} /></div>}

      <header style={{ marginBottom: "2rem" }}>
        <h1 className="page-title">Configurações</h1>
        <p className="page-subtitle">Gerencie suas preferências de conta e notificações.</p>
      </header>

      {/* Dados da Empresa */}
      <div className="glass animate-in" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1.2rem", display: "flex", alignItems: "center", gap: "8px" }}>
          🏢 Dados da Empresa
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label className="form-label">Nome da Empresa</label>
            <input value={nomeEmpresa} onChange={(e) => setNomeEmpresa(e.target.value)} className="form-input" />
          </div>
          <div>
            <label className="form-label">E-mail de Contato</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} className="form-input" />
          </div>
          <div>
            <label className="form-label">Telefone</label>
            <input value={telefone} onChange={(e) => setTelefone(e.target.value)} className="form-input" />
          </div>
          <div>
            <label className="form-label">CNPJ</label>
            <input defaultValue="00.000.000/0001-00" disabled className="form-input" style={{ opacity: 0.5, cursor: "not-allowed" }} />
          </div>
        </div>
      </div>

      {/* Notificações */}
      <div className="glass animate-in" style={{ padding: "1.5rem", marginBottom: "1.5rem", animationDelay: "0.1s" }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1.2rem", display: "flex", alignItems: "center", gap: "8px" }}>
          🔔 Notificações
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {[
            { label: "Notificações por E-mail", desc: "Receba atualizações gerais do sistema", value: notif, onChange: () => setNotif(!notif) },
            { label: "Alerta de Faturas", desc: "Aviso quando uma fatura vencer", value: notifFatura, onChange: () => setNotifFatura(!notifFatura) },
            { label: "Relatório de Créditos", desc: "Relatório mensal de créditos gerados", value: notifCredito, onChange: () => setNotifCredito(!notifCredito) },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{item.label}</span>
                <p style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginTop: 2 }}>{item.desc}</p>
              </div>
              <Toggle value={item.value} onChange={item.onChange} />
            </div>
          ))}
        </div>
      </div>

      {/* Segurança */}
      <div className="glass animate-in" style={{ padding: "1.5rem", marginBottom: "1.5rem", animationDelay: "0.2s" }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1.2rem", display: "flex", alignItems: "center", gap: "8px" }}>
          🔒 Segurança
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label className="form-label">Senha Atual</label>
            <input type="password" placeholder="••••••••" className="form-input" />
          </div>
          <div>
            <label className="form-label">Nova Senha</label>
            <input type="password" placeholder="••••••••" className="form-input" />
          </div>
        </div>
      </div>

      {/* Save */}
      <button onClick={handleSave} className="btn btn-primary" style={{ padding: "12px 30px" }}>
        💾 Salvar Configurações
      </button>
    </div>
  );
}
