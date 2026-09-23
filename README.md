# TechnicalAssessmentPlatform

Plataforma web para crear, presentar y calificar automáticamente pruebas técnicas de programación.
Construida con Node.js, TypeScript, Express, PostgreSQL, Docker y React (Vite + Monaco Editor).

## Requisitos

- Node.js 20 o superior
- PostgreSQL con la base `technical_assessment_platform_db` (respaldo en `baseDeDatos/`; es un volcado de `pg_dump`, se restaura con `pg_restore`)
- Docker Desktop encendido (el código de los candidatos se ejecuta en contenedores)

Descarga las imágenes de ejecución una vez (si no, la primera ejecución puede agotar el tiempo mientras se descargan):

```bash
docker pull eclipse-temurin:21-jdk
docker pull node:24-alpine
docker pull python:3.12-alpine
```

## Cómo ejecutar

```bash
cd backend && npm install && npm run dev      # API en http://localhost:3074
cd frontend && npm install && npm run dev     # Web en http://localhost:5173
```

La conexión a la base se configura con las variables `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` y `DB_PASSWORD` (ver `backend/src/config.ts`).
El frontend usa `VITE_API_URL` (por defecto `http://localhost:3074`).

## Flujo

1. **Administración** (`/admin`): crear un assessment, agregar preguntas (lenguajes permitidos y casos de prueba públicos u ocultos) y publicarlo.
2. **Pantalla 1 – Listado** (`/`): el candidato elige un assessment publicado e inicia una sesión con su nombre y correo.
3. **Pantalla 2 – Detalle** (`/sessions/:id`): tiempo restante, preguntas, estado y puntaje acumulado.
4. **Pantalla 3 – Editor** (`/sessions/:id/questions/:qid`): Monaco Editor, selección de lenguaje, **Ejecutar** (solo casos públicos, no califica) y **Enviar** (todos los casos, califica).
5. **Pantalla 4 – Resultados** (`/sessions/:id/results`): puntaje, preguntas correctas e incorrectas y tiempo consumido.

## Ejecución del código

`backend/src/module/runner/runner/runnerFactory.ts` define un runner por lenguaje (Java, JavaScript y Python).
Todos usan `DockerCodeRunner`, que:

1. escribe el código en una carpeta temporal;
2. **prepara**: compila (`javac`) o valida la sintaxis (`node --check`, `py_compile`). Si falla, devuelve `COMPILE_ERROR` con el mensaje del compilador;
3. **ejecuta** un contenedor desechable por caso de prueba, pasándole la entrada por stdin, y compara stdout con la salida esperada;
4. borra la carpeta temporal.

Medidas de aislamiento de cada contenedor: sin red (`--network none`), sistema de archivos de solo lectura, código montado en solo lectura, 128 MB de memoria, 0.5 CPU, máximo 64 procesos, sin capacidades de Linux (`--cap-drop ALL`, `no-new-privileges`), timeout de 5 s (incluye el arranque del contenedor) y salida máxima de 64 KB.

Para agregar un lenguaje (por ejemplo TypeScript o COBOL) basta con añadir su configuración en `runnerFactory.ts` y activarlo en la tabla `programming_language`.

## Calificación

- Puntaje de un envío = `casos aprobados / casos totales × puntaje de la pregunta`.
- En el resumen de la sesión (`GET /assessment-sessions/:id/summary`) cada pregunta toma su **mejor intento**; es *correcta* si ese intento pasó todos los casos.
- Los casos ocultos se ejecutan al calificar, pero su entrada y su salida nunca se devuelven al candidato.
