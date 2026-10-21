import {
  HANDOVER_METHOD_LABELS,
  HANDOVER_METHODS,
  type HandoverMethod,
  ORDER_LIMITS,
} from '@maba-printing/shared'
import { FormProvider, useForm, useWatch } from 'react-hook-form'
import { TextAreaField } from '../../components/ui/FormControls.tsx'
import { TextField } from '../../components/ui/TextField.tsx'
import { nowAsWibInput, wibInputToIso } from '../../lib/format-datetime.ts'
import { CustomerFields } from './CustomerFields.tsx'
import {
  type CustomerFormValues,
  emptyCustomerValues,
} from './customer-form.ts'
import { OrderFormFrame } from './OrderFormFrame.tsx'
import { optionalText, toCustomerInput } from './order-request.ts'
import { validateFutureWib, validateLongText } from './order-validation.ts'
import { useSubmitOrder } from './use-orders.ts'

interface LaptopValues extends CustomerFormValues {
  complaint: string
  handoverMethod: HandoverMethod
  handoverAt: string
  pickupAddress: string
}

// Laptop service request (PRD §11). Distance and pickup fee are confirmed
// later by our team — the customer never enters them.
export function LaptopServiceOrderForm() {
  const form = useForm<LaptopValues>({
    defaultValues: {
      ...emptyCustomerValues,
      complaint: '',
      handoverMethod: 'DROP_OFF',
      handoverAt: '',
      pickupAddress: '',
    },
  })
  const submit = useSubmitOrder()
  const method = useWatch({ control: form.control, name: 'handoverMethod' })
  const errors = form.formState.errors

  const onSubmit = form.handleSubmit((values) => {
    if (submit.isPending) return
    submit.mutate({
      order: {
        type: 'LAPTOP_SERVICE',
        ...toCustomerInput(values),
        complaint: values.complaint,
        handoverMethod: values.handoverMethod,
        handoverAt: wibInputToIso(values.handoverAt),
        pickupAddress:
          values.handoverMethod === 'PICKUP'
            ? optionalText(values.pickupAddress)
            : null,
      },
    })
  })

  return (
    <FormProvider {...form}>
      <OrderFormFrame
        id="pesan-laptop"
        title="Ajukan service laptop"
        intro="Ceritakan keluhan laptop Anda dan pilih cara penyerahan. Kami akan menghubungi Anda untuk konfirmasi dan biaya."
        onSubmit={(event) => void onSubmit(event)}
        pending={submit.isPending}
        error={submit.error}
        receipt={submit.data}
        onNewRequest={() => {
          submit.reset()
          form.reset()
        }}
      >
        <fieldset className="space-y-4">
          <legend className="text-base font-semibold text-slate-900">
            Keluhan &amp; penyerahan
          </legend>
          <TextAreaField
            label="Keluhan"
            hint="Misalnya: laptop tidak menyala, layar bergaris, atau sangat lambat."
            error={errors.complaint?.message}
            {...form.register('complaint', {
              validate: (value) =>
                validateLongText(value, { required: true, label: 'Keluhan' }),
            })}
          />
          <div
            role="radiogroup"
            aria-labelledby="cara-penyerahan"
            className="space-y-2"
          >
            <p
              id="cara-penyerahan"
              className="text-sm font-medium text-slate-800"
            >
              Cara penyerahan
            </p>
            {HANDOVER_METHODS.map((value) => (
              <label
                key={value}
                className="flex min-h-11 items-center gap-3 text-sm text-slate-800"
              >
                <input
                  type="radio"
                  value={value}
                  className="size-5 accent-brand-600"
                  {...form.register('handoverMethod')}
                />
                {HANDOVER_METHOD_LABELS[value]}
              </label>
            ))}
          </div>
          {method === 'PICKUP' ? (
            <>
              <TextAreaField
                label="Alamat penjemputan"
                rows={3}
                autoComplete="street-address"
                hint="Biaya penjemputan: gratis hingga 5 km; selebihnya Rp2.000 per km tambahan. Jarak dan biaya dikonfirmasi oleh tim kami."
                error={errors.pickupAddress?.message}
                {...form.register('pickupAddress', {
                  validate: (value) => {
                    const text = value.trim()
                    if (text === '') return 'Alamat penjemputan wajib diisi.'
                    if (text.length > ORDER_LIMITS.pickupAddressMaxLength) {
                      return `Alamat maksimal ${ORDER_LIMITS.pickupAddressMaxLength} karakter.`
                    }
                    return true
                  },
                })}
              />
            </>
          ) : null}
          <TextField
            label={
              method === 'PICKUP'
                ? 'Waktu penjemputan (WIB)'
                : 'Waktu antar ke lokasi (WIB)'
            }
            type="datetime-local"
            min={nowAsWibInput()}
            optional
            error={errors.handoverAt?.message}
            {...form.register('handoverAt', {
              validate: (value) =>
                validateFutureWib(value, { required: false }),
            })}
          />
        </fieldset>
        <CustomerFields completionRequired />
      </OrderFormFrame>
    </FormProvider>
  )
}
