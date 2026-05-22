import {
  Bell,
  Settings,
  User,
  LogOut,
  Briefcase,
  UserCircle,
  Heart,
  Check,
  IdCardLanyard,
  Toolbox,
  ListTodo,
  ChartNoAxesCombined,
} from "lucide-react";
import { router } from "@inertiajs/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/atoms/dropdown-menu";
import { usePage } from "@inertiajs/react";
import { PropsType } from "@/types/props";

export default function Header() {
  const { auth, app_mode } = usePage<PropsType>().props;

  if (!auth) return null;

  const handleSignOut = () => {
    router.delete("/users/sign_out");
  };

  const setMode = (mode: "pet" | "vet") => {
    document.cookie = `app_mode=${mode}; path=/; max-age=${60 * 60 * 24 * 365}`; // 1 year
    if (mode === "vet") {
      router.get("/vet");
    } else {
      router.get("/owner");
    }
  };

  return (
    <header className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-md shadow-sm border-b border-emerald-50 sticky top-0 z-40">
      <div
        className="text-2xl font-black text-emerald-600 cursor-pointer tracking-tighter"
        onClick={() => router.get("/")}
      >
        PetMedic
      </div>
      <div className="flex items-center space-x-4">
        <Bell className="w-5 h-5 text-emerald-900/40 cursor-pointer hover:text-emerald-600 transition-colors" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Settings className="w-5 h-5 text-emerald-900/40 cursor-pointer hover:text-emerald-600 transition-colors" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-64 p-2 rounded-[1.5rem] border-emerald-100 shadow-2xl shadow-emerald-900/10"
          >
            <DropdownMenuLabel className="px-4 py-3 text-emerald-950 font-black text-lg">
              Pengaturan vet
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-emerald-50" />
            <DropdownMenuItem
              onClick={() => router.get(`/vet/${auth.user.vet_id}/employees`)}
              className="cursor-pointer px-4 py-3 rounded-xl hover:bg-emerald-50 focus:bg-emerald-50 text-emerald-900 font-medium"
            >
              <IdCardLanyard className="mr-3 h-5 w-5 text-emerald-600" />
              <span>Pegawai</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer px-4 py-3 rounded-xl hover:bg-emerald-50 focus:bg-emerald-50 text-emerald-900 font-medium">
              <Toolbox className="mr-3 h-5 w-5 text-emerald-600" />
              <span>Pelayanan</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer px-4 py-3 rounded-xl hover:bg-emerald-50 focus:bg-emerald-50 text-emerald-900 font-medium">
              <ListTodo className="mr-3 h-5 w-5 text-emerald-600" />
              <span>Stock</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer px-4 py-3 rounded-xl hover:bg-emerald-50 focus:bg-emerald-50 text-emerald-900 font-medium">
              <ChartNoAxesCombined className="mr-3 h-5 w-5 text-emerald-600" />
              <span>Report</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="p-1 rounded-2xl hover:bg-emerald-50 cursor-pointer transition-all border border-transparent hover:border-emerald-100">
              <User className="w-6 h-6 text-emerald-900/60" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-64 p-2 rounded-[1.5rem] border-emerald-100 shadow-2xl shadow-emerald-900/10"
          >
            <DropdownMenuLabel className="px-4 py-3 text-emerald-950 font-black text-lg">
              Akun Saya
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-emerald-50" />
            <DropdownMenuItem className="cursor-pointer px-4 py-3 rounded-xl hover:bg-emerald-50 focus:bg-emerald-50 text-emerald-900 font-medium">
              <UserCircle className="mr-3 h-5 w-5 text-emerald-600" />
              <span>Profil</span>
            </DropdownMenuItem>

            {/* Mode Switchers */}
            <DropdownMenuSeparator className="bg-emerald-50" />
            <div className="px-4 py-2">
              <span className="text-[10px] font-black text-emerald-900/30 uppercase tracking-[0.2em]">
                Pilih Mode
              </span>
            </div>

            <DropdownMenuItem
              onClick={() => setMode("pet")}
              className={`cursor-pointer px-4 py-3 rounded-xl mb-1 flex justify-between items-center transition-all ${app_mode === "pet" ? "bg-emerald-50 text-emerald-700 font-bold" : "hover:bg-emerald-50 text-emerald-900 font-medium"}`}
            >
              <div className="flex items-center">
                <Heart
                  className={`mr-3 h-5 w-5 ${app_mode === "pet" ? "text-emerald-600" : "text-emerald-400"}`}
                />
                <span>Pet Mode</span>
              </div>
              {app_mode === "pet" && (
                <Check className="h-5 w-5 text-emerald-600" />
              )}
            </DropdownMenuItem>

            {auth.user.vet_id ? (
              <DropdownMenuItem
                onClick={() => setMode("vet")}
                className={`cursor-pointer px-4 py-3 rounded-xl flex justify-between items-center transition-all ${app_mode === "vet" ? "bg-emerald-50 text-emerald-700 font-bold" : "hover:bg-emerald-50 text-emerald-900 font-medium"}`}
              >
                <div className="flex items-center">
                  <Briefcase
                    className={`mr-3 h-5 w-5 ${app_mode === "vet" ? "text-emerald-600" : "text-emerald-400"}`}
                  />
                  <span>Vet Mode</span>
                </div>
                {app_mode === "vet" && (
                  <Check className="h-5 w-5 text-emerald-600" />
                )}
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onClick={() => router.get("/vet/new")}
                className="cursor-pointer px-4 py-3 rounded-xl hover:bg-emerald-50 text-emerald-900 font-medium"
              >
                <Briefcase className="mr-3 h-5 w-5 text-emerald-400" />
                <span>Registrasi sebagai vet</span>
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator className="bg-emerald-50" />
            <DropdownMenuItem
              className="cursor-pointer px-4 py-3 rounded-xl text-red-600 font-bold hover:bg-red-50 focus:bg-red-50"
              onClick={handleSignOut}
            >
              <LogOut className="mr-3 h-5 w-5" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
