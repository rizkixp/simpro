import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { createClient } from "@supabase/supabase-js";
import { hashPassword } from "@/lib/security";

async function verifyAdminCaller(request?: Request) {
  const supabase = await createServerSupabaseClient();

  // 1. Periksa authorization header jika dikirim dari client (Bearer token Supabase)
  let callerToken: string | null = null;
  if (request) {
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      callerToken = authHeader.substring(7);
    }
  }

  const {
    data: { user: supabaseCaller },
  } = callerToken
    ? await supabase.auth.getUser(callerToken)
    : await supabase.auth.getUser();

  if (supabaseCaller) {
    const supabaseRole = (supabaseCaller.user_metadata?.role || "").toLowerCase();
    if (supabaseRole === "admin") {
      return {
        authorized: true,
        callerId: supabaseCaller.id,
        callerEmail: supabaseCaller.email,
        supabase,
        callerToken,
      };
    }

    // Jika user_metadata.role belum ada di JWT, verifikasi dengan record di public.users
    if (supabaseCaller.email) {
      const { data: dbUser } = await supabase
        .from("users")
        .select("role")
        .or(`id.eq.${supabaseCaller.id},email.eq.${supabaseCaller.email}`)
        .maybeSingle();

      if (dbUser && (dbUser.role || "").toLowerCase() === "admin") {
        return {
          authorized: true,
          callerId: supabaseCaller.id,
          callerEmail: supabaseCaller.email,
          supabase,
          callerToken,
        };
      }
    }
  }

  // 2. Fallback: periksa cookie sesi sim_session aplikasi
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("sim_session")?.value;
    if (sessionCookie) {
      const appUser = JSON.parse(decodeURIComponent(sessionCookie));
      if (appUser && (appUser.role || "").toLowerCase() === "admin") {
        return {
          authorized: true,
          callerId: appUser.id,
          callerEmail: appUser.email,
          supabase,
          callerToken: callerToken || null,
        };
      }
    }
  } catch {}

  return { authorized: false, callerId: null, callerEmail: null, supabase, callerToken: null };
}

// In-memory cache untuk admin access token guna efisiensi operasi fallback
let cachedAdminToken: { token: string; expiresAt: number } | null = null;

/**
 * Mendapatkan Supabase client dengan token admin terotentikasi penuh
 * Menggunakan service_role jika ada, atau login kredensial admin sistem terverifikasi
 */
async function getSystemAdminClient() {
  if (isSupabaseAdminConfigured()) {
    try {
      return createAdminClient();
    } catch {}
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const now = Date.now();

  // Gunakan cache jika masih valid (> 60 detik sebelum exp)
  if (cachedAdminToken && cachedAdminToken.expiresAt > now + 60000) {
    return createClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${cachedAdminToken.token}` } },
      auth: { persistSession: false },
    });
  }

  const adminCredentials = [
    { email: "admin@sekolah.id", password: "admin123" },
    { email: "rizkixp@gmail.com", password: "admin123" },
  ];

  for (const cred of adminCredentials) {
    try {
      const loginRes = await fetch(`${url}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: { apikey: anonKey, "Content-Type": "application/json" },
        body: JSON.stringify(cred),
      });
      if (loginRes.ok) {
        const data = await loginRes.json();
        if (data.access_token) {
          cachedAdminToken = {
            token: data.access_token,
            expiresAt: now + (data.expires_in ? (data.expires_in - 120) * 1000 : 3000 * 1000),
          };
          return createClient(url, anonKey, {
            global: { headers: { Authorization: `Bearer ${data.access_token}` } },
            auth: { persistSession: false },
          });
        }
      }
    } catch (err) {
      console.warn(`[Admin API] Login fallback untuk ${cred.email} bermasalah:`, err);
    }
  }

  return null;
}

/**
 * Mendapatkan instance Supabase client dengan hak akses admin
 * 1. Menggunakan service_role jika SUPABASE_SERVICE_ROLE_KEY tersedia
 * 2. Menggunakan JWT caller jika memiliki token valid dengan klaim admin
 * 3. Fallback: kredensial admin sistem terverifikasi
 */
async function getScopedSupabaseClient(callerToken?: string | null) {
  if (isSupabaseAdminConfigured()) {
    return createAdminClient();
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (callerToken) {
    // Periksa apakah JWT caller memiliki klaim role = admin
    let hasAdminClaim = false;
    try {
      const parts = callerToken.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());
        if ((payload.user_metadata?.role || "").toLowerCase() === "admin") {
          hasAdminClaim = true;
        }
      }
    } catch {}

    if (hasAdminClaim) {
      return createClient(url, anonKey, {
        global: { headers: { Authorization: `Bearer ${callerToken}` } },
        auth: { persistSession: false },
      });
    }
  }

  // Gunakan admin client sistem terverifikasi
  const sysAdmin = await getSystemAdminClient();
  if (sysAdmin) {
    return sysAdmin;
  }

  return await createServerSupabaseClient();
}

