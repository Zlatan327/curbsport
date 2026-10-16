"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth";

export interface Campus {
  id: number;
  name: string;
  shortName: string;
  state: string;
  pitchesCount?: number;
}

export const CAMPUS_LIST: Campus[] = [
  { id: 6, name: "UNIZIK (Awka)", shortName: "UNIZIK", state: "Anambra", pitchesCount: 9 },
  { id: 9, name: "UNILAG (Akoka)", shortName: "UNILAG", state: "Lagos", pitchesCount: 18 },
  { id: 12, name: "University of Ibadan (UI)", shortName: "UI", state: "Oyo", pitchesCount: 19 },
  { id: 13, name: "OAU (Ile-Ife)", shortName: "OAU", state: "Osun", pitchesCount: 13 },
  { id: 11, name: "UNN (Nsukka)", shortName: "UNN", state: "Enugu", pitchesCount: 7 },
  { id: 10, name: "ABU (Zaria)", shortName: "ABU", state: "Kaduna", pitchesCount: 7 },
  { id: 14, name: "Covenant University (Ota)", shortName: "Covenant", state: "Ogun", pitchesCount: 8 },
  { id: 16, name: "UNIBEN (Ugbowo)", shortName: "UNIBEN", state: "Edo", pitchesCount: 6 },
  { id: 15, name: "UNILORIN (Ilorin)", shortName: "UNILORIN", state: "Kwara", pitchesCount: 6 },
  { id: 17, name: "BUK (New Campus)", shortName: "BUK", state: "Kano", pitchesCount: 8 },
  { id: 18, name: "FUT Minna (Gidan Kwano)", shortName: "FUT Minna", state: "Niger", pitchesCount: 6 },
  { id: 4, name: "COOU (Igbariam)", shortName: "COOU", state: "Anambra", pitchesCount: 3 },
  { id: 1, name: "Fed Poly Oko", shortName: "Oko Poly", state: "Anambra", pitchesCount: 3 },
  { id: 5, name: "COOU (Uli)", shortName: "COOU Uli", state: "Anambra", pitchesCount: 1 },
  { id: 2, name: "Paul University (Awka)", shortName: "Paul Uni", state: "Anambra", pitchesCount: 1 },
  { id: 3, name: "Nwafor Orizu COE (Nsugbe)", shortName: "NOCEN", state: "Anambra", pitchesCount: 1 },
  { id: 7, name: "Tansian University (Umunya)", shortName: "Tansian", state: "Anambra", pitchesCount: 1 },
  { id: 8, name: "Madonna University (Okija)", shortName: "Madonna", state: "Anambra", pitchesCount: 1 },
];

export function useSchoolId() {
  const user = useAuthStore((state) => state.user);
  // UNIZIK (Awka) is ID 6 in Postgres database. Default to 6.
  const [schoolId, setSchoolId] = useState<string>("6");

  const SCHOOL_ID_KEY = "curbsport-school-id";
  const LEGACY_SCHOOL_ID_KEY = "inside-life-school-id";

  useEffect(() => {
    // 1. Check logged in user's school
    if (user?.schoolId) {
      const uSchool = String(user.schoolId);
      setSchoolId(uSchool);
      localStorage.setItem(SCHOOL_ID_KEY, uSchool);
      localStorage.setItem(LEGACY_SCHOOL_ID_KEY, uSchool);
      return;
    }

    // 2. Check localStorage
    const stored = localStorage.getItem(SCHOOL_ID_KEY) || localStorage.getItem(LEGACY_SCHOOL_ID_KEY);
    if (stored) {
      // Migrate legacy bug where 1 was mistakenly set as UNIZIK
      if (stored === "1" && !localStorage.getItem("curbsport-oko-explicit")) {
        setSchoolId("6");
        localStorage.setItem(SCHOOL_ID_KEY, "6");
        localStorage.setItem(LEGACY_SCHOOL_ID_KEY, "6");
      } else {
        setSchoolId(stored);
      }
    } else {
      setSchoolId("6");
      localStorage.setItem(SCHOOL_ID_KEY, "6");
    }
  }, [user]);

  // Listen to campus changes from other components
  useEffect(() => {
    const handleCampusChange = (e: CustomEvent<string>) => {
      if (e.detail && e.detail !== schoolId) {
        setSchoolId(e.detail);
      }
    };
    window.addEventListener("curbsport:campus_change" as any, handleCampusChange as any);
    return () => {
      window.removeEventListener("curbsport:campus_change" as any, handleCampusChange as any);
    };
  }, [schoolId]);

  const updateSchoolId = (id: string) => {
    setSchoolId(id);
    localStorage.setItem(SCHOOL_ID_KEY, id);
    localStorage.setItem(LEGACY_SCHOOL_ID_KEY, id);
    if (id === "1") {
      localStorage.setItem("curbsport-oko-explicit", "true");
    } else {
      localStorage.removeItem("curbsport-oko-explicit");
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("curbsport:campus_change", { detail: id }));
    }
  };

  // Derive the school name and shortName for the UI
  const matchedCampus = CAMPUS_LIST.find((c) => String(c.id) === String(schoolId));
  let schoolName = matchedCampus?.name || user?.school?.name || "UNIZIK (Awka)";
  let shortName = matchedCampus?.shortName || schoolName.split(" ")[0];

  return { schoolId, schoolName, shortName, updateSchoolId, campuses: CAMPUS_LIST };
}
