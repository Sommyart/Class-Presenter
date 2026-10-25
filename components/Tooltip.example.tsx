import * as React from "react";
import { Info, Settings, AlertCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./Tooltip";
import { Button } from "./Button";

export const BasicTooltips = {
  size: "md",
  backdrop: "surface",
  title: "Basic tooltips",
  component: () => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon-sm">
            <Info size={16} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Helpful information tooltip</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon-sm">
            <Settings size={16} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Configure settings</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon-sm">
            <AlertCircle size={16} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Warning: This action cannot be undone</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
};

export const LongContentTooltip = {
  size: "md",
  backdrop: "surface",
  title: "Tooltip with longer content",
  component: () => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="link">Hover for more details</Button>
        </TooltipTrigger>
        <TooltipContent>
          This is a longer tooltip that explains more detailed information about
          the feature or action being described.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
};
