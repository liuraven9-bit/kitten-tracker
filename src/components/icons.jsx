// Minimal inline icons (no icon library dependency).
const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }

export const Home = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></svg>
)
export const Plus = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></svg>
)
export const Database = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5" /><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" /></svg>
)
export const LineChart = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}><path d="M4 4v16h16" /><path d="M7 14l3-4 3 3 4-6" /></svg>
)
export const Cog = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" /></svg>
)
export const Camera = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}><path d="M3 8h3l2-2.5h8L18 8h3v11H3z" /><circle cx="12" cy="13" r="3.5" /></svg>
)
export const Scan = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}><path d="M4 7V5a1 1 0 011-1h2M17 4h2a1 1 0 011 1v2M20 17v2a1 1 0 01-1 1h-2M7 20H5a1 1 0 01-1-1v-2" /><path d="M7 8v8M10 8v8M13 8v8M17 8v8" /></svg>
)
export const Trash = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" /></svg>
)
export const Edit = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}><path d="M4 20h4L19 9l-4-4L4 16v4z" /><path d="M14 6l4 4" /></svg>
)
export const Drop = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}><path d="M12 3s6 7 6 11a6 6 0 11-12 0c0-4 6-11 6-11z" /></svg>
)
export const Bowl = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}><path d="M3 11h18a9 9 0 01-18 0z" /><path d="M12 11V8M9 8c0-2 6-2 6 0" /></svg>
)
export const Check = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}><path d="M5 12l4 4 10-11" /></svg>
)
export const X = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}><path d="M6 6l12 12M18 6L6 18" /></svg>
)
