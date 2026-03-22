"use client";
import React, { useState, useEffect } from 'react';

function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return <div className={`toast toast-${type}`}>{type === 'success' ? '✅' : '❌'} {message}</div>;
}

export default function Faturas() {
  const [faturas, setFaturas] = useState([]);
  const [usinas, setUsinas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showRateio, setShowRateio] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const TARIFA = 0.85;

  const fetchData = () => {
    Promise.all([
      fetch('/api/faturas').then(r => r.json()).catch(() => []),
      fetch('/api/usinas').then(r => r.json()).catch(() => []),
    ]).then(([f, u]) => {
      setFaturas(Array.isArray(f) ? f : []);
      setUsinas(Array.isArray(u) ? u : []);
      setLoading(false);
    });
  };

  useEffect(() => { fetchData(); }, []);

  const handleRateio = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.target);
    const body = {
      usina_id: fd.get('usina_id'),
      mes_ano: fd.get('mes_ano'),
    };
    try {
      const res = await fetch('/api/rateio', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) {
        setToast({ message: 'Rateio calculado com sucesso!', type: 'success' });
        setShowRateio(false);
        fetchData();
      } else {
        const d = await res.json();
        setToast({ message: d.error || 'Erro ao calcular rateio', type: 'error' });
      }
    } catch { setToast({ message: 'Erro de conexão', type: 'error' }); }
    setSubmitting(false);
  };

  const totalConsumo = faturas.reduce((acc, f) => acc + Number(f.consumo_kwh || 0), 0);
  const totalCompensado = faturas.reduce((acc, f) => acc + Number(f.creditos_compensados_kwh || 0), 0);
  const economia = totalCompensado * TARIFA;

  return (
    <div style={{ flex: 1 }}>
      {toast && <div className="toast-container"><Toast {...toast} onClose={() => setToast(null)} /></div>}

      <header className="page-header">
        <div>
          <h1 className="page-title">Faturas</h1>
          <p className="page-subtitle">Acompanhe as faturas, compensação e economia gerada.</p>
        </div>
        <button onClick={() => setShowRateio(true)} className="btn btn-primary">
          📄 Calcular Rateio
        </button>
      </header>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "1.5rem" }}>
        <div className="glass-card kpi-card">
          <span className="kpi-label">Total de Faturas</span>
          <div className="kpi-value">{faturas.length}</div>
        </div>
        <div className="glass-card kpi-card">
          <span className="kpi-label">Consumo Total</span>
          <div className="kpi-value">{totalConsumo.toLocaleString('pt-BR')} kWh</div>
        </div>
        <div className="glass-card kpi-card">
          <span className="kpi-label">Compensado</span>
          <div className="kpi-value" style={{ color: "var(--primary)" }}>{totalCompensado.toLocaleString('pt-BR')} kWh</div>
        </div>
        <div className="glass-card kpi-card">
          <span className="kpi-label">Economia (Est.)</span>
          <div className="kpi-value" style={{ color: "var(--primary)" }}>
            {economia.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass" style={{ padding: "1.5rem" }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>Listagem de Faturas</h3>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[1,2,3].map(i => <div key={i} className="skeleton skeleton-row" />)}
          </div>
        ) : faturas.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📄</div>
            <div className="empty-state-text">Nenhuma fatura encontrada</div>
            <div className="empty-state-hint">Calcule o rateio de uma usina para gerar faturas automaticamente.</div>
          </div>
        ) : (
          <>
            <div className="table-header" style={{ gridTemplateColumns: "1fr 1fr 0.8fr 0.8fr 0.8fr 0.8fr" }}>
              <span>Unidade</span><span>Mês Ref.</span><span>Consumo</span><span>Compensado</span><span>Saldo</span><span>Valor (Est.)</span>
            </div>
            {faturas.map((f) => {
              const valorBruto = (Number(f.consumo_kwh || 0) * TARIFA);
              const valorLiquido = ((Number(f.consumo_kwh || 0) - Number(f.creditos_compensados_kwh || 0)) * TARIFA);
              return (
                <div key={f.id} className="table-row" style={{ gridTemplateColumns: "1fr 1fr 0.8fr 0.8fr 0.8fr 0.8fr" }}>
                  <span style={{ fontWeight: 500 }}>{f.unidades_consumidoras?.codigo_uc || '—'}</span>
                  <span>{f.mes_ano ? new Date(f.mes_ano).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }) : '—'}</span>
                  <span style={{ fontWeight: 600 }}>{f.consumo_kwh} kWh</span>
                  <span style={{ color: "var(--primary)", fontWeight: 600 }}>{f.creditos_compensados_kwh} kWh</span>
                  <span>{f.saldo_acumulado_kwh || 0} kWh</span>
                  <div>
                    <div style={{ fontWeight: 600 }}>{valorLiquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                    {Number(f.creditos_compensados_kwh || 0) > 0 && (
                      <div style={{ fontSize: "0.7rem", color: "var(--primary)", textDecoration: "line-through", opacity: 0.7 }}>
                        {valorBruto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Modal Rateio */}
      {showRateio && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowRateio(false)}>
          <div className="modal-content">
            <div className="modal-title">
              <span>📄 Calcular Rateio</span>
              <button className="modal-close" onClick={() => setShowRateio(false)}>✕</button>
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
              O rateio distribui os créditos de geração entre as UCs da usina com base nas alocações configuradas.
            </p>
            <form onSubmit={handleRateio} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label className="form-label">Usina</label>
                <select name="usina_id" required className="form-select">
                  <option value="">Selecione a usina...</option>
                  {usinas.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Mês de Referência</label>
                <input name="mes_ano" type="month" required className="form-input" />
              </div>
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" }}>
                <button type="button" onClick={() => setShowRateio(false)} className="btn btn-outline">Cancelar</button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? <><span className="spinner" /> Calculando...</> : '📊 Calcular'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
