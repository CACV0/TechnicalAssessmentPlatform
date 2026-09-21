# Technical Assessment Platform

Plataforma web para la creación y ejecución de evaluaciones técnicas de programación.

El proyecto permite administrar assessments, preguntas, lenguajes de programación y casos de prueba. Los candidatos pueden iniciar una sesión, ejecutar código contra casos de prueba públicos y enviar soluciones que son evaluadas contra casos públicos y ocultos.

## Arquitectura

El proyecto está dividido en dos aplicaciones:

```text
TechnicalAssessmentPlatform/
├── backend/
└── frontend/
```

### Backend

Tecnologías principales:

- Node.js 24
- TypeScript
- Express
- PostgreSQL
- Docker
- OpenAPI 3
- express-openapi-validator
- Jest
- Supertest

Arquitectura:

```text
Controller
    ↓
Service
    ↓
Repository
    ↓
PostgreSQL
```

Se utiliza un monolito modular organizado por dominio.

### Frontend

Frontend ligero construido con:

- HTML
- CSS
- JavaScript
- Fetch API

El frontend consume la API REST del backend.

---

# Requisitos

Para ejecutar el proyecto se necesita:

- Git
- Node.js 24 o compatible
- npm
- PostgreSQL
- Docker Desktop

## macOS

Se recomienda instalar Homebrew.

Comprobar si está instalado:

```bash
brew --version
```

Si no está instalado, consultar:

https://brew.sh/

Después instalar las dependencias principales:

```bash
brew install node@24
brew install postgresql
```

Docker Desktop debe instalarse desde:

https://www.docker.com/products/docker-desktop/

Después de instalar Docker Desktop, iniciarlo y comprobar:

```bash
docker --version
docker ps
```

---

# Clonar el proyecto

```bash
git clone <URL_DEL_REPOSITORIO>
```

Entrar al proyecto:

```bash
cd TechnicalAssessmentPlatform
```

La estructura esperada es:

```text
TechnicalAssessmentPlatform/
├── backend/
└── frontend/
```

---

# Configuración del Backend

Entrar al backend:

```bash
cd backend
```

Instalar dependencias:

```bash
npm install
```

Comprobar Node:

```bash
node --version
```

Comprobar npm:

```bash
npm --version
```

---

# PostgreSQL

Comprobar PostgreSQL:

```bash
psql --version
```

Si PostgreSQL fue instalado mediante Homebrew:

```bash
brew services start postgresql
```

Comprobar los servicios:

```bash
brew services list
```

Crear la base de datos requerida por el proyecto utilizando los scripts SQL incluidos en el repositorio.

> Importante: ejecutar las migraciones/scripts SQL del proyecto antes de iniciar el backend.

Configurar las variables de entorno del backend de acuerdo con la configuración local de PostgreSQL.

Ejemplo conceptual:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=technical_assessment_platform
DB_USER=<usuario>
DB_PASSWORD=<password>
```

Utilizar los nombres reales definidos por el proyecto si son diferentes.

---

# Docker Runner

Docker se utiliza para ejecutar código de candidatos de forma aislada.

Actualmente el runner implementado utiliza Java.

Descargar previamente la imagen:

```bash
docker pull eclipse-temurin:21-jdk
```

Comprobar:

```bash
docker images
```

Debe aparecer una imagen similar a:

```text
eclipse-temurin   21-jdk
```

Probar Docker:

```bash
docker run --rm eclipse-temurin:21-jdk java -version
```

---

# Ejecutar Backend

Desde:

```text
TechnicalAssessmentPlatform/backend
```

Compilar:

```bash
npm run build
```

Iniciar:

```bash
npm run start
```

La API queda disponible en:

```text
http://localhost:3074
```

Comprobar health check:

```text
GET http://localhost:3074/health
```

---

# Ejecutar Frontend

Abrir otra terminal.

Desde la raíz:

```bash
cd frontend
```

No es necesario instalar Python.

Ejecutar:

```bash
npx serve . -l 5500
```

Si `npx` solicita instalar `serve`, aceptar la instalación.

Abrir:

```text
http://localhost:5500
```

---

# Ejecución completa

Se necesitan dos terminales.

## Terminal 1 - Backend

```bash
cd TechnicalAssessmentPlatform/backend
npm install
npm run build
npm run start
```

Backend:

```text
http://localhost:3074
```

## Terminal 2 - Frontend

```bash
cd TechnicalAssessmentPlatform/frontend
npx serve . -l 5500
```

Frontend:

```text
http://localhost:5500
```

Docker Desktop también debe permanecer iniciado para ejecutar código.

---

# Flujo funcional

El flujo principal del candidato es:

```text
Assessment
    ↓
Assessment Session
    ↓
Question
    ↓
Write Code
    ↓
RUN
    ↓
PUBLIC Test Cases
    ↓
SUBMIT
    ↓
PUBLIC + HIDDEN Test Cases
    ↓
Score
    ↓
