# NOTAS DEL PROYECTO — CRM Ezenty ProCare

## Stack tecnológico
- **Framework:** Next.js 15 (App Router) + TypeScript
- **ORM:** Drizzle ORM (sin binaries, funciona en Vercel)
- **Base de datos:** PostgreSQL (Neon, plan gratuito)
- **Auth:** NextAuth v5 (JWT) + bcryptjs (costo 12)
- **UI:** Tailwind CSS v4 + Lucide React + Framer Motion + dnd-kit
- **Gráficas:** Recharts
- **Validación:** Zod

## Por qué Drizzle y no Prisma
Prisma requiere descargar un binary nativo al correr `prisma generate`.
En este entorno de construcción el CDN de Prisma está bloqueado.
Drizzle ORM es 100% TypeScript, no necesita binaries y funciona igual en local y Vercel.

## Credenciales del seed
- **Admin:** admin@ezenty.com / Admin2024!
- **Vendedora:** maria@ezenty.com / Vendedor2024!

## Cómo correr local
```bash
# 1. Instalar dependencias
npm install

# 2. Copiar variables de entorno
cp .env.example .env
# Editar .env con tu DATABASE_URL de Neon

# 3. Crear tablas en la base de datos
# Opción A: Pegar el contenido de src/db/setup.sql en el SQL Editor de Neon
# Opción B: psql $DATABASE_URL -f src/db/setup.sql

# 4. Sembrar datos de ejemplo
npm run db:seed

# 5. Correr en desarrollo
npm run dev
```

## Respaldo manual de la base de datos (Neon)
```bash
# Desde Neon dashboard: Database → Backup → Create backup
# O usando pg_dump:
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

## Publicar en Vercel (paso a paso)
1. Subir código a GitHub
2. Crear cuenta en Vercel (vercel.com/signup)
3. Importar repositorio
4. En Vercel → Storage → Create Database → Postgres (Neon, plan Free)
5. Copiar DATABASE_URL y agregar variables de entorno:
   - DATABASE_URL (obligatoria)
   - AUTH_SECRET (obligatoria — texto aleatorio largo)
   - ANTHROPIC_API_KEY (opcional — para IA real)
6. Deploy
7. Abrir SQL Editor en Neon → pegar src/db/setup.sql → Run
8. Correr seed: en Vercel → Functions → terminal → `npm run db:seed`

## Cambios realizados (bitácora)
- [Build] Migrado de Prisma a Drizzle ORM (Prisma binary bloqueado en entorno de construcción)
- [Build] Cambiados enums de Prisma por tipos string en schema
- [Build] Tailwind v4 — reescrito globals.css sin @apply para clases complejas
- [Build] Removida dependencia de Google Fonts (bloqueada) — usa system-ui
- [Security] Rate limiting en login: 5 intentos → bloqueo 15 min
- [Security] Todos los secretos en variables de entorno, nunca en código
- [Security] Export nunca incluye passwordHash
- [AI] Degradación elegante: sin ANTHROPIC_API_KEY → plantillas locales inteligentes
