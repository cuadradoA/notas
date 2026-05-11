# Patrones de Diseno Aplicados en el Proyecto

Este documento describe los patrones de diseno aplicados en el sistema, donde estan localizados, que hacen y cual es su flujo real dentro del proyecto.

## 1. Singleton

### Que hace
El patron Singleton garantiza que exista una unica instancia compartida de la conexion a la base de datos MongoDB en toda la aplicacion.

### Donde se aplica
Se aplica en el arranque del backend y en toda operacion que necesita acceso a MongoDB, porque toda la aplicacion reutiliza una sola instancia de conexion.

### Donde esta localizado
- `backend/src/infrastructure/database/mongo.js`
- `backend/src/server.js`

### Como funciona
En `mongo.js` se define la clase `MongoSingleton`, que controla la creacion y reutilizacion de la conexion a MongoDB. El archivo exporta directamente una unica instancia usando `MongoSingleton.getInstance()`.

Cuando el backend arranca desde `server.js`, se importa ese modulo y se ejecuta `mongo.connect()`. Si la conexion ya existe, se reutiliza `mongoose.connection`. Si no existe, se crea una sola promesa de conexion y se guarda para evitar conexiones duplicadas.

### Flujo
1. El backend inicia en `backend/src/server.js`.
2. `server.js` importa `backend/src/infrastructure/database/mongo.js`.
3. `mongo.js` devuelve una unica instancia de `MongoSingleton`.
4. `server.js` ejecuta `mongo.connect()`.
5. Si ya hay conexion activa, se reutiliza.
6. Si no la hay, se crea una sola conexion a MongoDB.
7. El resto del sistema usa esa misma conexion compartida.

### Por que se uso
Se utiliza para centralizar el acceso a la base de datos y evitar conexiones multiples innecesarias.

---

## 2. Factory Method

### Que hace
El patron Factory Method permite crear tareas segun su tipo, delegando la construccion a una fabrica concreta especializada.

### Donde se aplica
Se aplica en la creacion y clonacion de tareas. Cada vez que el sistema necesita construir una tarea final segun su tipo, delega la logica en una fabrica concreta.

### Donde esta localizado
- `backend/src/domain/factories/tasks/TaskFactory.js`
- `backend/src/domain/factories/tasks/TaskCreator.js`
- `backend/src/domain/factories/tasks/BugTaskFactory.js`
- `backend/src/domain/factories/tasks/FeatureTaskFactory.js`
- `backend/src/domain/factories/tasks/TaskTypeTaskFactory.js`
- `backend/src/domain/factories/tasks/ImprovementTaskFactory.js`
- `backend/src/application/services/task.service.js`

### Como funciona
`TaskFactory` ya no usa un `switch` central para crear tareas. Ahora resuelve un creador concreto segun el tipo recibido.

Cada creador concreto hereda de `TaskCreator` e implementa su propio metodo `create(data)`.

Creadores actuales:
- `BugTaskFactory`: crea tareas tipo `BUG` y agrega el label base `Bug`.
- `FeatureTaskFactory`: crea tareas tipo `FEATURE`.
- `TaskTypeTaskFactory`: crea tareas tipo `TASK`.
- `ImprovementTaskFactory`: crea tareas tipo `IMPROVEMENT` y agrega el label base `Improve`.

### Flujo
1. El usuario crea o clona una tarea.
2. `backend/src/application/services/task.service.js` recibe los datos.
3. Primero arma una tarea base usando `TaskBuilder`.
4. Luego llama `TaskFactory.create(type, data)`.
5. `TaskFactory` valida el tipo y resuelve el creador concreto.
6. El creador correspondiente construye la tarea final.
7. `task.service.js` recibe el resultado y lo guarda en MongoDB.

### Por que se uso
Se utiliza para separar la logica de creacion de tareas segun su tipo y mantener el codigo abierto a nuevas variantes.

### Nota importante
En el proyecto existen mas clases dentro de `backend/src/domain/factories`, pero no todas representan exactamente el mismo uso del patron solicitado para tareas. En particular:

