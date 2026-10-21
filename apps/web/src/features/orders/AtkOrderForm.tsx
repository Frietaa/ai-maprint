import { ORDER_LIMITS, type ProductDto } from '@maba-printing/shared'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { TextAreaField } from '../../components/ui/FormControls.tsx'
import { ApiError } from '../../lib/api-client.ts'
import { formatRupiah } from '../../lib/format-price.ts'
import { productsQueryKey, useProducts } from '../products/use-products.ts'
import { CustomerFields } from './CustomerFields.tsx'
import {
  type CustomerFormValues,
  emptyCustomerValues,
} from './customer-form.ts'
import { OrderFormFrame } from './OrderFormFrame.tsx'
import { optionalText, toCustomerInput } from './order-request.ts'
import { validateLongText } from './order-validation.ts'
import { useSubmitOrder } from './use-orders.ts'

interface AtkValues extends CustomerFormValues {
  description: string
}

function clampQuantity(raw: string): number {
  const value = Math.trunc(Number(raw))
  if (!Number.isFinite(value) || value < 0) return 0
  return Math.min(value, ORDER_LIMITS.atkMaxQuantity)
}

// ATK purchase request: a light selection of AVAILABLE products with
// quantities — no cart, checkout or payment. Prices shown are the current
// catalog prices; the API recalculates the authoritative total.
export function AtkOrderForm() {
  const products = useProducts()
  const queryClient = useQueryClient()
  const form = useForm<AtkValues>({
    defaultValues: { ...emptyCustomerValues, description: '' },
  })
  const submit = useSubmitOrder()
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [formError, setFormError] = useState<string | null>(null)

  const available = (products.data ?? []).filter(
    (product) => product.availability === 'AVAILABLE',
  )
  const unavailable = (products.data ?? []).filter(
    (product) => product.availability === 'UNAVAILABLE',
  )
  const selected = available
    .map((product) => ({ product, quantity: quantities[product.id] ?? 0 }))
    .filter((line) => line.quantity > 0)
  const estimate = selected.reduce(
    (sum, line) => sum + line.product.price * line.quantity,
    0,
  )

  const onSubmit = form.handleSubmit((values) => {
    if (submit.isPending) return
    if (selected.length === 0) {
      setFormError('Pilih minimal satu produk dan jumlahnya.')
      return
    }
    if (selected.length > ORDER_LIMITS.atkMaxItems) {
      setFormError(
        `Maksimal ${ORDER_LIMITS.atkMaxItems} jenis produk per permintaan.`,
      )
      return
    }
    setFormError(null)
    submit.mutate(
      {
        order: {
          type: 'ATK',
          ...toCustomerInput(values),
          description: optionalText(values.description),
          items: selected.map((line) => ({
            productId: line.product.id,
            quantity: line.quantity,
          })),
        },
      },
      {
        onError: (error) => {
          // A product became unavailable meanwhile: show the current state.
          if (error instanceof ApiError && error.status === 409) {
            void queryClient.invalidateQueries({ queryKey: productsQueryKey })
          }
        },
      },
    )
  })

  return (
    <FormProvider {...form}>
      <OrderFormFrame
        id="pesan-atk"
        title="Ajukan pembelian ATK"
        intro="Pilih produk yang tersedia dan jumlahnya. Kami akan mengonfirmasi ketersediaan dan total pesanan Anda."
        onSubmit={(event) => void onSubmit(event)}
        pending={submit.isPending}
        error={submit.error}
        formError={formError}
        receipt={submit.data}
        onNewRequest={() => {
          submit.reset()
          form.reset()
          setQuantities({})
        }}
      >
        <fieldset className="space-y-3">
          <legend className="text-base font-semibold text-slate-900">
            Produk
          </legend>
          {products.isPending ? (
            <p role="status" className="text-sm text-slate-600">
              Memuat produk…
            </p>
          ) : available.length === 0 ? (
            <p className="text-sm text-slate-600">
              Belum ada produk yang dapat dipesan saat ini.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
              {available.map((product) => (
                <QuantityRow
                  key={product.id}
                  product={product}
                  quantity={quantities[product.id] ?? 0}
                  onChange={(quantity) =>
                    setQuantities((current) => ({
                      ...current,
                      [product.id]: quantity,
                    }))
                  }
                />
              ))}
            </ul>
          )}
          {unavailable.length > 0 ? (
            <p className="text-sm text-slate-600">
              Sementara belum dapat dipesan (stok kosong):{' '}
              {unavailable.map((product) => product.name).join(', ')}.
            </p>
          ) : null}
          <p className="text-sm font-medium text-slate-900" aria-live="polite">
            Perkiraan total: {formatRupiah(estimate)}
          </p>
        </fieldset>
        <CustomerFields
          completionRequired={false}
          completionLabel="Waktu pengambilan yang diinginkan (WIB)"
        />
        <TextAreaField
          label="Catatan"
          optional
          rows={3}
          error={form.formState.errors.description?.message}
          {...form.register('description', {
            validate: (value) =>
              validateLongText(value, { required: false, label: 'Catatan' }),
          })}
        />
      </OrderFormFrame>
    </FormProvider>
  )
}

function QuantityRow({
  product,
  quantity,
  onChange,
}: {
  product: ProductDto
  quantity: number
  onChange: (quantity: number) => void
}) {
  const id = `jumlah-${product.id}`
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <label htmlFor={id} className="min-w-0 flex-1 text-sm">
        <span className="font-medium text-slate-900">{product.name}</span>
        <span className="block text-slate-600">
          {formatRupiah(product.price)}
        </span>
      </label>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={0}
        max={ORDER_LIMITS.atkMaxQuantity}
        step={1}
        value={quantity}
        onChange={(event) => onChange(clampQuantity(event.target.value))}
        className="min-h-11 w-24 rounded-lg border border-slate-300 px-3 text-base"
      />
    </li>
  )
}
