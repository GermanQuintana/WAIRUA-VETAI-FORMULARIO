type ThemeIconProps = {
  theme: 'light' | 'dark';
  className?: string;
};

export default function ThemeIcon({ theme, className }: ThemeIconProps) {
  return (
    <span aria-hidden="true" className={`theme-icon-emoji ${className ?? ''}`.trim()}>
      {theme === 'light' ? '☀️' : '🌙'}
    </span>
  );
}
