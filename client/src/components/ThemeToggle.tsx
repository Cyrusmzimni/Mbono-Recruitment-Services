import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type ThemeMode } from "../lib/theme";

const options: { mode: ThemeMode; icon: any; label: string }[] = [
  { mode: "light", icon: Sun, label: "Light" },
  { mode: "dark", icon: Moon, label: "Dark" },
  { mode: "system", icon: Monitor, label: "System" },
];

/** Segmented control: Light / Dark / System. */
export default function ThemeToggle({ showLabels = false }: { showLabels?: boolean }) {
  const { mode, setMode } = useTheme();
  return (
    <div role="radiogroup" aria-label="Colour theme" className="inline-flex items-center rounded-lg border border-ink-200 bg-ink-50 p-0.5 dark:border-ink-700 dark:bg-ink-900">
      {options.map(o => (
        <button key={o.mode} role="radio" aria-checked={mode === o.mode} title={`${o.label} theme`} onClick={() => setMode(o.mode)}
          className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition ${mode === o.mode ? "bg-white text-brand-700 shadow-sm dark:bg-ink-700 dark:text-brand-300" : "text-ink-500 hover:text-ink-800 dark:text-ink-400 dark:hover:text-white"}`}>
          <o.icon size={15} />{showLabels && o.label}
          <span className="sr-only">{!showLabels && o.label}</span>
        </button>
      ))}
    </div>
  );
}
