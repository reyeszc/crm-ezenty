import type { Rol } from "@/lib/tipos";
import { auth } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export type Accion =
  | "ver_todos_clientes" | "editar_cliente" | "eliminar_cliente"
  | "ver_admin_panel" | "gestionar_usuarios" | "exportar_todo"
  | "vaciar_papelera" | "ver_auditoria" | "editar_config"
  | "reasignar_clientes";

export function puede(rolUsuario: Rol, accion: Accion): boolean {
  if (rolUsuario === "ADMIN") return true;
  if (rolUsuario === "SOLO_LECTURA") return accion === "ver_todos_clientes";
  switch (accion) {
    case "editar_cliente":
    case "eliminar_cliente":
      return true;
    default:
      return false;
  }
}

export async function puedeAccederCliente(usuarioId: string, rol: Rol, clienteId: string): Promise<boolean> {
  if (rol === "ADMIN") return true;
  const [cliente] = await db.select({ vendedorId: schema.clientes.vendedorId })
    .from(schema.clientes)
    .where(eq(schema.clientes.id, clienteId))
    .limit(1);
  return cliente?.vendedorId === usuarioId;
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autenticado");
  return session;
}

export async function requireAdmin() {
  const session = await requireAuth();
  if ((session.user as any).rol !== "ADMIN") throw new Error("Solo administradores");
  return session;
}
