import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import MenuPage from './pages/MenuPage'
import ConfirmationPage from './pages/ConfirmationPage'
import AdminPage from './pages/AdminPage'
import StaffPage from './pages/StaffPage'
import LoginPage from './pages/LoginPage'
import AppLayout from './pages/app/AppLayout'
import MenuSectionLayout from './features/menu/pages/MenuSectionLayout'
import MenuCategoriesPage from './features/menu/pages/MenuCategoriesPage'
import MenuItemsPage from './features/menu/pages/MenuItemsPage'
import MenuItemNewPage from './features/menu/pages/MenuItemNewPage'
import MenuItemEditPage from './features/menu/pages/MenuItemEditPage'
import MenuModifiersPage from './features/menu/pages/MenuModifiersPage'
import MenuPreviewPage from './features/menu/pages/MenuPreviewPage'
import OpsHomePage from './pages/app/OpsHomePage'
import CrmCounterPage from './pages/app/CrmCounterPage'
import TableActions from './components/TableActions'
import { RequireAuth } from './components/auth/RequireAuth'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MenuPage />} />
        <Route path="/order" element={<MenuPage />} />
        <Route path="/confirmation" element={<ConfirmationPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/staff" element={<StaffPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/app"
          element={(
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          )}
        >
          <Route index element={<Navigate to="/app/pos" replace />} />
          <Route path="pos" element={<OpsHomePage />} />
          <Route path="counter" element={<CrmCounterPage />} />
          <Route path="menu" element={<MenuSectionLayout />}>
            <Route index element={<Navigate to="items" replace />} />
            <Route path="categories" element={<MenuCategoriesPage />} />
            <Route path="items" element={<MenuItemsPage />} />
            <Route path="items/new" element={<MenuItemNewPage />} />
            <Route path="items/:id" element={<MenuItemEditPage />} />
            <Route path="modifiers" element={<MenuModifiersPage />} />
            <Route path="preview" element={<MenuPreviewPage />} />
          </Route>
        </Route>
        <Route path="*" element={<MenuPage />} />
      </Routes>
      <TableActions />
    </BrowserRouter>
  )
}
