import { ArrowLeft } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

interface PageHeaderProps {
  title: string
  subtitle?: string
  back?: boolean
  backHref?: string
  action?: React.ReactNode
}

export function PageHeader({ title, subtitle, back, backHref, action }: PageHeaderProps) {
  const navigate = useNavigate()
  return (
    <div className="flex items-center gap-3 mb-6 pt-2">
      {back && (
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 -ml-2"
          data-testid="btn-back"
          onClick={() => {
            if (backHref) {
              navigate({ to: backHref as never })
            } else if (typeof history !== 'undefined') {
              history.back()
            }
          }}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      )}
      <div className="flex-1 min-w-0">
        <h1 className="text-xl font-bold text-foreground truncate">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
