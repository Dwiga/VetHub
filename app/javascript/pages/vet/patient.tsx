import { useState } from "react"
import { router } from "@inertiajs/react"
import { format } from "date-fns"
import Header from "@/components/molecules/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { ChevronDownIcon, Phone, Plus, User as UserIcon, AlertCircle, Stethoscope } from "lucide-react"
import { PetType, GenderType } from "@/types/pet"
import { SpeciesType } from "@/types/species"

type OwnerSummary = {
  id: number
  name: string | null
  email: string | null
  phone_number: string
  address: string | null
} | null

type Props = {
  phone: string
  raw_phone?: string
  owner: OwnerSummary
  pets: PetType[]
  species: SpeciesType[]
  genders: GenderType[]
}

export default function VetPatient({ phone, raw_phone, owner, pets, species, genders }: Props) {
  const [name, setName] = useState("")
  const [speciesId, setSpeciesId] = useState("")
  const [gender, setGender] = useState("")
  const [color, setColor] = useState("")
  const [sterilized, setSterilized] = useState("")
  const [date, setDate] = useState<Date>()

  const submitNewPet = (e: React.FormEvent) => {
    e.preventDefault()
    router.post("/vet/patients/pets", {
      owner_phone: phone,
      pet: {
        name,
        species_id: speciesId,
        gender: gender ? Number(gender) : null,
        color,
        sterilized,
        birth_date: date ? format(date, "yyyy-MM-dd") : "",
      }
    }, {
      onSuccess: () => {
        setName(""); setSpeciesId(""); setGender(""); setColor(""); setSterilized(""); setDate(undefined)
      }
    })
  }

  return (
    <Sheet>
      <div className="min-h-screen bg-emerald-50/30">
        <Header />
        <main className="max-w-4xl mx-auto p-6">
          <div className="bg-white p-6 rounded-[2rem] border border-emerald-100 shadow-xl shadow-emerald-900/5 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-emerald-100 p-3 rounded-2xl">
                  <Phone className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-emerald-900/40 uppercase tracking-widest">Nomor HP</p>
                  <p className="font-black text-emerald-950 text-lg">{raw_phone || phone}</p>
                </div>
              </div>
              <Button variant="outline" onClick={() => router.get("/vet/lookup")}>
                Cari Pasien Lain
              </Button>
            </div>

            <div className="mt-6 pt-6 border-t border-emerald-50">
              {owner ? (
                <div className="flex items-center gap-4">
                  <div className="bg-emerald-600 p-3 rounded-2xl">
                    <UserIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-emerald-900/40 uppercase tracking-widest">Pemilik</p>
                    <p className="font-bold text-emerald-950">{owner.name || "(belum mengisi nama)"}</p>
                    {owner.address && <p className="text-sm text-emerald-700/70">{owner.address}</p>}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                  <div className="text-sm">
                    <p className="font-bold text-amber-900">Pemilik belum terdaftar</p>
                    <p className="text-amber-800/80">
                      Hewan yang Anda tambahkan akan otomatis terhubung saat pemilik dengan nomor HP ini mendaftar.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-emerald-950">
              Hewan Peliharaan ({pets.length})
            </h2>
            <SheetTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4" /> Tambah Hewan
              </Button>
            </SheetTrigger>
          </div>

          {pets.length === 0 ? (
            <div className="bg-white rounded-2xl border border-emerald-100 p-12 text-center text-emerald-700/60">
              Belum ada hewan peliharaan untuk nomor ini.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {pets.map((pet) => (
                <Card key={pet.id}>
                  <CardHeader>
                    <CardTitle>{pet.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>
                      <p>Spesies: {pet.species}</p>
                      <p>Jenis Kelamin: {pet.gender}</p>
                      <p>Umur: {pet.age}</p>
                      <p>Warna: {pet.color}</p>
                    </CardDescription>
                  </CardContent>
                  <CardFooter>
                    <Button disabled className="bg-emerald-600 hover:bg-emerald-700">
                      <Stethoscope className="w-4 h-4" /> Mulai Kunjungan
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>

      <SheetContent>
        <SheetHeader>
          <SheetTitle>Tambah Hewan</SheetTitle>
          <SheetDescription>
            Tambah hewan untuk nomor HP {raw_phone || phone}.
          </SheetDescription>
        </SheetHeader>
        <div className="grid flex-1 auto-rows-min gap-6 mt-5 ml-1 mr-1">
          <div className="grid gap-3">
            <Label htmlFor="pet-name">Nama Hewan</Label>
            <Input id="pet-name" placeholder="Contoh: Snowy" onChange={(e) => setName(e.target.value)} value={name} />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="pet-species">Spesies</Label>
            <Select onValueChange={setSpeciesId} value={speciesId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih spesies" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {species.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-3">
            <Label htmlFor="pet-birth-date">Tanggal Lahir</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  data-empty={!date}
                  className="w-full justify-between text-left font-normal data-[empty=true]:text-muted-foreground"
                >
                  {date ? format(date, "PPP") : <span>Pilih tanggal</span>}
                  <ChevronDownIcon />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={date} onSelect={setDate} defaultMonth={date} />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid gap-3">
            <Label htmlFor="pet-color">Warna</Label>
            <Input id="pet-color" placeholder="Contoh: Putih" onChange={(e) => setColor(e.target.value)} value={color} />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="pet-gender">Jenis Kelamin</Label>
            <Select onValueChange={setGender} value={gender}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih jenis kelamin" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {genders.map((g) => (
                    <SelectItem key={g.id} value={g.id.toString()}>{g.name}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-3">
            <Label htmlFor="pet-sterilized">Steril?</Label>
            <Select onValueChange={setSterilized} value={sterilized}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih status" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="0">Tidak</SelectItem>
                  <SelectItem value="1">Ya</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
        <SheetFooter className="mt-10">
          <Button onClick={submitNewPet} type="submit" className="bg-emerald-600">Simpan Hewan</Button>
          <SheetClose asChild>
            <Button variant="outline">Batal</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
