import { Link } from 'react-router-dom'

const linkColumns = [
  {
    title: 'Crypto',
    links: [
      { label: 'Crypto', to: '#' },
      { label: 'Revolut Ramp', to: '#' },
      { label: 'Revolut X', to: '#' },
    ],
  },
  {
    title: 'Mobile & Connectivity',
    links: [
      { label: 'Mobile Plans', to: '#' },
      { label: 'Data Plans', to: '#' },
    ],
  },
  {
    title: 'Investments',
    links: [
      { label: 'Stocks', to: '/invest' },
      { label: 'Stocks & Shares ISA', to: '/invest' },
      { label: 'Commodities', to: '/invest' },
    ],
  },
  {
    title: 'Help',
    links: [
      { label: 'Contact Us', to: '#' },
      { label: 'Help Centre', to: '#' },
      { label: 'System Status', to: '#' },
      { label: 'Developers API', to: '#' },
    ],
  },
  {
    title: 'Plans',
    links: [
      { label: 'Standard', to: '/plans' },
      { label: 'Plus', to: '/plans' },
      { label: 'Premium', to: '/plans' },
      { label: 'Metal', to: '/plans' },
      { label: 'Ultra', to: '/plans' },
      { label: 'Compare Plans', to: '/plans' },
    ],
  },
  {
    title: 'Accounts',
    links: [
      { label: 'Bank Account', to: '/' },
      { label: 'Joint Account', to: '/' },
      { label: 'Savings Account', to: '/savings' },
      { label: 'Cards', to: '/cards' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="border-t border-revolut-line bg-revolut-muted">
      <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {linkColumns.map((col) => (
            <div key={col.title}>
              <h2 className="type-label text-revolut-ink">{col.title}</h2>
              <ul className="mt-4 space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-revolut-ink/65 transition-colors hover:text-revolut-ink"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-6 border-t border-revolut-line pt-10 text-sm text-revolut-ink/65">
          <p className="font-medium text-revolut-ink">© Nevolute Inc. 2026</p>
          <p className="max-w-4xl leading-relaxed">Nevolute Inc.</p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {[
              'Website Terms',
              'Legal Agreements',
              'Complaints',
              'Privacy',
              'UK Modern Slavery Policy',
              'Admin access',
            ].map((item) => (
              <li key={item}>
                {item === 'Admin access' ? (
                  <Link to="/admin" className="hover:text-revolut-ink">{item}</Link>
                ) : (
                  <a href="#" className="hover:text-revolut-ink">{item}</a>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}
