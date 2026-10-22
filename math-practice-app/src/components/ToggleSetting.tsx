import { useId } from 'react'

interface ToggleSettingProps {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}

/** An on/off switch. A real checkbox with role="switch", so it works with keyboard and screen readers. */
function ToggleSetting({ label, description, checked, onChange }: ToggleSettingProps) {
  const descriptionId = useId()
  return (
    <label className="toggle-setting">
      <span className="toggle-setting__text">
        <span className="toggle-setting__label">{label}</span>
        <span id={descriptionId} className="toggle-setting__description">
          {description}
        </span>
      </span>
      <input
        type="checkbox"
        role="switch"
        className="toggle-setting__input"
        checked={checked}
        aria-describedby={descriptionId}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="toggle-setting__switch" aria-hidden="true">
        <span className="toggle-setting__state">{checked ? 'On' : 'Off'}</span>
      </span>
    </label>
  )
}

export default ToggleSetting
