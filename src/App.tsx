import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import {
  Archive, ArrowLeft, ArrowRight, BarChart3, Bell, BookOpen,
  Home, LogOut, Map, MapPin, Menu, MessageCircle, Search, ShieldCheck,
  ShoppingBag, Upload, X, Plus, UserRound,
} from 'lucide-react'
import { CurtainMedia, CurtainToggle } from './components/CurtainMedia'
import { CommunityPost, ProductListing, Profile, Role, Screen, AuthMode, roleLabel, roleOptions, photos, sampleProducts, profiles, profileForRole, sampleCommunityPosts, refreshSamplePosts, refreshSampleProducts } from './data'
import { Feed } from './pages/FeedPage'
import { Dashboard } from './pages/DashboardPage'
import { Marketplace } from './pages/MarketplacePage'
import { ResearchArchive } from './pages/ResearchArchivePage'
import { HeritageMap } from './pages/HeritageMap'
import { ProfilePage } from './pages/ProfilePage'
import { PostComposer } from './components/PostComposer'
import { loadMedia } from './mediaStore'

function App() {
  const headerRef = useRef<HTMLElement>(null)
  const [headerHeight, setHeaderHeight] = useState(0)
  const [authenticated, setAuthenticated] = useState(false)
  const [screen, setScreen] = useState<Screen>('feed')
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [role, setRole] = useState<Role>('Explorer')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [toast, setToast] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notificationsRead, setNotificationsRead] = useState(false)
  const [platformNotices,setPlatformNotices]=useState<Array<{title:string;body:string;audience:string;created:string}>>(()=>{try{return JSON.parse(localStorage.getItem('astitva-admin-notices')||'[]') as Array<{title:string;body:string;audience:string;created:string}>}catch{return []}})
  const [saved, setSaved] = useState(false)
  const [followedIds, setFollowedIds] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem('astitva-following') || '[]') as string[] } catch { return [] } })
  const [reactions, setReactions] = useState<Record<string, 'like'|'dislike'>>(() => { try { return JSON.parse(localStorage.getItem('astitva-reactions') || '{}') as Record<string, 'like'|'dislike'> } catch { return {} } })
  const [reviewVotes, setReviewVotes] = useState<Record<string, Record<string, string>>>(() => { try { return JSON.parse(localStorage.getItem('astitva-review-votes') || '{}') as Record<string, Record<string,string>> } catch { return {} } })
  const [profileOverrides, setProfileOverrides] = useState<Record<string, Partial<Profile>>>(() => { try { return JSON.parse(localStorage.getItem('astitva-profile-edits') || '{}') as Record<string, Partial<Profile>> } catch { return {} } })
  const [profilePageId, setProfilePageId] = useState('')
  const [query, setQuery] = useState('')
  const [composer, setComposer] = useState<'product' | 'post' | null>(null)
  const [products, setProducts] = useState<ProductListing[]>(() => {try{const stored=JSON.parse(localStorage.getItem('astitva-products')||'null') as ProductListing[]|null;return stored?refreshSampleProducts(stored):sampleProducts}catch{return sampleProducts}})
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>(() => { try { const stored=JSON.parse(localStorage.getItem('astitva-posts')||'null') as CommunityPost[]|null;return stored?refreshSamplePosts(stored):sampleCommunityPosts } catch { return sampleCommunityPosts } })
  const visibleProfiles = profiles.map(profile=>({...profile,...profileOverrides[profile.id]}))
  const currentProfile = visibleProfiles.find(profile=>profile.id===profileForRole(role).id) || profileForRole(role)
  const profileName = currentProfile.name

  useLayoutEffect(() => {
    if (!authenticated || !headerRef.current) return
    const header = headerRef.current
    const updateHeight = () => setHeaderHeight(header.getBoundingClientRect().height)
    const observer = new ResizeObserver(updateHeight)
    observer.observe(header)
    updateHeight()
    return () => observer.disconnect()
  }, [authenticated])

  const notify = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2600)
  }

  const navigate = (next: Screen) => {
    if (next === 'dashboard' && role === 'Student / Researcher') next = 'archive'
    if (next === 'archive' && role !== 'Student / Researcher') { notify('The heritage research workspace is available to researcher accounts only.'); return }
    if (next === 'profile') setProfilePageId(currentProfile.id)
    setScreen(next)
  }
  const openProfile = (id:string) => {setProfilePageId(id);setScreen('profile')}
  const toggleFollow = (profileId:string) => setFollowedIds(current=>{const next=current.includes(profileId)?current.filter(id=>id!==profileId):[...current,profileId];try{localStorage.setItem('astitva-following',JSON.stringify(next))}catch{};return next})
  const voteOnClaim = (postId:string,vote:string) => {const eligible=['Expert / Evaluator','Cultural Knowledge Holder'].includes(role)&&currentProfile.verified;if(!eligible){notify('Only verified community experts and cultural knowledge holders can review heritage claims.');return}if(reviewVotes[postId]?.[currentProfile.id]){notify('You have already cast a review vote on this claim.');return}const next={...reviewVotes,[postId]:{...(reviewVotes[postId]||{}),[currentProfile.id]:vote}};setReviewVotes(next);try{localStorage.setItem('astitva-review-votes',JSON.stringify(next))}catch{};const claims=Object.entries(next[postId]);const counts=(v:string)=>claims.filter(([,choice])=>choice===v).length;let status:CommunityPost['verificationStatus']='pending';if(counts('support')>=2)status='verified';else if(counts('context')>=2)status='needs-evidence';else if(counts('dispute')>=2)status='rejected';if(status!=='pending')setCommunityPosts(current=>current.map(post=>post.id===postId?{...post,verificationStatus:status}:post));notify(status==='verified'?'Community review reached two independent approvals.':'Your review vote was recorded; a second eligible reviewer is needed for a decision.')}
  const saveProfile = (name:string,bio:string,avatar:string) => {const next={...profileOverrides,[currentProfile.id]:{name,bio,avatar}};setProfileOverrides(next);try{localStorage.setItem('astitva-profile-edits',JSON.stringify(next))}catch{};notify('Your profile was saved on this device')}
  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [screen])
  useEffect(()=>{try{localStorage.setItem('astitva-posts',JSON.stringify(communityPosts.map(post=>({...post,mediaUrl:post.mediaUrl.startsWith('blob:')?'':post.mediaUrl}))))}catch{notify('Your post is visible now, but browser storage is full; some post details may not persist after refresh.')}},[communityPosts])
  useEffect(()=>{try{localStorage.setItem('astitva-reactions',JSON.stringify(reactions))}catch{}},[reactions])
  useEffect(()=>{const refresh=()=>{try{setPlatformNotices(JSON.parse(localStorage.getItem('astitva-admin-notices')||'[]') as Array<{title:string;body:string;audience:string;created:string}>)}catch{}};window.addEventListener('astitva-notice-updated',refresh);return()=>window.removeEventListener('astitva-notice-updated',refresh)},[])
  useEffect(()=>{let active=true;void Promise.all(communityPosts.filter(post=>post.mediaKey&&!post.mediaUrl).map(async post=>{try{const blob=await loadMedia(post.mediaKey!);return blob?{id:post.id,url:URL.createObjectURL(blob)}:null}catch{return null}})).then(items=>{if(active){const restored=items.filter((item):item is {id:string;url:string}=>Boolean(item));if(restored.length)setCommunityPosts(current=>current.map(post=>{const match=restored.find(item=>item.id===post.id);return match?{...post,mediaUrl:match.url}:post}))}});return()=>{active=false}},[])
  useEffect(()=>{try{localStorage.setItem('astitva-products',JSON.stringify(products))}catch{notify('Listing visible in this session; browser storage is full, so it may not persist after refresh.')}},[products])
  useEffect(()=>{if(screen==='archive'&&role!=='Student / Researcher')setScreen('feed')},[screen,role])

  const enterWorkspace = (nextRole = role) => {
    setRole(nextRole)
    setAuthenticated(true)
    setScreen(nextRole === 'Student / Researcher' ? 'archive' : 'dashboard')
    setAuthMode('login')
  }

  const handleAuth = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (authMode === 'otp') {
      if (otp.length !== 6) return notify('Enter the six-digit code to continue')
      enterWorkspace()
      return notify('Demo sign-in complete')
    }
    if (authMode === 'signup') {
      if (!/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,128}$/.test(password)) {
        return notify('Use 8–128 characters with an uppercase letter, number, and symbol')
      }
      setAuthMode('otp')
      return
    }
    if (!email || !password) return notify('Enter your email and password')
    enterWorkspace()
    notify('Demo sign-in complete')
  }

  if (!authenticated) {
    return <AuthPortal
      mode={authMode} setMode={setAuthMode} role={role} setRole={setRole}
      email={email} setEmail={setEmail} password={password} setPassword={setPassword}
      otp={otp} setOtp={setOtp} onSubmit={handleAuth}
      onGuest={() => { setAuthenticated(true); setScreen('feed') }}
      onDemo={demoRole => { setRole(demoRole); setAuthenticated(true); setScreen(demoRole === 'Student / Researcher' ? 'archive' : 'dashboard') }} toast={toast} notify={notify}
    />
  }

  return <div
  className="
    astitva-shell
    relative
    isolate
    min-h-screen
    text-ink
  "
