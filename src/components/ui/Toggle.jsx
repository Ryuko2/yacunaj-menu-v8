export function Toggle({ label, emoji, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-bark accent-palm"
      />
      <span className="text-sm text-bark">{emoji} {label}</span>
    </label>
  )
}
