# Barra POS

Sistema de ventas y gestión comercial para red local: punto de venta con lector
de código de barras, stock e inventario, cajas por terminal con arqueo,
proveedores y compras, clientes, tickets imprimibles (térmica 58/80 mm) y
reportes con exportación a CSV.

## Cómo funciona

Una computadora del local actúa como **servidor** (la que tiene este proyecto).
Las demás cajas se conectan **desde el navegador** usando la dirección que el
sistema muestra al arrancar (por ejemplo `http://192.168.1.50:3000`). No hace
falta instalar nada en las otras computadoras.

Los datos viven en un único archivo SQLite: `data/barra.db`. Respaldar el
sistema = copiar ese archivo (o usar el botón de respaldo en
Administración → Configuración).

## Puesta en marcha

Requisito: [Node.js](https://nodejs.org) 20 o superior.

```bash
npm install
npm run serve
```

`npm run serve` compila la primera vez, crea el usuario inicial y deja el
servidor accesible en toda la red. En macOS también podés hacer doble clic en
`scripts/iniciar.command`.

- Usuario inicial: **admin** / contraseña: **admin** — cambiala en
  Administración → Usuarios.
- Para desarrollo: `npm run dev`.

## Primeros pasos dentro del sistema

1. Entrá como `admin` y cambiá la contraseña.
2. **Administración → Terminales**: creá las cajas ("Caja 1", "Caja 2"…).
3. **Administración → Usuarios**: creá los cajeros (rol *cajero*: solo ven
   Vender y Caja).
4. **Productos**: cargá categorías y productos (código de barras, costo,
   precio, stock mínimo para alertas).
5. En cada computadora que vaya a vender: abrir la dirección del servidor,
   iniciar sesión e ir a **Caja** — la primera vez pide elegir qué terminal es
   ese dispositivo (queda vinculado).
6. **Caja → Abrir caja** con el efectivo inicial, y a vender.

## Uso diario

- **Vender**: escaneá el código de barras o escribí el nombre y Enter.
  Atajos: `F9` cobrar, `Esc` cancelar. Pagos: efectivo (con vuelto), tarjeta,
  transferencia o mixto. Al confirmar se abre el ticket listo para imprimir.
- **Caja**: ingresos/egresos de efectivo con motivo; cierre con arqueo
  (el sistema calcula el efectivo esperado y registra la diferencia).
- **Compras**: registrás la compra al proveedor y el stock sube solo; el costo
  del producto se actualiza al de la compra.
- **Inventario**: ajustes manuales con motivo y auditoría completa de
  movimientos; alertas de stock mínimo.
- **Reportes** (solo admin): ventas por período, medio de pago, terminal,
  categoría y producto; ganancia; valorización de stock; anulación de ventas;
  exportación CSV para Excel.

## Impresora de tickets

El ticket se imprime desde el navegador (`window.print`). En cada caja:

1. Configurá la impresora térmica como predeterminada del sistema.
2. En el diálogo de impresión, poné márgenes en "Ninguno" y desactivá
   encabezados y pies de página.
3. El ancho del papel (58 u 80 mm) se elige en Administración → Configuración.

## Red y seguridad

- El servidor escucha en el puerto 3000. La primera vez, macOS va a pedir
  permiso de red para Node: aceptalo.
- Conviene fijarle IP a la computadora servidor desde el router (reserva DHCP)
  para que la dirección no cambie. En macOS también funciona
  `http://nombre-de-la-mac.local:3000`.
- Pensado para LAN cerrada: **no expongas el puerto a Internet**.

## Facturación

Los comprobantes son tickets internos no fiscales. La estructura de datos está
preparada para integrar factura electrónica ARCA/AFIP más adelante (los campos
fiscales se agregan con una migración sin tocar lo existente).

## Stack técnico

Next.js 16 (App Router, TypeScript) · SQLite (better-sqlite3, WAL) · Drizzle
ORM · iron-session · Tailwind CSS 4. La base soporta varias terminales
vendiendo a la vez: la numeración de tickets y los descuentos de stock corren
dentro de transacciones serializadas.
