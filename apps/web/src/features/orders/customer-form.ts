// Contact snapshot and scheduling fields shared by all order forms.
export interface CustomerFormValues {
  customerName: string
  customerWhatsapp: string
  customerEmail: string
  locationId: string
  // datetime-local value, read as WIB.
  requestedCompletionAt: string
}

export const emptyCustomerValues: CustomerFormValues = {
  customerName: '',
  customerWhatsapp: '',
  customerEmail: '',
  locationId: '',
  requestedCompletionAt: '',
}
