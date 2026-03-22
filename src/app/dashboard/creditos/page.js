"use client";
import React, { useState, useEffect } from 'react';

function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return <div className={`toast toast-${type}`}>{type === 'success' ? '✅' : '❌'} {message}</div>;
}

export default function Creditos() {
  const [alocacoes, setAlocacoes] = useState([]);
  const [usinas, setUsinas] = useState([]);
  const [ucs, setUcs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = () => {
    Promise.all([
      fetch('/api/alocacoes').then(r => r.json()).catch(() => []),
      fetch('/api/usinas').then(r => r.json()).catch(() => []),
      fetch('/api/ucs').then(r => r.json()).catch(() => []),
    ]).then(([a, u, c]) => {
      setAlocacoes(Array.isArray(a) ? a : []);
      setUsinas(Array.isArray(u) ? u : []);
      setUcs(Array.isArray(c) ? c : []);
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
      uc_id: fd.get('uc_id'),
      percentual: Number(fd.get('percentual')),
    };
    try {
      const res = await fetch('/api/alocacoes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) {
        setToast({ message: 'Alocação criada com sucesso!', type: 'success' });
        setShowModal(false);
        fetchData();
      } else {
        const d = await res.json();
        setToast({ message: d.error || 'Erro ao criar alocação', type: 'error' });
      }
    } catch { setToast({ message: 'Erro de conexão', type: 'error' }); }
    setSubmitting(false);
  };

  const totalPercentual = alocacoes.reduce((acc, a) => acc + Number(a.percentual || 0), 0);
  const ativas = alocacoes.filter(a => a.ativo !== false).length;

  return (
    <div style={{ flex: 1 }}>
      {toast && <div className="toast-container"><Toast {...toast} onClose={() => setToast(null)} /></div>}

      <header className="page-header">
        <div>
          <h1 className="page-title">Alocação de Créditos</h1>
          <p className="page-subtitle">Gerencie o percentual de rateio de créditos entre as unidades consumidoras.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          💎 Nova Alocação
        </button>
      </header>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "1.5rem" }}>
        <div className="glass-card kpi-card">
          <span className="kpi-label">Total Alocado</span>
          <div className="kpi-value" style={{ color: totalPercentual > 100 ? "var(--danger)" : "var(--primary)" }}>{totalPercentual}%</div>
        </div>
        <div className="glass-card kpi-card">
          <span className="kpi-label">Alocações Ativas</span>
          <div className="kpi-value">{ativas}</div>
        </div>
        <div className="glass-card kpi-card">
          <span className="kpi-label">Disponível</span>
          <div className="kpi-value">{Math.max(0, 100 - totalPercentual)}%</div>
          {totalPercentual > 100 && <span className="kpi-change negative">⚠️ Excedido</span>}
        </div>
      </div>

      {/* Table */}
      <div className="glass" style={{ padding: "1.5rem" }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>Rateio por UC</h3>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[1,2,3].map(i => <div key={i} className="skeleton skeleton-row" />)}
          </div>
        ) : alocacoes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💎</div>
            <div className="empty-state-text">Nenhum rateio configurado</div>
            <div className="empty-state-hint">Clique em "Nova Alocação" para distribuir créditos.</div>
          </div>
        ) : (
          <>
            <div className="table-header" style={{ gridTemplateColumns: "1.5fr 1.5fr 0.8fr 0.8fr" }}>
              <span>Usina</span><span>Unidade Consumidora</span><span>Percentual</span><span>Status</span>
            </div>
            {alocacoes.map((a) => {
              const usinaName = usinas.find(u => u.id === a.usina_id)?.nome || a.usina_id?.substring(0,8) || '—';
              const ucCode = a.unidades_consumidoras?.codigo_uc || ucs.find(c => c.id === a.uc_id)?.codigo_uc || '—';
              return (
                <div key={a.id} className="table-row" style={{ gridTemplateColumns: "1.5fr 1.5fr 0.8fr 0.8fr" }}>
                  <span style={{ fontWeight: 500 }}>{usinaName}</span>
                  <span>{ucCode}</span>
                  <span style={{ fontWeight: 600, color: "var(--primary)" }}>{a.percentual}%</span>
                  <span className={`badge ${a.ativo !== false ? 'badge-success' : 'badge-warning'}`}>
                    {a.ativo !== false ? 'Ativo' : 'Inativo'}
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
              <span>💎 Nova Alocação de Créditos</span>
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
              <div>
                <label className="form-label">Unidade Consumidora</label>
                <select name="uc_id" required className="form-select">
                  <option value="">Selecione a UC...</option>
                  {ucs.map(c => <option key={c.id} value={c.id}>{c.codigo_uc} — {c.endereco || 'Sem endereço'}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Percentual de Rateio (%)</label>
                <input name="percentual" type="number" min="0" max="100" step="0.1" required placeholder="Ex: 35" className="form-input" />
              </div>
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">Cancelar</button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? <><span className="spinner" /> Criando...</> : '✅ Criar Alocação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
