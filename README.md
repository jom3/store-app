# Sistema de ventas

Sistema de ventas para un supermercado de un solo local: ventas en efectivo, descuento automático de stock, comprobante imprimible y reportes. Alcance funcional en `idea.md`; plan técnico en `specs/`.

## Requisitos

- Node.js 20 o superior (probado con 24).
- PostgreSQL 16 o superior en una instancia existente (probado con PostgreSQL 18).

## Base de datos

El proyecto usa tu instancia de PostgreSQL; no levanta un contenedor propio. Crear las dos bases una sola vez:

```powershell
psql -U postgres -h localhost -c "CREATE DATABASE sistema_ventas;"
psql -U postgres -h localhost -c "CREATE DATABASE sistema_ventas_test;"
```

`TEST_DATABASE_URL` debe apuntar a una base distinta de `DATABASE_URL`: la suite de pruebas recrea su esquema.

## Puesta en marcha

1. Crear el archivo de entorno:

   ```powershell
   Copy-Item .env.example .env
   ```

   Completar `DATABASE_URL` y `TEST_DATABASE_URL` con tu usuario y contraseña, y ajustar `DEFAULT_ADMIN_PASSWORD`, `JWT_SECRET`, `BUSINESS_NAME`, `CURRENCY_CODE`, `LOCALE` y `TZ`.

2. Instalar dependencias y preparar la base:

   ```powershell
   cd backend
   npm install
   npm run migrate
   npm run seed
   ```

3. Levantar la API:

   ```powershell
   npm run dev
   ```

   Queda en `http://localhost:3000`; `GET /api/health` devuelve `{ "status": "ok" }`.

4. Levantar el frontend (otra terminal):

   ```powershell
   cd frontend
   npm install
   npm start
   ```

   Queda en `http://localhost:4200` y proxifica `/api` hacia la API.

## Admin por defecto

`npm run seed` crea el usuario `admin` con la contraseña de `DEFAULT_ADMIN_PASSWORD` y `must_change_password = true`. En el primer ingreso el sistema obliga a cambiarla. Ejecutar el seed varias veces no duplica usuarios.

## Pruebas

Las pruebas del backend usan una base real (`TEST_DATABASE_URL`), recrean el esquema y aplican las migraciones:

```powershell
cd backend
npm test
```

Si `TEST_DATABASE_URL` no está definida o es igual a `DATABASE_URL`, la suite se niega a correr para no borrar datos de desarrollo.

Frontend:

```powershell
cd frontend
npm test
```

## Migraciones

Los archivos SQL numerados viven en `database/migrations/` y se aplican en orden con:

```powershell
cd backend
npm run migrate
```

Cada versión se registra en `schema_migrations`; los archivos ya aplicados se omiten.

## Estructura

```
backend/    API Express (JavaScript)
frontend/   Aplicación Angular
database/   Migraciones SQL
specs/      Plan técnico por módulo
idea.md     Alcance funcional del MVP
```
