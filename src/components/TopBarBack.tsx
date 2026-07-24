import Link from "next/link";

type Props = {
  title: string;
  backHref?: string;
};

export function TopBarBack({ title, backHref = "/" }: Props) {
  return (
    <div className="topbar">
      <Link href={backHref} className="tb-back" aria-label="뒤로">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </Link>
      <div className="tb-center">{title}</div>
      <div className="tb-spacer" />
    </div>
  );
}