- `ProjectFactory.js`, `ProjectFactoryResolver.js`, `NewProjectFactory.js`, `CloneProjectFactory.js`
- `BoardFactory.js`, `BoardFactoryResolver.js`, `DefaultBoardFactory.js`, `CustomBoardFactory.js`
- `ColumnFactory.js`, `ColumnFactoryResolver.js`, `DefaultColumnFactory.js`, `CustomColumnFactory.js`

Estas clases tambien implementan logica de creacion, pero aplicada a otros elementos del sistema como proyectos, tableros y columnas.

---

## 3. Abstract Factory

### Que hace
El patron Abstract Factory permite generar familias completas de estilos visuales para los temas claro y oscuro.

### Donde se aplica
Se aplica en el frontend cuando el usuario cambia entre modo oscuro y modo claro. El sistema construye una familia completa de variables visuales para el tema seleccionado.

### Donde esta localizado
- `frontend/src/theme/factories/ThemeFactory.js`
- `frontend/src/theme/ThemeContext.jsx`

### Como funciona
En `ThemeFactory.js` existe una fabrica abstracta llamada `ThemeFactory` con el metodo `createTheme()`. A partir de ella se definen dos fabricas concretas:
- `LightThemeFactory`
- `DarkThemeFactory`

Cada una construye una familia completa de variables CSS para su tema.

En `ThemeContext.jsx`, la aplicacion determina el modo actual y llama `createThemeFactory(mode)`. Esa funcion devuelve la fabrica concreta correspondiente, que luego ejecuta `createTheme()`.

### Flujo
1. El frontend carga `frontend/src/theme/ThemeContext.jsx`.
2. Se consulta el tema guardado en `localStorage`.
3. `ThemeContext` llama `createThemeFactory(mode)`.
4. Si el modo es `light`, se crea `LightThemeFactory`.
5. Si el modo es `dark`, se crea `DarkThemeFactory`.
6. La fabrica concreta ejecuta `createTheme()`.
7. Se devuelven todas las variables visuales del tema.
8. `ThemeContext` aplica esas variables al documento HTML.

### Por que se uso
Se utiliza para cambiar la apariencia completa de la aplicacion sin alterar la logica interna de los componentes.

---

## 4. Prototype

### Que hace
El patron Prototype permite clonar tareas y proyectos existentes a partir de un objeto base ya creado.

### Donde se aplica
Se aplica en los casos de uso de clonado:
- cuando se clona una tarea
- cuando se clona un proyecto

### Donde esta localizado
- `backend/src/domain/entities/Task.js`
- `backend/src/domain/entities/Project.js`
- `backend/src/application/services/task.service.js`
- `backend/src/application/services/project.service.js`
- `backend/src/domain/factories/projects/CloneProjectFactory.js`

### Como funciona en tareas
La entidad `Task` define el metodo `clone(options)`. Ese metodo toma una tarea existente, elimina identificadores y datos no reutilizables, reinicia historial y estados de completado, y devuelve un nuevo objeto listo para convertirse en una nueva tarea.

### Flujo de clonacion de tarea
1. El usuario selecciona clonar una tarea.
2. `task.service.js` obtiene la tarea original.
3. Se llama `sourceTask.clone(options)`.
4. El metodo elimina `_id`, `createdAt`, `updatedAt` y otros datos no reutilizables.
5. Reinicia historial, completado y subtareas.
6. Devuelve un objeto base clonado.
7. Ese objeto vuelve a pasar por `TaskBuilder`.
8. Luego pasa por `TaskFactory`.
9. Finalmente se guarda como una nueva tarea.

### Como funciona en proyectos
La entidad `Project` define el metodo `clone(options)`. Ese metodo crea una copia del proyecto base, limpia ids y timestamps y deja listo el objeto para generar un nuevo proyecto.

