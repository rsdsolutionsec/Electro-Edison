'use client'

import * as React from 'react'
import { Sidebar } from './sidebar'
import { Header } from './header'
import type { AuthUserProfile } from '@/lib/auth'

export function AppLayout({
  user,
  children,
}: {
  user: AuthUserProfile
  children: React.ReactNode
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50">
      {/* Desktop Sidebar (hidden on mobile) */}
      <div className="hidden lg:block shrink-0">
        <Sidebar roles={user.roles} />
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 w-64 shadow-2xl">
            <Sidebar roles={user.roles} onCloseMobile={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header user={user} onOpenMobile={() => setMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
