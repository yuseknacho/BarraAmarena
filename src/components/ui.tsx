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
        "inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
        variant === "primary" && "bg-blue-600 text-white hover:bg-blue-700",
        variant === "secondary" &&
          "bg-white text-gray-800 border border-gray-300 hover:bg-gray-50",
        variant === "danger" && "bg-red-600 text-white hover:bg-red-700",
        variant === "ghost" && "text-gray-600 hover:bg-gray-100",
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
        "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
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
        "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500",
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
      className={clsx("block text-sm font-medium text-gray-700 mb-1", className)}
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
        "rounded-lg border border-gray-200 bg-white p-4 shadow-sm",
        className
      )}
      {...props}
    />
  );
}

export function PageTitle({ children }: { children: React.ReactNode }) {
  return <h1 className="text-xl font-bold text-gray-900 mb-4">{children}</h1>;
}

export function Th({
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={clsx(
        "px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500",
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
    <td className={clsx("px-3 py-2 text-sm text-gray-800", className)} {...props} />
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
    gray: "bg-gray-100 text-gray-700",
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
    yellow: "bg-yellow-100 text-yellow-800",
    blue: "bg-blue-100 text-blue-700",
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
