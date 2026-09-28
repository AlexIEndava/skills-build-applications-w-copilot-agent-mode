import { useEffect, useState } from 'react'
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import {
  Activity, ArrowRight, Bike, Check, ChevronRight, Clock3, Dumbbell,
  Footprints, Heart, LogOut, Menu, Plus, ShieldCheck, Sparkles, Trash2,
  Trophy, UserRound, UsersRound, X, Zap,
} from 'lucide-react'
import { apiRequest } from './api'
import { AuthProvider } from './AuthContext'
import { useAuth } from './useAuth'
import logo from './assets/octofitapp-small.png'
import './octofit.css'

const activities = [
  { id: 'running', label: 'Run', icon: Footprints, tone: 'coral' },
  { id: 'walking', label: 'Walk', icon: Footprints, tone: 'mint' },
  { id: 'strength', label: 'Strength', icon: Dumbbell, tone: 'yellow' },
  { id: 'cycling', label: 'Cycle', icon: Bike, tone: 'blue' },
  { id: 'yoga', label: 'Yoga', icon: Heart, tone: 'lilac' },
]
const menuItems = [
  { to: '/', label: 'Overview', icon: Activity, end: true },
  { to: '/activities', label: 'Activities', icon: Footprints },
  { to: '/teams', label: 'Teams', icon: UsersRound },
  { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { to: '/workouts', label: 'For you', icon: Sparkles },
]

export default function OctoFitApp() {
  return <AuthProvider><Application /></AuthProvider>
}

function Application() {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading-screen"><span className="brand-orbit">O</span>Getting your space ready</div>
  if (!user) return <Authentication />
  return <Workspace />
}

function Workspace() {
  const { user, logout } = useAuth()
  const [mobileMenu, setMobileMenu] = useState(false)
  const location = useLocation()
  const current = menuItems.find((item) => item.to === location.pathname)?.label || 'Profile'
  return <div className="app-shell">
    {mobileMenu && <button className="nav-scrim" onClick={() => setMobileMenu(false)} aria-label="Close navigation" />}
    <aside className={`sidebar ${mobileMenu ? 'sidebar-open' : ''}`}>
      <NavLink to="/" className="brand" onClick={() => setMobileMenu(false)}><img src={logo} alt="" /><span>octofit<span>.</span></span></NavLink>
      <div className="school-name"><i /> MERGINGTON HIGH</div>
      <nav className="main-nav" aria-label="Main navigation"><small>YOUR SPACE</small>{menuItems.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} onClick={() => setMobileMenu(false)} className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}><Icon size={18} /><span>{label}</span>{label === 'Teams' && <ChevronRight className="nav-chevron" size={14} />}</NavLink>)}</nav>
      <div className="sidebar-bottom"><div className="sidebar-note"><Zap size={16} /><p>Small steps.<br /><strong>Big energy.</strong></p><span>Your pace, your progress.</span></div><div className="sidebar-profile"><Avatar name={user.name} /><div className="sidebar-identity"><strong>{user.name}</strong><span>Student athlete</span></div><NavLink to="/profile" title="Profile" aria-label="Profile" className="sidebar-icon"><UserRound size={16} /></NavLink><button title="Sign out" aria-label="Sign out" className="sidebar-icon" onClick={logout}><LogOut size={16} /></button></div></div>
    </aside>
    <main className="main-area"><header className="topbar"><button className="mobile-trigger" onClick={() => setMobileMenu(true)} aria-label="Open navigation"><Menu size={20} /></button><div className="crumb"><span>OCTOFIT</span><i>/</i><strong>{current.toUpperCase()}</strong></div><div className="topbar-right"><span>FALL TERM <b>·</b> 2026</span><Avatar name={user.name} small /></div></header><div className="page-wrap"><Routes><Route path="/" element={<Dashboard />} /><Route path="/activities" element={<ActivitiesPage />} /><Route path="/teams" element={<TeamsPage />} /><Route path="/leaderboard" element={<LeaderboardPage />} /><Route path="/workouts" element={<WorkoutsPage />} /><Route path="/profile" element={<ProfilePage />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes></div></main>
  </div>
}

function PageHeading({ eyebrow, title, text, action }) {
  return <div className="page-heading"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{text && <p>{text}</p>}</div>{action}</div>
}

