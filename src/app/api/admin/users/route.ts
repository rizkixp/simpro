import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    // 1. Verifikasi apakah pemanggil request adalah Administrator
    const supabase = await createServerSupabaseClient();
    const {
      data: { user: caller },
    } = await supabase.auth.getUser();

    // Izinkan jika pemanggil adalah admin, ATAU jika belum ada user sama sekali di sistem (seeding awal)
    const callerRole = (caller?.user_metadata?.role || "").toLowerCase();
    if (!caller || callerRole !== "admin") {
      return NextResponse.json(
        { error: "Akses ditolak. Operasi ini membutuhkan hak akses Administrator." },
        { status: 403 }
      );
    }

    if (!isSupabaseAdminConfigured()) {
      return NextResponse.json(
        {
          error:
            "SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi di file .env.local. Tambahkan service_role secret dari dashboard Supabase untuk mengaktifkan pembuatan akun oleh admin.",
        },
        { status: 500 }
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

    const adminClient = createAdminClient();

    // 2. Buat akun di Supabase Auth (auth.users) dengan email terkonfirmasi langsung
    const { data: newAuthData, error: createError } = await adminClient.auth.admin.createUser({
      email: email.trim().toLowerCase(),
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

    // 3. Pastikan record di public.users ter-update/insert
    const { error: profileError } = await adminClient.from("users").upsert({
      id: newAuthUser.id,
      auth_id: newAuthUser.id,
      name,
      email: email.trim().toLowerCase(),
      role: role || "siswa",
      avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || "user")}`,
      nisn_or_nip: nisnOrNip || null,
      kelas: kelas || null,
      phone: phone || null,
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
    const supabase = await createServerSupabaseClient();
    const {
      data: { user: caller },
    } = await supabase.auth.getUser();

    const callerRole = (caller?.user_metadata?.role || "").toLowerCase();
    if (!caller || callerRole !== "admin") {
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

    if (userId === caller.id) {
      return NextResponse.json(
        { error: "Anda tidak dapat menghapus akun Administrator Anda sendiri yang sedang aktif." },
        { status: 400 }
      );
    }

    if (isSupabaseAdminConfigured()) {
      const adminClient = createAdminClient();
      await adminClient.auth.admin.deleteUser(userId).catch(() => {});
      await adminClient.from("users").delete().eq("id", userId);
    } else {
      const { error } = await supabase.from("users").delete().eq("id", userId);
      if (error) throw error;
    }

    return NextResponse.json({ success: true, message: "Pengguna berhasil dihapus." });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Gagal menghapus pengguna." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user: caller },
    } = await supabase.auth.getUser();

    const callerRole = (caller?.user_metadata?.role || "").toLowerCase();
    if (!caller || callerRole !== "admin") {
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

      await adminClient.from("users").update({
        ...(name && { name }),
        ...(role && { role }),
        ...(status && { status }),
        ...(nisnOrNip !== undefined && { nisn_or_nip: nisnOrNip }),
        ...(kelas !== undefined && { kelas }),
        ...(phone !== undefined && { phone }),
      }).eq("id", id);
    } else {
      const { error } = await supabase.from("users").update({
        ...(name && { name }),
        ...(role && { role }),
        ...(status && { status }),
        ...(nisnOrNip !== undefined && { nisn_or_nip: nisnOrNip }),
        ...(kelas !== undefined && { kelas }),
        ...(phone !== undefined && { phone }),
      }).eq("id", id);
      if (error) throw error;
    }

    return NextResponse.json({ success: true, message: "Pengguna berhasil diperbarui." });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Gagal memperbarui pengguna." },
      { status: 500 }
    );
  }
}
