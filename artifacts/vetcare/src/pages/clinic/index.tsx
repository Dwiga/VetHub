import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  useGetMe, useGetMyClinic, useListStaff, useUpdateClinic, useInviteStaff, useRemoveStaff,
  useListProducts, useCreateProduct, useUpdateProduct, useDeleteProduct,
  getGetMyClinicQueryKey, getListStaffQueryKey, getListProductsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, User, Building2, Package, BarChart2 } from "lucide-react";
import { useLocation } from "wouter";

const clinicSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
});

const staffSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().optional(),
  phone: z.string().optional(),
});

const productSchema = z.object({
  name: z.string().min(1),
  category: z.string().optional(),
  description: z.string().optional(),
  price: z.string().min(1),
  stock: z.string().optional(),
  unit: z.string().optional(),
});

export default function ClinicPage() {
  const me = useGetMe();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const user = me.data;
  const clinicId = user?.clinicId;

  const clinic = useGetMyClinic({ query: { enabled: !!clinicId, queryKey: getGetMyClinicQueryKey() } });
  const staff = useListStaff(clinicId!, { query: { enabled: !!clinicId, queryKey: getListStaffQueryKey(clinicId!) } });
  const products = useListProducts(clinicId!, { query: { enabled: !!clinicId, queryKey: getListProductsQueryKey(clinicId!) } });

  const updateClinic = useUpdateClinic();
  const inviteStaff = useInviteStaff();
  const removeStaff = useRemoveStaff();
  const createProduct = useCreateProduct();
  const deleteProduct = useDeleteProduct();

  const [staffDialogOpen, setStaffDialogOpen] = useState(false);
  const [productDialogOpen, setProductDialogOpen] = useState(false);

  const clinicForm = useForm<z.infer<typeof clinicSchema>>({
    resolver: zodResolver(clinicSchema),
    values: {
      name: clinic.data?.name ?? "",
      address: clinic.data?.address ?? "",
      phone: clinic.data?.phone ?? "",
      email: clinic.data?.email ?? "",
    },
  });

  const staffForm = useForm<z.infer<typeof staffSchema>>({
    resolver: zodResolver(staffSchema),
    defaultValues: { name: "", email: "", phone: "" },
  });

  const productForm = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: "", category: "", description: "", price: "0", stock: "", unit: "" },
  });

  async function saveClinic(values: z.infer<typeof clinicSchema>) {
    if (!clinicId) return;
    await updateClinic.mutateAsync({ clinicId, data: values });
    queryClient.invalidateQueries({ queryKey: getGetMyClinicQueryKey() });
    toast({ title: "Clinic updated" });
  }

  async function addStaff(values: z.infer<typeof staffSchema>) {
    if (!clinicId) return;
    await inviteStaff.mutateAsync({ clinicId, data: values });
    queryClient.invalidateQueries({ queryKey: getListStaffQueryKey(clinicId) });
    setStaffDialogOpen(false);
    staffForm.reset();
    toast({ title: "Staff invited" });
  }

  async function deleteStaff(staffId: number) {
    if (!clinicId) return;
    await removeStaff.mutateAsync({ clinicId, staffId });
    queryClient.invalidateQueries({ queryKey: getListStaffQueryKey(clinicId) });
    toast({ title: "Staff removed" });
  }

  async function addProduct(values: z.infer<typeof productSchema>) {
    if (!clinicId) return;
    await createProduct.mutateAsync({
      clinicId,
      data: {
        name: values.name,
        category: values.category || undefined,
        description: values.description || undefined,
        price: parseFloat(values.price),
        stock: values.stock ? parseInt(values.stock) : undefined,
        unit: values.unit || undefined,
      },
    });
    queryClient.invalidateQueries({ queryKey: getListProductsQueryKey(clinicId) });
    setProductDialogOpen(false);
    productForm.reset();
    toast({ title: "Product added" });
  }

  async function removeProduct(productId: number) {
    await deleteProduct.mutateAsync({ productId });
    if (clinicId) queryClient.invalidateQueries({ queryKey: getListProductsQueryKey(clinicId) });
    toast({ title: "Product removed" });
  }

  if (!user?.isVetOwner && !me.isLoading) {
    return (
      <AppShell>
        <div className="pt-12 flex flex-col items-center gap-4">
          <Building2 className="h-16 w-16 text-muted-foreground/30" />
          <p className="text-muted-foreground text-center">You need to register a clinic first.</p>
          <Button asChild variant="outline" size="sm"><a href="/settings">Go to settings</a></Button>
        </div>
      </AppShell>
    );
  }

  const staffList = staff.data ?? [];
  const productList = products.data ?? [];

  return (
    <AppShell>
      <PageHeader title="Clinic management" />
      <Tabs defaultValue="profile" onValueChange={v => { if (v === "reports") navigate("/clinic/reports"); }}>
        <TabsList className="w-full mb-5">
          <TabsTrigger value="profile" className="flex-1" data-testid="tab-profile">Profile</TabsTrigger>
          <TabsTrigger value="staff" className="flex-1" data-testid="tab-staff">Staff</TabsTrigger>
          <TabsTrigger value="products" className="flex-1" data-testid="tab-products">Products</TabsTrigger>
          <TabsTrigger value="reports" className="flex-1" data-testid="tab-reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Clinic profile</CardTitle></CardHeader>
            <CardContent>
              <Form {...clinicForm}>
                <form onSubmit={clinicForm.handleSubmit(saveClinic)} className="space-y-4">
                  <FormField control={clinicForm.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Clinic name</FormLabel>
                      <FormControl><Input {...field} data-testid="input-clinic-name" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={clinicForm.control} name="address" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl><Input {...field} data-testid="input-address" /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={clinicForm.control} name="phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl><Input {...field} data-testid="input-phone" /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={clinicForm.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl><Input {...field} data-testid="input-email" /></FormControl>
                    </FormItem>
                  )} />
                  <Button type="submit" className="w-full" disabled={updateClinic.isPending} data-testid="btn-save-clinic">
                    {updateClinic.isPending ? "Saving..." : "Save changes"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{staffList.length} staff member{staffList.length !== 1 ? "s" : ""}</p>
            <Dialog open={staffDialogOpen} onOpenChange={setStaffDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" data-testid="btn-invite-staff">
                  <Plus className="h-4 w-4 mr-1" />Invite
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Invite staff</DialogTitle></DialogHeader>
                <Form {...staffForm}>
                  <form onSubmit={staffForm.handleSubmit(addStaff)} className="space-y-4 pt-2">
                    <FormField control={staffForm.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl><Input {...field} data-testid="input-staff-name" /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={staffForm.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl><Input {...field} type="email" data-testid="input-staff-email" /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={staffForm.control} name="phone" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl><Input {...field} data-testid="input-staff-phone" /></FormControl>
                      </FormItem>
                    )} />
                    <Button type="submit" className="w-full" disabled={inviteStaff.isPending} data-testid="btn-submit-staff">
                      {inviteStaff.isPending ? "Inviting..." : "Invite"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
          <div className="space-y-3">
            {staffList.map((s: any) => (
              <Card key={s.id} data-testid={`card-staff-${s.id}`}>
                <CardContent className="py-3 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-primary/60" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{s.name ?? "Unnamed"}</p>
                    <p className="text-xs text-muted-foreground">{s.email ?? s.phone ?? "—"}</p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive hover:bg-destructive/10 shrink-0"
                    onClick={() => deleteStaff(s.id)}
                    data-testid={`btn-remove-staff-${s.id}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </CardContent>
              </Card>
            ))}
            {staffList.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center">
                  <User className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No staff yet. Invite your first vet!</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{productList.length} product{productList.length !== 1 ? "s" : ""}</p>
            <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" data-testid="btn-add-product">
                  <Plus className="h-4 w-4 mr-1" />Add
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add product</DialogTitle></DialogHeader>
                <Form {...productForm}>
                  <form onSubmit={productForm.handleSubmit(addProduct)} className="space-y-4 pt-2">
                    <FormField control={productForm.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl><Input {...field} data-testid="input-product-name" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={productForm.control} name="category" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <FormControl><Input {...field} placeholder="e.g. Medicine, Service" data-testid="input-product-category" /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={productForm.control} name="price" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price (Rp)</FormLabel>
                        <FormControl><Input type="number" min="0" {...field} data-testid="input-product-price" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="flex gap-3">
                      <FormField control={productForm.control} name="stock" render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Stock</FormLabel>
                          <FormControl><Input type="number" min="0" {...field} data-testid="input-product-stock" /></FormControl>
                        </FormItem>
                      )} />
                      <FormField control={productForm.control} name="unit" render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Unit</FormLabel>
                          <FormControl><Input {...field} placeholder="e.g. tablet" data-testid="input-product-unit" /></FormControl>
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={productForm.control} name="description" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl><Textarea {...field} rows={2} data-testid="input-product-desc" /></FormControl>
                      </FormItem>
                    )} />
                    <Button type="submit" className="w-full" disabled={createProduct.isPending} data-testid="btn-submit-product">
                      {createProduct.isPending ? "Adding..." : "Add product"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
          <div className="space-y-3">
            {productList.map((p: any) => (
              <Card key={p.id} data-testid={`card-product-${p.id}`}>
                <CardContent className="py-3 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                    <Package className="h-4 w-4 text-primary/60" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm" data-testid={`text-product-name-${p.id}`}>{p.name}</p>
                      {p.category && <Badge variant="outline" className="text-xs">{p.category}</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Rp {(p.price ?? 0).toLocaleString("id-ID")}
                      {p.stock != null ? ` · Stock: ${p.stock} ${p.unit ?? ""}` : ""}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive hover:bg-destructive/10 shrink-0"
                    onClick={() => removeProduct(p.id)}
                    data-testid={`btn-delete-product-${p.id}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </CardContent>
              </Card>
            ))}
            {productList.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center">
                  <Package className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No products yet</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
