import { useState } from "react";
import { Heart, PawPrint, Stethoscope, BarChart3, Shield, ArrowRight, CheckCircle } from "lucide-react";

const teal = "hsl(175, 70%, 25%)";
const tealLight = "hsl(175, 70%, 92%)";

const content = {
  en: {
    lang: "EN",
    badge: "Built for Indonesian vet clinics",
    headline: ["The smartest way", "to care for every pet"],
    accent: "every pet",
    sub: "VetCare Pro connects pet owners, vets, and clinic owners — so pets get the care they deserve.",
    cta: "Get started free",
    signIn: "Sign in",
    impact: "5% of our revenue goes to street animal rescue",
    impactSub: "Every clinic using VetCare Pro helps fund stray animal care across Indonesia.",
    impactDetail: "5% of every rupiah we earn is donated to street animal rescue organizations across Indonesia. Healing pets, helping strays.",
    features: [
      { title: "Pet health tracking", desc: "Monitor weight, temperature & vaccination history with easy charts." },
      { title: "Clinic management", desc: "Inpatient/outpatient visits, anamnesis, therapy notes & billing." },
      { title: "Revenue analytics", desc: "Daily, monthly, yearly revenue breakdowns for your clinic." },
    ],
    ctaTitle: "Ready to start?",
    ctaSub: "Join clinics and pet owners across Indonesia.",
    footer: "5% for street animal rescue",
    footerCopy: "© 2026 VetCare Pro. Built for clinics that care.",
    toggleOther: "ID",
  },
  id: {
    lang: "ID",
    badge: "Dirancang untuk klinik hewan Indonesia",
    headline: ["Cara paling cerdas", "merawat setiap hewan"],
    accent: "setiap hewan",
    sub: "VetCare Pro menghubungkan pemilik hewan, dokter hewan, dan pemilik klinik — agar hewan mendapat perawatan terbaik.",
    cta: "Mulai gratis",
    signIn: "Masuk",
    impact: "5% pendapatan kami untuk penyelamatan hewan liar",
    impactSub: "Setiap klinik yang menggunakan VetCare Pro turut mendanai perawatan hewan liar di Indonesia.",
    impactDetail: "5% dari setiap rupiah yang kami hasilkan disumbangkan ke organisasi penyelamatan hewan liar di seluruh Indonesia. Merawat hewan peliharaan, membantu hewan liar.",
    features: [
      { title: "Pantau kesehatan hewan", desc: "Monitor berat badan, suhu & riwayat vaksinasi dengan grafik mudah dibaca." },
      { title: "Manajemen klinik", desc: "Kunjungan rawat inap/jalan, anamnesis, catatan terapi & penagihan." },
      { title: "Analitik pendapatan", desc: "Rincian pendapatan harian, bulanan, tahunan untuk klinik Anda." },
    ],
    ctaTitle: "Siap untuk memulai?",
    ctaSub: "Bergabung bersama klinik dan pemilik hewan di seluruh Indonesia.",
    footer: "5% untuk penyelamatan hewan liar",
    footerCopy: "© 2026 VetCare Pro. Dibangun untuk klinik yang peduli.",
    toggleOther: "EN",
  },
};

