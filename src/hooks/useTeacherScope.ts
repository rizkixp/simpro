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
  filterByAssignedClass: <T extends { kelas?: string }>(items: T[]) => T[];
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

  // 4. Extract grade level (1-12, roman I-XII)
  const extractGrade = (s: string): string => {
    const romanMatch = s.match(/\b(xii|xi|ix|viii|vii|vi|iv|v|iii|ii|x|i)\b/i);
    if (romanMatch) {
      const map: Record<string, string> = {
        xii: "12", xi: "11", x: "10", ix: "9", viii: "8",
        vii: "7", vi: "6", v: "5", iv: "4", iii: "3", ii: "2", i: "1",
      };
      return map[romanMatch[1].toLowerCase()] || "";
    }
    const digitMatch = s.match(/(?:^|kelas\s*|kls\s*|\b)(1[0-2]|[1-9])(?:\b|[a-z]|\.|\-)/i);
    if (digitMatch) return digitMatch[1];
    return "";
  };

  const gradeA = extractGrade(normA);
  const gradeB = extractGrade(normB);

  // If both have explicit grades and they differ, never match (e.g. Kelas 1 vs Kelas 2)
  if (gradeA && gradeB && gradeA !== gradeB) return false;

  // 5. Extract section / rombel identifier (e.g. A, B, MIPA 1, IPS 2, 1, 2)
  const extractSection = (s: string, grade: string): string => {
    // 5a. Stream + number: e.g. MIPA 1, IPS 2, IPA 1, TKJ 2
    const streamMatch = s.match(/\b(mipa|ipa|ips|bahasa|keagamaan|tkj|rpl)\s*[\-_.]?\s*(\d+)\b/i);
    if (streamMatch) {
      return streamMatch[1].toLowerCase() + streamMatch[2];
    }

    // Stream prefix without number: e.g. X MIPA, XI IPS
    const streamOnlyMatch = s.match(/\b(mipa|ipa|ips|bahasa|keagamaan|tkj|rpl)\b/i);
    const streamPrefix = streamOnlyMatch ? streamOnlyMatch[1].toLowerCase() : "";

    // 5b. Single letter section right after grade number (e.g. 2A, 2-A, 2 A, 2.A)
    const digitLetterMatch = s.match(/(?:^|\b|kelas\s*|kls\s*)(?:1[0-2]|[1-9])\s*[\-_.]?\s*([a-z])\b/i);
    if (digitLetterMatch) {
      return streamPrefix ? streamPrefix + digitLetterMatch[1].toLowerCase() : digitLetterMatch[1].toLowerCase();
    }

    // Roman followed by letter: e.g. "vii-a", "vii a", "x-b"
    const romanLetterMatch = s.match(/\b(xii|xi|ix|viii|vii|vi|iv|v|iii|ii|x|i)\s*[\-_.]?\s*([a-z])\b/i);
    if (romanLetterMatch) {
      return streamPrefix ? streamPrefix + romanLetterMatch[2].toLowerCase() : romanLetterMatch[2].toLowerCase();
    }

    // 5c. Single letter at the very end (e.g. "... b", "...-b", "...- b")
    const endLetterMatch = s.match(/(?:^|[\s\-_0-9.])([a-z])\s*$/i);
    if (endLetterMatch) {
      return endLetterMatch[1].toLowerCase();
    }

    // 5d. Single digit at the very end or after dot/dash (e.g. "7.1", "10-2") if not the grade itself
    const endDigitMatch = s.match(/(?:^|[\s\-_.]|[a-z])(\d+)\s*$/i);
    if (endDigitMatch && endDigitMatch[1] !== grade) {
      return endDigitMatch[1];
    }

    return "";
  };

  const secA = extractSection(stripA, gradeA);
  const secB = extractSection(stripB, gradeB);

  // CRITICAL: If both have section identifiers and they differ, NEVER match!
  if (secA && secB && secA !== secB) {
    return false;
  }

  // Check major/stream conflict (e.g. "MIPA" vs "IPS")
  const isMipaA = stripA.includes("mipa");
  const isIpsA = stripA.includes("ips");
  const isMipaB = stripB.includes("mipa");
  const isIpsB = stripB.includes("ips");
  if ((isMipaA && isIpsB) || (isIpsA && isMipaB)) return false;

  // 6. Extract nickname / subtitle (e.g. "Abu Bakar", "Umar", "Al Khawarizmi")
  const extractNickname = (s: string): string => {
    const dashParts = s.split(/\s*-\s*/);
    if (dashParts.length > 1) {
      const candidate = dashParts.slice(1).join(" ").trim();
      if (candidate && candidate.length > 2) return candidate;
    }
    const parenMatch = s.match(/\(([^)]+)\)/);
    if (parenMatch) return parenMatch[1].trim();
    return "";
  };

  const nickA = extractNickname(normA);
  const nickB = extractNickname(normB);

  // If both have nicknames and they are completely different, they refer to parallel classes
  if (nickA && nickB && nickA !== nickB && !nickA.includes(nickB) && !nickB.includes(nickA)) {
    return false;
  }

  // If both have sections and sections match (e.g. "Kelas 2A - Al Khawarizmi" vs "Kelas 2A", or "2A" vs "2A"):
  if (secA && secB && secA === secB) {
    return true;
  }

  // If neither has section and both have the same grade (e.g. "Kelas 6" and "6"):
  if (!secA && !secB && gradeA && gradeB && gradeA === gradeB) {
    if (!nickA && !nickB) return true;
    if (nickA && nickB && (nickA === nickB || nickA.includes(nickB) || nickB.includes(nickA))) return true;
    const isPureGradeA = stripA === gradeA || stripA === `kelas ${gradeA}`;
    const isPureGradeB = stripB === gradeB || stripB === `kelas ${gradeB}`;
    if (isPureGradeA || isPureGradeB) return true;
    return false;
  }

  // If one has no section because it is purely a grade-level string (e.g. "Kelas 2" or "2"):
  const isPureGradeA = !secA && (stripA === gradeA || stripA === `kelas ${gradeA}`);
  const isPureGradeB = !secB && (stripB === gradeB || stripB === `kelas ${gradeB}`);
  if ((isPureGradeA || isPureGradeB) && gradeA && gradeB && gradeA === gradeB && !secA && !secB) {
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
        filterByAssignedClass: <T extends { kelas?: string }>(items: T[]) => items,
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

    // Canonicalize assignedClass with kelasList if an exact or matching class exists
    if (assignedClass && kelasList.length > 0) {
      const canonical = kelasList.find((k) => isClassMatch(k.nama, assignedClass));
      if (canonical) {
        assignedClass = canonical.nama;
      }
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

    const filterByAssignedClass = <T extends { kelas?: string }>(items: T[]): T[] => {
      if (!assignedClass) return items;
      return items.filter((item) => item.kelas && isClassMatch(item.kelas, assignedClass));
    };

    // Determine assigned subjects for this teacher
    const rawSubjects = teacherProfile?.mataPelajaran || [];

    // Scheduled subjects from jadwalList for this teacher
    const scheduledSubjects = jadwalList
      .filter((j) => {
        if (!teacherProfile && !user?.name) return false;
        const tName = normalizeTeacherName(teacherProfile?.nama || user?.name || "");
        const jName = normalizeTeacherName(j.guruNama || "");
        if (!jName || !tName || jName.length < 3 || tName.length < 3) return false;
        return tName === jName || tName.includes(jName) || jName.includes(tName);
      })
      .map((j) => j.mapel);

    const candidateSubjectNames = rawSubjects.length > 0 ? rawSubjects : scheduledSubjects;

    // Check if teacher is a general class teacher / homeroom teacher who manages all subjects
    const isGeneralTeacher =
      candidateSubjectNames.length === 0 ||
      candidateSubjectNames.some((c) => {
        const s = (c || "").toLowerCase().trim();
        return (
          s === "umum" ||
          s === "semua" ||
          s === "semua mapel" ||
          s === "semua mata pelajaran" ||
          s === "tematik" ||
          s === "guru kelas" ||
          s === "wali kelas" ||
          s === "wali" ||
          s.includes("guru kelas") ||
          s.includes("wali kelas")
        );
      });

    let scopedMapelList: MataPelajaran[];

    if (isGeneralTeacher) {
      // General class teachers / homeroom teachers have access to all registered subjects
      scopedMapelList = mapelList.length > 0 ? mapelList : [];
    } else {
      // Specific subject teacher
      const matchedMapel = mapelList.filter((m) => {
        const mLower = m.nama.toLowerCase().trim();
        return candidateSubjectNames.some((c) => {
          const cLower = c.toLowerCase().trim();
          return cLower === mLower || cLower.includes(mLower) || mLower.includes(cLower);
        });
      });

      if (matchedMapel.length > 0) {
        scopedMapelList = matchedMapel;
      } else {
        // If candidate subjects did not match any registered subject, fallback to all registered subjects
        scopedMapelList = mapelList.length > 0 ? mapelList : [];
      }
    }

    const assignedSubjects = scopedMapelList.map((m) => m.nama);

    const isSubjectAccessible = (mapelName: string): boolean => {
      if (!mapelName) return false;
      if (isGeneralTeacher) return true;
      const target = mapelName.trim().toLowerCase();
      if (target === "semua" || target === "all") return true;
      return assignedSubjects.some((subj) => {
        const s = subj.trim().toLowerCase();
        return s === target || s.includes(target) || target.includes(s);
      });
    };

    const filterBySubject = <T extends { mapel?: string }>(items: T[]): T[] => {
      if (isGeneralTeacher) return items;
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
      filterByAssignedClass,
      isClassAccessible,
      filterBySubject,
      isSubjectAccessible,
    };
  }, [user, guruList, kelasList, mapelList, jadwalList]);
}
