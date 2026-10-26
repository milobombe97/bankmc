import { Button } from '../components/Button'
import { Footer } from '../components/Footer'
import { Header } from '../components/Header'

const stats = [
  { value: '80M+', label: 'Customers worldwide' },
  { value: '45+', label: 'Countries and growing' },
  { value: '10K+', label: 'People at Nevolute Inc.' },
]

export function CompanyPage() {
  return (
    <div className="bg-white">
      <section className="relative bg-gradient-to-b from-revolut-muted to-white pb-20 pt-24 lg:pb-28 lg:pt-28">
        <Header theme="light" />
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-revolut-ink sm:text-6xl">
            Building the world&apos;s first truly global financial superapp
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-revolut-ink/70">
            We&apos;re on a mission to give everyone access to fair, transparent financial products
            — whether you&apos;re saving, spending, travelling, or building a business.
          </p>
          <Button className="mt-10" href="/help">View careers</Button>
        </div>
      </section>

      <section className="border-y border-revolut-line py-16">
        <div className="mx-auto flex max-w-7xl flex-wrap justify-center gap-12 px-5 lg:px-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-4xl font-semibold text-revolut-ink">{s.value}</p>
              <p className="mt-2 text-sm text-revolut-ink/60">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 lg:grid-cols-2 lg:px-8">
          <div>
            <h2 className="text-3xl font-semibold">Our story</h2>
            <p className="mt-6 leading-relaxed text-revolut-ink/70">
              Nevolute Inc. started with a simple idea: people should be able to manage all their money in
              one app, without hidden fees or friction. Today we offer banking, payments, travel,
              crypto, and investing — with the same focus on clarity and control.
            </p>
          </div>
          <div id="sustainability" className="rounded-3xl bg-revolut-ink p-10 text-white">
            <h2 className="text-2xl font-semibold">Sustainability &amp; impact</h2>
            <p className="mt-4 text-white/75">
              We publish our progress on carbon, inclusion, and responsible product design — because
              building for the long term means building for everyone.
            </p>
            <Button className="mt-8" variant="secondary" href="/help">
              Learn more
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
