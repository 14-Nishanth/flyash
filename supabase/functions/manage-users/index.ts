import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Role = "admin" | "owner" | "operator";
const validRole = (value: unknown): value is Role =>
  value === "admin" || value === "owner" || value === "operator";

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json({ error: "Supabase Auth admin function is not configured." }, 500);
  }

  const authorization = request.headers.get("Authorization");
  if (!authorization) return json({ error: "Authentication required." }, 401);

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: callerResult, error: callerError } = await callerClient.auth.getUser();
  if (callerError || !callerResult.user) return json({ error: "Invalid or expired session." }, 401);

  const caller = callerResult.user;
  const callerRole = caller.app_metadata?.role;
  const hasAccess = caller.app_metadata?.flyash_access === true || caller.app_metadata?.flyash_access === "true";
  if (!hasAccess || (callerRole !== "admin" && callerRole !== "owner")) {
    return json({ error: "Only authorized administrators and owners can manage company users." }, 403);
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Request body must be valid JSON." }, 400);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const action = body.action;

  const listAllUsers = async () => {
    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error) throw error;
    return data.users;
  };
  const toSafeUser = (user: { id: string; email?: string; created_at?: string; user_metadata?: Record<string, unknown>; app_metadata?: Record<string, unknown> }) => ({
    id: user.id,
    username: user.email || "",
    name: typeof user.user_metadata?.name === "string" ? user.user_metadata.name : user.email || "Staff",
    role: validRole(user.app_metadata?.role) ? user.app_metadata.role : "operator",
    phone: typeof user.user_metadata?.phone === "string" ? user.user_metadata.phone : "",
    created_at: user.created_at || new Date().toISOString(),
  });

  try {
    if (action === "list") {
      const users = await listAllUsers();
      const allowedUsers = users.filter((user) =>
        user.app_metadata?.flyash_access === true || user.app_metadata?.flyash_access === "true"
      );
      return json({ users: allowedUsers.map(toSafeUser) });
    }

    if (action === "create") {
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "");
      const name = String(body.name || "").trim();
      const phone = String(body.phone || "").trim();
      const role = body.role;
      if (!email.includes("@")) return json({ error: "Enter a valid company email address." }, 400);
      if (password.length < 8) return json({ error: "New user passwords must be at least 8 characters." }, 400);
      if (!name) return json({ error: "Name is required." }, 400);
      if (!validRole(role)) return json({ error: "Invalid user role." }, 400);

      const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, phone },
        app_metadata: { role, flyash_access: true },
      });
      if (error) return json({ error: error.message }, 400);
      return json({ user: toSafeUser(data.user) }, 201);
    }

    if (action === "update") {
      const userId = String(body.user_id || "");
      if (!userId) return json({ error: "user_id is required." }, 400);
      const { data: targetResult, error: targetError } = await admin.auth.admin.getUserById(userId);
      if (targetError || !targetResult.user) return json({ error: "User not found." }, 404);
      const target = targetResult.user;
      const updates: Record<string, unknown> = {};
      if (body.email !== undefined) {
        const email = String(body.email || "").trim().toLowerCase();
        if (!email.includes("@")) return json({ error: "Enter a valid email address." }, 400);
        updates.email = email;
        updates.email_confirm = true;
      }
      if (body.password !== undefined && body.password !== null && String(body.password).length > 0) {
        if (String(body.password).length < 8) return json({ error: "Passwords must be at least 8 characters." }, 400);
        updates.password = String(body.password);
      }
      const userMetadata = { ...(target.user_metadata || {}) };
      if (body.name !== undefined) userMetadata.name = String(body.name || "").trim();
      if (body.phone !== undefined) userMetadata.phone = String(body.phone || "").trim();
      updates.user_metadata = userMetadata;

      const newRole = body.role === undefined ? target.app_metadata?.role : body.role;
      if (!validRole(newRole)) return json({ error: "Invalid user role." }, 400);
      if (target.app_metadata?.role === "admin" && newRole !== "admin") {
        const allUsers = await listAllUsers();
        const adminCount = allUsers.filter((u) => u.app_metadata?.role === "admin" && (u.app_metadata?.flyash_access === true || u.app_metadata?.flyash_access === "true")).length;
        if (adminCount <= 1) return json({ error: "The last administrator cannot be demoted." }, 409);
      }
      updates.app_metadata = { ...(target.app_metadata || {}), role: newRole, flyash_access: true };
      const { data, error } = await admin.auth.admin.updateUserById(userId, updates);
      if (error) return json({ error: error.message }, 400);
      return json({ user: toSafeUser(data.user) });
    }

    if (action === "delete") {
      const userId = String(body.user_id || "");
      if (!userId) return json({ error: "user_id is required." }, 400);
      if (userId === caller.id) return json({ error: "You cannot delete the account currently signed in." }, 409);
      const { data: targetResult, error: targetError } = await admin.auth.admin.getUserById(userId);
      if (targetError || !targetResult.user) return json({ error: "User not found." }, 404);
      if (targetResult.user.app_metadata?.role === "admin") {
        const allUsers = await listAllUsers();
        const adminCount = allUsers.filter((u) => u.app_metadata?.role === "admin" && (u.app_metadata?.flyash_access === true || u.app_metadata?.flyash_access === "true")).length;
        if (adminCount <= 1) return json({ error: "The last administrator cannot be deleted." }, 409);
      }
      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error) return json({ error: error.message }, 400);
      return json({ success: true });
    }

    return json({ error: "Unsupported action." }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected user management error.";
    return json({ error: message }, 500);
  }
});
