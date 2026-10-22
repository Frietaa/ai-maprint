import type { RouteObject } from 'react-router'
import { PublicLayout } from '../components/layout/PublicLayout.tsx'
import { AdminLayout } from '../features/admin/AdminLayout.tsx'
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage.tsx'
import { AdminLocationsPage } from '../pages/admin/AdminLocationsPage.tsx'
import { AdminOrderDetailPage } from '../pages/admin/AdminOrderDetailPage.tsx'
import { AdminOrdersPage } from '../pages/admin/AdminOrdersPage.tsx'
import { AdminProductsPage } from '../pages/admin/AdminProductsPage.tsx'
import { AdminServicesPage } from '../pages/admin/AdminServicesPage.tsx'
import { AdminSettingsPage } from '../pages/admin/AdminSettingsPage.tsx'
import { AdminLoginPage } from '../pages/admin/AdminLoginPage.tsx'
import { AdminNotFoundPage } from '../pages/admin/AdminNotFoundPage.tsx'
import { AccountOrderDetailPage } from '../pages/AccountOrderDetailPage.tsx'
import { AccountOrdersPage } from '../pages/AccountOrdersPage.tsx'
import { AccountPage } from '../pages/AccountPage.tsx'
import { AtkPage } from '../pages/AtkPage.tsx'
import { HomePage } from '../pages/HomePage.tsx'
import { LaptopServicePage } from '../pages/LaptopServicePage.tsx'
import { LocationsPage } from '../pages/LocationsPage.tsx'
import { LoginPage } from '../pages/LoginPage.tsx'
import { NotFoundPage } from '../pages/NotFoundPage.tsx'
import { PrintingPage } from '../pages/PrintingPage.tsx'
import { SignupPage } from '../pages/SignupPage.tsx'
import { SoftwareInstallationPage } from '../pages/SoftwareInstallationPage.tsx'
import { TrackOrderPage } from '../pages/TrackOrderPage.tsx'

// Routes (Architecture §8): public pages with order forms, tracking,
// sign-in/sign-up and the member account with order history. "Continue as
// Guest" is a link, not a route. The Admin area (/admin/*) has its own
// shell and guard; /admin/login is outside it.
export const routes: RouteObject[] = [
  { path: 'admin/login', element: <AdminLoginPage /> },
  {
    path: 'admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminDashboardPage /> },
      { path: 'orders', element: <AdminOrdersPage /> },
      { path: 'orders/:publicId', element: <AdminOrderDetailPage /> },
      { path: 'products', element: <AdminProductsPage /> },
      { path: 'services', element: <AdminServicesPage /> },
      { path: 'locations', element: <AdminLocationsPage /> },
      { path: 'settings', element: <AdminSettingsPage /> },
      { path: '*', element: <AdminNotFoundPage /> },
    ],
  },
  {
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'printing', element: <PrintingPage /> },
      { path: 'atk', element: <AtkPage /> },
      { path: 'laptop-service', element: <LaptopServicePage /> },
      { path: 'software-installation', element: <SoftwareInstallationPage /> },
      { path: 'locations', element: <LocationsPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'signup', element: <SignupPage /> },
      { path: 'track-order', element: <TrackOrderPage /> },
      { path: 'account', element: <AccountPage /> },
      { path: 'account/orders', element: <AccountOrdersPage /> },
      { path: 'account/orders/:publicId', element: <AccountOrderDetailPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