function Alert({ message, onClose }) {
  if (!message) return null
  return <div className="alert-message" role="alert"><span>{message}</span>{onClose && <button aria-label="Dismiss" onClick={onClose}><X size={16} /></button>}</div>
}

function Dashboard() {
  const { user } = useAuth()
  const [data, setData] = useState({ activities: [], teams: [], board: { users: [] }, workouts: [] })
  const [error, setError] = useState('')
  useEffect(() => {
    Promise.all([apiRequest('/activities/me'), apiRequest('/teams'), apiRequest('/leaderboard'), apiRequest('/workouts/recommended')])
      .then(([activitiesData, teams, board, workouts]) => setData({ activities: activitiesData, teams, board, workouts }))
      .catch((requestError) => setError(requestError.message))
  }, [])
  const points = data.activities.reduce((sum, item) => sum + item.points, 0)
  const minutes = data.activities.reduce((sum, item) => sum + item.durationMinutes, 0)
  const rank = data.board.users.findIndex((entry) => String(entry._id) === user._id) + 1
  const team = data.teams.find((entry) => entry.memberIds?.some((member) => String(member._id || member) === user._id))
  const first = user.name.split(' ')[0]
  return <>
    <PageHeading eyebrow="YOUR DASHBOARD" title={<>Hey, {first}<span className="coral">!</span></>} text="A little movement goes a long way. Here's your week so far." action={<NavLink to="/activities" className="button primary"><Plus size={16} /> Log activity</NavLink>} />
    <Alert message={error} onClose={() => setError('')} />
    <section className="hero-banner"><div className="hero-copy"><span className="hero-overline"><i /> YOUR MOMENTUM</span><h2>You're showing up.<br /><em>That's what counts.</em></h2><p>Every session is a win. Keep stacking them.</p><NavLink to="/workouts">Find your next move <ArrowRight size={15} /></NavLink></div><RunnerArt /></section>
    <div className="stats-grid"><Stat label="POINTS EARNED" value={points.toLocaleString()} icon={Zap} tone="yellow" caption="Keep your streak going" /><Stat label="ACTIVE MINUTES" value={minutes.toLocaleString()} icon={Clock3} tone="coral" caption="Time well spent" /><Stat label="SCHOOL RANK" value={rank ? `#${rank}` : '—'} icon={Trophy} tone="blue" caption={rank ? 'On the leaderboard' : 'Log your first activity'} /><Stat label="YOUR TEAM" value={team?.name || 'Solo for now'} icon={UsersRound} tone="mint" caption={team ? `${team.memberIds.length} teammates` : 'Find your people'} /></div>
    <div className="dashboard-panels"><section className="panel"><PanelHeading eyebrow="THE LAST 7 DAYS" title="Your activity" link="/activities" /><WeeklyChart items={data.activities} /></section><section className="panel"><PanelHeading eyebrow="NICE WORK" title="Recent sessions" link="/activities" />{data.activities.length ? <div className="recent-list">{data.activities.slice(0, 4).map((item) => <ActivityRow key={item._id} item={item} compact />)}</div> : <Empty icon={Footprints} title="Your story starts here" text="Log your first workout and watch your progress add up." to="/activities" action="Log activity" />}</section></div>
    <div className="dashboard-panels lower-panels"><section className="team-callout"><UsersRound size={20} /><div><span className="eyebrow">BETTER TOGETHER</span><h2>{team ? `Go ${team.name}!` : 'Find your people.'}</h2><p>{team ? 'Add a session to lift the whole squad.' : 'Join a crew, cheer each other on, climb the team board.'}</p></div><NavLink to="/teams" className="button light">{team ? 'Meet the team' : 'Explore teams'} <ArrowRight size={15} /></NavLink></section><section className="panel mini-workout"><div className="small-icon tone-coral"><Dumbbell size={18} /></div><div><span className="eyebrow">MADE FOR YOU</span><strong>{data.workouts[0]?.title || 'Your next good move'}</strong><p>{data.workouts[0] ? `${data.workouts[0].durationMinutes} min · ${data.workouts[0].level}` : 'Personalized workouts, at your level.'}</p></div><NavLink to="/workouts" aria-label="See suggested workouts" className="arrow-link"><ArrowRight size={17} /></NavLink></section></div>
  </>
}

