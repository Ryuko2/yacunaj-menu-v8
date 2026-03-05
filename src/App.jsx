import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MenuPage from './pages/MenuPage'
import ConfirmationPage from './pages/ConfirmationPage'
import AdminPage from './pages/AdminPage'
import TableActions from './components/TableActions'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/order" element={<MenuPage />} />
        <Route path="/confirmation" element={<ConfirmationPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<MenuPage />} />
      </Routes>
      <TableActions />
    </BrowserRouter>
  )
}
