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
import MenuHubPage from './pages/app/MenuHubPage'
import ReportsHubPage from './pages/app/ReportsHubPage'
import ReportsSectionLayout from './pages/app/ReportsSectionLayout'
import OrdersAdminPage from './pages/app/OrdersAdminPage'
import CrmCounterPage from './pages/app/CrmCounterPage'
import SalesReportPage from './features/reports/pages/SalesReportPage'
import CostsReportPage from './features/reports/pages/CostsReportPage'
import InventoryReportPage from './features/inventory/pages/InventoryReportPage'
import SuppliersPage from './features/inventory/pages/SuppliersPage'
import TableActions from './components/TableActions'
import { RequireAuth } from './components/auth/RequireAuth'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MenuPage />} />
        <Route path="/menu" element={<MenuPage />} />
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
          <Route index element={<Navigate to="/app/ops" replace />} />
          <Route path="ops" element={<OpsHomePage />} />
          <Route path="pos" element={<Navigate to="/app/ops" replace />} />
          <Route path="orders" element={<OrdersAdminPage />} />
          <Route path="counter" element={<CrmCounterPage />} />
          <Route path="reports" element={<ReportsSectionLayout />}>
            <Route index element={<ReportsHubPage />} />
            <Route path="sales" element={<SalesReportPage />} />
            <Route path="inventory" element={<InventoryReportPage />} />
            <Route path="inventory/suppliers" element={<SuppliersPage />} />
            <Route path="costs" element={<CostsReportPage />} />
          </Route>
          <Route path="menu" element={<MenuSectionLayout />}>
            <Route index element={<MenuHubPage />} />
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
