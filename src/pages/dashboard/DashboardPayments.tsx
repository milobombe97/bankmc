import { type FormEvent, useEffect, useState } from 'react'
import { useAccount } from '../../auth/useAccount'
import { accountBalance, availableBalance, bankAccounts, formatMoney, recordPending } from '../../data/banking'
import { keepMethod } from '../../data/payoutMethods'
import { Button } from '../../components/Button'
import { CountrySelect } from '../../components/CountrySelect'
import { AccountMark } from '../../components/Flags'
import { Field } from '../../components/Field'
import { MethodChoices, methodLabel } from '../../components/MethodChoices'
import { IconText } from '../../components/PasswordInput'
import { SelectMenu } from '../../components/SelectMenu'

export function DashboardPayments() {
  const profile = useAccount()
  const [country, setCountry] = useState(profile?.kyc?.country || 'United Kingdom')
  const [from, setFrom] = useState('personal')
  const [recipient, setRecipient] = useState('')
  const [method, setMethod] = useState(() => keepMethod(country, 'fps'))
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')

  const source = bankAccounts.find((account) => account.id === from) ?? bankAccounts[0]

  useEffect(() => {
    setMethod((current) => keepMethod(country, current))
  }, [country])

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const value = Number(amount)
    if (recipient.trim().length < 2) {
      setError('Enter who you are paying.')
      return
    }
    if (!Number.isFinite(value) || value <= 0) {
      setError('Enter an amount greater than zero.')
      return
    }
    if (value > availableBalance(source)) {
      setError('That is more than the balance still available on this account.')
      return
    }
    const label = `${methodLabel(country, method)} · ${country}`
    recordPending({
      accountId: source.id,
      name: `${recipient.trim()} · ${label}`,
      method: label,
      amount: -value,
    })
    setRecipient('')
    setAmount('')
    setError('')
  }

  return (
    <main className="grid gap-8 lg:grid-cols-[minmax(0,420px)_1fr]">
      <div>
        <h1 className="text-3xl font-medium tracking-[-0.04em]">Send money</h1>
        <p className="mt-2 text-sm text-revolut-ink/60">
          Choose the country you are sending to. The request stays pending until support approves a receipt.
        </p>
        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          <Field label="From">
            <SelectMenu
              value={from}
              onChange={setFrom}
              options={bankAccounts.map((account) => ({
                value: account.id,
                label: account.name,
                hint: formatMoney(accountBalance(account), account.currency),
                icon: <AccountMark id={account.id} currency={account.currency} />,
              }))}
            />
          </Field>
          <Field label="Recipient" error={error || undefined}>
            <IconText
              icon="user"
              value={recipient}
              placeholder="Name or @username"
              onChange={(event) => setRecipient(event.target.value)}
            />
          </Field>
          <Field label="Country">
            <CountrySelect value={country} onChange={setCountry} />
          </Field>
          <MethodChoices country={country} value={method} onChange={setMethod} basis="destination" />
          <Field label={`Amount (${source.currency})`}>
            <IconText
              icon="banknote"
              inputMode="decimal"
              value={amount}
              placeholder="0.00"
              onChange={(event) => setAmount(event.target.value)}
            />
          </Field>
          <Button type="submit">Send</Button>
        </form>
      </div>
      <aside className="rounded-[1.75rem] bg-white p-6">
        <h2 className="font-medium">Available</h2>
        <ul className="mt-4 space-y-3">
          {bankAccounts.map((account) => (
            <li key={account.id} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2">
                <AccountMark id={account.id} currency={account.currency} />
                {account.name}
              </span>
              <span className="font-medium tabular-nums">{formatMoney(accountBalance(account), account.currency)}</span>
            </li>
          ))}
        </ul>
      </aside>
    </main>
  )
}
