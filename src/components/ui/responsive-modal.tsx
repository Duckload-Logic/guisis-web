import * as React from "react";
import { useIsMobile } from "@/hooks/useIsMobile";
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
  const isMobile = useIsMobile();

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
  const isMobile = useIsMobile();

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
  const isMobile = useIsMobile();

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
  const isMobile = useIsMobile();

  if (isMobile) {
    return <DrawerHeader className={className}>{children}</DrawerHeader>;
  }

  return <DialogHeader className={className}>{children}</DialogHeader>;
}

export function ResponsiveModalTitle({
  children,
  className,
}: BaseProps & { className?: string }) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <DrawerTitle className={className}>{children}</DrawerTitle>;
  }

  return <DialogTitle className={className}>{children}</DialogTitle>;
}

export function ResponsiveModalDescription({
  children,
  className,
}: BaseProps & { className?: string }) {
  const isMobile = useIsMobile();

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
  const isMobile = useIsMobile();

  if (isMobile) {
    return <DrawerFooter className={className}>{children}</DrawerFooter>;
  }

  return <DialogFooter className={className}>{children}</DialogFooter>;
}
