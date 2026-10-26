import { Button } from '../components/Button'
import { Footer } from '../components/Footer'
import { Header } from '../components/Header'

const features = [
  {
    title: 'Business accounts',
    description: 'Open an account in minutes. Send, receive, and hold money in multiple currencies.',
  },
  {
    title: 'Team expenses',
    description: 'Issue cards to your team, set limits, and track spending in real time.',
  },
  {
    title: 'Integrations',
    description: 'Connect accounting tools and automate reconciliation with your existing stack.',
  },
  {
    title: 'Global payments',
    description: 'Pay suppliers and partners abroad with competitive FX and transparent fees.',
  },
]

export function BusinessPage() {
  return (
    <div className="bg-white">
      <section className="relative overflow-hidden bg-revolut-ink pb-20 pt-24 text-white lg:pb-28 lg:pt-28">
        <div
          className="pointer-events-none absolute -right-1/4 top-0 h-full w-2/3 bg-gradient-to-l from-revolut-sky-deep/30 to-transparent"
          aria-hidden
        />
        <Header theme="dark" />
        <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
          <p className="text-sm font-medium uppercase tracking-wider text-white/50">Nevolute Inc. Business</p>
          <h1 className="mt-4 max-w-3xl text-5xl font-semibold tracking-tight sm:text-6xl">
            Finance that moves as fast as your business
          </h1>
          <p className="mt-6 max-w-xl text-lg text-white/75">
            Accounts, cards, and payments built for startups, scale-ups, and enterprises — all in
            one place.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button href="/signup">Open a Business account</Button>
            <Button variant="ghost" className="border border-white/30" href="/help">
              Talk to sales
            </Button>
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <h2 className="text-3xl font-semibold sm:text-4xl">Everything you need to run finances</h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {features.map((f) => (
              <article
                key={f.title}
                className="rounded-3xl border border-revolut-line bg-revolut-muted/50 p-8"
              >
                <h3 className="text-xl font-semibold">{f.title}</h3>
                <p className="mt-3 text-revolut-ink/70">{f.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-revolut-line bg-revolut-muted py-20">
        <div className="mx-auto max-w-3xl px-5 text-center lg:px-8">
          <h2 className="text-3xl font-semibold">Trusted by 500,000+ businesses</h2>
          <p className="mt-4 text-revolut-ink/70">
            From sole traders to global teams — scale your operations without scaling complexity.
          </p>
          <Button className="mt-8" href="/signup">Get started</Button>
        </div>
      </section>

      <Footer />
    </div>
  )
}
