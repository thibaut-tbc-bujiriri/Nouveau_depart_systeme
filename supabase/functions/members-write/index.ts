import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

type Role = "superadmin" | "admin" | "department_manager" | "department_member";

type MemberPayload = {
  branchId: string;
  firstName: string;
  lastName: string;
  gender: string;
  phone: string;
  email?: string;
  joinedAt: string;
  status: string;
  departmentIds: string[];
  avatarUrl?: string;
};

type RequestBody =
  | { action: "create"; payload: MemberPayload }
  | { action: "update"; memberId: string; payload: MemberPayload }
  | { action: "delete"; memberId: string };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

function response(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function ensurePayload(payload: MemberPayload) {
  if (!payload.branchId?.trim()) {
    throw new Error("branchId est requis.");
  }
  if (!payload.firstName?.trim() || !payload.lastName?.trim()) {
    throw new Error("firstName et lastName sont requis.");
  }

  const phone = normalizePhone(payload.phone);
  if (phone.length < 7) {
    throw new Error("Le numero de telephone est invalide.");
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return response(405, { error: "Method not allowed" });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authHeader = req.headers.get("Authorization");

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return response(500, { error: "Missing Supabase secrets on function runtime" });
  }

  if (!authHeader) {
    return response(401, { error: "Missing Authorization header" });
  }

  try {
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        apikey: anonKey,
      },
    });

    if (!userResponse.ok) {
      const message = await userResponse.text();
      return response(401, { error: message || "Unauthorized" });
    }

    const callerUser = (await userResponse.json()) as { id?: string };
    if (!callerUser.id) {
      return response(401, { error: "Unauthorized" });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: callerProfile, error: profileError } = await adminClient
      .from("profiles")
      .select("id, role, branch_id")
      .eq("id", callerUser.id)
      .single();

    if (profileError || !callerProfile) {
      return response(403, { error: "Profil introuvable ou inaccessible." });
    }

    const callerRole = String(callerProfile.role ?? "") as Role;
    const callerBranchId = String(callerProfile.branch_id ?? "");

    if (!["superadmin", "admin", "department_manager"].includes(callerRole)) {
      return response(403, { error: "Role insuffisant pour gerer les membres." });
    }

    const body = (await req.json().catch(() => null)) as RequestBody | null;
    if (!body || typeof body !== "object" || !("action" in body)) {
      return response(400, { error: "Corps de requete invalide." });
    }

    const getManagerDepartmentIds = async () => {
      const profileLinkResult = await adminClient
        .from("department_members")
        .select("department_id")
        .eq("profile_id", callerUser.id);

      if (!profileLinkResult.error) {
        return new Set((profileLinkResult.data ?? []).map((item) => String((item as { department_id: string }).department_id)));
      }

      const userLinkResult = await adminClient
        .from("department_members")
        .select("department_id")
        .eq("user_id", callerUser.id);

      if (!userLinkResult.error) {
        return new Set((userLinkResult.data ?? []).map((item) => String((item as { department_id: string }).department_id)));
      }

      return new Set<string>();
    };

    const enforceScope = async (payload: MemberPayload) => {
      if (callerRole === "superadmin") {
        return;
      }

      if (!callerBranchId || payload.branchId !== callerBranchId) {
        throw new Error("Action interdite hors de votre extension.");
      }

      if (callerRole === "department_manager") {
        const allowed = await getManagerDepartmentIds();
        for (const departmentId of payload.departmentIds ?? []) {
          if (!allowed.has(departmentId)) {
            throw new Error("Action interdite hors de vos departements.");
          }
        }
      }
    };

    const replaceMemberDepartments = async (memberId: string, departmentIds: string[]) => {
      const { error: clearError } = await adminClient
        .from("church_member_departments")
        .delete()
        .eq("church_member_id", memberId);

      if (clearError) {
        throw new Error(clearError.message);
      }

      if (!departmentIds.length) {
        return;
      }

      const linkRows = departmentIds.map((departmentId) => ({
        church_member_id: memberId,
        department_id: departmentId,
      }));

      const { error: insertError } = await adminClient.from("church_member_departments").insert(linkRows);
      if (insertError) {
        throw new Error(insertError.message);
      }
    };

    if (body.action === "create") {
      ensurePayload(body.payload);
      await enforceScope(body.payload);

      const { data: created, error: createError } = await adminClient
        .from("church_members")
        .insert({
          branch_id: body.payload.branchId,
          first_name: body.payload.firstName,
          last_name: body.payload.lastName,
          gender: body.payload.gender,
          phone: normalizePhone(body.payload.phone),
          email: body.payload.email?.trim() || null,
          joined_at: body.payload.joinedAt,
          status: body.payload.status,
          avatar_url: body.payload.avatarUrl || null,
        })
        .select("id")
        .single();

      if (createError || !created) {
        return response(400, { error: createError?.message || "Creation membre impossible." });
      }

      await replaceMemberDepartments(String((created as { id: string }).id), body.payload.departmentIds ?? []);
      return response(200, { success: true, id: (created as { id: string }).id });
    }

    if (body.action === "update") {
      if (!body.memberId?.trim()) {
        return response(400, { error: "memberId est requis." });
      }

      ensurePayload(body.payload);
      await enforceScope(body.payload);

      const { data: existing, error: existingError } = await adminClient
        .from("church_members")
        .select("branch_id")
        .eq("id", body.memberId)
        .maybeSingle();

      if (existingError || !existing) {
        return response(404, { error: "Membre introuvable." });
      }

      if (callerRole !== "superadmin" && String((existing as { branch_id?: string }).branch_id ?? "") !== callerBranchId) {
        return response(403, { error: "Action interdite hors de votre extension." });
      }

      const { error: updateError } = await adminClient
        .from("church_members")
        .update({
          branch_id: body.payload.branchId,
          first_name: body.payload.firstName,
          last_name: body.payload.lastName,
          gender: body.payload.gender,
          phone: normalizePhone(body.payload.phone),
          email: body.payload.email?.trim() || null,
          joined_at: body.payload.joinedAt,
          status: body.payload.status,
          avatar_url: body.payload.avatarUrl !== undefined ? body.payload.avatarUrl : null,
        })
        .eq("id", body.memberId);

      if (updateError) {
        return response(400, { error: updateError.message });
      }

      await replaceMemberDepartments(body.memberId, body.payload.departmentIds ?? []);
      return response(200, { success: true });
    }

    if (body.action === "delete") {
      if (!body.memberId?.trim()) {
        return response(400, { error: "memberId est requis." });
      }

      const { data: existing, error: existingError } = await adminClient
        .from("church_members")
        .select("branch_id")
        .eq("id", body.memberId)
        .maybeSingle();

      if (existingError || !existing) {
        return response(404, { error: "Membre introuvable." });
      }

      if (callerRole !== "superadmin" && String((existing as { branch_id?: string }).branch_id ?? "") !== callerBranchId) {
        return response(403, { error: "Action interdite hors de votre extension." });
      }

      const { error: deleteLinksError } = await adminClient
        .from("church_member_departments")
        .delete()
        .eq("church_member_id", body.memberId);

      if (deleteLinksError) {
        return response(400, { error: deleteLinksError.message });
      }

      const { error: deleteMemberError } = await adminClient
        .from("church_members")
        .delete()
        .eq("id", body.memberId);

      if (deleteMemberError) {
        return response(400, { error: deleteMemberError.message });
      }

      return response(200, { success: true });
    }

    return response(400, { error: "Action invalide." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return response(500, { error: message });
  }
});
