import { Logo } from "@/components/brand/logo"
import { ThemeToggle } from "@/components/theme-toggle"

const HIGHLIGHTS = [
  "Company records, filings and documents in one place",
  "ISIN-based access for every listed company",
  "Administrator controls for onboarding and oversight",
]

/** Split layout shared by every signed-out screen. */
export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-svh lg:grid-cols-[1.1fr_1fr]">
      <BrandPanel />

      <div className="relative flex flex-col">
        <div className="absolute top-4 right-4 z-10">
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <Logo className="h-10" />
            </div>
            {children}
          </div>
        </div>

        <footer className="border-t px-4 py-4 text-center text-xs text-muted-foreground sm:px-8">
          &copy; {new Date().getFullYear()} Equivex. All rights reserved.
        </footer>
      </div>
    </div>
  )
}

function BrandPanel() {
  return (
    <div className="relative hidden overflow-hidden bg-brand-dark text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          backgroundImage:
            "radial-gradient(70rem 40rem at 110% -10%, #0061b2 0%, transparent 55%), radial-gradient(50rem 40rem at -20% 120%, #5e9b23 0%, transparent 60%)",
        }}
      />

      <div className="relative">
        <div className="inline-flex rounded-xl bg-white/95 px-5 py-3 shadow-lg">
          <Logo className="h-9 dark:invert-0 dark:hue-rotate-0" />
        </div>
      </div>

      <div className="relative max-w-lg space-y-6">
        <h2 className="text-4xl leading-tight font-semibold tracking-tight">
          Company management, end to end.
        </h2>
        <ul className="space-y-3">
          {HIGHLIGHTS.map((item) => (
            <li key={item} className="flex items-start gap-3 text-sm text-white/80">
              <span
                aria-hidden="true"
                className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent-green-light"
              />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <p className="relative text-xs text-white/50">
        Secure access for administrators and listed companies.
      </p>
    </div>
  )
}
