import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { loadClients, updateClient } from '../../auth/session'
import { Button } from '../../components/Button'
import { FilePreview } from '../../components/FilePreview'
import type { StoredFile } from '../../data/files'
import { kycFileKey, loadStoredFile } from '../../data/fileStore'
import { kycPreview } from '../../data/remote'
import { useAdminTick } from './useAdminTick'

const documentLabel = {
  passport: 'Passport',
  driving_licence: 'Driving licence',
  national_id: 'National ID',
} as const

function mimeFromName(name: string) {
  const lower = name.toLowerCase()
  if (lower.endsWith('.pdf')) return 'application/pdf'
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.webp')) return 'image/webp'
  if (lower.endsWith('.gif')) return 'image/gif'
  return 'image/jpeg'
}

async function loadSide(
  clientId: string,
  side: 'front' | 'back',
  inline: StoredFile | undefined,
  path: string | undefined,
  name: string | undefined,
  stored: boolean | undefined,
) {
  if (inline?.dataUrl) return inline
  if (stored) {
    const local = await loadStoredFile(kycFileKey(clientId, side))
    if (local?.dataUrl) return local
  }
  if (!path) return undefined
  return (await kycPreview(path, name || 'Identity document', mimeFromName(name || ''))) ?? undefined
}

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

  return <KycReview client={client} />
}

function KycReview({ client }: { client: NonNullable<ReturnType<typeof loadClients>[number]> }) {
  const kyc = client.kyc
  const passport = kyc?.documentType === 'passport'
  const frontUrl = kyc?.documentFile?.dataUrl ?? ''
  const backUrl = kyc?.documentBackFile?.dataUrl ?? ''
  const [front, setFront] = useState<StoredFile | undefined>(frontUrl ? kyc?.documentFile : undefined)
  const [back, setBack] = useState<StoredFile | undefined>(backUrl ? kyc?.documentBackFile : undefined)

  useEffect(() => {
    let active = true
    const clientId = client.id || 'primary'
    loadSide(clientId, 'front', frontUrl ? kyc?.documentFile : undefined, kyc?.documentPath, kyc?.documentFileName, kyc?.documentStored).then((file) => {
      if (active) setFront(file)
    })
    loadSide(clientId, 'back', backUrl ? kyc?.documentBackFile : undefined, kyc?.documentBackPath, kyc?.documentBackFileName, kyc?.documentBackStored).then((file) => {
      if (active) setBack(file)
    })
    return () => {
      active = false
    }
  }, [
    client.id,
    frontUrl,
    backUrl,
    kyc?.documentPath,
    kyc?.documentFileName,
    kyc?.documentStored,
    kyc?.documentBackPath,
    kyc?.documentBackFileName,
    kyc?.documentBackStored,
  ])

  const approved = client.kycStatus === 'verified'
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState('')

  function approve() {
    updateClient({
      ...client,
      kycStatus: 'verified',
      kyc: client.kyc ? { ...client.kyc, rejectionReason: undefined } : client.kyc,
    })
    setRejecting(false)
  }

  function reject() {
    if (!reason.trim()) {
      setReasonError('Enter the reason for rejection.')
      return
    }
    updateClient({
      ...client,
      kycStatus: 'rejected',
      kyc: client.kyc ? { ...client.kyc, rejectionReason: reason.trim() } : client.kyc,
    })
  }

  return (
    <main className="max-w-5xl space-y-6">
      <Link to="/admin/kyc" className="text-sm font-medium text-revolut-ink/60 hover:text-revolut-ink">KYC</Link>
      <div>
        <h1 className="text-3xl font-medium tracking-[-0.04em]">{client.firstName} {client.lastName}</h1>
        <p className="mt-1 text-sm capitalize text-revolut-ink/55">{client.kycStatus.replace(/_/g, ' ')}</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">{passport ? 'Biography page' : 'Front of document'}</h2>
        <FilePreview file={front} fallbackName={kyc?.documentFileName} missing="Ask the client to submit the identity check again." />
        {!passport && (
          <>
            <h2 className="text-lg font-medium">Back of document</h2>
            <FilePreview file={back} fallbackName={kyc?.documentBackFileName} missing="Ask the client to submit the identity check again." />
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

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={approve} disabled={approved} className="disabled:cursor-default disabled:opacity-60">
            {approved ? 'Approved' : 'Approve KYC'}
          </Button>
          {client.kycStatus !== 'rejected' && (
            <Button type="button" variant="secondary" onClick={() => setRejecting((current) => !current)}>
              Disapprove KYC
            </Button>
          )}
        </div>
        {rejecting && !approved && (
          <div className="max-w-xl space-y-3 rounded-[1.5rem] bg-white p-5">
            <label className="block text-sm font-medium" htmlFor="kyc-reason">Reason for rejection</label>
            <textarea
              id="kyc-reason"
              value={reason}
              rows={3}
              className="w-full rounded-2xl border border-revolut-line px-4 py-3 text-sm outline-none focus:border-revolut-ink"
              placeholder="Tell the client what to correct"
              onChange={(event) => {
                setReason(event.target.value)
                setReasonError('')
              }}
            />
            {reasonError ? <p className="text-sm text-red-600">{reasonError}</p> : null}
            <Button type="button" variant="secondary" onClick={reject}>Send rejection</Button>
          </div>
        )}
        {client.kycStatus === 'rejected' && client.kyc?.rejectionReason ? (
          <p className="text-sm text-revolut-ink/70">Rejected: {client.kyc.rejectionReason}</p>
        ) : null}
      </div>
    </main>
  )
}
