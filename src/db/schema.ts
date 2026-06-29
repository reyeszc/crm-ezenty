import { pgTable, text, boolean, real, timestamp, integer, primaryKey } from "drizzle-orm/pg-core";

export const usuarios = pgTable("usuarios", {
  id: text("id").primaryKey(),
  nombre: text("nombre").notNull(),
  correo: text("correo").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  rol: text("rol").notNull().default("VENDEDOR"),
  activo: boolean("activo").notNull().default(true),
  foto: text("foto"),
  metaMensual: real("meta_mensual").notNull().default(0),
  comision: real("comision"),
  tema: text("tema").notNull().default("AUTOMATICO"),
  vistaDensa: boolean("vista_densa").notNull().default(false),
  onboardingCompletado: boolean("onboarding_completado").notNull().default(false),
  avatarUrl: text("avatar_url"),
  titulo: text("titulo"),
  intentosFallidos: integer("intentos_fallidos").notNull().default(0),
  bloqueadoHasta: timestamp("bloqueado_hasta"),
  creadoEn: timestamp("creado_en").notNull().defaultNow(),
  actualizadoEn: timestamp("actualizado_en").notNull().defaultNow(),
});

export const empresas = pgTable("empresas", {
  id: text("id").primaryKey(),
  nombre: text("nombre").notNull(),
  giro: text("giro"),
  sitioWeb: text("sitio_web"),
  rfc: text("rfc"),
  direccion: text("direccion"),
  empleados: text("empleados"),
  notas: text("notas"),
  creadoEn: timestamp("creado_en").notNull().defaultNow(),
  actualizadoEn: timestamp("actualizado_en").notNull().defaultNow(),
});

export const clientes = pgTable("clientes", {
  id: text("id").primaryKey(),
  nombre: text("nombre").notNull(),
  telefono: text("telefono"),
  correo: text("correo"),
  origen: text("origen"),
  utmCanal: text("utm_canal"),
  etapa: text("etapa").notNull().default("PROSPECTO"),
  estado: text("estado").notNull().default("ACTIVO"),
  temperatura: text("temperatura").notNull().default("TIBIO"),
  objecion: text("objecion"),
  notas: text("notas"),
  valorEstimado: real("valor_estimado"),
  proximaAccion: text("proxima_accion"),
  proximaAccionFecha: timestamp("proxima_accion_fecha"),
  ultimoContacto: timestamp("ultimo_contacto"),
  motivoPerdida: text("motivo_perdida"),
  titulo: text("titulo"),
  propiedad: text("propiedad"),
  management: text("management"),
  ciudadCluster: text("ciudad_cluster"),
  cantidadHabitaciones: integer("cantidad_habitaciones"),
  direccionPropiedad: text("direccion_propiedad"),
  tipoPropiedad: text("tipo_propiedad"),
  zona: text("zona"),
  puesto: text("puesto"),
  ganado: boolean("ganado").notNull().default(false),
  perdido: boolean("perdido").notNull().default(false),
  archivado: boolean("archivado").notNull().default(false),
  eliminadoEn: timestamp("eliminado_en"),
  creadoEn: timestamp("creado_en").notNull().defaultNow(),
  actualizadoEn: timestamp("actualizado_en").notNull().defaultNow(),
  duplicadoDeId: text("duplicado_de_id"),
  vendedorId: text("vendedor_id").notNull().references(() => usuarios.id),
  empresaId: text("empresa_id").references(() => empresas.id),
});

export const notas = pgTable("notas", {
  id: text("id").primaryKey(),
  contenido: text("contenido").notNull(),
  tipo: text("tipo").notNull().default("NOTA"),
  fecha: timestamp("fecha").notNull().defaultNow(),
  eliminadoEn: timestamp("eliminado_en"),
  creadoEn: timestamp("creado_en").notNull().defaultNow(),
  clienteId: text("cliente_id").notNull().references(() => clientes.id),
  autorId: text("autor_id").notNull().references(() => usuarios.id),
});

