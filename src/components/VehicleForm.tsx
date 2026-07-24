"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CAR_BRANDS, CUSTOM_OPTION } from "@/lib/carBrands";
import type { Vehicle } from "@/lib/data/vehicles";
import type { ApartmentComplex } from "@/lib/data/apartment-complexes";
import { DeleteVehicleModal } from "@/components/DeleteVehicleModal";
import { useToast } from "@/components/Toast";

type Props = {
  vehicle: Vehicle | null;
  isAdmin: boolean;
  apartmentComplexes: ApartmentComplex[];
  returnTo?: string;
};

function splitCarModel(carModel: string | null): { category: string; brand: string; model: string; brandCustom: string; modelCustom: string } {
  if (!carModel) return { category: "", brand: "", model: "", brandCustom: "", modelCustom: "" };
  for (const category of Object.keys(CAR_BRANDS)) {
    for (const brand of Object.keys(CAR_BRANDS[category])) {
      if (carModel === brand || carModel.startsWith(brand + " ")) {
        const rest = carModel === brand ? "" : carModel.slice(brand.length + 1);
        const models = CAR_BRANDS[category][brand];
        if (!rest) return { category, brand, model: "", brandCustom: "", modelCustom: "" };
        if (models.includes(rest)) return { category, brand, model: rest, brandCustom: "", modelCustom: "" };
        return { category, brand, model: CUSTOM_OPTION, brandCustom: "", modelCustom: rest };
      }
    }
  }
  return { category: "", brand: CUSTOM_OPTION, model: "", brandCustom: carModel, modelCustom: "" };
}

