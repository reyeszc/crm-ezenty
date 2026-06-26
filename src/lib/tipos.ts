// Tipos compartidos que no dependen del cliente generado de Prisma
export type Rol = "ADMIN" | "VENDEDOR" | "SOLO_LECTURA";
export type EstadoCartera = "ACTIVO" | "GANADO" | "PERDIDO" | "ARCHIVADO";
export type Temperatura = "CALIENTE" | "TIBIO" | "FRIO";
export type Etapa =
  | "PROSPECTO" | "PRIMER_CONTACTO" | "DECISOR_IDENTIFICADO"
  | "MEDIDAS_TOMADAS" | "PROPUESTA_ENVIADA" | "NEGOCIACION"
  | "CONTRATO_ENVIADO" | "CERRADO_GANADO" | "CERRADO_PERDIDO";
export type MetodoPago = "TRANSFERENCIA" | "MESES_SIN_INTERESES" | "DEPOSITO_ANTICIPO";
export type EstatusPago = "PENDIENTE" | "PAGADO" | "VENCIDO";
export type TipoNota = "NOTA" | "LLAMADA" | "WHATSAPP" | "CORREO" | "CITA" | "PAGO" | "CAMBIO_ETAPA" | "CAMBIO_ESTADO" | "OBJECION" | "ARCHIVO" | "REASIGNACION";
