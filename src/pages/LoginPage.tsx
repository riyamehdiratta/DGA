import { useState, type FormEvent } from 'react';
import { ApiError } from '@/api/client';
import type { SignupPayload } from '@/api/auth';
import dtlLogo from '@/assets/dtl-logo.png';
import transformerGrid from '@/assets/transformer-grid-background.png';

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onSignup: (payload: SignupPayload) => Promise<void>;
}

const SUBSTATION_AREAS = {
  '400 kV': ['Bawana', 'Bamnauli', 'Harsh Vihar', 'Tikri Kalan (Mundka)'],
  '220 kV': ['BTPS', 'Dev Nagar', 'DSIDC Bawana', 'DIAL', 'Dwarka, Sec-05', 'Electric Lane', 'Geeta Colony', 'Gazipur', 'Gopalpur', 'Indraprastha', 'Khanjawala', 'Kashmere Gate', 'Lodhi Road', 'Maharani Bagh', 'Mehrauli', 'Najafgarh', 'Naraina', 'Narela', 'Okhla', 'Pappankalan-I', 'Park Street', 'Patparganj', 'Peeragarhi', 'Pragati', 'Preet Vihar', 'Rohini-I', 'R. K. Puram', 'Sarita Vihar', 'Shalimar Bagh', 'Subzi Mandi', 'Timarpur', 'Tughlakabad', 'Vasant Kunj', 'Wazirpur'],
} as const;

type Mode = 'signin' | 'signup';

export function LoginPage({ onLogin, onSignup }: LoginPageProps) {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [designation, setDesignation] = useState('');
  const [substationType, setSubstationType] = useState<keyof typeof SUBSTATION_AREAS>('220 kV');
  const [substationArea, setSubstationArea] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function changeMode(nextMode: Mode) {
    setMode(nextMode);
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === 'signin') await onLogin(email, password);
      else await onSignup({ email, password, designation, substationType, substationArea });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to continue. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const areas = SUBSTATION_AREAS[substationType];

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-8 sm:px-6">
      <img src={transformerGrid} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
      <div className="absolute inset-0 bg-gradient-to-br from-[#061c35]/95 via-[#0b3451]/82 to-[#06101e]/95" />
      <section className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center justify-end">
        <div className="w-full max-w-md rounded-2xl border border-white/20 bg-white/95 p-6 shadow-2xl backdrop-blur sm:p-8">
          <div className="mb-6 flex items-center gap-4">
            <img src={dtlLogo} alt="Delhi Transco Limited" className="h-14 w-24 object-contain" />
            <div className="border-l border-slate-200 pl-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0f4c81]">Delhi Transco Limited</p>
              <h1 className="mt-0.5 text-xl font-bold text-slate-900">DGA Analysis System</h1>
            </div>
          </div>
          <div className="mb-6 grid grid-cols-2 rounded-lg bg-slate-100 p-1 text-sm font-semibold">
            <button type="button" onClick={() => changeMode('signin')} className={`rounded-md px-3 py-2 ${mode === 'signin' ? 'bg-white text-[#0f4c81] shadow-sm' : 'text-slate-500'}`}>Sign in</button>
            <button type="button" onClick={() => changeMode('signup')} className={`rounded-md px-3 py-2 ${mode === 'signup' ? 'bg-white text-[#0f4c81] shadow-sm' : 'text-slate-500'}`}>Create account</button>
          </div>
          <form className="space-y-4" onSubmit={handleSubmit}>
            {mode === 'signup' && <><Field label="Designation" htmlFor="designation"><input className="w-full rounded-lg px-3 py-2" id="designation" value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="e.g. Substation Engineer" required /></Field><div className="grid grid-cols-2 gap-3"><Field label="Substation type" htmlFor="substation-type"><select className="w-full rounded-lg px-3 py-2" id="substation-type" value={substationType} onChange={(e) => { const type = e.target.value as keyof typeof SUBSTATION_AREAS; setSubstationType(type); setSubstationArea(''); }} required>{Object.keys(SUBSTATION_AREAS).map((type) => <option key={type}>{type}</option>)}</select></Field><Field label="Substation area" htmlFor="substation-area"><select className="w-full rounded-lg px-3 py-2" id="substation-area" value={substationArea} onChange={(e) => setSubstationArea(e.target.value)} required><option value="">Select area</option>{areas.map((area) => <option key={area}>{area}</option>)}</select></Field></div></>}
            <Field label="Email address" htmlFor="login-email"><input className="w-full rounded-lg px-3 py-2" id="login-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@dtl.gov.in" required /></Field>
            <Field label="Password" htmlFor="login-password"><input className="w-full rounded-lg px-3 py-2" id="login-password" type="password" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} value={password} onChange={(e) => setPassword(e.target.value)} minLength={mode === 'signup' ? 8 : undefined} placeholder={mode === 'signup' ? 'Minimum 8 characters' : undefined} required /></Field>
            {error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <button type="submit" disabled={submitting} className="w-full rounded-lg bg-[#0f4c81] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0b3d68] disabled:opacity-60">{submitting ? 'Please wait…' : mode === 'signin' ? 'Sign in to dashboard' : 'Create engineer account'}</button>
          </form>
          {mode === 'signin' && <div className="mt-5 rounded-lg border border-[#bdd4e9] bg-[#eff7fd] p-3 text-xs text-slate-700"><p className="font-bold text-[#0f4c81]">College demo administrator</p><p className="mt-1">admin@dtl.demo &nbsp;·&nbsp; Admin@123</p></div>}
          {mode === 'signup' && <p className="mt-4 text-center text-xs text-slate-500">New registrations are assigned the Engineer role.</p>}
        </div>
      </section>
    </main>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-700"><span className="mb-1.5 block">{label}</span>{children}</label>;
}
