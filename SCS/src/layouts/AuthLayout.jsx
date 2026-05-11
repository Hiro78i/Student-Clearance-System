import { Outlet } from 'react-router-dom'
import { CheckCircle2, Clock3, ShieldCheck } from 'lucide-react'
import mabiniLogo from '@/assets/mabinilogo.jpg'
import mainBg from '@/assets/mainbg.png'

export function AuthLayout() {
  const benefits = [
    {
      icon: ShieldCheck,
      title: 'Secure access',
    },
    {
      icon: Clock3,
      title: 'Real-time tracking',
    },
    {
      icon: CheckCircle2,
      title: 'Digital approvals',
    },
  ]

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4 sm:p-6 lg:p-8">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${mainBg})` }}
      />
      <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-[1px]" />
      <div className="relative grid h-[min(720px,92vh)] w-full max-w-[1100px] overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.18)] lg:grid-cols-[0.92fr_1.08fr]">
        <section className="relative hidden overflow-hidden bg-slate-950 p-7 text-white lg:flex lg:flex-col lg:justify-between xl:p-8">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${mainBg})` }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(3,10,30,0.94)_0%,rgba(8,28,66,0.86)_54%,rgba(13,54,114,0.78)_100%)]" />

          <div className="relative">
            <div className="inline-flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-3.5 py-3 shadow-lg shadow-blue-950/30 backdrop-blur">
              <img
                alt="Mabini logo"
                className="h-11 w-11 rounded-xl bg-white object-cover p-1"
                src={mabiniLogo}
              />
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-blue-100">
                  Mabini Colleges
                </p>
                <p className="text-sm font-semibold text-white">
                  Student Clearance System
                </p>
              </div>
            </div>

            <h1 className="mt-7 max-w-xl text-[2.45rem] font-bold leading-[1.05] tracking-normal text-white xl:text-[3.15rem]">
              Cloud-Based Student Clearance Management System
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-blue-100">
              A secure online portal for student clearance requests and office
              approvals.
            </p>
          </div>

          <div className="relative grid gap-2">
            {benefits.map((benefit) => {
              const Icon = benefit.icon

              return (
                <div
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur"
                  key={benefit.title}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-400/20 text-blue-100">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <p className="text-sm font-semibold text-white">{benefit.title}</p>
                </div>
              )
            })}
          </div>
        </section>

        <section className="flex min-h-0 items-center justify-center bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5 sm:p-6 lg:p-8">
          <Outlet />
        </section>
      </div>
    </main>
  )
}
