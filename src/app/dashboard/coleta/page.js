"use client";
import React, { useEffect, useState, useCallback } from 'react';

const API    = process.env.NEXT_PUBLIC_COLLECTOR_URL || 'http://localhost:3001';
const SECRET = process.env.NEXT_PUBLIC_COLLECTOR_KEY || 'esq2026';
const USINA  = process.env.NEXT_PUBLIC_USINA_ID      || '';

const headers = { 'x-api-key': SECRET };

const STATUS_COR = {
  OK:                         'var(--success)',
  LOGIN:                      'var(--info)',
  DOWNLOAD:                   'var(--warning)',
  OCR:                        'var(--primary)',
  ERRO_CREDENCIAIS_INVALIDAS: 'var(--danger)',
  ALERTA_LAYOUT_ALTERADO:     '#f97316',
  ERRO:                       'var(--danger-bg)',
};

export default function ColetaPage() {
  const [resumo,    setResumo]    = useState(null);
  const [faturas,   setFaturas]   = useState([]);
  const [logs,      setLogs]      = useState([]);
  const [eventos,   setEventos]   = useState([]);
  const [coletando, setColetando] = useState(false);
  const [wsOk,      setWsOk]      = useState(false);

  const carregarDados = useCallback(async () => {
    if (!USINA) return;
    try {
      const [r1, r2, r3] = await Promise.all([
        fetch(`${API}/api/dashboard/resumo?usina_id=${USINA}`, { headers }),
        fetch(`${API}/api/faturas?usina_id=${USINA}`,           { headers }),
        fetch(`${API}/api/logs?usina_id=${USINA}&limite=30`,     { headers }),
      ]);
      if (r1.ok) setResumo(await r1.json());
      if (r2.ok) setFaturas(await r2.json());
      if (r3.ok) setLogs(await r3.json());
    } catch {
      // microserviço pode não estar rodando ainda
    }
  }, []);

  // WebSocket — eventos em tempo real
  useEffect(() => {
    if (!USINA) return;
    let socket;
    import('socket.io-client').then(({ io }) => {
      socket = io(API, { transports: ['websocket'] });
      socket.on('connect',    () => setWsOk(true));
      socket.on('disconnect', () => setWsOk(false));
      socket.emit('join_usina', USINA);

      const EVENTOS = ['LOGIN','DOWNLOAD','OCR','OK',
        'ERRO_CREDENCIAIS_INVALIDAS','ALERTA_LAYOUT_ALTERADO','ERRO'];

      EVENTOS.forEach(ev => {
        socket.on(ev, payload => {
          const linha = {
            ev,
            msg: payload.nome || payload.status || payload.mensagem || ev,
            ts:  new Date().toLocaleTimeString('pt-BR'),
          };
          setEventos(prev => [linha, ...prev].slice(0, 50));

          // Recarrega dados após coleta bem-sucedida
          if (ev === 'OK') carregarDados();
        });
      });
    });
    return () => socket?.disconnect();
  }, [carregarDados]);

  useEffect(() => { carregarDados(); }, [carregarDados]);

  async function iniciarColeta() {
    setColetando(true);
    setEventos([]);
    try {
      await fetch(`${API}/api/coleta/iniciar`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ usina_id: USINA }),
      });
    } catch (e) {
      setEventos([{ ev: 'ERRO', msg: 'Microserviço offline', ts: new Date().toLocaleTimeString('pt-BR') }]);
    } finally {
      setTimeout(() => setColetando(false), 3000);
    }
  }

  if (!USINA) {
    return (
      <div className="empty-state glass">
        <div className="empty-state-icon">⚠️</div>
        <div className="empty-state-text">Usina não configurada</div>
        <div className="empty-state-hint">Configure <code>NEXT_PUBLIC_USINA_ID</code> no <code>.env.local</code> para habilitar o robô de coleta.</div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <header className="page-header">
        <div>
          <h1 className="page-title">Coleta de Faturas</h1>
          <p className="page-subtitle" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span className={`status-dot ${wsOk ? 'active' : ''}`} style={{ background: wsOk ? 'var(--success)' : 'var(--danger-bg)' }} />
            {wsOk ? 'WebSocket Conectado — Monitoramento ao vivo' : 'WebSocket Desconectado'}
          </p>
        </div>
        <button
          onClick={iniciarColeta}
          disabled={coletando}
          className="btn btn-primary"
          style={{ gap: "8px" }}
        >
          {coletando ? (
            <><span className="spinner" /> Processando...</>
          ) : (
            '⚡ Iniciar Coleta Manual'
          )}
        </button>
      </header>

      {/* Resumo */}
      {resumo && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
          <div className="glass-card kpi-card">
            <span className="kpi-label">👥 Clientes</span>
            <div className="kpi-value">{resumo.total_clientes}</div>
          </div>
          <div className="glass-card kpi-card">
            <span className="kpi-label">📄 Faturas este mês</span>
            <div className="kpi-value">{resumo.faturas_mes_atual}</div>
          </div>
          <div className="glass-card kpi-card">
            <span className="kpi-label">💰 Valor Total</span>
            <div className="kpi-value" style={{ color: "var(--primary)" }}>
              {Number(resumo.valor_total_mes || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
          </div>
          <div className="glass-card kpi-card">
            <span className="kpi-label">⚡ Energia Compensada</span>
            <div className="kpi-value">{Number(resumo.energia_compensada_total || 0).toFixed(0)} kWh</div>
          </div>
        </div>
      )}

      {/* Logs e Histórico (Grid 50/50) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", alignItems: "start" }}>
        
        {/* Log ao vivo (WebSocket) */}
        <div className="glass" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", minHeight: "350px", maxHeight: "350px" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>Log de Coleta ao Vivo</h3>
          <div style={{ 
            flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px",
            fontFamily: "monospace", fontSize: "0.85rem", background: "rgba(0,0,0,0.2)",
            padding: "16px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)"
          }}>
            {eventos.length === 0 ? (
              <div style={{ color: "var(--text-muted)", margin: "auto" }}>Aguardando inicialização da coleta...</div>
            ) : (
              eventos.map((e, i) => (
                <div key={i} style={{ display: "flex", gap: "12px", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "6px" }}>
                  <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>{e.ts}</span>
                  <span style={{ fontWeight: 600, color: STATUS_COR[e.ev] || 'var(--text-primary)', flexShrink: 0, minWidth: "120px" }}>
                    [{e.ev}]
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.85)", wordBreak: "break-all" }}>{e.msg}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Histórico de Coletas do Banco */}
        <div className="glass" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", minHeight: "350px", maxHeight: "350px" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>Histórico do Robô</h3>
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", paddingRight: "8px" }}>
            {logs.length === 0 ? (
              <div className="empty-state" style={{ padding: "20px" }}>
                <div className="empty-state-text" style={{ fontSize: "0.9rem" }}>Sem histórico de runs</div>
              </div>
            ) : (
              logs.map(l => (
                <div key={l.id} style={{ display: "flex", alignItems: "center", gap: "12px", background: "rgba(255,255,255,0.02)", padding: "10px 14px", borderRadius: "8px" }}>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.8rem", width: "90px" }}>
                    {new Date(l.criado_em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className={`badge ${l.status === 'concluido' ? 'badge-success' : l.status.includes('erro') ? 'badge-warning' : 'badge-info'}`}>
                    {l.status}
                  </span>
                  <span style={{ fontSize: "0.85rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {l.cliente_nome || 'Lote/Desconhecido'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Tabela de Faturas */}
      <div className="glass" style={{ padding: "1.5rem" }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>Faturas Processadas (OCR)</h3>
        {faturas.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📄</div>
            <div className="empty-state-text">Nenhuma fatura coletada e validada</div>
            <div className="empty-state-hint">Conecte o microserviço e clique em "Iniciar Coleta" para varrer o portal COELBA.</div>
          </div>
        ) : (
          <>
            <div className="table-header" style={{ gridTemplateColumns: "1.5fr 1fr 0.8fr 1fr 1fr 1fr 0.5fr" }}>
              <span>Cliente</span><span>UC</span><span>Mês Ref</span><span>Valor</span><span>Compensado</span><span>Canal/Origem</span><span>Anexo</span>
            </div>
            {faturas.map(f => (
              <div key={f.id} className="table-row" style={{ gridTemplateColumns: "1.5fr 1fr 0.8fr 1fr 1fr 1fr 0.5fr" }}>
                <span style={{ fontWeight: 500 }}>{f.cliente_nome}</span>
                <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem", fontFamily: "monospace" }}>{f.codigo_uc}</span>
                <span>{f.mes_referencia ? `${f.mes_referencia.slice(5,7)}/${f.mes_referencia.slice(0,4)}` : '—'}</span>
                <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                  {Number(f.valor_total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
                <span style={{ color: "var(--primary)" }}>{Number(f.energia_compensada_kwh || 0).toFixed(0)} kWh</span>
                <span className="badge badge-info" style={{ width: "fit-content" }}>{f.canal_origem || '—'}</span>
                <span style={{ display: "flex", justifyContent: "center" }}>
                  {f.pdf_path ? (
                    <a
                      href={`${API}/api/faturas/${f.id}/download?api_key=${SECRET}`}
                      target="_blank" rel="noreferrer"
                      style={{
                        padding: "4px 8px", background: "rgba(59, 130, 246, 0.15)", color: "var(--info)",
                        borderRadius: "6px", fontSize: "0.75rem", fontWeight: 600, transition: "all 0.2s"
                      }}
                      onMouseEnter={(e) => e.target.style.background = "rgba(59, 130, 246, 0.3)"}
                      onMouseLeave={(e) => e.target.style.background = "rgba(59, 130, 246, 0.15)"}
                    >
                      PDF
                    </a>
                  ) : <span style={{ opacity: 0.3 }}>—</span>}
                </span>
              </div>
            ))}
          </>
        )}
      </div>

    </div>
  );
}
