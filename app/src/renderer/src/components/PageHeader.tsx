interface Props {
  label: string
  title: string
  subtitle?: string
}

export default function PageHeader({ label, title, subtitle }: Props): JSX.Element {
  return (
    <header className="mb-8 border-b border-line pb-5">
      <div className="label-mono mb-2">{label}</div>
      <h1 className="font-mono text-3xl font-medium tracking-tight text-text">{title}</h1>
      {subtitle && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{subtitle}</p>}
    </header>
  )
}
