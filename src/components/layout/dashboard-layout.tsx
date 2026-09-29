import { Outlet, useLocation } from "react-router-dom"
import { UserMenu } from "@/components/layout/user-menu"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { useAuth } from "@/hooks/use-auth"
import { getNavigation } from "@/lib/navigation"

function usePageTitle() {
  const { user } = useAuth()
  const { pathname } = useLocation()

  if (!user) return "Equivex"

  const items = getNavigation(user.role).flatMap((group) => group.items)

  const exact = items.find((item) => item.url === pathname)
  if (exact) return exact.title

  // A nested page such as /reports/share-holding keeps its section's title.
  const section = items.find((item) => pathname.startsWith(`${item.url}/`))
  return section?.title ?? "Equivex"
}

export function DashboardLayout() {
  const title = usePageTitle()

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* h-16 matches the sidebar header: its 48px row plus 8px padding
            top and bottom, so both bottom borders land on the same line. */}
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-1 h-16" />
          <h1 className="truncate text-sm font-semibold sm:text-base">{title}</h1>
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <UserMenu />
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
