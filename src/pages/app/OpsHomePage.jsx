import { Link } from 'react-router-dom'

export default function OpsHomePage() {
  return (
    <div>
      <h1 className="mb-2 font-heading text-2xl text-[#C9A227]">
        Panel operativo
      </h1>
      <p className="max-w-xl font-accent text-sm text-[rgba(245,240,232,0.75)]">
        Fase 1 completada: autenticación, layout y menú público vía catálogo en base de datos. Los módulos CMS,
        inventario y POS se añaden en las siguientes fases.
      </p>
      <p className="mt-4 font-accent text-sm">
        <Link to="/app/counter" className="text-[#C9A227] underline underline-offset-2 hover:text-[#D4AF37]">
          Abrir mostrador (menú público + pedidos)
        </Link>
      </p>
    </div>
  )
}