"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { name: "Dashboard", icon: "📊", path: "/dashboard" },
    { name: "Usinas", icon: "⚡", path: "/dashboard/usinas" },
    { name: "Consumidores", icon: "🏠", path: "/dashboard/consumidores" },
    { name: "Créditos", icon: "💎", path: "/dashboard/creditos" },
    { name: "Medições", icon: "📏", path: "/dashboard/medicoes" },
    { name: "Balanço", icon: "📊", path: "/dashboard/balanco" },
    { name: "Faturas", icon: "📄", path: "/dashboard/faturas" },
    { name: "Configurações", icon: "⚙️", path: "/dashboard/configuracoes" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-darker)" }}>
      {/* Mobile toggle */}
      <button
        className="sidebar-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Menu"
      >
        {sidebarOpen ? "✕" : "☰"}
      </button>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
            zIndex: 999, display: "block"
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside style={{
        width: "var(--sidebar-width)", padding: "1.5rem 1rem",
        borderRight: "1px solid var(--glass-border)",
        display: "flex", flexDirection: "column", gap: "1.5rem",
        background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(20px)",
        position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 1000,
        transform: typeof window !== 'undefined' && window.innerWidth <= 768 && !sidebarOpen ? "translateX(-100%)" : "translateX(0)",
        transition: "transform var(--transition-base)",
        overflowY: "auto"
      }}>
        {/* Logo */}
        <div style={{
          display: "flex", alignItems: "center", gap: "12px",
          padding: "0.5rem 0.5rem 0"
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: "10px",
            background: "linear-gradient(135deg, var(--primary), #059669)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 800, fontSize: "0.9rem", color: "#fff",
            boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)"
          }}>⚡</div>
          <div>
            <span style={{ fontWeight: 800, fontSize: "1rem", letterSpacing: "-0.02em" }}>ESQ ENERGIA</span>
            <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 500 }}>Gestão Solar</div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "var(--glass-border)", margin: "0 0.5rem" }} />

        {/* Nav */}
        <nav style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1, padding: "0 0.25rem" }}>
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link key={item.path} href={item.path} style={{ textDecoration: "none" }} onClick={() => setSidebarOpen(false)}>
                <div style={{
                  padding: "10px 14px", borderRadius: "10px", fontSize: "0.88rem",
                  display: "flex", alignItems: "center", gap: "12px",
                  cursor: "pointer", transition: "all var(--transition-fast)",
                  fontWeight: isActive ? 600 : 400,
                  background: isActive ? "var(--primary-subtle)" : "transparent",
                  color: isActive ? "var(--primary)" : "var(--text-secondary)",
                  borderLeft: isActive ? "3px solid var(--primary)" : "3px solid transparent"
                }}>
                  <span style={{ fontSize: "1.1rem" }}>{item.icon}</span>
                  {item.name}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom - Logout */}
        <div style={{ padding: "0 0.25rem" }}>
          <div style={{ height: 1, background: "var(--glass-border)", marginBottom: "0.75rem" }} />
          <a href="/api/auth/logout" style={{
            color: "var(--danger)", fontSize: "0.88rem", padding: "10px 14px",
            display: "flex", alignItems: "center", gap: "12px",
            textDecoration: "none", cursor: "pointer",
            borderRadius: "10px", transition: "all var(--transition-fast)"
          }}>
            <span>🚪</span> Sair
          </a>
        </div>
      </aside>

      {/* Main */}
      <div style={{
        flex: 1, padding: "2rem", overflowY: "auto",
        marginLeft: "var(--sidebar-width)",
        maxWidth: "calc(100vw - var(--sidebar-width))"
      }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }} className="animate-in">
          {children}
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          aside {
            transform: ${sidebarOpen ? 'translateX(0)' : 'translateX(-100%)'} !important;
          }
          div[style*="marginLeft"] {
            margin-left: 0 !important;
            max-width: 100vw !important;
            padding: 1rem !important;
            padding-top: 4rem !important;
          }
        }
      `}</style>
    </div>
  );
}
