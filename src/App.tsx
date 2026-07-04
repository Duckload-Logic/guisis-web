import { useRoutes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, UIProvider, ToastProvider } from "@/context";
import { routes } from "@/routes";

const QUERY_CLIENT_STALE_TIME = 1000 * 60 * 5; // 5 minutes
const QUERY_CLIENT_GC_TIME = 1000 * 60 * 60; // 1 hour

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: QUERY_CLIENT_STALE_TIME,
      gcTime: QUERY_CLIENT_GC_TIME,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 2,
    },
  },
});

function AppRoutes() {
  const element = useRoutes(routes);
  return element;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <UIProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </UIProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

