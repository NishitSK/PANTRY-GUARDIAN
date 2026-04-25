'use client'

import { useSignIn, useSignUp } from '@clerk/nextjs'

interface GoogleAuthButtonProps {
  mode: 'signIn' | 'signUp'
}

export function GoogleAuthButton({ mode }: GoogleAuthButtonProps) {
  const { signIn, isLoaded: isSignInLoaded } = useSignIn()
  const { signUp, isLoaded: isSignUpLoaded } = useSignUp()

  const handleGoogleAuth = () => {
    if (mode === 'signIn') {
      if (!isSignInLoaded) return
      signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/auth/sso-callback',
        redirectUrlComplete: '/dashboard',
      })
    } else {
      if (!isSignUpLoaded) return
      signUp.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/auth/sso-callback',
        redirectUrlComplete: '/dashboard',
      })
    }
  }

  return (
    <div className="w-full">
      <button 
        onClick={handleGoogleAuth}
        type="button"
        className="w-full flex items-center justify-center gap-3 rounded-none border-2 border-black bg-background py-4 font-ibm-mono text-[10px] uppercase tracking-[0.28em] text-textMain shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none mb-6"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.78 15.68 17.58V20.34H19.24C21.32 18.42 22.56 15.6 22.56 12.25Z" fill="#4285F4"/>
          <path d="M12 23C14.97 23 17.46 22.02 19.24 20.34L15.68 17.58C14.71 18.23 13.46 18.63 12 18.63C9.17 18.63 6.78 16.72 5.92 14.16H2.26V16.99C4.05 20.55 7.74 23 12 23Z" fill="#34A853"/>
          <path d="M5.92 14.16C5.7 13.51 5.58 12.77 5.58 12C5.58 11.23 5.7 10.49 5.92 9.84V7.01H2.26C1.53 8.47 1.11 10.18 1.11 12C1.11 13.82 1.53 15.53 2.26 16.99L5.92 14.16Z" fill="#FBBC05"/>
          <path d="M12 5.38C13.62 5.38 15.06 5.94 16.2 7.02L19.33 3.89C17.45 2.14 14.97 1.12 12 1.12C7.74 1.12 4.05 3.45 2.26 7.01L5.92 9.84C6.78 7.28 9.17 5.38 12 5.38Z" fill="#EA4335"/>
        </svg>
        {mode === 'signIn' ? 'Continue with Google' : 'Sign up with Google'}
      </button>
      
      <div className="relative flex items-center py-2 mb-6">
        <div className="flex-grow border-t-2 border-black"></div>
        <span className="flex-shrink-0 mx-4 font-ibm-mono text-[10px] uppercase tracking-[0.28em] text-textMuted">or continue with email</span>
        <div className="flex-grow border-t-2 border-black"></div>
      </div>
    </div>
  )
}
