import { Link } from 'react-router-dom'
import { MenuPublicPreview } from '../components/MenuPublicPreview'

export default function MenuPreviewPage() {
  return (
    <div>
      <h1 className="mb-4 font-heading text-2xl text-[#C9A227]">Vista previa del menú</h1>
      <p className="mb-3 max-w-xl font-accent text-sm text-[rgba(245,240,232,0.7)]">
        Lista compacta con simulación de fecha (misma fuente que el catálogo público).
        Para ver la misma experiencia que el cliente (cards, carrito, banners), abre{' '}
        <Link to="/menu" target="_blank" rel="noopener noreferrer" className="text-[#C9A227] underline">
          Menú cliente
        </Link>
        {' '}en otra pestaña.
      </p>
      <MenuPublicPreview />
    </div>
  )
}
