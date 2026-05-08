import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Sparkles } from "lucide-react";

export const QuickBuildBetaBadge = () => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Badge
        variant="secondary"
        className="gap-1 bg-amber-100 text-amber-900 border border-amber-200 hover:bg-amber-100"
      >
        <Sparkles className="h-3 w-3" />
        QuickBuild · Beta
      </Badge>
    </TooltipTrigger>
    <TooltipContent className="max-w-xs">
      QuickBuild is in beta. It saves time on the typing — your expertise still
      does the quoting.
    </TooltipContent>
  </Tooltip>
);

export default QuickBuildBetaBadge;
