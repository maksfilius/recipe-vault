'use client';

export default function Topbar() {
  return (
    <header className="sticky top-0 z-10 border-b border-white/10 bg-white/75 shadow-[0_10px_35px_rgba(15,23,42,0.12)] backdrop-blur-md">
      <div className="flex h-20 items-center px-6">
        <div className="leading-tight">
          <p className="text-2xl font-semibold text-slate-900">Hi there! Ready to cook?</p>
          <span className="text-sm text-slate-500">Let&apos;s organize dinner plans with style</span>
        </div>
      </div>
    </header>
  );
}
