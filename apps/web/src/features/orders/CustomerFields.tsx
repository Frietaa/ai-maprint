import { useEffect } from 'react'
import { useFormContext } from 'react-hook-form'
import { SelectField } from '../../components/ui/FormControls.tsx'
import { TextField } from '../../components/ui/TextField.tsx'
import { nowAsWibInput } from '../../lib/format-datetime.ts'
import { useProfile } from '../account/use-profile.ts'
import { useCurrentUser } from '../auth/use-auth.ts'
import { useLocations } from '../locations/use-locations.ts'
import type { CustomerFormValues } from './customer-form.ts'
import {
  validateCustomerName,
  validateCustomerWhatsapp,
  validateFutureWib,
  validateOptionalEmail,
} from './order-validation.ts'

interface CustomerFieldsProps {
  // ATK purchase requests may leave the time open.
  completionRequired: boolean
  completionLabel?: string
}

// Signed-in members get their profile as a starting point. The values stay
// editable and belong to this order only — the profile is never changed.
export function CustomerFields({
  completionRequired,
  completionLabel = 'Waktu selesai yang diinginkan (WIB)',
}: CustomerFieldsProps) {
  const {
    register,
    getFieldState,
    setValue,
    formState: { errors },
  } = useFormContext<CustomerFormValues>()
  const { data: user } = useCurrentUser()
  const isMember = user?.role === 'MEMBER'
  const profile = useProfile({ enabled: isMember })
  const locations = useLocations()

  useEffect(() => {
    if (!isMember || !profile.data) return
    const prefill: [keyof CustomerFormValues, string | null][] = [
      ['customerName', profile.data.name],
      ['customerWhatsapp', profile.data.whatsapp],
      ['customerEmail', profile.data.email],
    ]
    for (const [field, value] of prefill) {
      if (value && !getFieldState(field).isDirty) setValue(field, value)
    }
  }, [isMember, profile.data, getFieldState, setValue])

  return (
    <fieldset className="space-y-4">
      <legend className="text-base font-semibold text-slate-900">
        Data kontak
      </legend>
      {isMember ? (
        <p className="text-sm text-slate-600">
          Diisi dari profil Anda. Perubahan di sini hanya berlaku untuk pesanan
          ini.
        </p>
      ) : (
        <p className="text-sm text-slate-600">
          Akun tidak wajib — Anda dapat mengajukan sebagai tamu.
        </p>
      )}
      <TextField
        label="Nama"
        autoComplete="name"
        error={errors.customerName?.message}
        {...register('customerName', { validate: validateCustomerName })}
      />
      <TextField
        label="Nomor WhatsApp"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        hint="Kami menghubungi Anda melalui nomor ini."
        error={errors.customerWhatsapp?.message}
        {...register('customerWhatsapp', {
          validate: validateCustomerWhatsapp,
        })}
      />
      <TextField
        label="Email"
        type="email"
        inputMode="email"
        autoComplete="email"
        optional
        error={errors.customerEmail?.message}
        {...register('customerEmail', { validate: validateOptionalEmail })}
      />
      {locations.data && locations.data.length > 0 ? (
        <SelectField
          label="Lokasi"
          optional
          error={errors.locationId?.message}
          {...register('locationId')}
        >
          <option value="">Belum memilih lokasi</option>
          {locations.data.map((location) => (
            <option key={location.id} value={location.id}>
              {location.name}
            </option>
          ))}
        </SelectField>
      ) : null}
      <TextField
        label={completionLabel}
        type="datetime-local"
        min={nowAsWibInput()}
        optional={!completionRequired}
        hint="Waktu yang Anda harapkan, bukan jaminan. Kami akan mengonfirmasi."
        error={errors.requestedCompletionAt?.message}
        {...register('requestedCompletionAt', {
          validate: (value) =>
            validateFutureWib(value, { required: completionRequired }),
        })}
      />
    </fieldset>
  )
}