### Flujo de clonacion de proyecto
1. El usuario selecciona clonar un proyecto.
2. `project.service.js` obtiene el proyecto original.
3. Usa `ProjectFactoryResolver.create("clone")`.
4. El resolver devuelve `CloneProjectFactory`.
5. `CloneProjectFactory` llama `sourceProject.clone(...)`.
6. A partir de esa copia arma el nuevo proyecto.
7. Luego el servicio clona tambien los tableros asociados.

### Por que se uso
Se utiliza para reutilizar estructuras existentes y acelerar la creacion de proyectos o tareas similares sin reconstruir todo desde cero.

---

## 5. Builder

### Que hace
El patron Builder permite construir tareas complejas paso a paso, validando su integridad antes de guardarlas.

### Donde se aplica
Se aplica en la construccion de tareas antes de persistirlas, tanto al crear una nueva tarea como al clonar una existente.

### Donde esta localizado
- `backend/src/domain/factories/tasks/TaskBuilder.js`
- `backend/src/application/services/task.service.js`

### Como funciona
`TaskBuilder` encapsula la construccion progresiva de una tarea. Va recibiendo cada parte mediante metodos encadenables y al final ejecuta `build()` para validar el resultado.

Metodos principales:
- `setTitle()`
- `setDescription()`
- `setType()`
- `setPriority()`
- `setDueDate()`
- `setEstimatedHours()`
- `setLabels()`
- `setAssignees()`
- `setColumn()`
- `setBoard()`
- `setSubtasks()`
- `setAttachments()`
- `build()`

### Flujo
1. El usuario envia datos para crear o clonar una tarea.
2. `task.service.js` llama a la funcion interna `buildTaskBuilder(data)`.
3. Esa funcion crea `new TaskBuilder()`.
4. La tarea se construye paso a paso con los metodos del builder.
5. Se ejecuta `build()`.
6. `build()` valida que exista:
- titulo
- columna
- tablero
- al menos un responsable
7. Si la tarea es valida, devuelve un objeto listo para continuar.
8. Luego ese objeto pasa por `TaskFactory`.
9. Finalmente se persiste en MongoDB.

### Por que se uso
Se utiliza para controlar la construccion de tareas complejas y evitar objetos incompletos o inconsistentes.

---

## 6. Adapter

### Que hace
El patron Adapter permite integrar un servicio legado de envio de correos con la interfaz moderna esperada por la aplicacion, sin cambiar el contrato del puerto de correo.

### Donde se aplica
Se aplica en el flujo de invitaciones a proyectos. El sistema ya esperaba un `InvitationEmailService`, pero la salida real de correo mock estaba basada en consola.

### Donde esta localizado
- `backend/src/application/ports/InvitationEmailService.js`
- `backend/src/infrastructure/email/adapters/ConsoleInvitationEmailAdapter.js`
- `backend/src/infrastructure/email/legacy/LegacyConsoleMailer.js`
- `backend/src/infrastructure/email/MockInvitationEmailService.js`
- `backend/src/application/services/project.service.js`

### Como funciona
`ConsoleInvitationEmailAdapter` implementa la interfaz `InvitationEmailService`, pero internamente delega el trabajo al servicio legado `LegacyConsoleMailer`, que expone un metodo distinto llamado `deliver(message)`.

De esta forma, `project.service.js` sigue trabajando contra el puerto `sendProjectInvitation(...)` sin conocer detalles del mecanismo legado.

### Flujo
1. Un usuario invita a otro miembro desde `project.service.js`.
2. El servicio usa `invitationEmailService.sendProjectInvitation(...)`.
3. `MockInvitationEmailService.js` exporta una instancia del adapter.
4. `ConsoleInvitationEmailAdapter` transforma la llamada al formato del servicio legado.
5. `LegacyConsoleMailer` recibe el mensaje final y lo procesa.

### Por que se uso
Se utilizo para desacoplar el servicio de invitaciones del mecanismo concreto de salida y dejar preparado el reemplazo futuro del mock por un proveedor real.

---

## 7. Bridge

