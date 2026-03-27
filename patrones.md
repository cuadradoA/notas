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

## Resumen General

Los patrones de diseno se aplican en distintas capas del sistema:

- `Singleton`: se aplica en la conexion compartida a MongoDB.
- `Factory Method`: se aplica en la creacion y clonacion de tareas segun su tipo.
- `Abstract Factory`: se aplica en el cambio de tema visual del frontend.
- `Prototype`: se aplica en la clonacion de tareas y proyectos.
- `Builder`: se aplica en la construccion avanzada de tareas antes de guardarlas.

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
