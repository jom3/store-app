# idea.md — Sistema de ventas para supermercado (MVP)

## 1. Resumen

Sistema de ventas para un supermercado (un solo local). El vendedor registra ventas en efectivo, el stock se descuenta automáticamente y se imprime un comprobante (sin factura). El dueño y el admin revisan reportes de ventas. El acceso es por usuario y contraseña, con 4 roles fijos.

## 2. Usuario final y problema

- **Usuarios finales:** personal del supermercado (admin, dueño, encargado de almacén, vendedor).
- **Problema:** el negocio necesita registrar lo que venden sus vendedores y poder verificar esas ventas mediante reportes. Al vender, el inventario debe actualizarse solo.
- **Flujo típico de venta:** el cliente llega y revisa los productos. El vendedor lo atiende, busca los productos en el sistema, cobra en efectivo y entrega el comprobante.

## 3. Glosario

| Término | Significado |
|---|---|
| Cliente | Persona que compra. No se registra en el sistema. |
| Vendedor | Usuario que atiende al cliente, registra la venta y cobra. |
| Dueño | Usuario propietario del negocio; revisa reportes. |
| Encargado de almacén | Usuario que gestiona productos, precios y entrada de stock. |
| Admin | Usuario con todos los permisos. |
| Producto | Artículo que se vende por unidad. |
| Stock | Cantidad de unidades disponibles de un producto. |
| Entrada de stock | Registro de mercadería nueva que llega al almacén. |
| Venta | Operación de cobro que contiene uno o más productos. |
| Comprobante | Documento impreso de la venta. No es factura. |
| Venta cancelada | Venta anulada por error; no se borra, queda marcada como cancelada. |
| Mismo día | Día calendario. |

## 4. Funcionalidades del MVP

### F-01 Acceso (autenticación)
- **Descripción:** cada usuario inicia sesión con su usuario y contraseña.
- **Prioridad:** esencial
- **Flujo:**
  1. El usuario ingresa usuario y contraseña.
  2. Si son correctos y el usuario está activo, accede al sistema con las opciones de su rol.
  3. El admin por defecto, en su primer inicio de sesión, debe cambiar su contraseña antes de continuar.
- **Reglas de negocio:**
  - El primer admin se crea al instalar el sistema, como usuario por defecto cargado en la base de datos.
  - Un usuario deshabilitado no puede iniciar sesión.
- **Casos de error y límite:**
  - Credenciales incorrectas: mensaje de error, sin indicar cuál dato falló.
  - Usuario deshabilitado: se rechaza el acceso con mensaje.
- **Criterios de aceptación:**
  - Un usuario activo con credenciales correctas entra.
  - Un usuario deshabilitado no entra.
  - El admin por defecto no puede usar el sistema sin cambiar su contraseña en el primer ingreso.

### F-02 Gestión de usuarios
- **Descripción:** crear usuarios y deshabilitarlos.
- **Prioridad:** esencial
- **Flujo:**
  1. El admin crea un usuario con nombre de usuario, contraseña y rol (admin, dueño, encargado de almacén o vendedor).
  2. El admin o el dueño deshabilitan a un usuario.
- **Reglas de negocio:**
  - Solo el admin crea usuarios. El dueño solo puede deshabilitar.
  - Los usuarios no se borran. Las ventas de un usuario deshabilitado se conservan y siguen apareciendo en los reportes.
  - Los roles son fijos (no hay roles ni permisos personalizables).
- **Casos de error y límite:**
  - Nombre de usuario repetido: se rechaza con mensaje.
  - Un rol sin permiso no ve ni ejecuta estas acciones.
- **Criterios de aceptación:**
  - El admin puede crear un usuario de cada rol.
  - El dueño puede deshabilitar pero no crear.
  - Tras deshabilitar a un vendedor, sus ventas pasadas siguen en los reportes.

### F-03 Gestión de productos
- **Descripción:** crear y editar productos.
- **Prioridad:** esencial
- **Flujo:**
  1. Un usuario autorizado crea un producto con nombre, código, precio y stock.
  2. Puede editar los datos del producto y cambiar su estado (activo o inactivo).
- **Reglas de negocio:**
  - Pueden crear y editar productos y precios: encargado de almacén, dueño y admin.
  - Los productos no se borran; se marcan como inactivos para conservar el historial.
  - Un cambio de precio no afecta ventas pasadas (cada detalle de venta conserva el precio con el que se vendió).
  - No hay categorías en el MVP.
- **Casos de error y límite:**
  - Código de producto repetido: se rechaza con mensaje.
  - Un vendedor no puede crear ni editar productos ni precios.
- **Criterios de aceptación:**
  - Se puede crear, editar y desactivar un producto sin borrarlo.
  - Al cambiar el precio, una venta anterior mantiene su precio original.
  - Un vendedor no accede a la gestión de productos.

