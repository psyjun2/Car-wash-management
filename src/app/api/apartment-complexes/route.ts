import { NextResponse } from "next/server";
import { getServerUser, getIsAdmin } from "@/lib/auth/session";
import { listApartmentComplexes, createApartmentComplex } from "@/lib/data/apartment-complexes";

export async function GET() {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  const isAdmin = await getIsAdmin(user);
  if (!isAdmin) return NextResponse.json({ error: "관리자만 가능합니다" }, { status: 403 });

  const complexes = await listApartmentComplexes();
  return NextResponse.json({ complexes });
}

export async function POST(request: Request) {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  const isAdmin = await getIsAdmin(user);
  if (!isAdmin) return NextResponse.json({ error: "관리자만 가능합니다" }, { status: 403 });

  const { name } = (await request.json()) as { name?: string };
  if (!name?.trim()) return NextResponse.json({ error: "단지명을 입력해주세요" }, { status: 400 });

  try {
    const complex = await createApartmentComplex(name.trim());
    return NextResponse.json({ complex }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
