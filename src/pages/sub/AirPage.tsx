import { MarketingSubPage } from '../MarketingSubPage'

export function AirPage() {
  return (
    <MarketingSubPage
      eyebrow="Revolut AI"
      title="Ask, and AIR makes it happen"
      lead="AI by Revolut, AIR, is your 24/7 personal assistant. Open your app, swipe, and ask away — from budgets to travel tips."
      bullets={[
        'Natural-language help inside the app',
        'Personalised answers based on your activity',
        'Available around the clock',
        'Built with privacy and security in mind',
      ]}
      ctaLabel="Try it out"
    />
  )
}
