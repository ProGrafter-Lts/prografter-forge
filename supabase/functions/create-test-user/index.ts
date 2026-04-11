import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const email = "test@prografter.com";
  const password = "TestPass123!";

  // Create or get user
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existing = existingUsers?.users?.find((u) => u.email === email);

  if (existing) {
    return new Response(JSON.stringify({ email, password, message: "User already exists" }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: "Test Homeowner", user_type: "homeowner", postcode: "SW1A 1AA", phone: "07700900000" },
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }

  // Link homeowner record to this user
  const userId = data.user.id;
  await supabase.from("homeowners").upsert({
    id: "aaaa0000-0000-0000-0000-000000000001",
    user_id: userId,
    name: "Test Homeowner",
    email,
    phone: "07700900000",
  }, { onConflict: "id" });

  // Update jobs to point to this homeowner
  await supabase.from("profiles").update({ user_id: userId }).eq("email", email);

  return new Response(JSON.stringify({ email, password, userId, message: "User created" }), {
    headers: { "Content-Type": "application/json" },
  });
});
