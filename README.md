# Studio Floral — Sistema de gestión

Aplicación web para gestionar productos, proveedores, asociaciones producto-proveedor y costos de compra. Incluye páginas preparadas y funciones básicas para inventario, ventas, tickets, dashboard y reportes.

## Requisitos
- Node.js 18 o superior
- Navegador moderno
- No requiere base de datos: guarda la información en `backend/data.json`.

## Instalación y ejecución
1. Descomprime el proyecto.
2. Abre una terminal dentro de `Sistema_Floreria`.
3. Ejecuta:
   ```bash
   npm install
   npm start
   ```
4. Abre `http://localhost:3000`.

En desarrollo, puedes ejecutar `npm run dev` si tu versión de Node.js admite `--watch`.

## Alcance y relación con el informe técnico
La implementación principal del Avance 2 / Sprint 1 corresponde a:
- HU-01: registrar productos.
- HU-02: modificar productos.
- HU-03: consultar productos activos.
- HU-04: registrar proveedores.
- HU-05: asociar productos con proveedores.
- HU-06: registrar costo de compra y mantener su historial.

Las páginas de inventario, ventas, ticket, dashboard y reportes están incluidas en el proyecto para respetar la estructura solicitada y facilitar los siguientes sprints. Sus funciones básicas no deben presentarse como aceptación formal de historias futuras sin validarlas con el profesor/Product Owner.

## Persistencia temporal
Los datos se guardan en `backend/data.json`, sin SQL Server ni otra base de datos. Esto permite conservar datos al reiniciar el servidor, pero es una solución temporal para desarrollo académico; no ofrece las garantías de concurrencia, seguridad y recuperación de una base de datos real. Haz copias de seguridad de ese archivo.

## Estructura
- `backend/servidor.js`: API REST y servicio web.
- `backend/data.json`: almacenamiento local persistente, se crea automáticamente.
- `css/estilos.css`: estilos responsive.
- `js/`: lógica del frontend por módulo.
- `paginas/`: pantallas del sistema.
- `imagenes/`: recursos visuales locales.

## Nota para la entrega
Antes de entregar, prueba el flujo de registro, edición, búsqueda, proveedores, asociación y costos en el equipo del proyecto. No marques historias como aceptadas hasta que el equipo y el Product Owner hayan comprobado los criterios del informe.
