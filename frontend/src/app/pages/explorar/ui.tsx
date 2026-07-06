import React, { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import DOMPurify from "dompurify";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement | null;
      document.body.style.overflow = "hidden";
      window.setTimeout(() => {
        const focusableElements = dialogRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]'
        );
        (focusableElements?.[0] || dialogRef.current)?.focus();
      }, 0);
    } else {
      document.body.style.overflow = "unset";
      previousFocusRef.current?.focus?.();
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  if (!open) return null;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      onOpenChange(false);
      return;
    }

    if (event.key !== "Tab") return;

    const focusableElements = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]'
      ) || []
    ).filter((element) => element.offsetParent !== null || element === document.activeElement);

    if (focusableElements.length === 0) {
      event.preventDefault();
      dialogRef.current?.focus();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
        onClick={() => onOpenChange(false)}
      />
      {children}
    </div>
  );
}

interface DialogContentProps {
  className?: string;
  children: React.ReactNode;
}

export function DialogContent({ className = "", children }: DialogContentProps) {
  return (
    <div
      className={`bg-white rounded-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto shadow-2xl relative z-10 flex flex-col p-6 text-slate-800 ${className}`}
    >
      {children}
    </div>
  );
}

export function DialogHeader({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`flex flex-col space-y-1.5 text-left pb-4 border-b border-slate-100 ${className}`}>{children}</div>;
}

export function DialogTitle({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <h3 className={`text-lg font-semibold leading-none tracking-tight text-slate-900 ${className}`}>{children}</h3>;
}

export function DialogDescription({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <p className={`text-sm text-slate-505 ${className}`}>{children}</p>;
}

export function DialogFooter({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4 border-t border-slate-100 ${className}`}>{children}</div>;
}

export function Label({ htmlFor, className = "", children }: { htmlFor?: string; className?: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className={`text-sm font-medium leading-none text-slate-700 select-none ${className}`}>
      {children}
    </label>
  );
}

type InputProps = React.ComponentPropsWithoutRef<"input">;

export function Input({ className = "", ...props }: InputProps) {
  return (
    <input
      className={`flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#800020] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}

type TextareaProps = React.ComponentPropsWithoutRef<"textarea">;

export function Textarea({ className = "", ...props }: TextareaProps) {
  return (
    <textarea
      className={`flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#800020] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}

interface SelectProps {
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}

const SelectContext = React.createContext<{
  value: string;
  onValueChange: (value: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
} | null>(null);

export function Select({ onValueChange, children }: SelectProps) {
  const [value, setValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (val: string) => {
    setValue(val);
    onValueChange(val);
    setIsOpen(false);
  };

  return (
    <SelectContext.Provider value={{ value, onValueChange: handleSelect, isOpen, setIsOpen }}>
      <div className="relative w-full z-20">{children}</div>
    </SelectContext.Provider>
  );
}

export function SelectTrigger({ className = "", children, ...props }: { className?: string; children: React.ReactNode } & React.ComponentPropsWithoutRef<"button">) {
  const context = React.useContext(SelectContext);
  if (!context) return null;
  return (
    <button
      type="button"
      onClick={() => context.setIsOpen(!context.isOpen)}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          context.setIsOpen(false);
        }
        if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          context.setIsOpen(true);
          window.setTimeout(() => {
            const firstOption = event.currentTarget.parentElement?.querySelector<HTMLElement>('[role="option"]');
            firstOption?.focus();
          }, 0);
        }
      }}
      aria-haspopup="listbox"
      aria-expanded={context.isOpen}
      className={`flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#800020] focus:ring-offset-2 text-left ${className}`}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  );
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const context = React.useContext(SelectContext);
  if (!context) return null;
  return <span className="text-sm text-slate-700">{context.value ? context.value : placeholder}</span>;
}

export function SelectContent({ children }: { children: React.ReactNode }) {
  const context = React.useContext(SelectContext);
  if (!context || !context.isOpen) return null;
  return (
    <div role="listbox" className="absolute left-0 right-0 z-30 mt-1 max-h-60 overflow-auto rounded-md border border-slate-200 bg-white p-1 shadow-md animate-in fade-in-80 slide-in-from-top-1 duration-100">
      {children}
    </div>
  );
}

export function SelectItem({ value, children }: { value: string; children: React.ReactNode; key?: string }) {
  const context = React.useContext(SelectContext);
  if (!context) return null;
  return (
    <button
      type="button"
      onClick={() => context.onValueChange(value)}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          context.setIsOpen(false);
        }
      }}
      role="option"
      aria-selected={context.value === value}
      className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-slate-50 focus:bg-slate-50 text-slate-700 text-left"
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {context.value === value && <Check className="h-4 w-4" />}
      </span>
      {children}
    </button>
  );
}

type ButtonProps = React.ComponentPropsWithoutRef<"button"> & {
  variant?: "default" | "outline" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
};

export function Button({ className = "", variant = "default", size = "default", children, ...props }: ButtonProps) {
  const baseStyle = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#800020] disabled:pointer-events-none disabled:opacity-50 cursor-pointer";

  const variants = {
    default: "bg-[#800020] text-white hover:bg-[#5C0016] shadow-sm",
    outline: "border border-slate-250 bg-white hover:bg-slate-50 text-slate-700",
    ghost: "hover:bg-slate-50 text-slate-700",
    link: "text-[#800020] underline-offset-4 hover:underline",
  };

  const sizes = {
    default: "h-10 px-4 py-2 text-sm",
    sm: "h-9 rounded-md px-3 py-1.5 text-xs",
    lg: "h-11 rounded-md px-8",
    icon: "h-10 w-10",
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Badge({ className = "", children }: { className?: string; children: React.ReactNode; key?: string | number }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 border-slate-200 bg-slate-100 text-slate-900 ${className}`}>
      {children}
    </span>
  );
}

export function SanitizedHtml({ html, className = "" }: { html?: string; className?: string }) {
  const sanitizedHtml = React.useMemo(
    () =>
      DOMPurify.sanitize(html || "", {
        USE_PROFILES: { html: true },
      }),
    [html]
  );

  return <div className={className} dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />;
}
