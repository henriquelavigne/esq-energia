import Link from "next/link";
import Image from "next/image";

export default function Dashboard() {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-darker)" }}>
      {/* Sidebar */}
      <aside className="glass" style={{
        width: "250px", padding: "2rem 1.5rem", borderRight: "1px solid var(--glass-border)",
        display: "flex", flexDirection: "column", gap: "2rem",
        background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(20px)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Image src="/logo.jpeg" alt="Logo" width={32} height={32} style={{ borderRadius: "6px" }} />
          <span style={{ fontWeight: 800, fontSize: "1rem" }}>ESQ ENERGIA</span>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
          <div style={{ background: "rgba(16, 185, 129, 0.1)", color: "var(--primary)", padding: "10px", borderRadius: "8px", fontWeight: 600, display: "flex", alignItems: "center", gap: "10px" }}>
             📊 Dashboard
          </div>
          <div style={{ color: "var(--text-secondary)", padding: "10px", cursor: "pointer" }}>🏭 Usinas</div>
          <div style={{ color: "var(--text-secondary)", padding: "10px", cursor: "pointer" }}>💡 Consumidores</div>
          <div style={{ color: "var(--text-secondary)", padding: "10px", cursor: "pointer" }}>📄 Faturas</div>
          <div style={{ color: "var(--text-secondary)", padding: "10px", cursor: "pointer" }}>⚙️ Configurações</div>
        </nav>

        <Link href="/" style={{ color: "#EF4444", fontSize: "0.9rem", padding: "10px", display: "inline-block" }}>
          🚪 Sair
        </Link>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: "2rem", overflowY: "auto" }}>
        {/* Header */}
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <div>
            <h1 style={{ fontSize: "1.8rem", fontWeight: 700 }}>Painel do Gerador</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Olá, Henrique. Veja o status das suas usinas hoje.</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div className="glass" style={{ padding: "8px 12px", fontSize: "0.85rem", color: "var(--text-primary)" }}>Mês: Março/2026</div>
            <div style={{ width: "36px", height: "36px", background: "var(--primary)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600 }}>H</div>
          </div>
        </header>

        {/* KPI Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "2.5rem" }}>
          <div className="glass" style={{ padding: "1.5rem" }}>
            <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Geração Acumulada</span>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "5px 0" }}>145.2 kWh</h2>
            <span style={{ color: "var(--primary)", fontSize: "0.75rem" }}>↑ 12% vs mês anterior</span>
          </div>
          <div className="glass" style={{ padding: "1.5rem" }}>
            <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Consumo das UCs</span>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "5px 0" }}>112.5 kWh</h2>
            <span style={{ color: "#EF4444", fontSize: "0.75rem" }}>↑ 4% vs meta</span>
          </div>
          <div className="glass" style={{ padding: "1.5rem" }}>
            <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Saldo de Créditos</span>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "5px 0", color: "var(--primary)" }}>+32.7 kWh</h2>
            <span style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>Pronto para rateio</span>
          </div>
          <div className="glass" style={{ padding: "1.5rem" }}>
            <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Faturamento Estimado</span>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "5px 0" }}>R$ 14.280,00</h2>
            <span style={{ color: "var(--primary)", fontSize: "0.75rem" }}>Geração de receita</span>
          </div>
        </div>

        {/* Main Grid: Charts & Tables */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" }}>
          {/* Chart placeholder box */}
          <div className="glass" style={{ padding: "1.5rem", minHeight: "300px", position: "relative" }}>
            <h3 style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>Acompanhamento de Geração</h3>
            <div style={{ display: "flex", height: "200px", alignItems: "flex-end", gap: "15px", padding: "10px" }}>
              {[60, 80, 45, 90, 100, 70, 85].map((h, i) => (
                <div key={i} style={{ flex: 1, height: `${h}%`, background: "linear-gradient(to top, var(--primary), transparent)", borderRadius: "4px", position: "relative" }}>
                  <div style={{ position: "absolute", bottom: "-25px", left: "50%", transform: "translateX(-50%)", fontSize: "0.7rem", color: "var(--text-secondary)" }}>U{i+1}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Unidades Consumidoras mini-table */}
          <div className="glass" style={{ padding: "1.5rem" }}>
            <h3 style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>Taxas de Rateio (UCs)</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[
                { name: "Residencial XPTO", percent: "35%", status: "Ativo" },
                { name: "Comercial Silva", percent: "25%", status: "Ativo" },
                { name: "Indústria Delta", percent: "40%", status: "Pendente" }
              ].map((uc, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px", borderBottom: "1px solid var(--glass-border)", fontSize: "0.9rem" }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>{uc.name}</span>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Rateio: {uc.percent}</div>
                  </div>
                  <span style={{ fontSize: "0.75rem", color: uc.status === 'Ativo' ? 'var(--primary)' : '#F59E0B' }}>{uc.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
