import { supabase } from "./supabase";

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { user: data.user, error };
}

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  return { user: data.user, error };
}

export async function signOut() {
  await supabase.auth.signOut();
}

// Asocia los cafés sin user_id al usuario actual (migración de datos existentes)
export async function migrateAnonymousData() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("coffees")
    .update({ user_id: user.id })
    .is("user_id", null);
}
