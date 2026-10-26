import { Button } from '../../components/Button'
import { Footer } from '../../components/Footer'
import { Header } from '../../components/Header'
import { PlansCarousel } from '../../components/PlansCarousel'
import { Reveal } from '../../components/Reveal'
import { DisplayTitle, SectionLead } from '../../components/Typography'
import { personalPlans } from '../../data/plans'

export function PlansPage() {
  return (
    <div className="bg-white">
      <section className="bg-revolut-muted pb-16 pt-24 lg:pb-20 lg:pt-28">
        <Header theme="light" />
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <p className="type-label uppercase tracking-[0.12em] text-revolut-ink/50">Plans</p>
          <DisplayTitle className="mt-3 max-w-3xl !text-revolut-ink">Choose your plan</DisplayTitle>
          <SectionLead className="mt-6 max-w-2xl">
            From free everyday banking to Ultra — pick the benefits that fit how you spend, save, and
            travel.
          </SectionLead>
        </div>
      </section>

      <section className="py-12 lg:py-16">
        <Reveal className="mx-auto max-w-7xl">
          <PlansCarousel plans={personalPlans} />
        </Reveal>
        <div className="mx-auto mt-12 max-w-7xl px-5 text-center lg:px-8">
          <Button href="/signup">Sign up</Button>
        </div>
      </section>

      <Footer />
    </div>
  )
}
