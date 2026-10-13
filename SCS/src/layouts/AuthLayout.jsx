import { Outlet } from 'react-router-dom'
import { CheckCircle2, FileCheck2, ShieldCheck } from 'lucide-react'
import mabiniLogo from '@/assets/mabinilogo.jpg'
import mainBg from '@/assets/mainbg.png'

export function AuthLayout() {
  const services = [
    { icon: FileCheck2, label: 'Submit clearance requests online' },
    { icon: CheckCircle2, label: 'Track office approvals in real time' },
    { icon: ShieldCheck, label: 'Access records through a secure account' },
  ]

  return (
    <main className="flex min-h-screen flex-col bg-[#071f41] text-slate-950">
      <div className="h-1.5 bg-[linear-gradient(90deg,#0038a8_0_48%,#f8d348_48%_52%,#ce1126_52%_100%)]" />

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-[1180px] items-center gap-4 px-5 py-4 sm:px-8">
          <img
            alt="Mabini Colleges seal"
            className="h-14 w-14 shrink-0 object-contain sm:h-16 sm:w-16"
            src={mabiniLogo}
          />
          <div className="border-l border-slate-200 pl-4">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-[#a56a00] sm:text-xs">
              Official Campus Portal
            </p>
            <p className="mt-1 font-serif text-xl font-bold leading-none text-[#082b5c] sm:text-2xl">
              Mabini Colleges, Inc.
            </p>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              Student Clearance Management System
            </p>
          </div>
        </div>
      </header>

      <div className="bg-[#082b5c] text-white">
        <div className="mx-auto flex w-full max-w-[1180px] items-center justify-between px-5 py-2.5 text-xs sm:px-8">
          <p className="font-semibold uppercase tracking-[0.14em]">Online Services</p>
          <p className="hidden text-blue-100 sm:block">Daet, Camarines Norte</p>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-[1180px] flex-1 items-stretch lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative hidden min-h-[590px] overflow-hidden lg:block">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${mainBg})` }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,27,60,0.94)_0%,rgba(4,32,71,0.85)_62%,rgba(4,32,71,0.42)_100%)]" />

          <div className="relative flex h-full max-w-xl flex-col justify-center px-10 py-14 text-white xl:px-14">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-300">
              Office of Student Services
            </p>
            <h1 className="mt-4 font-serif text-4xl font-bold leading-tight xl:text-5xl">
              A simpler way to complete your student clearance.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-blue-100">
              Submit requirements, monitor each approval, and receive your final
              clearance through one official online service.
            </p>

            <div className="mt-9 border-t border-white/25 pt-6">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-blue-200">
                Available services
              </p>
              <ul className="space-y-3">
                {services.map((service) => {
                  const Icon = service.icon

                  return (
                    <li className="flex items-center gap-3 text-sm" key={service.label}>
                      <span className="flex h-8 w-8 items-center justify-center border border-amber-300/60 bg-amber-300/10 text-amber-300">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span>{service.label}</span>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </section>

        <section
          className="relative flex items-center justify-center overflow-hidden bg-cover bg-center px-5 py-10 sm:px-10 lg:py-14"
          style={{ backgroundImage: `url(${mainBg})` }}
        >
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(145deg,rgba(4,27,60,0.9)_0%,rgba(8,43,92,0.84)_52%,rgba(4,23,49,0.94)_100%)]" />
          <div className="relative z-10 flex w-full justify-center">
          <Outlet />
          </div>
        </section>
      </div>

      <footer className="border-t border-slate-300 bg-[#e3e8ef]">
        <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-1 px-5 py-4 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>© 2026 Mabini Colleges, Inc. All rights reserved.</p>
          <p>For authorized students and personnel only.</p>
        </div>
      </footer>
    </main>
  )
}
