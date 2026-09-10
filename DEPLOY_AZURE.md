# Despliegue de RestaurantApp en Azure

Patrón: un solo Azure App Service sirve la API y el SPA juntos (tal como corre hoy en
local — el frontend compilado vive en `RestaurantApp.API/wwwroot` y la misma API lo
sirve). CI/CD vía GitHub Actions con login OIDC (sin secretos de larga duración), igual
que KineCloud.

## 1. Crear el Resource Group

Portal → **Grupos de recursos** → Crear.

- Nombre sugerido: `restaurantapp-rg`
- Región: la más cercana a donde esté el restaurante (ej. `East US 2`, `South Central US`)

## 2. Crear el App Service (backend + frontend)

Portal → **Crear un recurso** → **Web App**.

- Resource Group: `restaurantapp-rg`
- Nombre: `restaurantapp-api` (queda como `https://restaurantapp-api.azurewebsites.net`;
  si ya está tomado, ajusta el nombre y también el `AZURE_WEBAPP_NAME` en el workflow)
- Publicar: **Código**
- Pila en tiempo de ejecución: **.NET 10 (LTS)** — si tu portal aún no lo lista, usa la
  versión LTS disponible más reciente y dímelo, hay que ajustar el `TargetFramework`.
- Sistema operativo: **Linux**
- Plan: crear uno nuevo, SKU **F1 (gratis)** para empezar (con las limitaciones de CPU
  que ya te mencioné; si SignalR no va fluido ahí, subimos a B1).
- **Aplicar y crear.**

Una vez creado, en el recurso del App Service:
- **Configuración → General → Web sockets: Activado** (necesario para SignalR / la
  pantalla de Cocina en tiempo real).
- **Configuración → General → Always On**: no disponible en F1 (normal, la app "duerme"
  tras inactividad y tarda unos segundos en despertar en la primera petición).

## 3. Crear la base de datos (Azure SQL)

Portal → **Crear un recurso** → **Azure SQL** → **Base de datos SQL**.

- Resource Group: `restaurantapp-rg`
- Base de datos: `restaurantapp-db`
- Servidor: crear uno nuevo, ej. `restaurantapp-sql`
- Nivel de proceso: intenta primero el **free-tier serverless** (si tu portal lo
  ofrece, aparece como opción "Free offer" al elegir "Serverless" — solo hay uno
  disponible por suscripción). Si no aparece, usa **Basic** (~$5 USD/mes).
- **Redes**: en la pestaña "Redes" del servidor, marca **"Permitir que los servicios y
  recursos de Azure accedan a este servidor"** — sin esto, tu App Service no puede
  conectarse.

### Autenticación: usuario y contraseña (usuario contenido en la base de datos)

Si al crear el servidor Azure te dejó configurado solo un **administrador de Microsoft
Entra** (Portal → el servidor SQL → **Microsoft Entra ID**) en vez de pedirte usuario y
contraseña SQL clásicos desde el inicio, no pasa nada — no hace falta un login a nivel
servidor. Azure SQL Database soporta **usuarios contenidos con contraseña**, creados
directo en la base de datos.

**a) Conéctate como admin de Entra**
Portal → la **base de datos** `restaurantapp-db` (no el servidor) → **Editor de
consultas (versión preliminar)** → inicia sesión con **Autenticación de Microsoft
Entra** (la cuenta que aparece como administrador del servidor).

**b) Crea el usuario con contraseña** (una sola vez; elige tú una contraseña fuerte):
```sql
CREATE USER restaurantapp_admin WITH PASSWORD = 'TuContraseñaFuerte123!';
ALTER ROLE db_datareader ADD MEMBER restaurantapp_admin;
ALTER ROLE db_datawriter ADD MEMBER restaurantapp_admin;
ALTER ROLE db_ddladmin  ADD MEMBER restaurantapp_admin;  -- EF Core crea las tablas al arrancar
```

**c) Connection string**, para `ConnectionStrings__Default` (paso 6):
```
Server=tcp:restaurantapp-sql.database.windows.net,1433;Database=restaurantapp-db;User ID=restaurantapp_admin;Password=TuContraseñaFuerte123!;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;
```

Guarda esa contraseña solo en la configuración del App Service — nunca en `appsettings.json` ni en el repo.

<details>
<summary>Alternativa: Managed Identity (sin contraseña en absoluto)</summary>

Más seguro (nada que rotar ni filtrar) pero requiere activar la identidad del App
Service primero: Portal → App Service `restaurantapp-api` → **Identidad** → **Asignada
por el sistema** → Activado. Luego, en el mismo Editor de consultas:

