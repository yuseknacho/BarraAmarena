/* Logo de Amarena (mismo asset que TicketAmarena: public/logo.png). */
export function Logo({
  className = "",
  heightClass = "h-8",
}: {
  className?: string;
  heightClass?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt="Barra Amarena"
      className={`${heightClass} w-auto object-contain ${className}`}
    />
  );
}
