import { ORDER_LIMITS } from '@maba-printing/shared'
import { FormProvider, useForm } from 'react-hook-form'
import {
  CheckboxField,
  TextAreaField,
} from '../../components/ui/FormControls.tsx'
import { TextField } from '../../components/ui/TextField.tsx'
import { CustomerFields } from './CustomerFields.tsx'
import {
  type CustomerFormValues,
  emptyCustomerValues,
} from './customer-form.ts'
import { OrderFormFrame } from './OrderFormFrame.tsx'
import { optionalText, toCustomerInput } from './order-request.ts'
import { validateLongText } from './order-validation.ts'
import { useSubmitOrder } from './use-orders.ts'

interface SoftwareValues extends CustomerFormValues {
  softwareName: string
  requirements: string
  licenseAcknowledged: boolean
}

// Software installation request (PRD §12): legal software only.
export function SoftwareOrderForm() {
  const form = useForm<SoftwareValues>({
    defaultValues: {
      ...emptyCustomerValues,
      softwareName: '',
      requirements: '',
      licenseAcknowledged: false,
    },
  })
  const submit = useSubmitOrder()
  const errors = form.formState.errors

  const onSubmit = form.handleSubmit((values) => {
    if (submit.isPending) return
    submit.mutate({
      order: {
        type: 'SOFTWARE_INSTALLATION',
        ...toCustomerInput(values),
        softwareName: values.softwareName,
        requirements: optionalText(values.requirements),
        licenseAcknowledged: values.licenseAcknowledged,
      },
    })
  })

  return (
    <FormProvider {...form}>
      <OrderFormFrame
        id="pesan-software"
        title="Ajukan instalasi software"
        intro="MABA PRINTING hanya membantu memasang software berlisensi sah, gratis (freeware), atau open-source. Lisensi software tetap menjadi tanggung jawab Anda."
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
            Software yang dibutuhkan
          </legend>
          <TextField
            label="Nama software"
            hint="Misalnya: LibreOffice, Microsoft Office (lisensi milik Anda), atau Python."
            error={errors.softwareName?.message}
            {...form.register('softwareName', {
              validate: (value) => {
                const text = value.trim()
                if (text === '') return 'Nama software wajib diisi.'
                if (text.length > ORDER_LIMITS.softwareNameMaxLength) {
                  return `Nama software maksimal ${ORDER_LIMITS.softwareNameMaxLength} karakter.`
                }
                return true
              },
            })}
          />
          <TextAreaField
            label="Kebutuhan & catatan"
            optional
            hint="Versi, bahasa, perangkat, atau keterangan lisensi Anda."
            error={errors.requirements?.message}
            {...form.register('requirements', {
              validate: (value) =>
                validateLongText(value, {
                  required: false,
                  label: 'Kebutuhan & catatan',
                }),
            })}
          />
          <CheckboxField
            label="Saya menyatakan software yang diminta berlisensi sah, gratis, atau open-source, dan saya bertanggung jawab atas lisensinya."
            error={errors.licenseAcknowledged?.message}
            {...form.register('licenseAcknowledged', {
              validate: (value) =>
                value || 'Centang pernyataan lisensi untuk melanjutkan.',
            })}
          />
        </fieldset>
        <CustomerFields completionRequired />
      </OrderFormFrame>
    </FormProvider>
  )
}