>
    <div className="mx-auto flex min-h-screen max-w-[1600px] lg:pl-[230px]">
      <Sidebar role={role} screen={screen} setScreen={navigate} onLogout={() => { setAuthenticated(false); setRole('Explorer'); setAuthMode('login') }} />
      <main className="main-sari relative min-w-0 flex-1 pb-[calc(4.25rem+env(safe-area-inset-bottom))] lg:pb-0">
        <header ref={headerRef} className="app-fixed-header fixed left-0 right-0 top-0 z-30 flex items-center justify-between border-b border-[#e9e3d9] bg-paper/95 px-4 py-3.5 backdrop-blur md:px-7">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Close account menu' : 'Open account menu'} aria-expanded={menuOpen} aria-controls="mobile-account-menu" className="rounded-lg p-2 text-[#75675a] lg:hidden">{menuOpen ? <X size={19}/> : <Menu size={19}/>}</button>
            <div><p className="text-[9px] font-bold tracking-[.18em] text-[#a38665]">ASTITVA <span className="mx-1">/</span> {screen.toUpperCase()}</p><h1 className="mt-0.5 font-serif text-xl sm:text-[25px]">{screenTitle(screen, role)}</h1></div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <label className="hidden w-[220px] items-center gap-2 rounded-full border border-[#e8e1d7] bg-white px-3 py-2 text-[#958a7d] md:flex"><Search size={14}/><input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') navigate(role==='Student / Researcher'?'archive':'feed') }} aria-label="Search stories and crafts; students can also search the research archive" className="w-full bg-transparent text-[11px] outline-none placeholder:text-[#a69b8e]" placeholder="Search stories, crafts, places"/></label>
            <button onClick={()=>setComposer('post')} className="header-create-button hidden items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold sm:flex"><Plus size={16}/><span className="inline whitespace-nowrap">Create</span></button>
            <button aria-label="Notifications" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen(!notificationsOpen)} className="header-notifications-button relative rounded-full p-2"><Bell size={18}/>{!notificationsRead&&<span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#F6C026] ring-2 ring-[#3A0A14]"/>}</button>
            <span className="hidden sm:block"><CurtainToggle notify={notify}/></span>
            <button onClick={()=>navigate('profile')} aria-label={`Open ${profileName}'s profile`} className="header-profile-button hidden items-center gap-2 rounded-full py-1 pl-1 pr-3 sm:flex"><img src={currentProfile.avatar} alt="" className="h-8 w-8 rounded-full object-cover"/><span className="text-sm font-semibold">{profileName}</span><UserRound size={15}/></button>
          </div>
          {menuOpen && <section id="mobile-account-menu" aria-label="Mobile account menu" className="mobile-account-menu absolute right-3 top-[calc(100%+0.5rem)] z-40 w-[min(320px,calc(100vw-1.5rem))] lg:hidden"><p className="mobile-account-menu__eyebrow">CURRENT ACCOUNT</p><p className="mobile-account-menu__role">{roleLabel(role)}</p><div className="mobile-account-menu__curtains"><span>Media curtains</span><CurtainToggle notify={notify}/></div><button type="button" onClick={() => { setAuthenticated(false); setRole('Explorer'); setMenuOpen(false); setAuthMode('login') }} className="mobile-account-menu__signout"><span>Sign out</span><LogOut size={17}/></button></section>}
        </header>
        <div aria-hidden="true" style={{ height: headerHeight }}/>
        {notificationsOpen && <section aria-label="Notifications" className="notifications-panel absolute right-4 top-[68px] z-50 w-[min(380px,calc(100vw-2rem))] rounded-2xl p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-bold tracking-[.16em]">ASTITVA · UPDATES</p><h2 className="font-serif text-lg">Notifications</h2></div><button onClick={()=>{setNotificationsRead(true);notify('Notifications marked as read')}} className="notifications-mark-read text-xs font-bold">Mark all read</button></div><div className="mt-3 max-h-[55vh] space-y-2 overflow-y-auto">{platformNotices.filter(item=>item.audience==='Everyone'||(item.audience==='Artisans'&&role==='Artisan')||(item.audience==='Students & researchers'&&role==='Student / Researcher')||(item.audience==='Community reviewers'&&['Expert / Evaluator','Cultural Knowledge Holder'].includes(role))||(item.audience.startsWith('Festival alert'))).map((item,index)=><article key={`${item.created}-${index}`} className="notification-card rounded-xl p-3"><span className="block text-sm font-semibold">{item.title}</span><span className="mt-1 block text-xs">{item.audience} · {item.created}</span><p className="mt-2 text-sm leading-5">{item.body}</p></article>)}{!platformNotices.length&&<p className="notification-card rounded-xl p-3 text-sm">No platform notices yet. New community updates will appear here.</p>}</div><p className="mt-3 text-[11px]">Preview notices are stored locally on this device.</p></section>}
        <div className="sari-flight" role="img" aria-label="Astitva's marigold and mauli thread toran"><span className="sari-flight__motif" /><span className="sari-flight__pallu" /></div>

        <div key={screen} data-screen={screen} className="sari-page page-transition mx-auto max-w-[1330px] px-4 py-5 md:px-7 lg:px-9">
          {screen === 'feed' && <Feed saved={saved} setSaved={setSaved} notify={notify} onNewPost={() => setComposer('post')} communityPosts={communityPosts} setScreen={navigate} query={query} setQuery={setQuery} profiles={visibleProfiles} followedIds={followedIds} onFollow={toggleFollow} onOpenProfile={openProfile} reactions={reactions} setReactions={setReactions} role={role} canVerify={currentProfile.verified&&['Expert / Evaluator','Cultural Knowledge Holder'].includes(role)} reviewVotes={reviewVotes} onReview={voteOnClaim} />}
          {screen === 'dashboard' && <Dashboard role={role} onAddProduct={() => setComposer('product')} setScreen={navigate} setQuery={setQuery} products={products} />}
          {screen === 'marketplace' && <Marketplace notify={notify} products={products} setScreen={navigate} setQuery={setQuery} />}
          {screen === 'map' && <HeritageMap notify={notify} setScreen={navigate} setQuery={setQuery} />}
          {screen === 'archive' && role === 'Student / Researcher' && <ResearchArchive query={query} notify={notify} />}
          {screen === 'profile' && <ProfilePage current={currentProfile} viewed={visibleProfiles.find(item=>item.id===profilePageId)||currentProfile} followedIds={followedIds} onFollow={toggleFollow} onEdit={saveProfile} posts={communityPosts} onOpenProfile={openProfile} />}
        </div>
      </main>
    </div>
    <MobileNav screen={screen} setScreen={navigate} role={role} onCreate={() => setComposer('post')}/>
    {composer === 'product' && role==='Artisan' && <ProductComposer maker={currentProfile.name} onClose={() => setComposer(null)} onCreate={product => { setProducts(current => [product, ...current]); setCommunityPosts(current => [{ id: `product-post-${product.id}`, kind: 'photo', mediaType:'image', caption: `${product.title} · ${product.qualities}. ${product.heritage}`, craft: product.craft, location: product.location, mediaUrl: product.image, filename: product.title, authorId:currentProfile.id, hashtags:['#MakerStory',`#${product.craft.replace(/[^\w]/g,'')}`], createdAt:new Date().toISOString(), claimType:'heritage', verificationStatus:'pending' }, ...current]); setComposer(null); notify('Product saved in the maker market; its heritage claim is pending eligible community review.'); navigate('marketplace') }} />}
    {composer === 'post' && <PostComposer author={currentProfile} role={role} onClose={() => setComposer(null)} onCreate={post => { setCommunityPosts(current => [post, ...current]); setComposer(null); navigate('feed'); notify(post.claimType==='heritage'?'Heritage claim shared and queued for eligible community review':'Your story is now in the Astitva feed') }} />}
    {toast && <div role="status" className="fixed bottom-20 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-[#3e3025] px-5 py-3 text-[11px] text-white shadow-lg lg:bottom-6">{toast}</div>}
  </div>
}