export function VehicleForm({ vehicle, isAdmin, apartmentComplexes, returnTo }: Props) {
  const router = useRouter();
  const showToast = useToast();
  const initial = splitCarModel(vehicle?.car_model ?? null);

  const [carNum, setCarNum] = useState(vehicle?.car_num ?? "");
  const [category, setCategory] = useState(initial.category);
  const [brand, setBrand] = useState(initial.brand);
  const [brandCustom, setBrandCustom] = useState(initial.brandCustom);
  const [model, setModel] = useState(initial.model);
  const [modelCustom, setModelCustom] = useState(initial.modelCustom);
  const [parkingLoc, setParkingLoc] = useState(vehicle?.parking_loc ?? "");
  const [paymentPlan, setPaymentPlan] = useState(vehicle?.payment_plan ?? "");
  const [washStatus, setWashStatus] = useState(vehicle?.wash_status ?? "");
  const [note, setNote] = useState(vehicle?.note ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);

  const brands = category ? Object.keys(CAR_BRANDS[category]) : [];
  const models = category && brand && brand !== CUSTOM_OPTION ? CAR_BRANDS[category][brand] ?? [] : [];

  function handleCategoryChange(next: string) {
    setCategory(next);
    setBrand("");
    setBrandCustom("");
    setModel("");
    setModelCustom("");
  }

  function handleBrandChange(next: string) {
    setBrand(next);
    setModel("");
    setModelCustom("");
    if (next !== CUSTOM_OPTION) setBrandCustom("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!carNum.trim()) {
      setError("차량 번호를 입력해주세요");
      return;
    }

    let carModel = "";
    if (brand === CUSTOM_OPTION) {
      carModel = brandCustom.trim();
    } else if (brand) {
      const modelName = model === CUSTOM_OPTION ? modelCustom.trim() : model;
      carModel = modelName ? `${brand} ${modelName}` : brand;
    }

    const payload = {
      car_num: carNum.trim(),
      car_model: carModel || null,
      ...(isAdmin
        ? {
            parking_loc: parkingLoc || null,
            payment_plan: paymentPlan || null,
            wash_status: washStatus || null,
            note: note.trim() || null,
          }
        : {}),
    };

    setPending(true);
    setError(null);
    const res = await fetch(vehicle ? `/api/vehicles/${vehicle.id}` : "/api/vehicles", {
      method: vehicle ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setPending(false);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "저장에 실패했습니다");
      return;
    }
    showToast(vehicle ? "✏️ 차량 정보가 수정되었습니다" : "✅ 차량이 등록되었습니다");
    router.push(!vehicle && returnTo ? returnTo : "/vehicles");
    router.refresh();
  }

  return (
    <>
      <div className="scroll">
        <form className="resv-body" style={{ paddingBottom: 100 }} onSubmit={handleSubmit}>
          <div className="mg-field">
            <label className="mg-label">차량 번호</label>
            <input
              className="mg-input"
              type="text"
              placeholder="예: 12가 3456"
              value={carNum}
              onChange={(e) => setCarNum(e.target.value)}
            />
          </div>
          <div className="mg-field">
            <label className="mg-label">차량 구분</label>
            <select className="mg-input" value={category} onChange={(e) => handleCategoryChange(e.target.value)}>
              <option value="">선택하세요</option>
              <option value="국산차">국산차</option>
              <option value="수입차">수입차</option>
            </select>
          </div>
          <div className="mg-field">
            <label className="mg-label">브랜드</label>
            <select className="mg-input" value={brand} onChange={(e) => handleBrandChange(e.target.value)} disabled={!category}>
              <option value="">{category ? "선택하세요" : "차량 구분을 먼저 선택하세요"}</option>
              {brands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
              {brands.length > 0 && <option value={CUSTOM_OPTION}>기타 (직접 입력)</option>}
            </select>
          </div>
          {brand === CUSTOM_OPTION && (
            <div className="mg-field">
              <input
                className="mg-input"
                type="text"
                placeholder="브랜드명을 입력하세요"
                value={brandCustom}
                onChange={(e) => setBrandCustom(e.target.value)}
              />
            </div>
          )}
          {brand && brand !== CUSTOM_OPTION && (
            <div className="mg-field">
              <label className="mg-label">차량명</label>
              <select className="mg-input" value={model} onChange={(e) => setModel(e.target.value)}>
                <option value="">선택하세요</option>
                {models.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
                <option value={CUSTOM_OPTION}>기타 (직접 입력)</option>
              </select>
            </div>
          )}
          {brand && brand !== CUSTOM_OPTION && model === CUSTOM_OPTION && (
            <div className="mg-field">
              <input
                className="mg-input"
                type="text"
                placeholder="차량명을 입력하세요"
                value={modelCustom}
                onChange={(e) => setModelCustom(e.target.value)}
              />
            </div>
          )}

          {isAdmin && (
            <>
              <div className="mg-field">
                <label className="mg-label">주차 위치</label>
                <select className="mg-input" value={parkingLoc} onChange={(e) => setParkingLoc(e.target.value)}>
                  <option value="">선택하세요</option>
                  {apartmentComplexes.map((a) => (
                    <option key={a.id} value={a.name}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mg-field">
                <label className="mg-label">결제여부</label>
                <select className="mg-input" value={paymentPlan} onChange={(e) => setPaymentPlan(e.target.value)}>
                  <option value="">선택하세요</option>
                  <option value="1회">1회</option>
                  <option value="주 1회 월 4회">주 1회 월 4회</option>
                  <option value="주 2회 월 8회">주 2회 월 8회</option>
                  <option value="격주진행 월 2회">격주진행 월 2회</option>
                </select>
              </div>
              <div className="mg-field">
                <label className="mg-label">세차 진행 상태</label>
                <select className="mg-input" value={washStatus ?? ""} onChange={(e) => setWashStatus(e.target.value)}>
                  <option value="">상태 없음</option>
                  <option value="washing">세차중</option>
                  <option value="done">세차완료</option>
                </select>
              </div>
              <div className="mg-field" style={{ marginBottom: 8 }}>
                <label className="mg-label">특이사항</label>
                <input
                  className="mg-input"
                  type="text"
                  placeholder="특이사항을 입력하세요"
                  value={note ?? ""}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            </>
          )}

          {error && <div style={{ color: "#dc2626", fontSize: 13, marginBottom: 12 }}>{error}</div>}

          {vehicle && (
            <div className="mg-field" style={{ textAlign: "center", marginTop: 8 }}>
              <button type="button" className="veh-delete-link" onClick={() => setDeleteTarget(vehicle)}>
                🗑 차량 삭제
              </button>
            </div>
          )}
        </form>
      </div>

      <div className="vw-bottom-cta">
        <button className="vw-cta-btn" onClick={handleSubmit} disabled={pending}>
          {pending ? "저장 중..." : "저장"}
        </button>
      </div>

      <DeleteVehicleModal
        vehicle={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={() => {
          router.push("/vehicles");
          router.refresh();
        }}
      />
    </>
  );
}