Results
```

## RUN

El endpoint RUN ejecuta el código únicamente contra casos de prueba públicos.

```text
POST /assessment-sessions/{sessionId}/questions/{questionId}/run
```

RUN:

- No crea Submission.
- No persiste TestCaseResult.
- Ejecuta únicamente casos PUBLIC.
- Nunca ejecuta ni expone información de casos HIDDEN.

## SUBMIT

```text
POST /assessment-sessions/{sessionId}/questions/{questionId}/submissions
```

SUBMIT:

- Crea un Submission.
- Ejecuta casos PUBLIC.
- Ejecuta casos HIDDEN.
- Persiste los resultados.
- Calcula el puntaje.
- Actualiza el estado del Submission.

## RESULTS

```text
GET /submissions/{submissionId}/results
```

Los resultados públicos pueden mostrar información de ejecución.

Los resultados HIDDEN son sanitizados.

Ejemplo:

```json
{
  "testCaseId": null,
  "visibility": "HIDDEN",
  "status": "PASSED",
  "actualOutput": null,
  "errorMessage": null,
  "executionTimeMs": null
}
```

Esto evita exponer información sensible de los casos de prueba ocultos.

---

# Estados principales

## Assessment

```text
DRAFT
PUBLISHED
CLOSED
```

Solo un Assessment en `DRAFT` puede ser modificado.

Flujo:

```text
DRAFT → PUBLISHED → CLOSED
```

## Assessment Session

```text
IN_PROGRESS
COMPLETED
EXPIRED
```

## Submission

```text
PENDING
EVALUATED
FAILED
```

`FAILED` representa principalmente un fallo de infraestructura o del runner.

Los errores producidos por el código del candidato se representan en los resultados de los test cases.

## Test Case Result

```text
PASSED
FAILED
ERROR
TIMEOUT
```

---

# Seguridad del Runner

El código del candidato se ejecuta utilizando contenedores Docker efímeros.

Entre las restricciones implementadas se encuentran:

```text
--network none
--memory 128m
--cpus 0.5
--pids-limit 64
--read-only
```

Los contenedores utilizan nombres únicos y son eliminados cuando ocurre un timeout.

El backend utiliza `spawn` para ejecutar Docker sin construir comandos mediante shell.

---

# Evaluación

Para cada Submission:

```text
Submission
    ↓
Obtener Question
    ↓
Obtener Test Cases
    ↓
Preparar código
    ↓
Compilar
    ↓
Ejecutar Test Cases
    ↓
Comparar outputs
    ↓
Persistir resultados
    ↓
Calcular score
    ↓
EVALUATED
```

El puntaje se calcula proporcionalmente:

```text
(passedTestCases / totalTestCases) * questionScore
```

El resultado se redondea a dos decimales.

---

# OpenAPI

La API está documentada mediante OpenAPI Specification 3.0.2.

También se utiliza:

```text
express-openapi-validator
```

para validar las solicitudes contra el contrato definido por la API.

Las peticiones utilizan el header:

```text
X-RqUID
```

para trazabilidad.

---

# Tests

Ejecutar:

```bash
npm test
```

Compilar el proyecto:

```bash
npm run build
```

Antes de realizar una demostración se recomienda ejecutar:

```bash
npm run build
npm test
```

---

# Problemas comunes

## Docker no responde

Comprobar que Docker Desktop esté iniciado:

```bash
docker ps
```

## La imagen Java no existe

Ejecutar:

```bash
docker pull eclipse-temurin:21-jdk
```

## Backend no conecta con PostgreSQL

Verificar:

- PostgreSQL iniciado.
- Puerto `5432`.
- Usuario.
- Password.
- Nombre de base de datos.
- Variables de entorno.

## Frontend muestra Failed to fetch

Comprobar que el backend esté funcionando:

```text
http://localhost:3074/health
```

y que el frontend esté utilizando:

```javascript
const API_URL = "http://localhost:3074";
```

## Puerto ocupado

Frontend:

```bash
npx serve . -l 5501
```

Backend:

Revisar la configuración del puerto antes de cambiarlo, ya que el frontend debe apuntar al mismo puerto.

---

# Limitaciones actuales

La versión actual está diseñada como solución para una prueba técnica y demostración funcional.

Actualmente:

- El runner implementado soporta Java.
- La evaluación es síncrona.
- Docker se ejecuta localmente.
- El sandbox tiene restricciones básicas, pero un entorno productivo requeriría endurecimiento adicional.
- La ejecución distribuida mediante workers/colas queda como posible evolución futura.

Una arquitectura productiva podría evolucionar hacia:

```text
API
 ↓
Queue
 ↓
Runner Workers
 ↓
Isolated Execution Environment
 ↓
Results
```

Esto permitiría escalar la ejecución de código independientemente de la API.

---

# Resumen rápido para levantar el proyecto en macOS

Después de clonar:

```bash
# Backend
cd TechnicalAssessmentPlatform/backend
npm install
npm run build
npm run start
```

En otra terminal:

```bash
# Frontend
cd TechnicalAssessmentPlatform/frontend
npx serve . -l 5500
```

Verificar Docker:

```bash
docker ps
```

Verificar PostgreSQL:

```bash
psql --version
```

Abrir:

```text
Frontend: http://localhost:5500
Backend:  http://localhost:3074
```
