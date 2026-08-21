# Barra Amarena — Administración y reportes

Aplicación web en red local para la administración del negocio:

- **Contabilidad Barra**: libro de ingresos/egresos con saldo corrido
  (fecha, categoría, nombre de movimiento, egreso, ingreso, saldo).
- **Estadísticas**: evolución de ingresos, egresos y saldo (mes a mes o día por día), y gastos por categoría.
- **Administración**: usuarios del sistema (crear, editar, eliminar).
  Al crear un usuario se muestra la contraseña configurada.

Todos los usuarios son administradores. Los datos viven en un único
archivo SQLite (`data/barra.db`): respaldar = copiar ese archivo.

## Puesta en marcha

Requisito: Node.js 20 o superior.

```bash
npm install
npm run serve
```

Usuario inicial: **superadmin** / **superadmin** (cambiá la contraseña
desde Administración). El sistema queda en `http://localhost:3000` y en
la IP de red que muestra al arrancar.

## Historial

La versión completa con punto de venta (cajas, POS, productos, stock,
entregas por QR) quedó guardada en el tag de git
`version-completa-con-ventas`.
