import { MarketingSubPage } from '../MarketingSubPage'

export function SecurityPage() {
  return (
    <MarketingSubPage
      eyebrow="Revolut Secure"
      title="Your money's safe space"
      lead="24/7 protection through proactive, purpose-built defences and specialists who monitor threats — so you can bank with confidence."
      heroTheme="dark"
      bullets={[
        'Proactive fraud and scam detection',
        'Instant card freeze and location controls',
        'How we protect your money — explained',
        'Report lost devices and security issues quickly',
      ]}
      ctaLabel="Learn more"
    />
  )
}
