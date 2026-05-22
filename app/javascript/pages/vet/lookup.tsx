import { useState } from "react"
import { router } from "@inertiajs/react"
import Header from "@/components/molecules/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Phone, Search } from "lucide-react"

export default function VetLookup() {
  const [phone, setPhone] = useState<string>("")

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone.trim()) return
    router.get("/vet/lookup", { phone })
  }

  return (
    <div className="min-h-screen bg-emerald-50/30">
      <Header />
      <main className="max-w-xl mx-auto p-6">
        <div className="bg-white p-8 rounded-[2rem] border border-emerald-100 shadow-xl shadow-emerald-900/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-emerald-100 p-3 rounded-2xl">
              <Phone className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-xl font-black text-emerald-950">Cari Pasien</h1>
              <p className="text-sm text-emerald-700/60">
                Masukkan nomor HP pemilik untuk melihat atau menambahkan hewan peliharaan.
              </p>
            </div>
          </div>

          <form onSubmit={submit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="phone">Nomor HP</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="08123456789 atau +6281234567890"
                inputMode="tel"
                autoFocus
                required
              />
            </div>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
              <Search className="w-4 h-4" /> Cari
            </Button>
          </form>
        </div>
      </main>
    </div>
  )
}
