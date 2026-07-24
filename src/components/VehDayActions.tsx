"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ApartmentComplexModal } from "@/components/ApartmentComplexModal";

export function VehDayActions() {
  const router = useRouter();
  const [aptModalOpen, setAptModalOpen] = useState(false);

  return (
    <>
      <div className="resv-list-header" style={{ justifyContent: "flex-start", gap: 8 }}>
        <button className="resv-add-btn" onClick={() => router.push("/vehicles/new")}>
          + 차량 등록하기
        </button>
        <button className="resv-add-btn" onClick={() => setAptModalOpen(true)}>
          + 아파트 단지 등록
        </button>
      </div>
      <ApartmentComplexModal open={aptModalOpen} onClose={() => setAptModalOpen(false)} />
    </>
  );
}
