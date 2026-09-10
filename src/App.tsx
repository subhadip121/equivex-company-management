import { lazy, Suspense } from "react"
import { QueryClientProvider } from "@tanstack/react-query"
import { Provider as ReduxProvider } from "react-redux"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ProtectedRoute } from "@/components/layout/protected-route"
import { RouteFallback } from "@/components/layout/route-fallback"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useAuth } from "@/hooks/use-auth"
import { queryClient } from "@/lib/query-client"
import { store } from "@/store"
import { PlaceholderPage } from "@/pages/shared/placeholder-page"

/** Route-level code splitting: each screen ships as its own chunk. */
const LoginPage = lazy(() =>
  import("@/pages/login-page").then((module) => ({ default: module.LoginPage })),
)
const DashboardPage = lazy(() =>
  import("@/pages/dashboard-page").then((module) => ({ default: module.DashboardPage })),
)
const AdminProfilePage = lazy(() =>
  import("@/pages/admin/admin-profile-page").then((module) => ({
    default: module.AdminProfilePage,
  })),
)
const CompaniesPage = lazy(() =>
  import("@/pages/admin/companies-page").then((module) => ({ default: module.CompaniesPage })),
)
const CompanyProfilePage = lazy(() =>
  import("@/pages/company/company-profile-page").then((module) => ({
    default: module.CompanyProfilePage,
  })),
)
const NotFoundPage = lazy(() =>
  import("@/pages/not-found-page").then((module) => ({ default: module.NotFoundPage })),
)

/** Devtools are dev-only and must never reach the production bundle. */
const ReactQueryDevtools = import.meta.env.DEV
  ? lazy(() =>
      import("@tanstack/react-query-devtools").then((module) => ({
        default: module.ReactQueryDevtools,
      })),
    )
  : null

/** One path, two screens: admins get their account, companies get theirs. */
function ProfileRoute() {
  const { user } = useAuth()
  return user?.role === "admin" ? <AdminProfilePage /> : <CompanyProfilePage />
}

export default function App() {
  return (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={200}>
          <BrowserRouter>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/login" element={<LoginPage />} />

                <Route element={<ProtectedRoute />}>
                  <Route element={<DashboardLayout />}>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/companies" element={<CompaniesPage />} />
                    <Route
                      path="/users"
                      element={
                        <PlaceholderPage
                          title="Users"
                          description="Manage portal users and access."
                        />
                      }
                    />
                    <Route path="/profile" element={<ProfileRoute />} />
                    <Route
                      path="/documents"
                      element={
                        <PlaceholderPage
                          title="Documents"
                          description="Filed and shared documents."
                        />
                      }
                    />
                    <Route
                      path="/reports"
                      element={
                        <PlaceholderPage
                          title="Reports"
                          description="Periodic and ad-hoc reports."
                        />
                      }
                    />
                    <Route
                      path="/compliance"
                      element={
                        <PlaceholderPage
                          title="Compliance"
                          description="Obligations, deadlines and filing status."
                        />
                      }
                    />
                    <Route
                      path="/settings"
                      element={
                        <PlaceholderPage
                          title="Settings"
                          description="Account and portal settings."
                        />
                      }
                    />
                  </Route>
                </Route>

                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
            <Toaster richColors position="top-right" />
          </BrowserRouter>
        </TooltipProvider>
        {ReactQueryDevtools ? (
          <Suspense fallback={null}>
            <ReactQueryDevtools initialIsOpen={false} />
          </Suspense>
        ) : null}
      </QueryClientProvider>
    </ReduxProvider>
  )
}
