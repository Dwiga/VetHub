import { Head, Link } from '@inertiajs/react'
import { Dog, Cat, Fish, Bird, Heart, ShieldCheck, Activity, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="min-h-screen bg-emerald-50 selection:bg-emerald-200 selection:text-emerald-900 overflow-x-hidden">
      <Head title="PawsVet - Solusi Kesehatan Hewan Kesayangan Anda" />

      {/* Header/Nav */}
      <header className="container mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center space-x-2">
          <div className="bg-emerald-600 p-2 rounded-xl shadow-lg shadow-emerald-200">
            <Heart className="w-6 h-6 text-white fill-current" />
          </div>
          <span className="text-2xl font-black text-emerald-900 tracking-tight">PawsVet</span>
        </div>
        <Button asChild variant="ghost" className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-100 font-semibold">
          <a href="/users/sign_in">Masuk</a>
        </Button>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 pt-12 pb-24 relative">
        {/* Floating Background Icons */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-10">
          <Dog className="absolute top-10 left-[10%] w-32 h-32 rotate-12" />
          <Cat className="absolute top-40 right-[15%] w-24 h-24 -rotate-12" />
          <Fish className="absolute bottom-20 left-[20%] w-20 h-20 rotate-45" />
          <Bird className="absolute top-[60%] right-[5%] w-28 h-28 -rotate-6" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center space-x-2 bg-emerald-100 px-4 py-2 rounded-full mb-8 border border-emerald-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-bold text-emerald-700 uppercase tracking-wider">Aplikasi Veteriner Terpercaya</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-emerald-950 leading-[1.1] mb-8">
            Rawat Hewan Kesayangan <br className="hidden md:block" /> 
            <span className="text-emerald-600">Lebih Mudah & Modern</span>
          </h1>
          
          <p className="text-lg md:text-xl text-emerald-800/80 mb-12 max-w-2xl mx-auto leading-relaxed">
            Platform all-in-one untuk pemilik hewan dan tenaga medis veteriner. Kelola rekam medis, jadwal vaksin, dan konsultasi dalam satu genggaman.
          </p>

          <div className="flex flex-col items-center justify-center space-y-6">
            <Button asChild className="h-20 px-12 text-2xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-3xl shadow-2xl shadow-emerald-200 transition-all hover:scale-105 active:scale-95 group">
              <a href="/users/sign_in">
                Mulai Sekarang
                <ArrowRight className="inline-block ml-3 w-8 h-8 group-hover:translate-x-2 transition-transform" />
              </a>
            </Button>
            <p className="text-emerald-600/60 font-medium">Gratis untuk pemilik hewan peliharaan</p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-32 max-w-5xl mx-auto">
          <div className="bg-white/60 backdrop-blur-sm p-8 rounded-[2rem] border border-emerald-100 shadow-xl shadow-emerald-100/50 hover:bg-white transition-colors">
            <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6">
              <Activity className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-emerald-950 mb-3">Monitoring Kesehatan</h3>
            <p className="text-emerald-800/70 leading-relaxed text-sm">
              Pantau berat badan, nafsu makan, dan aktivitas harian hewan Anda secara berkala.
            </p>
          </div>

          <div className="bg-white/60 backdrop-blur-sm p-8 rounded-[2rem] border border-emerald-100 shadow-xl shadow-emerald-100/50 hover:bg-white transition-colors">
            <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6">
              <Cat className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-emerald-950 mb-3">Digital Pet ID</h3>
            <p className="text-emerald-800/70 leading-relaxed text-sm">
              Simpan semua data penting hewan peliharaan dalam profil digital yang aman dan mudah diakses.
            </p>
          </div>

          <div className="bg-white/60 backdrop-blur-sm p-8 rounded-[2rem] border border-emerald-100 shadow-xl shadow-emerald-100/50 hover:bg-white transition-colors">
            <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6">
              <ShieldCheck className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-emerald-950 mb-3">Registrasi Veteriner</h3>
            <p className="text-emerald-800/70 leading-relaxed text-sm">
              Daftarkan klinik atau praktik mandiri Anda untuk mulai melayani pasien secara profesional.
            </p>
          </div>
        </div>
      </main>

      {/* Pet Symbols Footer Decoration */}
      <footer className="container mx-auto px-6 py-12 border-t border-emerald-100 text-center">
        <div className="flex justify-center space-x-8 text-emerald-200 mb-8">
          <Dog size={24} />
          <Cat size={24} />
          <Fish size={24} />
          <Bird size={24} />
        </div>
        <p className="text-emerald-900/40 text-xs font-bold uppercase tracking-widest">
          &copy; 2026 PawsVet - Caring for every paw
        </p>
      </footer>
    </div>
  )
}