export const citas = pgTable("citas", {
  id: text("id").primaryKey(),
  titulo: text("titulo").notNull(),
  inicio: timestamp("inicio").notNull(),
  fin: timestamp("fin").notNull(),
  googleEventId: text("google_event_id"),
  googleMeetUrl: text("google_meet_url"),
  estado: text("estado").notNull().default("PENDIENTE"),
  notas: text("notas"),
  eliminadoEn: timestamp("eliminado_en"),
  creadoEn: timestamp("creado_en").notNull().defaultNow(),
  actualizadoEn: timestamp("actualizado_en").notNull().defaultNow(),
  clienteId: text("cliente_id").references(() => clientes.id),
  vendedorId: text("vendedor_id").notNull().references(() => usuarios.id),
  creadoPorId: text("creado_por_id").references(() => usuarios.id),
});

export const pagos = pgTable("pagos", {
  id: text("id").primaryKey(),
  monto: real("monto").notNull(),
  metodo: text("metodo").notNull(),
  estatus: text("estatus").notNull().default("PENDIENTE"),
  concepto: text("concepto"),
  folio: text("folio"),
  fechaPago: timestamp("fecha_pago"),
  fechaVencimiento: timestamp("fecha_vencimiento"),
  eliminadoEn: timestamp("eliminado_en"),
  creadoEn: timestamp("creado_en").notNull().defaultNow(),
  actualizadoEn: timestamp("actualizado_en").notNull().defaultNow(),
  clienteId: text("cliente_id").notNull().references(() => clientes.id),
  vendedorId: text("vendedor_id").notNull().references(() => usuarios.id),
});

export const archivos = pgTable("archivos", {
  id: text("id").primaryKey(),
  nombre: text("nombre").notNull(),
  etiqueta: text("etiqueta").notNull().default("OTRO"),
  tipo: text("tipo").notNull(),
  tamano: integer("tamano").notNull(),
  // datos stored externally or as base64 url
  url: text("url"),
  eliminadoEn: timestamp("eliminado_en"),
  creadoEn: timestamp("creado_en").notNull().defaultNow(),
  clienteId: text("cliente_id").notNull().references(() => clientes.id),
  subidoPorId: text("subido_por_id").notNull().references(() => usuarios.id),
});

export const tareas = pgTable("tareas", {
  id: text("id").primaryKey(),
  descripcion: text("descripcion").notNull(),
  fechaVence: timestamp("fecha_vence").notNull(),
  completada: boolean("completada").notNull().default(false),
  creadoEn: timestamp("creado_en").notNull().defaultNow(),
  clienteId: text("cliente_id").notNull().references(() => clientes.id),
  asignadoAId: text("asignado_a_id").notNull().references(() => usuarios.id),
});

export const recordatorios = pgTable("recordatorios", {
  id: text("id").primaryKey(),
  texto: text("texto").notNull(),
  fecha: timestamp("fecha").notNull(),
  hora: text("hora"),
  completado: boolean("completado").notNull().default(false),
  pospuesto: boolean("pospuesto").notNull().default(false),
  creadoEn: timestamp("creado_en").notNull().defaultNow(),
  clienteId: text("cliente_id").references(() => clientes.id),
  usuarioId: text("usuario_id").notNull().references(() => usuarios.id),
});

export const etiquetas = pgTable("etiquetas", {
  id: text("id").primaryKey(),
  nombre: text("nombre").notNull().unique(),
  color: text("color").notNull().default("#7cc2e8"),
});

export const clienteEtiquetas = pgTable("cliente_etiquetas", {
  clienteId: text("cliente_id").notNull().references(() => clientes.id),
  etiquetaId: text("etiqueta_id").notNull().references(() => etiquetas.id),
}, (t) => ({ pk: primaryKey({ columns: [t.clienteId, t.etiquetaId] }) }));

export const plantillas = pgTable("plantillas", {
  id: text("id").primaryKey(),
  nombre: text("nombre").notNull(),
  tipo: text("tipo").notNull(),
  etapa: text("etapa"),
  objecion: text("objecion"),
  asunto: text("asunto"),
  cuerpo: text("cuerpo").notNull(),
  favorita: boolean("favorita").notNull().default(false),
  esGlobal: boolean("es_global").notNull().default(true),
  creadoEn: timestamp("creado_en").notNull().defaultNow(),
  autorId: text("autor_id").references(() => usuarios.id),
});

