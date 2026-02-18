# Plan de Implementación: Scanner WiFi - Net-Watcher OS

Este documento detalla la estructura y los pasos para organizar y construir la aplicación "Net-Watcher OS" basada en React. El objetivo principal es modularizar el código monolítico proporcionado en una arquitectura escalable y mantenible.

## 1. Estructura del Proyecto

Organizaremos el proyecto siguiendo una arquitectura basada en características y componentes reutilizables.

```
src/
├── components/          # Componentes de React
│   ├── common/          # Componentes genéricos reutilizables (Button, Panel)
│   ├── layout/          # Componentes estructurales (Header, Sidebar)
│   ├── modules/         # Módulos específicos de la aplicación
│   │   ├── scanner/     # Lógica y visualización del escáner (Canvas)
│   │   ├── logs/        # Visualización de logs/bitácora
│   │   ├── status/      # Paneles de estado (Sensor, Hardware)
│   │   └── config/      # Modales de configuración
│   └── ui/              # Elementos de UI base (si aplica)
├── hooks/               # Custom Hooks para lógica de estado
│   ├── useTheme.js      # Gestión del tema (dark/light/system)
│   ├── useScanner.js    # Lógica del motor de escaneo
│   └── useNetworkCmds.js# Comandos de red simulados
├── styles/              # Estilos globales y variables
│   └── index.css        # Estilos base y Tailwind (si se usa)
├── utils/               # Funciones utilitarias
│   └── helpers.js       # Helpers for colors, random data
├── App.jsx              # Componente raíz simplificado
└── main.jsx             # Punto de entrada
```

## 2. Dependencias Necesarias

El código actual depende de:
- `react`: Core (ya incluido en Vite template).
- `lucide-react`: Para los iconos (Se debe instalar).
- `tailwindcss` (Opcional pero recomendado por la estructura de clases usada en el código original, ej: `bg-slate-900`, `text-cyan-500`).

**Nota:** El código proporcionado utiliza clases de utilidad de Tailwind CSS extensivamente. Para que el diseño funcione como en el código original, **debemos configurar Tailwind CSS**.

## 3. Desglose de Componentes

### Componentes Base (`src/components/common/`)
- **`Button.jsx`**: Maneja las variantes `primary`, `danger`, `action`.
- **`Panel.jsx`**: Contenedor con borde, título e iconos.

### Componentes del Escáner (`src/components/modules/scanner/`)
- **`ScannerCanvas.jsx`**: Contendrá toda la lógica de animación del canvas (partículas, haz de luz, osciloscopio). Recibirá props como `isScanning`, `disturbanceLevel` y `isDark`.

### Componentes de UI (`src/components/modules/`)
- **`Header.jsx`**: Barra superior con título, estado y selector de tema.
- **`SensorStatus.jsx`**: Panel izquierdo superior con el medidor de perturbación.
- **`LogPanel.jsx`**: Panel de bitácora de eventos.
- **`ControlPanel.jsx`**: Panel derecho con slider de sensibilidad y botones de acción.
- **`ConfigModal.jsx`**: Modal flotante para configuración de WiFi/Hardware/Cloud.
- **`AiReportModal.jsx`**: Modal para el reporte de IA.

### Custom Hooks (`src/hooks/`)
- **`useTheme.js`**: Abstraerá la lógica de `useEffect` para `matchMedia` y `localStorage`.
- **`useScannerEngine.js`**: Manejará el `setInterval` del escaneo, lógica de "perturbación" e historial de señales.

## ### 4. Pasos de Implementación

1.  **Configuración Inicial**:
    -   [x] Instalar `lucide-react`, `tailwindcss`, `postcss`, `autoprefixer`.
    -   [x] Inicializar `tailwindcss`.
    -   [ ] Crear estructura de directorios.

2.  **Gestión de Versiones y Despliegue (Nuevo)**:
    -   [x] Inicializar Git local (`git init`).
    -   [ ] Crear repositorio remoto en GitHub: `gh repo create wifi-scanner --public --source=. --remote=origin`.
    -   [ ] Hacer push inicial: `git push -u origin main`.
    -   [ ] Configurar Cloudflare Pages:
        -   Opción A (Recomendada): Conectar repositorio GitHub desde el Dashboard de Cloudflare.
        -   Opción B (CLI): Usar `wrangler pages deploy dist` (requiere build local).
    -   *Nota*: Se realizarán commits frecuentes con mensajes descriptivos para asegurar el historial.

3.  **Migración de Utilidades y Hooks**:
    -   Crear `src/hooks/useTheme.js`.
    -   Crear `src/utils/colors.js` (función `getDynamicColor`).
    -   Mover lógica de escaneo a `src/hooks/useScannerEngine.js` (opcional, o mantener en App al principio y refactorizar luego).

3.  **Componentes Base**:
    -   Implementar `Button.jsx` y `Panel.jsx` extrayendo el código existente.

4.  **Refactorización de Componentes Principales**:
    -   Crear `ScannerCanvas.jsx`.
    -   Crear `Header.jsx`.
    -   Crear `LogPanel.jsx`.
    -   Crear `StatusPanel.jsx`.
    -   Crear `ControlPanel.jsx`.
    -   Crear modales (`ConfigModal`, `ReportModal`).

5.  **Ensamblaje en App.jsx**:
    -   Importar todos los módulos.
    -   Conectar estados y props.
    -   Asegurar que el layout responsive (grid) funcione correctamente.

6.  **Pruebas y Ajustes**:
    -   Verificar que el tema oscuro/claro funcione.
    -   Verificar animaciones del canvas.
    -   Asegurar que no haya errores de consola.

## 5. Notas Adicionales

-   El proyecto usa `standard` CSS o Tailwind? El código tiene clases como `bg-slate-900`, lo que indica **Tailwind CSS**. Es crítico instalarlo para que se vea bien.
-   Se mantendrá la lógica de "simulación" (datos falsos de redes wifi, etc.) tal como está en el código original.
