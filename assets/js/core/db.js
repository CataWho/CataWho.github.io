// Capa de datos: todo lo que habla con Supabase pasa por acá.
// El resto del código nunca llama a Supabase directamente.

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/+esm";
import { config } from "../config.js";

const BUCKET = "archive-media";
const NO_PERMISSION = "No se guardó: la sesión venció o no tenés permiso. Volvé a entrar desde admin.html.";

export const hasDatabase = Boolean(config.supabaseUrl && config.supabaseAnonKey);
const db = hasDatabase ? createClient(config.supabaseUrl, config.supabaseAnonKey) : null;

function requireDb() {
  if (!db) throw new Error("Supabase no está configurado (revisá assets/js/config.js).");
  return db;
}

// Supabase no avisa con un error cuando las reglas RLS bloquean un cambio:
// simplemente no cambia ninguna fila. Por eso pedimos las filas afectadas y
// fallamos si no hubo ninguna.
function expectRows(data) {
  if (!data?.length) throw new Error(NO_PERMISSION);
}

// --- Lectura --------------------------------------------------------------

export async function getArchive() {
  if (!db) return { profile: { display_name: "Cata", bio: "", layout: {} }, items: [], projects: [] };
  const { data: profile, error } = await db
    .from("profiles")
    .select("*")
    .eq("slug", config.profileSlug)
    .single();
  if (error) throw error;
  const [items, projects] = await Promise.all([
    db.from("items").select("*").eq("profile_id", profile.id).order("created_at", { ascending: false }),
    db.from("projects").select("*").eq("profile_id", profile.id).order("created_at", { ascending: false }),
  ]);
  if (items.error) throw items.error;
  if (projects.error) throw projects.error;
  return { profile, items: items.data || [], projects: projects.data || [] };
}

async function profileId() {
  const { data, error } = await requireDb()
    .from("profiles")
    .select("id")
    .eq("slug", config.profileSlug)
    .single();
  if (error) throw error;
  return data.id;
}

// --- Items (música, libros, canales, notas, fotos y álbumes) --------------

export async function saveItem(item) {
  const { data, error } = await requireDb()
    .from("items")
    .insert({ ...item, profile_id: await profileId() })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateItem(id, changes) {
  const { data, error } = await requireDb().from("items").update(changes).eq("id", id).select("id");
  if (error) throw error;
  expectRows(data);
}

export async function deleteItem(id) {
  const { data, error } = await requireDb().from("items").delete().eq("id", id).select("id");
  if (error) throw error;
  expectRows(data);
}

// --- Proyectos p5.js ------------------------------------------------------

export async function saveProject(project) {
  const { data, error } = await requireDb()
    .from("projects")
    .upsert({ ...project, profile_id: await profileId() })
    .select("id");
  if (error) throw error;
  expectRows(data);
}

export async function deleteProject(id) {
  const { data, error } = await requireDb().from("projects").delete().eq("id", id).select("id");
  if (error) throw error;
  expectRows(data);
}

// --- Perfil ---------------------------------------------------------------

export async function updateProfile(changes) {
  const { data, error } = await requireDb()
    .from("profiles")
    .update(changes)
    .eq("slug", config.profileSlug)
    .select("id");
  if (error) throw error;
  expectRows(data);
}

// --- Archivos (Storage) ---------------------------------------------------

/** Sube un archivo y devuelve su URL pública. */
export async function uploadMedia(path, file) {
  const storage = requireDb().storage.from(BUCKET);
  const { error } = await storage.upload(path, file);
  if (error) throw error;
  return storage.getPublicUrl(path).data.publicUrl;
}

export async function deleteMedia(path) {
  if (!db || !path) return;
  const { error } = await db.storage.from(BUCKET).remove([path]);
  if (error) throw error;
}

/** A partir de una URL pública del bucket, devuelve la ruta interna del archivo (o null). */
export function storagePathFromUrl(url) {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const index = String(url || "").indexOf(marker);
  return index < 0 ? null : decodeURIComponent(url.slice(index + marker.length));
}

/** Limpia un nombre de archivo para usarlo en una ruta de Storage. */
export const safeFileName = (name) => String(name).replace(/[^a-zA-Z0-9._-]/g, "_");

// --- Sesión ---------------------------------------------------------------

export async function currentUser() {
  if (!db) return null;
  const { data } = await db.auth.getUser();
  return data.user || null;
}

export async function sendMagicLink(email, redirectTo) {
  const { error } = await requireDb().auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } });
  if (error) throw error;
}

/** La primera vez que la dueña entra, crea su perfil. Después solo lo verifica. */
export async function ensureProfile() {
  const user = await currentUser();
  if (!user) throw new Error("No hay una sesión activa");
  const { data: existing, error: readError } = await requireDb()
    .from("profiles")
    .select("*")
    .eq("slug", config.profileSlug)
    .maybeSingle();
  if (readError) throw readError;
  if (existing) {
    if (existing.owner_id !== user.id) throw new Error("Este perfil ya pertenece a otra cuenta");
    return existing;
  }
  const { data, error } = await db
    .from("profiles")
    .insert({ owner_id: user.id, slug: config.profileSlug, display_name: "Cata", bio: "" })
    .select()
    .single();
  if (error) throw error;
  return data;
}