export const favoritos = pgTable("favoritos", {
  usuarioId: text("usuario_id").notNull().references(() => usuarios.id),
  clienteId: text("cliente_id").notNull().references(() => clientes.id),
}, (t) => ({ pk: primaryKey({ columns: [t.usuarioId, t.clienteId] }) }));

export const vistasGuardadas = pgTable("vistas_guardadas", {
  id: text("id").primaryKey(),
  nombre: text("nombre").notNull(),
  filtros: text("filtros").notNull(),
  creadoEn: timestamp("creado_en").notNull().defaultNow(),
  usuarioId: text("usuario_id").notNull().references(() => usuarios.id),
});

export const configNegocio = pgTable("config_negocio", {
  id: text("id").primaryKey().default("singleton"),
  nombreNegocio: text("nombre_negocio").notNull().default("Ezenty ProCare"),
  logoUrl: text("logo_url"),
  colorMarca: text("color_marca").notNull().default("#7cc2e8"),
  moneda: text("moneda").notNull().default("USD"),
  husoHorario: text("huso_horario").notNull().default("America/New_York"),
  horarioInicio: text("horario_inicio").notNull().default("09:00"),
  horarioFin: text("horario_fin").notNull().default("18:00"),
  duracionCita: integer("duracion_cita").notNull().default(45),
  mensajeWhatsapp: text("mensaje_whatsapp").notNull().default("Hi {nombre}, thanks for your interest!"),
  metaMensual: real("meta_mensual").notNull().default(10000),
  umbralEstancado: integer("umbral_estancado").notNull().default(7),
  comisionGlobal: real("comision_global"),
  motivosPerdida: text("motivos_perdida").notNull().default('["Price","Has another provider","Needs to think about it","Not qualified","Other"]'),
  whatsappNegocio: text("whatsapp_negocio").notNull().default("14075551234"),
  actualizadoEn: timestamp("actualizado_en").notNull().defaultNow(),
});

export const registroAuditoria = pgTable("registro_auditoria", {
  id: text("id").primaryKey(),
  accion: text("accion").notNull(),
  entidad: text("entidad").notNull(),
  entidadId: text("entidad_id"),
  detalle: text("detalle"),
  ip: text("ip"),
  creadoEn: timestamp("creado_en").notNull().defaultNow(),
  usuarioId: text("usuario_id").notNull().references(() => usuarios.id),
});

// ─── CONTACTOS POR PROPIEDAD ──────────────────────────────────────────────
export const contactos = pgTable("contactos", {
  id: text("id").primaryKey(),
  nombre: text("nombre").notNull(),
  cargo: text("cargo"),
  telefono: text("telefono"),
  correo: text("correo"),
  notas: text("notas"),
  principal: boolean("principal").notNull().default(false),
  creadoEn: timestamp("creado_en").notNull().defaultNow(),
  clienteId: text("cliente_id").notNull().references(() => clientes.id),
});

// ─── DÍAS VISITADOS ───────────────────────────────────────────────────────
export const diasVisitados = pgTable("dias_visitados", {
  id: text("id").primaryKey(),
  fecha: timestamp("fecha").notNull(),
  notas: text("notas"),
  resultado: text("resultado"), // Positivo, Neutro, Sin acceso
  creadoEn: timestamp("creado_en").notNull().defaultNow(),
  clienteId: text("cliente_id").notNull().references(() => clientes.id),
  usuarioId: text("usuario_id").notNull().references(() => usuarios.id),
});

// ─── DEMOS PROGRAMADAS ────────────────────────────────────────────────────
export const demos = pgTable("demos", {
  id: text("id").primaryKey(),
  fecha: timestamp("fecha").notNull(),
  duracion: integer("duracion").default(60), // minutos
  estado: text("estado").notNull().default("PROGRAMADA"), // PROGRAMADA, COMPLETADA, CANCELADA
  notas: text("notas"),
  serviciosOfrecidos: text("servicios_ofrecidos"), // JSON array
  creadoEn: timestamp("creado_en").notNull().defaultNow(),
  clienteId: text("cliente_id").notNull().references(() => clientes.id),
  usuarioId: text("usuario_id").notNull().references(() => usuarios.id),
});