```sql
CREATE USER [restaurantapp-api] FROM EXTERNAL PROVIDER;
ALTER ROLE db_datareader ADD MEMBER [restaurantapp-api];
ALTER ROLE db_datawriter ADD MEMBER [restaurantapp-api];
ALTER ROLE db_ddladmin  ADD MEMBER [restaurantapp-api];
```

Connection string: `Server=tcp:restaurantapp-sql.database.windows.net,1433;Database=restaurantapp-db;Authentication=Active Directory Managed Identity;`
</details>

## 4. Crear la cuenta de Storage (para el logo de la app y el logo del ticket)

Portal → **Crear un recurso** → **Cuenta de almacenamiento**.

- Resource Group: `restaurantapp-rg`
- Nombre: `restaurantappstorage` (sin guiones, todo minúsculas)
- Redundancia: **LRS** (la más barata, suficiente para esto)
- **Importante**: en la pestaña "Avanzado", deja **habilitado "Permitir acceso público
  a blobs"** (Allow Blob public access) — si está deshabilitado, la app no podrá crear
  el contenedor con lectura pública y fallará al subir el logo.

Connection string: Portal → tu cuenta de storage → **Claves de acceso** → copia la
"Cadena de conexión" de la clave 1.

El contenedor `uploads` lo crea la app sola la primera vez que alguien sube un logo —
no hace falta crearlo a mano.

## 5. App Registration para OIDC (para que GitHub Actions pueda desplegar)

Portal → **Microsoft Entra ID** → **Registros de aplicaciones** → **Nuevo registro**.

- Nombre: `restaurantapp-github-deploy`
- Tipos de cuenta compatibles: predeterminado (solo este directorio)
- Crear.

Anota de la página de la app registrada:
- **Id. de aplicación (cliente)** → `AZURE_CLIENT_ID`
- **Id. de directorio (inquilino)** → `AZURE_TENANT_ID`
- Tu **Id. de suscripción** (Portal → Suscripciones) → `AZURE_SUBSCRIPTION_ID`

### Credencial federada (para que no haga falta guardar contraseñas)
En la app registrada → **Certificados y secretos** → pestaña **Credenciales
federadas** → **Agregar credencial**:
- Escenario: **GitHub Actions deploying Azure resources**
- Organización: `ViCaPo`
- Repositorio: `RestaurantApp`
- Tipo de entidad: **Branch**
- Nombre de la rama: `master`
- Nombre: `restaurantapp-master-deploy`

### Dar permiso sobre el Resource Group
Portal → grupo de recursos `restaurantapp-rg` → **Control de acceso (IAM)** → **Agregar
asignación de rol**:
- Rol: **Colaborador de sitios web** (Website Contributor) — alcanza para desplegar sin
  darle permisos de más
- Miembro: busca `restaurantapp-github-deploy` (la app registrada) y asígnasela

## 6. Configurar variables de entorno en el App Service

Portal → tu App Service → **Configuración → Variables de entorno** → **Nueva
configuración de la aplicación**, una por una:

| Nombre | Valor |
|---|---|
| `ConnectionStrings__Default` | la cadena ADO.NET de Azure SQL (paso 3) |
| `Storage__Azure__ConnectionString` | la cadena de conexión del storage (paso 4) |
| `ASPNETCORE_ENVIRONMENT` | `Production` |

No hace falta configurar `Seguridad__Https__*` (Azure ya provee HTTPS gestionado) ni
`Cors__Origins` (el SPA se sirve del mismo origen que la API).

**Guardar** al terminar — el App Service se reinicia solo.

## 7. Secretos en GitHub

En tu repo → **Settings → Secrets and variables → Actions → New repository secret**,
crea estos tres (con los valores del paso 5):
- `AZURE_CLIENT_ID`
- `AZURE_TENANT_ID`
- `AZURE_SUBSCRIPTION_ID`

## 8. Primer despliegue

Con todo lo anterior listo, revisa y comitea `.github/workflows/master_restaurantapp-api.yml`
(ya está preparado en el repo, sin pushear) y haz push a `master`. El workflow:
1. Compila el frontend (`npm run build`, genera `RestaurantApp.API/wwwroot`).
2. Publica la API en modo Release (incluye el wwwroot recién compilado).
3. Se autentica en Azure vía OIDC.
4. Despliega el paquete al App Service.

La migración de base de datos (`db.Database.Migrate()`) corre sola al arrancar la app,
así que las tablas se crean solas en Azure SQL en el primer arranque.

## Notas
- El plan F1 "duerme" la app tras ~20 min sin tráfico; la primera petición después
  tarda unos segundos en responder. Si molesta, hay que subir a B1 (ya no gratis).
- El sistema de licencia (`licencia.dat`) no existe en este repo, así que la app corre
  en modo demo automáticamente — no bloquea nada en Azure.
