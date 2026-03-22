"use client";
import React, { useState, useEffect } from 'react';

function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return <div className={`toast toast-${type}`}>{type === 'success' ? '✅' : '❌'} {message}</div>;
}

export default function Usinas() {
  const [usinas, setUsinas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUsina, setEditUsina] = useState(null);
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchUsinas = () => {
    fetch('/api/usinas').then(r => r.json()).then(data => {
      setUsinas(Array.isArray(data) ? data : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchUsinas(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.target);
    const body = { nome: fd.get('nome'), potencia_kwp: Number(fd.get('potencia_kwp')), concessionaria: fd.get('concessionaria') };
    try {
      const res = await fetch('/api/usinas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) {
        setToast({ message: 'Usina criada com sucesso!', type: 'success' });
        setShowModal(false);
        fetchUsinas();
      } else {
        const d = await res.json();
        setToast({ message: d.error || 'Erro ao criar usina', type: 'error' });
      }
    } catch { setToast({ message: 'Erro de conexão', type: 'error' }); }
    setSubmitting(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir esta usina?')) return;
    try {
      const res = await fetch(`/api/usinas/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setToast({ message: 'Usina excluída!', type: 'success' });
        fetchUsinas();
      } else {
        setToast({ message: 'Erro ao excluir', type: 'error' });
      }
    } catch { setToast({ message: 'Erro de conexão', type: 'error' }); }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.target);
    const body = { nome: fd.get('nome'), potencia_kwp: Number(fd.get('potencia_kwp')), concessionaria: fd.get('concessionaria') };
    try {
      const res = await fetch(`/api/usinas/${editUsina.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) {
        setToast({ message: 'Usina atualizada!', type: 'success' });
        setEditUsina(null);
        fetchUsinas();
      } else {
        setToast({ message: 'Erro ao atualizar', type: 'error' });
      }
    } catch { setToast({ message: 'Erro de conexão', type: 'error' }); }
    setSubmitting(false);
  };

  return (
    <div style={{ flex: 1 }}>
      {/* Toast */}
      {toast && <div className="toast-container"><Toast {...toast} onClose={() => setToast(null)} /></div>}

      <header className="page-header">
        <div>
          <h1 className="page-title">Minhas Usinas</h1>
          <p className="page-subtitle">Gerencie e monitore suas plantas de geração distribuída.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          ⚡ Nova Usina
        </button>
      </header>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "1.5rem" }}>
        <div className="glass-card kpi-card">
          <span className="kpi-label">Total de Usinas</span>
          <div className="kpi-value">{usinas.length}</div>
        </div>
        <div className="glass-card kpi-card">
          <span className="kpi-label">Potência Total</span>
          <div className="kpi-value" style={{ color: "var(--primary)" }}>
            {usinas.reduce((acc, u) => acc + Number(u.potencia_kwp || 0), 0)} kWp
          </div>
        </div>
        <div className="glass-card kpi-card">
          <span className="kpi-label">Concessionárias</span>
          <div className="kpi-value">
            {[...new Set(usinas.map(u => u.concessionaria).filter(Boolean))].length}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass" style={{ padding: "1.5rem" }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>Listagem de Usinas</h3>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[1,2,3].map(i => <div key={i} className="skeleton skeleton-row" />)}
          </div>
        ) : usinas.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">⚡</div>
            <div className="empty-state-text">Nenhuma usina cadastrada</div>
            <div className="empty-state-hint">Clique em "Nova Usina" para começar.</div>
          </div>
        ) : (
          <>
            <div className="table-header" style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr" }}>
              <span>Nome</span><span>Potência</span><span>Status</span><span style={{ textAlign: "right" }}>Ações</span>
            </div>
            {usinas.map((u) => (
              <div key={u.id} className="table-row" style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr" }}>
                <div>
                  <span style={{ fontWeight: 600, display: "block" }}>{u.nome}</span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>🏢 {u.concessionaria || '—'}</span>
                </div>
                <div>
                  <span style={{ fontWeight: 600 }}>{u.potencia_kwp} kWp</span>
                </div>
                <div>
                  <span className="badge badge-success">
                    <span className="status-dot active" style={{ width: 6, height: 6 }} /> Operando
                  </span>
                </div>
                <div style={{ textAlign: "right", display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                  <button onClick={() => setEditUsina(u)} className="btn btn-outline btn-sm">✏️ Editar</button>
                  <button onClick={() => handleDelete(u.id)} className="btn btn-outline btn-sm" style={{ color: "var(--danger)", borderColor: "rgba(239,68,68,0.3)" }}>🗑️</button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Modal Criar */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-content">
            <div className="modal-title">
              <span>⚡ Nova Usina</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label className="form-label">Nome da Usina</label>
                <input name="nome" required placeholder="Ex: Usina Solar Alfa" className="form-input" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label className="form-label">Potência (kWp)</label>
                  <input name="potencia_kwp" type="number" step="0.1" required placeholder="500" className="form-input" />
                </div>
                <div>
                  <label className="form-label">Concessionária</label>
                  <input name="concessionaria" required placeholder="Ex: COELBA" className="form-input" />
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">Cancelar</button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? <><span className="spinner" /> Criando...</> : '✅ Criar Usina'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar */}
      {editUsina && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setEditUsina(null)}>
          <div className="modal-content">
            <div className="modal-title">
              <span>✏️ Editar Usina</span>
              <button className="modal-close" onClick={() => setEditUsina(null)}>✕</button>
            </div>
            <form onSubmit={handleEdit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label className="form-label">Nome da Usina</label>
                <input name="nome" required defaultValue={editUsina.nome} className="form-input" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label className="form-label">Potência (kWp)</label>
                  <input name="potencia_kwp" type="number" step="0.1" required defaultValue={editUsina.potencia_kwp} className="form-input" />
                </div>
                <div>
                  <label className="form-label">Concessionária</label>
                  <input name="concessionaria" required defaultValue={editUsina.concessionaria} className="form-input" />
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" }}>
                <button type="button" onClick={() => setEditUsina(null)} className="btn btn-outline">Cancelar</button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? <><span className="spinner" /> Salvando...</> : '💾 Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
