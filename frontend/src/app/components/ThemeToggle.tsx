import { Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { Button } from './ui/button';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="relative rounded-full w-10 h-10 transition-all duration-300 hover:bg-muted/80"
      aria-label="Toggle theme"
    >
      <Sun
        className={`h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${
          theme === 'dark' ? '-rotate-90 scale-0' : ''
        }`}
      />
      <Moon
        className={`h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${
          theme === 'dark' ? 'rotate-0 scale-100' : ''
        }`}
      />
    </Button>
  );
}