function Stat({ label, value, icon: Icon, tone, caption }) {
  return <article className="stat-card"><span className={`small-icon tone-${tone}`}><Icon size={17} /></span><span className="stat-label">{label}</span><strong>{value}</strong><small>{caption}</small></article>
}

function ActivitiesPage() {
  const [items, setItems] = useState([])
  const [teams, setTeams] = useState([])
  const [refresh, setRefresh] = useState(0)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ type: 'running', durationMinutes: '', distanceKm: '', note: '', teamId: '' })
  const { user } = useAuth()
  useEffect(() => { Promise.all([apiRequest('/activities/me'), apiRequest('/teams')]).then(([records, allTeams]) => { setItems(records); setTeams(allTeams.filter((team) => team.memberIds?.some((member) => String(member._id || member) === user._id))) }).catch((err) => setError(err.message)) }, [refresh, user._id])
  async function save(event) {
    event.preventDefault(); setError(''); setSaving(true)
    try { await apiRequest('/activities', { method: 'POST', body: { ...form, durationMinutes: Number(form.durationMinutes), distanceKm: form.distanceKm ? Number(form.distanceKm) : null, teamId: form.teamId || null } }); setForm({ type: 'running', durationMinutes: '', distanceKm: '', note: '', teamId: '' }); setRefresh((value) => value + 1) }
    catch (err) { setError(err.message) } finally { setSaving(false) }
  }
  async function remove(id) { try { await apiRequest(`/activities/${id}`, { method: 'DELETE' }); setRefresh((value) => value + 1) } catch (err) { setError(err.message) } }
  const points = items.reduce((sum, item) => sum + item.points, 0)
  return <><PageHeading eyebrow="MOVE YOUR WAY" title="Activity log" text="Every session counts. Add a workout and make today yours." /><Alert message={error} onClose={() => setError('')} /><div className="activity-layout"><section className="panel"><PanelHeading eyebrow="NEW SESSION" title="What did you do?" /><form className="activity-form" onSubmit={save}><fieldset><legend>Pick your activity</legend><div className="activity-options">{activities.map(({ id, label, icon: Icon, tone }) => <button type="button" key={id} className={`activity-option ${form.type === id ? 'selected' : ''}`} onClick={() => setForm({ ...form, type: id })}><i className={`small-icon tone-${tone}`}><Icon size={17} /></i>{label}</button>)}</div></fieldset><div className="form-row"><label>Duration <span>MIN</span><input type="number" required min="1" max="600" placeholder="30" value={form.durationMinutes} onChange={(event) => setForm({ ...form, durationMinutes: event.target.value })} /></label><label>Distance <span>KM · OPTIONAL</span><input type="number" min=".1" max="500" step=".1" placeholder="3.2" value={form.distanceKm} onChange={(event) => setForm({ ...form, distanceKm: event.target.value })} /></label></div>{teams.length > 0 && <label className="field-label">Give your team the points<select value={form.teamId} onChange={(event) => setForm({ ...form, teamId: event.target.value })}><option value="">Keep it personal</option>{teams.map((team) => <option value={team._id} key={team._id}>{team.name}</option>)}</select></label>}<label className="field-label">A note to future you <span>OPTIONAL</span><input maxLength="180" placeholder="Felt good to get outside..." value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} /></label><div className="points-preview"><span><Zap size={14} fill="currentColor" /> Points you'll earn</span><strong>{form.durationMinutes ? Math.round(Number(form.durationMinutes) * ({ walking: 1, running: 2, strength: 1.5, cycling: 1.5, yoga: 1.2 }[form.type])) : '—'}</strong></div><button className="button primary full" disabled={saving}>{saving ? 'Saving...' : 'Save my session'} {!saving && <ArrowRight size={16} />}</button></form></section><section className="panel log-panel"><PanelHeading eyebrow="YOUR WORK, ADDING UP" title={<>Sessions <span className="count-badge">{items.length}</span></>} trailing={<span className="points-total"><Zap size={14} fill="currentColor" />{points} pts</span>} />{items.length ? <div>{items.map((item) => <ActivityRow item={item} key={item._id} onDelete={() => remove(item._id)} />)}</div> : <Empty icon={Activity} title="No sessions yet" text="Start with a walk, a stretch, or anything that gets you moving." />}</section></div></>
}