### Que hace
El patron Bridge separa la abstraccion del reporte de sus implementaciones concretas de salida, permitiendo exportar el mismo contenido a distintos formatos.

### Donde se aplica
Se aplica en el subsistema de reportes del proyecto, especificamente en dashboard y exportaciones `CSV`, `PDF` y `JSON`.

### Donde esta localizado
- `backend/src/application/reporting/bridge/ProjectReportBridge.js`
- `backend/src/application/reporting/bridge/StandardProjectReport.js`
- `backend/src/application/reporting/bridge/renderers/CsvProjectReportRenderer.js`
- `backend/src/application/reporting/bridge/renderers/PdfProjectReportRenderer.js`
- `backend/src/application/reporting/bridge/renderers/JsonProjectReportRenderer.js`
- `backend/src/application/reporting/facades/ProjectReportingFacade.js`
- `backend/src/application/services/project.service.js`

### Como funciona
`StandardProjectReport` representa la abstraccion del reporte. Esa abstraccion no sabe si la salida final sera texto CSV, binario PDF o estructura JSON.

La implementacion concreta vive en los renderers:
- `CsvProjectReportRenderer`
- `PdfProjectReportRenderer`
- `JsonProjectReportRenderer`

La fachada de reportes construye un snapshot comun y luego conecta la abstraccion con el renderer correcto.

### Flujo
1. `project.service.js` solicita una exportacion.
2. `ProjectReportingFacade` construye el snapshot del proyecto.
3. Se selecciona el renderer segun el formato.
4. `StandardProjectReport` delega la salida al renderer concreto.
5. Se devuelve el archivo o estructura final sin duplicar la logica de negocio.

### Por que se uso
Se utilizo para evitar repetir la logica de armado del reporte en cada formato y para permitir nuevos formatos sin cambiar la abstraccion principal.

---

## 8. Composite

### Que hace
El patron Composite permite representar la estructura jerarquica del proyecto como un arbol uniforme de objetos compuestos y hojas.

### Donde se aplica
Se aplica en la construccion de la estructura de reporting:
- proyecto
- tableros
- columnas
- tareas

### Donde esta localizado
- `backend/src/application/reporting/composite/ProjectTreeNode.js`
- `backend/src/application/reporting/composite/CompositeTreeNode.js`
- `backend/src/application/reporting/composite/TaskLeafNode.js`
- `backend/src/application/reporting/facades/ProjectReportingFacade.js`
- `backend/src/application/services/project.service.js`
- `backend/src/presentation/controllers/project.controller.js`
- `backend/src/presentation/routes/project.routes.js`

### Como funciona
`CompositeTreeNode` representa nodos que pueden contener otros nodos, como proyecto, tablero o columna.

`TaskLeafNode` representa la hoja final del arbol, es decir, una tarea individual.

Todos comparten una interfaz comun para resumir datos y exponer su representacion serializable.

### Flujo
1. `ProjectReportingFacade` consulta boards y tareas del proyecto.
2. Construye un nodo raiz de tipo `PROJECT`.
3. Debajo agrega nodos `BOARD`.
4. Debajo agrega nodos `COLUMN`.
5. Finalmente agrega hojas `TASK`.
6. El arbol puede resumir progreso, vencimiento y volumen total sin conocer detalles del consumidor final.

### Por que se uso
Se utilizo porque el dominio ya tenia una estructura naturalmente jerarquica y el patron permite recorrerla, resumirla y exportarla de forma limpia.

---

## 9. Decorator

### Que hace
El patron Decorator agrega responsabilidades a un canal de notificacion de forma componible, sin mezclar todo en una sola clase.

### Donde se aplica
Se aplica en el sistema de notificaciones del backend:
- persistencia en base de datos
- validacion de preferencias del usuario
- envio en tiempo real por socket

