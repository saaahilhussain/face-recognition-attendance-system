import { Activity, Camera, Server } from 'lucide-react'
import { Link, Route, Routes } from 'react-router-dom'
import { Button } from '@/components/ui/button'

const statusItems = [
  {
    label: 'Frontend',
    value: 'Vite React ready',
    icon: Activity,
  },
  {
    label: 'Backend API',
    value: import.meta.env.VITE_API_URL || 'http://localhost:5000',
    icon: Server,
  },
  {
    label: 'Socket.IO',
    value: import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000',
    icon: Camera,
  },
]

function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-10">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Phase 1 Foundation
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight md:text-5xl">
            Face Recognition Attendance System
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
            React, Express, Socket.IO, MongoDB, and FastAPI scaffolds are ready for
            the next implementation phase.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {statusItems.map((item) => {
            const Icon = item.icon
            return (
              <div
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
                key={item.label}
              >
                <Icon className="h-6 w-6 text-emerald-700" aria-hidden="true" />
                <h2 className="mt-4 text-lg font-semibold">{item.label}</h2>
                <p className="mt-2 break-words text-sm text-slate-600">
                  {item.value}
                </p>
              </div>
            )
          })}
        </div>

        <nav className="mt-8 flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/health">View Setup Status</Link>
          </Button>
          <Button asChild variant="outline">
            <a href="/">Dashboard Shell</a>
          </Button>
        </nav>
      </section>
    </main>
  )
}

function HealthPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-10 text-slate-950">
      <section className="mx-auto max-w-4xl">
        <Link className="text-sm font-medium text-emerald-700" to="/">
          Back
        </Link>
        <h1 className="mt-6 text-3xl font-semibold">Setup Status</h1>
        <div className="mt-6 rounded-lg border border-slate-200">
          {statusItems.map((item) => (
            <div
              className="flex flex-col gap-1 border-b border-slate-200 p-4 last:border-b-0 md:flex-row md:items-center md:justify-between"
              key={item.label}
            >
              <span className="font-medium">{item.label}</span>
              <span className="break-words text-sm text-slate-600">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}

export default function App() {
  return (
    <Routes>
      <Route element={<HomePage />} path="/" />
      <Route element={<HealthPage />} path="/health" />
    </Routes>
  )
}
