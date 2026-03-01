export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-rose-500 text-white text-2xl font-bold shadow-lg mb-4">
            K
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Kith</h1>
          <p className="text-slate-500 mt-1 text-sm">Nurture the relationships that matter most</p>
        </div>
        {children}
      </div>
    </div>
  )
}
