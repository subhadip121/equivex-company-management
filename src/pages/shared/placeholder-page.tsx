import { Construction } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent } from "@/components/ui/card"

export function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="rounded-full bg-muted p-3">
            <Construction className="size-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">This section is not built yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            The screen is wired into navigation and ready for its content.
          </p>
        </CardContent>
      </Card>
    </>
  )
}
