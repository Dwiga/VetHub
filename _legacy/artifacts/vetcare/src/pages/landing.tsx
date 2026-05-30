import { useState } from "react";
import { Link } from "wouter";
import {
  Heart,
  PawPrint,
  Stethoscope,
  BarChart3,
  Shield,
  ArrowRight,
  CheckCircle,
  Menu,
  X,
} from "lucide-react";

const copy = {
  en: {
    badge: "Built in Indonesian",
    heroTitle1: "The smartest way",
    heroTitle2: "to care for every pet",
    heroAccent: "every pet",
    heroSub:
      "PetHub connects pet owners, veterinarians, and clinic owners — so pets get the care they deserve and clinics run smoothly.",
    ctaPrimary: "Get started free",
    ctaSecondary: "Sign in",
    stat1Val: "100%",
    stat1Lbl: "Free for first month",
    stat2Val: "All-in-one",
    stat2Lbl: "Pet + clinic platform",
    stat3Val: "Indonesia",
    stat3Lbl: "Designed for you",
    impactBannerTitle: "5% of our revenue goes to street animal rescue",
    impactBannerSub:
      "Every clinic that uses PetHub helps fund stray animal care across Indonesia.",
    featuresEyebrow: "Everything you need",
    featuresTitle: "One platform. Every role.",
    featuresSub:
      "Purpose-built for the full veterinary ecosystem — from the pet owner's phone to the clinic owner's dashboard.",
    features: [
      {
        badge: "Pet owners",
        title: "Pet health tracking",
        desc: "Monitor weight, temperature, and health history. View vaccination records, visit history, and trend charts — all in one place.",
      },
      {
        badge: "Veterinarians",
        title: "Clinic management",
        desc: "Manage inpatient and outpatient visits, anamnesis, therapy notes, and daily reports. Built for Indonesian veterinary clinics.",
      },
      {
        badge: "Clinic owners",
        title: "Revenue analytics",
        desc: "Track revenue and visit counts with daily, monthly, and yearly breakdowns. Know exactly how your clinic is performing.",
      },
      {
        badge: "Everyone",
        title: "Secure and trusted",
        desc: "Your clinic data and patient records are protected. Role-based access ensures every team member sees only what they need.",
      },
    ],
    whoTitle: "Who is PetHub for?",
    roles: [
      {
        title: "Pet owners",
        items: [
          "Register your cats, dogs, and other pets",
          "Track weight, temperature, and health over time",
          "Store vaccination records digitally",
          "View full visit and treatment history",
        ],
      },
      {
        title: "Veterinarians",
        items: [
          "Search patients by phone number or pet name",
          "Create inpatient and outpatient visits",
          "Log daily reports for hospitalized animals",
          "Manage therapy notes and billing",
        ],
      },
      {
        title: "Clinic owners",
        items: [
          "Manage clinic profile and staff",
          "Build a product and service catalog",
          "View daily, monthly, and yearly revenue",
          "Track visit volume and performance",
        ],
      },
    ],
    howTitle: "Up and running in minutes",
    howSub:
      "No training required. Sign up and get your clinic or pet profile active immediately.",
    steps: [
      {
        step: "01",
        title: "Register your clinic or pet",
        desc: "Sign up in seconds. Clinic owners add their profile; pet owners register their animals.",
      },
      {
        step: "02",
        title: "Manage visits & health",
        desc: "Vets log visits, therapies, and billing. Pet owners track health trends and vaccinations.",
      },
      {
        step: "03",
        title: "Grow with confidence",
        desc: "Use analytics to understand revenue patterns, staff performance, and patient flow.",
      },
    ],
    impactTitle: "Healing pets. Helping strays.",
    impactBody:
      "5% of every rupiah we earn is donated to street animal rescue organizations across Indonesia. When you use PetHub, you're not just caring for your pet — you're giving countless stray animals a chance at a better life.",
    impactTag:
      "Every clinic subscription · Every visit logged · Every feature used",
    impactTagAccent: "5% reaches the strays who need it most",
    ctaSectionTitle: "Ready to get started?",
    ctaSectionSub:
      "Join clinics and pet owners across Indonesia who trust PetHub for every visit, every vaccination, every check-up.",
    ctaSecondaryFull: "Sign in to your account",
    footerTagline: "Built for clinics that care.",
    footerImpact: "5% for street animal rescue",
  },
  id: {
    badge: "Dibuat di Indonesia",
    heroTitle1: "Cara paling cerdas",
    heroTitle2: "me-manage majikan berbulu",
    heroAccent: "setiap hewan",
    heroSub:
      "PetHub menghubungkan pemilik hewan, dokter hewan, dan pemilik klinik — agar hewan mendapat perawatan terbaik dan klinik berjalan lancar.",
    ctaPrimary: "Mulai gratis",
    ctaSecondary: "Masuk",
    stat1Val: "100%",
    stat1Lbl: "Gratis untuk 1 bulan pertama.",
    stat2Val: "All-in-one",
    stat2Lbl: "Platform pet + klinik",
    stat3Val: "Growing",
    stat3Lbl: "Terus berkembang sesuai kebutuhan pengguna",
    impactBannerTitle:
      "5% kentungan aplikasi akan digunakan untuk membantu hewan terlantar",
    impactBannerSub:
      "Setiap klinik yang menggunakan PetHub turut mendanai perawatan hewan terlantar terdekat lokasi admin.",
    featuresEyebrow: "Semua yang Anda butuhkan",
    featuresTitle: "Satu platform. Semua peran.",
    featuresSub:
      "Dirancang khusus untuk ekosistem veteriner lengkap — dari ponsel pemilik hewan hingga dasbor pemilik klinik.",
    features: [
      {
        badge: "Pemilik hewan",
        title: "Pantau kesehatan hewan",
        desc: "Monitor berat badan, suhu, dan riwayat kesehatan. Lihat catatan vaksinasi, riwayat kunjungan, dan grafik tren — semuanya di satu tempat.",
      },
      {
        badge: "Dokter hewan",
        title: "Manajemen klinik",
        desc: "Kelola kunjungan rawat inap dan rawat jalan, anamnesis, catatan terapi, dan laporan harian. Dirancang khusus untuk klinik hewan Indonesia.",
      },
      {
        badge: "Pemilik klinik",
        title: "Analitik pendapatan",
        desc: "Pantau pendapatan dan jumlah kunjungan dengan rincian harian, bulanan, dan tahunan. Ketahui persis kinerja klinik Anda.",
      },
      {
        badge: "Semua pengguna",
        title: "Aman dan terpercaya",
        desc: "Data klinik dan catatan pasien Anda dilindungi. Akses berbasis peran memastikan setiap anggota tim hanya melihat yang mereka butuhkan.",
      },
    ],
    whoTitle: "PetHub untuk siapa?",
    roles: [
      {
        title: "Pemilik hewan",
        items: [
          "Daftarkan kucing, anjing, dan hewan peliharaan lainnya",
          "Pantau berat badan, suhu, dan kesehatan dari waktu ke waktu",
          "Simpan catatan vaksinasi secara digital",
          "Lihat riwayat kunjungan dan perawatan lengkap",
        ],
      },
      {
        title: "Dokter hewan",
        items: [
          "Cari pasien berdasarkan nomor telepon atau nama hewan",
          "Buat kunjungan rawat inap dan rawat jalan",
          "Catat laporan harian untuk hewan yang dirawat inap",
          "Kelola catatan terapi dan penagihan",
        ],
      },
      {
        title: "Pemilik klinik",
        items: [
          "Kelola profil klinik dan staf",
          "Buat katalog produk dan layanan",
          "Lihat pendapatan harian, bulanan, dan tahunan",
          "Pantau volume kunjungan dan kinerja",
        ],
      },
    ],
    howTitle: "Langsung bisa digunakan",
    howSub:
      "Tidak perlu pelatihan. Daftar dan aktifkan profil klinik atau hewan peliharaan Anda sekarang.",
    steps: [
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
    ],
    impactTitle: "Merawat hewan peliharaan. Membantu hewan terlantar.",
    impactBody:
      "5% dari setiap rupiah yang kami hasilkan disumbangkan ke organisasi penyelamatan hewan terlantar. Saat Anda menggunakan PetHub, Anda tidak hanya merawat hewan peliharaan — Anda memberikan kesempatan hidup lebih baik bagi hewan-hewan terlatar.",
    impactTag:
      "Setiap langganan klinik · Setiap kunjungan tercatat · Setiap fitur digunakan",
    impactTagAccent: "5% menjangkau hewan terlantar yang paling membutuhkan",
    ctaSectionTitle: "Siap untuk memulai?",
    ctaSectionSub:
      "Bergabung bersama klinik dan pemilik hewan di seluruh Indonesia yang mempercayai PetHub untuk setiap kunjungan, vaksinasi, dan pemeriksaan.",
    ctaSecondaryFull: "Masuk ke akun Anda",
    footerTagline: "Dibangun untuk klinik yang peduli.",
    footerImpact: "5% untuk penyelamatan hewan terlantar",
  },
};

