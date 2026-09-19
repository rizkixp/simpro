"use client";

import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSchoolData } from "@/contexts/SchoolDataContext";
import { Guru, MataPelajaran } from "@/types/school";

export interface TeacherScope {
  isTeacher: boolean;
  isHomeroom: boolean;
  assignedClass: string | null;
  accessibleClasses: string[];
  teacherProfile: Guru | null;
  teacherName: string;
  assignedSubjects: string[];
  scopedMapelList: MataPelajaran[];
  filterByClass: <T extends { kelas?: string }>(items: T[]) => T[];
  isClassAccessible: (kelasName: string) => boolean;
  filterBySubject: <T extends { mapel?: string }>(items: T[]) => T[];
  isSubjectAccessible: (mapelName: string) => boolean;
}

export function useTeacherScope(): TeacherScope {
  const { user } = useAuth();
  const { guruList, kelasList, mapelList, jadwalList } = useSchoolData();

  return useMemo(() => {
    const isTeacher = user?.role === "guru";

    if (!isTeacher) {
      const allClassNames = kelasList.map((k) => k.nama);
      const allSubjectNames = mapelList.map((m) => m.nama);
      return {
        isTeacher: false,
        isHomeroom: false,
        assignedClass: null,
        accessibleClasses: allClassNames,
        teacherProfile: null,
        teacherName: user?.name || "",
        assignedSubjects: allSubjectNames,
        scopedMapelList: mapelList,
        filterByClass: <T extends { kelas?: string }>(items: T[]) => items,
        isClassAccessible: () => true,
        filterBySubject: <T extends { mapel?: string }>(items: T[]) => items,
        isSubjectAccessible: () => true,
      };
    }

    // Identify matching teacher in guruList
    const teacherProfile =
      guruList.find(
        (g) =>
          (user?.nisnOrNip && g.nip === user.nisnOrNip) ||
          (user?.email && g.email.toLowerCase() === user.email.toLowerCase()) ||
          (user?.name && g.nama.toLowerCase().includes(user.name.toLowerCase())) ||
          (user?.name && user.name.toLowerCase().includes(g.nama.toLowerCase()))
      ) || null;

    // Determine assigned homeroom class
    let assignedClass: string | null = null;

    if (user?.kelas && user.kelas.trim() && user.kelas !== "Semua") {
      assignedClass = user.kelas.trim();
    } else if (teacherProfile?.kelasWali && teacherProfile.kelasWali.trim()) {
      assignedClass = teacherProfile.kelasWali.trim();
    } else if (teacherProfile) {
      const matchedKelas = kelasList.find((k) => k.waliKelasId === teacherProfile.id);
      if (matchedKelas) {
        assignedClass = matchedKelas.nama;
      }
    }

    // Default fallback if no homeroom class is specified
    if (!assignedClass) {
      assignedClass = kelasList[0]?.nama || "X MIPA 1";
    }

    // Collect all accessible classes for this teacher (homeroom + scheduled classes)
    const scheduledClasses = jadwalList
      .filter((j) => {
        if (!teacherProfile && !user?.name) return false;
        const tName = (teacherProfile?.nama || user?.name || "").toLowerCase();
        const jName = (j.guruNama || "").toLowerCase();
        return tName.includes(jName) || jName.includes(tName);
      })
      .map((j) => j.kelas);

    const classSet = new Set<string>();
    if (assignedClass) classSet.add(assignedClass);
    scheduledClasses.forEach((c) => {
      if (c && c.trim()) classSet.add(c.trim());
    });

    const accessibleClasses = Array.from(classSet);

    const extractGrade = (str: string): string => {
      const s = str.trim().toLowerCase();
      if (s.includes("kelas 6") || s.includes("kls 6") || s === "6" || s === "vi" || s.startsWith("vi ") || s.startsWith("6 ")) return "6";
      if (s.includes("kelas 5") || s.includes("kls 5") || s === "5" || s === "v" || s.startsWith("v ") || s.startsWith("5 ")) return "5";
      if (s.includes("kelas 4") || s.includes("kls 4") || s === "4" || s === "iv" || s.startsWith("iv ") || s.startsWith("4 ")) return "4";
      if (s.includes("kelas 3") || s.includes("kls 3") || s === "3" || s === "iii" || s.startsWith("iii ") || s.startsWith("3 ")) return "3";
      if (s.includes("kelas 2") || s.includes("kls 2") || s === "2" || s === "ii" || s.startsWith("ii ") || s.startsWith("2 ")) return "2";
      if (s.includes("kelas 1") || s.includes("kls 1") || s === "1" || s === "i" || s.startsWith("i ") || s.startsWith("1 ")) return "1";
      if (s.includes("xii") || s.includes("12")) return "12";
      if (s.includes("xi") || s.includes("11")) return "11";
      if (s.includes("x") || s.includes("10")) return "10";
      return s;
    };

    const isClassAccessible = (kelasName: string): boolean => {
      if (!kelasName) return false;
      const target = kelasName.trim().toLowerCase();
      if (target === "semua" || target === "all") return true;

      // Exact match in accessibleClasses
      if (accessibleClasses.some((c) => c.trim().toLowerCase() === target)) return true;

      // Grade level match (e.g. "Kelas 6" matches "6", "VI", "Kelas 6 A")
      const targetGrade = extractGrade(target);
      return accessibleClasses.some((c) => {
        const cGrade = extractGrade(c);
        return cGrade.length > 0 && cGrade === targetGrade;
      });
    };

    const filterByClass = <T extends { kelas?: string }>(items: T[]): T[] => {
      return items.filter((item) => item.kelas && isClassAccessible(item.kelas));
    };

    // Determine assigned subjects for this teacher
    const rawSubjects = teacherProfile?.mataPelajaran || [];

    // Scheduled subjects from jadwalList for this teacher
    const scheduledSubjects = jadwalList
      .filter((j) => {
        if (!teacherProfile && !user?.name) return false;
        const tName = (teacherProfile?.nama || user?.name || "").toLowerCase();
        const jName = (j.guruNama || "").toLowerCase();
        return tName.includes(jName) || jName.includes(tName);
      })
      .map((j) => j.mapel);

    const candidateSubjectNames = rawSubjects.length > 0 ? rawSubjects : scheduledSubjects;

    // Match candidateSubjectNames with mapelList
    const matchedMapel = mapelList.filter((m) => {
      const mLower = m.nama.toLowerCase();
      return candidateSubjectNames.some((c) => {
        const cLower = c.toLowerCase();
        return cLower.includes(mLower) || mLower.includes(cLower);
      });
    });

    // Unmatched candidates can be synthesized as MataPelajaran entries
    const unmatchedCandidates = candidateSubjectNames.filter((c) => {
      const cLower = c.toLowerCase();
      return !matchedMapel.some((m) => {
        const mLower = m.nama.toLowerCase();
        return cLower.includes(mLower) || mLower.includes(cLower);
      });
    });

    const synthesizedMapel: MataPelajaran[] = unmatchedCandidates.map((c, idx) => ({
      id: `mpl-synth-${idx + 1}`,
      kode: c.substring(0, 3).toUpperCase(),
      nama: c,
      kategori: "Wajib",
      kkm: 75,
    }));

    let scopedMapelList = [...matchedMapel, ...synthesizedMapel];

    // Fallback if none matched
    if (scopedMapelList.length === 0) {
      scopedMapelList = mapelList.length > 0 ? [mapelList[0]] : [];
    }

    const assignedSubjects = scopedMapelList.map((m) => m.nama);

    const isSubjectAccessible = (mapelName: string): boolean => {
      if (!mapelName) return false;
      const target = mapelName.trim().toLowerCase();
      return assignedSubjects.some((subj) => {
        const s = subj.trim().toLowerCase();
        return s.includes(target) || target.includes(s);
      });
    };

    const filterBySubject = <T extends { mapel?: string }>(items: T[]): T[] => {
      return items.filter((item) => item.mapel && isSubjectAccessible(item.mapel));
    };

    return {
      isTeacher: true,
      isHomeroom: true,
      assignedClass,
      accessibleClasses,
      teacherProfile,
      teacherName: teacherProfile?.nama || user?.name || "Guru Pengampu",
      assignedSubjects,
      scopedMapelList,
      filterByClass,
      isClassAccessible,
      filterBySubject,
      isSubjectAccessible,
    };
  }, [user, guruList, kelasList, mapelList, jadwalList]);
}