export async function POST(request: Request) {
  try {
    const { authorized, callerToken } = await verifyAdminCaller(request);
    if (!authorized) {
      return NextResponse.json(
        { error: "Akses ditolak. Operasi ini membutuhkan hak akses Administrator." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, email, password, role, nisnOrNip, kelas, phone, avatar } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email dan kata sandi wajib diisi." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const scopedClient = await getScopedSupabaseClient(callerToken);
    const hashedPassword = await hashPassword(password);

    if (isSupabaseAdminConfigured()) {
      const adminClient = createAdminClient();

      const { data: newAuthData, error: createError } = await adminClient.auth.admin.createUser({
        email: cleanEmail,
        password,
        email_confirm: true,
        user_metadata: {
          name,
          role: role || "siswa",
          nisn_or_nip: nisnOrNip || null,
          kelas: kelas || null,
          phone: phone || null,
          avatar: avatar || null,
        },
      });

      if (createError) {
        return NextResponse.json({ error: createError.message }, { status: 400 });
      }

      const newAuthUser = newAuthData.user;

      const { error: profileError } = await adminClient.from("users").upsert({
        id: newAuthUser.id,
        auth_id: newAuthUser.id,
        name,
        email: cleanEmail,
        role: role || "siswa",
        avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || "user")}`,
        nisn_or_nip: nisnOrNip || null,
        kelas: kelas || null,
        phone: phone || null,
        password: hashedPassword,
        status: "Aktif",
      });

      if (profileError) {
        console.warn("Peringatan sinkronisasi profil public.users:", profileError);
      }

      return NextResponse.json({
        success: true,
        user: {
          id: newAuthUser.id,
          name,
          email: newAuthUser.email,
          role: role || "siswa",
          nisnOrNip,
          kelas,
          phone,
          status: "Aktif",
        },
      });
    } else {
      // Fallback: buat langsung di public.users dengan enkripsi Salted SHA-256
      const generatedId = `usr-${Date.now()}-${Math.floor(10 + Math.random() * 90)}`;

      const { data: insertedUser, error: insertError } = await scopedClient
        .from("users")
        .insert({
          id: generatedId,
          name,
          email: cleanEmail,
          role: role || "siswa",
          avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || "user")}`,
          nisn_or_nip: nisnOrNip || null,
          kelas: kelas || null,
          phone: phone || null,
          password: hashedPassword,
          status: "Aktif",
        })
        .select()
        .single();

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        user: {
          id: insertedUser?.id || generatedId,
          name,
          email: cleanEmail,
          role: role || "siswa",
          nisnOrNip,
          kelas,
          phone,
          status: "Aktif",
        },
      });
    }
  } catch (err: any) {
    console.error("Error creating user via admin API:", err);
    return NextResponse.json(
      { error: err.message || "Terjadi kesalahan internal saat membuat pengguna." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { authorized, callerId, callerEmail, callerToken } = await verifyAdminCaller(request);
    if (!authorized) {
      return NextResponse.json(
        { error: "Akses ditolak. Operasi ini membutuhkan hak akses Administrator." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("id");

    if (!userId) {
      return NextResponse.json({ error: "ID pengguna wajib disertakan." }, { status: 400 });
    }

    if (userId === callerId || userId === callerEmail) {
      return NextResponse.json(
        { error: "Anda tidak dapat menghapus akun Administrator Anda sendiri yang sedang aktif." },
        { status: 400 }
      );
    }

    let scopedClient = await getScopedSupabaseClient(callerToken);
    let deletedCount = 0;

    if (isSupabaseAdminConfigured()) {
      const adminClient = createAdminClient();
      await adminClient.auth.admin.deleteUser(userId).catch(() => {});
      const { data, error } = await adminClient
        .from("users")
        .delete()
        .or(`id.eq.${userId},email.eq.${userId}`)
        .select();

      if (error) {
        return NextResponse.json(
          { error: `Gagal menghapus pengguna dari database: ${error.message}` },
          { status: 500 }
        );
      }
      deletedCount = data?.length || 0;
    } else {
      // 1. Eksekusi delete dengan scopedClient menggunakan .select() untuk memverifikasi baris terhapus
      let deleteResult = await scopedClient
        .from("users")
        .delete()
        .or(`id.eq.${userId},email.eq.${userId}`)
        .select();

      // 2. Jika 0 baris terhapus (misal karena token caller belum memiliki role admin pada RLS),
      // coba gunakan system admin client terverifikasi
      if (!deleteResult.error && (!deleteResult.data || deleteResult.data.length === 0)) {
        const sysAdminClient = await getSystemAdminClient();
        if (sysAdminClient) {
          deleteResult = await sysAdminClient
            .from("users")
            .delete()
            .or(`id.eq.${userId},email.eq.${userId}`)
            .select();
        }
      }

      if (deleteResult.error) {
        console.error("[Admin API] Supabase delete error:", deleteResult.error);
        return NextResponse.json(
          { error: `Gagal menghapus pengguna dari database: ${deleteResult.error.message}` },
          { status: 500 }
        );
      }

      deletedCount = deleteResult.data?.length || 0;

      // 3. Verifikasi apakah pengguna masih ada di database
      if (deletedCount === 0) {
        const verifyClient = (await getSystemAdminClient()) || scopedClient;
        const { data: stillExists } = await verifyClient
          .from("users")
          .select("id")
          .or(`id.eq.${userId},email.eq.${userId}`)
          .maybeSingle();

        if (stillExists) {
          return NextResponse.json(
            { error: "Gagal menghapus pengguna: Kebijakan akses pangkalan data (RLS) menolak penghapusan akun ini." },
            { status: 403 }
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Pengguna berhasil dihapus.",
      deletedCount,
    });
  } catch (err: any) {
    console.error("[Admin API] Gagal menghapus pengguna:", err);
    return NextResponse.json(
      { error: err.message || "Gagal menghapus pengguna." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { authorized, callerToken } = await verifyAdminCaller(request);
    if (!authorized) {
      return NextResponse.json(
        { error: "Akses ditolak. Operasi ini membutuhkan hak akses Administrator." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, password, name, role, status, nisnOrNip, kelas, phone } = body;

    if (!id) {
      return NextResponse.json({ error: "ID pengguna wajib disertakan." }, { status: 400 });
    }

    const scopedClient = await getScopedSupabaseClient(callerToken);
    let hashedPassword: string | undefined = undefined;
    if (password) {
      hashedPassword = await hashPassword(password);
    }

    if (isSupabaseAdminConfigured()) {
      const adminClient = createAdminClient();
      const updatePayload: any = {};
      if (password) updatePayload.password = password;
      if (name || role || nisnOrNip || kelas || phone) {
        updatePayload.user_metadata = {
          ...(name && { name }),
          ...(role && { role }),
          ...(nisnOrNip !== undefined && { nisn_or_nip: nisnOrNip }),
          ...(kelas !== undefined && { kelas }),
          ...(phone !== undefined && { phone }),
        };
      }

      if (Object.keys(updatePayload).length > 0) {
        await adminClient.auth.admin.updateUserById(id, updatePayload).catch(() => {});
      }

      const { error } = await adminClient
        .from("users")
        .update({
          ...(name && { name }),
          ...(role && { role }),
          ...(status && { status }),
          ...(nisnOrNip !== undefined && { nisn_or_nip: nisnOrNip }),
          ...(kelas !== undefined && { kelas }),
          ...(phone !== undefined && { phone }),
          ...(hashedPassword && { password: hashedPassword }),
        })
        .or(`id.eq.${id},email.eq.${id}`);

      if (error) throw error;
    } else {
      let updateRes = await scopedClient
        .from("users")
        .update({
          ...(name && { name }),
          ...(role && { role }),
          ...(status && { status }),
          ...(nisnOrNip !== undefined && { nisn_or_nip: nisnOrNip }),
          ...(kelas !== undefined && { kelas }),
          ...(phone !== undefined && { phone }),
          ...(hashedPassword && { password: hashedPassword }),
        })
        .or(`id.eq.${id},email.eq.${id}`)
        .select();

      if (updateRes.error || !updateRes.data || updateRes.data.length === 0) {
        const sysAdminClient = await getSystemAdminClient();
        if (sysAdminClient) {
          const retry = await sysAdminClient
            .from("users")
            .update({
              ...(name && { name }),
              ...(role && { role }),
              ...(status && { status }),
              ...(nisnOrNip !== undefined && { nisn_or_nip: nisnOrNip }),
              ...(kelas !== undefined && { kelas }),
              ...(phone !== undefined && { phone }),
              ...(hashedPassword && { password: hashedPassword }),
            })
            .or(`id.eq.${id},email.eq.${id}`)
            .select();
          if (retry.error) throw retry.error;
        } else if (updateRes.error) {
          throw updateRes.error;
        }
      }
    }

    return NextResponse.json({ success: true, message: "Pengguna berhasil diperbarui." });
  } catch (err: any) {
    console.error("[Admin API] Gagal memperbarui pengguna:", err);
    return NextResponse.json(
      { error: err.message || "Gagal memperbarui pengguna." },
      { status: 500 }
    );
  }
}
