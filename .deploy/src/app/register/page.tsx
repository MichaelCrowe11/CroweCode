import RegisterForm from '@/components/Auth/RegisterForm'
import Link from 'next/link'

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-950 to-black flex items-center justify-center px-5">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-white/60">Join CroweCode Platform</p>
        </div>
        
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8">
          <RegisterForm />
          
          <div className="mt-6 text-center">
            <p className="text-white/60 text-sm">
              Already have an account?{' '}
              <Link href="/login" className="text-emerald-500 hover:text-emerald-400">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}