function AuthPortal({ mode, setMode, role, setRole, email, setEmail, password, setPassword, otp, setOtp, onSubmit, onGuest, onDemo, toast, notify }: {
  mode: AuthMode; setMode: (mode: AuthMode) => void; role: Role; setRole: (role: Role) => void
  email: string; setEmail: (value: string) => void; password: string; setPassword: (value: string) => void
  otp: string; setOtp: (value: string) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onGuest: () => void; onDemo: (role: Role) => void; toast: string; notify: (value: string) => void
}) {
  return <div className="auth-page grid min-h-screen lg:grid-cols-[1.05fr_.95fr]">
    <section className="auth-hero relative hidden min-h-screen overflow-hidden text-white lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
      <div className="absolute inset-0 opacity-25" style={{ backgroundImage: `linear-gradient(0deg,rgba(45,30,19,.8),rgba(45,30,19,.15)),url(${photos.loom})`, backgroundPosition: 'center', backgroundSize: 'cover' }}/>
      <div className="relative flex items-center gap-3"><span aria-hidden="true" className="auth-brand-mark sari-mark flex h-11 w-11 items-center justify-center rounded-[14px] font-serif text-[27px] text-white">अ</span><span><span className="block font-serif text-2xl">Astitva</span><span className="text-[9px] tracking-[.25em] text-[#e1c5a3]">LIVING HERITAGE</span></span></div>
      <div className="relative max-w-[600px] pb-12"><p className="mb-4 text-[10px] font-bold tracking-[.2em] text-[#e7bd8d]">CULTURE LIVES IN THE HANDS THAT MAKE IT</p><h1 className="font-serif text-5xl leading-[1.12] xl:text-[62px]">Every craft has a story.<br/><span className="text-[#e8c69f]">Every story has a home.</span></h1><p className="mt-5 max-w-[450px] text-sm leading-7 text-white/75">Meet the makers, hear the traditions, and support the living heritage of communities across India.</p><div className="mt-8 flex gap-3">{['Craft', 'Community', 'Continuity'].map((item, index) => <span key={item} className="rounded-full border border-white/20 bg-white/10 px-3 py-2 text-[10px] text-white/85">0{index + 1} · {item}</span>)}</div></div>
      <p className="relative text-[10px] text-white/55">A regional-first home for living heritage.</p>
    </section>
    <section className="auth-content flex min-h-screen items-center justify-center px-5 py-10 sm:px-10">
      <div className="auth-card w-full max-w-[440px]">
        <div className="auth-mobile-brand mb-9 flex items-center gap-3 lg:hidden"><span aria-hidden="true" className="auth-brand-mark sari-mark flex h-10 w-10 items-center justify-center rounded-[14px] font-serif text-2xl text-white">अ</span><span className="font-serif text-2xl">Astitva</span></div>
        <div className="mb-7"><p className="text-[9px] font-bold tracking-[.18em] text-[#a48766]">{mode === 'signup' ? 'JOIN THE COMMUNITY' : mode === 'otp' ? 'SECURE YOUR ACCOUNT' : 'WELCOME BACK'}</p><h2 className="mt-2 font-serif text-[34px] leading-tight">{mode === 'signup' ? 'Create your account' : mode === 'otp' ? 'Check your inbox' : 'Come on in.'}</h2><p className="mt-2 text-[12px] leading-5 text-[#817568]">{mode === 'otp' ? `We sent a six-digit code to ${email || 'your email address'}.` : 'Discover the people and traditions keeping culture alive.'}</p></div>
        {mode !== 'otp' && <div className="mb-5 grid grid-cols-2 rounded-full bg-[#eee9df] p-1"><button onClick={() => setMode('login')} className={`rounded-full py-2.5 text-[11px] font-semibold ${mode === 'login' ? 'bg-white text-ink shadow-sm' : 'text-[#86796b]'}`}>Sign in</button><button onClick={() => {setRole('Explorer');setMode('signup')}} className={`rounded-full py-2.5 text-[11px] font-semibold ${mode === 'signup' ? 'bg-white text-ink shadow-sm' : 'text-[#86796b]'}`}>Create account</button></div>}
        <form onSubmit={onSubmit} className="space-y-4">
          {mode !== 'otp' ? <>
            <label className="block"><span className="mb-1.5 block text-[10px] font-semibold text-[#62564a]">Email address</span><input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="w-full rounded-xl border border-[#e6ded2] bg-white px-4 py-3 text-xs outline-none transition focus:border-[#b58a65]"/></label>
            <label className="block"><span className="mb-1.5 flex justify-between text-[10px] font-semibold text-[#62564a]">Password {mode === 'login' && <button type="button" onClick={() => notify('Password recovery needs the Astitva email service, which is not connected in this demo.')} className="font-medium text-rust">Forgot password?</button>}</span><input type="password" required minLength={mode === 'signup' ? 8 : undefined} value={password} onChange={e => setPassword(e.target.value)} placeholder={mode === 'signup' ? '8+ characters, uppercase, number, symbol' : 'Enter your password'} className="w-full rounded-xl border border-[#e6ded2] bg-white px-4 py-3 text-xs outline-none transition focus:border-[#b58a65]"/></label>
            {mode === 'signup' && <><label className="block"><span className="mb-1.5 block text-[10px] font-semibold text-[#62564a]">Your primary role</span><select value={role} onChange={e => setRole(e.target.value as Role)} className="w-full rounded-xl border border-[#e6ded2] bg-white px-4 py-3 text-xs outline-none focus:border-[#b58a65]">{roleOptions.filter(option=>['Explorer','Artisan','Student / Researcher'].includes(option)).map(option => <option key={option} value={option}>{roleLabel(option)}</option>)}</select></label><p className="flex items-start gap-2 text-[9px] leading-4 text-[#978a7b]"><ShieldCheck size={13} className="mt-0.5 shrink-0"/>Community reviewer, organisation and moderator access is assigned by an authorised admin.</p></>}
          </> : <><label className="block"><span className="mb-1.5 block text-[10px] font-semibold text-[#62564a]">6-digit email code</span><input inputMode="numeric" autoComplete="one-time-code" maxLength={6} required value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" className="w-full rounded-xl border border-[#e6ded2] bg-white px-4 py-4 text-center font-mono text-xl tracking-[.5em] outline-none focus:border-[#b58a65]"/><button type="button" onClick={() => notify('Email delivery is not connected in this demo, so a new code cannot be sent.')} className="mt-2 text-[10px] font-semibold text-rust">Resend code</button></label><p className="rounded-xl bg-[#f0ece4] p-3 text-[10px] leading-5 text-[#817568]">For this frontend preview, any six digits complete the demo flow. Email delivery and expiry enforcement require the backend.</p></>}
          <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-full bg-rust py-3.5 text-[11px] font-semibold text-white transition hover:bg-[#713a27]">{mode === 'otp' ? 'Verify email' : mode === 'signup' ? 'Create account' : 'Sign in'}<ArrowRight size={14}/></button>
        </form>
        {mode === 'otp' && <button onClick={() => setMode('signup')} className="mt-3 flex w-full items-center justify-center gap-1 text-[10px] text-[#807568]"><ArrowLeft size={12}/> Back to account details</button>}
        {mode === 'login' && <><div className="my-5 flex items-center gap-3 text-[9px] text-[#a79b8e]"><span className="h-px flex-1 bg-[#e7e0d5]"/>OR CONTINUE WITH EMAIL CODE<span className="h-px flex-1 bg-[#e7e0d5]"/></div><button onClick={() => email ? setMode('otp') : notify('Enter your email address first')} className="flex w-full items-center justify-center gap-2 rounded-full border border-[#dfd5c7] bg-white py-3 text-[11px] font-semibold text-[#71573e]"><MailIcon/>Sign in with a one-time code</button><div className="mt-5 rounded-2xl border border-[#e7dfd3] bg-white p-4"><p className="text-[10px] font-bold text-[#57483a]">Try a demo account</p><p className="mt-1 text-[9px] text-[#817568]">Preview each workspace in Astitva.</p><div className="mt-3 grid grid-cols-2 gap-2">{(['Artisan','Student / Researcher','Explorer','Cultural Knowledge Holder','Institution / NGO','Admin / Moderator'] as Role[]).map(demoRole => <button key={demoRole} onClick={() => onDemo(demoRole)} className="rounded-xl bg-[#f5f1e8] px-2 py-2.5 text-[9px] font-semibold text-[#6b5139]">{roleLabel(demoRole)}</button>)}</div></div></>}
        <p className="mt-6 text-center text-[9px] leading-5 text-[#a09485]">By continuing, you agree to our community guidelines and privacy policy.</p>
        <button onClick={onGuest} className="mt-5 w-full text-center text-[10px] font-semibold text-[#976943]">Explore the public feed first <ArrowRight className="ml-1 inline" size={12}/></button>
        {toast && <p role="status" className="mt-4 rounded-xl bg-[#3e3025] px-4 py-3 text-center text-[10px] text-white">{toast}</p>}
      </div>
    </section>
  </div>
}

function MailIcon() { return <MessageCircle size={15}/> }

function Sidebar({ role, screen, setScreen, onLogout }: { role: Role; screen: Screen; setScreen: (screen: Screen) => void; onLogout: () => void }) {
  const researcher = role === 'Student / Researcher'
  const nav = [
    { title: 'Discover feed', icon: Home, screen: 'feed' as Screen },
    ...(!researcher ? [{ title: 'My dashboard', icon: BarChart3, screen: 'dashboard' as Screen }] : []),
    { title: 'Heritage map', icon: Map, screen: 'map' as Screen },
    { title: 'Marketplace', icon: ShoppingBag, screen: 'marketplace' as Screen },
    ...(researcher ? [{ title: 'Research workspace', icon: Archive, screen: 'archive' as Screen }] : []),
    { title: 'My profile', icon: UserRound, screen: 'profile' as Screen },
  ]
  return <aside className="sari-sidebar fixed inset-y-0 left-0 z-40 hidden h-screen h-[100dvh] w-[230px] shrink-0 flex-col overflow-hidden border-r border-[#e9e3d9] bg-[#fbfaf6] px-5 py-5 lg:flex">
    <button onClick={() => setScreen('feed')} aria-label="Astitva home: open Discover feed" className="mb-4 flex items-center gap-3 text-left"><span className="sari-mark flex h-10 w-10 items-center justify-center rounded-[14px] font-serif text-2xl text-white">अ</span><span><span className="block font-serif text-[22px] font-semibold leading-5 text-[#f6c026]">अस्तित्व</span><span className="mt-1 block text-[8px] tracking-[.12em] text-[#f1ddbd]">हर कहानी एक धागे से जुड़ी है</span></span></button>
    <p className="mb-2 px-3 text-[9px] font-bold tracking-[.18em] text-[#aa9e90]">EXPLORE</p>
    <nav className="space-y-1">{nav.map(item => <button key={item.title} onClick={() => setScreen(item.screen)} className={`sari-nav-item flex w-full min-w-0 items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[12px] transition ${screen === item.screen ? 'bg-[#f1e8dc] font-semibold text-[#65442c]' : 'text-[#776d62] hover:bg-[#f5f1ea]'}`}><item.icon className="shrink-0" size={17} strokeWidth={1.7}/><span className="min-w-0 flex-1">{item.title}</span></button>)}</nav>
    <div className="my-5 border-t border-[#e9e3d9]"/><p className="mb-2 px-3 text-[9px] font-bold tracking-[.18em] text-[#aa9e90]">WORKSPACE</p>
    <p className="mb-2 rounded-xl bg-[#f7f3ec] px-3 py-2.5 text-xs text-[#6b5139]">Signed in as <b>{roleLabel(role)}</b>. Role changes require an authorized admin.</p>
    <button onClick={onLogout} className="mt-auto border-t border-[#e9e3d9] pt-4 text-left text-sm font-semibold text-[#f8ebd0] hover:text-[#f6c026]">Sign out</button>
  </aside>
}

function screenTitle(screen: Screen, role: Role) {
  if (screen === 'feed') return 'The Heritage Thread Board'
  if (screen === 'dashboard') return role === 'Artisan' ? 'Creator & sales studio' : role === 'Explorer' ? 'Your culture passport' : role === 'Student / Researcher' ? 'Heritage research workspace' : role === 'Expert / Evaluator' || role === 'Cultural Knowledge Holder' ? 'Community review desk' : role === 'Institution / NGO' ? 'Community impact hub' : 'Platform operations'
  if (screen === 'marketplace') return 'Find a piece with a story.'
  if (screen === 'map') return 'Explore heritage by place.'
  if (screen === 'archive') return 'Heritage research workspace.'
  return 'Your Astitva profile.'
}

function MobileNav({ screen, setScreen, role, onCreate }: { screen: Screen; setScreen: (screen: Screen) => void; role: Role; onCreate: () => void }) {
  const researcher = role === 'Student / Researcher'
  const options: { title: string; icon: typeof Home; screen?: Screen; action?: () => void }[] = [
    { title: 'Feed', icon: Home, screen: 'feed' }, ...(researcher ? [] : [{ title: 'Dashboard', icon: BarChart3, screen: 'dashboard' as Screen }]),
    { title: 'Map', icon: Map, screen: 'map' }, { title: 'Shop', icon: ShoppingBag, screen: 'marketplace' },
    ...(researcher ? [{ title: 'Research', icon: BookOpen, screen: 'archive' as Screen }] : []),
    { title: 'Create', icon: Plus, action: onCreate },
    { title: 'Profile', icon: UserRound, screen: 'profile' },
  ]
  return <nav aria-label="Main navigation" className="sari-mobile-nav fixed inset-x-0 bottom-0 z-40 grid grid-flow-col auto-cols-fr border-t px-2 py-2 backdrop-blur lg:hidden" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>{options.map(item => <button key={item.title} type="button" onClick={() => item.action ? item.action() : item.screen && setScreen(item.screen)} aria-current={item.screen && screen === item.screen ? 'page' : undefined} className={`relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-0 py-1 text-[8px] ${item.action ? 'mobile-create-nav-item font-semibold' : screen === item.screen ? 'font-semibold text-rust' : 'text-[#75665f]'}`}><item.icon size={19}/>{item.title}</button>)}</nav>
}

function ComposerFrame({ title, eyebrow, onClose, children }: { title: string; eyebrow: string; onClose: () => void; children: ReactNode }) {
  return <div className="sari-composer-overlay fixed inset-0 z-[70] flex items-center justify-center p-3 backdrop-blur-sm sm:p-6" onClick={onClose}><section onClick={event=>event.stopPropagation()} className="sari-composer-panel max-h-[94vh] w-full max-w-[760px] overflow-y-auto rounded-[24px]"><div className="woven-rule"/><div className="sari-composer-header flex items-start justify-between px-5 py-4 sm:px-7"><div><p className="craft-overline text-[8px]">{eyebrow}</p><h2 className="mt-1 font-serif text-[25px]">{title}</h2></div><button type="button" onClick={onClose} className="sari-composer-close rounded-full p-2"><X size={18}/></button></div>{children}</section></div>
}

function ProductComposer({ maker, onClose, onCreate }: { maker:string; onClose: () => void; onCreate: (product: ProductListing) => void }) {
  const [title, setTitle] = useState('')
  const [craft, setCraft] = useState('Handloom')
  const [qualities, setQualities] = useState('')
  const [heritage, setHeritage] = useState('')
  const [price, setPrice] = useState('')
  const [location, setLocation] = useState('')
  const [stock, setStock] = useState('1')
  const [imageUrl, setImageUrl] = useState('')
  const [imageName, setImageName] = useState('')

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onCreate({ id: `maker-${Date.now()}`, title, craft, qualities, heritage, price, location, stock, image: imageUrl, maker })
  }

  return <ComposerFrame title="Give your work its own place." eyebrow="MAKER LISTING · PRODUCT STORY" onClose={onClose}>
    <form onSubmit={submit} className="space-y-5 px-5 py-5 sm:px-7">
      <div className="grid gap-4 md:grid-cols-[1.15fr_.85fr]">
        <div className="space-y-4">
          <Field label="What are you making?" hint="Use the name a customer or neighbor would recognize."><input required value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Indigo Ajrakh table runner" className="form-control"/></Field>
          <Field label="Craft & tradition"><select value={craft} onChange={e=>setCraft(e.target.value)} className="form-control"><option>Handloom</option><option>Block print</option><option>Natural dye</option><option>Pottery</option><option>Metalwork</option><option>Embroidery</option><option>Woodwork</option><option>Other craft</option></select></Field>
          <Field label="What makes it special?" hint="Material, technique, feel, finish, or how it is used."><textarea required rows={3} value={qualities} onChange={e=>setQualities(e.target.value)} placeholder="Handwoven in kala cotton, naturally textured, finished on a pit loom…" className="form-control resize-y"/></Field>
          <Field label="How does it carry your heritage?" hint="Tell the making story in your own words: a place, a family practice, a community technique, or a meaning held in the pattern."><textarea required rows={4} value={heritage} onChange={e=>setHeritage(e.target.value)} placeholder="My mother taught me this border pattern. We dye the yarn with…" className="form-control resize-y"/></Field>
        </div>
        <div className="space-y-4">
          <label className="group flex min-h-[210px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-[#c9b99e] bg-[#f4efe4] text-center transition hover:bg-[#f0e8d8]">
            {imageUrl ? <CurtainMedia className="h-[210px] w-full curtain-media--window" label="product preview"><img src={imageUrl} alt="Product preview" className="h-full w-full object-cover"/></CurtainMedia> : <><span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#e6decd] text-indigo"><Upload size={18}/></span><span className="text-[10px] font-semibold">Add a product photograph</span><span className="mt-1 px-4 text-[9px] text-[#8c8071]">Show the texture, detail, and scale of your work</span></>}
            <input type="file" accept="image/*" required className="sr-only" onChange={e=>{const file=e.target.files?.[0]; if(file){setImageUrl(URL.createObjectURL(file));setImageName(file.name)}}}/>
          </label>
          {imageName && <p className="-mt-3 truncate text-[8px] text-[#82786c]">{imageName}</p>}
          <div className="rounded-2xl border border-[#e6dece] bg-white p-4"><p className="mb-3 flex items-center gap-2 text-[9px] font-bold tracking-[.12em] text-indigo"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#eef0f4]">₹</span> PRICE & AVAILABILITY</p><div className="grid grid-cols-2 gap-3"><Field label="Price (INR)"><input type="number" min="1" step="1" required value={price} onChange={e=>setPrice(e.target.value)} placeholder="2400" className="form-control"/></Field><Field label="Pieces available"><input required value={stock} onChange={e=>setStock(e.target.value)} placeholder="4 or made to order" className="form-control"/></Field></div><p className="mt-2 text-[8px] leading-4 text-[#8e8376]">Explorers see your price and availability before contacting you.</p></div>
          <Field label="Where is it made?" hint="Village or neighborhood, district, state."><div className="relative"><MapPin size={14} className="absolute left-3 top-3 text-[#9a754c]"/><input required value={location} onChange={e=>setLocation(e.target.value)} placeholder="Bhujodi, Kutch, Gujarat" className="form-control pl-9"/></div></Field>
          <div className="rounded-xl bg-[#eef0e8] p-3 text-[9px] leading-4 text-[#65704f]"><ShieldCheck size={13} className="mr-1 inline"/>Your listing can request heritage verification after publishing. A badge is only shown after review.</div>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e9e1d4] pt-4"><p className="text-[8px] text-[#8b8072]">Your name, place, making story, and price appear together on the listing.</p><div className="flex gap-2"><button type="button" onClick={onClose} className="rounded-full border border-[#ded4c4] px-4 py-2.5 text-[9px] font-semibold text-[#746b61]">Cancel</button><button type="submit" className="rounded-full bg-indigo px-5 py-2.5 text-[9px] font-semibold text-white">Publish product story <ArrowRight className="ml-1 inline" size={12}/></button></div></div>
    </form>
  </ComposerFrame>
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) { return <label className="block"><span className="block text-[9px] font-bold text-[#4b4d60]">{label}</span>{hint && <span className="mt-0.5 block text-[8px] leading-4 text-[#8d8274]">{hint}</span>}<div className="mt-1.5">{children}</div></label> }


export default App