function ActivityRow({ item, compact, onDelete }) {
  const activity = activities.find((option) => option.id === item.type) || activities[0]
  const Icon = activity.icon
  return <article className={`activity-row ${compact ? 'compact' : ''}`}><i className={`small-icon tone-${activity.tone}`}><Icon size={17} /></i><div className="activity-copy"><strong>{capitalize(item.type)}</strong><span>{formatDate(item.completedAt)}{item.teamId?.name ? ` · ${item.teamId.name}` : ''}{item.note ? ` · ${item.note}` : ''}</span></div><div className="activity-duration"><strong>{item.durationMinutes}<small>m</small></strong>{item.distanceKm > 0 && <span>{item.distanceKm} km</span>}</div><span className="activity-score"><Zap size={12} fill="currentColor" /> {item.points}</span>{onDelete && <button className="delete-control" onClick={onDelete} title="Delete session" aria-label="Delete session"><Trash2 size={15} /></button>}</article>
}

function TeamsPage() {
  const { user } = useAuth()
  const [teams, setTeams] = useState([])
  const [error, setError] = useState('')
  const [refresh, setRefresh] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })
  useEffect(() => { apiRequest('/teams').then(setTeams).catch((err) => setError(err.message)) }, [refresh])
  async function create(event) { event.preventDefault(); setSaving(true); setError(''); try { await apiRequest('/teams', { method: 'POST', body: form }); setForm({ name: '', description: '' }); setShowForm(false); setRefresh((v) => v + 1) } catch (err) { setError(err.message) } finally { setSaving(false) } }
  async function membership(team, action) { try { await apiRequest(`/teams/${team._id}/${action}`, { method: 'POST' }); setRefresh((v) => v + 1) } catch (err) { setError(err.message) } }
  async function removeTeam(team) { if (!window.confirm(`Delete ${team.name}? Its activity points will stay personal.`)) return; try { await apiRequest(`/teams/${team._id}`, { method: 'DELETE' }); setRefresh((v) => v + 1) } catch (err) { setError(err.message) } }
  const myTeams = teams.filter((team) => team.memberIds?.some((member) => String(member._id || member) === user._id))
  return <><PageHeading eyebrow="YOUR CREW, YOUR CALL" title="Find your team" text="Move together. Celebrate every effort. Build your own kind of strong." action={<button className="button primary" onClick={() => setShowForm((v) => !v)}>{showForm ? <X size={16} /> : <Plus size={16} />}{showForm ? 'Close' : 'Start a team'}</button>} /><Alert message={error} onClose={() => setError('')} />{showForm && <section className="panel create-team"><div><span className="eyebrow">MAKE IT YOURS</span><h2>Start a new crew</h2><p>Every great team starts with one person showing up.</p></div><form onSubmit={create}><label className="field-label">Team name<input required minLength="2" maxLength="40" placeholder="The Early Birds" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label className="field-label">What's your vibe?<input maxLength="180" placeholder="A little movement, a lot of good energy." value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label><button className="button dark" disabled={saving}>{saving ? 'Creating...' : 'Create team'} <ArrowRight size={15} /></button></form></section>}{myTeams.length > 0 && <div className="my-team"><UsersRound size={19} /><div><span className="eyebrow">YOUR CREW</span><strong>{myTeams.map((team) => team.name).join(' · ')}</strong></div><span>{myTeams.length} {myTeams.length === 1 ? 'team' : 'teams'} and counting</span></div>}<div className="section-title"><div><span className="eyebrow">THE SCHOOL'S CREWS</span><h2>Good things happen in groups.</h2></div><span>{teams.length} teams</span></div>{teams.length ? <div className="team-grid">{teams.map((team, index) => { const member = team.memberIds?.some((person) => String(person._id || person) === user._id); const owner = String(team.ownerId?._id || team.ownerId) === user._id; const full = team.memberIds?.length >= team.maxMembers; return <article key={team._id} className={`team-card team-${index % 4}`}><div className="team-card-heading"><i><UsersRound size={18} /></i><span>{member ? 'YOUR CREW' : `${team.memberIds?.length || 0} / ${team.maxMembers} MEMBERS`}</span></div><h3>{team.name}</h3><p>{team.description || 'A crew for moving, growing, and cheering each other on.'}</p><div className="member-line"><div className="avatar-stack">{team.memberIds?.slice(0, 4).map((person, i) => <Avatar key={person._id || person} name={person.name || '?'} small color={i} />)}</div><span>{team.memberIds?.length || 0} members</span></div><div className="team-card-footer"><span>Led by {team.ownerId?.name || 'a teammate'}</span>{owner ? <button className="button outline small" onClick={() => removeTeam(team)}><Trash2 size={13} /> Delete team</button> : member ? <button className="button outline small" onClick={() => membership(team, 'leave')}>Leave team</button> : <button className="button dark small" disabled={full} onClick={() => membership(team, 'join')}>{full ? 'Team full' : 'Join crew'} <ArrowRight size={13} /></button>}</div></article>})}</div> : <Empty icon={UsersRound} title="Your crew is waiting to happen." text="Start a team or invite a classmate to create the first one." />}</>
}