### Donde esta localizado
- `backend/src/application/notifications/NotificationChannel.js`
- `backend/src/application/notifications/DatabaseNotificationChannel.js`
- `backend/src/application/notifications/decorators/NotificationChannelDecorator.js`
- `backend/src/application/notifications/decorators/UserPreferenceNotificationDecorator.js`
- `backend/src/application/notifications/decorators/RealtimeNotificationDecorator.js`
- `backend/src/application/services/notification.service.js`

### Como funciona
La clase base `DatabaseNotificationChannel` crea la notificacion persistida.

Encima de ella se encadenan decoradores:
- `UserPreferenceNotificationDecorator`: verifica si el usuario quiere recibir ese evento.
- `RealtimeNotificationDecorator`: envia la notificacion al socket si fue creada.

`notification.service.js` construye la cadena y expone una interfaz simple al resto de la aplicacion.

### Flujo
1. Un servicio del sistema llama `NotificationService.notify(...)`.
2. El decorador de preferencias decide si el evento debe continuar.
3. Si pasa el filtro, el canal base crea la notificacion en MongoDB.
4. Luego el decorador realtime la emite por socket.
5. El frontend la recibe sin que los servicios de dominio conozcan esos detalles.

### Por que se uso
Se utilizo para separar responsabilidades y mantener abierta la posibilidad de agregar nuevos comportamientos, por ejemplo email o auditoria adicional, sin reescribir el canal base.

---

## 10. Facade

### Que hace
El patron Facade expone una interfaz simple para un subsistema interno mas complejo, ocultando consultas, armado de estructura, resumenes y exportaciones.

### Donde se aplica
Se aplica en el subsistema de reportes del proyecto.

### Donde esta localizado
- `backend/src/application/reporting/facades/ProjectReportingFacade.js`
- `backend/src/application/services/project.service.js`
- `backend/src/presentation/controllers/project.controller.js`
- `backend/src/presentation/routes/project.routes.js`

### Como funciona
`ProjectReportingFacade` concentra varios pasos internos:
- construccion del arbol compuesto
- resolucion del proxy de datos
- calculo de metricas
- exportacion por bridge

`project.service.js` ya no necesita conocer todos esos detalles; solo delega en la fachada.

### Flujo
1. El controlador recibe una solicitud de dashboard, estructura o exportacion.
2. `project.service.js` valida permisos.
3. El servicio llama a `ProjectReportingFacade`.
4. La fachada coordina el resto de clases del subsistema y devuelve el resultado final.

### Por que se uso
Se utilizo para reducir complejidad en `project.service.js` y centralizar un modulo transversal de reporting.

---

## 11. Flyweight

### Que hace
El patron Flyweight reutiliza objetos compartidos para representar la semantica repetida de columnas, evitando recalcular la misma interpretacion varias veces.

### Donde se aplica
Se aplica en la interpretacion de columnas como:
- columna de completado
- columna archivada

### Donde esta localizado
- `backend/src/application/reporting/flyweights/ColumnSemanticFlyweightFactory.js`
- `backend/src/application/services/task.service.js`
- `backend/src/application/reporting/facades/ProjectReportingFacade.js`

### Como funciona
`ColumnSemanticFlyweightFactory` normaliza el nombre de la columna y guarda en cache un objeto compartido que describe su semantica.

Ese objeto luego se reutiliza tanto en tareas como en reportes para decidir si una columna cuenta como completada o archivada.

### Flujo
1. Se recibe una columna.
2. El factory normaliza su nombre.
3. Si ya existe un flyweight para esa semantica, lo reutiliza.
4. Si no existe, lo crea una sola vez.
5. `task.service.js` y `ProjectReportingFacade` consumen ese objeto compartido.

### Por que se uso
Se utilizo para evitar duplicacion de reglas semanticas y centralizar un criterio que ya se repetia en varios lugares.

---

## 12. Proxy

### Que hace
El patron Proxy controla el acceso a los datos de reporting y agrega cache temporal para evitar consultas redundantes durante una misma operacion.

### Donde se aplica
Se aplica en la lectura de boards y tareas necesarias para construir dashboard, estructura y exportaciones del proyecto.

