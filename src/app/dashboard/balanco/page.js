"use client";
import React, { useState, useEffect } from 'react';

export default function Balanco() {
  const [faturas, setFaturas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/faturas').then(r => r.json()).then(data => {
      setFaturas(Array.isArray(data) ? data : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const totalGerado = faturas.reduce((acc, f) => acc + Number(f.creditos_injetados_kwh || f.creditos_compensados_kwh || 0), 0);
  const totalConsumido = faturas.reduce((acc, f) => acc + Number(f.consumo_kwh || 0), 0);
  const totalCompensado = faturas.reduce((acc, f) => acc + Number(f.creditos_compensados_kwh || 0), 0);
  const TARIFA = 0.80;
  const economia = totalCompensado * TARIFA;

  return (
    <div style={{ flex: 1 }}>
      <header className="page-header">
        <div>
          <h1 className="page-title">Balanço do Rateio</h1>
          <p className="page-subtitle">Resultado do rateio de créditos: geração vs. consumo por UC.</p>
        </div>
        <div className="glass" style={{ padding: "8px 16px", fontSize: "0.82rem", display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="status-dot active" /> Visão Geral
        </div>
      </header>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "1.5rem" }}>
        <div className="glass-card kpi-card">
          <span className="kpi-label">⚡ Créditos Injetados</span>
          <div className="kpi-value" style={{ color: "var(--primary)" }}>{totalGerado.toFixed(1)} kWh</div>
        </div>
        <div className="glass-card kpi-card">
          <span className="kpi-label">🏠 Total Consumido</span>
          <div className="kpi-value">{totalConsumido.toFixed(1)} kWh</div>
        </div>
        <div className="glass-card kpi-card">
          <span className="kpi-label">💎 Compensados</span>
          <div className="kpi-value" style={{ color: "var(--primary)" }}>{totalCompensado.toFixed(1)} kWh</div>
        </div>
        <div className="glass-card kpi-card">
          <span className="kpi-label">💰 Economia (Est.)</span>
          <div className="kpi-value" style={{ color: "var(--primary)" }}>
            {economia.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass" style={{ padding: "1.5rem" }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>Detalhamento por UC</h3>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[1,2,3].map(i => <div key={i} className="skeleton skeleton-row" />)}
          </div>
        ) : faturas.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <div className="empty-state-text">Nenhum rateio calculado</div>
            <div className="empty-state-hint">Vá em Faturas → Calcular Rateio para gerar o balanço.</div>
          </div>
        ) : (
          <>
            <div className="table-header" style={{ gridTemplateColumns: "1.2fr 1fr 0.8fr 0.8fr 0.8fr 0.8fr" }}>
              <span>UC</span><span>Mês Ref</span><span>Consumo</span><span>Injetado</span><span>Compensado</span><span>Saldo</span>
            </div>
            {faturas.map((f) => {
              const saldo = Number(f.saldo_acumulado_kwh || 0);
              return (
                <div key={f.id} className="table-row" style={{ gridTemplateColumns: "1.2fr 1fr 0.8fr 0.8fr 0.8fr 0.8fr" }}>
                  <span style={{ fontWeight: 500 }}>{f.unidades_consumidoras?.codigo_uc || '—'}</span>
                  <span>{f.mes_ano ? new Date(f.mes_ano).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }) : '—'}</span>
                  <span style={{ color: "var(--text-secondary)" }}>{f.consumo_kwh} kWh</span>
                  <span style={{ color: "var(--primary)" }}>{f.creditos_injetados_kwh || f.creditos_compensados_kwh || 0} kWh</span>
                  <span>{f.creditos_compensados_kwh || 0} kWh</span>
                  <span style={{
                    fontWeight: 600,
                    color: saldo > 0 ? "var(--primary)" : saldo < 0 ? "var(--danger)" : "var(--text-primary)"
                  }}>
                    {saldo > 0 ? '+' : ''}{saldo} kWh
                  </span>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
