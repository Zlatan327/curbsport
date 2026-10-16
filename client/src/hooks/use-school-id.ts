"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth";

export function useSchoolId() {
  const user = useAuthStore((state) => state.user);
  const [schoolId, setSchoolId] = useState<string>("1"); // Default to UNIZIK (Awka)

  const SCHOOL_ID_KEY = "curbsport-school-id";
  const LEGACY_SCHOOL_ID_KEY = "inside-life-school-id";

  useEffect(() => {
    // 1. Check logged in user's school
    if (user?.schoolId) {
      setSchoolId(String(user.schoolId));
      localStorage.setItem(SCHOOL_ID_KEY, String(user.schoolId));
      localStorage.setItem(LEGACY_SCHOOL_ID_KEY, String(user.schoolId));
      return;
    }

    // 2. Fallback to localStorage (check new key then legacy key)
    const stored = localStorage.getItem(SCHOOL_ID_KEY) || localStorage.getItem(LEGACY_SCHOOL_ID_KEY);
    if (stored) {
      setSchoolId(stored);
    }
  }, [user]);

  const updateSchoolId = (id: string) => {
    setSchoolId(id);
    localStorage.setItem(SCHOOL_ID_KEY, id);
    localStorage.setItem(LEGACY_SCHOOL_ID_KEY, id);
  };

  // Derive the school name for the UI
  let schoolName = "UNIZIK (Awka)"; // default
  if (user?.school?.name) {
    schoolName = user.school.name;
  } else if (schoolId !== "1") {
    schoolName = `Campus ${schoolId}`; // fallback if not 1 and not logged in
  }

  return { schoolId, schoolName, updateSchoolId };
}