### F-04 Entrada de stock
- **Descripción:** registrar la llegada de mercadería nueva.
- **Prioridad:** esencial
- **Flujo:**
  1. Un usuario autorizado elige el producto e ingresa la cantidad recibida.
  2. El sistema suma esa cantidad al stock y registra fecha, cantidad y quién la ingresó.
  3. Si hubo un error, el usuario autorizado corrige la entrada indicando un motivo escrito.
- **Reglas de negocio:**
  - Pueden registrar entradas: encargado de almacén, dueño y admin.
  - Toda corrección exige motivo escrito y queda registrado quién la hizo y cuándo.
- **Casos de error y límite:**
  - Cantidad vacía, cero o negativa: se rechaza.
  - Corrección sin motivo: se rechaza.
- **Criterios de aceptación:**
  - Tras registrar una entrada, el stock del producto sube en esa cantidad.
  - Cada entrada y cada corrección queda registrada con fecha, cantidad y usuario.

### F-05 Registrar venta
- **Descripción:** el vendedor registra una venta de uno o más productos, cobrada en efectivo.
- **Prioridad:** esencial
- **Flujo:**
  1. El vendedor busca un producto por nombre o por código.
  2. Agrega el producto con su cantidad (en unidades) a la venta.
  3. Repite con los demás productos.
  4. Confirma la venta (cobro en efectivo).
  5. El sistema descuenta el stock, asigna un número correlativo y genera el comprobante (F-06).
- **Reglas de negocio:**
  - Solo se vende por unidad.
  - Solo hay un método de pago: efectivo. No se calcula vuelto.
  - Un producto sin stock aparece deshabilitado o con el mensaje "sin stock".
  - La venta guarda, por cada producto, la cantidad y el precio del momento.
- **Casos de error y límite:**
  - Venta sin productos: se rechaza.
  - Cantidad mayor al stock: se rechaza con mensaje.
  - Dos vendedores intentan vender la última unidad a la vez: el segundo recibe "sin stock" y su venta no se registra.
- **Criterios de aceptación:**
  - Al confirmar una venta, el stock de cada producto baja en la cantidad vendida.
  - No se puede registrar una venta vacía ni con cantidad superior al stock.
  - Con una sola unidad en stock y dos intentos de venta simultáneos, solo una se registra.

### F-06 Comprobante
- **Descripción:** documento impreso de la venta, sin validez de factura.
- **Prioridad:** esencial
- **Flujo:**
  1. Al confirmar la venta, el sistema muestra e imprime el comprobante.
  2. Posteriormente se puede reimprimir, marcado como "copia".
- **Reglas de negocio:**
  - Contenido: nombre del negocio, número correlativo de venta, fecha y hora, vendedor, lista de productos (cantidad, precio unitario y subtotal) y total. No incluye vuelto.
  - El nombre del negocio es un dato único del sistema.
  - Pueden reimprimir: el vendedor de esa venta, el dueño y el admin.
- **Casos de error y límite:**
  - Si la impresión falla, la venta igual queda registrada y se puede reimprimir.
- **Criterios de aceptación:**
  - El comprobante contiene todos los datos indicados.
  - Una reimpresión aparece marcada como "copia".
  - Un fallo de impresión no elimina ni bloquea la venta.

### F-07 Cancelar venta
- **Descripción:** anular una venta registrada por error. En el MVP no se corrigen ventas, solo se cancelan.
- **Prioridad:** esencial
- **Flujo:**
  1. El usuario autorizado elige la venta a cancelar.
  2. Escribe el motivo de la cancelación.
  3. El sistema marca la venta como cancelada, devuelve el stock a cada producto y registra quién y cuándo.
- **Reglas de negocio:**
  - El vendedor cancela solo sus propias ventas y solo el mismo día.
  - El dueño y el admin cancelan cualquier venta, en cualquier momento.
  - El motivo escrito es obligatorio.
  - La venta no se borra. Las ventas canceladas no cuentan en los reportes de ventas, pero el dueño y el admin pueden verlas.
- **Casos de error y límite:**
  - Cancelar sin motivo: se rechaza.
  - Vendedor intenta cancelar una venta ajena o de otro día: se rechaza.
  - Cancelar una venta ya cancelada: se rechaza.
- **Criterios de aceptación:**
  - Tras cancelar, el stock de los productos vuelve a su valor previo.
  - La venta cancelada no suma en ningún reporte.
  - Quedan registrados motivo, usuario y fecha de la cancelación.

### F-08 Reportes e historial
- **Descripción:** consulta de ventas para control del dueño.
- **Prioridad:** esencial
- **Flujo:**
  1. El dueño o el admin eligen el tipo de reporte: por vendedor, por día, por semana o por mes.
  2. El sistema muestra las ventas del período con detalle de productos y cantidades, y el total.
  3. El vendedor puede ver el historial de sus propias ventas.
- **Reglas de negocio:**
  - Ven reportes: dueño y admin. El encargado de almacén no ve reportes de ventas.
  - Cada vendedor ve solo su propio historial, no el de otros.
  - Las ventas canceladas no cuentan en los totales.
  - Un reporte sin ventas muestra cero, no un error.
