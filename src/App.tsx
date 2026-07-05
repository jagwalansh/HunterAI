import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { api, createMockToken } from './lib/api'
import type { JobMatch, Profile } from './types'

gsap.registerPlugin(ScrollTrigger)

const steps = [
  ['Upload', 'Add a resume, LinkedIn PDF, or portfolio notes in one pass.'],
  ['Extract', 'The system separates skills, projects, impact, tools, and context.'],
  ['Match', 'Roles are ranked by fit, gaps, evidence strength, and timing.'],
]

const features = [
  ['Universal profile', 'One canonical career profile that can shape resumes, applications, and job board data.'],
  ['Match scoring', 'See fit, gaps, and leverage before deciding whether a role deserves time.'],
  ['Skill graph', 'A map of adjacent skills, seniority signals, missing terms, and evidence density.'],
  ['Auto-apply', 'Queue tailored applications with the strongest proof already attached.'],
  ['Alerts', 'Get quiet notifications when a role matches your actual momentum.'],
]

function Icon({ name }: { name: 'search' | 'bell' | 'upload' | 'filter' | 'arrow' | 'check' | 'refresh' | 'bookmark' }) {
  const paths = {
    search: <><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4" /></>,
    bell: <><path d="M18 15H6l1.2-1.8V9a4.8 4.8 0 0 1 9.6 0v4.2L18 15Z" /><path d="M10 18h4" /></>,
    upload: <><path d="M12 16V5" /><path d="m8 9 4-4 4 4" /><path d="M5 19h14" /></>,
    filter: <><path d="M5 7h14" /><path d="M8 12h8" /><path d="M10 17h4" /></>,
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    check: <path d="m5 12 4 4 10-10" />,
    refresh: <><path d="M20 12a8 8 0 0 1-13.5 5.8" /><path d="M4 12A8 8 0 0 1 17.5 6.2" /><path d="M17 2v5h-5" /><path d="M7 22v-5h5" /></>,
    bookmark: <path d="M7 5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16l-5-3-5 3Z" />,
  }

  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" viewBox="0 0 24 24">
      {paths[name]}
    </svg>
  )
}

const workflowPath =
  'M522 205 C604 220 625 292 575 370 C535 433 565 470 640 492 C704 511 752 529 780 565 C830 635 740 690 602 676 C500 666 430 642 410 714 C398 754 406 784 430 800'

const graphNodes = [
  { id: 'core', label: 'HUNTER CORE', x: 490, y: 350, anchor: 'middle', shape: 'core', tone: 'green', labelX: 0, labelY: -64, phase: 0.2, speed: 0.42, amp: 3 },
  { id: 'node', label: 'Node.js', x: 302, y: 178, anchor: 'end', shape: 'circle', tone: 'purple', labelX: -22, labelY: -22, phase: 0.6, speed: 0.52, amp: 7 },
  { id: 'leadership', label: 'Leadership', x: 480, y: 96, anchor: 'middle', shape: 'circle', tone: 'purple', labelX: 0, labelY: -28, phase: 1.4, speed: 0.46, amp: 6 },
  { id: 'modeling', label: 'Data Modeling', x: 650, y: 145, anchor: 'start', shape: 'circle', tone: 'purple', labelX: 24, labelY: -18, phase: 2.2, speed: 0.5, amp: 7 },
  { id: 'cicd', label: 'CI/CD', x: 763, y: 290, anchor: 'start', shape: 'circle', tone: 'purple', labelX: 24, labelY: 2, phase: 2.9, speed: 0.44, amp: 6 },
  { id: 'product', label: 'Product', x: 742, y: 462, anchor: 'start', shape: 'circle', tone: 'purple', labelX: 24, labelY: 18, phase: 3.7, speed: 0.48, amp: 7 },
  { id: 'python', label: 'Python', x: 612, y: 596, anchor: 'middle', shape: 'circle', tone: 'purple', labelX: 0, labelY: 42, phase: 4.5, speed: 0.43, amp: 6 },
  { id: 'react', label: 'React', x: 432, y: 620, anchor: 'middle', shape: 'circle', tone: 'purple', labelX: 0, labelY: 42, phase: 5.2, speed: 0.5, amp: 6 },
  { id: 'typescript', label: 'TypeScript', x: 270, y: 525, anchor: 'end', shape: 'circle', tone: 'purple', labelX: -22, labelY: 24, phase: 5.9, speed: 0.47, amp: 7 },
  { id: 'systems', label: 'Systems Design', x: 215, y: 342, anchor: 'end', shape: 'circle', tone: 'purple', labelX: -22, labelY: 4, phase: 6.6, speed: 0.45, amp: 6 },
] as const

const graphLinks = [
  ['core', 'node', 'dashed'],
  ['core', 'leadership', 'solid'],
  ['core', 'modeling', 'solid'],
  ['core', 'cicd', 'dashed'],
  ['core', 'product', 'solid'],
  ['core', 'python', 'dashed'],
  ['core', 'react', 'solid'],
  ['core', 'typescript', 'dashed'],
  ['core', 'systems', 'solid'],
  ['node', 'product', 'soft'],
  ['leadership', 'python', 'soft'],
  ['modeling', 'systems', 'soft'],
  ['cicd', 'react', 'soft'],
  ['systems', 'react', 'soft'],
  ['typescript', 'node', 'soft'],
] as const

