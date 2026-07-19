export function Footer() {
  return (
    <footer className="border-t">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            © {new Date().getFullYear()} My Blog. All rights reserved.
          </p>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Built with Next.js & Prisma
          </p>
        </div>
      </div>
    </footer>
  )
}
