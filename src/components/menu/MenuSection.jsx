export function MenuSection({ title, emoji, children }) {
  return (
    <section className="mb-8">
      <h2 className="font-heading text-xl font-semibold text-palm mb-4 flex items-center gap-2">
        <span>{emoji}</span> {title}
      </h2>
      <div className="grid gap-3">
        {children}
      </div>
    </section>
  )
}