function SkillGraph() {
  const nodes = Object.fromEntries(graphNodes.map((node) => [node.id, node]))

  return (
    <div className="skill-graph-wrap reveal relative mx-auto mt-16 w-[min(52rem,94vw)] md:mt-0">
      <svg
        className="skill-graph h-auto w-full overflow-visible"
        viewBox="0 0 980 700"
        role="img"
        aria-label="Network map connecting Hunter Core to skill intelligence layers and infrastructure"
      >
        <defs>
          <filter id="networkGlow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {graphLinks.map(([from, to, type]) => (
          <line
            key={`${from}-${to}`}
            className={`graph-line graph-line-${type}`}
            data-from={from}
            data-to={to}
            x1={nodes[from].x}
            y1={nodes[from].y}
            x2={nodes[to].x}
            y2={nodes[to].y}
          />
        ))}

        <g className="graph-core-frame" transform="translate(490 350)">
          <path d="M-72-72h34M-72-72v34M72-72h-34M72-72v34M-72 72h34M-72 72v-34M72 72h-34M72 72v-34" />
        </g>

        {graphNodes.map((node) => (
          <g
            key={node.id}
            className={`graph-node-group graph-node-${node.shape} graph-node-${node.tone}`}
            data-node-id={node.id}
            data-x={node.x}
            data-y={node.y}
            data-phase={node.phase}
            data-speed={node.speed}
            data-amp={node.amp}
            transform={`translate(${node.x} ${node.y})`}
          >
            {node.shape === 'circle' && <circle className="graph-node-shape" r="12" />}
            {node.shape === 'core' && (
              <>
                <circle className="graph-core-glow" r="28" />
                <circle className="graph-node-shape" r="22" />
                <text className="graph-core-mark" textAnchor="middle" dominantBaseline="middle" x="0" y="1" fontSize="18" fontWeight="700">
                  H
                </text>
              </>
            )}
            {node.label && (
            <text
                className="graph-label"
                x={node.labelX}
                y={node.labelY}
                textAnchor={node.anchor}
              >
                {node.label.split('\n').map((line, index) => (
                  <tspan key={line} x={node.labelX} dy={index === 0 ? 0 : 22}>
                    {line}
                  </tspan>
                ))}
            </text>
            )}
          </g>
        ))}

        <text className="graph-core-copy" x="490" y="430" textAnchor="middle">
          <tspan x="490">Unified profile system</tspan>
          <tspan x="490" dy="22">AI-powered extraction</tspan>
          <tspan x="490" dy="22">Central skill layer</tspan>
        </text>
      </svg>
    </div>
  )
}

