import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
}

export default function ThemeToggle({ darkMode, setDarkMode }: Props) {
  return (
    <button
      onClick={() => setDarkMode(!darkMode)}
      className={cn(
        "rounded-lg p-2 text-foreground/70 transition-colors",
        "duration-300 hover:text-foreground",
      )}
    >
      {darkMode ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
