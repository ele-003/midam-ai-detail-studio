export function StudioSteps({ current }: { current: number }) {
  return (
    <nav className="cs-steps" aria-label="상세페이지 제작 단계">
      {["작품 정보 입력", "생성 중", "초안 확인 · 편집", "최종 결과 확인"].map(
        (label, index) => (
          <div
            key={label}
            className={
              index === current
                ? "is-current"
                : index < current
                  ? "is-complete"
                  : ""
            }
            aria-current={index === current ? "step" : undefined}
          >
            <span>{index < current ? "✓" : `0${index + 1}`}</span>
            <strong>{label}</strong>
            {index < 3 && <i aria-hidden="true">›</i>}
          </div>
        ),
      )}
    </nav>
  );
}
