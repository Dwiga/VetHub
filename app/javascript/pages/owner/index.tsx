import { useState } from 'react';
import { router } from '@inertiajs/react';

import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react'
import Header from '@/components/molecules/header';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SpeciesType } from "@/types/species";
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ChevronDownIcon } from "lucide-react"
import { format } from "date-fns"
import { PetType, GenderType } from "@/types/pet"
import { UserType } from '@/types/user';

export default function Owner({ pets, user, species, genders }: { pets: PetType[], user: UserType, species: SpeciesType[], genders: GenderType[] }) {
  const [date, setDate] = useState<Date>()
  const [name, setName] = useState<string>("")
  const [speciesId, setSpeciesId] = useState<string>("")
  const [gender, setGender] = useState<string>("")
  const [color, setColor] = useState<string>("")
  const [sterilized, setSterilized] = useState<string>("")

  const submitNewPet = (e: React.FormEvent) => {
    e.preventDefault()
    router.post(`/owner/${user.id}/pet`, {
      pet: {
        name,
        species_id: speciesId,
        gender: Number(gender),
        color,
        sterilized,
        birth_date: date ? format(date, "yyyy-MM-dd") : "",
      }
    }, {
      onSuccess: () => {
        setName("")
        setSpeciesId("")
        setGender("")
        setColor("")
        setSterilized("")
        setDate(undefined)
      }
    })
  }

  return (
    <Sheet>
      <div className='bg-mist-50'>
        <Header />
        <div className='pr-10 pl-10 pt-5'>
          <div className="grid lg:grid-cols-2 md:grid-cols-1 gap-3 pb-4">
            <div>
              <h1 className="text-4xl font-bold">Halo {user.name ? user.name : (<Button variant='link' className='text-blue-300 text-4xl font-bold'>User</Button>)}, selamat datang!</h1>
              <p>Berikut adalah daftar hewan peliharaan anda yang terkait dengan nomor hp {user.phone_number}</p>
            </div>
            <div className='flex items-end justify-end w-full'>
              <SheetTrigger asChild>
                <Button className='p-5 bg-teal-600 w-full lg:w-auto'><Plus/>Tambah Hewan</Button>
              </SheetTrigger>
            </div>
          </div>
          <div className='grid gap-4 md:grid-cols-3'>
            {pets.map((pet) => (
              <Card key={pet.id} className="w-full">
                <CardHeader>
                  <Button onClick={() => router.get(`/owner/${user.id}/pet/${pet.id}/details`)} variant="link"><CardTitle>{pet.name}</CardTitle></Button>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    <p>Spesies: {pet.species}</p>
                    <p>Jenis Kelamin: {pet.gender}</p>
                    <p>Tanggal Lahir: {pet.birth_date ? format(new Date(pet.birth_date), "PPP") : "Tidak diisi"}</p>
                    <p>Warna: {pet.color}</p>
                    <p>Disterilis: {pet.sterilized ? "Ya" : "Tidak"}</p>
                  </CardDescription>
                </CardContent>
                <CardFooter>
                  <Button onClick={() => router.get(`/owner/${user.id}/pet/${pet.id}/details`)} variant="link">Lihat Detail</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Tambah Hewan</SheetTitle>
          <SheetDescription>
            Lengkapi data di bawah ini untuk menambahkan hewan peliharaan baru.
          </SheetDescription>
        </SheetHeader>
        <div className="grid flex-1 auto-rows-min gap-6 mt-5 ml-1 mr-1">
          <div className="grid gap-3">
            <Label htmlFor="pet-name">Nama Hewan</Label>
            <Input id="pet-name" placeholder="Contoh: Snowy" onChange={e => setName(e.target.value)} value={name} />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="pet-species">Spesies</Label>
            <Select onValueChange={e => setSpeciesId(e)} value={speciesId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih spesies" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="-">Pilih spesies</SelectItem>
                  {species.map((species) => (
                    <SelectItem key={species.id} value={species.id.toString()}>{species.name}</SelectItem>
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
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                  <ChevronDownIcon />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  defaultMonth={date}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid gap-3">
            <Label htmlFor="pet-color">Warna</Label>
            <Input id="pet-color" placeholder="Contoh: Putih" onChange={e => setColor(e.target.value)} value={color} />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="pet-gender">Jenis Kelamin</Label>
            <Select onValueChange={e => setGender(e)} value={gender}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih jenis kelamin" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="-">Pilih jenis kelamin</SelectItem>
                  {genders.map((gender) => (
                    <SelectItem key={gender.id} value={gender.id.toString()}>{gender.name}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-3">
            <Label htmlFor="pet-sterilized">Steril?</Label>
            <Select onValueChange={e => setSterilized(e)} value={sterilized}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih status" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="-">Pilih status</SelectItem>
                  <SelectItem value="0">Tidak</SelectItem>
                  <SelectItem value="1">Ya</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
        <SheetFooter className="mt-10">
          <Button onClick={submitNewPet} type="submit" className="bg-teal-600">Simpan Hewan</Button>
          <SheetClose asChild>
            <Button variant="outline">Batal</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
