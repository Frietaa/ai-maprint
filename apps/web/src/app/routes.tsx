import type { RouteObject } from 'react-router'
import { PublicLayout } from '../components/layout/PublicLayout.tsx'
import { AtkPage } from '../pages/AtkPage.tsx'
import { HomePage } from '../pages/HomePage.tsx'
import { LaptopServicePage } from '../pages/LaptopServicePage.tsx'
import { LocationsPage } from '../pages/LocationsPage.tsx'
import { NotFoundPage } from '../pages/NotFoundPage.tsx'
import { PrintingPage } from '../pages/PrintingPage.tsx'
import { SoftwareInstallationPage } from '../pages/SoftwareInstallationPage.tsx'

// Public routes (Architecture §8). Auth, account, tracking and admin routes
// belong to later phases and are intentionally absent.
export const routes: RouteObject[] = [
  {
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'printing', element: <PrintingPage /> },
      { path: 'atk', element: <AtkPage /> },
      { path: 'laptop-service', element: <LaptopServicePage /> },
      { path: 'software-installation', element: <SoftwareInstallationPage /> },
      { path: 'locations', element: <LocationsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
