import { MarketingSubPage } from '../MarketingSubPage'

export function CardsPage() {
  return (
    <MarketingSubPage
      eyebrow="Cards"
      title="Elevate your spend"
      lead="Physical and virtual cards with limits you control, perks that match your plan, and security built in from the first tap."
      heroTheme="dark"
      bullets={[
        'Physical cards from Standard to Ultra',
        'Virtual cards for safer online payments',
        'Spend analytics and instant freeze',
        'Travel and purchase benefits on paid plans',
      ]}
      ctaLabel="Learn more"
    />
  )
}
