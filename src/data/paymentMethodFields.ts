export type MethodFieldDef = {
  id: string
  label: string
  placeholder?: string
  required?: boolean
  inputMode?: 'text' | 'email' | 'tel' | 'numeric'
  autoComplete?: string
}

export function fieldsForPaymentMethod(methodId: string): MethodFieldDef[] {
  switch (methodId) {
    case 'fps':
      return [
        { id: 'sortCode', label: 'Sort code', placeholder: '00-00-00', required: true },
        { id: 'accountNumber', label: 'Account number', placeholder: '12345678', required: true },
      ]
    case 'ach':
      return [
        { id: 'routingNumber', label: 'Routing number', placeholder: '9 digits', required: true, inputMode: 'numeric' },
        { id: 'accountNumber', label: 'Account number', required: true },
      ]
    case 'sepa':
      return [
        { id: 'iban', label: 'IBAN', placeholder: 'DE89 3704 0044 0532 0130 00', required: true },
        { id: 'bic', label: 'BIC (optional)', placeholder: 'COBADEFFXXX', required: false },
      ]
    case 'zelle':
      return [{ id: 'zelleContact', label: 'Zelle email or US mobile', required: true, inputMode: 'email' }]
    case 'chime':
      return [{ id: 'chimeTag', label: 'Chime $Cashtag, email, or phone', required: true }]
    case 'interac':
    case 'etransfer':
      return [{ id: 'interacContact', label: 'Interac e-Transfer email or mobile', required: true, inputMode: 'email' }]
    case 'pix':
      return [{ id: 'pixKey', label: 'Pix key', placeholder: 'CPF, email, phone, or EVP', required: true }]
    case 'upi':
      return [{ id: 'upiId', label: 'UPI ID', placeholder: 'name@bank', required: true }]
    case 'payid':
      return [{ id: 'payid', label: 'PayID', placeholder: 'Email or phone registered with your bank', required: true }]
    case 'crypto':
      return [
        { id: 'walletAddress', label: 'Wallet address', required: true },
        { id: 'network', label: 'Network', placeholder: 'e.g. Bitcoin, Ethereum', required: true },
      ]
    case 'apple':
      return [{ id: 'applePayContact', label: 'Apple Pay phone or email', required: true, inputMode: 'email' }]
    case 'google':
      return [{ id: 'googlePayContact', label: 'Google Pay phone or email', required: true, inputMode: 'email' }]
    case 'bank':
    default:
      return [
        { id: 'bankName', label: 'Bank name', required: true },
        { id: 'accountHolder', label: 'Account holder name', required: true },
        { id: 'accountNumber', label: 'Account number', required: true },
      ]
  }
}

export function validatePaymentMethodFields(methodId: string, values: Record<string, string>): string | null {
  for (const field of fieldsForPaymentMethod(methodId)) {
    if (field.required === false) continue
    const value = values[field.id]?.trim() ?? ''
    if (value.length < 2) return `Enter ${field.label.toLowerCase()}.`
  }
  if (methodId === 'fps') {
    const sort = values.sortCode?.replace(/\s/g, '') ?? ''
    if (!/^\d{6}$/.test(sort.replace(/-/g, ''))) return 'Enter a valid sort code (6 digits).'
  }
  if (methodId === 'ach') {
    const routing = values.routingNumber?.replace(/\D/g, '') ?? ''
    if (routing.length !== 9) return 'Enter a valid 9-digit routing number.'
  }
  return null
}

export function formatPaymentMethodDetails(methodId: string, values: Record<string, string>): string {
  const parts: string[] = []
  for (const field of fieldsForPaymentMethod(methodId)) {
    const value = values[field.id]?.trim()
    if (value) parts.push(`${field.label}: ${value}`)
  }
  return parts.join(' · ')
}

export function emptyMethodFieldValues(methodId: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const field of fieldsForPaymentMethod(methodId)) {
    out[field.id] = ''
  }
  return out
}
