import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header className="glass" style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "1rem 2rem", background: "rgba(15, 23, 42, 0.8)",
        backdropFilter: "blur(12px)", borderBottom: "1px solid var(--glass-border)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Image src="/logo.jpeg" alt="ESQ Energia" width={40} height={40} style={{ borderRadius: "8px" }} />
          <span style={{ fontWeight: 800, fontSize: "1.2rem", letterSpacing: "1px" }}>ESQ ENERGIA</span>
        </div>
        <nav style={{ display: "flex", gap: "20px", alignItems: "center" }}>
          <Link href="#sobre" style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Sobre Nós</Link>
          <Link href="#funcionalidades" style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Funcionalidades</Link>
          <Link href="/dashboard" className="btn btn-primary" style={{ padding: "8px 16px", fontSize: "0.9rem" }}>
            Acessar Plataforma
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", paddingTop: "80px", position: "relative" }}>
        {/* Background Glow */}
        <div style={{
          position: "absolute", top: "20%", left: "50%", transform: "translate(-50%, -50%)",
          width: "400px", height: "400px", background: "var(--primary)",
          filter: "blur(150px)", opacity: 0.15, zIndex: -1
        }} />

        <div style={{ textAlign: "center", maxWidth: "800px", padding: "2rem" }}>
          <h1 style={{ fontSize: "3.5rem", fontWeight: 800, lineHeight: 1.2, marginBottom: "1.5rem" }}>
            Gestão <span className="gradient-text">Inteligente</span> de Créditos de Energia Solar
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem", marginBottom: "2rem", lineHeight: 1.6 }}>
            Monitore suas usinas, automatize o rateio de créditos e digitalize faturas em um único lugar. Praticidade e rentabilidade para o seu investimento em Geração Distribuída.
          </p>
          <div style={{ display: "flex", gap: "15px", justifyContent: "center" }}>
            <Link href="/dashboard" className="btn btn-primary">Começar Agora</Link>
            <Link href="#sobre" className="btn btn-outline">Saiba Mais</Link>
          </div>

          {/* Cards Preview (Glassmorphism) */}
          <div style={{ marginTop: "4rem", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
            <div className="glass" style={{ padding: "2rem", textAlign: "left" }}>
              <div style={{ fontSize: "1.5rem", color: "var(--primary)", marginBottom: "10px" }}>📊</div>
              <h3 style={{ marginBottom: "10px", fontSize: "1.1rem" }}>Dashboards</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: 1.5 }}>
                Visão gerencial de dados de geração, consumo e saldo de créditos.
              </p>
            </div>
            <div className="glass" style={{ padding: "2rem", textAlign: "left" }}>
              <div style={{ fontSize: "1.5rem", color: "var(--primary)", marginBottom: "10px" }}>⚡</div>
              <h3 style={{ marginBottom: "10px", fontSize: "1.1rem" }}>Gestão de Créditos</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: 1.5 }}>
                Agilidade no rateio para cumprir obrigações e maximizar receitas.
              </p>
            </div>
            <div className="glass" style={{ padding: "2rem", textAlign: "left" }}>
              <div style={{ fontSize: "1.5rem", color: "var(--primary)", marginBottom: "10px" }}>📄</div>
              <h3 style={{ marginBottom: "10px", fontSize: "1.1rem" }}>Download de Faturas</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: 1.5 }}>
                Processamento automático das faturas diretamente das concessionárias.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
