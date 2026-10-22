import type { ComponentType } from 'react'
import type { RouteObject } from 'react-router'
import { PublicLayout } from '../components/layout/PublicLayout.tsx'
import { PageLoading } from '../components/ui/DataState.tsx'
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

// The Admin area is a separate chunk, loaded only when an /admin route is
// visited, so public visitors never download Admin code (PRD §27).
const adminPages = () => import('./admin-pages.ts')

async function component<T extends Record<string, ComponentType>>(
  load: () => Promise<T>,
  name: keyof T,
) {
  const module = await load()
  return { Component: module[name] }
}

// Routes (Architecture §8): public pages with order forms, tracking,
// sign-in/sign-up and the member account with order history. "Continue as
// Guest" is a link, not a route. The Admin area (/admin/*) has its own
// shell and guard; /admin/login is outside it.
export const routes: RouteObject[] = [
  {
    path: 'admin/login',
    lazy: () => component(adminPages, 'AdminLoginPage'),
    hydrateFallbackElement: <PageLoading />,
  },
  {
    path: 'admin',
    lazy: () => component(adminPages, 'AdminLayout'),
    hydrateFallbackElement: <PageLoading />,
    children: [
      { index: true, lazy: () => component(adminPages, 'AdminDashboardPage') },
      { path: 'orders', lazy: () => component(adminPages, 'AdminOrdersPage') },
      {
        path: 'orders/:publicId',
        lazy: () => component(adminPages, 'AdminOrderDetailPage'),
      },
      {
        path: 'products',
        lazy: () => component(adminPages, 'AdminProductsPage'),
      },
      {
        path: 'services',
        lazy: () => component(adminPages, 'AdminServicesPage'),
      },
      {
        path: 'locations',
        lazy: () => component(adminPages, 'AdminLocationsPage'),
      },
      {
        path: 'settings',
        lazy: () => component(adminPages, 'AdminSettingsPage'),
      },
      { path: '*', lazy: () => component(adminPages, 'AdminNotFoundPage') },
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