function LeaderboardPage() {
  const { user } = useAuth()
  const [board, setBoard] = useState({ users: [], teams: [] })
  const [error, setError] = useState('')
  useEffect(() => { apiRequest('/leaderboard').then(setBoard).catch((err) => setError(err.message)) }, [])
  const rank = board.users.findIndex((entry) => String(entry._id) === user._id) + 1
  return <><PageHeading eyebrow="FRIENDLY COMPETITION" title="The good-energy board" text="This isn't about being the best. It's about showing up." /><Alert message={error} /><section className="leader-hero"><Trophy size={23} /><div><span className="eyebrow">FALL TERM · ALL ACTIVITIES</span><h2>Effort looks good on you.</h2><p>Points turn your movement into momentum. Every activity matters.</p></div><div className="your-rank"><span>YOUR PLACE</span><strong>{rank ? `#${rank}` : '—'}</strong></div></section><div className="leader-panels"><LeaderList title="Student standings" eyebrow="ONE STEP AT A TIME" items={board.users} currentUser={user._id} /><LeaderList title="Team standings" eyebrow="BETTER TOGETHER" items={board.teams} team /></div><p className="kind-note"><ShieldCheck size={15} /> Every kind of movement counts. Keep it kind, keep it fun.</p></>
}

function LeaderList({ title, eyebrow, items, currentUser, team }) {
  return <section className="panel"><PanelHeading eyebrow={eyebrow} title={title} /><div>{items.length ? items.map((item, index) => <article className={`leader-row ${!team && String(item._id) === currentUser ? 'leader-current' : ''}`} key={item._id}><span className={`rank ${index < 3 ? `rank-${index + 1}` : ''}`}>{String(index + 1).padStart(2, '0')}</span>{team ? <i className={`team-avatar team-avatar-${index % 4}`}><UsersRound size={16} /></i> : <Avatar name={item.name} small color={index % 4} />}<div className="leader-name"><strong>{item.name}{!team && String(item._id) === currentUser && <i>YOU</i>}</strong><span>{item.sessions} {item.sessions === 1 ? 'session' : 'sessions'} · {item.minutes} min</span></div><strong className="leader-score">{item.points.toLocaleString()}<small> pts</small></strong></article>) : <Empty icon={team ? UsersRound : Trophy} title={team ? 'Team scores start here' : 'The board is wide open'} text={team ? 'Join a team and tag activities to add to its score.' : 'Log a session to claim the first spot.'} to={team ? '/teams' : '/activities'} action={team ? 'Find a team' : 'Log activity'} />}</div></section>
}

