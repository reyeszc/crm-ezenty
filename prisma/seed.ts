import { Pool } from "pg";
import bcrypt from "bcryptjs";

const db = new Pool({ connectionString: process.env.DATABASE_URL });

function cuid(): string {
  return "c" + Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
}
function hace(dias: number): Date { return new Date(Date.now() - dias * 86400000); }
function enDias(dias: number): Date { return new Date(Date.now() + dias * 86400000); }

async function q(sql: string, params: any[] = []) {
  return db.query(sql, params);
}

async function main() {
  const { rows: existing } = await q("SELECT COUNT(*) as cnt FROM usuarios");
  if (Number(existing[0].cnt) > 0) {
    console.log("✓ Base ya tiene datos — no se siembra.");
    return;
  }

  console.log("🌱 Sembrando datos de ejemplo para Ezenty ProCare...");

  // Config
  await q(`INSERT INTO config_negocio (id, nombre_negocio, meta_mensual, whatsapp_negocio, actualizado_en) VALUES ('singleton', 'Ezenty ProCare', 10000, '14075551234', NOW()) ON CONFLICT (id) DO NOTHING`);

  // Users
  const adminHash = await bcrypt.hash("Admin2024!", 12);
  const vendedorHash = await bcrypt.hash("Vendedor2024!", 12);
  const adminId = cuid(), v1Id = cuid();

  await q(`INSERT INTO usuarios (id, nombre, correo, password_hash, rol, meta_mensual, actualizado_en) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
    [adminId, "Zugheily (Admin)", "admin@ezenty.com", adminHash, "ADMIN", 10000]);
  await q(`INSERT INTO usuarios (id, nombre, correo, password_hash, rol, meta_mensual, actualizado_en) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
    [v1Id, "Maria Rodriguez", "maria@ezenty.com", vendedorHash, "VENDEDOR", 5000]);

  // Etiquetas
  const etVIP = cuid(), etRef = cuid(), etAnti = cuid();
  await q(`INSERT INTO etiquetas (id, nombre, color) VALUES ($1,'VIP','#f59e0b'),($2,'Referido','#10b981'),($3,'Anticipo','#7cc2e8')`, [etVIP, etRef, etAnti]);

  // Empresas
  const eMarriott = cuid(), eHyatt = cuid(), eHilton = cuid();
  await q(`INSERT INTO empresas (id, nombre, giro, empleados, actualizado_en) VALUES ($1,'Marriott Bonvoy Atlanta','Hotel / Hospitality','150-200',NOW())`, [eMarriott]);
  await q(`INSERT INTO empresas (id, nombre, giro, empleados, actualizado_en) VALUES ($1,'Hyatt Place North Point','Hotel / Hospitality','80-120',NOW())`, [eHyatt]);
  await q(`INSERT INTO empresas (id, nombre, giro, empleados, actualizado_en) VALUES ($1,'Hilton Garden Inn Nashville','Hotel / Hospitality','100-150',NOW())`, [eHilton]);

  // Clientes
  const clients = [
    { id: cuid(), nombre: "James Wilson", tel: "14045550101", correo: "j.wilson@marriottatlanta.com", origen: "Referido", etapa: "CERRADO_GANADO", estado: "GANADO", temp: "CALIENTE", ob: "Needs to consult with management", valor: 3500, prox: "Send renewal proposal in 6 months", proxFecha: enDias(60), ult: hace(5), ganado: true, puesto: "General Manager", prop: "Marriott Bonvoy Atlanta Airport", zona: "Atlanta, GA", vendedor: adminId, empresa: eMarriott },
    { id: cuid(), nombre: "Sarah Johnson", tel: "14045550202", correo: "s.johnson@hyattplace.com", origen: "Landing", etapa: "NEGOCIACION", estado: "ACTIVO", temp: "CALIENTE", ob: "Price", valor: 8500, prox: "Send revised proposal with payment plan", proxFecha: enDias(1), ult: hace(2), ganado: false, puesto: "Director of Operations", prop: "Hyatt Place Atlanta Alpharetta", zona: "Alpharetta, GA", vendedor: adminId, empresa: eHyatt },
    { id: cuid(), nombre: "Robert Martinez", tel: "16155550303", correo: "r.martinez@hiltontn.com", origen: "Instagram", etapa: "PROPUESTA_ENVIADA", estado: "ACTIVO", temp: "TIBIO", ob: "Needs to think about it", valor: 5200, prox: "Follow up on proposal", proxFecha: hace(2), ult: hace(7), ganado: false, puesto: "Facilities Manager", prop: "Hilton Garden Inn Nashville", zona: "Nashville, TN", vendedor: adminId, empresa: eHilton },
    { id: cuid(), nombre: "Linda Chen", tel: "14045550404", correo: "l.chen@marriottmidtown.com", origen: "Facebook", etapa: "DECISOR_IDENTIFICADO", estado: "ACTIVO", temp: "FRIO", ob: "Has another provider", valor: 4800, prox: "Re-engage with case study", proxFecha: hace(5), ult: hace(14), ganado: false, puesto: "Housekeeping Supervisor", prop: "Marriott Midtown Atlanta", zona: "Atlanta, GA", vendedor: adminId, empresa: null },
    { id: cuid(), nombre: "Michael Thompson", tel: "14045550505", correo: "m.thompson@ihg.com", origen: "Agenda Maria", etapa: "CONTRATO_ENVIADO", estado: "ACTIVO", temp: "CALIENTE", ob: "Needs to consult with management", valor: 6000, prox: "Call to confirm contract signature", proxFecha: enDias(1), ult: hace(1), ganado: false, puesto: "General Manager", prop: "Holiday Inn Express Midtown", zona: "Atlanta, GA", vendedor: v1Id, empresa: null },
    { id: cuid(), nombre: "Patricia Davis", tel: "16155550606", correo: "p.davis@grandsuites.com", origen: "Landing", etapa: "PROSPECTO", estado: "ACTIVO", temp: "TIBIO", ob: null, valor: 2500, prox: "Initial contact call", proxFecha: new Date(), ult: null, ganado: false, puesto: "Owner", prop: "The Grand Suites Nashville", zona: "Nashville, TN", vendedor: v1Id, empresa: null },
    { id: cuid(), nombre: "David Kim", tel: "14045550707", correo: "d.kim@courtyard.com", origen: "Referido", etapa: "MEDIDAS_TOMADAS", estado: "ACTIVO", temp: "CALIENTE", ob: "Price", valor: 3200, prox: "Send quote for tile & grout + carpet", proxFecha: enDias(2), ult: hace(3), ganado: false, puesto: "Operations Manager", prop: "Courtyard Marriott Downtown", zona: "Atlanta, GA", vendedor: adminId, empresa: null },
    { id: cuid(), nombre: "Jennifer Brown", tel: "14045550808", correo: "j.brown@wyndham.com", origen: "Instagram", etapa: "PRIMER_CONTACTO", estado: "ACTIVO", temp: "TIBIO", ob: "Needs to think about it", valor: 2800, prox: "Send introduction video + service menu", proxFecha: enDias(3), ult: hace(1), ganado: false, puesto: "Front Office Manager", prop: "Wyndham Garden Midtown", zona: "Atlanta, GA", vendedor: v1Id, empresa: null },
    { id: cuid(), nombre: "Carlos Reyes", tel: "14045550909", correo: "c.reyes@boutique.com", origen: "Facebook", etapa: "CERRADO_PERDIDO", estado: "PERDIDO", temp: "FRIO", ob: "Price", valor: 1800, prox: "Reactivate in 3 months", proxFecha: enDias(90), ult: hace(30), ganado: false, perdido: true, motivoPerdida: "Price", puesto: "Owner", prop: "Boutique Hotel Downtown", zona: "Atlanta, GA", vendedor: adminId, empresa: null },
    { id: cuid(), nombre: "Tom Wilson", tel: "16155551010", correo: "t.wilson@motel.com", origen: "Landing", etapa: "PROSPECTO", estado: "ARCHIVADO", temp: "FRIO", ob: null, valor: 1200, prox: null, proxFecha: null, ult: hace(60), ganado: false, archivado: true, puesto: "Manager", prop: "Budget Inn Nashville", zona: "Nashville, TN", vendedor: adminId, empresa: null },
  ] as any[];

  for (const c of clients) {
    await q(`INSERT INTO clientes (id,nombre,telefono,correo,origen,etapa,estado,temperatura,objecion,valor_estimado,proxima_accion,proxima_accion_fecha,ultimo_contacto,motivo_perdida,puesto,propiedad,zona,ganado,perdido,archivado,vendedor_id,empresa_id,actualizado_en) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,NOW())`,
      [c.id,c.nombre,c.tel,c.correo,c.origen,c.etapa,c.estado,c.temp,c.ob||null,c.valor,c.prox||null,c.proxFecha||null,c.ult||null,c.motivoPerdida||null,c.puesto||null,c.prop||null,c.zona||null,c.ganado||false,c.perdido||false,c.archivado||false,c.vendedor,c.empresa||null]);
  }

  // Etiquetas a clientes
  const cJames = clients[0].id, cSarah = clients[1].id, cDavid = clients[6].id, cMichael = clients[4].id;
  await q(`INSERT INTO cliente_etiquetas (cliente_id, etiqueta_id) VALUES ($1,$2),($3,$4),($5,$6),($7,$8)`,
    [cJames, etVIP, cSarah, etVIP, cDavid, etRef, cMichael, etAnti]);

  // Notas
  const notasData = [
    [cSarah, adminId, "Called Sarah — main concern is price. Sending revised proposal with monthly payment option.", "LLAMADA", hace(2)],
    [cSarah, adminId, "Sent proposal for tile & grout + carpet cleaning. 12-month maintenance plan at $8,500.", "CORREO", hace(5)],
    [clients[2].id, adminId, "Sent proposal via email. Robert said he would review with the GM.", "CORREO", hace(7)],
    [cJames, adminId, "Contract signed! Full carpet cleaning of 180 rooms + lobby tile & grout restoration.", "PAGO", hace(150)],
    [clients[3].id, adminId, "Linda mentioned they have a contract with another company expiring in 4 months.", "OBJECION", hace(14)],
  ];
  for (const [cid, aid, cont, tipo, fecha] of notasData) {
    await q(`INSERT INTO notas (id, cliente_id, autor_id, contenido, tipo, fecha) VALUES ($1,$2,$3,$4,$5,$6)`,
      [cuid(), cid, aid, cont, tipo, fecha]);
  }

  // Citas
  const manana = enDias(1);
  manana.setHours(10, 0, 0, 0);
  const hoy = new Date(); hoy.setHours(14, 0, 0, 0);
  const mananaFin = new Date(manana.getTime() + 45 * 60000);
  const hoyFin = new Date(hoy.getTime() + 45 * 60000);

  await q(`INSERT INTO citas (id,titulo,inicio,fin,cliente_id,vendedor_id,creado_por_id,estado,actualizado_en) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())`,
    [cuid(), "Site visit — Hyatt Place North Point", manana, mananaFin, cSarah, adminId, adminId, "CONFIRMADA"]);
  await q(`INSERT INTO citas (id,titulo,inicio,fin,cliente_id,vendedor_id,creado_por_id,estado,actualizado_en) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())`,
    [cuid(), "Discovery call — Patricia Davis", hoy, hoyFin, clients[5].id, v1Id, v1Id, "PENDIENTE"]);

  // Pagos históricos
  const pagosData = [
    [cJames, adminId, 1750, "DEPOSITO_ANTICIPO", "PAGADO", hace(155), "EP-001"],
    [cJames, adminId, 1750, "TRANSFERENCIA", "PAGADO", hace(148), "EP-002"],
    [cSarah, adminId, 2500, "DEPOSITO_ANTICIPO", "PAGADO", hace(10), "EP-005"],
    [clients[2].id, adminId, 1500, "TRANSFERENCIA", "VENCIDO", null, "EP-007"],
    [cMichael, v1Id, 1200, "MESES_SIN_INTERESES", "PAGADO", hace(15), "EP-008"],
    // Historical for chart
    [cJames, adminId, 2800, "TRANSFERENCIA", "PAGADO", hace(180), "EP-H01"],
    [cJames, adminId, 3200, "TRANSFERENCIA", "PAGADO", hace(150), "EP-H02"],
    [cJames, adminId, 1800, "TRANSFERENCIA", "PAGADO", hace(120), "EP-H03"],
    [cJames, adminId, 4100, "TRANSFERENCIA", "PAGADO", hace(90), "EP-H04"],
    [cJames, adminId, 2900, "TRANSFERENCIA", "PAGADO", hace(60), "EP-H05"],
    [cJames, adminId, 3500, "TRANSFERENCIA", "PAGADO", hace(30), "EP-H06"],
  ];
  for (const [cid, vid, monto, metodo, estatus, fechaPago, folio] of pagosData) {
    await q(`INSERT INTO pagos (id,cliente_id,vendedor_id,monto,metodo,estatus,folio,fecha_pago,actualizado_en) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())`,
      [cuid(), cid, vid, monto, metodo, estatus, folio, fechaPago]);
  }

  // Plantillas
  const plantillasData = [
    ["Seguimiento inicial (WhatsApp)", "whatsapp", "PRIMER_CONTACTO", null, null, "Hi {nombre}! 👋 This is {vendedor} from Ezenty ProCare. I wanted to follow up on your interest in our floor protection programs for {empresa}. Would you have 15 minutes this week for a quick call? 🏨"],
    ["Vencer objeción — precio", "whatsapp", null, "Price", null, "Hi {nombre}, I understand the budget concerns. We offer flexible 6-12 month payment plans. For {empresa}, we're looking at roughly ${valor}/month. Would that work better? 💼"],
    ["Seguimiento propuesta enviada", "whatsapp", "PROPUESTA_ENVIADA", null, null, "Hi {nombre}, following up on the proposal for {empresa}. Did you get a chance to review it? I'm happy to answer any questions or adjust anything. 📋"],
    ["Cerrar — pedir el sí", "whatsapp", "NEGOCIACION", null, null, "Hi {nombre}, we have availability to begin work at {empresa}. Can we finalize the agreement today so we can lock in that date? I'll send the contract right over. 🤝"],
    ["Reactivar cliente frío", "whatsapp", null, "Has another provider", null, "Hi {nombre}! We just completed a major carpet restoration nearby with impressive results. Would you be open to a quick 10-minute call? I think you'll like what we can offer now. 🏆"],
    ["Post-venta — onboarding", "correo", "CERRADO_GANADO", null, "Welcome to Ezenty ProCare!", "Hi {nombre},\n\nWelcome to the Ezenty ProCare family! We're thrilled to be protecting the floor assets at {empresa}.\n\nHere's what happens next:\n✅ Our technician will contact you within 24 hours\n✅ We'll send you our pre-service checklist\n✅ After each service, you'll receive a detailed report\n\nBest,\n{vendedor}"],
    ["Pedir referidos", "whatsapp", "CERRADO_GANADO", null, null, "Hi {nombre}! Hope everything looks great at {empresa}. Do you know any other property managers who might benefit from our floor protection programs? We offer a referral bonus! 🙏"],
    ["Confirmar cita", "whatsapp", "PRIMER_CONTACTO", null, null, "Hi {nombre}! Just confirming our call tomorrow. Looking forward to learning more about {empresa}'s floor care needs. See you then! ✅"],
  ];
  for (const [nombre, tipo, etapa, objecion, asunto, cuerpo] of plantillasData) {
    await q(`INSERT INTO plantillas (id,nombre,tipo,etapa,objecion,asunto,cuerpo,es_global) VALUES ($1,$2,$3,$4,$5,$6,$7,true)`,
      [cuid(), nombre, tipo, etapa, objecion, asunto, cuerpo]);
  }

  // Recordatorio de hoy
  await q(`INSERT INTO recordatorios (id,texto,fecha,hora,usuario_id,cliente_id) VALUES ($1,$2,NOW(),$3,$4,$5)`,
    [cuid(), "Call Sarah Johnson to discuss revised proposal", "10:00", adminId, cSarah]);

  console.log("✅ Datos sembrados exitosamente!");
  console.log("   👤 Admin: admin@ezenty.com / Admin2024!");
  console.log("   👤 Vendedor: maria@ezenty.com / Vendedor2024!");
}

main().catch(e => { console.error("❌ Error:", e); process.exit(1); }).finally(() => db.end());