### Donde esta localizado
- `backend/src/application/reporting/proxy/MongoProjectInsightsGateway.js`
- `backend/src/application/reporting/proxy/CachedProjectInsightsProxy.js`
- `backend/src/application/reporting/facades/ProjectReportingFacade.js`

### Como funciona
`MongoProjectInsightsGateway` es el acceso real a MongoDB para boards y tareas del proyecto.

`CachedProjectInsightsProxy` se coloca delante del gateway y reutiliza resultados durante la misma ejecucion del reporte.

### Flujo
1. La fachada solicita boards o tareas.
2. El proxy revisa si esos datos ya fueron consultados.
3. Si existen en cache, los devuelve.
4. Si no existen, llama al gateway real, guarda el resultado y lo reutiliza.

### Por que se uso
Se utilizo para encapsular optimizacion de acceso a datos sin contaminar la logica principal del subsistema de reportes.

---

## Resumen General

Los patrones de diseno se aplican en distintas capas del sistema:

- `Singleton`: se aplica en la conexion compartida a MongoDB.
- `Factory Method`: se aplica en la creacion y clonacion de tareas segun su tipo.
- `Abstract Factory`: se aplica en el cambio de tema visual del frontend.
- `Prototype`: se aplica en la clonacion de tareas y proyectos.
- `Builder`: se aplica en la construccion avanzada de tareas antes de guardarlas.
- `Adapter`: se aplica en la adaptacion del servicio legado de correo para invitaciones.
- `Bridge`: se aplica en la separacion entre reporte y formato de exportacion.
- `Composite`: se aplica en la representacion jerarquica de proyecto, board, columna y tarea.
- `Decorator`: se aplica en la composicion del canal de notificaciones.
- `Facade`: se aplica en la simplificacion del subsistema de reporting.
- `Flyweight`: se aplica en la reutilizacion de la semantica de columnas.
- `Proxy`: se aplica en el acceso cacheado a datos del subsistema de reportes.

---

## Tabla Control de Cambios en el Codigo

La siguiente tabla resume los principales problemas identificados en la version preliminar del codigo, es decir, en la version original del proyecto antes de incorporar los patrones estructurales. Cada fila muestra el problema detectado, la funcionalidad afectada, sus consecuencias y la mejora aplicada.

| Descripcion del problema | Funcionalidad donde se identifica | Efectos o consecuencias | Cambio o mejora aplicada |
|---|---|---|---|
| La logica de exportacion y dashboard estaba concentrada en `project.service.js` y mezclaba consultas, calculos, estructura y salida final. | Dashboard de proyecto y exportaciones CSV/PDF. | Alto acoplamiento, baja legibilidad y dificultad para extender nuevos formatos o nuevas vistas. | Se incorporo una `Facade` de reporting para centralizar el subsistema y un `Bridge` para separar la abstraccion del reporte de los formatos `CSV`, `PDF` y `JSON`. |
| La exportacion de reportes duplicaba comportamiento porque cada formato resolvia su salida con logica propia en el servicio. | Exportacion de reportes del proyecto. | Mantenimiento costoso y riesgo de inconsistencias entre formatos. | Se creo una abstraccion comun del reporte y renderizadores concretos, aplicando `Bridge`. |
| El sistema no tenia una representacion jerarquica explicita del dominio de reporting. | Estructura proyecto-tableros-columnas-tareas. | Dificultad para resumir datos, recorrer niveles del proyecto o exponer una estructura reutilizable. | Se implemento `Composite` para modelar el arbol del proyecto con nodos compuestos y hojas de tarea. |
| La semantica de columnas completadas se resolvia con logica repetida basada en nombres de columnas. | Calculo de progreso, cierre de tareas y dashboard. | Duplicacion de reglas, riesgo de divergencia entre servicios y menor cohesion. | Se incorporo `Flyweight` para reutilizar objetos semanticos compartidos de columna y centralizar la interpretacion. |
| El acceso a boards y tareas para reportes se hacia directamente desde el servicio, repitiendo consultas durante el mismo flujo. | Generacion de dashboard, estructura y exportaciones. | Consultas redundantes y responsabilidad tecnica mezclada con la logica de negocio. | Se agrego un `Proxy` con cache temporal delante del gateway real de reporting. |
| La capa de notificaciones concentraba validacion de preferencias, persistencia en base de datos y emision por socket en un solo servicio. | Notificaciones en la aplicacion. | Clase con multiples responsabilidades y baja extensibilidad para agregar nuevos comportamientos. | Se aplico `Decorator` para encadenar responsabilidades sobre un canal base de notificaciones. |
| El flujo de correo de invitacion dependia directamente de una implementacion mock concreta. | Invitaciones a proyectos. | Acoplamiento con un mecanismo tecnico puntual y poca flexibilidad para sustituir el proveedor de envio. | Se aplico `Adapter` para adaptar el servicio legado de consola al puerto `InvitationEmailService`. |
| `project.service.js` acumulaba demasiadas responsabilidades ademas de la gestion natural del proyecto. | Servicios de proyecto. | Servicio dificil de mantener, probar y extender sin introducir regresiones. | Se movio la complejidad transversal de reporting a `ProjectReportingFacade`, reduciendo responsabilidades directas del servicio. |

