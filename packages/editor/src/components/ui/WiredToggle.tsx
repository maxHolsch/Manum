interface WiredToggleProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
}

export function WiredToggle({ checked, onChange, disabled }: WiredToggleProps) {
  const handleChange = (e: Event) => {
    const target = e.target as HTMLElement & { checked?: boolean };
    onChange?.(target.checked ?? false);
  };

  return (
    <wired-toggle
      ref={(el: HTMLElement | null) => {
        if (el) {
          el.removeEventListener('change', handleChange);
          el.addEventListener('change', handleChange);
        }
      }}
      checked={checked}
      style={{ opacity: disabled ? 0.5 : 1 }}
    />
  );
}
