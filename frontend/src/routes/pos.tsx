import { createFileRoute } from '@tanstack/react-router'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/shared/PageHeader'
import { useGetMe, useListProducts, useCreateProductSale } from '@/lib/api-client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { useLang } from '@/contexts/LangContext'
import { Plus, Minus, ShoppingCart, Trash2, Package, Barcode } from 'lucide-react'

export const Route = createFileRoute('/pos')({
  component: POSPage,
})

interface CartItem {
  productId: number
  productName: string
  price: number
  quantity: number
}

const saleSchema = z.object({
  buyerName: z.string().optional(),
  buyerPhone: z.string().optional(),
  paymentAmount: z.string().min(1),
})

function POSPage() {
  const me = useGetMe()
  const { toast } = useToast()
  const { t } = useLang()
  const clinicId = me.data?.clinicId
  const products = useListProducts(clinicId ?? undefined)
  const createSale = useCreateProductSale()

  const [cart, setCart] = useState<CartItem[]>([])
  const [barcodeInput, setBarcodeInput] = useState('')
  const [checkoutOpen, setCheckoutOpen] = useState(false)

  const checkoutForm = useForm<z.infer<typeof saleSchema>>({
    resolver: zodResolver(saleSchema),
    defaultValues: { buyerName: '', buyerPhone: '', paymentAmount: '' },
  })

  const productList = products.data ?? []

  function addToCart(product: any) {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id)
      if (existing) {
        return prev.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, {
        productId: product.id,
        productName: product.name,
        price: parseFloat(product.price ?? '0'),
        quantity: 1,
      }]
    })
  }

  function removeFromCart(productId: number) {
    setCart(prev => {
      const existing = prev.find(item => item.productId === productId)
      if (existing && existing.quantity > 1) {
        return prev.map(item =>
          item.productId === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
      }
      return prev.filter(item => item.productId !== productId)
    })
  }

  function removeAllFromCart(productId: number) {
    setCart(prev => prev.filter(item => item.productId !== productId))
  }

  function handleBarcodeScan() {
    if (!barcodeInput.trim()) return
    const found = productList.find(p => p.barcode === barcodeInput.trim())
    if (found) {
      addToCart(found)
      setBarcodeInput('')
    } else {
      toast({ title: 'Product not found', description: `Barcode: ${barcodeInput}` })
    }
  }

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  async function completeSale(values: z.infer<typeof saleSchema>) {
    if (!clinicId) return
    if (cart.length === 0) return
    const paidAmount = parseFloat(values.paymentAmount || '0')
    await createSale.mutateAsync({
      data: {
        clinicId,
        buyerName: values.buyerName || null,
        buyerPhone: values.buyerPhone || null,
        total: String(cartTotal),
        paid: String(paidAmount),
        saleDate: new Date().toISOString().split('T')[0],
        items: cart.map(item => ({
          productId: item.productId,
          productName: item.productName,
          price: String(item.price),
          quantity: item.quantity,
          subtotal: String(item.price * item.quantity),
        })),
      },
    })
    setCart([])
    setCheckoutOpen(false)
    checkoutForm.reset()
    toast({ title: t('saleCompleted') })
  }

  const changeAmount = parseFloat(checkoutForm.watch('paymentAmount') || '0') - cartTotal

  return (
    <AppShell>
      <PageHeader title={t('posTitle')} />

      <div className="space-y-4">
        {/* Barcode scan */}
        <Card>
          <CardContent className="py-3">
            <div className="flex gap-2">
              <Input
                value={barcodeInput}
                onChange={e => setBarcodeInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleBarcodeScan() }}
                placeholder={t('scanBarcode')}
                className="flex-1"
              />
              <Button size="icon" variant="outline" onClick={handleBarcodeScan}>
                <Barcode className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Product grid */}
        <div>
          <h3 className="text-sm font-medium mb-2">{t('products')}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {productList.map(p => (
              <Card
                key={p.id}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => addToCart(p)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    <div className="h-7 w-7 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                      <Package className="h-3.5 w-3.5 text-primary/60" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Rp {parseFloat(p.price ?? '0').toLocaleString('id-ID')}
                      </p>
                      {p.stock != null && (
                        <div className="mt-0.5">
                          {p.stock <= 0 ? (
                            <Badge variant="destructive" className="text-[10px] px-1 py-0">{t('outOfStock')}</Badge>
                          ) : p.stock < 10 ? (
                            <Badge variant="secondary" className="text-[10px] px-1 py-0 text-orange-500">{t('lowStock')}: {p.stock}</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px] px-1 py-0">{t('stockLabel')} {p.stock}</Badge>
                          )}
                        </div>
                      )}
                      {p.barcode && <p className="text-[10px] text-muted-foreground truncate mt-0.5">#{p.barcode}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {productList.length === 0 && (
              <div className="col-span-full py-8 text-center">
                <Package className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{t('noProductsYet')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Cart summary */}
        {cart.length > 0 && (
          <Card className="sticky bottom-20 border-primary/30">
            <CardContent className="py-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  <span className="text-sm font-medium">{t('cart')} ({cart.reduce((s, i) => s + i.quantity, 0)})</span>
                </div>
                <span className="text-sm font-bold">Rp {cartTotal.toLocaleString('id-ID')}</span>
              </div>

              <div className="space-y-1 max-h-32 overflow-y-auto mb-2">
                {cart.map(item => (
                  <div key={item.productId} className="flex items-center justify-between text-xs py-1">
                    <div className="flex items-center gap-1 flex-1 min-w-0">
                      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => removeFromCart(item.productId)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-5 text-center">{item.quantity}</span>
                      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => addToCart({ id: item.productId, name: item.productName, price: String(item.price) })}>
                        <Plus className="h-3 w-3" />
                      </Button>
                      <span className="truncate">{item.productName}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-muted-foreground">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</span>
                      <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive" onClick={() => removeAllFromCart(item.productId)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Button className="w-full" onClick={() => { checkoutForm.reset({ buyerName: '', buyerPhone: '', paymentAmount: String(cartTotal) }); setCheckoutOpen(true) }}>
                {t('posCheckout')} · Rp {cartTotal.toLocaleString('id-ID')}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Checkout dialog */}
        <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>{t('completeSale')}</DialogTitle></DialogHeader>
            <div className="text-center py-2">
              <p className="text-2xl font-bold">Rp {cartTotal.toLocaleString('id-ID')}</p>
              <p className="text-sm text-muted-foreground">{cart.reduce((s, i) => s + i.quantity, 0)} items</p>
            </div>
            <Form {...checkoutForm}>
              <form onSubmit={checkoutForm.handleSubmit(completeSale)} className="space-y-3">
                <FormField control={checkoutForm.control} name="buyerName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('buyerName')}</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={checkoutForm.control} name="buyerPhone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('buyerPhone')}</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={checkoutForm.control} name="paymentAmount" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('paymentAmount')}</FormLabel>
                    <FormControl><Input type="number" min="0" {...field} /></FormControl>
                  </FormItem>
                )} />
                {parseFloat(checkoutForm.watch('paymentAmount') || '0') > 0 && (
                  <div className="text-sm">
                    {changeAmount >= 0 ? (
                      <p className="text-green-600">{t('changeAmount')}: Rp {changeAmount.toLocaleString('id-ID')}</p>
                    ) : (
                      <p className="text-red-500">Kurang: Rp {Math.abs(changeAmount).toLocaleString('id-ID')}</p>
                    )}
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={createSale.isPending || cart.length === 0}>
                  {createSale.isPending ? t('saving') : t('completeSale')}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  )
}
