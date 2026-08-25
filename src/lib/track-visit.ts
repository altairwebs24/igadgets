import { supabase } from "@/integrations/supabase/client";

const KEY = "igadgets-visit-session";

function getSessionId() {
  try {
    let id = sessionStorage.getItem(KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return "anonymous";
  }
}

let sent = false;

export async function trackVisit(path: string) {
  if (typeof window === "undefined" || sent) return;
  sent = true;
  try {
    await supabase.from("site_visits").insert({ session_id: getSessionId(), path });
  } catch {
    // tracking must never break the page
  }
}
