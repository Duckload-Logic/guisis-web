import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm",
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const getComponentDisplayName = (type: unknown) => {
  if (!type || typeof type === "string") return "";

  return (
    (type as { displayName?: string }).displayName ||
    (type as { name?: string }).name ||
    ""
  );
};

const hasDialogA11yPart = (children: React.ReactNode, names: string[]) => {
  let found = false;

  React.Children.forEach(children, (child) => {
    if (found || !React.isValidElement(child)) return;

    const displayName = getComponentDisplayName(child.type);
    if (names.includes(displayName)) {
      found = true;
      return;
    }

    const childProps = child.props as { children?: React.ReactNode };
    if (childProps.children) {
      found = hasDialogA11yPart(childProps.children, names);
    }
  });

  return found;
};

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    hasCloseButton?: boolean;
    fallbackTitle?: string;
    fallbackDescription?: string;
  }
>(
  (
    {
      className,
      children,
      hasCloseButton = false,
      fallbackTitle = "Dialog",
      fallbackDescription = "Additional dialog content",
      ...props
    },
    ref,
  ) => {
    const hasTitle = hasDialogA11yPart(children, [
      DialogPrimitive.Title.displayName || "DialogTitle",
      "DialogTitle",
    ]);
    const hasDescription = hasDialogA11yPart(children, [
      DialogPrimitive.Description.displayName || "DialogDescription",
      "DialogDescription",
    ]);
    const hasAriaDescribedBy = props["aria-describedby"] !== undefined;

    return (
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          ref={ref}
          className={cn(
            "fixed left-[50%] top-[50%] z-50 grid w-[calc(100%-2rem)]",
            "max-w-lg translate-x-[-50%] translate-y-[-50%] sm:w-full",
            "gap-4 rounded-3xl border bg-background p-6 shadow-xl",
            "duration-200",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[state=closed]:slide-out-to-left-1/2",
            "data-[state=closed]:slide-out-to-top-[48%]",
            "data-[state=open]:slide-in-from-left-1/2",
            "data-[state=open]:slide-in-from-top-[48%]",
            className,
          )}
          {...props}
        >
          {!hasTitle && (
            <DialogPrimitive.Title className="sr-only">
              {fallbackTitle}
            </DialogPrimitive.Title>
          )}
          {!hasDescription && !hasAriaDescribedBy && (
            <DialogPrimitive.Description className="sr-only">
              {fallbackDescription}
            </DialogPrimitive.Description>
          )}
          {children}
          {hasCloseButton && (
            <DialogPrimitive.Close
              className={cn(
                "absolute right-4 top-4 rounded-sm opacity-70",
                "ring-offset-background transition-opacity hover:opacity-100",
                "focus:outline-none focus:ring-2 focus:ring-ring",
                "focus:ring-offset-2 disabled:pointer-events-none",
                "data-[state=open]:bg-accent",
                "data-[state=open]:text-muted-foreground",
              )}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          )}
        </DialogPrimitive.Content>
      </DialogPortal>
    );
  },
);
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className,
    )}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className,
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className,
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
