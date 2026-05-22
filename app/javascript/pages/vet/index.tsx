import Header from "@/components/molecules/header"
import { usePage, router } from '@inertiajs/react'
import { PropsType } from '@/types/props';
import { Briefcase, MapPin, Phone, Mail, UserStar, Plus } from 'lucide-react'
import { Button } from "@/components/ui/button";

export default function Index() {
  const { vet, auth } = usePage<PropsType & { vet: any, auth: any }>().props

  if (!vet) {
    return (
      <div className="min-h-screen bg-emerald-50/30">
        <Header />
        <main className="max-w-4xl mx-auto p-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="bg-emerald-100 p-6 rounded-full mb-6">
            <Briefcase className="w-12 h-12 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-black text-emerald-950 mb-2">Belum Terdaftar sebagai Vet</h2>
          <p className="text-emerald-700/60 max-w-md mb-8 font-medium">
            Daftarkan vet Anda sekarang untuk mulai mengelola hewan peliharaan pasien dan riwayat medis mereka.
          </p>
          <a 
            href="/vet/new" 
            className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-xl shadow-emerald-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Daftar Sekarang
          </a>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-emerald-50/30">
      <Header />
      <main className="max-w-4xl mx-auto p-6">
        <div className="bg-white p-8 rounded-[2rem] border border-emerald-100 shadow-xl shadow-emerald-900/5 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center space-x-6">
              <div className="bg-emerald-600 p-4 rounded-3xl shadow-lg shadow-emerald-200">
                <Briefcase className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-emerald-950 tracking-tight">{vet.name}</h1>
                <div className="flex items-center text-emerald-600/60 font-medium mt-1 uppercase text-xs tracking-widest">
                  <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full mr-2"><Button variant="ghost"><UserStar className="w-4 h-4 text-emerald-600" /></Button></span>
                  <span>{auth.user?.vet_role}</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button className="px-5 py-2.5 bg-emerald-50 text-emerald-700 font-bold rounded-xl hover:bg-emerald-100 transition-colors">
                Edit Profil
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10 pt-8 border-t border-emerald-50">
            <div className="flex items-center space-x-4">
              <div className="bg-emerald-50 p-3 rounded-2xl">
                <Phone className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-emerald-900/40 uppercase tracking-widest">Nomor HP</p>
                <p className="font-bold text-emerald-900">{vet.phone}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="bg-emerald-50 p-3 rounded-2xl">
                <Mail className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-emerald-900/40 uppercase tracking-widest">Email</p>
                <p className="font-bold text-emerald-900">{vet.email || '-'}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="bg-emerald-50 p-3 rounded-2xl">
                <MapPin className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-emerald-900/40 uppercase tracking-widest">Alamat</p>
                <p className="font-bold text-emerald-900 truncate max-w-[200px]">{vet.address}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-[2rem] border border-emerald-100 shadow-lg shadow-emerald-900/5">
            <div className="flex">
              <h3 className="text-xl font-black text-emerald-950 mb-4">Pasien Aktif</h3>
              <Button variant="ghost" className="ml-auto" onClick={() => router.get("/vet/lookup")}>
                <Plus className="w-4 h-4 text-emerald-600" />
              </Button>
            </div>
            <div className="text-center py-12">
              <p className="text-emerald-700/50 font-medium italic">Belum ada pasien terdaftar</p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-[2rem] border border-emerald-100 shadow-lg shadow-emerald-900/5">
            <h3 className="text-xl font-black text-emerald-950 mb-4">Jadwal Hari Ini</h3>
            <div className="text-center py-12">
              <p className="text-emerald-700/50 font-medium italic">Belum ada jadwal hari ini</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
