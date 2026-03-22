"use client";
import React, { useState, useEffect } from 'react';

function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return <div className={`toast toast-${type}`}>{type === 'success' ? '✅' : '❌'} {message}</div>;
}

export default function Consumidores() {
  const [showForm, setShowForm] = useState(false);
  const [consumidores, setConsumidores] = useState([]);
  const [usinas, setUsinas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = () => {
    Promise.all([
      fetch('/api/ucs').then(r => r.json()).catch(() => []),
      fetch('/api/usinas').then(r => r.json()).catch(() => []),
    ]).then(([ucs, us]) => {
      setConsumidores(Array.isArray(ucs) ? ucs : []);
      setUsinas(Array.isArray(us) ? us : []);
      setLoading(false);
    });
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.target);
    const body = {
      codigo_uc: fd.get('codigo_uc'),
      endereco: fd.get('endereco'),
      usina_id: fd.get('usina_id') || undefined,
    };
    try {
      const res = await fetch('/api/ucs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) {
        setToast({ message: 'UC criada com sucesso!', type: 'success' });
        setShowForm(false);
        fetchData();
      } else {
        const d = await res.json();
        setToast({ message: d.error || 'Erro ao criar UC', type: 'error' });
      }
    } catch { setToast({ message: 'Erro de conexão', type: 'error' }); }
    setSubmitting(false);
  };

  const totalConsumo = consumidores.reduce((acc, uc) => acc + Number(uc.consumo_medio_kwh || 0), 0);

  return (
    <div style={{ flex: 1 }}>
      {toast && <div className="toast-container"><Toast {...toast} onClose={() => setToast(null)} /></div>}

      <header className="page-header">
        <div>
          <h1 className="page-title">Unidades Consumidoras</h1>
          <p className="page-subtitle">Gerencie as unidades consumidoras vinculadas às suas usinas.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          {showForm ? "✕ Fechar" : "🏠 Nova UC"}
        </button>
      </header>

      {/* Form */}
      {showForm && (
        <div className="glass animate-in" style={{ padding: "1.5rem", marginBottom: "1.5rem", borderColor: "rgba(16, 185, 129, 0.2)" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem", color: "var(--primary)" }}>Cadastrar Nova UC</h3>
          <form onSubmit={handleCreate}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
              <div>
                <label className="form-label">Código UC</label>
                <input name="codigo_uc" required placeholder="Ex: UC-005" className="form-input" />
              </div>
              <div>
                <label className="form-label">Endereço</label>
                <input name="endereco" required placeholder="Rua, número - Cidade" className="form-input" />
              </div>
              <div>
                <label className="form-label">Usina</label>
                <select name="usina_id" className="form-select">
                  <option value="">Selecione...</option>
                  {usinas.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginTop: "12px", display: "flex", gap: "10px" }}>
              <button type="submit" disabled={submitting} className="btn btn-primary btn-sm">
                {submitting ? <><span className="spinner" /> Salvando...</> : '✅ Salvar UC'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-outline btn-sm">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "1.5rem" }}>
        <div className="glass-card kpi-card">
          <span className="kpi-label">Total de UCs</span>
          <div className="kpi-value">{consumidores.length}</div>
        </div>
        <div className="glass-card kpi-card">
          <span className="kpi-label">UCs Ativas</span>
          <div className="kpi-value" style={{ color: "var(--primary)" }}>{consumidores.length}</div>
        </div>
        <div className="glass-card kpi-card">
          <span className="kpi-label">Consumo Total</span>
          <div className="kpi-value">{totalConsumo.toLocaleString('pt-BR')} kWh</div>
        </div>
      </div>

      {/* Table */}
      <div className="glass" style={{ padding: "1.5rem" }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>Listagem de Unidades Consumidoras</h3>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[1,2,3].map(i => <div key={i} className="skeleton skeleton-row" />)}
          </div>
        ) : consumidores.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏠</div>
            <div className="empty-state-text">Nenhuma UC cadastrada</div>
            <div className="empty-state-hint">Clique em "Nova UC" para cadastrar sua primeira unidade.</div>
          </div>
        ) : (
          <>
            <div className="table-header" style={{ gridTemplateColumns: "0.8fr 1.5fr 0.8fr 1fr" }}>
              <span>Código</span><span>Endereço</span><span>Consumo</span><span>Usina</span>
            </div>
            {consumidores.map((c) => (
              <div key={c.id} className="table-row" style={{ gridTemplateColumns: "0.8fr 1.5fr 0.8fr 1fr" }}>
                <span style={{ color: "var(--primary)", fontWeight: 600 }}>{c.codigo_uc}</span>
                <span style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>{c.endereco || '—'}</span>
                <span style={{ fontWeight: 500 }}>{c.consumo_medio_kwh || '—'} kWh</span>
                <span style={{ fontSize: "0.82rem" }}>{c.usinas?.nome || '—'}</span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
