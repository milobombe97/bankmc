import { fieldsForPaymentMethod } from '../data/paymentMethodFields'
import { Field } from './Field'
import { IconText } from './PasswordInput'

type Props = {
  methodId: string
  values: Record<string, string>
  onChange: (next: Record<string, string>) => void
}

export function PaymentMethodFields({ methodId, values, onChange }: Props) {
  const fields = fieldsForPaymentMethod(methodId)

  if (fields.length === 0) return null

  return (
    <div className="space-y-4 rounded-[1.25rem] border border-revolut-line bg-revolut-muted/40 p-4">
      <p className="text-sm font-medium text-revolut-ink">Payment details</p>
      {fields.map((field) => (
        <Field key={field.id} label={field.label}>
          <IconText
            icon="card"
            value={values[field.id] ?? ''}
            placeholder={field.placeholder ?? field.label}
            inputMode={field.inputMode}
            autoComplete={field.autoComplete}
            onChange={(event) =>
              onChange({
                ...values,
                [field.id]: event.target.value,
              })
            }
          />
        </Field>
      ))}
    </div>
  )
}
