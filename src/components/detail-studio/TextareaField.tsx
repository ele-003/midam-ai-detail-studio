"use client";

import { useId } from "react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TextareaFieldProps extends ComponentProps<"textarea"> {
  label: ReactNode;
  helperText?: ReactNode;
  error?: string;
}

/** 긴 작품 설명과 JSON 입력에 공통 입력 토큰을 적용한다. */
export function TextareaField({
  label,
  helperText,
  error,
  id,
  className,
  ...props
}: TextareaFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const descriptionId = `${inputId}-description`;
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <label htmlFor={inputId} className="text-caption text-font-label">
        {label}
      </label>
      <textarea
        {...props}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          [
            props["aria-describedby"],
            error || helperText ? descriptionId : undefined,
          ]
            .filter(Boolean)
            .join(" ") || undefined
        }
        className={cn(
          "min-h-24 w-full resize-y rounded-none border border-(--textfield-border) bg-bg-default px-3 py-3 text-body-m text-font-dark outline-none placeholder:text-(--textfield-font-weak) focus:border-(--textfield-border-selected) focus:ring-1 focus:ring-border-jade-fill disabled:cursor-not-allowed disabled:opacity-40",
          error && "border-red-border",
          className,
        )}
      />
      {(error || helperText) && (
        <p
          id={descriptionId}
          className={cn(
            "text-caption text-font-dark-subtle",
            error && "text-red-font",
          )}
        >
          {error || helperText}
        </p>
      )}
    </div>
  );
}
