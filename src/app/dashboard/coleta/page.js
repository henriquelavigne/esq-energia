'use client';
import { useEffect, useState, useCallback } from 'react';

const API    = process.env.NEXT_PUBLIC_COLLECTOR_URL || 'http://localhost:3001';
const SECRET = process.env.NEXT_PUBLIC_COLLECTOR_KEY || 'esq2026';
const USINA  = process.env.NEXT_PUBLIC_USINA_ID      || '';

const headers = { 'x-api-key': SECRET };

const STATUS_COR = {
  OK:                         'text-green-400',
  LOGIN:                      'text-blue-400',
  DOWNLOAD:                   'text-yellow-400',
  OCR:                        'text-purple-400',
  ERRO_CREDENCIAIS_INVALIDAS: 'text-red-500',
  ALERTA_LAYOUT_ALTERADO:     'text-orange-500',
  ERRO:                       'text-red-400',
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
      <div className="p-8 text-yellow-400">
        ⚠️ Configure <code>NEXT_PUBLIC_USINA_ID</code> no <code>.env.local</code>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Coleta de Faturas</h1>
          <span className={`text-sm ${wsOk ? 'text-green-400' : 'text-gray-500'}`}>
            {wsOk ? '● WebSocket conectado' : '○ WebSocket desconectado'}
          </span>
        </div>
        <button
          onClick={iniciarColeta}
          disabled={coletando}
          className="px-6 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 rounded-lg font-semibold transition"
        >
          {coletando ? 'Coletando...' : '⚡ Iniciar Coleta'}
        </button>
      </div>

      {/* Resumo */}
      {resumo && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Clientes',          valor: resumo.total_clientes },
            { label: 'Faturas este mês',  valor: resumo.faturas_mes_atual },
            { label: 'Valor total',        valor: `R$ ${Number(resumo.valor_total_mes||0).toFixed(2)}` },
            { label: 'Energia compensada', valor: `${Number(resumo.energia_compensada_total||0).toFixed(0)} kWh` },
          ].map(c => (
            <div key={c.label} className="bg-gray-800 rounded-xl p-4">
              <p className="text-gray-400 text-sm">{c.label}</p>
              <p className="text-2xl font-bold mt-1">{c.valor ?? '—'}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Log ao vivo */}
        <div className="bg-gray-900 rounded-xl p-4">
          <h2 className="font-semibold mb-3">Log ao vivo</h2>
          <div className="space-y-1 max-h-64 overflow-y-auto font-mono text-sm">
            {eventos.length === 0 && (
              <p className="text-gray-500">Aguardando coleta...</p>
            )}
            {eventos.map((e, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-gray-500 shrink-0">{e.ts}</span>
                <span className={`font-bold shrink-0 ${STATUS_COR[e.ev] || 'text-gray-300'}`}>
                  [{e.ev}]
                </span>
                <span className="text-gray-300 truncate">{e.msg}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Logs do banco */}
        <div className="bg-gray-900 rounded-xl p-4">
          <h2 className="font-semibold mb-3">Histórico de coletas</h2>
          <div className="space-y-1 max-h-64 overflow-y-auto text-sm">
            {logs.map(l => (
              <div key={l.id} className="flex gap-2 items-start">
                <span className="text-gray-500 shrink-0 text-xs pt-0.5">
                  {new Date(l.criado_em).toLocaleDateString('pt-BR')}
                </span>
                <span className={`shrink-0 ${l.status === 'concluido' ? 'text-green-400' : l.status.includes('erro') ? 'text-red-400' : 'text-yellow-400'}`}>
                  {l.status}
                </span>
                <span className="text-gray-400 truncate">{l.cliente_nome || '—'}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Tabela de faturas */}
      <div className="bg-gray-900 rounded-xl p-4">
        <h2 className="font-semibold mb-3">Faturas coletadas</h2>
        {faturas.length === 0 ? (
          <p className="text-gray-500 text-sm">Nenhuma fatura coletada ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 text-left border-b border-gray-700">
                  <th className="pb-2 pr-4">Cliente</th>
                  <th className="pb-2 pr-4">UC</th>
                  <th className="pb-2 pr-4">Mês</th>
                  <th className="pb-2 pr-4">Valor</th>
                  <th className="pb-2 pr-4">Compensado</th>
                  <th className="pb-2 pr-4">Canal</th>
                  <th className="pb-2">PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {faturas.map(f => (
                  <tr key={f.id} className="hover:bg-gray-800 transition">
                    <td className="py-2 pr-4">{f.cliente_nome}</td>
                    <td className="py-2 pr-4 font-mono text-xs">{f.codigo_uc}</td>
                    <td className="py-2 pr-4">{f.mes_referencia?.slice(0, 7)}</td>
                    <td className="py-2 pr-4">R$ {Number(f.valor_total||0).toFixed(2)}</td>
                    <td className="py-2 pr-4">{Number(f.energia_compensada_kwh||0).toFixed(0)} kWh</td>
                    <td className="py-2 pr-4">
                      <span className="px-2 py-0.5 rounded text-xs bg-gray-700">
                        {f.canal_origem}
                      </span>
                    </td>
                    <td className="py-2">
                      {f.pdf_path ? (
                        <a
                          href={`${API}/api/faturas/${f.id}/download?api_key=${SECRET}`}
                          className="text-blue-400 hover:underline text-xs"
                          target="_blank"
                          rel="noreferrer"
                        >
                          ↓ PDF
                        </a>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