// ─── SERVICIOS REALIZADOS ─────────────────────────────────────────────────
export const servicios = pgTable("servicios", {
  id: text("id").primaryKey(),
  fecha: timestamp("fecha").notNull(),
  tipo: text("tipo").notNull(), // Carpet, Tile & Grout, Upholstery, Odor Control
  areas: text("areas"), // JSON - areas cleaned
  sqFtTotal: real("sq_ft_total"),
  notas: text("notas"),
  monto: real("monto"),
  tecnico: text("tecnico"),
  estado: text("estado").notNull().default("COMPLETADO"),
  creadoEn: timestamp("creado_en").notNull().defaultNow(),
  clienteId: text("cliente_id").notNull().references(() => clientes.id),
  usuarioId: text("usuario_id").notNull().references(() => usuarios.id),
});

// ─── MEDIDAS POR PROPIEDAD ────────────────────────────────────────────────
export const medidasPropiedad = pgTable("medidas_propiedad", {
  id: text("id").primaryKey(),
  fecha: timestamp("fecha").notNull().defaultNow(),
  notas: text("notas"),
  sqFtTotal: real("sq_ft_total").default(0),
  flatFeeTotal: real("flat_fee_total").default(0),
  creadoEn: timestamp("creado_en").notNull().defaultNow(),
  clienteId: text("cliente_id").notNull().references(() => clientes.id),
  usuarioId: text("usuario_id").notNull().references(() => usuarios.id),
});

export const medidasAreas = pgTable("medidas_areas", {
  id: text("id").primaryKey(),
  area: text("area").notNull(), // Lobby, Corridor Floor 1, etc.
  orden: integer("orden").notNull().default(0),
  subtotalSqFt: real("subtotal_sq_ft").default(0),
  creadoEn: timestamp("creado_en").notNull().defaultNow(),
  medidaId: text("medida_id").notNull().references(() => medidasPropiedad.id),
});

export const medidasLineas = pgTable("medidas_lineas", {
  id: text("id").primaryKey(),
  descripcion: text("descripcion"),
  ancho: real("ancho").notNull(),
  largo: real("largo").notNull(),
  sqFt: real("sq_ft").notNull(),
  orden: integer("orden").notNull().default(0),
  areaId: text("area_id").notNull().references(() => medidasAreas.id),
});

// ─── COTIZACIONES ─────────────────────────────────────────────────────────────
export const cotizaciones = pgTable("cotizaciones", {
  id: text("id").primaryKey(),
  numero: text("numero").notNull(), // EZPC-Q-XXXXX
  estado: text("estado").notNull().default("BORRADOR"), // BORRADOR, ENVIADA, APROBADA, RECHAZADA
  validezDias: integer("validez_dias").default(30),
  notas: text("notas"),
  subtotal: real("subtotal").default(0),
  descuento: real("descuento").default(0),
  total: real("total").default(0),
  medidaId: text("medida_id").references(() => medidasPropiedad.id),
  clienteId: text("cliente_id").notNull().references(() => clientes.id),
  vendedorId: text("vendedor_id").notNull().references(() => usuarios.id),
  creadoEn: timestamp("creado_en").notNull().defaultNow(),
  actualizadoEn: timestamp("actualizado_en").notNull().defaultNow(),
  eliminadoEn: timestamp("eliminado_en"),
});

export const cotizacionLineas = pgTable("cotizacion_lineas", {
  id: text("id").primaryKey(),
  descripcion: text("descripcion").notNull(),
  tipo: text("tipo").notNull(), // Carpet, Tile, LVT, etc.
  unidad: text("unidad").notNull().default("sqft"), // sqft, flat_fee, pieza
  cantidad: real("cantidad").default(0),
  precioUnitario: real("precio_unitario").notNull(),
  precioFinal: real("precio_final").notNull(), // editable override
  subtotal: real("subtotal").notNull().default(0),
  area: text("area"), // nombre del área de donde vino
  orden: integer("orden").default(0),
  cotizacionId: text("cotizacion_id").notNull().references(() => cotizaciones.id),
});
