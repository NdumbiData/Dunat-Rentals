import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dunat Car Rental',
  description: 'Admin dashboard for Dunat Car Rental management',
}

import { AuthProvider } from '@/context/AuthContext';
import AlertSystem from '@/components/AlertSystem';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>
        <AuthProvider>
          <AlertSystem />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
