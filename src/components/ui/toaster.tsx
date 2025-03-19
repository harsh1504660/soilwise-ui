
import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster 
      position="top-right"
      richColors
      expand={true}
      closeButton
      visibleToasts={3}
      toastOptions={{
        duration: 4000,
        className: "rounded-md border bg-background p-4 shadow-md",
      }}
    />
  );
}