function DashboardMock() {
  return (
    <div className="dashboard glass-panel relative z-10 mx-auto mt-12 grid h-[30rem] w-[min(70rem,92vw)] grid-cols-[13.5rem_1fr] overflow-hidden rounded-[1.05rem] text-left md:mt-16">
      <aside className="side-rail hidden p-6 text-white md:block">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-full bg-white text-sm font-black text-[var(--black)]">H</span>
          <div>
            <p className="text-sm font-semibold">Hunter AI</p>
            <p className="text-xs text-white/58">skill assets</p>
          </div>
        </div>
        <div className="mt-7 rounded-md bg-white/12 px-3 py-2 text-xs text-white/72">Search profile</div>
        <div className="mt-8 space-y-4 text-sm text-white/72">
          {['Dashboard', 'Skill graph', 'Applications', 'Saved roles', 'Reports'].map((item, index) => (
            <div key={item} className={`flex items-center hover:bg-black/20 hover:transition-all p-2 rounded-2xl justify-between ${index === 0 ? 'text-white' : ''}`}>
              <span>{item}</span>
              {index === 0 && <span className="rounded-full  bg-white/18 px-2 py-0.5 text-xs">12</span>}
            </div>
          ))}
        </div>
      </aside>

      <div className="relative col-span-2 p-5 md:col-span-1 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.16em] text-[var(--stone)]">career signal</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-.03em] md:text-3xl">Shaurya Mishra</h2>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded-full border border-[var(--line)] bg-white px-3 py-2">Q4 roles</span>
            <span className="rounded-full bg-[var(--black)] px-3 py-2 text-white">Live</span>
          </div>
        </div>

        <div className="mt-9">
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-[var(--stone)]">role match control</p>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <span className="numeric text-5xl font-semibold tracking-[-.05em] md:text-6xl">87.4%</span>
            <span className="mb-2 rounded-full bg-[var(--paper)] px-3 py-1 text-xs font-semibold text-[var(--charcoal)]">+14.8 fit gain</span>
          </div>
        </div>

        <div className="mt-8 grid gap-3 md:grid-cols-3">
          {[
            ['Python', '28,500'],
            ['Product analytics', '35,200'],
            ['Workflow design', '24,300'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-[var(--line)] bg-white/56 p-4">
              <p className="numeric text-2xl font-semibold tracking-[-.04em]">{value}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">{label}</p>
            </div>
          ))}
        </div>

        <div className="mt-9 h-28 overflow-hidden rounded-lg border border-[var(--line)] bg-white/46 p-4">
          <div className="flex h-full items-end gap-[3px]">
            {Array.from({ length: 82 }).map((_, index) => (
              <span
                key={index}
                className="block flex-1 rounded-t bg-[var(--black)]/18"
                style={{ height: `${24 + ((index * 13) % 68)}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function getTimeOfDay() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function getInitials(profile: Profile | null) {
  if (!profile) return 'GU'
  const name = profile.name || profile.email || 'Guest User'
  return name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function getProfileCompletion(profile: Profile | null) {
  if (!profile) return 0
  const fields = [profile.skills, profile.education, profile.experience, profile.projects]
  return Math.round((fields.filter((value) => value?.length).length / fields.length) * 100)
}

function collectMissingSkills(matches: JobMatch[]) {
  const counts = new Map<string, number>()
  matches.forEach((match) => {
    match.missing_skills?.forEach((skill) => counts.set(skill, (counts.get(skill) || 0) + 1))
  })
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
}

function EmptyDashboard({ onUpload }: { onUpload: (file: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="dashboard-panel mx-auto mt-16 max-w-xl p-8 text-center md:p-12">
      <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-[var(--black)] text-white">
        <Icon name="upload" />
      </div>
      <h1 className="mt-7 text-4xl font-semibold tracking-[-.055em]">No resume yet.</h1>
      <p className="mx-auto mt-4 max-w-md leading-7 text-[var(--muted)]">
        The real HunterAI dashboard starts after the backend parses your resume into a profile. Upload a PDF and it will call the existing `/file/upload/resume` API.
      </p>
      <input
        ref={inputRef}
        accept="application/pdf"
        className="sr-only"
        type="file"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) onUpload(file)
        }}
      />
      <button className="focusable magnet mt-8 inline-flex items-center gap-2 rounded-full bg-[var(--black)] px-5 py-3 font-semibold text-white" type="button" onClick={() => inputRef.current?.click()}>
        <Icon name="upload" />
        Upload resume
      </button>
    </div>
  )
}

function MatchRow({
  match,
  saved,
  onToggleSave,
}: {
  match: JobMatch
  saved: boolean
  onToggleSave: (match: JobMatch) => void
}) {
  return (
    <article className="grid gap-4 px-5 py-5 transition hover:bg-white/42 md:grid-cols-[1fr_5rem_7rem_5.5rem] md:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold">{match.job_title}</p>
          {match.source && <span className="rounded-md bg-white px-2 py-0.5 text-[0.68rem] font-bold uppercase tracking-[.08em] text-[var(--stone)]">{match.source}</span>}
        </div>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {[match.company, match.location, match.duration].filter(Boolean).join(' · ') || 'Details on application'}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {match.matched_skills?.slice(0, 4).map((skill) => (
            <span key={skill} className="rounded-md bg-white/72 px-2 py-1 text-xs font-semibold text-[var(--charcoal)]">{skill}</span>
          ))}
        </div>
      </div>
      <p className="numeric text-2xl font-semibold tracking-[-.04em]">{Math.round(match.score)}%</p>
      <p className="text-sm font-semibold text-[var(--charcoal)]">{match.stipend || 'Negotiable'}</p>
      <div className="flex items-center gap-2">
        {match.id && (
          <button className={`focusable dashboard-icon-button ${saved ? 'bg-white text-[var(--black)]' : ''}`} type="button" aria-label={saved ? 'Unsave internship' : 'Save internship'} onClick={() => onToggleSave(match)}>
            <Icon name="bookmark" />
          </button>
        )}
        {match.url ? (
          <a className="focusable dashboard-icon-button" href={match.url} target="_blank" rel="noreferrer" aria-label="Open internship">
            <Icon name="arrow" />
          </a>
        ) : null}
      </div>
    </article>
  )
}

function DashboardPage() {
  const [view, setView] = useState('matches')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [matches, setMatches] = useState<JobMatch[]>([])
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set())
  const [keyword, setKeyword] = useState('')
  const [location, setLocation] = useState('')
  const [remoteOnly, setRemoteOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const loadDashboard = async (filters?: { keyword?: string; location?: string; remoteOnly?: boolean }) => {
    setError('')
    const isRefresh = Boolean(filters)
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      api.setToken(createMockToken())
      const profiles = await api.getProfiles()
      const selectedEmail = localStorage.getItem('selectedProfileEmail')
      const selectedProfile = profiles.find((item) => item.email === selectedEmail) || profiles.at(-1) || null
      setProfile(selectedProfile)

      if (!selectedProfile) {
        setMatches([])
        setSavedIds(new Set())
        return
      }

      const [nextMatches, saved] = await Promise.all([
        api.getMatches({
          email: selectedProfile.email,
          keyword: filters?.keyword?.trim() || undefined,
          location: filters?.location?.trim() || undefined,
          remoteOnly: filters?.remoteOnly,
        }),
        api.getSavedInternships().catch(() => []),
      ])

      setMatches(nextMatches || [])
      setSavedIds(new Set(saved.map((job) => job.id).filter((id): id is number => typeof id === 'number')))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load dashboard'
      setError(`${message}. Make sure the HunterAI backend is running at http://127.0.0.1:8000.`)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDashboard()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [])

  const uploadResume = async (file: File) => {
    setUploading(true)
    setError('')
    try {
      api.setToken(createMockToken())
      const data = await api.uploadResume(file)
      if (data.profile?.email) {
        localStorage.setItem('selectedProfileEmail', data.profile.email)
      }
      await loadDashboard()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed'
      setError(`${message}. The backend parser must be running for resume upload.`)
    } finally {
      setUploading(false)
    }
  }

  const toggleSave = async (match: JobMatch) => {
    if (!match.id) return
    const next = new Set(savedIds)
    try {
      if (next.has(match.id)) {
        next.delete(match.id)
        setSavedIds(next)
        await api.unsaveInternship(match.id)
      } else {
        next.add(match.id)
        setSavedIds(next)
        await api.saveInternship(match.id)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not update saved internships'
      setError(message)
      await loadDashboard({ keyword, location, remoteOnly })
    }
  }

  const topMatches = [...matches].sort((a, b) => b.score - a.score)
  const avgScore = matches.length ? Math.round(matches.reduce((sum, match) => sum + match.score, 0) / matches.length) : 0
  const bestScore = topMatches[0]?.score ? Math.round(topMatches[0].score) : 0
  const completion = getProfileCompletion(profile)
  const missingSkills = collectMissingSkills(matches)
  const firstName = profile?.name?.split(' ')[0] || profile?.email?.split('@')[0] || 'there'
  const uploadInputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="dashboard-page min-h-screen bg-[var(--paper)] text-[var(--black)]">
      <a className="focusable sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-white focus:px-4 focus:py-2" href="#dashboard-main">
        Skip to dashboard
      </a>

      <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[rgba(233,233,233,.86)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[96rem] items-center justify-between px-4 md:px-8">
          <a href="#" className="text-2xl font-black tracking-tight">HunterAI</a>
          <nav className="hidden items-center rounded-full bg-white/58 p-1 text-sm font-semibold md:flex" aria-label="Dashboard views">
            {['matches', 'skills', 'saved'].map((item) => (
              <button
                key={item}
                className={`focusable rounded-full px-4 py-2 capitalize transition ${view === item ? 'bg-[var(--black)] text-white shadow-[0_12px_30px_rgba(5,5,5,.18)]' : 'text-[var(--muted)] hover:text-[var(--black)]'}`}
                type="button"
                onClick={() => setView(item)}
              >
                {item}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button className="focusable dashboard-icon-button" type="button" aria-label="Search">
              <Icon name="search" />
            </button>
            <button className="focusable dashboard-icon-button" type="button" aria-label="Notifications">
              <Icon name="bell" />
            </button>
            <input
              ref={uploadInputRef}
              accept="application/pdf"
              className="sr-only"
              type="file"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) void uploadResume(file)
              }}
            />
            <button className="focusable magnet hidden items-center gap-2 rounded-full bg-[var(--black)] px-4 py-2 text-sm font-semibold text-white md:flex" type="button" onClick={() => uploadInputRef.current?.click()} disabled={uploading}>
              <Icon name="upload" />
              {uploading ? 'Parsing...' : 'Import resume'}
            </button>
          </div>
        </div>
      </header>

      {loading ? (
        <main className="mx-auto max-w-[96rem] px-4 py-8 md:px-8">
          <div className="dashboard-panel p-7">
            <div className="h-10 w-72 animate-pulse rounded-lg bg-white/70" />
            <div className="mt-8 grid gap-3 md:grid-cols-4">
              {[0, 1, 2, 3].map((item) => <div key={item} className="h-28 animate-pulse rounded-xl bg-white/54" />)}
            </div>
            <div className="mt-5 h-80 animate-pulse rounded-xl bg-white/54" />
          </div>
        </main>
      ) : !profile ? (
        <main className="mx-auto max-w-[96rem] px-4 py-8 md:px-8">
          {error && <div className="dashboard-error mx-auto mb-5 max-w-xl">{error}</div>}
          <EmptyDashboard onUpload={(file) => void uploadResume(file)} />
        </main>
      ) : (
      <main id="dashboard-main" className="mx-auto grid max-w-[96rem] gap-5 px-4 py-5 md:grid-cols-[16rem_1fr] md:px-8 md:py-8">
        <aside className="dashboard-panel h-max p-4 md:sticky md:top-24">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-lg bg-[var(--black)] text-lg font-black text-white">{getInitials(profile)}</span>
            <div>
              <p className="font-semibold">{profile.name || 'Guest User'}</p>
              <p className="text-sm text-[var(--muted)]">Profile strength {completion}%</p>
            </div>
          </div>

          <div className="mt-6 grid gap-2 text-sm font-medium">
            {['Overview', 'Role matches', 'Skill graph', 'Applications', 'Reports', 'Settings'].map((item, index) => (
              <button
                key={item}
                className={`focusable flex items-center justify-between rounded-lg px-3 py-2 text-left transition ${index === 1 ? 'bg-white text-[var(--black)] shadow-[inset_0_1px_0_rgba(255,255,255,.9)]' : 'text-[var(--muted)] hover:bg-white/50 hover:text-[var(--black)]'}`}
                type="button"
              >
                <span>{item}</span>
                {index === 1 && <span className="numeric text-xs">{matches.length}</span>}
              </button>
            ))}
          </div>

          <div className="mt-6 rounded-xl bg-[var(--black)] p-4 text-white">
            <p className="text-sm font-semibold">Resume sync</p>
            <p className="mt-2 text-sm leading-6 text-white/58">{profile.skills.length} skills, {profile.projects.length} projects, and {profile.experience.length} experience entries parsed.</p>
            <button className="focusable mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-[var(--black)]" type="button" onClick={() => uploadInputRef.current?.click()}>
              <Icon name="upload" />
              Replace resume
            </button>
          </div>
        </aside>

        <section className="grid gap-5">
          <div className="dashboard-panel overflow-hidden p-5 md:p-7">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[.12em] text-[var(--stone)]">Role match control</p>
                <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-[.95] tracking-[-.055em] md:text-6xl">
                  {getTimeOfDay()}, {firstName}. {matches.length} matches are live.
                </h1>
              </div>
              <div className="flex flex-wrap gap-2">
                <input
                  className="dashboard-input"
                  placeholder="Keyword"
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                />
                <input
                  className="dashboard-input"
                  placeholder="Location"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                />
                <button className={`focusable dashboard-filter-button ${remoteOnly ? 'bg-white text-[var(--black)]' : ''}`} type="button" onClick={() => setRemoteOnly((value) => !value)}>
                  <Icon name="filter" />
                  Remote
                </button>
                <button className="focusable dashboard-filter-button bg-white" type="button" onClick={() => void loadDashboard({ keyword, location, remoteOnly })} disabled={refreshing}>
                  <Icon name="refresh" />
                  {refreshing ? 'Scoring' : 'Refresh'}
                </button>
              </div>
            </div>

            {error && <div className="dashboard-error mt-6">{error}</div>}

            <div className="mt-8 grid gap-3 md:grid-cols-4">
              {[
                ['Jobs matched', String(matches.length), 'live'],
                ['Best fit', `${bestScore}%`, 'top'],
                ['Match strength', `${avgScore}%`, 'avg'],
                ['Skills parsed', String(profile.skills.length), `${completion}%`],
              ].map(([label, value, delta]) => (
                <div key={label} className="rounded-xl bg-white/62 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.86)]">
                  <p className="text-sm text-[var(--muted)]">{label}</p>
                  <div className="mt-3 flex items-end justify-between gap-3">
                    <p className="numeric text-3xl font-semibold tracking-[-.04em]">{value}</p>
                    <p className="numeric rounded-md bg-[var(--paper)] px-2 py-1 text-xs font-semibold text-[var(--charcoal)]">{delta}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
            <div className="dashboard-panel overflow-hidden">
              <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
                <h2 className="font-semibold">Ranked matches</h2>
                <button className="focusable flex items-center gap-2 text-sm font-semibold text-[var(--muted)] hover:text-[var(--black)]" type="button" onClick={() => void loadDashboard({ keyword, location, remoteOnly })}>
                  Re-score
                  <Icon name="arrow" />
                </button>
              </div>
              <div className="divide-y divide-[var(--line)]">
                {topMatches.length ? (
                  topMatches.map((match, index) => (
                    <MatchRow
                      key={`${match.id ?? index}-${match.company}-${match.job_title}`}
                      match={match}
                      saved={Boolean(match.id && savedIds.has(match.id))}
                      onToggleSave={(item) => void toggleSave(item)}
                    />
                  ))
                ) : (
                  <div className="p-8 text-sm leading-7 text-[var(--muted)]">
                    No matches returned yet. Try a broader keyword, remove filters, or upload a stronger resume profile.
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-5">
              <div className="dashboard-panel p-5">
                <h2 className="font-semibold">Skill gaps</h2>
                <div className="mt-4 grid gap-3">
                  {(missingSkills.length ? missingSkills : profile.skills.slice(0, 3).map((skill): [string, number] => [skill, 1])).map(([skill, count]) => (
                    <div key={skill} className="rounded-xl bg-white/56 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <p className="font-semibold">{skill}</p>
                        <span className="numeric text-xs text-[var(--muted)]">{count} role{count === 1 ? '' : 's'}</span>
                      </div>
                      <p className="mt-2 text-sm text-[var(--muted)]">Add stronger evidence to improve ATS scoring.</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="dashboard-panel p-5">
                <h2 className="font-semibold">Profile signals</h2>
                <div className="mt-5 space-y-4">
                  {[
                    ['Skills', profile.skills.length],
                    ['Projects', profile.projects.length],
                    ['Experience', profile.experience.length],
                    ['Saved', savedIds.size],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <div className="flex justify-between text-sm">
                        <span>{label}</span>
                        <span className="numeric font-semibold">{value}</span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                        <div className="h-full rounded-full bg-[var(--black)]" style={{ width: `${Number(value) * 3}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      )}
    </div>
  )
}

function App() {
  const root = useRef<HTMLDivElement>(null)
  const [route, setRoute] = useState(() => window.location.hash)

  useEffect(() => {
    const handleHashChange = () => setRoute(window.location.hash)
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  useLayoutEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion || !root.current) return

    const cleanups: Array<() => void> = []

    const ctx = gsap.context(() => {
      gsap.from('.nav-item', {
        y: -14,
        opacity: 0,
        duration: 0.7,
        stagger: 0.06,
        ease: 'power3.out',
      })

      gsap
        .timeline({ defaults: { ease: 'power3.out' } })
        .from('.hero-kicker', { y: 14, opacity: 0, duration: 0.7 }, 0.05)
        .from('.hero-title span', { yPercent: 112, opacity: 0, duration: 0.9, stagger: 0.08 }, 0.16)
        .from('.hero-copy', { y: 18, opacity: 0, duration: 0.75 }, 0.55)
        .from('.hero-cta', { y: 12, opacity: 0, duration: 0.55, stagger: 0.07 }, 0.72)
        .from('.dashboard', { y: 90, opacity: 0, scale: 0.98, duration: 1 }, 0.42)

      gsap.to('.mist', {
        x: 34,
        y: -12,
        duration: 6,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })

      gsap.to('.dashboard', {
        y: -72,
        scrollTrigger: {
          trigger: '.hero-stage',
          start: 'top top',
          end: 'bottom top',
          scrub: 0.8,
        },
      })

      gsap.utils.toArray<HTMLElement>('.reveal').forEach((item) => {
        gsap.from(item, {
          y: 34,
          opacity: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: item,
            start: 'top 82%',
          },
        })
      })

      const workflowMap = root.current?.querySelector<HTMLElement>('.workflow-map')
      const workflowPath = root.current?.querySelector<SVGPathElement>('.workflow-path-progress')
      const matchStep = root.current?.querySelector<HTMLElement>('.workflow-match')

      if (workflowMap && workflowPath && matchStep) {
        const pathLength = workflowPath.getTotalLength()
        const clampProgress = gsap.utils.clamp(0, 1)

        workflowPath.style.strokeDasharray = `${pathLength}`
        workflowPath.style.strokeDashoffset = `${pathLength}`

        const drawWorkflowPath = () => {
          const mapTop = workflowMap.getBoundingClientRect().top + window.scrollY
          const matchRect = matchStep.getBoundingClientRect()
          const matchCenter = matchRect.top + window.scrollY + matchRect.height / 2
          const start = mapTop - window.innerHeight * 0.72
          const end = matchCenter - window.innerHeight * 0.5
          const progress = clampProgress((window.scrollY - start) / Math.max(end - start, 1))
          const grey = Math.round(143 + (5 - 143) * progress)
          const greyBlue = Math.round(141 + (5 - 141) * progress)

          workflowPath.style.strokeDashoffset = `${pathLength * (1 - progress)}`
          workflowPath.style.stroke = `rgb(${grey}, ${grey}, ${greyBlue})`
        }

        const mapObserver = new IntersectionObserver(
          ([entry]) => {
            workflowMap.dataset.pathActive = String(entry.isIntersecting)
            drawWorkflowPath()
          },
          { rootMargin: '20% 0px 20% 0px' },
        )

        const stepObserver = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              entry.target.classList.toggle('is-visible', entry.isIntersecting)
            })
          },
          { threshold: 0.42 },
        )

        mapObserver.observe(workflowMap)
        root.current
          ?.querySelectorAll<HTMLElement>('.workflow-step')
          .forEach((step) => stepObserver.observe(step))

        window.addEventListener('scroll', drawWorkflowPath, { passive: true })
        window.addEventListener('resize', drawWorkflowPath)
        drawWorkflowPath()

        cleanups.push(() => {
          mapObserver.disconnect()
          stepObserver.disconnect()
          window.removeEventListener('scroll', drawWorkflowPath)
          window.removeEventListener('resize', drawWorkflowPath)
        })
      }

      gsap.from('.workflow-node', {
        scale: 0.9,
        opacity: 0,
        duration: 0.5,
        stagger: 0.18,
        ease: 'back.out(1.6)',
        scrollTrigger: {
          trigger: '.workflow-map',
          start: 'top 70%',
        },
      })

      gsap.from('.graph-line', {
        opacity: 0,
        scale: 0.82,
        transformOrigin: 'center center',
        duration: 1,
        stagger: 0.025,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.skill-graph-wrap',
          start: 'top 72%',
        },
      })

      gsap.from('.graph-node-shape, .graph-core-copy', {
        opacity: 0,
        scale: 0.55,
        transformOrigin: 'center center',
        duration: 0.7,
        stagger: 0.045,
        ease: 'back.out(1.7)',
        scrollTrigger: {
          trigger: '.skill-graph-wrap',
          start: 'top 70%',
        },
      })

      const graphWrap = root.current?.querySelector<HTMLElement>('.skill-graph-wrap')
      const graphNodeGroups = gsap.utils.toArray<SVGGElement>('.graph-node-group')
      const graphLines = gsap.utils.toArray<SVGLineElement>('.graph-line')

      if (graphWrap && graphNodeGroups.length && graphLines.length) {
        const nodePositions = new Map<string, { x: number; y: number }>()
        const graphStart = performance.now()

        const syncGraphLines = () => {
          graphNodeGroups.forEach((node) => {
            const id = node.dataset.nodeId
            const baseX = Number(node.dataset.x)
            const baseY = Number(node.dataset.y)
            if (!id) return
            const currentX = Number(node.dataset.currentX ?? baseX)
            const currentY = Number(node.dataset.currentY ?? baseY)
            nodePositions.set(id, {
              x: currentX,
              y: currentY,
            })
          })

          graphLines.forEach((line) => {
            const from = nodePositions.get(line.dataset.from ?? '')
            const to = nodePositions.get(line.dataset.to ?? '')
            if (!from || !to) return
            line.setAttribute('x1', `${from.x}`)
            line.setAttribute('y1', `${from.y}`)
            line.setAttribute('x2', `${to.x}`)
            line.setAttribute('y2', `${to.y}`)
          })
        }

        const floatGraph = () => {
          const elapsed = (performance.now() - graphStart) / 1000
          graphNodeGroups.forEach((node) => {
            const amp = Number(node.dataset.amp)
            const phase = Number(node.dataset.phase)
            const speed = Number(node.dataset.speed)
            const x = Math.sin(elapsed * speed + phase) * amp
            const y = Math.sin(elapsed * (speed * 1.82) + phase * 5.7) * amp
            const baseX = Number(node.dataset.x)
            const baseY = Number(node.dataset.y)
            const currentX = baseX + x
            const currentY = baseY + y
            node.dataset.currentX = `${currentX}`
            node.dataset.currentY = `${currentY}`
            node.setAttribute('transform', `translate(${currentX} ${currentY})`)
          })
          syncGraphLines()
        }

        gsap.ticker.add(floatGraph)

        gsap.to('.graph-core-frame', {
          scale: 1.025,
          transformOrigin: 'center center',
          duration: 8,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        })

        syncGraphLines()
        cleanups.push(() => {
          gsap.ticker.remove(floatGraph)
          gsap.killTweensOf('.graph-core-frame')
        })
      }
    }, root)

    return () => {
      cleanups.forEach((cleanup) => cleanup())
      ctx.revert()
    }
  }, [])

  if (route === '#dashboard') {
    return <DashboardPage />
  }

  return (
    <div ref={root} className="min-h-screen overflow-hidden bg-[var(--paper)] text-[var(--black)]">
      <a className="focusable sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-white focus:px-4 focus:py-2" href="#main">
        Skip to content
      </a>

      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 md:px-12">
          <a href="#" className="text-4xl font-black tracking-tight md:text-3xl">
            HunterAI
          </a>
          <div className="hidden items-center gap-10 text-sm font-bold uppercase md:flex">
            <a href="#how" className="hover:opacity-70">How it Works</a>
            <a href="#features" className="hover:opacity-70">Features</a>
            <a href="#closing" className="hover:opacity-70">Stories</a>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="#dashboard"
              className="hidden border font-bold border-gray-400 rounded-full hover:bg-gray-600 hover:text-white hover:shadow-2xl hover:zoom-110 px-6 py-2 items-center gap-2 text-sm hover:opacity-70 sm:flex"
            >
              Sign in
            </a>

            <a
              href="#dashboard"
              className="rounded-full bg-black px-5 py-2 text-sm font-semibold text-white shadow-md md:text-base"
            >
              Launch app
            </a>

          </div>
        </div>
      </nav>

      <header className="hero-stage relative min-h-[920px] overflow-hidden pt-[6.2rem] md:min-h-[1040px]">
        <div className="mist absolute left-[14%] top-[26rem] h-28 w-72 rounded-full bg-white/80" />
        <div className="mist absolute right-[17%] top-[31rem] h-24 w-64 rounded-full bg-white/70" />
        <div className="relative z-10 mx-auto max-w-[112rem] px-5 pt-20 text-center md:px-10 md:pt-24">
          <p className="hero-kicker text-sm font-semibold uppercase tracking-[.08em] text-[var(--stone)]">Career intelligence reimagined</p>
          <div className="mt-5 overflow-hidden">
            <h1 className="hero-title text-balance text-8xl tracking-loose font-semibold leading-[.92]">
              <span className="block text-[var(--silver)]">A new standard in</span>
              <span className="block text-[var(--black)]">career matching</span>
            </h1>
          </div>
          <p className="hero-copy text-balance mx-auto mt-8 max-w-2xl text-lg text-[var(--muted)] md:text-xl">
            Upload once and turn scattered experience into a living skill profile, ranked opportunities, and clearer applications in real time.
          </p>
          <DashboardMock />
        </div>
      </header>

      <main id="main">
        <section id="how" className="section-rule soft-grid bg-[var(--paper)] px-5 py-24 md:px-10 md:py-32">
          <div className="mx-auto max-w-[82rem]">
            <div className="reveal grid gap-6 md:grid-cols-[.85fr_1fr] md:items-end">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[.08em] text-[var(--stone)]">How it works</p>
                <h2 className="text-balance mt-4 text-5xl font-semibold leading-[.95] tracking-[-.06em] md:text-7xl">
                  From raw resume to ranked roles.
                </h2>
              </div>
              <p className="max-w-xl text-lg leading-8 text-[var(--muted)]">
                The workflow stays deliberately short. Upload the source material, let the system understand the context, then inspect the matches worth acting on.
              </p>
            </div>

            <div className="workflow-map relative mt-20 min-h-[58rem] md:min-h-[72rem]">
              <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1200 980" preserveAspectRatio="none" aria-hidden="true">
                <path
                  className="workflow-path-base"
                  d={workflowPath}
                  fill="none"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <path
                  className="workflow-path-progress"
                  d={workflowPath}
                  fill="none"
                  stroke="#050505"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>

              <article className="reveal workflow-step workflow-upload md:absolute md:left-0 md:top-0 md:w-[37rem]">
                <div className="workflow-node numeric">01</div>
                <div className="grid gap-6 rounded-2xl bg-white/58 p-7 shadow-[inset_0_1px_0_rgba(255,255,255,.78)] md:grid-cols-[8rem_1fr] md:p-8">
                  <h3 className="text-5xl font-semibold tracking-tight md:text-6xl">{steps[0][0]}</h3>
                  <div className="self-end">
                    <p className="text-lg mx-18 leading-8 text-[var(--muted)]">{steps[0][1]}</p>
                    <div className="mt-6 grid grid-cols-2 gap-3 text-sm text-[var(--charcoal)]">
                      <span className="rounded-lg bg-[var(--paper)] px-3 py-2">PDF</span>
                      <span className="rounded-lg bg-[var(--paper)] px-3 py-2">LinkedIn</span>
                      <span className="rounded-lg bg-[var(--paper)] px-3 py-2">Portfolio</span>
                      <span className="rounded-lg bg-[var(--paper)] px-3 py-2">Notes</span>
                    </div>
                  </div>
                </div>
              </article>

              <article className="reveal workflow-step workflow-extract mt-10 md:absolute md:right-0 md:top-[24rem] md:mt-0 md:w-[40rem]">
                <div className="workflow-node numeric md:ml-auto">02</div>
                <div className="grid gap-6 rounded-2xl bg-[#d7d7d5]/76 p-7 shadow-[inset_0_1px_0_rgba(255,255,255,.56)] md:grid-cols-[1fr_10rem] md:p-8">
                  <div className="md:text-right">
                    <p className="text-lg leading-8 text-[rgba(5,5,5,.6)]">{steps[1][1]}</p>
                    <div className="mt-6 flex flex-wrap gap-2 md:justify-end">
                      {['Skills', 'Projects', 'Impact', 'Tools'].map((item) => (
                        <span key={item} className="rounded-full bg-white/62 px-3 py-1.5 text-sm font-semibold text-[var(--charcoal)]">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                  <h3 className="text-5xl font-semibold tracking-[-.065em] md:text-right md:text-6xl">{steps[1][0]}</h3>
                </div>
              </article>

              <article className="reveal workflow-step workflow-match mx-auto mt-10 md:absolute md:bottom-0 md:left-1/2 md:mt-0 md:w-[36rem] md:-translate-x-1/2">
                <div className="workflow-node numeric mx-auto">03</div>
                <div className="rounded-2xl bg-[var(--black)] p-7 text-center text-white shadow-[0_30px_80px_rgba(5,5,5,.22)] md:p-8">
                  <h3 className="text-6xl font-semibold tracking-[-.07em] md:text-7xl">{steps[2][0]}</h3>
                  <p className="mx-auto mt-6 max-w-md text-lg leading-8 text-white/62">{steps[2][1]}</p>
                  <div className="numeric mx-auto mt-8 flex max-w-sm items-center justify-between rounded-full bg-white px-4 py-3 text-sm font-semibold text-[var(--black)]">
                    <span>87.4% fit</span>
                    <span>14 roles</span>
                    <span>6 gaps</span>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="section-rule skill-section relative overflow-hidden px-5 py-24 md:px-10 md:py-32">
          <div className="mx-auto grid max-w-[92rem] gap-12 md:min-h-[52rem] md:grid-cols-[.9fr_1.1fr] md:items-start">
            <div className="reveal relative z-10 self-start md:pt-8">
              <p className="text-sm font-medium uppercase tracking-[.22em] text-[rgba(5,5,5,.36)]">Intelligence</p>
              <h2 className="text-balance mt-4 max-w-4xl text-5xl font-semibold leading-[.95] tracking-[-.06em] text-[var(--black)] md:text-7xl">
                Skill extraction with context attached.
              </h2>
              <p className="mt-10 max-w-2xl text-2xl leading-[1.65] tracking-[-.035em] text-[rgba(5,5,5,.46)] md:text-3xl">
                Your resume holds more than you wrote. Watch our AI surface what matters.
              </p>
            </div>
            <div className="relative z-10 md:self-start md:translate-x-12">
              <SkillGraph />
            </div>
          </div>
        </section>

        <section id="features" className="section-rule bg-[var(--paper)] px-5 py-24 md:px-10 md:py-32">
          <div className="mx-auto max-w-[82rem]">
            <div className="reveal flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[.08em] text-[var(--stone)]">Features</p>
                <h2 className="mt-4 text-5xl font-semibold tracking-[-.06em] md:text-7xl">Platform cards.</h2>
              </div>
              <p className="max-w-md text-lg leading-8 text-[var(--muted)]">
                Built as a calm operating layer for repeated job-search decisions.
              </p>
            </div>

            <div className="mt-14 grid gap-5 md:grid-cols-6">
              {features.map(([title, copy], index) => (
                <article key={title} className={`reveal lift-card rounded-xl bg-white/52 p-7 shadow-[inset_0_1px_0_rgba(255,255,255,.78)] ${index < 2 ? 'md:col-span-3' : 'md:col-span-2'}`}>
                  <div className="mb-14 h-1.5 w-20 rounded-full bg-[var(--black)]" />
                  <h3 className="text-2xl font-semibold tracking-[-.04em]">{title}</h3>
                  <p className="mt-4 leading-7 text-[var(--muted)]">{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="closing" className="relative overflow-hidden bg-[var(--black)] px-5 py-24 text-white md:px-10 md:py-36">
          <div className="absolute inset-x-0 top-0 h-px bg-white/18" />
          <div className="reveal mx-auto flex max-w-5xl flex-col items-center text-center">
            <p className="text-sm font-semibold uppercase tracking-[.08em] text-white/54">Your next chapter</p>
            <h2 className="text-balance mt-5 text-5xl font-semibold leading-[.95] tracking-[-.06em] md:text-8xl">
              Start with the resume you already have.
            </h2>
            <a className="focusable magnet mt-10 rounded-full bg-white px-8 py-4 font-semibold text-[var(--black)] shadow-[0_24px_54px_rgba(255,255,255,.12)]" href="#dashboard">
              Upload resume
            </a>
            <p className="mt-6 text-sm font-medium text-white/52">Private by default. Export anytime. No credit card needed.</p>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
