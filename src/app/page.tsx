export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
      <span className="rounded-full border-2 border-ink bg-accent-200 px-4 py-1 text-sm font-bold uppercase tracking-wide">
        Scaffold ready
      </span>
      <h1 className="font-display text-5xl font-bold tracking-tight text-primary-700 sm:text-6xl">
        Teio
      </h1>
      <p className="max-w-md text-lg text-ink/70">
        Gamified STEM learning for grades 7-12. Math, science, technology,
        engineering.
      </p>
      <button
        type="button"
        className="rounded-2xl border-[3px] border-ink bg-primary-500 px-6 py-3 font-display text-lg font-semibold text-white shadow-[4px_4px_0_0_var(--color-ink)] transition-transform active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
      >
        Start learning
      </button>
    </div>
  );
}