export function Mobile() {
  const [lang, setLang] = useState<"en" | "id">("id");
  const c = content[lang];
  const other = lang === "en" ? "id" : "en";

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#fff", color: "#0d2d2a", minHeight: "100vh", fontSize: 15 }}>
      {/* Nav */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(255,255,255,0.97)", backdropFilter: "blur(12px)", borderBottom: "1px solid hsl(175,30%,90%)", padding: "0 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: teal, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <PawPrint style={{ color: "#fff", width: 17, height: 17 }} />
            </div>
            <span style={{ fontSize: 16, fontWeight: 700, color: teal }}>VetCare Pro</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Language toggle */}
            <div style={{ display: "flex", background: "hsl(175,30%,94%)", borderRadius: 7, padding: 2, gap: 2 }}>
              <button
                onClick={() => setLang("en")}
                style={{ padding: "4px 10px", borderRadius: 5, background: lang === "en" ? teal : "transparent", color: lang === "en" ? "#fff" : teal, fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer" }}
              >EN</button>
              <button
                onClick={() => setLang("id")}
                style={{ padding: "4px 10px", borderRadius: 5, background: lang === "id" ? teal : "transparent", color: lang === "id" ? "#fff" : teal, fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer" }}
              >ID</button>
            </div>
            <a href="/sign-in" style={{ padding: "6px 12px", borderRadius: 7, background: teal, color: "#fff", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>{c.signIn}</a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ background: `linear-gradient(135deg, hsl(175,60%,10%) 0%, hsl(175,70%,18%) 60%, hsl(175,50%,22%) 100%)`, padding: "52px 20px 48px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.12)", borderRadius: 100, padding: "5px 13px", marginBottom: 20, border: "1px solid rgba(255,255,255,0.18)" }}>
          <Heart style={{ width: 12, height: 12, color: "#7ae8d8" }} />
          <span style={{ fontSize: 12, color: "#7ae8d8", fontWeight: 500 }}>{c.badge}</span>
        </div>
        <h1 style={{ fontSize: 30, fontWeight: 800, color: "#fff", lineHeight: 1.2, marginBottom: 14, letterSpacing: "-0.02em" }}>
          {c.headline[0]}<br /><span style={{ color: "#7ae8d8" }}>{c.headline[1]}</span>
        </h1>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.72)", marginBottom: 28, lineHeight: 1.6 }}>{c.sub}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <a href="/sign-up" style={{ padding: "13px 24px", borderRadius: 10, background: "#fff", color: teal, fontSize: 15, fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {c.cta} <ArrowRight style={{ width: 15, height: 15 }} />
          </a>
          <a href="/sign-in" style={{ padding: "12px 24px", borderRadius: 10, background: "rgba(255,255,255,0.12)", color: "#fff", fontSize: 14, fontWeight: 600, textDecoration: "none", border: "1px solid rgba(255,255,255,0.2)", textAlign: "center" }}>
            {c.signIn}
          </a>
        </div>
      </section>

      {/* Impact banner */}
      <section style={{ background: `linear-gradient(90deg, hsl(175,65%,16%) 0%, hsl(175,60%,22%) 100%)`, padding: "20px 20px" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Heart style={{ width: 18, height: 18, color: "#ff8fa3" }} />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{c.impact}</p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>{c.impactSub}</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: "48px 20px", background: "#f8fffe" }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "hsl(175,60%,40%)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
          {lang === "en" ? "Everything you need" : "Semua yang Anda butuhkan"}
        </p>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: "#0d2d2a", marginBottom: 24 }}>
          {lang === "en" ? "One platform. Every role." : "Satu platform. Semua peran."}
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {c.features.map((f, i) => {
            const icons = [PawPrint, Stethoscope, BarChart3];
            const Icon = icons[i];
            return (
              <div key={f.title} style={{ background: "#fff", borderRadius: 14, padding: 20, border: "1.5px solid hsl(175,30%,92%)", boxShadow: "0 2px 8px rgba(0,80,72,0.05)", display: "flex", gap: 16, alignItems: "flex-start" }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: tealLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon style={{ width: 20, height: 20, color: teal }} />
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0d2d2a", marginBottom: 5 }}>{f.title}</h3>
                  <p style={{ fontSize: 13, color: "#5a7a76", lineHeight: 1.55 }}>{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Impact deep */}
      <section style={{ padding: "48px 20px", background: `linear-gradient(135deg, hsl(175,70%,12%) 0%, hsl(175,60%,20%) 100%)`, textAlign: "center" }}>
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
          <Heart style={{ width: 26, height: 26, color: "#ff8fa3" }} />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 12 }}>
          {lang === "en" ? "Healing pets. Helping strays." : "Merawat hewan. Membantu yang liar."}
        </h2>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.72)", lineHeight: 1.65, marginBottom: 20 }}>{c.impactDetail}</p>
        <div style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, padding: "14px 18px" }}>
          <p style={{ fontSize: 13, color: "#7ae8d8", fontWeight: 600, margin: 0 }}>{c.footer}</p>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "48px 20px", background: "#fff", textAlign: "center" }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "#0d2d2a", marginBottom: 10 }}>{c.ctaTitle}</h2>
        <p style={{ fontSize: 14, color: "#5a7a76", marginBottom: 24, lineHeight: 1.6 }}>{c.ctaSub}</p>
        <a href="/sign-up" style={{ display: "block", padding: "14px 24px", borderRadius: 10, background: teal, color: "#fff", fontSize: 15, fontWeight: 700, textDecoration: "none", textAlign: "center" }}>
          {c.cta}
        </a>
      </section>

      {/* Footer */}
      <footer style={{ background: "hsl(175,50%,10%)", padding: "28px 20px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <PawPrint style={{ color: "#7ae8d8", width: 15, height: 15 }} />
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>VetCare Pro</span>
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 16 }}>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: "0 0 6px" }}>{c.footerCopy}</p>
          <p style={{ fontSize: 12, color: "#7ae8d8", margin: 0, display: "flex", alignItems: "center", gap: 5 }}>
            <Heart style={{ width: 11, height: 11 }} /> {c.footer}
          </p>
        </div>
      </footer>
    </div>
  );
}
