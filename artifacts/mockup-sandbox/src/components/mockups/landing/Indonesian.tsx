import { useState } from "react";
import {
  Heart,
  PawPrint,
  Stethoscope,
  BarChart3,
  Shield,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

const teal = "hsl(175, 70%, 25%)";
const tealLight = "hsl(175, 70%, 92%)";
const tealMid = "hsl(175, 60%, 40%)";

const features = [
  {
    icon: PawPrint,
    title: "Pantau kesehatan hewan",
    desc: "Monitor berat badan, suhu, dan riwayat kesehatan. Lihat catatan vaksinasi, riwayat kunjungan, dan grafik tren — semuanya di satu tempat.",
    badge: "Pemilik hewan",
  },
  {
    icon: Stethoscope,
    title: "Manajemen klinik",
    desc: "Kelola kunjungan rawat inap dan rawat jalan, anamnesis, catatan terapi, dan laporan harian. Dirancang khusus untuk klinik hewan Indonesia.",
    badge: "Dokter hewan",
  },
  {
    icon: BarChart3,
    title: "Analitik pendapatan",
    desc: "Pantau pendapatan dan jumlah kunjungan dengan rincian harian, bulanan, dan tahunan. Ketahui persis kinerja klinik Anda.",
    badge: "Pemilik klinik",
  },
  {
    icon: Shield,
    title: "Aman dan terpercaya",
    desc: "Data klinik dan catatan pasien Anda dilindungi. Akses berbasis peran memastikan setiap anggota tim hanya melihat yang mereka butuhkan.",
    badge: "Semua pengguna",
  },
];

const howItWorks = [
  {
    step: "01",
    title: "Daftarkan klinik atau hewan peliharaan",
    desc: "Daftar dalam hitungan detik. Pemilik klinik menambahkan profil; pemilik hewan mendaftarkan hewan mereka.",
  },
  {
    step: "02",
    title: "Kelola kunjungan dan kesehatan",
    desc: "Dokter hewan mencatat kunjungan, terapi, dan tagihan. Pemilik hewan memantau tren kesehatan dan vaksinasi.",
  },
  {
    step: "03",
    title: "Berkembang dengan percaya diri",
    desc: "Gunakan analitik untuk memahami pola pendapatan, kinerja staf, dan alur pasien.",
  },
];

export function Indonesian() {
  return (
    <div
      style={{
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        background: "#fff",
        color: "#0d2d2a",
        minHeight: "100vh",
      }}
    >
      {/* Nav */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid hsl(175,30%,90%)",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 64,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: teal,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <PawPrint style={{ color: "#fff", width: 20, height: 20 }} />
            </div>
            <span style={{ fontSize: 18, fontWeight: 700, color: teal }}>
              VetHub
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                display: "flex",
                background: "hsl(175,30%,94%)",
                borderRadius: 8,
                padding: 3,
                gap: 2,
              }}
            >
              <a
                href="/__mockup/preview/landing/English"
                style={{
                  padding: "5px 14px",
                  borderRadius: 6,
                  color: teal,
                  fontSize: 13,
                  fontWeight: 500,
                  textDecoration: "none",
                }}
              >
                EN
              </a>
              <span
                style={{
                  padding: "5px 14px",
                  borderRadius: 6,
                  background: teal,
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                ID
              </span>
            </div>
            <a
              href="/sign-in"
              style={{
                padding: "8px 18px",
                borderRadius: 8,
                color: teal,
                fontSize: 14,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Masuk
            </a>
            <a
              href="/sign-up"
              style={{
                padding: "8px 20px",
                borderRadius: 8,
                background: teal,
                color: "#fff",
                fontSize: 14,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Mulai gratis
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section
        style={{
          background: `linear-gradient(135deg, hsl(175,60%,10%) 0%, hsl(175,70%,18%) 50%, hsl(175,50%,22%) 100%)`,
          padding: "96px 24px 80px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -80,
            right: -80,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.04)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -120,
            left: -60,
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.03)",
          }}
        />
        <div
          style={{
            maxWidth: 900,
            margin: "0 auto",
            textAlign: "center",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(255,255,255,0.12)",
              borderRadius: 100,
              padding: "6px 16px",
              marginBottom: 24,
              border: "1px solid rgba(255,255,255,0.18)",
            }}
          >
            <Heart style={{ width: 14, height: 14, color: "#7ae8d8" }} />
            <span style={{ fontSize: 13, color: "#7ae8d8", fontWeight: 500 }}>
              Dirancang untuk klinik hewan Indonesia
            </span>
          </div>
          <h1
            style={{
              fontSize: "clamp(36px, 5vw, 64px)",
              fontWeight: 800,
              color: "#fff",
              lineHeight: 1.15,
              marginBottom: 20,
              letterSpacing: "-0.02em",
            }}
          >
            Cara paling cerdas
            <br />
            untuk merawat <span style={{ color: "#7ae8d8" }}>setiap hewan</span>
          </h1>
          <p
            style={{
              fontSize: "clamp(15px, 2vw, 19px)",
              color: "rgba(255,255,255,0.72)",
              maxWidth: 620,
              margin: "0 auto 36px",
              lineHeight: 1.65,
            }}
          >
            VetHub menghubungkan pemilik hewan, dokter hewan, dan pemilik klinik
            — agar hewan mendapat perawatan terbaik dan klinik berjalan lancar.
          </p>
          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <a
              href="/sign-up"
              style={{
                padding: "14px 32px",
                borderRadius: 10,
                background: "#fff",
                color: teal,
                fontSize: 15,
                fontWeight: 700,
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              Mulai gratis <ArrowRight style={{ width: 16, height: 16 }} />
            </a>
            <a
              href="/sign-in"
              style={{
                padding: "14px 28px",
                borderRadius: 10,
                background: "rgba(255,255,255,0.12)",
                color: "#fff",
                fontSize: 15,
                fontWeight: 600,
                textDecoration: "none",
                border: "1px solid rgba(255,255,255,0.25)",
              }}
            >
              Masuk
            </a>
          </div>
          <div
            style={{
              display: "flex",
              gap: 16,
              justifyContent: "center",
              marginTop: 48,
              flexWrap: "wrap",
            }}
          >
            {[
              ["100%", "Gratis untuk memulai"],
              ["Semua-dalam-satu", "Platform pet + klinik"],
              ["Indonesia", "Dirancang untuk Anda"],
            ].map(([val, lbl]) => (
              <div
                key={lbl}
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.14)",
                  borderRadius: 10,
                  padding: "10px 20px",
                  textAlign: "center",
                }}
              >
                <p
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: "#fff",
                    marginBottom: 2,
                  }}
                >
                  {val}
                </p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
                  {lbl}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5% Impact Banner */}
      <section
        style={{
          background: `linear-gradient(90deg, hsl(175,65%,16%) 0%, hsl(175,60%,22%) 100%)`,
          padding: "28px 24px",
        }}
      >
        <div
          style={{
            maxWidth: 900,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Heart style={{ width: 22, height: 22, color: "#ff8fa3" }} />
          </div>
          <div style={{ textAlign: "center" }}>
            <p
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "#fff",
                marginBottom: 4,
              }}
            >
              5% pendapatan kami digunakan untuk menyelamatkan hewan terlantar
            </p>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)" }}>
              Setiap klinik yang menggunakan PetHub, sudah turut berpartisipasi
              dalam merawat beberapa hewan terlantar.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: "80px 24px", background: "#f8fffe" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: tealMid,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              Semua yang Anda butuhkan
            </span>
            <h2
              style={{
                fontSize: "clamp(26px, 3vw, 40px)",
                fontWeight: 800,
                color: "#0d2d2a",
                marginTop: 8,
                letterSpacing: "-0.01em",
              }}
            >
              Satu platform. Semua peran.
            </h2>
            <p
              style={{
                color: "#5a7a76",
                fontSize: 16,
                marginTop: 10,
                maxWidth: 500,
                margin: "10px auto 0",
              }}
            >
              Dirancang khusus untuk ekosistem veteriner lengkap — dari ponsel
              pemilik hewan hingga dasbor pemilik klinik.
            </p>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 20,
            }}
          >
            {features.map(({ icon: Icon, title, desc, badge }) => (
              <div
                key={title}
                style={{
                  background: "#fff",
                  borderRadius: 16,
                  padding: 28,
                  border: "1.5px solid hsl(175,30%,92%)",
                  boxShadow: "0 2px 12px rgba(0,80,72,0.06)",
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background: tealLight,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 16,
                  }}
                >
                  <Icon style={{ width: 24, height: 24, color: teal }} />
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: tealMid,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  {badge}
                </span>
                <h3
                  style={{
                    fontSize: 17,
                    fontWeight: 700,
                    color: "#0d2d2a",
                    marginTop: 6,
                    marginBottom: 10,
                  }}
                >
                  {title}
                </h3>
                <p style={{ fontSize: 14, color: "#5a7a76", lineHeight: 1.65 }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section style={{ padding: "80px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2
              style={{
                fontSize: "clamp(24px, 3vw, 38px)",
                fontWeight: 800,
                color: "#0d2d2a",
              }}
            >
              VetHub untuk siapa?
            </h2>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 24,
            }}
          >
            {[
              {
                icon: PawPrint,
                title: "Pemilik hewan",
                color: "hsl(175,70%,20%)",
                bg: tealLight,
                items: [
                  "Daftarkan kucing, anjing, dan hewan peliharaan lainnya",
                  "Pantau berat badan, suhu, dan kesehatan dari waktu ke waktu",
                  "Simpan catatan vaksinasi secara digital",
                  "Lihat riwayat kunjungan dan perawatan lengkap",
                ],
              },
              {
                icon: Stethoscope,
                title: "Dokter hewan",
                color: "hsl(210,70%,30%)",
                bg: "hsl(210,80%,94%)",
                items: [
                  "Cari pasien berdasarkan nomor telepon atau nama hewan",
                  "Buat kunjungan rawat inap dan rawat jalan",
                  "Catat laporan harian untuk hewan yang dirawat inap",
                  "Kelola catatan terapi dan penagihan",
                ],
              },
              {
                icon: BarChart3,
                title: "Pemilik klinik",
                color: "hsl(145,60%,25%)",
                bg: "hsl(145,60%,93%)",
                items: [
                  "Kelola profil klinik dan staf",
                  "Buat katalog produk dan layanan",
                  "Lihat pendapatan harian, bulanan, dan tahunan",
                  "Pantau volume kunjungan dan kinerja",
                ],
              },
            ].map(({ icon: Icon, title, color, bg, items }) => (
              <div
                key={title}
                style={{
                  background: bg,
                  borderRadius: 20,
                  padding: 32,
                  border: `1.5px solid ${bg}`,
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 16,
                    background: color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 20,
                  }}
                >
                  <Icon style={{ width: 26, height: 26, color: "#fff" }} />
                </div>
                <h3
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: "#0d2d2a",
                    marginBottom: 16,
                  }}
                >
                  {title}
                </h3>
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  {items.map((item) => (
                    <li
                      key={item}
                      style={{
                        display: "flex",
                        gap: 10,
                        alignItems: "flex-start",
                      }}
                    >
                      <CheckCircle
                        style={{
                          width: 16,
                          height: 16,
                          color,
                          marginTop: 2,
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          fontSize: 14,
                          color: "#3a5a55",
                          lineHeight: 1.5,
                        }}
                      >
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: "80px 24px", background: "#f0faf8" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <h2
              style={{
                fontSize: "clamp(24px, 3vw, 38px)",
                fontWeight: 800,
                color: "#0d2d2a",
              }}
            >
              Langsung bisa digunakan
            </h2>
            <p style={{ color: "#5a7a76", fontSize: 15, marginTop: 10 }}>
              Tidak perlu pelatihan. Daftar dan aktifkan profil klinik atau
              hewan peliharaan Anda sekarang.
            </p>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 24,
            }}
          >
            {howItWorks.map(({ step, title, desc }) => (
              <div key={step} style={{ textAlign: "center" }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background: teal,
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: 18,
                    margin: "0 auto 16px",
                  }}
                >
                  {step}
                </div>
                <h3
                  style={{
                    fontSize: 17,
                    fontWeight: 700,
                    color: "#0d2d2a",
                    marginBottom: 8,
                  }}
                >
                  {title}
                </h3>
                <p style={{ fontSize: 14, color: "#5a7a76", lineHeight: 1.65 }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact */}
      <section
        style={{
          padding: "72px 24px",
          background: `linear-gradient(135deg, hsl(175,70%,12%) 0%, hsl(175,60%,20%) 100%)`,
        }}
      >
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
            }}
          >
            <Heart style={{ width: 32, height: 32, color: "#ff8fa3" }} />
          </div>
          <h2
            style={{
              fontSize: "clamp(24px, 3vw, 38px)",
              fontWeight: 800,
              color: "#fff",
              marginBottom: 16,
            }}
          >
            Merawat hewan peliharaan. Membantu hewan terlantar.
          </h2>
          <p
            style={{
              fontSize: 17,
              color: "rgba(255,255,255,0.75)",
              lineHeight: 1.7,
              marginBottom: 28,
            }}
          >
            <strong style={{ color: "#7ae8d8" }}>
              5% dari setiap rupiah yang kami hasilkan
            </strong>{" "}
            disumbangkan ke organisasi penyelamatan hewan terlantar di beberapa
            wilayah Kediri. Saat Anda menggunakan PetHub, Anda tidak hanya
            merawat hewan peliharaan — Anda memberikan kesempatan hidup lebih
            baik bagi hewan-hewan terlantar.
          </p>
          <div
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 12,
              padding: "16px 24px",
              display: "inline-block",
            }}
          >
            <p
              style={{
                fontSize: 14,
                color: "rgba(255,255,255,0.7)",
                margin: 0,
              }}
            >
              Setiap langganan klinik · Setiap kunjungan tercatat · Setiap fitur
              digunakan
              <br />
              <span style={{ color: "#7ae8d8", fontWeight: 600 }}>
                5% menjangkau hewan liar yang paling membutuhkan
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        style={{
          padding: "80px 24px",
          background: "#fff",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2
            style={{
              fontSize: "clamp(26px, 3vw, 42px)",
              fontWeight: 800,
              color: "#0d2d2a",
              marginBottom: 16,
            }}
          >
            Siap untuk memulai?
          </h2>
          <p
            style={{
              fontSize: 16,
              color: "#5a7a76",
              marginBottom: 32,
              lineHeight: 1.65,
            }}
          >
            Bergabung bersama klinik dan pemilik hewan di seluruh Indonesia yang
            mempercayai PetHub untuk setiap kunjungan, vaksinasi, dan
            pemeriksaan.
          </p>
          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <a
              href="/sign-up"
              style={{
                padding: "14px 32px",
                borderRadius: 10,
                background: teal,
                color: "#fff",
                fontSize: 15,
                fontWeight: 700,
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              Mulai gratis <ArrowRight style={{ width: 16, height: 16 }} />
            </a>
            <a
              href="/sign-in"
              style={{
                padding: "14px 28px",
                borderRadius: 10,
                background: tealLight,
                color: teal,
                fontSize: 15,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Masuk ke akun Anda
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{ background: "hsl(175,50%,10%)", padding: "40px 24px 24px" }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 24,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "rgba(255,255,255,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <PawPrint style={{ color: "#7ae8d8", width: 18, height: 18 }} />
            </div>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>
              VetHub
            </span>
          </div>
          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.1)",
              paddingTop: 20,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <p
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,0.4)",
                margin: 0,
              }}
            >
              © 2026 VetHub. Dibangun untuk klinik yang peduli.
            </p>
            <p
              style={{
                fontSize: 13,
                color: "#7ae8d8",
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Heart style={{ width: 13, height: 13 }} /> 5% untuk penyelamatan
              hewan liar
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
