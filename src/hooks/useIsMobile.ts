import { useUI } from "@/context";

export function useIsMobile() {
  const { isMobile } = useUI();
  return isMobile;
}
