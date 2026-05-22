import Header from "@/components/molecules/header"
import { PropsType } from '@/types/props';
import { usePage, router } from '@inertiajs/react'
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useForm } from "@tanstack/react-form"

export default function NewVet() {
  const { auth } = usePage<PropsType>().props
  const form = useForm({
    defaultValues: {
      name: "",
      phone: auth.user?.phone_number || "",
      address: auth.user?.address || "",
      email: auth.user?.email || "",
    },
    onSubmit: async ({ value }) => {
      router.post("/vet", { vet: value })
    },
  })

  return (
    <div>
      <Header />
      <div className="w-full max-w-md pl-4 pr-4">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
        >
          <FieldGroup>
            <FieldSet>
              <FieldLegend>Pendaftaran vet</FieldLegend>
              <FieldDescription>
                Jika anda mempunyai vet, daftarkan disini agar bisa me-manage hewan peliharaan dari owner lain.
              </FieldDescription>
              <FieldGroup>
                <form.Field
                  name="name"
                  children={(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>
                        Nama vet
                      </FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Rumah Purrnama"
                        required
                      />
                    </Field>
                  )}
                />
                <form.Field
                  name="phone"
                  children={(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>
                        Nomor hp
                      </FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="+6281234567890"
                        required
                      />
                      <FieldDescription>
                        Masuka nomor hp anda.
                      </FieldDescription>
                    </Field>
                  )}
                />
                <form.Field
                  name="address"
                  children={(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>
                        Alamat vet
                      </FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Jalan Purrnama, Kota Purrnama, Indonesia"
                        required
                      />
                      <FieldDescription>
                        Masuka alamat vet anda.
                      </FieldDescription>
                    </Field>
                  )}
                />
                <form.Field
                  name="email"
                  children={(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>
                        Email
                      </FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="email@example.com"
                      />
                      <FieldDescription>
                        Masuka email anda.
                      </FieldDescription>
                    </Field>
                  )}
                />
              </FieldGroup>
            </FieldSet>
            <FieldSeparator />
            <FieldSet>
              <FieldDescription>
                Anda akan menjadi admin dari vet ini.
              </FieldDescription>
            </FieldSet>
            <Field orientation="horizontal">
              <Button type="submit">Submit</Button>
              <Button
                variant="outline"
                type="button"
                onClick={() => window.history.back()}
              >
                Cancel
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </div>
    </div>
  )
}