- **Casos de error y límite:**
  - Período sin ventas: se muestra cero.
  - Usuario sin permiso: no accede a reportes.
- **Criterios de aceptación:**
  - El total del reporte del día coincide con la suma de los comprobantes de ese día (sin canceladas).
  - Un vendedor no puede ver ventas de otro vendedor.
  - El encargado de almacén no puede acceder a reportes.

### Permisos por rol

| Rol | Puede |
|---|---|
| Admin | Todo |
| Dueño | Reportes, cancelar cualquier venta, deshabilitar usuarios, productos, precios y entrada de stock |
| Encargado de almacén | Productos, precios, entrada de stock |
| Vendedor | Registrar ventas, cancelar las suyas del mismo día, ver su propio historial |

## 5. Entidades y datos principales (conceptual)

- **Usuario:** nombre de usuario, contraseña, rol, estado (activo o deshabilitado).
- **Producto:** nombre, código, precio, stock, estado (activo o inactivo).
- **Entrada de stock:** producto, cantidad, fecha, usuario que la ingresó; si fue corregida: motivo, usuario y fecha de la corrección.
- **Venta:** número correlativo, fecha y hora, vendedor, estado (activa o cancelada); si fue cancelada: motivo, usuario y fecha de la cancelación.
- **Detalle de venta:** producto, cantidad, precio al momento de la venta.

**Relaciones:**
- Un usuario (vendedor) tiene muchas ventas.
- Una venta tiene muchos detalles.
- Cada detalle apunta a un producto.
- Un producto tiene muchas entradas de stock.
- Cada entrada de stock se asocia al usuario que la registró.

## 6. Fuera de alcance (explícito)

- Roles y permisos personalizables.
- Venta por peso o cantidades decimales.
- Factura.
- Cálculo de vuelto.
- Otros métodos de pago además de efectivo.
- Categorías de productos.
- Corregir ventas (solo se cancelan).
- Reportes de productos más vendidos y de stock bajo.
- Varios locales.
- Registro de clientes.

## 7. Integraciones externas

Ninguna, salvo la impresión del comprobante.

## 8. Tecnologías

- **Frontend:** Angular.
- **Backend:** Node.js con Express, en JavaScript.
- **Base de datos:** PostgreSQL.
- **Diseño de interfaz:** se usará la skill `frontend-design` para generar una interfaz cuidada.
- **Hosting:** por definir.
- **Herramientas de testing:** por definir.
- **Método de impresión del comprobante:** por definir.

## 9. Estructura sugerida del proyecto

```
/
├── backend/            # API (Node.js + Express)
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/   # reglas de negocio
│   │   ├── middleware/ # autenticación y permisos por rol
│   │   └── db/         # acceso a datos y migraciones
│   └── tests/
├── frontend/           # Aplicación Angular
│   └── src/app/        # módulos por funcionalidad (acceso, usuarios, productos, stock, ventas, reportes)
├── database/           # scripts de creación y datos iniciales (admin por defecto)
└── README.md
```

## 10. Requisitos de calidad para el desarrollo

- **Testing:**
  - Herramientas: por definir.
  - Qué probar como mínimo: los 4 criterios de éxito del MVP, los permisos de cada rol, la venta simultánea de la última unidad, la cancelación (stock devuelto y exclusión de reportes) y los casos de error y límite de cada funcionalidad.
- **Manejo de errores:** mensajes claros para el usuario en cada caso de error descrito; sin mostrar detalles internos. Una venta y su descuento de stock deben registrarse de forma consistente (o se registran ambos o ninguno).
- **Documentación básica (README):** qué es el proyecto, cómo instalarlo y ejecutarlo, cómo se crea el admin por defecto, y cómo correr las pruebas.
- **Control de versiones:** commits pequeños con mensajes claros.
- **Seguridad básica:** las contraseñas no se guardan en texto plano, y los permisos por rol se validan también en el servidor, no solo en la interfaz.

## 11. Supuestos

- "Mismo día" significa el día calendario.
- No hay integraciones externas aparte de la impresión del comprobante.
- El nombre del negocio es un dato único del sistema (un solo local).
- El vuelto no se calcula ni se imprime.
- Al deshabilitar a un usuario, sus ventas pasadas se conservan en los reportes.

## 12. Preguntas abiertas

- ¿La semana de los reportes empieza el lunes? (por definir)
- ¿Quién puede volver a habilitar a un usuario deshabilitado? (no definido)
- ¿Cómo se cambia o recupera una contraseña, además del cambio obligatorio del admin inicial? (no definido)
- Hosting, herramientas de testing y método de impresión: por definir.
- Moneda y formato del número correlativo de venta: no definidos.

## 13. Instrucciones para agentes de desarrollo

- Trabajar por pasos pequeños, una funcionalidad (F-xx) a la vez.
- No añadir funcionalidades fuera del alcance de este documento.
- Ante cualquier duda o ambigüedad, pedir confirmación antes de continuar.
- Para la interfaz, usar la skill `frontend-design`.
- Respetar los permisos por rol y los términos del glosario.