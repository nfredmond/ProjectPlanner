import * as React from "react";
import { cn } from "@/lib/utils";
import { useToast, Toast as ToastType } from "./use-toast";

interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive";
  toast?: ToastType;
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ className, variant = "default", toast, ...props }, ref) => {
    const { dismiss } = useToast();
    
    return (
      <div
        ref={ref}
        className={cn(
          "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all",
          variant === "default" && "border-gray-200 bg-white text-gray-950",
          variant === "destructive" && "destructive group border-red-500 bg-red-600 text-white",
          className
        )}
        {...props}
      >
        {toast && (
          <>
            <div className="grid gap-1">
              {toast.title && <ToastTitle>{toast.title}</ToastTitle>}
              {toast.description && (
                <ToastDescription>{toast.description}</ToastDescription>
              )}
            </div>
            <button
              onClick={() => toast.id && dismiss(toast.id)}
              className="absolute right-2 top-2 rounded-md p-1 text-gray-950/50 opacity-0 transition-opacity hover:text-gray-950 focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              <span className="sr-only">Close</span>
            </button>
          </>
        )}
        {props.children}
      </div>
    );
  }
);
Toast.displayName = "Toast";

interface ToastViewportProps extends React.HTMLAttributes<HTMLDivElement> {}

const ToastViewport = React.forwardRef<HTMLDivElement, ToastViewportProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
          className
        )}
        {...props}
      />
    );
  }
);
ToastViewport.displayName = "ToastViewport";

interface ToastTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

const ToastTitle = React.forwardRef<HTMLHeadingElement, ToastTitleProps>(
  ({ className, ...props }, ref) => (
    <h2
      ref={ref}
      className={cn("text-sm font-semibold", className)}
      {...props}
    />
  )
);
ToastTitle.displayName = "ToastTitle";

interface ToastDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const ToastDescription = React.forwardRef<HTMLParagraphElement, ToastDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm opacity-90", className)}
      {...props}
    />
  )
);
ToastDescription.displayName = "ToastDescription";

function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastViewport>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          toast={toast}
          variant={toast.variant}
          className={cn(
            toast.open ? "animate-in fade-in-0 slide-in-from-top-full" : "animate-out fade-out-0 slide-out-to-right-full"
          )}
        />
      ))}
    </ToastViewport>
  );
}

export { Toast, ToastTitle, ToastDescription, ToastViewport, Toaster }; 