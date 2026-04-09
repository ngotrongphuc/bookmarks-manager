type BreadcrumbItem = {
  id: string
  title: string
  icon?: string
}

type BreadcrumbProps = {
  path: BreadcrumbItem[]
  onNavigate: (id: string) => void
}

/** Breadcrumb trail for folder navigation */
export function Breadcrumb({ path, onNavigate }: BreadcrumbProps) {
  if (path.length <= 1) return null

  return (
    <nav className="flex items-center gap-1 px-4 py-2 text-sm">
      {path.map((item, index) => {
        const isLast = index === path.length - 1
        return (
          <span key={item.id} className="flex items-center gap-1">
            {index > 0 && <span className="text-white/30">/</span>}
            {isLast ? (
              <span className="font-medium text-white">
                {item.icon && `${item.icon} `}{item.title}
              </span>
            ) : (
              <button
                onClick={() => onNavigate(item.id)}
                className="text-white/50 transition-colors hover:text-white"
              >
                {item.icon && `${item.icon} `}{item.title}
              </button>
            )}
          </span>
        )
      })}
    </nav>
  )
}
