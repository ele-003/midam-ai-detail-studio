import Link from "next/link";
import type { ReactNode } from "react";

interface StudioHeaderProps {
  children?: ReactNode;
}

export function StudioHeader({ children }: StudioHeaderProps) {
  return (
    <header className="cs-header">
      <Link className="cs-brand" href="/" aria-label="미담 작업실 홈">
        미담<span>MIDAM</span>
      </Link>
      <span className="cs-header-divider" />
      <span className="cs-seller-label">판매자 스튜디오</span>
      <div className="cs-header-right">
        <Link href="/">나의 작업실</Link>
        {children}
        <span className="cs-avatar" aria-hidden="true">
          M
        </span>
      </div>
    </header>
  );
}
