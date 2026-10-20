import type { RouteObject } from 'react-router'
import { PublicLayout } from '../components/layout/PublicLayout.tsx'
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

// Routes (Architecture §8): public pages, sign-in/sign-up and the member
// account. "Continue as Guest" is a link, not a route. Account orders,
// tracking and admin routes belong to later phases and are intentionally
// absent.
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
      { path: 'account', element: <AccountPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
