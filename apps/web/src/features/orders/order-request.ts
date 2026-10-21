import type { OrderCustomerInput } from '@maba-printing/shared'
import { wibInputToIso } from '../../lib/format-datetime.ts'
import type { CustomerFormValues } from './customer-form.ts'

// Form values → the shared request fields (empty optional values → null).
export function toCustomerInput(
  values: CustomerFormValues,
): OrderCustomerInput {
  return {
    customerName: values.customerName,
    customerWhatsapp: values.customerWhatsapp,
    customerEmail: values.customerEmail.trim() || null,
    locationId: values.locationId || null,
    requestedCompletionAt: wibInputToIso(values.requestedCompletionAt),
  }
}

export function optionalText(value: string): string | null {
  return value.trim() === '' ? null : value
}
