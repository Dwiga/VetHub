import { useUser } from '@clerk/clerk-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useLang } from '@/contexts/LangContext'

export function SignupPrompt() {
  const { isSignedIn } = useUser()
  const { t } = useLang()

  if (isSignedIn) return null

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="py-6 text-center space-y-4">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">
            {t('signupPromptTitle') || 'Interested in managing your pet\'s records?'}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('signupPromptDesc') || 'Track vaccinations, visits, and health history — all in one place.'}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Button asChild className="w-full">
            <a href="/sign-up">{t('signupPromptSignUp') || 'Sign Up Free'}</a>
          </Button>
          <div className="flex gap-2">
            <Button asChild variant="outline" className="flex-1">
              <a href="/sign-in">{t('signupPromptSignIn') || 'Sign In'}</a>
            </Button>
            <Button asChild variant="ghost" className="flex-1">
              <a href="/">{t('signupPromptWhatIs') || 'What is PetHub?'}</a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
