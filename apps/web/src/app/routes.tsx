import type { RouteObject } from 'react-router'
import { PublicLayout } from '../components/layout/PublicLayout.tsx'
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
// Guest" is a link, not a route. Admin routes belong to a later phase.
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
