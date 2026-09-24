import { SignInForm } from "./SignInForm";

interface OnboardingScreenProps {
  darkMode: boolean;
  onToggleDark: () => void;
}

export function OnboardingScreen({ darkMode, onToggleDark }: OnboardingScreenProps) {
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      {/* Header */}
      <header className="h-16 flex justify-between items-center border-b border-[#EAE0C8] dark:border-[#3A3323] px-6 bg-white dark:bg-[#221D13] shadow-sm">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Flux Note" className="w-10 h-10 rounded-xl shadow-sm" />

          <h1 className="text-xl font-bold text-[#201C16] dark:text-[#EDE6D3]">Flux Note</h1>
        </div>
        <button
          onClick={onToggleDark}
          className="p-2 rounded-lg hover:bg-[#F6F1E7] dark:hover:bg-[#3A3323] transition-colors"
          title="Toggle dark mode"
        >
          {darkMode ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row">
        {/* Left: Hero */}
        <div className="flex-1 min-w-0 flex flex-col items-center justify-center p-8 lg:p-16 bg-[#F0E9D8] dark:bg-[#17130D]">
          <div className="max-w-lg w-full">
            {/* Illustration */}
            <div className="mb-8 flex justify-center">
              <CollabIllustration />
            </div>
            <h2 className="text-4xl font-bold mb-4 text-[#201C16] dark:text-[#EDE6D3] leading-tight">
              Write together,<br />
              <span className="text-[#5C6E4E]">in real time.</span>
            </h2>
            <p className="text-[#6B6455] dark:text-[#93876A] text-lg mb-8 leading-relaxed">
              Flux Note is a collaborative document editor with live presence, cursor tracking, and instant sync — built for teams who think in markdown.
            </p>
            <div className="flex flex-wrap gap-4">
              <Feature icon="⚡" label="Real-time sync" />
              <Feature icon="👥" label="Live cursors" />
              <Feature icon="🔗" label="Invite links" />
              <Feature icon="🌙" label="Dark mode" />
            </div>
          </div>
        </div>

        {/* Right: Sign in */}
        <div className="flex-shrink-0 flex items-center justify-center p-8 lg:p-12 xl:p-16 bg-white dark:bg-[#221D13] lg:w-[380px] xl:w-[480px] lg:min-h-screen border-t lg:border-t-0 lg:border-l border-[#EAE0C8] dark:border-[#3A3323]">
          <div className="w-full max-w-sm">
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-[#201C16] dark:text-[#EDE6D3] mb-2">Get started</h3>
              <p className="text-[#6B6455] dark:text-[#93876A]">Sign in to start collaborating</p>
            </div>
            <SignInForm />
          </div>
        </div>
      </main>
    </div>
  );
}

function Feature({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-[#221D13] border border-[#EAE0C8] dark:border-[#3A3323] text-sm font-medium text-[#6B6455] dark:text-[#93876A]">
      <span>{icon}</span>
      <span>{label}</span>
    </div>
  );
}

function CollabIllustration() {
  return (
    <svg width="320" height="220" viewBox="0 0 320 220" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Document background */}
      <rect x="60" y="20" width="200" height="180" rx="12" fill="white" stroke="#EAE0C8" strokeWidth="1.5"/>
      {/* Dark mode tint overlay */}
      <rect x="60" y="20" width="200" height="180" rx="12" fill="#5C6E4E" fillOpacity="0.04"/>

      {/* Document lines */}
      <rect x="84" y="50" width="120" height="8" rx="4" fill="#5C6E4E" fillOpacity="0.7"/>
      <rect x="84" y="70" width="152" height="5" rx="2.5" fill="#EAE0C8"/>
      <rect x="84" y="82" width="140" height="5" rx="2.5" fill="#EAE0C8"/>
      <rect x="84" y="94" width="100" height="5" rx="2.5" fill="#EAE0C8"/>
      <rect x="84" y="114" width="80" height="6" rx="3" fill="#5C6E4E" fillOpacity="0.5"/>
      <rect x="84" y="128" width="152" height="5" rx="2.5" fill="#EAE0C8"/>
      <rect x="84" y="140" width="130" height="5" rx="2.5" fill="#EAE0C8"/>
      <rect x="84" y="152" width="90" height="5" rx="2.5" fill="#EAE0C8"/>

      {/* Cursor 1 - blue */}
      <line x1="168" y1="128" x2="168" y2="143" stroke="#5C6E4E" strokeWidth="2"/>
      <rect x="168" y="118" width="36" height="14" rx="3" fill="#5C6E4E"/>
      <text x="172" y="129" fontSize="7" fill="white" fontFamily="sans-serif" fontWeight="600">Alice</text>

      {/* Cursor 2 - cyan */}
      <line x1="214" y1="140" x2="214" y2="155" stroke="#B98A3D" strokeWidth="2"/>
      <rect x="214" y="130" width="32" height="14" rx="3" fill="#B98A3D"/>
      <text x="218" y="141" fontSize="7" fill="#201C16" fontFamily="sans-serif" fontWeight="600">Bob</text>

      {/* Avatar 1 */}
      <circle cx="40" cy="60" r="18" fill="#5C6E4E"/>
      <text x="40" y="65" textAnchor="middle" fontSize="12" fill="white" fontFamily="sans-serif" fontWeight="700">A</text>
      <circle cx="40" cy="60" r="18" stroke="white" strokeWidth="2"/>

      {/* Avatar 2 */}
      <circle cx="280" cy="100" r="18" fill="#B98A3D"/>
      <text x="280" y="105" textAnchor="middle" fontSize="12" fill="#201C16" fontFamily="sans-serif" fontWeight="700">B</text>
      <circle cx="280" cy="100" r="18" stroke="white" strokeWidth="2"/>

      {/* Connection lines */}
      <path d="M57 65 Q60 65 64 70" stroke="#5C6E4E" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.5"/>
      <path d="M263 105 Q260 110 256 128" stroke="#B98A3D" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.5"/>

      {/* Live badge */}
      <rect x="220" y="22" width="36" height="16" rx="8" fill="#6B7F4F"/>
      <circle cx="229" cy="30" r="3" fill="white"/>
      <text x="235" y="34" fontSize="7" fill="white" fontFamily="sans-serif" fontWeight="700">LIVE</text>
    </svg>
  );
}
