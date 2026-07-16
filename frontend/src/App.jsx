import {
  Activity,
  BarChart3,
  Camera,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Lock,
  LogOut,
  ClipboardCheck,
  Search,
  Server,
  ShieldAlert,
  UserPlus,
  Users,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Route, Routes, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  clearAuthToken,
  getSession,
  loginAdmin,
  logoutAdmin,
  registerAdmin,
} from '@/lib/auth'
import {
  getEmployeeAttendanceHistory,
  getAttendanceSummary,
  getMonthlyAttendanceReport,
  listAttendance,
  manualMarkAttendance,
} from '@/lib/attendance'
import {
  createCamera,
  listCameras,
  updateCameraStatus,
} from '@/lib/cameras'
import { getDashboardOverview } from '@/lib/dashboard'
import { createEmployee, listEmployees } from '@/lib/employees'
import {
  downloadDailyReport,
  downloadEmployeeReport,
  downloadMonthlyReport,
} from '@/lib/reports'
import { socket } from '@/lib/socket'

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

function notify(message, type = 'info') {
  window.dispatchEvent(
    new CustomEvent('app:toast', {
      detail: {
        id: `${Date.now()}-${Math.random()}`,
        message,
        type,
      },
    }),
  )
}

function ToastViewport() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    function handleToast(event) {
      const toast = event.detail
      setToasts((current) => [toast, ...current].slice(0, 4))
      window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== toast.id))
      }, 3500)
    }

    window.addEventListener('app:toast', handleToast)
    return () => window.removeEventListener('app:toast', handleToast)
  }, [])

  return (
    <div className="fixed right-4 top-4 z-50 flex w-[min(360px,calc(100vw-2rem))] flex-col gap-3">
      {toasts.map((toast) => (
        <div
          className={`rounded-lg border bg-white px-4 py-3 text-sm shadow-lg ${
            toast.type === 'error'
              ? 'border-red-200 text-red-800'
              : 'border-emerald-200 text-emerald-800'
          }`}
          key={toast.id}
        >
          <div className="flex items-start gap-2">
            {toast.type === 'error' ? (
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function StatusMessage({ children, tone = 'neutral' }) {
  if (!children) {
    return null
  }

  const styles =
    tone === 'error'
      ? 'border-red-200 bg-red-50 text-red-700'
      : 'border-slate-200 bg-white text-slate-600'

  return <p className={`rounded-md border px-3 py-2 text-sm ${styles}`}>{children}</p>
}

function LoadingMessage({ children = 'Loading...' }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      <span>{children}</span>
    </div>
  )
}

function EmptyState({ title, description }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm">
      <p className="font-medium text-slate-900">{title}</p>
      <p className="mt-1 text-slate-600">{description}</p>
    </div>
  )
}

function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-10">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Attendance Management
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight md:text-5xl">
            Face Recognition Attendance System
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
            Admin authentication, employee records, camera management,
            recognition hooks, and attendance marking are wired for local
            development.
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
            <Link to="/login">
              <Lock className="h-4 w-4" aria-hidden="true" />
              Admin Login
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/register">
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              Register Admin
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/dashboard">
              <BarChart3 className="h-4 w-4" aria-hidden="true" />
              Dashboard
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/employees">
              <Users className="h-4 w-4" aria-hidden="true" />
              Employees
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/attendance">
              <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
              Attendance
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/reports">
              <FileText className="h-4 w-4" aria-hidden="true" />
              Reports
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/cameras">
              <Camera className="h-4 w-4" aria-hidden="true" />
              Cameras
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/health">Setup Status</Link>
          </Button>
        </nav>
      </section>
    </main>
  )
}

function AuthForm({ mode }) {
  const navigate = useNavigate()
  const isRegister = mode === 'register'
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  })
  const [status, setStatus] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function updateField(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSubmitting(true)
    setStatus('')

    try {
      if (isRegister) {
        await registerAdmin(form)
        notify('Admin account created')
      } else {
        await loginAdmin({
          email: form.email,
          password: form.password,
        })
        notify('Login successful')
      }

      navigate('/session')
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.errors?.join(', ') ||
        'Authentication request failed'
      setStatus(message)
      notify(message, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-950">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md flex-col justify-center">
        <Link className="mb-8 text-sm font-medium text-emerald-700" to="/">
          Back
        </Link>
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold">
            {isRegister ? 'Register Admin' : 'Admin Login'}
          </h1>
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            {isRegister && (
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Name</span>
                <input
                  className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-emerald-700"
                  name="name"
                  onChange={updateField}
                  required
                  type="text"
                  value={form.name}
                />
              </label>
            )}
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Email</span>
              <input
                className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-emerald-700"
                name="email"
                onChange={updateField}
                required
                type="email"
                value={form.email}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Password</span>
              <input
                className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-emerald-700"
                minLength={8}
                name="password"
                onChange={updateField}
                required
                type="password"
                value={form.password}
              />
            </label>
            <StatusMessage tone="error">{status}</StatusMessage>
            <Button className="w-full" disabled={isSubmitting} type="submit">
              {isSubmitting ? 'Submitting...' : isRegister ? 'Create Admin' : 'Login'}
            </Button>
          </form>
        </div>
      </section>
    </main>
  )
}

function SessionPage() {
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [status, setStatus] = useState('Loading session...')

  useEffect(() => {
    getSession()
      .then((data) => {
        setSession(data.admin)
        setStatus('')
      })
      .catch(() => {
        clearAuthToken()
        setStatus('Session expired. Login again.')
      })
  }, [])

  async function handleLogout() {
    if (!window.confirm('Logout from this admin session?')) {
      return
    }

    await logoutAdmin().catch(() => clearAuthToken())
    notify('Logged out')
    navigate('/login')
  }

  return (
    <main className="min-h-screen bg-white px-6 py-10 text-slate-950">
      <section className="mx-auto max-w-3xl">
        <Link className="text-sm font-medium text-emerald-700" to="/">
          Back
        </Link>
        <div className="mt-6 rounded-lg border border-slate-200 p-6">
          <h1 className="text-3xl font-semibold">Protected Session</h1>
          {status && <div className="mt-4"><LoadingMessage>{status}</LoadingMessage></div>}
          {session && (
            <div className="mt-6 space-y-3 text-sm">
              <p>
                <span className="font-medium">Name:</span> {session.name}
              </p>
              <p>
                <span className="font-medium">Email:</span> {session.email}
              </p>
              <p>
                <span className="font-medium">Role:</span> {session.role}
              </p>
              <Button onClick={handleLogout} variant="outline">
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Logout
              </Button>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

function DashboardPage() {
  const [dashboard, setDashboard] = useState(null)
  const [events, setEvents] = useState([])
  const [status, setStatus] = useState('Loading dashboard...')

  async function loadDashboard() {
    setStatus('Loading dashboard...')

    try {
      const data = await getDashboardOverview()
      setDashboard(data.dashboard)
      setStatus('')
    } catch (error) {
      setStatus(error.response?.data?.message || 'Login required to view dashboard')
    }
  }

  useEffect(() => {
    loadDashboard()

    function addEvent(type, payload) {
      setEvents((current) =>
        [
          {
            id: `${type}-${Date.now()}`,
            type,
            payload,
            timestamp: payload?.timestamp || new Date().toISOString(),
          },
          ...current,
        ].slice(0, 8),
      )
    }

    socket.connect()
    socket.on('connect', () =>
      addEvent('socket:connected', {
        message: 'Realtime connection established',
      }),
    )
    socket.on('disconnect', () =>
      addEvent('socket:disconnected', {
        message: 'Realtime connection closed',
      }),
    )
    socket.on('attendance:marked', (payload) => addEvent('attendance:marked', payload))
    socket.on('camera:connected', (payload) => addEvent('camera:connected', payload))
    socket.on('camera:disconnected', (payload) =>
      addEvent('camera:disconnected', payload),
    )
    socket.on('recognition:started', (payload) =>
      addEvent('recognition:started', payload),
    )
    socket.on('recognition:success', (payload) =>
      addEvent('recognition:success', payload),
    )
    socket.on('recognition:failed', (payload) =>
      addEvent('recognition:failed', payload),
    )
    socket.on('employee:registered', (payload) =>
      addEvent('employee:registered', payload),
    )
    socket.on('employee:face_registered', (payload) =>
      addEvent('employee:face_registered', payload),
    )

    return () => {
      socket.off('connect')
      socket.off('disconnect')
      socket.off('attendance:marked')
      socket.off('camera:connected')
      socket.off('camera:disconnected')
      socket.off('recognition:started')
      socket.off('recognition:success')
      socket.off('recognition:failed')
      socket.off('employee:registered')
      socket.off('employee:face_registered')
      socket.disconnect()
    }
  }, [])

  const attendance = dashboard?.attendance
  const cameras = dashboard?.cameras
  const attendanceTotal = Math.max(attendance?.totalEmployees || 0, 1)
  const cameraTotal = Math.max(cameras?.total || 0, 1)

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-950">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Link className="text-sm font-medium text-emerald-700" to="/">
              Back
            </Link>
            <h1 className="mt-4 text-3xl font-semibold">Dashboard</h1>
          </div>
          <Button onClick={loadDashboard} variant="outline">
            Refresh
          </Button>
        </div>

        {status && <div className="mt-6"><LoadingMessage>{status}</LoadingMessage></div>}

        {dashboard && (
          <>
            <div className="mt-6 grid gap-4 md:grid-cols-5">
              {[
                ['Total Employees', attendance.totalEmployees],
                ['Present Today', attendance.present],
                ['Absent Today', attendance.absent],
                ['Pending Out', attendance.pendingPunchOut],
                ['Cameras Online', cameras.online],
              ].map(([label, value]) => (
                <div
                  className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
                  key={label}
                >
                  <p className="text-sm text-slate-600">{label}</p>
                  <p className="mt-2 text-3xl font-semibold">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_420px]">
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold">Attendance Overview</h2>
                <div className="mt-5 space-y-4">
                  {[
                    ['Present', attendance.present, 'bg-emerald-600'],
                    ['Absent', attendance.absent, 'bg-red-500'],
                    ['Completed', attendance.completed, 'bg-slate-900'],
                  ].map(([label, value, color]) => (
                    <div key={label}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span>{label}</span>
                        <span>{value}</span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full ${color}`}
                          style={{
                            width: `${Math.min((value / attendanceTotal) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold">Camera Status</h2>
                <div className="mt-5 space-y-4">
                  {[
                    ['Online', cameras.online, 'bg-emerald-600'],
                    ['Offline', cameras.offline, 'bg-amber-500'],
                    ['Disabled', cameras.disabled, 'bg-slate-400'],
                  ].map(([label, value, color]) => (
                    <div key={label}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span>{label}</span>
                        <span>{value}</span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full ${color}`}
                          style={{
                            width: `${Math.min((value / cameraTotal) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold">Recent Attendance</h2>
                <div className="mt-4 divide-y divide-slate-200">
                  {dashboard.recentActivity.map((item) => (
                    <div className="py-3" key={item._id}>
                      <p className="font-medium">
                        {item.employee?.fullName || 'Unknown employee'}
                      </p>
                      <p className="text-sm text-slate-600">
                        {item.punchOut ? 'Punch Out' : 'Punch In'} -{' '}
                        {new Date(item.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                  {dashboard.recentActivity.length === 0 && (
                    <EmptyState
                      title="No activity yet"
                      description="Attendance events will appear here after employees punch in or out."
                    />
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold">Live Activity</h2>
                <div className="mt-4 divide-y divide-slate-200">
                  {events.map((event) => (
                    <div className="py-3" key={event.id}>
                      <p className="font-medium">{event.type}</p>
                      <p className="text-sm text-slate-600">
                        {event.payload?.message ||
                          event.payload?.name ||
                          'Realtime event received'}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {new Date(event.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ))}
                  {events.length === 0 && (
                    <EmptyState
                      title="Waiting for live events"
                      description="Socket.IO activity will appear here when the backend emits events."
                    />
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  )
}

function EmployeesPage() {
  const [employees, setEmployees] = useState([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [form, setForm] = useState({
    employeeCode: '',
    fullName: '',
    email: '',
    phone: '',
    department: '',
    designation: '',
  })

  async function loadEmployees(params = {}) {
    setStatus('Loading employees...')

    try {
      const data = await listEmployees(params)
      setEmployees(data.items)
      setStatus('')
    } catch (error) {
      setStatus(error.response?.data?.message || 'Login required to view employees')
    }
  }

  useEffect(() => {
    loadEmployees()
  }, [])

  function updateField(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
  }

  async function handleSearch(event) {
    event.preventDefault()
    await loadEmployees({ search })
  }

  async function handleCreate(event) {
    event.preventDefault()

    try {
      await createEmployee(form)
      notify('Employee created')
      setForm({
        employeeCode: '',
        fullName: '',
        email: '',
        phone: '',
        department: '',
        designation: '',
      })
      await loadEmployees()
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.errors?.join(', ') ||
        'Employee creation failed'
      setStatus(message)
      notify(message, 'error')
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-950">
      <section className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Link className="text-sm font-medium text-emerald-700" to="/">
              Back
            </Link>
            <h1 className="mt-4 text-3xl font-semibold">Employees</h1>
          </div>
          <Button asChild variant="outline">
            <Link to="/session">Protected Session</Link>
          </Button>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[380px_1fr]">
          <form
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            onSubmit={handleCreate}
          >
            <h2 className="text-lg font-semibold">Register Employee</h2>
            <div className="mt-4 grid gap-3">
              {[
                ['employeeCode', 'Employee Code'],
                ['fullName', 'Full Name'],
                ['email', 'Email'],
                ['phone', 'Phone'],
                ['department', 'Department'],
                ['designation', 'Designation'],
              ].map(([name, label]) => (
                <label className="block" key={name}>
                  <span className="text-sm font-medium text-slate-700">
                    {label}
                  </span>
                  <input
                    className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-emerald-700"
                    name={name}
                    onChange={updateField}
                    required={['employeeCode', 'fullName', 'department'].includes(name)}
                    type={name === 'email' ? 'email' : 'text'}
                    value={form[name]}
                  />
                </label>
              ))}
            </div>
            <Button className="mt-5 w-full" type="submit">
              Create Employee
            </Button>
          </form>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <form className="flex gap-2" onSubmit={handleSearch}>
              <input
                className="h-10 min-w-0 flex-1 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-emerald-700"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, code, department, or email"
                type="search"
                value={search}
              />
              <Button type="submit">
                <Search className="h-4 w-4" aria-hidden="true" />
                Search
              </Button>
            </form>

            {status && <div className="mt-4"><StatusMessage>{status}</StatusMessage></div>}

            <div className="mt-5 divide-y divide-slate-200">
              {employees.map((employee) => (
                <div
                  className="flex flex-col gap-1 py-4 md:flex-row md:items-center md:justify-between"
                  key={employee._id}
                >
                  <div>
                    <p className="font-medium">{employee.fullName}</p>
                    <p className="text-sm text-slate-600">
                      {employee.employeeCode} - {employee.department}
                    </p>
                  </div>
                  <span className="text-sm capitalize text-slate-600">
                    {employee.status}
                  </span>
                </div>
              ))}
              {!status && employees.length === 0 && (
                <EmptyState
                  title="No employees found"
                  description="Create an employee record or adjust your search."
                />
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

function AttendancePage() {
  const [items, setItems] = useState([])
  const [summary, setSummary] = useState(null)
  const [employeeId, setEmployeeId] = useState('')
  const [historyEmployeeId, setHistoryEmployeeId] = useState('')
  const [historyItems, setHistoryItems] = useState([])
  const [monthlyReport, setMonthlyReport] = useState(null)
  const [filters, setFilters] = useState({
    date: '',
    from: '',
    to: '',
    status: '',
    department: '',
  })
  const [status, setStatus] = useState('')

  async function loadAttendance(params = filters) {
    setStatus('Loading attendance...')

    try {
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([, value]) => value),
      )
      const [logs, summaryResult] = await Promise.all([
        listAttendance(cleanParams),
        getAttendanceSummary(cleanParams.date ? { date: cleanParams.date } : {}),
      ])
      setItems(logs.items)
      setSummary(summaryResult.summary)
      setStatus('')
    } catch (error) {
      setStatus(error.response?.data?.message || 'Login required to view attendance')
    }
  }

  useEffect(() => {
    loadAttendance()
  }, [])

  function updateFilter(event) {
    setFilters((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
  }

  async function handleFilter(event) {
    event.preventDefault()
    await loadAttendance(filters)
  }

  async function loadHistory(event) {
    event.preventDefault()

    try {
      const data = await getEmployeeAttendanceHistory(historyEmployeeId, {
        from: filters.from,
        to: filters.to,
      })
      setHistoryItems(data.items)
      setStatus('')
    } catch (error) {
      setStatus(error.response?.data?.message || 'Attendance history failed')
    }
  }

  async function loadMonthlyReport() {
    const now = new Date()

    try {
      const data = await getMonthlyAttendanceReport({
        year: now.getFullYear(),
        month: now.getMonth() + 1,
      })
      setMonthlyReport(data.report)
      setStatus('')
    } catch (error) {
      setStatus(error.response?.data?.message || 'Monthly report failed')
    }
  }

  async function handleManualMark(event) {
    event.preventDefault()

    try {
      const result = await manualMarkAttendance({ employeeId })
      setStatus(result.message)
      notify(result.message)
      setEmployeeId('')
      await loadAttendance()
    } catch (error) {
      const message = error.response?.data?.message || 'Attendance mark failed'
      setStatus(message)
      notify(message, 'error')
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-950">
      <section className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Link className="text-sm font-medium text-emerald-700" to="/">
              Back
            </Link>
            <h1 className="mt-4 text-3xl font-semibold">Attendance</h1>
          </div>
          <Button onClick={() => loadAttendance()} variant="outline">
            Refresh
          </Button>
        </div>

        {summary && (
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {[
              ['Total', summary.totalEmployees],
              ['Present', summary.present],
              ['Absent', summary.absent],
              ['Pending Out', summary.pendingPunchOut],
            ].map(([label, value]) => (
              <div
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
                key={label}
              >
                <p className="text-sm text-slate-600">{label}</p>
                <p className="mt-2 text-3xl font-semibold">{value}</p>
              </div>
            ))}
          </div>
        )}

        <form
          className="mt-6 grid gap-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-5"
          onSubmit={handleFilter}
        >
          <input
            className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-emerald-700"
            name="date"
            onChange={updateFilter}
            type="date"
            value={filters.date}
          />
          <input
            className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-emerald-700"
            name="from"
            onChange={updateFilter}
            type="date"
            value={filters.from}
          />
          <input
            className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-emerald-700"
            name="to"
            onChange={updateFilter}
            type="date"
            value={filters.to}
          />
          <select
            className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-emerald-700"
            name="status"
            onChange={updateFilter}
            value={filters.status}
          >
            <option value="">All statuses</option>
            <option value="present">Present</option>
            <option value="late">Late</option>
            <option value="half_day">Half Day</option>
            <option value="pending">Pending</option>
          </select>
          <Button type="submit">Apply Filters</Button>
        </form>

        <div className="mt-6 grid gap-6 lg:grid-cols-[380px_1fr]">
          <form
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            onSubmit={handleManualMark}
          >
            <h2 className="text-lg font-semibold">Manual Test Mark</h2>
            <label className="mt-4 block">
              <span className="text-sm font-medium text-slate-700">Employee ID</span>
              <input
                className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-emerald-700"
                onChange={(event) => setEmployeeId(event.target.value)}
                required
                type="text"
                value={employeeId}
              />
            </label>
            <Button className="mt-5 w-full" type="submit">
              Mark Punch
            </Button>
            {status && <div className="mt-4"><StatusMessage>{status}</StatusMessage></div>}
          </form>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Recent Logs</h2>
            <div className="mt-4 divide-y divide-slate-200">
              {items.map((item) => (
                <div
                  className="flex flex-col gap-2 py-4 md:flex-row md:items-center md:justify-between"
                  key={item._id}
                >
                  <div>
                    <p className="font-medium">
                      {item.employee?.fullName || item.employee}
                    </p>
                    <p className="text-sm text-slate-600">
                      In: {item.punchIn ? new Date(item.punchIn).toLocaleString() : '-'}
                    </p>
                    <p className="text-sm text-slate-600">
                      Out:{' '}
                      {item.punchOut ? new Date(item.punchOut).toLocaleString() : '-'}
                    </p>
                  </div>
                  <span className="text-sm capitalize text-slate-600">
                    {item.status}
                  </span>
                </div>
              ))}
              {!status && items.length === 0 && (
                <EmptyState
                  title="No attendance logs found"
                  description="Attendance records will appear after a manual mark or recognition event."
                />
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <form
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            onSubmit={loadHistory}
          >
            <h2 className="text-lg font-semibold">Employee History</h2>
            <label className="mt-4 block">
              <span className="text-sm font-medium text-slate-700">Employee ID</span>
              <input
                className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-emerald-700"
                onChange={(event) => setHistoryEmployeeId(event.target.value)}
                required
                type="text"
                value={historyEmployeeId}
              />
            </label>
            <Button className="mt-4" type="submit">
              Load History
            </Button>
            <div className="mt-4 divide-y divide-slate-200">
              {historyItems.map((item) => (
                <div className="py-3 text-sm" key={item._id}>
                  <p>{new Date(item.date).toLocaleDateString()}</p>
                  <p className="text-slate-600">
                    {item.punchIn ? new Date(item.punchIn).toLocaleTimeString() : '-'} /{' '}
                    {item.punchOut ? new Date(item.punchOut).toLocaleTimeString() : '-'}
                  </p>
                </div>
              ))}
              {historyItems.length === 0 && (
                <EmptyState
                  title="No history loaded"
                  description="Enter an employee ID and load history."
                />
              )}
            </div>
          </form>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Monthly Report</h2>
              <Button onClick={loadMonthlyReport} type="button" variant="outline">
                Generate
              </Button>
            </div>
            {monthlyReport && (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="py-2">Employee</th>
                      <th className="py-2">Present</th>
                      <th className="py-2">Absent</th>
                      <th className="py-2">Hours</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {monthlyReport.rows.map((row) => (
                      <tr key={row.employee.id}>
                        <td className="py-2">{row.employee.fullName}</td>
                        <td className="py-2">{row.presentDays}</td>
                        <td className="py-2">{row.absentDays}</td>
                        <td className="py-2">{row.totalWorkingHours}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}

function CamerasPage() {
  const [cameras, setCameras] = useState([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [form, setForm] = useState({
    name: '',
    location: '',
    source: '0',
    type: 'webcam',
  })

  async function loadCameras(params = {}) {
    setStatus('Loading cameras...')

    try {
      const data = await listCameras(params)
      setCameras(data.items)
      setStatus('')
    } catch (error) {
      setStatus(error.response?.data?.message || 'Login required to view cameras')
    }
  }

  useEffect(() => {
    loadCameras()
  }, [])

  function updateField(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
  }

  async function handleCreate(event) {
    event.preventDefault()

    try {
      await createCamera(form)
      notify('Camera registered')
      setForm({
        name: '',
        location: '',
        source: '0',
        type: 'webcam',
      })
      await loadCameras()
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.errors?.join(', ') ||
        'Camera creation failed'
      setStatus(message)
      notify(message, 'error')
    }
  }

  async function handleSearch(event) {
    event.preventDefault()
    await loadCameras({ search })
  }

  async function handleStatusChange(id, nextStatus) {
    if (
      nextStatus === 'disabled' &&
      !window.confirm('Disable this camera until it is manually re-enabled?')
    ) {
      return
    }

    try {
      await updateCameraStatus(id, nextStatus)
      notify(`Camera marked ${nextStatus}`)
      await loadCameras({ search })
    } catch (error) {
      const message = error.response?.data?.message || 'Camera status update failed'
      setStatus(message)
      notify(message, 'error')
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-950">
      <section className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Link className="text-sm font-medium text-emerald-700" to="/">
              Back
            </Link>
            <h1 className="mt-4 text-3xl font-semibold">Cameras</h1>
          </div>
          <Button onClick={() => loadCameras({ search })} variant="outline">
            Refresh
          </Button>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[380px_1fr]">
          <form
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            onSubmit={handleCreate}
          >
            <h2 className="text-lg font-semibold">Register Camera</h2>
            <div className="mt-4 grid gap-3">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Name</span>
                <input
                  className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-emerald-700"
                  name="name"
                  onChange={updateField}
                  required
                  type="text"
                  value={form.name}
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Location</span>
                <input
                  className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-emerald-700"
                  name="location"
                  onChange={updateField}
                  required
                  type="text"
                  value={form.location}
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Source</span>
                <input
                  className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-emerald-700"
                  name="source"
                  onChange={updateField}
                  required
                  type="text"
                  value={form.source}
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Type</span>
                <select
                  className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-emerald-700"
                  name="type"
                  onChange={updateField}
                  value={form.type}
                >
                  <option value="webcam">Webcam</option>
                  <option value="ip_camera">IP Camera</option>
                  <option value="iriun">Iriun</option>
                  <option value="other">Other</option>
                </select>
              </label>
            </div>
            <Button className="mt-5 w-full" type="submit">
              Create Camera
            </Button>
          </form>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <form className="flex gap-2" onSubmit={handleSearch}>
              <input
                className="h-10 min-w-0 flex-1 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-emerald-700"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, location, or source"
                type="search"
                value={search}
              />
              <Button type="submit">
                <Search className="h-4 w-4" aria-hidden="true" />
                Search
              </Button>
            </form>

            {status && <div className="mt-4"><StatusMessage>{status}</StatusMessage></div>}

            <div className="mt-5 divide-y divide-slate-200">
              {cameras.map((cameraItem) => (
                <div className="py-4" key={cameraItem._id}>
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-medium">{cameraItem.name}</p>
                      <p className="text-sm text-slate-600">
                        {cameraItem.location} - {cameraItem.type}
                      </p>
                      <p className="text-sm text-slate-600">
                        Source: {cameraItem.source}
                      </p>
                    </div>
                    <span className="text-sm capitalize text-slate-600">
                      {cameraItem.status}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {['online', 'offline', 'disabled'].map((nextStatus) => (
                      <Button
                        key={nextStatus}
                        onClick={() => handleStatusChange(cameraItem._id, nextStatus)}
                        type="button"
                        variant={cameraItem.status === nextStatus ? 'default' : 'outline'}
                      >
                        {nextStatus}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
              {!status && cameras.length === 0 && (
                <EmptyState
                  title="No cameras found"
                  description="Register a webcam, IP camera, Iriun source, or another camera source."
                />
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

function ReportsPage() {
  const now = new Date()
  const [format, setFormat] = useState('csv')
  const [dailyDate, setDailyDate] = useState(now.toISOString().slice(0, 10))
  const [month, setMonth] = useState(String(now.getMonth() + 1))
  const [year, setYear] = useState(String(now.getFullYear()))
  const [employeeId, setEmployeeId] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [status, setStatus] = useState('')

  async function runDownload(action, successMessage) {
    setStatus('Preparing report...')

    try {
      await action()
      setStatus(successMessage)
      notify(successMessage)
    } catch (error) {
      const message = error.response?.data?.message || 'Report download failed'
      setStatus(message)
      notify(message, 'error')
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-950">
      <section className="mx-auto max-w-5xl">
        <Link className="text-sm font-medium text-emerald-700" to="/">
          Back
        </Link>
        <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Reports</h1>
            <p className="mt-2 text-sm text-slate-600">
              Export attendance reports as CSV, Excel-compatible XLS, PDF, or JSON.
            </p>
          </div>
          <select
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-700"
            onChange={(event) => setFormat(event.target.value)}
            value={format}
          >
            <option value="csv">CSV</option>
            <option value="excel">Excel</option>
            <option value="pdf">PDF</option>
            <option value="json">JSON</option>
          </select>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Daily Report</h2>
            <label className="mt-4 block">
              <span className="text-sm font-medium text-slate-700">Date</span>
              <input
                className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-emerald-700"
                onChange={(event) => setDailyDate(event.target.value)}
                type="date"
                value={dailyDate}
              />
            </label>
            <Button
              className="mt-5 w-full"
              onClick={() =>
                runDownload(
                  () => downloadDailyReport({ date: dailyDate, format }),
                  'Daily report downloaded',
                )
              }
              type="button"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Download
            </Button>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Monthly Report</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Month</span>
                <input
                  className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-emerald-700"
                  max="12"
                  min="1"
                  onChange={(event) => setMonth(event.target.value)}
                  type="number"
                  value={month}
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Year</span>
                <input
                  className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-emerald-700"
                  onChange={(event) => setYear(event.target.value)}
                  type="number"
                  value={year}
                />
              </label>
            </div>
            <Button
              className="mt-5 w-full"
              onClick={() =>
                runDownload(
                  () => downloadMonthlyReport({ month, year, format }),
                  'Monthly report downloaded',
                )
              }
              type="button"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Download
            </Button>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Employee Report</h2>
            <label className="mt-4 block">
              <span className="text-sm font-medium text-slate-700">Employee ID</span>
              <input
                className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-emerald-700"
                onChange={(event) => setEmployeeId(event.target.value)}
                type="text"
                value={employeeId}
              />
            </label>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <input
                className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-emerald-700"
                onChange={(event) => setFrom(event.target.value)}
                type="date"
                value={from}
              />
              <input
                className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-emerald-700"
                onChange={(event) => setTo(event.target.value)}
                type="date"
                value={to}
              />
            </div>
            <Button
              className="mt-5 w-full"
              disabled={!employeeId}
              onClick={() =>
                runDownload(
                  () => downloadEmployeeReport(employeeId, { from, to, format }),
                  'Employee report downloaded',
                )
              }
              type="button"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Download
            </Button>
          </div>
        </div>

        {status && <div className="mt-6"><StatusMessage>{status}</StatusMessage></div>}
      </section>
    </main>
  )
}

function NotFoundPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-950">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-xl flex-col justify-center">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <ShieldAlert className="h-8 w-8 text-emerald-700" aria-hidden="true" />
          <h1 className="mt-4 text-3xl font-semibold">Page Not Found</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            The requested screen does not exist in this attendance system.
          </p>
          <Button asChild className="mt-6">
            <Link to="/">Go Home</Link>
          </Button>
        </div>
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
    <>
      <ToastViewport />
      <Routes>
        <Route element={<HomePage />} path="/" />
        <Route element={<AuthForm mode="login" />} path="/login" />
        <Route element={<AuthForm mode="register" />} path="/register" />
        <Route element={<SessionPage />} path="/session" />
        <Route element={<DashboardPage />} path="/dashboard" />
        <Route element={<EmployeesPage />} path="/employees" />
        <Route element={<AttendancePage />} path="/attendance" />
        <Route element={<CamerasPage />} path="/cameras" />
        <Route element={<ReportsPage />} path="/reports" />
        <Route element={<HealthPage />} path="/health" />
        <Route element={<NotFoundPage />} path="*" />
      </Routes>
    </>
  )
}
