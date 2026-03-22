"use client";
import React, { useState, useEffect } from 'react';

function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return <div className={`toast toast-${type}`}>{type === 'success' ? '✅' : '❌'} {message}</div>;
}

export default function Medicoes() {
  const [medicoes, setMedicoes] = useState([]);
  const [usinas, setUsinas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = () => {
    Promise.all([
      fetch('/api/medicoes').then(r => r.json()).catch(() => []),
      fetch('/api/usinas').then(r => r.json()).catch(() => []),
    ]).then(([m, u]) => {
      setMedicoes(Array.isArray(m) ? m : []);
      setUsinas(Array.isArray(u) ? u : []);
      setLoading(false);
    });
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.target);
    const body = {
      usina_id: fd.get('usina_id'),
      mes_ano: fd.get('mes_ano'),
      geracao_kwh: Number(fd.get('geracao_kwh')),
    };
    try {
      const res = await fetch('/api/medicoes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) {
        setToast({ message: 'Medição registrada com sucesso!', type: 'success' });
        setShowModal(false);
        fetchData();
      } else {
        const d = await res.json();
        setToast({ message: d.error || 'Erro ao registrar medição', type: 'error' });
      }
    } catch { setToast({ message: 'Erro de conexão', type: 'error' }); }
    setSubmitting(false);
  };

  const totalGeracao = medicoes.reduce((acc, m) => acc + Number(m.geracao_kwh || 0), 0);
  const mediaGeracao = medicoes.length > 0 ? totalGeracao / medicoes.length : 0;

  return (
    <div style={{ flex: 1 }}>
      {toast && <div className="toast-container"><Toast {...toast} onClose={() => setToast(null)} /></div>}

      <header className="page-header">
        <div>
          <h1 className="page-title">Medições</h1>
          <p className="page-subtitle">Registre e monitore a geração de energia (kWh) de cada usina por mês.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          📏 Nova Medição
        </button>
      </header>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "1.5rem" }}>
        <div className="glass-card kpi-card">
          <span className="kpi-label">Total de Registros</span>
          <div className="kpi-value">{medicoes.length}</div>
        </div>
        <div className="glass-card kpi-card">
          <span className="kpi-label">Geração Total</span>
          <div className="kpi-value" style={{ color: "var(--primary)" }}>{totalGeracao.toLocaleString('pt-BR')} kWh</div>
        </div>
        <div className="glass-card kpi-card">
          <span className="kpi-label">Média por Registro</span>
          <div className="kpi-value">{mediaGeracao.toFixed(1)} kWh</div>
        </div>
      </div>

      {/* Table */}
      <div className="glass" style={{ padding: "1.5rem" }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>Histórico de Medições</h3>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[1,2,3].map(i => <div key={i} className="skeleton skeleton-row" />)}
          </div>
        ) : medicoes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📏</div>
            <div className="empty-state-text">Nenhuma medição registrada</div>
            <div className="empty-state-hint">Clique em "Nova Medição" para registrar a geração de uma usina.</div>
          </div>
        ) : (
          <>
            <div className="table-header" style={{ gridTemplateColumns: "1.5fr 0.8fr 0.8fr 0.8fr 1fr" }}>
              <span>Usina</span><span>Mês/Ano</span><span>Geração</span><span>Fonte</span><span>Data Registro</span>
            </div>
            {medicoes.map((m) => {
              const usinaName = usinas.find(u => u.id === m.usina_id)?.nome || m.usina_id?.substring(0,8) || '—';
              return (
                <div key={m.id} className="table-row" style={{ gridTemplateColumns: "1.5fr 0.8fr 0.8fr 0.8fr 1fr" }}>
                  <span style={{ fontWeight: 500 }}>{usinaName}</span>
                  <span>{m.mes_ano ? new Date(m.mes_ano).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }) : '—'}</span>
                  <span style={{ fontWeight: 600, color: "var(--primary)" }}>{m.geracao_kwh} kWh</span>
                  <span className={`badge ${m.fonte === 'Automático' ? 'badge-info' : 'badge-warning'}`}>
                    {m.fonte || 'manual'}
                  </span>
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>
                    {m.criado_em ? new Date(m.criado_em).toLocaleDateString('pt-BR') : '—'}
                  </span>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-content">
            <div className="modal-title">
              <span>📏 Nova Medição</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label className="form-label">Usina</label>
                <select name="usina_id" required className="form-select">
                  <option value="">Selecione a usina...</option>
                  {usinas.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label className="form-label">Mês de Referência</label>
                  <input name="mes_ano" type="month" required className="form-input" />
                </div>
                <div>
                  <label className="form-label">Geração (kWh)</label>
                  <input name="geracao_kwh" type="number" step="0.01" min="0" required placeholder="Ex: 450" className="form-input" />
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">Cancelar</button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? <><span className="spinner" /> Registrando...</> : '✅ Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
