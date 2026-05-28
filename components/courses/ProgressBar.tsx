import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  className?: string;
  showLabel?: boolean;
}

export default function ProgressBar({ value, className, showLabel = true }: ProgressBarProps) {
  return (
    <div className={cn("space-y-1", className)}>
      {showLabel && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Progreso</span>
          <span>{Math.round(value)}%</span>
        </div>
      )}
      <Progress value={value} className="h-2" />
    </div>
  );
}
