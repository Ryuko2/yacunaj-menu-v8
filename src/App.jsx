import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MenuPage from './pages/MenuPage'
import ConfirmationPage from './pages/ConfirmationPage'
import AdminPage from './pages/AdminPage'
import StaffPage from './pages/StaffPage'
import TableActions from './components/TableActions'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/order" element={<MenuPage />} />
        <Route path="/confirmation" element={<ConfirmationPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/staff" element={<StaffPage />} />
        <Route path="*" element={<MenuPage />} />
      </Routes>
      <TableActions />
    </BrowserRouter>
  )
}
