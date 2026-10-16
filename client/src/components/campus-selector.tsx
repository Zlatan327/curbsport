"use client";

import { useState, useMemo } from "react";
import { Building2, Check, ChevronDown, Compass, MapPin, Search, X } from "lucide-react";
import { useSchoolId, CAMPUS_LIST, type Campus } from "@/hooks/use-school-id";

export function CampusSelector() {
  const { schoolId, schoolName, updateSchoolId } = useSchoolId();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredCampuses = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return CAMPUS_LIST;
    return CAMPUS_LIST.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.shortName.toLowerCase().includes(q) ||
        c.state.toLowerCase().includes(q)
    );
  }, [search]);

  const activeCampus = CAMPUS_LIST.find((c) => String(c.id) === String(schoolId));

  function handleSelect(campus: Campus) {
    updateSchoolId(String(campus.id));
    setIsOpen(false);
    setSearch("");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="campus-selector-pill"
        title="Switch university ground radar"
        aria-label="Switch campus"
      >
        <Compass size={14} className="campus-selector-pill__icon" />
        <span className="campus-selector-pill__name">{activeCampus?.name || schoolName}</span>
        <span className="campus-selector-pill__count">{activeCampus?.pitchesCount ?? 9} spots</span>
        <ChevronDown size={14} className="campus-selector-pill__arrow" />
      </button>

      {isOpen && (
        <div className="campus-modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="campus-modal" onClick={(e) => e.stopPropagation()}>
            <div className="campus-modal__header">
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Building2 size={18} style={{ color: "#00f076" }} />
                <div>
                  <p className="eyebrow" style={{ margin: 0 }}>CAMPUS GROUND NETWORK</p>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800 }}>CHOOSE YOUR CAMPUS</h3>
                </div>
              </div>
              <button
                type="button"
                className="campus-modal__close"
                onClick={() => setIsOpen(false)}
                aria-label="Close campus selector"
              >
                <X size={18} />
              </button>
            </div>

            <div className="campus-modal__search">
              <Search size={15} style={{ color: "#888" }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search university, campus or state…"
                autoFocus
              />
            </div>

            <div className="campus-modal__list">
              {filteredCampuses.map((campus) => {
                const isActive = String(campus.id) === String(schoolId);
                return (
                  <button
                    key={campus.id}
                    type="button"
                    onClick={() => handleSelect(campus)}
                    className={`campus-modal__item${isActive ? " is-active" : ""}`}
                  >
                    <div className="campus-modal__item-info">
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <strong>{campus.name}</strong>
                        {isActive && <Check size={14} style={{ color: "#00f076" }} />}
                      </div>
                      <small>
                        <MapPin size={11} style={{ display: "inline", verticalAlign: "-1px", marginRight: "3px" }} />
                        {campus.state} • {campus.shortName}
                      </small>
                    </div>
                    <span className="campus-modal__item-badge">
                      {campus.pitchesCount ?? 0} grounds
                    </span>
                  </button>
                );
              })}

              {filteredCampuses.length === 0 && (
                <div style={{ padding: "24px 12px", textAlign: "center", color: "#888", fontSize: "0.85rem" }}>
                  No campus found matching &ldquo;{search}&rdquo;. You can add any ground from the Add tab.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
