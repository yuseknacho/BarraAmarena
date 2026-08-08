import { clsx } from "./clsx";

export function Button({
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
}) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
        variant === "primary" && "bg-brand text-black hover:bg-brand-dark",
        variant === "secondary" && "bg-white/10 text-white hover:bg-white/20",
        variant === "danger" && "bg-red-600 text-white hover:bg-red-700",
        variant === "ghost" && "text-white/60 hover:bg-white/10 hover:text-white",
        className
      )}
      {...props}
    />
  );
}

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  ref?: React.Ref<HTMLInputElement>;
}) {
  return (
    <input
      className={clsx(
        "w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand [color-scheme:dark]",
        className
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={clsx(
        "w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand [color-scheme:dark] [&>option]:bg-neutral-900",
        className
      )}
      {...props}
    />
  );
}

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={clsx("block text-xs text-white/50 mb-1", className)}
      {...props}
    />
  );
}

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "rounded-xl border border-white/10 bg-neutral-950 p-4",
        className
      )}
      {...props}
    />
  );
}

export function PageTitle({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="font-display text-2xl tracking-wide uppercase text-white mb-4">
      {children}
    </h1>
  );
}

export function Th({
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={clsx(
        "px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-white/50",
        className
      )}
      {...props}
    />
  );
}

export function Td({
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={clsx("px-3 py-2 text-sm text-white/90", className)} {...props} />
  );
}

export function PageHelp({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-6 text-sm text-white/40 border-t border-white/10 pt-3">
      💡 {children}
    </p>
  );
}

export function Badge({
  color = "gray",
  children,
}: {
  color?: "gray" | "green" | "red" | "yellow" | "blue";
  children: React.ReactNode;
}) {
  const colors = {
    gray: "bg-white/10 text-white/70",
    green: "bg-brand/15 text-brand-light",
    red: "bg-red-500/15 text-red-400",
    yellow: "bg-yellow-500/15 text-yellow-400",
    blue: "bg-sky-500/15 text-sky-400",
  };
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        colors[color]
      )}
    >
      {children}
    </span>
  );
}
