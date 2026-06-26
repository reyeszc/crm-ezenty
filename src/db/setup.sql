-- Setup script for Ezenty ProCare CRM
-- Run this once on your Neon/Postgres database

CREATE TABLE IF NOT EXISTS usuarios (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  correo TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'VENDEDOR',
  activo BOOLEAN NOT NULL DEFAULT true,
  foto TEXT,
  meta_mensual REAL NOT NULL DEFAULT 0,
  comision REAL,
  tema TEXT NOT NULL DEFAULT 'AUTOMATICO',
  vista_densa BOOLEAN NOT NULL DEFAULT false,
  onboarding_completado BOOLEAN NOT NULL DEFAULT false,
  intentos_fallidos INTEGER NOT NULL DEFAULT 0,
  bloqueado_hasta TIMESTAMP,
  creado_en TIMESTAMP NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_usuarios_correo ON usuarios(correo);

CREATE TABLE IF NOT EXISTS empresas (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  giro TEXT, sitio_web TEXT, rfc TEXT, direccion TEXT, empleados TEXT, notas TEXT,
  creado_en TIMESTAMP NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_empresas_nombre ON empresas(nombre);

CREATE TABLE IF NOT EXISTS clientes (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  telefono TEXT, correo TEXT, origen TEXT, utm_canal TEXT,
  etapa TEXT NOT NULL DEFAULT 'PROSPECTO',
  estado TEXT NOT NULL DEFAULT 'ACTIVO',
  temperatura TEXT NOT NULL DEFAULT 'TIBIO',
  objecion TEXT, notas TEXT,
  valor_estimado REAL,
  proxima_accion TEXT, proxima_accion_fecha TIMESTAMP, ultimo_contacto TIMESTAMP,
  motivo_perdida TEXT, titulo TEXT, propiedad TEXT, management TEXT, zona TEXT, puesto TEXT,
  ganado BOOLEAN NOT NULL DEFAULT false,
  perdido BOOLEAN NOT NULL DEFAULT false,
  archivado BOOLEAN NOT NULL DEFAULT false,
  eliminado_en TIMESTAMP,
  creado_en TIMESTAMP NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMP NOT NULL DEFAULT NOW(),
  duplicado_de_id TEXT,
  vendedor_id TEXT NOT NULL REFERENCES usuarios(id),
  empresa_id TEXT REFERENCES empresas(id)
);
CREATE INDEX IF NOT EXISTS idx_clientes_nombre ON clientes(nombre);
CREATE INDEX IF NOT EXISTS idx_clientes_telefono ON clientes(telefono);
CREATE INDEX IF NOT EXISTS idx_clientes_correo ON clientes(correo);
CREATE INDEX IF NOT EXISTS idx_clientes_etapa ON clientes(etapa);
CREATE INDEX IF NOT EXISTS idx_clientes_estado ON clientes(estado);
CREATE INDEX IF NOT EXISTS idx_clientes_vendedor ON clientes(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_clientes_eliminado ON clientes(eliminado_en);
CREATE INDEX IF NOT EXISTS idx_clientes_temp ON clientes(temperatura);

CREATE TABLE IF NOT EXISTS notas (
  id TEXT PRIMARY KEY,
  contenido TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'NOTA',
  fecha TIMESTAMP NOT NULL DEFAULT NOW(),
  eliminado_en TIMESTAMP,
  creado_en TIMESTAMP NOT NULL DEFAULT NOW(),
  cliente_id TEXT NOT NULL REFERENCES clientes(id),
  autor_id TEXT NOT NULL REFERENCES usuarios(id)
);
CREATE INDEX IF NOT EXISTS idx_notas_cliente ON notas(cliente_id);

CREATE TABLE IF NOT EXISTS citas (
  id TEXT PRIMARY KEY,
  titulo TEXT NOT NULL, inicio TIMESTAMP NOT NULL, fin TIMESTAMP NOT NULL,
  google_event_id TEXT, google_meet_url TEXT,
  estado TEXT NOT NULL DEFAULT 'PENDIENTE', notas TEXT, eliminado_en TIMESTAMP,
  creado_en TIMESTAMP NOT NULL DEFAULT NOW(), actualizado_en TIMESTAMP NOT NULL DEFAULT NOW(),
  cliente_id TEXT REFERENCES clientes(id),
  vendedor_id TEXT NOT NULL REFERENCES usuarios(id),
  creado_por_id TEXT REFERENCES usuarios(id)
);
CREATE INDEX IF NOT EXISTS idx_citas_inicio ON citas(inicio);
CREATE INDEX IF NOT EXISTS idx_citas_vendedor ON citas(vendedor_id);

CREATE TABLE IF NOT EXISTS pagos (
  id TEXT PRIMARY KEY,
  monto REAL NOT NULL, metodo TEXT NOT NULL,
  estatus TEXT NOT NULL DEFAULT 'PENDIENTE', concepto TEXT, folio TEXT,
  fecha_pago TIMESTAMP, fecha_vencimiento TIMESTAMP, eliminado_en TIMESTAMP,
  creado_en TIMESTAMP NOT NULL DEFAULT NOW(), actualizado_en TIMESTAMP NOT NULL DEFAULT NOW(),
  cliente_id TEXT NOT NULL REFERENCES clientes(id),
  vendedor_id TEXT NOT NULL REFERENCES usuarios(id)
);
CREATE INDEX IF NOT EXISTS idx_pagos_cliente ON pagos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pagos_estatus ON pagos(estatus);
CREATE INDEX IF NOT EXISTS idx_pagos_vendedor ON pagos(vendedor_id);

CREATE TABLE IF NOT EXISTS archivos (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL, etiqueta TEXT NOT NULL DEFAULT 'OTRO',
  tipo TEXT NOT NULL, tamano INTEGER NOT NULL,
  url TEXT, eliminado_en TIMESTAMP, creado_en TIMESTAMP NOT NULL DEFAULT NOW(),
  cliente_id TEXT NOT NULL REFERENCES clientes(id),
  subido_por_id TEXT NOT NULL REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS tareas (
  id TEXT PRIMARY KEY,
  descripcion TEXT NOT NULL, fecha_vence TIMESTAMP NOT NULL,
  completada BOOLEAN NOT NULL DEFAULT false, creado_en TIMESTAMP NOT NULL DEFAULT NOW(),
  cliente_id TEXT NOT NULL REFERENCES clientes(id),
  asignado_a_id TEXT NOT NULL REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS recordatorios (
  id TEXT PRIMARY KEY,
  texto TEXT NOT NULL, fecha TIMESTAMP NOT NULL, hora TEXT,
  completado BOOLEAN NOT NULL DEFAULT false, pospuesto BOOLEAN NOT NULL DEFAULT false,
  creado_en TIMESTAMP NOT NULL DEFAULT NOW(),
  cliente_id TEXT REFERENCES clientes(id),
  usuario_id TEXT NOT NULL REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS etiquetas (
  id TEXT PRIMARY KEY, nombre TEXT NOT NULL UNIQUE, color TEXT NOT NULL DEFAULT '#7cc2e8'
);

CREATE TABLE IF NOT EXISTS cliente_etiquetas (
  cliente_id TEXT NOT NULL REFERENCES clientes(id),
  etiqueta_id TEXT NOT NULL REFERENCES etiquetas(id),
  PRIMARY KEY (cliente_id, etiqueta_id)
);

CREATE TABLE IF NOT EXISTS plantillas (
  id TEXT PRIMARY KEY, nombre TEXT NOT NULL, tipo TEXT NOT NULL,
  etapa TEXT, objecion TEXT, asunto TEXT, cuerpo TEXT NOT NULL,
  favorita BOOLEAN NOT NULL DEFAULT false, es_global BOOLEAN NOT NULL DEFAULT true,
  creado_en TIMESTAMP NOT NULL DEFAULT NOW(),
  autor_id TEXT REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS favoritos (
  usuario_id TEXT NOT NULL REFERENCES usuarios(id),
  cliente_id TEXT NOT NULL REFERENCES clientes(id),
  PRIMARY KEY (usuario_id, cliente_id)
);

CREATE TABLE IF NOT EXISTS vistas_guardadas (
  id TEXT PRIMARY KEY, nombre TEXT NOT NULL, filtros TEXT NOT NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT NOW(),
  usuario_id TEXT NOT NULL REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS config_negocio (
  id TEXT PRIMARY KEY DEFAULT 'singleton',
  nombre_negocio TEXT NOT NULL DEFAULT 'Ezenty ProCare',
  logo_url TEXT, color_marca TEXT NOT NULL DEFAULT '#7cc2e8',
  moneda TEXT NOT NULL DEFAULT 'USD', huso_horario TEXT NOT NULL DEFAULT 'America/New_York',
  horario_inicio TEXT NOT NULL DEFAULT '09:00', horario_fin TEXT NOT NULL DEFAULT '18:00',
  duracion_cita INTEGER NOT NULL DEFAULT 45,
  mensaje_whatsapp TEXT NOT NULL DEFAULT 'Hi {nombre}, thanks for your interest!',
  meta_mensual REAL NOT NULL DEFAULT 10000, umbral_estancado INTEGER NOT NULL DEFAULT 7,
  comision_global REAL,
  motivos_perdida TEXT NOT NULL DEFAULT '["Price","Has another provider","Needs to think about it","Not qualified","Other"]',
  whatsapp_negocio TEXT NOT NULL DEFAULT '14075551234',
  actualizado_en TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS registro_auditoria (
  id TEXT PRIMARY KEY, accion TEXT NOT NULL, entidad TEXT NOT NULL,
  entidad_id TEXT, detalle TEXT, ip TEXT, creado_en TIMESTAMP NOT NULL DEFAULT NOW(),
  usuario_id TEXT NOT NULL REFERENCES usuarios(id)
);
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario ON registro_auditoria(usuario_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_fecha ON registro_auditoria(creado_en);

-- ─── NUEVAS TABLAS v2 ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS contactos (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  cargo TEXT,
  telefono TEXT,
  correo TEXT,
  notas TEXT,
  principal BOOLEAN NOT NULL DEFAULT false,
  creado_en TIMESTAMP NOT NULL DEFAULT NOW(),
  cliente_id TEXT NOT NULL REFERENCES clientes(id)
);
CREATE INDEX IF NOT EXISTS idx_contactos_cliente ON contactos(cliente_id);

CREATE TABLE IF NOT EXISTS dias_visitados (
  id TEXT PRIMARY KEY,
  fecha TIMESTAMP NOT NULL,
  notas TEXT,
  resultado TEXT,
  creado_en TIMESTAMP NOT NULL DEFAULT NOW(),
  cliente_id TEXT NOT NULL REFERENCES clientes(id),
  usuario_id TEXT NOT NULL REFERENCES usuarios(id)
);
CREATE INDEX IF NOT EXISTS idx_dias_cliente ON dias_visitados(cliente_id);

CREATE TABLE IF NOT EXISTS demos (
  id TEXT PRIMARY KEY,
  fecha TIMESTAMP NOT NULL,
  duracion INTEGER DEFAULT 60,
  estado TEXT NOT NULL DEFAULT 'PROGRAMADA',
  notas TEXT,
  servicios_ofrecidos TEXT,
  creado_en TIMESTAMP NOT NULL DEFAULT NOW(),
  cliente_id TEXT NOT NULL REFERENCES clientes(id),
  usuario_id TEXT NOT NULL REFERENCES usuarios(id)
);
CREATE INDEX IF NOT EXISTS idx_demos_fecha ON demos(fecha);
CREATE INDEX IF NOT EXISTS idx_demos_cliente ON demos(cliente_id);

CREATE TABLE IF NOT EXISTS servicios (
  id TEXT PRIMARY KEY,
  fecha TIMESTAMP NOT NULL,
  tipo TEXT NOT NULL,
  areas TEXT,
  sq_ft_total REAL,
  notas TEXT,
  monto REAL,
  tecnico TEXT,
  estado TEXT NOT NULL DEFAULT 'COMPLETADO',
  creado_en TIMESTAMP NOT NULL DEFAULT NOW(),
  cliente_id TEXT NOT NULL REFERENCES clientes(id),
  usuario_id TEXT NOT NULL REFERENCES usuarios(id)
);
CREATE INDEX IF NOT EXISTS idx_servicios_fecha ON servicios(fecha);
CREATE INDEX IF NOT EXISTS idx_servicios_cliente ON servicios(cliente_id);

CREATE TABLE IF NOT EXISTS medidas_propiedad (
  id TEXT PRIMARY KEY,
  fecha TIMESTAMP NOT NULL DEFAULT NOW(),
  notas TEXT,
  sq_ft_total REAL DEFAULT 0,
  creado_en TIMESTAMP NOT NULL DEFAULT NOW(),
  cliente_id TEXT NOT NULL REFERENCES clientes(id),
  usuario_id TEXT NOT NULL REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS medidas_areas (
  id TEXT PRIMARY KEY,
  area TEXT NOT NULL,
  orden INTEGER NOT NULL DEFAULT 0,
  subtotal_sq_ft REAL DEFAULT 0,
  creado_en TIMESTAMP NOT NULL DEFAULT NOW(),
  medida_id TEXT NOT NULL REFERENCES medidas_propiedad(id)
);

CREATE TABLE IF NOT EXISTS medidas_lineas (
  id TEXT PRIMARY KEY,
  descripcion TEXT,
  ancho REAL NOT NULL,
  largo REAL NOT NULL,
  sq_ft REAL NOT NULL,
  orden INTEGER NOT NULL DEFAULT 0,
  area_id TEXT NOT NULL REFERENCES medidas_areas(id)
);

-- Nuevos campos en clientes
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS ciudad_cluster TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS cantidad_habitaciones INTEGER;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS direccion_propiedad TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS tipo_propiedad TEXT DEFAULT 'Hotel';
