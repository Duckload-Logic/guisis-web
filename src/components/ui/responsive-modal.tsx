import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

const MOBILE_MODAL_BREAKPOINT = 768;

function useIsMobileModal() {
  const [isMobile, setIsMobile] = React.useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < MOBILE_MODAL_BREAKPOINT;
  });

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const mql = window.matchMedia(
      `(max-width: ${MOBILE_MODAL_BREAKPOINT - 1}px)`,
    );
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_MODAL_BREAKPOINT);
    };

    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_MODAL_BREAKPOINT);

    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}

interface BaseProps {
  children: React.ReactNode;
}

export function ResponsiveModal({
  children,
  open,
  onOpenChange,
}: BaseProps & {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const isMobile = useIsMobileModal();

  if (isMobile) {
    return (
      <Drawer
        open={open}
        onOpenChange={onOpenChange}
      >
        {children}
      </Drawer>
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      {children}
    </Dialog>
  );
}

export function ResponsiveModalTrigger({
  children,
  asChild,
}: BaseProps & { asChild?: boolean }) {
  const isMobile = useIsMobileModal();

  if (isMobile) {
    return <DrawerTrigger asChild={asChild}>{children}</DrawerTrigger>;
  }

  return <DialogTrigger asChild={asChild}>{children}</DialogTrigger>;
}

export function ResponsiveModalContent({
  children,
  className,
  hasCloseButton = true,
}: BaseProps & { className?: string; hasCloseButton?: boolean }) {
  const isMobile = useIsMobileModal();

  if (isMobile) {
    return (
      <DrawerContent className={cn("px-4 pb-8 pt-4", className)}>
        {children}
      </DrawerContent>
    );
  }

  return (
    <DialogContent
      hasCloseButton={hasCloseButton}
      className={cn("sm:max-w-md", className)}
    >
      {children}
    </DialogContent>
  );
}

export function ResponsiveModalHeader({
  children,
  className,
}: BaseProps & { className?: string }) {
  const isMobile = useIsMobileModal();

  if (isMobile) {
    return <DrawerHeader className={className}>{children}</DrawerHeader>;
  }

  return <DialogHeader className={className}>{children}</DialogHeader>;
}

export function ResponsiveModalTitle({
  children,
  className,
}: BaseProps & { className?: string }) {
  const isMobile = useIsMobileModal();

  if (isMobile) {
    return <DrawerTitle className={className}>{children}</DrawerTitle>;
  }

  return <DialogTitle className={className}>{children}</DialogTitle>;
}

export function ResponsiveModalDescription({
  children,
  className,
}: BaseProps & { className?: string }) {
  const isMobile = useIsMobileModal();

  if (isMobile) {
    return (
      <DrawerDescription className={className}>{children}</DrawerDescription>
    );
  }

  return (
    <DialogDescription className={className}>{children}</DialogDescription>
  );
}

export function ResponsiveModalFooter({
  children,
  className,
}: BaseProps & { className?: string }) {
  const isMobile = useIsMobileModal();

  if (isMobile) {
    return <DrawerFooter className={className}>{children}</DrawerFooter>;
  }

  return <DialogFooter className={className}>{children}</DialogFooter>;
}