const roleColors = [
  { color: "hsl(175,70%,20%)", bg: "hsl(175,70%,92%)" },
  { color: "hsl(210,70%,30%)", bg: "hsl(210,80%,94%)" },
  { color: "hsl(145,60%,25%)", bg: "hsl(145,60%,93%)" },
];

const roleIcons = [PawPrint, Stethoscope, BarChart3];
const featureIcons = [PawPrint, Stethoscope, BarChart3, Shield];

export default function LandingPage() {
  const [lang, setLang] = useState<"en" | "id">("id");
  const [menuOpen, setMenuOpen] = useState(false);
  const c = copy[lang];

  return (
    <div
      className="min-h-screen bg-white text-[#0d2d2a]"
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
    >
      {/* ── Sticky Nav ─────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[hsl(175,30%,90%)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[hsl(175,70%,25%)] flex items-center justify-center shrink-0">
              <PawPrint className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-[hsl(175,70%,25%)]">
              PetHub
            </span>
          </div>

          {/* Desktop actions */}
          <div className="hidden sm:flex items-center gap-2">
            {/* Language toggle */}
            <div className="flex bg-[hsl(175,30%,94%)] rounded-lg p-0.5 gap-0.5">
              <button
                onClick={() => setLang("en")}
                className={`px-3.5 py-1.5 rounded-md text-sm font-semibold transition-all ${
                  lang === "en"
                    ? "bg-[hsl(175,70%,25%)] text-white shadow-sm"
                    : "text-[hsl(175,70%,25%)] hover:bg-[hsl(175,30%,88%)]"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLang("id")}
                className={`px-3.5 py-1.5 rounded-md text-sm font-semibold transition-all ${
                  lang === "id"
                    ? "bg-[hsl(175,70%,25%)] text-white shadow-sm"
                    : "text-[hsl(175,70%,25%)] hover:bg-[hsl(175,30%,88%)]"
                }`}
              >
                ID
              </button>
            </div>
            <Link href="/sign-in">
              <span className="px-4 py-2 rounded-lg text-sm font-semibold text-[hsl(175,70%,25%)] hover:bg-[hsl(175,30%,94%)] transition-colors cursor-pointer">
                {c.ctaSecondary}
              </span>
            </Link>
            <Link href="/sign-up">
              <span
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-[hsl(175,70%,25%)] text-white hover:bg-[hsl(175,70%,20%)] transition-colors cursor-pointer"
                data-testid="btn-get-started"
              >
                {c.ctaPrimary}
              </span>
            </Link>
          </div>

          {/* Mobile: lang toggle + hamburger */}
          <div className="flex sm:hidden items-center gap-2">
            <div className="flex bg-[hsl(175,30%,94%)] rounded-lg p-0.5 gap-0.5">
              <button
                onClick={() => setLang("en")}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  lang === "en"
                    ? "bg-[hsl(175,70%,25%)] text-white"
                    : "text-[hsl(175,70%,25%)]"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLang("id")}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  lang === "id"
                    ? "bg-[hsl(175,70%,25%)] text-white"
                    : "text-[hsl(175,70%,25%)]"
                }`}
              >
                ID
              </button>
            </div>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {menuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="sm:hidden border-t border-[hsl(175,30%,90%)] bg-white px-4 py-3 flex flex-col gap-2">
            <Link href="/sign-in">
              <span className="block w-full text-center py-2.5 rounded-lg font-semibold text-[hsl(175,70%,25%)] hover:bg-[hsl(175,30%,94%)] transition-colors cursor-pointer">
                {c.ctaSecondary}
              </span>
            </Link>
            <Link href="/sign-up">
              <span
                className="block w-full text-center py-2.5 rounded-lg font-semibold bg-[hsl(175,70%,25%)] text-white hover:bg-[hsl(175,70%,20%)] transition-colors cursor-pointer"
                data-testid="btn-get-started-mobile"
              >
                {c.ctaPrimary}
              </span>
            </Link>
          </div>
        )}
      </nav>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden py-20 sm:py-28 px-4 sm:px-6"
        style={{
          background:
            "linear-gradient(135deg, hsl(175,60%,10%) 0%, hsl(175,70%,18%) 55%, hsl(175,50%,22%) 100%)",
        }}
      >
        {/* Decorative blobs */}
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full opacity-[0.04] bg-white pointer-events-none" />
        <div className="absolute -bottom-32 -left-16 w-72 h-72 rounded-full opacity-[0.03] bg-white pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-7">
            <Heart className="w-3.5 h-3.5 text-[#7ae8d8]" />
            <span className="text-xs font-medium text-[#7ae8d8]">
              {c.badge}
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight mb-5">
            {c.heroTitle1}
            <br />
            <span className="text-[#7ae8d8]">{c.heroTitle2}</span>
          </h1>

          <p className="text-base sm:text-lg text-white/70 max-w-2xl mx-auto mb-9 leading-relaxed">
            {c.heroSub}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/sign-up">
              <span
                className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white text-[hsl(175,70%,25%)] font-bold text-[15px] hover:bg-white/90 transition-colors cursor-pointer"
                data-testid="btn-get-started"
              >
                {c.ctaPrimary} <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
            <Link href="/sign-in">
              <span
                className="flex items-center justify-center px-7 py-3.5 rounded-xl bg-white/10 border border-white/25 text-white font-semibold text-[15px] hover:bg-white/15 transition-colors cursor-pointer"
                data-testid="btn-sign-in"
              >
                {c.ctaSecondary}
              </span>
            </Link>
          </div>

          {/* Stat pills */}
          <div className="flex flex-wrap justify-center gap-3 mt-12">
            {[
              [c.stat1Val, c.stat1Lbl],
              [c.stat2Val, c.stat2Lbl],
              [c.stat3Val, c.stat3Lbl],
            ].map(([val, lbl]) => (
              <div
                key={lbl}
                className="bg-white/8 border border-white/14 rounded-xl px-5 py-2.5 text-center backdrop-blur-sm"
              >
                <p className="text-[17px] font-bold text-white leading-tight">
                  {val}
                </p>
                <p className="text-[11px] text-white/50 mt-0.5">{lbl}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5% Impact Banner ───────────────────────────────── */}
      <section
        className="py-6 px-4 sm:px-6"
        style={{
          background:
            "linear-gradient(90deg, hsl(175,65%,16%) 0%, hsl(175,60%,22%) 100%)",
        }}
      >
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center gap-3 sm:gap-4 text-center sm:text-left">
          <div className="w-11 h-11 rounded-full bg-white/12 flex items-center justify-center shrink-0">
            <Heart className="w-5 h-5 text-[#ff8fa3]" />
          </div>
          <div>
            <p className="text-[15px] font-bold text-white mb-1">
              {c.impactBannerTitle}
            </p>
            <p className="text-[13px] text-white/65 leading-relaxed">
              {c.impactBannerSub}
            </p>
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 bg-[#f8fffe]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-bold text-[hsl(175,60%,40%)] tracking-widest uppercase">
              {c.featuresEyebrow}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0d2d2a] mt-2 tracking-tight">
              {c.featuresTitle}
            </h2>
            <p className="text-[#5a7a76] text-base mt-3 max-w-lg mx-auto leading-relaxed">
              {c.featuresSub}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {c.features.map((f, i) => {
              const Icon = featureIcons[i];
              return (
                <div
                  key={f.title}
                  className="bg-white rounded-2xl p-7 border border-[hsl(175,30%,92%)] shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 rounded-[14px] bg-[hsl(175,70%,92%)] flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-[hsl(175,70%,25%)]" />
                  </div>
                  <span className="text-[11px] font-bold text-[hsl(175,60%,40%)] tracking-wider uppercase">
                    {f.badge}
                  </span>
                  <h3 className="text-[16px] font-bold text-[#0d2d2a] mt-1.5 mb-2.5">
                    {f.title}
                  </h3>
                  <p className="text-[13.5px] text-[#5a7a76] leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Who It's For ───────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0d2d2a] text-center mb-12 tracking-tight">
            {c.whoTitle}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {c.roles.map((role, i) => {
              const Icon = roleIcons[i];
              const { color, bg } = roleColors[i];
              return (
                <div
                  key={role.title}
                  className="rounded-2xl p-8 border-2"
                  style={{ background: bg, borderColor: bg }}
                >
                  <div
                    className="w-13 h-13 rounded-2xl flex items-center justify-center mb-5"
                    style={{ background: color, width: 52, height: 52 }}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-[#0d2d2a] mb-4">
                    {role.title}
                  </h3>
                  <ul className="space-y-2.5">
                    {role.items.map((item) => (
                      <li key={item} className="flex gap-2.5 items-start">
                        <CheckCircle
                          className="w-4 h-4 mt-0.5 shrink-0"
                          style={{ color }}
                        />
                        <span className="text-[13.5px] text-[#3a5a55] leading-snug">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 bg-[#f0faf8]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0d2d2a] tracking-tight">
              {c.howTitle}
            </h2>
            <p className="text-[#5a7a76] text-base mt-3 leading-relaxed">
              {c.howSub}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            {c.steps.map((s) => (
              <div key={s.step}>
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center font-extrabold text-lg text-white mx-auto mb-4"
                  style={{ background: "hsl(175,70%,25%)" }}
                >
                  {s.step}
                </div>
                <h3 className="text-[16px] font-bold text-[#0d2d2a] mb-2">
                  {s.title}
                </h3>
                <p className="text-[13.5px] text-[#5a7a76] leading-relaxed">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Impact Deep Dive ───────────────────────────────── */}
      <section
        className="py-20 px-4 sm:px-6"
        style={{
          background:
            "linear-gradient(135deg, hsl(175,70%,12%) 0%, hsl(175,60%,20%) 100%)",
        }}
      >
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-white/12 flex items-center justify-center mx-auto mb-6">
            <Heart className="w-8 h-8 text-[#ff8fa3]" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-5 tracking-tight">
            {c.impactTitle}
          </h2>
          <p className="text-[16px] text-white/72 leading-relaxed mb-7">
            <strong className="text-[#7ae8d8]">
              {lang === "en"
                ? "5% of every rupiah we earn"
                : "5% dari setiap rupiah yang kami hasilkan"}
            </strong>{" "}
            {lang === "en"
              ? " is donated to street animal rescue organizations across Indonesia. When you use PetHub, you're not just caring for your pet — you're giving countless stray animals a chance at a better life."
              : " disumbangkan ke organisasi penyelamatan hewan terlantar. Saat Anda menggunakan PetHub, Anda tidak hanya merawat hewan peliharaan — Anda memberikan kesempatan hidup lebih baik bagi hewan-hewan terlantar."}
          </p>
          <div className="inline-block bg-white/8 border border-white/15 rounded-xl px-6 py-4">
            <p className="text-[13px] text-white/65 mb-2">{c.impactTag}</p>
            <p className="text-[13px] font-semibold text-[#7ae8d8]">
              {c.impactTagAccent}
            </p>
          </div>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 bg-white text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0d2d2a] mb-4 tracking-tight">
            {c.ctaSectionTitle}
          </h2>
          <p className="text-base text-[#5a7a76] mb-9 leading-relaxed">
            {c.ctaSectionSub}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/sign-up">
              <span className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-[hsl(175,70%,25%)] text-white font-bold text-[15px] hover:bg-[hsl(175,70%,20%)] transition-colors cursor-pointer">
                {c.ctaPrimary} <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
            <Link href="/sign-in">
              <span className="flex items-center justify-center px-7 py-3.5 rounded-xl bg-[hsl(175,70%,92%)] text-[hsl(175,70%,25%)] font-semibold text-[15px] hover:bg-[hsl(175,60%,86%)] transition-colors cursor-pointer">
                {c.ctaSecondaryFull}
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer
        className="px-4 sm:px-6 py-10"
        style={{ background: "hsl(175,50%,10%)" }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2.5 mb-7">
            <div className="w-8 h-8 rounded-lg bg-white/12 flex items-center justify-center">
              <PawPrint className="w-4 h-4 text-[#7ae8d8]" />
            </div>
            <span className="text-base font-bold text-white">PetHub</span>
          </div>
          <div className="border-t border-white/10 pt-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <p className="text-[12px] text-white/40">
              © 2026 PetHub. {c.footerTagline}
            </p>
            <p className="text-[12px] text-[#7ae8d8] flex items-center gap-1.5">
              <Heart className="w-3 h-3" /> {c.footerImpact}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
