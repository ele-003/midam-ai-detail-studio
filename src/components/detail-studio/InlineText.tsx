"use client";
import type { KeyboardEvent, MouseEvent } from "react";
import { useLayoutEffect, useRef } from "react";

export function InlineText({
  id,
  value,
  onCommit,
  onColor,
  onPending,
}: {
  id: string;
  value: string;
  onCommit: (value: string) => boolean;
  onPending: (pending: boolean) => void;
  onColor: (
    event: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>,
  ) => void;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const latest = useRef(value);
  useLayoutEffect(() => {
    latest.current = value;
    if (ref.current && ref.current.textContent !== value)
      ref.current.textContent = value;
  }, [value]);
  return (
    <span
      ref={ref}
      data-text-id={id}
      className="ie-text"
      role="textbox"
      aria-label="상세페이지 문구"
      aria-multiline="true"
      contentEditable="plaintext-only"
      suppressContentEditableWarning
      onInput={() => onPending(true)}
      onBlur={(event) => {
        const text = event.currentTarget.innerText.replace(/\r\n/g, "\n");
        if (text !== latest.current && !onCommit(text))
          event.currentTarget.textContent = latest.current;
        onPending(false);
      }}
      onContextMenu={onColor}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.currentTarget.textContent = latest.current;
          event.currentTarget.blur();
        }
        if (
          event.key === "ContextMenu" ||
          (event.shiftKey && event.key === "F10")
        )
          onColor(event);
      }}
    />
  );
}
