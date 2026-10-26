import { Link, useParams } from 'react-router-dom'
import { loadClients, updateClient } from '../../auth/session'
import { Button } from '../../components/Button'
import { FilePreview } from '../../components/FilePreview'
import { useAdminTick } from './useAdminTick'

const documentLabel = {
  passport: 'Passport',
  driving_licence: 'Driving licence',
  national_id: 'National ID',
} as const

export function AdminKycDetail() {
  const { id = '' } = useParams()
  const tick = useAdminTick()
  const client = loadClients().find((item) => item.id === id)
  void tick

  if (!client) {
    return (
      <main>
        <h1 className="text-3xl font-medium tracking-[-0.04em]">Identity check not found</h1>
        <Link to="/admin/kyc" className="mt-4 inline-block text-sm font-medium hover:underline">KYC</Link>
      </main>
    )
  }

  const kyc = client.kyc
  const passport = kyc?.documentType === 'passport'

  return (
    <main className="max-w-5xl space-y-6">
      <Link to="/admin/kyc" className="text-sm font-medium text-revolut-ink/60 hover:text-revolut-ink">KYC</Link>
      <div>
        <h1 className="text-3xl font-medium tracking-[-0.04em]">{client.firstName} {client.lastName}</h1>
        <p className="mt-1 text-sm capitalize text-revolut-ink/55">{client.kycStatus.replace(/_/g, ' ')}</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">{passport ? 'Biography page' : 'Front of document'}</h2>
        <FilePreview file={kyc?.documentFile} fallbackName={kyc?.documentFileName} />
        {!passport && (
          <>
            <h2 className="text-lg font-medium">Back of document</h2>
            <FilePreview file={kyc?.documentBackFile} fallbackName={kyc?.documentBackFileName} />
          </>
        )}
      </section>

      {kyc && (
        <dl className="grid gap-3 rounded-[1.5rem] bg-white p-5 text-sm sm:grid-cols-2">
          <div><dt className="text-revolut-ink/45">Legal name</dt><dd>{kyc.legalFirstName} {kyc.legalLastName}</dd></div>
          <div><dt className="text-revolut-ink/45">Date of birth</dt><dd>{kyc.dateOfBirth}</dd></div>
          <div><dt className="text-revolut-ink/45">Document</dt><dd>{documentLabel[kyc.documentType]} · {kyc.documentNumber}</dd></div>
          <div><dt className="text-revolut-ink/45">Expiry</dt><dd>{kyc.documentExpiry}</dd></div>
          <div><dt className="text-revolut-ink/45">Nationality</dt><dd>{kyc.nationality}</dd></div>
          <div><dt className="text-revolut-ink/45">Address</dt><dd>{kyc.addressLine}, {kyc.city} {kyc.postcode}, {kyc.country}</dd></div>
        </dl>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => updateClient({ ...client, kycStatus: 'verified' })}>Approve KYC</Button>
        <Button type="button" variant="secondary" onClick={() => updateClient({ ...client, kycStatus: 'rejected' })}>Disapprove KYC</Button>
      </div>
    </main>
  )
}