function WorkoutsPage() {
  const { user } = useAuth()
  const [workouts, setWorkouts] = useState([])
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState('')
  useEffect(() => { apiRequest('/workouts/recommended').then(setWorkouts).catch((err) => setError(err.message)) }, [])
  return <><PageHeading eyebrow="BUILT AROUND YOU" title="Find your next move" text="Ideas that fit your level, your interests, and your day." /><Alert message={error} /><section className="plan-note"><Sparkles size={18} /><div><span className="eyebrow">YOUR PERSONAL MIX</span><strong>Made for your pace, {user.name.split(' ')[0]}.</strong><p>Recommendations use your profile and the activities you enjoy.</p></div><NavLink to="/profile" className="text-link">Tune it <ArrowRight size={14} /></NavLink></section>{workouts.length ? <div className="workout-grid">{workouts.map((item, index) => { const option = activities.find((activity) => activity.id === item.type) || activities[0]; const Icon = option.icon; const open = expanded === item._id; return <article className={`workout-card workout-${index % 4}`} key={item._id}><div className="workout-top"><i className={`small-icon tone-${option.tone}`}><Icon size={19} /></i><span>{item.level}</span></div><small>{item.type} · {item.durationMinutes} MIN</small><h3>{item.title}</h3><p>{item.description}</p>{open && <div className="workout-steps"><span>EQUIPMENT · {item.equipment || 'NONE'}</span><ol>{item.steps.map((step) => <li key={step}>{step}</li>)}</ol></div>}<button className="workout-toggle" onClick={() => setExpanded(open ? '' : item._id)}>{open ? 'Show less' : 'See the routine'} <ArrowRight size={14} /></button></article>})}</div> : <Empty icon={Dumbbell} title="Fresh ideas are on the way." text="Try again in a moment, or update your preferences." to="/profile" action="Update preferences" />}<p className="kind-note"><Heart size={15} /> Listen to your body. Rest days are part of getting stronger, too.</p></>
}

function ProfilePage() {
  const { user, updateUser } = useAuth()
  const [form, setForm] = useState({ name: user.name, goal: user.goal || '', fitnessLevel: user.fitnessLevel || 'beginner', preferredActivities: user.preferredActivities || ['walking', 'running'] })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  async function save(event) { event.preventDefault(); setSaving(true); setError(''); setMessage(''); try { const updated = await apiRequest('/users/me', { method: 'PATCH', body: form }); updateUser(updated); setMessage('Profile saved. Your recommendations are refreshed.') } catch (err) { setError(err.message) } finally { setSaving(false) } }
  function toggle(type) { setForm((current) => ({ ...current, preferredActivities: current.preferredActivities.includes(type) ? current.preferredActivities.filter((item) => item !== type) : [...current.preferredActivities, type] })) }
  return <><PageHeading eyebrow="THE PERSON BEHIND THE PROGRESS" title="Your profile" text="Your goals, your way. Update what matters to you." /><Alert message={error} />{message && <div className="success-message"><Check size={16} />{message}</div>}<div className="profile-layout"><section className="panel profile-card"><Avatar name={user.name} /><span className="eyebrow">MERGINGTON HIGH</span><h2>{user.name}</h2><p>{user.email}</p><span className="profile-badge"><ShieldCheck size={14} /> OctoFit member</span></section><section className="panel"><PanelHeading eyebrow="YOUR SETTINGS" title="Make it yours" /><form className="profile-form" onSubmit={save}><label className="field-label">Name<input required minLength="2" maxLength="60" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label className="field-label">Email address<input disabled value={user.email} /></label><label className="field-label">A goal you're working toward<input maxLength="120" placeholder="Feel stronger and sleep better" value={form.goal} onChange={(event) => setForm({ ...form, goal: event.target.value })} /></label><fieldset><legend>Where are you right now?</legend><div className="level-options">{['beginner', 'intermediate', 'advanced'].map((level) => <button className={form.fitnessLevel === level ? 'level-selected' : ''} type="button" key={level} onClick={() => setForm({ ...form, fitnessLevel: level })}>{form.fitnessLevel === level && <Check size={13} />}{capitalize(level)}</button>)}</div></fieldset><fieldset><legend>What kind of movement do you like?</legend><div className="preference-options">{activities.map(({ id, label, icon: Icon }) => <label key={id}><input type="checkbox" checked={form.preferredActivities.includes(id)} onChange={() => toggle(id)} /><span><Check size={11} /></span><Icon size={15} />{label}</label>)}</div></fieldset><button className="button primary" disabled={saving}>{saving ? 'Saving...' : 'Save my profile'} {!saving && <ArrowRight size={15} />}</button></form></section></div></>
}

