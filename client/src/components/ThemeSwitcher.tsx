import { useSetflow } from '../store';
import { THEMES } from '../theme/themes';

export function ThemeSwitcher() {
  const themeId = useSetflow((s) => s.themeId); const setTheme = useSetflow((s) => s.setTheme);
  return <select aria-label="Theme" value={themeId} onChange={(event) => setTheme(event.target.value as typeof themeId)}>{THEMES.map((theme) => <option key={theme.id} value={theme.id}>{theme.label}</option>)}</select>;
}
