import { SonnerToaster } from "./SonnerToaster";
import { Button } from "./Button";
import { toast } from "sonner";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
} from "lucide-react";

export const ToastVariantsExample = {
  size: "md",
  backdrop: "surface",
  title: "Toast Variants",
  component: () => {
    return (
      <>
        <Button
          onClick={() => {
            toast.success("Success Toast", {
              description: "This is a success toast message",
              icon: <CheckCircle2 size={20} />,
              action: {
                label: "Action",
                onClick: () => alert("Action clicked"),
              },
              cancel: {
                label: "Cancel",
                onClick: () => {},
              },
              closeButton: true,
            });
          }}
        >
          Success
        </Button>

        <Button
          onClick={() => {
            toast.error("Error Toast", {
              description: "This is an error toast message",
              icon: <AlertCircle size={20} />,
              action: {
                label: "Action",
                onClick: () => alert("Action clicked"),
              },
              cancel: {
                label: "Cancel",
                onClick: () => {},
              },
              closeButton: true,
            });
          }}
        >
          Error
        </Button>

        <Button
          onClick={() => {
            toast.warning("Warning Toast", {
              description: "This is a warning toast message",
              icon: <AlertTriangle size={20} />,
              action: {
                label: "Action",
                onClick: () => alert("Action clicked"),
              },
              cancel: {
                label: "Cancel",
                onClick: () => {},
              },
              closeButton: true,
            });
          }}
        >
          Warning
        </Button>

        <Button
          onClick={() => {
            toast.info("Info Toast", {
              description: "This is an info toast message",
              icon: <Info size={20} />,
              action: {
                label: "Action",
                onClick: () => alert("Action clicked"),
              },
              cancel: {
                label: "Cancel",
                onClick: () => {},
              },
              closeButton: true,
            });
          }}
        >
          Info
        </Button>
        <SonnerToaster closeButton={false} />
      </>
    );
  },
};
