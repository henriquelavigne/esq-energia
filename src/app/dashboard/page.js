"use client";
import React, { useState, useEffect } from 'react';

export default function Dashboard() {
  const [usinas, setUsinas] = useState([]);
  const [medicoes, setMedicoes] = useState([]);
  const [faturas, setFaturas] = useState([]);
  const [ucs, setUcs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUC, setSelectedUC] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/usinas').then(r => r.json()).catch(() => []),
      fetch('/api/medicoes').then(r => r.json()).catch(() => []),
      fetch('/api/faturas').then(r => r.json()).catch(() => []),
      fetch('/api/ucs').then(r => r.json()).catch(() => []),
    ]).then(([u, m, f, c]) => {
      setUsinas(Array.isArray(u) ? u : []);
      setMedicoes(Array.isArray(m) ? m : []);
      setFaturas(Array.isArray(f) ? f : []);
      setUcs(Array.isArray(c) ? c : []);
      setLoading(false);
    });
  }, []);

  const totalGeracao = medicoes.reduce((acc, m) => acc + Number(m.geracao_kwh || 0), 0);
  const totalConsumo = faturas.reduce((acc, f) => acc + Number(f.consumo_kwh || 0), 0);
  const totalCompensado = faturas.reduce((acc, f) => acc + Number(f.creditos_compensados_kwh || 0), 0);
  const saldoCreditos = totalGeracao - totalConsumo;
  const TARIFA = 0.85;
  const faturamentoEstimado = totalCompensado * TARIFA;

  const now = new Date();
  const mesAtual = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  // Dados para gráfico de barras por usina
  const geracaoPorUsina = usinas.map(u => {
    const total = medicoes
      .filter(m => m.usina_id === u.id)
      .reduce((acc, m) => acc + Number(m.geracao_kwh || 0), 0);
    return { nome: u.nome, total };
  });
  const maxGeracao = Math.max(...geracaoPorUsina.map(g => g.total), 1);

  const SkeletonBlock = ({ w, h }) => (
    <div className="skeleton" style={{ width: w || '100%', height: h || 14 }} />
  );

  if (loading) {
    return (
      <div style={{ flex: 1 }}>
        <div style={{ marginBottom: "2rem" }}>
          <SkeletonBlock w="300px" h="28px" />
          <div style={{ height: 8 }} />
          <SkeletonBlock w="220px" h="14px" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "2.5rem" }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton skeleton-kpi" />)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" }}>
          <div className="skeleton" style={{ height: 320 }} />
          <div className="skeleton" style={{ height: 320 }} />
        </div>
      </div>
    );
  }

  const hasData = usinas.length > 0 || medicoes.length > 0 || faturas.length > 0;

  return (
    <div style={{ flex: 1 }}>
      {/* Header */}
      <header className="page-header">
        <div>
          <h1 className="page-title">
            Painel do Gerador
          </h1>
          <p className="page-subtitle">
            Visão geral das suas usinas e créditos — <span style={{ color: "var(--primary)", fontWeight: 600 }}>{mesAtual}</span>
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div className="glass" style={{ padding: "8px 16px", fontSize: "0.82rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "6px" }}>
            <span className="status-dot active" />
            {usinas.length} usina{usinas.length !== 1 ? 's' : ''} ativa{usinas.length !== 1 ? 's' : ''}
          </div>
        </div>
      </header>

      {/* KPI Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "2rem" }}>
        <div className="glass-card kpi-card">
          <span className="kpi-label">⚡ Geração Acumulada</span>
          <div className="kpi-value" style={{ color: "var(--primary)" }}>
            {hasData ? `${totalGeracao.toLocaleString('pt-BR')} kWh` : '—'}
          </div>
          <span className="kpi-change positive">
            Todas as usinas
          </span>
        </div>
        <div className="glass-card kpi-card">
          <span className="kpi-label">🏠 Consumo das UCs</span>
          <div className="kpi-value">
            {hasData ? `${totalConsumo.toLocaleString('pt-BR')} kWh` : '—'}
          </div>
          <span className="kpi-change" style={{ color: "var(--text-muted)" }}>
            {ucs.length} unidade{ucs.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="glass-card kpi-card">
          <span className="kpi-label">💎 Saldo de Créditos</span>
          <div className="kpi-value" style={{ color: saldoCreditos >= 0 ? "var(--primary)" : "var(--danger)" }}>
            {hasData ? `${saldoCreditos >= 0 ? '+' : ''}${saldoCreditos.toLocaleString('pt-BR')} kWh` : '—'}
          </div>
          <span className="kpi-change" style={{ color: saldoCreditos >= 0 ? "var(--primary)" : "var(--danger)" }}>
            {saldoCreditos >= 0 ? 'Superávit' : 'Déficit'}
          </span>
        </div>
        <div className="glass-card kpi-card">
          <span className="kpi-label">💰 Faturamento Estimado</span>
          <div className="kpi-value">
            {hasData ? faturamentoEstimado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—'}
          </div>
          <span className="kpi-change" style={{ color: "var(--text-muted)" }}>
            Tarifa R$ {TARIFA.toFixed(2)}/kWh
          </span>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" }}>
        {/* Chart */}
        <div className="glass" style={{ padding: "1.5rem", minHeight: "320px" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "8px" }}>
            📈 Geração por Usina
          </h3>
          {geracaoPorUsina.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📊</div>
              <div className="empty-state-text">Nenhuma usina cadastrada</div>
              <div className="empty-state-hint">Cadastre usinas para ver dados aqui.</div>
            </div>
          ) : (
            <div style={{ display: "flex", height: "220px", alignItems: "flex-end", gap: "12px", padding: "10px 0" }}>
              {geracaoPorUsina.map((g, i) => {
                const pct = maxGeracao > 0 ? (g.total / maxGeracao) * 100 : 0;
                return (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--primary)" }}>
                      {g.total > 0 ? `${g.total.toLocaleString('pt-BR')}` : '0'}
                    </span>
                    <div style={{
                      width: "100%", maxWidth: "60px", height: `${Math.max(pct, 4)}%`,
                      background: `linear-gradient(to top, var(--primary), rgba(16, 185, 129, 0.2))`,
                      borderRadius: "6px 6px 2px 2px",
                      transition: "height 0.8s ease-out",
                      boxShadow: pct > 0 ? "0 0 12px rgba(16, 185, 129, 0.2)" : "none"
                    }} />
                    <span style={{
                      fontSize: "0.68rem", color: "var(--text-secondary)",
                      textAlign: "center", lineHeight: 1.2, maxWidth: "80px",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                    }}>
                      {g.nome || `Usina ${i + 1}`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* UCs mini-table */}
        <div className="glass" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1.2rem", display: "flex", alignItems: "center", gap: "8px" }}>
            🏠 Unidades Consumidoras
          </h3>
          {ucs.length === 0 ? (
            <div className="empty-state" style={{ padding: "2rem 1rem" }}>
              <div className="empty-state-icon">🏠</div>
              <div className="empty-state-text">Nenhuma UC</div>
              <div className="empty-state-hint">Cadastre UCs pelo menu lateral.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {ucs.slice(0, 6).map((uc) => (
                <div
                  key={uc.id}
                  onClick={() => setSelectedUC(selectedUC === uc.id ? null : uc.id)}
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "10px 12px",
                    border: selectedUC === uc.id ? "1px solid var(--primary)" : "1px solid var(--glass-border)",
                    borderRadius: "10px", fontSize: "0.88rem", cursor: "pointer",
                    background: selectedUC === uc.id ? "var(--primary-subtle)" : "transparent",
                    transition: "all var(--transition-fast)"
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>{uc.codigo_uc}</span>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 2 }}>
                      {uc.endereco ? uc.endereco.substring(0, 30) : 'Sem endereço'}
                    </div>
                  </div>
                  <span className={`badge badge-success`}>Ativa</span>
                </div>
              ))}
              {ucs.length > 6 && (
                <div style={{ textAlign: "center", fontSize: "0.78rem", color: "var(--text-muted)", padding: "8px" }}>
                  + {ucs.length - 6} mais
                </div>
              )}
            </div>
          )}

          {selectedUC && ucs.find(u => u.id === selectedUC) && (
            <div style={{
              marginTop: "1rem", padding: "1rem", background: "rgba(0,0,0,0.2)",
              borderRadius: "10px", border: "1px solid var(--glass-border)",
              animation: "slideUp 0.2s ease-out"
            }}>
              <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--primary)" }}>Detalhes</span>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", fontSize: "0.82rem" }}>
                <span style={{ color: "var(--text-secondary)" }}>Endereço:</span>
                <span>{ucs.find(u => u.id === selectedUC)?.endereco || '—'}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px", fontSize: "0.82rem" }}>
                <span style={{ color: "var(--text-secondary)" }}>Consumo médio:</span>
                <span>{ucs.find(u => u.id === selectedUC)?.consumo_medio_kwh || '—'} kWh</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
