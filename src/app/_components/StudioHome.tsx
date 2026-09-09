"use client";
import { StudioHeader } from "@/components/detail-studio/StudioHeader";

import Link from "next/link";
import Image from "next/image";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusIcon } from "@/components/ui/icons";
import { useEffect, useState } from "react";
import {
  PROJECT_PREFIX,
  projectHref,
  readProject,
  type ProjectRecord,
} from "@/components/detail-studio/studio-projects";
import "@/components/detail-studio/contract-studio.css";
import "./studio-home.css";

const samples: ProjectRecord[] = [
  {
    id: "sample-metal",
    title: "메탈 티웨어 오브제 세트",
    kind: "metal",
    status: "draft",
    thumbnail: "/converted-detail/images/image-1-640.webp",
    updatedAt: "",
    payload: null,
  },
  {
    id: "sample-car",
    title: "블랙 SUV",
    kind: "car",
    status: "draft",
    thumbnail: "/car-detail/images/car-640.webp",
    updatedAt: "",
    payload: null,
  },
];
export function StudioHome() {
  const [projects, setProjects] = useState<ProjectRecord[]>(samples);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  useEffect(() => {
    function load() {
      const records = new Map(samples.map((item) => [item.id, item]));
      let failed = false;
      try {
        for (let index = 0; index < localStorage.length; index++) {
          const key = localStorage.key(index);
          if (!key?.startsWith(PROJECT_PREFIX)) continue;
          try {
            const record = readProject(key.slice(PROJECT_PREFIX.length));
            if (record) records.set(record.id, record);
          } catch {
            failed = true;
          }
        }
      } catch {
        failed = true;
      }
      setProjects(
        [...records.values()].sort((a, b) =>
          b.updatedAt.localeCompare(a.updatedAt),
        ),
      );
      setError(
        failed
          ? "일부 저장된 작업을 읽지 못했습니다. 다른 작업은 계속 열 수 있습니다."
          : "",
      );
    }
    const timer = setTimeout(load, 0);
    window.addEventListener("storage", load);
    window.addEventListener("pageshow", load);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("storage", load);
      window.removeEventListener("pageshow", load);
    };
  }, []);
  const visible = projects.filter(
    (item) =>
      filter === "all" ||
      (filter === "published"
        ? item.status === "published"
        : item.status !== "published"),
  );
  return (
    <main className="cs-shell sh-shell">
      <StudioHeader />
      <div className="cs-body">
        <section className="sh-hero">
          <div>
            <span className="cs-overline">MY CREATIVE STUDIO</span>
            <h1>
              작품의 이야기가
              <br />
              쌓이는 작업실.
            </h1>
            <p>
              만들어 둔 상세페이지를 살펴보고,
              <br />
              멈췄던 곳에서 이야기를 이어가세요.
            </p>
            <Link
              className={`${buttonVariants({ size: "s", variant: "solid" })} sh-create`}
              href="/seller/products/new"
            >
              새 상세페이지 만들기{" "}
              <PlusIcon aria-hidden="true" className="[&_path]:fill-current" />
            </Link>
          </div>
          <div className="sh-hero-art">
            <span>
              YOUR NEXT
              <br />
              CHAPTER
            </span>
            <div className="sh-paper">
              <small>MIDAM COLLECTION</small>
              <Image
                src="/converted-detail/images/image-1-640.webp"
                alt="메탈 티웨어 상세페이지 예시"
                width={260}
                height={200}
              />
              <strong>
                한 점의 작품,
                <br />
                하나의 이야기.
              </strong>
            </div>
            <i>
              사진에서 시작되는
              <br />
              나만의 상세페이지
            </i>
          </div>
        </section>
        <section aria-labelledby="projects-heading" className="sh-projects">
          <div className="sh-project-heading">
            <div>
              <span className="cs-overline">YOUR PAGES</span>
              <h2 id="projects-heading">
                제작한 상세페이지 <small>{projects.length}</small>
              </h2>
            </div>
            <p>이 브라우저에 저장한 작업을 모았어요.</p>
          </div>
          <div className="sh-filters" aria-label="작업 상태 필터">
            {[
              ["all", "전체"],
              ["draft", "편집 중"],
              ["published", "게시 중"],
            ].map(([value, label]) => (
              <Button
                size="s"
                variant={filter === value ? "solid" : "outline"}
                key={value}
                aria-pressed={filter === value}
                onClick={() => setFilter(value)}
              >
                {label}
              </Button>
            ))}
          </div>
          {error && (
            <p role="alert" className="cs-error">
              {error}
            </p>
          )}
          <div className="sh-grid">
            {visible.map((item) => (
              <Link className="sh-card" key={item.id} href={projectHref(item)}>
                <div className="sh-thumbnail">
                  <Image
                    src={
                      /^(\/[^/]|data:image\/(png|jpeg|webp);base64,)/.test(
                        item.thumbnail,
                      )
                        ? item.thumbnail
                        : "/converted-detail/images/image-1-640.webp"
                    }
                    alt={item.title}
                    fill
                    unoptimized
                    sizes="(max-width: 640px) 100vw, 33vw"
                  />
                  <Badge
                    variant={item.status === "published" ? "jade" : "solid"}
                  >
                    {item.status === "published" ? "게시 중" : "편집 중"}
                  </Badge>
                </div>
                <div className="sh-card-body">
                  <small>
                    {item.kind === "input" ? "나의 작품" : "예시 작품"}
                  </small>
                  <h3>{item.title}</h3>
                  <p>
                    {item.updatedAt
                      ? `${new Date(item.updatedAt).toLocaleDateString("ko-KR")} 저장`
                      : "클릭해서 예시를 편집해 보세요"}
                    <span>↗</span>
                  </p>
                </div>
              </Link>
            ))}
          </div>
          {!visible.length && (
            <div className="sh-empty">
              아직 이 단계의 작업이 없어요. 상세페이지를 완성하면 여기에
              표시됩니다.
            </div>
          )}
        </section>
        <footer className="cs-footer">
          <span>
            MIDAM <i>작품의 내력을, 일상의 가치로.</i>
          </span>
          <span>프로토타입 · 현재 브라우저에 저장됩니다.</span>
        </footer>
      </div>
    </main>
  );
}
