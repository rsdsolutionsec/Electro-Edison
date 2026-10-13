import { requireUser } from '@/lib/auth'
import { AppLayout } from '@/components/layout/app-layout'

export const dynamic = 'force-dynamic'

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireUser()

  return <AppLayout user={user}>{children}</AppLayout>
}