### Conclusiones de la tabla

La mayor parte de los problemas de la version preliminar no estaban relacionados con fallos funcionales visibles, sino con problemas de diseno interno:

- concentracion excesiva de responsabilidades
- duplicacion de logica
- falta de puntos de extension claros
- alto acoplamiento entre capas tecnicas y logica de negocio

Los patrones estructurales se incorporaron precisamente para corregir esos problemas sin alterar el comportamiento observable del sistema, manteniendo compatibilidad con la base original.

## Otras Fabricas Presentes en el Proyecto

Ademas del `Factory Method` usado para tareas, el proyecto incluye otras fabricas auxiliares organizadas dentro de `backend/src/domain/factories`.

### Fabricas de proyecto
- `projects/ProjectFactory.js`
- `projects/ProjectFactoryResolver.js`
- `projects/NewProjectFactory.js`
- `projects/CloneProjectFactory.js`

#### Que hacen
Se encargan de construir proyectos nuevos o proyectos clonados.

#### Flujo
1. `project.service.js` necesita crear o clonar un proyecto.
2. Llama a `ProjectFactoryResolver.create(type)`.
3. El resolver devuelve la fabrica concreta:
- `NewProjectFactory`
- `CloneProjectFactory`
4. La fabrica concreta arma la estructura del proyecto.
5. Luego el servicio persiste el proyecto y completa el resto del flujo.

### Fabricas de board
- `boards/BoardFactory.js`
- `boards/BoardFactoryResolver.js`
- `boards/DefaultBoardFactory.js`
- `boards/CustomBoardFactory.js`

#### Que hacen
Se encargan de construir tableros por defecto o personalizados.

#### Flujo
1. El servicio necesita crear un board.
2. Llama a `BoardFactoryResolver.create(type)`.
3. El resolver devuelve la fabrica concreta correspondiente.
4. La fabrica concreta construye el objeto board.
5. El servicio lo guarda en MongoDB.

### Fabricas de columnas
- `columns/ColumnFactory.js`
- `columns/ColumnFactoryResolver.js`
- `columns/DefaultColumnFactory.js`
- `columns/CustomColumnFactory.js`

#### Que hacen
Se encargan de construir las columnas iniciales o personalizadas de un tablero.

#### Flujo
1. Una fabrica de board necesita columnas.
2. Llama a `ColumnFactoryResolver.create(type)`.
3. El resolver devuelve la fabrica concreta de columnas.
4. La fabrica concreta genera la lista de columnas.
5. Esa lista se integra dentro del board antes de guardarse.

En conjunto, estos patrones ayudan a que el sistema sea mas mantenible, extensible y ordenado dentro de su arquitectura por capas.
