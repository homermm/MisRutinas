# MisRutinas

App de entrenamiento personal. Registra tus rutinas, ejercicios y seguí tu progreso con Smart Sets.

## Stack

- React + Vite
- Tailwind CSS
- Supabase (Auth + PostgreSQL)
- Lucide Icons

## Instalación

```bash
npm install
```

## Configuración

1. Creá un proyecto en [Supabase](https://supabase.com)
2. Ejecutá el script `supabase/schema.sql` en el SQL Editor
3. Copiá `.env.example` a `.env` y completá tus credenciales:

```
VITE_SUPABASE_URL=tu-url
VITE_SUPABASE_ANON_KEY=tu-key
```

## Uso

```bash
# Desarrollo
npm run dev

# O usá los scripts:
start.bat    # Inicia el servidor
stop.bat     # Cierra el servidor
```

## Funcionalidades

- **Biblioteca**: Categorías y ejercicios organizados
- **Rutinas**: Armá tus rutinas con los ejercicios que quieras
- **Smart Sets**: Al entrenar, se pre-cargan los datos de tu última sesión
- **Cronómetro**: Presets de descanso (60s, 90s, 120s, 150s)
- **Volumen**: Cálculo automático del volumen total por sesión

## Estructura

```
src/
├── components/
│   ├── layout/      # Sidebar, BottomNav
│   └── workout/     # RestTimer
├── context/         # AuthContext
├── lib/             # Supabase client, utils
├── pages/           # Vistas principales
└── App.jsx
```

## Base de Datos

Ver `supabase/schema.sql` para el esquema completo con RLS.

Tablas:

- `categories` - Grupos musculares
- `exercises` - Ejercicios por categoría
- `routines` - Rutinas de entrenamiento
- `routine_exercises` - Ejercicios en cada rutina
- `sessions` - Sesiones completadas
- `set_logs` - Series registradas

## Licencia

MIT
