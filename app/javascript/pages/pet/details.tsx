import { useState, useEffect, use } from "react";
import Header from "@/components/molecules/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { router } from "@inertiajs/react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { PetType, SpeciesType } from "@/types/pet";
import Timeline, { TimelineEvent } from "@/components/organisms/timeline";
import { CheckCircle2, Stethoscope, BedDouble, HandMetal } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePage } from "@inertiajs/react";
import { PropsType } from "@/types/props";
import { set } from "date-fns";

export default function PetDetails({
  pet,
  weights,
  temperatures,
  monitor,
  species,
}: {
  pet: PetType;
  weights: any[];
  temperatures: any[];
  monitor: { label: string; value: string }[];
  species: SpeciesType[];
}) {
  const props = usePage().props;
  const { auth } = usePage<PropsType>().props;
  const events: TimelineEvent[] = [
    {
      status: "Rawat Jalan",
      date: "02/04/2026 09:00",
      icon: <Stethoscope size={16} />,
      color: "#0D9488",
      description: "Pemeriksaan rutin dan vaksinasi oleh drh. Budi.",
      content: (
        <div className="space-y-2">
          <div className="flex justify-between text-[13px]">
            <span className="text-gray-500 italic">Vaksinasi Rabies</span>
            <span className="font-medium text-gray-700">Rp 150.000</span>
          </div>
          <div className="flex justify-between text-[13px]">
            <span className="text-gray-500 italic">Pembersihan Telinga</span>
            <span className="font-medium text-gray-700">Rp 50.000</span>
          </div>
          <div className="pt-1 border-t border-gray-200 flex justify-between font-bold text-teal-700">
            <span>Total Biaya</span>
            <span>Rp 200.000</span>
          </div>
        </div>
      ),
      onDetailsClick: () => console.log("Details rawat jalan"),
    },
    {
      status: "Rawat Inap",
      date: "28/03/2026 - 31/03/2026",
      icon: <BedDouble size={16} />,
      color: "#7C3AED",
      description: "Observasi pasca operasi selama 3 hari.",
      content: (
        <div className="space-y-2">
          <ul className="list-disc list-inside text-[12px] text-gray-500 space-y-1">
            <li>Hari 1: Kondisi stabil, observasi luka</li>
            <li>Hari 2: Nafsu makan membaik, suhu normal</li>
            <li>Hari 3: Pemulihan sangat baik, siap pulang</li>
          </ul>
          <div className="pt-1 border-t border-gray-200 flex justify-between font-bold text-purple-700">
            <span>Total Biaya (3 Hari)</span>
            <span>Rp 1.500.000</span>
          </div>
        </div>
      ),
      onDetailsClick: () => console.log("Details rawat inap"),
    },
    {
      status: "Check-up Selesai",
      date: "16/10/2020 10:00",
      icon: <CheckCircle2 size={16} />,
      color: "#607D8B",
      description: "Semua proses medis telah selesai.",
    },
  ];

  const [type, setType] = useState("");
  const [result, setResult] = useState("");
  const [reactiveWeights, setReactiveWeights] = useState<any[]>([]);
  const [reactiveTemperature, setReactiveTemperature] = useState<any[]>([]);

  useEffect(() => {
    setReactiveTemperature(temperatures);
    setReactiveWeights(weights);
  }, []);

  const saveMonitoring = async () => {
    const csrfToken = document.head.querySelector(
      'meta[name="csrf-token"]',
    )?.content;

    const response = await fetch(
      `/owner/${auth.user.id}/pet/${pet.id}/monitoring`,
      {
        method: "POST",
        headers: {
          "X-CSRF-TOKEN": csrfToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type, result }),
      },
    );
    const data = await response.json();
    if (data.type === 1) {
      setReactiveTemperature(data.monitoring);
    } else if (data.type === 0) {
      setReactiveWeights(data.monitoring);
    }
  };

  const [petData, setPetData] = useState(pet);

  const handlePetUpdate = () => {
    router.patch(`/owner/${auth.user.id}/pet/${pet.id}`, { pet: petData });
  };

  return (
    <div className="bg-mist-50">
      <Header />
      <div className="container mt-5 flex flex-col gap-5">
        <Sheet>
          <Card className="relative mx-auto w-full max-w-sm pt-0">
            <img
              src="https://avatar.vercel.sh/shadcn1"
              alt="Pet cover"
              className="relative z-20 aspect-video w-full object-cover"
            />
            <CardHeader>
              <CardTitle>{pet.name}</CardTitle>
              <CardDescription>
                {pet.name} adalah {pet.species} berumur {pet.age}
              </CardDescription>
            </CardHeader>
            <CardAction>
              <Badge variant="secondary" className="ml-2">
                {pet.gender}
              </Badge>
              <Badge variant="secondary" className="ml-2">
                {pet.age}
              </Badge>
              <Badge variant="secondary" className="ml-2">
                {pet.weight || "0"} kg
              </Badge>
            </CardAction>
            <CardFooter>
              <SheetTrigger asChild>
                <Button className="w-full">Ubah data peliharaan</Button>
              </SheetTrigger>
            </CardFooter>
          </Card>

          <SheetContent>
            <SheetHeader>
              <SheetTitle>Ubah Data Peliharaan</SheetTitle>
              <SheetDescription>
                Ubah informasi mengenai {pet.name} di bawah ini.
              </SheetDescription>
            </SheetHeader>
            <div className="grid flex-1 auto-rows-min gap-6 mt-5 ml-1 mr-1">
              <div className="grid gap-3">
                <Label htmlFor="pet-name">Nama</Label>
                <Input
                  id="pet-name"
                  value={petData.name}
                  onChange={(e) =>
                    setPetData({ ...petData, name: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="pet-species">Spesies</Label>
                <Select
                  onValueChange={(value) =>
                    setPetData({ ...petData, species_id: parseInt(value) })
                  }
                  value={String(petData.species_id)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Spesies" />
                  </SelectTrigger>
                  <SelectContent>
                    {species.map((s) => (
                      <SelectItem key={s.value} value={String(s.value)}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-3">
                <Label htmlFor="pet-birthdate">Tanggal Lahir</Label>
                <Input
                  id="pet-birthdate"
                  type="date"
                  value={petData.birth_date}
                  onChange={(e) =>
                    setPetData({ ...petData, birth_date: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="pet-gender">Kelamin</Label>
                <Select
                  onValueChange={(value) =>
                    setPetData({ ...petData, gender: value })
                  }
                  value={petData.gender}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Kelamin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Jantan</SelectItem>
                    <SelectItem value="female">Betina</SelectItem>
                    <SelectItem value="unknown">Tidak Diketahui</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-3">
                <Label htmlFor="pet-color">Warna</Label>
                <Input
                  id="pet-color"
                  value={petData.color}
                  onChange={(e) =>
                    setPetData({ ...petData, color: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="pet-sterilized"
                    checked={petData.sterilized}
                    onChange={(e) =>
                      setPetData({ ...petData, sterilized: e.target.checked })
                    }
                  />
                  <Label htmlFor="pet-sterilized">Sudah Steril</Label>
                </div>
              </div>
            </div>
            <SheetFooter className="mt-10">
              <Button
                onClick={handlePetUpdate}
                type="submit"
                className="bg-teal-600"
              >
                Simpan Perubahan
              </Button>
              <SheetClose asChild>
                <Button variant="outline">Batal</Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        <Sheet>
          <Card size="sm" className="mx-auto w-full max-w-sm">
            <CardHeader>
              <CardTitle>Data berat</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer>
                  <AreaChart
                    data={reactiveWeights}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#8884d8"
                      fill="#8884d8"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
            <CardFooter>
              <SheetTrigger asChild>
                <Button className="w-full">Tambah data berat</Button>
              </SheetTrigger>
            </CardFooter>
          </Card>

          <Card size="sm" className="mx-auto w-full max-w-sm">
            <CardHeader>
              <CardTitle>Data Suhu</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer>
                  <AreaChart
                    data={reactiveTemperature}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#82ca9d"
                      fill="#82ca9d"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
            <CardFooter>
              <SheetTrigger asChild>
                <Button className="w-full">Tambah data suhu</Button>
              </SheetTrigger>
            </CardFooter>
          </Card>

          <SheetContent>
            <SheetHeader>
              <SheetTitle>Tambah Data Monitoring</SheetTitle>
              <SheetDescription>
                Pilih jenis data dan masukkan hasilnya untuk disimpan.
              </SheetDescription>
            </SheetHeader>
            <div className="grid flex-1 auto-rows-min gap-6 mt-5 ml-1 mr-1">
              <div className="grid gap-3">
                <Label htmlFor="monitoring-type">Tipe</Label>
                <Select onValueChange={(e) => setType(e)} value={type}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih tipe monitoring" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {monitor.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-3">
                <Label htmlFor="pet-result">Hasil</Label>
                <Input
                  id="pet-result"
                  placeholder="Contoh: 34.5"
                  onChange={(e) => setResult(e.target.value)}
                  value={result}
                />
              </div>
            </div>
            <SheetFooter className="mt-10">
              <Button
                onClick={saveMonitoring}
                type="submit"
                className="bg-teal-600"
              >
                Simpan monitoring
              </Button>
              <SheetClose asChild>
                <Button variant="outline">Batal</Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        <Card size="sm" className="mx-auto w-full max-w-sm">
          <CardHeader>
            <CardTitle>Riwayat</CardTitle>
          </CardHeader>
          <CardContent>
            <Timeline events={events} />
          </CardContent>
          <CardFooter>
            <Button className="w-full">Tambah data perawatan rutin</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