function Authentication() {
  const { login, register } = useAuth()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const registering = mode === 'register'
  async function submit(event) { event.preventDefault(); setBusy(true); setError(''); try { if (registering) await register(form); else await login(form.email, form.password) } catch (err) { setError(err.message) } finally { setBusy(false) } }
  return <main className="auth-screen"><section className="auth-scene"><NavLink className="brand" to="/"><img src={logo} alt="" /><span>octofit<span>.</span></span></NavLink><span className="auth-kicker"><i /> MERGINGTON HIGH · MOVE TOGETHER</span><h1>Find your<br />kind of <em>strong.</em></h1><p>Log a little movement. Find your crew. Feel good about showing up.</p><RunnerArt /><footer><span>ALL MOVEMENT COUNTS.</span><span>ALL YOU NEED IS YOU.</span></footer></section><section className="auth-side"><div className="auth-box"><span className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</span><h2>{registering ? 'Make yourself at home.' : 'Good to see you.'}</h2><p>{registering ? 'Create your student account and start collecting small wins.' : 'Sign in and pick up right where you left off.'}</p><Alert message={error} /><form onSubmit={submit}>{registering && <label className="field-label">Your name<input required minLength="2" maxLength="60" autoComplete="name" placeholder="Alex Morgan" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>}<label className="field-label">School email<input type="email" required autoComplete="email" placeholder="you@mergington.edu" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label><label className="field-label">Password<input type="password" required minLength={registering ? 8 : undefined} autoComplete={registering ? 'new-password' : 'current-password'} placeholder={registering ? 'At least 8 characters' : 'Your password'} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label><button className="button primary full" disabled={busy}>{busy ? 'One moment...' : registering ? 'Create my account' : 'Sign in'} {!busy && <ArrowRight size={16} />}</button></form><p className="auth-switch">{registering ? 'Already part of OctoFit?' : 'New to OctoFit?'} <button onClick={() => { setMode(registering ? 'login' : 'register'); setError('') }}>{registering ? 'Sign in' : 'Create an account'}</button></p><div className="auth-privacy"><ShieldCheck size={14} /> Your account is for your school community.</div></div></section></main>
}

function RunnerArt() { return <div className="runner-art" aria-hidden="true"><span className="runner-sun" /><span className="runner-orbit orbit-one" /><span className="runner-orbit orbit-two" /><span className="art-head" /><span className="art-torso" /><span className="art-arm" /><span className="art-leg leg-one" /><span className="art-leg leg-two" /><span className="art-note">MOVE<br />WITH<br />HEART</span></div> }
function PanelHeading({ eyebrow, title, link, trailing }) { return <div className="panel-heading"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div>{trailing || (link ? <NavLink className="text-link" to={link}>View all <ArrowRight size={14} /></NavLink> : null)}</div> }
function Avatar({ name, small, color = 0 }) { return <span className={`avatar ${small ? 'avatar-small' : ''} avatar-color-${color % 4}`}>{(name || '?').split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}</span> }
function Empty({ icon: Icon, title, text, to, action }) { return <div className="empty-state"><i><Icon size={20} /></i><strong>{title}</strong><p>{text}</p>{to && <NavLink to={to} className="text-link">{action} <ArrowRight size={14} /></NavLink>}</div> }
function WeeklyChart({ items }) {
  const [today] = useState(() => new Date())
  const days = Array.from({ length: 7 }, (_, index) => { const date = new Date(today); date.setHours(0, 0, 0, 0); date.setDate(date.getDate() - 6 + index); const value = items.filter((item) => new Date(item.completedAt).toDateString() === date.toDateString()).reduce((sum, item) => sum + item.durationMinutes, 0); return { date, value } })
  const max = Math.max(30, ...days.map((day) => day.value))
  const total = days.reduce((sum, day) => sum + day.value, 0)
  return <><div className="week-chart">{days.map(({ date, value }, index) => <div className="week-col" key={date.toDateString()}><div className="bar-track"><i className={`bar bar-${index % 3} ${value ? '' : 'bar-empty'}`} style={{ height: `${value ? Math.max(12, value / max * 100) : 4}%` }} /></div><span>{date.toLocaleDateString('en', { weekday: 'short' })}</span></div>)}</div><div className="chart-legend"><span><i /> Active minutes</span><strong>{total} min total</strong></div></>
}
function capitalize(value) { return value ? value[0].toUpperCase() + value.slice(1) : '' }
function formatDate(value) { return new Date(value).toLocaleDateString('en', { month: 'short', day: 'numeric' }) }