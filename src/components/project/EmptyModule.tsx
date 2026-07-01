import type { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  title: string;
  message: string;
  hint?: string;
}

/**
 * Informative empty-state card for a Project Control Centre module. Explains the
 * module's future purpose so an unpopulated tab still feels useful and calm.
 */
const EmptyModule = ({ icon: Icon, title, message, hint }: Props) => (
  <div className="bg-card rounded-2xl p-8 border border-border text-center">
    <Icon className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" aria-hidden="true" />
    <h3 className="font-heading text-primary text-lg">{title}</h3>
    <p className="font-mono text-sm text-muted-foreground mt-2 max-w-md mx-auto leading-relaxed">
      {message}
    </p>
    {hint && (
      <p className="font-mono text-xs text-muted-foreground/70 mt-2">{hint}</p>
    )}
  </div>
);

export default EmptyModule;
