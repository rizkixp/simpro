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

/**
 * Checks whether two class strings refer to the same specific class/rombel.
 * Prevents parallel sections (e.g. 2A vs 2B, X MIPA 1 vs X MIPA 2) from cross-matching.
 */
export function isClassMatch(classA?: string | null, classB?: string | null): boolean {
  if (!classA || !classB) return false;
  const a = classA.trim().toLowerCase();
  const b = classB.trim().toLowerCase();
  if (a === "semua" || a === "all" || b === "semua" || b === "all") return true;

  // 1. Direct match
  if (a === b) return true;

  // 2. Normalize dashes (en-dash, em-dash, figure dash, hyphen) and collapse multiple spaces
  const normA = a.replace(/[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D–—]/g, "-").replace(/\s+/g, " ").trim();
  const normB = b.replace(/[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D–—]/g, "-").replace(/\s+/g, " ").trim();
  if (normA === normB) return true;

  // 3. Strip leading 'kelas' or 'kls'
  const stripA = normA.replace(/^(kelas|kls)\s+/i, "").trim();
  const stripB = normB.replace(/^(kelas|kls)\s+/i, "").trim();
  if (stripA === stripB) return true;

  // 4. Extract grade number
  const extractGradeNumber = (s: string): string => {
    if (s.includes("kelas 6") || s.includes("kls 6") || s === "6" || s === "vi" || s.startsWith("vi ") || s.startsWith("6 ") || s.startsWith("6-") || s.startsWith("vi-")) return "6";
    if (s.includes("kelas 5") || s.includes("kls 5") || s === "5" || s === "v" || s.startsWith("v ") || s.startsWith("5 ") || s.startsWith("5-") || s.startsWith("v-")) return "5";
    if (s.includes("kelas 4") || s.includes("kls 4") || s === "4" || s === "iv" || s.startsWith("iv ") || s.startsWith("4 ") || s.startsWith("4-") || s.startsWith("iv-")) return "4";
    if (s.includes("kelas 3") || s.includes("kls 3") || s === "3" || s === "iii" || s.startsWith("iii ") || s.startsWith("3 ") || s.startsWith("3-") || s.startsWith("iii-")) return "3";
    if (s.includes("kelas 2") || s.includes("kls 2") || s === "2" || s === "ii" || s.startsWith("ii ") || s.startsWith("2 ") || s.startsWith("2-") || s.startsWith("ii-") || s.startsWith("2")) return "2";
    if (s.includes("kelas 1") || s.includes("kls 1") || s === "1" || s === "i" || s.startsWith("i ") || s.startsWith("1 ") || s.startsWith("1-") || s.startsWith("i-") || s.startsWith("1")) return "1";
    if (s.includes("xii") || s.includes("12")) return "12";
    if (s.includes("xi") || s.includes("11")) return "11";
    if (s.includes("x") || s.includes("10")) return "10";
    return "";
  };

  const gradeA = extractGradeNumber(normA);
  const gradeB = extractGradeNumber(normB);

  // If both have different grade numbers, they never match
  if (gradeA && gradeB && gradeA !== gradeB) return false;

  // 5. Extract section/rombel identifier (e.g. A, B, C, 1, 2)
  const extractSection = (s: string, grade: string): string => {
    // If the string is purely the grade itself (e.g. "6" or "vi"), it does not have a section
    if (s === grade || s === `kelas ${grade}`) return "";

    // Check single letter at end (e.g. "... b", "...-b", "...- b", "2b")
    const letterMatch = s.match(/(?:^|[\s\-_0-9])([a-z])\s*$/i);
    if (letterMatch) return letterMatch[1].toLowerCase();

    // Check single digit at end (e.g. "mipa 1", "mipa-2")
    const digitMatch = s.match(/(?:^|[\s\-_])([0-9]+)\s*$/i);
    if (digitMatch && digitMatch[1] !== grade) return digitMatch[1].toLowerCase();

    return "";
  };

  const sectionA = extractSection(stripA, gradeA);
  const sectionB = extractSection(stripB, gradeB);

  // CRITICAL: If both have a section identifier and they are different, NEVER match!
  if (sectionA && sectionB && sectionA !== sectionB) {
    return false;
  }

  // If both have section identifiers and they match:
  if (sectionA && sectionB && sectionA === sectionB) {
    if (gradeA && gradeB && gradeA !== gradeB) return false;

    // Check major/stream conflict (e.g. "MIPA" vs "IPS")
    const isMipaA = stripA.includes("mipa");
    const isIpsA = stripA.includes("ips");
    const isMipaB = stripB.includes("mipa");
    const isIpsB = stripB.includes("ips");
    if ((isMipaA && isIpsB) || (isIpsA && isMipaB)) return false;

    return true;
  }

  // If neither has a section identifier and both have the same grade (e.g. "Kelas 6" and "6"):
  if (!sectionA && !sectionB && gradeA && gradeB && gradeA === gradeB) {
    return true;
  }

  // If one has no section because it is purely a grade-level string (e.g. "Kelas 2" or "2"):
  const isPureGradeA = !sectionA && (stripA === gradeA || stripA === `kelas ${gradeA}`);
  const isPureGradeB = !sectionB && (stripB === gradeB || stripB === `kelas ${gradeB}`);
  if ((isPureGradeA || isPureGradeB) && gradeA && gradeB && gradeA === gradeB) {
    return true;
  }

  return false;
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

    const normalizeTeacherName = (name: string): string => {
      return (name || "")
        .toLowerCase()
        .replace(/\b(drs|dra|h|hj|prof|dr|ir|s\.pd|s\.pd\.i|s\.si|m\.pd|m\.si|m\.ag|ph\.d|lc)\b\.?/gi, "")
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    };

    // Collect all accessible classes for this teacher (homeroom + scheduled classes)
    const scheduledClasses = jadwalList
      .filter((j) => {
        if (!teacherProfile && !user?.name) return false;
        const tName = normalizeTeacherName(teacherProfile?.nama || user?.name || "");
        const jName = normalizeTeacherName(j.guruNama || "");
        if (!jName || !tName || jName.length < 3 || tName.length < 3) return false;
        return tName === jName || tName.includes(jName) || jName.includes(tName);
      })
      .map((j) => j.kelas);

    const classSet = new Set<string>();
    if (assignedClass) classSet.add(assignedClass);
    scheduledClasses.forEach((c) => {
      if (c && c.trim()) classSet.add(c.trim());
    });

    const accessibleClasses = Array.from(classSet);

    const isClassAccessible = (kelasName: string): boolean => {
      if (!kelasName) return false;
      const target = kelasName.trim().toLowerCase();
      if (target === "semua" || target === "all") return true;

      return accessibleClasses.some((c) => isClassMatch(c, target));
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
