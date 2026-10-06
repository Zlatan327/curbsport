"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth";

export function useSchoolId() {
  const user = useAuthStore((state) => state.user);
  const [schoolId, setSchoolId] = useState<string>("1"); // Default to UNIZIK (Awka)

  useEffect(() => {
    // 1. Check logged in user's school
    if (user?.schoolId) {
      setSchoolId(String(user.schoolId));
      localStorage.setItem("inside-life-school-id", String(user.schoolId));
      return;
    }

    // 2. Fallback to localStorage
    const stored = localStorage.getItem("inside-life-school-id");
    if (stored) {
      setSchoolId(stored);
    }
  }, [user]);

  const updateSchoolId = (id: string) => {
    setSchoolId(id);
    localStorage.setItem("inside-life-school-id", id);
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
