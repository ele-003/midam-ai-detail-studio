"use client";
import "./product-detail.css";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

import { DEMO_PRODUCT_INFORMATION as productInfo } from "./demo-product-information";
import type { StudioAsset } from "./studio-contract";

const formatPrice = (amount: number) => `${amount.toLocaleString("ko-KR")}원`;

function Icon({ name, size = 24 }: { name: string; size?: number }) {
  return (
    <Image
      loading="eager"
      className="pd-icon"
      src={`/product-design/${name}.svg`}
      alt=""
      width={size}
      height={size}
      unoptimized
    />
  );
}
function Disclosure({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <details className="pd-disclosure">
      <summary>
        {label}
        <Icon name="imgIconChevronDown" />
      </summary>
      <div>{children}</div>
    </details>
  );
}
const tabs = [
  ["product-information", "상품정보"],
  ["product-notices", "유의사항"],
  ["product-delivery", "배송안내"],
  ["product-reviews", "리뷰/문의"],
];
const placeholder = "/product-design/imgFrame83.png";

export function ProductDetailView({
  title,
  summary,
  assets,
  detail,
  published,
  error,
  onEdit,
  onPublish,
}: {
  title: string;
  summary: string;
  assets: StudioAsset[];
  detail: ReactNode;
  published: boolean;
  error: string;
  onEdit: () => void;
  onPublish: () => void;
}) {
  const [selected, setSelected] = useState(0);
  const [liked, setLiked] = useState(false);
  const [activeTab, setActiveTab] = useState(tabs[0][0]);
  const [options, setOptions] = useState(
    productInfo.optionGroups.map((group) => group.defaultChoice),
  );
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const [lightbox, setLightbox] = useState(false);
  const [inquiry, setInquiry] = useState(false);
  const [author, setAuthor] = useState(false);
  const lightboxRef = useRef<HTMLDialogElement>(null);
  const inquiryRef = useRef<HTMLDialogElement>(null);
  const image = assets[selected] ?? assets[0];
  const choices = productInfo.optionGroups.map((group, index) =>
    group.choices.find((choice) => choice.id === options[index]),
  );
  const requiredSelected = productInfo.optionGroups.every(
    (group, index) => !group.required || !!choices[index],
  );
  const totalPrice =
    (productInfo.price +
      choices.reduce((sum, choice) => sum + (choice?.priceDelta ?? 0), 0)) *
    quantity;
  const shippingFee =
    totalPrice >= productInfo.freeShippingThreshold
      ? 0
      : productInfo.shippingFee;
  useEffect(() => {
    if (lightbox) lightboxRef.current?.showModal();
    else lightboxRef.current?.close();
  }, [lightbox]);
  useEffect(() => {
    if (inquiry) inquiryRef.current?.showModal();
    else inquiryRef.current?.close();
  }, [inquiry]);
  const notify = (text: string) => setMessage(text);
  function purchase() {
    if (!requiredSelected) {
      notify("필수 옵션을 선택해 주세요.");
      return;
    }
    notify("구매 기능은 서비스 연결 후 사용할 수 있습니다.");
  }
  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      notify(
        "링크를 복사했습니다. 현재 작업은 이 브라우저에서만 확인할 수 있습니다.",
      );
    } catch {
      notify("주소창의 링크를 복사해 주세요.");
    }
  }
  return (
    <main className="pd-page" aria-label="상품 상세페이지">
      <header className="pd-header">
        <div className="pd-header-main">
          <div className="pd-header-spacer" />
          <Link href="/" className="pd-logo" aria-label="미담 작업실 홈">
            미담
          </Link>
          <div className="pd-header-icons">
            <Link href="/" aria-label="나의 작업실">
              <Icon name="imgIcons3" size={32} />
            </Link>
            <button
              aria-label="검색"
              onClick={() =>
                notify("상품 검색은 서비스 연결 후 사용할 수 있습니다.")
              }
            >
              <Icon name="imgIcons4" size={32} />
            </button>
            <button
              aria-label="장바구니 열기"
              onClick={() =>
                notify("장바구니는 서비스 연결 후 사용할 수 있습니다.")
              }
            >
              <Icon name="imgAmountFalse" size={32} />
            </button>
          </div>
        </div>
        <nav className="pd-navigation" aria-label="쇼핑 메뉴">
          {[
            "전체 카테고리",
            "전체 상품",
            "선물관",
            "장인관",
            "신상품",
            "베스트",
          ].map((label) => (
            <button
              key={label}
              onClick={() =>
                notify(`${label} 페이지는 아직 연결되지 않았습니다.`)
              }
            >
              {label}
            </button>
          ))}
        </nav>
      </header>
      <div className="pd-layout">
        <section className="pd-gallery" aria-label="상품 이미지">
          <div className="pd-thumbnails">
            {assets.map((asset, index) => (
              <button
                key={asset.imageId}
                aria-label={`${index + 1}번 상품 이미지`}
                aria-pressed={selected === index}
                onClick={() => setSelected(index)}
              >
                <Image
                  src={asset.url}
                  alt={asset.alt}
                  width={90}
                  height={90}
                  unoptimized
                />
              </button>
            ))}
          </div>
          <button
            className="pd-main-image"
            aria-label="상품 이미지 확대"
            onClick={() => setLightbox(true)}
          >
            {image && (
              <Image
                src={image.url}
                alt={image.alt}
                fill
                loading="eager"
                sizes="(max-width: 800px) 100vw, 660px"
                unoptimized
              />
            )}
          </button>
        </section>
        <aside className="pd-information" aria-label="상품 구매 정보">
          <div className="pd-title-group">
            <div className="pd-title-row">
              <h1>{title}</h1>
              <div className="pd-title-icons">
                <button
                  aria-label="관심 작품"
                  aria-pressed={liked}
                  onClick={() => setLiked(!liked)}
                  className={liked ? "is-liked" : ""}
                >
                  <Icon name="imgIconHeartFilled" size={32} />
                </button>
                <button aria-label="공유하기" onClick={() => void share()}>
                  <Icon name="imgIconShare" size={32} />
                </button>
              </div>
            </div>
            <div className="pd-author-row">
              <button
                onClick={() => {
                  document
                    .getElementById("product-author")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                {productInfo.artisan.name}
                <Icon name="imgIcons11" size={20} />
              </button>
              <span>
                <Icon name="imgIconStarFilled" size={20} /> —
              </span>
            </div>
            <strong className="pd-price">
              {formatPrice(productInfo.price)}
            </strong>
          </div>
          <p className="pd-demo-note">
            시연용 상품 정보 · 가격, 옵션, 장인 소개 및 상품 사양은 예시
            데이터입니다.
          </p>
          <p className="pd-summary">
            {summary || "작품에 담긴 이야기를 아래 상세페이지에서 만나보세요."}
          </p>
          <div className="pd-order-fields">
            <dl>
              <div>
                <dt>배송비</dt>
                <dd>
                  {formatPrice(productInfo.shippingFee)} (
                  {formatPrice(productInfo.freeShippingThreshold)} 이상 무료)
                </dd>
              </div>
              <div>
                <dt>제작 기간</dt>
                <dd>{productInfo.productionPeriod}</dd>
              </div>
            </dl>
            <div className="pd-options">
              {productInfo.optionGroups.map((group, index) => (
                <label key={group.id}>
                  <span className="pd-option-label">{group.label}</span>
                  <select
                    aria-label={group.label}
                    value={options[index]}
                    onChange={(event) =>
                      setOptions(
                        options.map((value, position) =>
                          position === index ? event.target.value : value,
                        ),
                      )
                    }
                  >
                    {group.required && <option value="">선택해 주세요</option>}
                    {group.choices.map((choice) => (
                      <option key={choice.id} value={choice.id}>
                        {choice.name}
                        {choice.priceDelta
                          ? ` (+${formatPrice(choice.priceDelta)})`
                          : ""}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
            {requiredSelected && (
              <div className="pd-quantity">
                <span>
                  {choices
                    .filter((choice) => choice && choice.id !== "none")
                    .map((choice) => choice?.name)
                    .join(" / ")}
                </span>
                <div>
                  <button
                    aria-label="수량 줄이기"
                    disabled={quantity === 1}
                    onClick={() => setQuantity(quantity - 1)}
                  >
                    −
                  </button>
                  <output aria-label="수량">{quantity}</output>
                  <button
                    aria-label="수량 늘리기"
                    disabled={quantity === 99}
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    ＋
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="pd-purchase">
            <div className="pd-total" aria-live="polite">
              <span>총 상품 금액</span>
              <strong>
                {requiredSelected
                  ? formatPrice(totalPrice)
                  : "필수 옵션을 선택해 주세요"}
              </strong>
            </div>
            {requiredSelected && (
              <p className="pd-shipping-total">
                배송비{" "}
                <strong aria-label="적용 배송비">
                  {shippingFee ? formatPrice(shippingFee) : "무료"}
                </strong>
              </p>
            )}
            <div className="pd-purchase-buttons">
              <Button
                size="s"
                variant="outline"
                onClick={() =>
                  notify("장바구니 기능은 서비스 연결 후 사용할 수 있습니다.")
                }
              >
                장바구니
              </Button>
              <Button size="s" onClick={purchase}>
                구매하기
              </Button>
            </div>
          </div>
        </aside>
        <div className="pd-content">
          <nav className="pd-tabs" aria-label="상품 상세 메뉴">
            {tabs.map(([id, label]) => (
              <button
                key={id}
                aria-current={activeTab === id ? "location" : undefined}
                onClick={() => {
                  setActiveTab(id);
                  document
                    .getElementById(id)
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                {label}
              </button>
            ))}
          </nav>
          <section id="product-information" className="pd-info-content">
            <section className="pd-author" id="product-author">
              <Image
                src={placeholder}
                loading="eager"
                alt="작가 이미지 준비 중"
                width={204}
                height={280}
                unoptimized
              />
              <div>
                <div className="pd-badges">
                  <span>{productInfo.artisan.certification}</span>
                  <span>{productInfo.artisan.field}</span>
                </div>
                <h2>{productInfo.artisan.name}</h2>
                <p>{productInfo.artisan.introduction}</p>
                {author && (
                  <p className="pd-author-more">
                    {productInfo.artisan.makingStory}
                  </p>
                )}
                <button className="pd-more" onClick={() => setAuthor(!author)}>
                  {author ? "접기" : "더보기"}
                  <Icon name="imgIcons5" />
                </button>
              </div>
            </section>
            <div className="pd-json-detail" aria-label="AI 작품 상세 내용">
              {detail}
            </div>
            <section className="pd-section">
              <h2>상품 상세 정보</h2>
              <dl className="pd-specs">
                {productInfo.specifications.map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </section>
          <section className="pd-section" id="product-notices">
            <h2>유의사항</h2>
            <Disclosure label="제품 유의사항">
              상품의 재질, 사용 방법 및 관리 방법을 확인한 후 이용해 주세요.
              구체적인 유의사항은 판매자 정보 등록 후 제공됩니다.
            </Disclosure>
            <Disclosure label="품질보증기준">
              판매자가 등록한 품질보증기준이 이곳에 표시됩니다.
            </Disclosure>
            <Disclosure label="A/S 안내">
              판매자가 등록한 A/S 담당자와 연락처가 이곳에 표시됩니다.
            </Disclosure>
          </section>
          <section className="pd-section" id="product-delivery">
            <h2>배송안내</h2>
            <Disclosure label="결제정보">
              결제 수단과 주문 안내는 서비스 연결 후 제공됩니다.
            </Disclosure>
            <Disclosure label="배송정보">
              배송비 {formatPrice(productInfo.shippingFee)} (
              {formatPrice(productInfo.freeShippingThreshold)} 이상 무료).{" "}
              {productInfo.productionPeriod}.
            </Disclosure>
            <Disclosure label="교환 및 반품정보">
              판매자가 등록한 교환·반품 방법과 조건이 이곳에 표시됩니다.
            </Disclosure>
          </section>
          <section className="pd-section" id="product-reviews">
            <div className="pd-section-heading">
              <h2>리뷰 (00)</h2>
              <select aria-label="리뷰 정렬">
                <option>최신순</option>
                <option>별점 높은순</option>
              </select>
            </div>
            <div className="pd-empty">
              아직 등록된 리뷰가 없습니다.
              <br />
              <span>작품을 구매한 고객의 리뷰가 이곳에 표시됩니다.</span>
            </div>
          </section>
          <section className="pd-section" id="product-inquiries">
            <div className="pd-section-heading">
              <h2>문의 (00)</h2>
              <div>
                <span>주문·배송 문의</span>
                <button className="pd-dark" onClick={() => setInquiry(true)}>
                  문의하기
                </button>
              </div>
            </div>
            <div className="pd-empty">아직 등록된 문의가 없습니다.</div>
          </section>
          <section className="pd-section pd-related">
            <h2>작가의 다른 작품</h2>
            <div className="pd-related-grid">
              {[1, 2, 3].map((index) => (
                <article key={index}>
                  <div>
                    <Image
                      src={placeholder}
                      loading="eager"
                      alt="작품 이미지 준비 중"
                      width={244}
                      height={244}
                      unoptimized
                    />
                    <span>신상품</span>
                  </div>
                  <h3>작품 정보 준비 중</h3>
                  <p>작가 이름</p>
                  <small>가격 정보 미등록</small>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
      <footer className="pd-footer">
        <div className="pd-footer-top">
          <div className="pd-company">
            <Link href="/" className="pd-footer-logo">
              미담
            </Link>
            <p>국가무형유산 전승자의 작품을 그 내력과 함께 전합니다.</p>
            <p>
              (주)미담 | 대표 ○○○ | 개인정보보호책임자 ○○○
              <br />
              사업자등록번호 000-00-00000 | 통신판매업 신고 제2026-○○○○-0000호
              <br />
              대표번호 00-0000-0000 | 주소 ○○시 ○○구 ○○로 00, 0층
            </p>
          </div>
          <div className="pd-footer-links">
            {[
              ["미담", "브랜드 소개", "입점 안내", "공지사항"],
              ["고객", "자주 묻는 질문", "배송 · 교환 환불", "분쟁 처리 기준"],
              ["정책", "이용약관", "개인정보처리방침"],
            ].map(([heading, ...items]) => (
              <div key={heading}>
                <strong>{heading}</strong>
                {items.map((item) => (
                  <button
                    key={item}
                    onClick={() =>
                      notify(`${item}은 서비스 연결 후 제공됩니다.`)
                    }
                  >
                    {item}
                  </button>
                ))}
              </div>
            ))}
            <div>
              <strong>고객센터</strong>
              <b>000-0000-0000</b>
              <p>운영시간 : 10:00~17:00</p>
              <p>점심시간 : 12:00~13:00</p>
              <p>주말 공휴일 제외</p>
            </div>
          </div>
        </div>
        <div className="pd-footer-bottom">
          <p>
            미담 상품 중 (주)미담이 판매자로 등록된 상품을 제외한 모든 상품은
            개별 입점 판매자가 판매하는 상품입니다.
            <br />
            (주)미담은 통신판매중개자로서 해당 상품들의 거래 당사자가 아니며,
            판매작가가 등록한 정보 및 거래에 대해 일체의 책임을 지지 않습니다.
          </p>
          <p>Copyright © 2026 MIDAM | All Rights Reserved</p>
        </div>
      </footer>
      <aside className="pd-owner-actions" aria-label="상세페이지 관리">
        <span>
          {published ? "게시 중" : "최종 결과 확인"}
          <small>브라우저 저장</small>
        </span>
        <Link href="/">나의 작업실로 돌아가기</Link>
        <Button size="s" variant="outline" onClick={onEdit}>
          {published ? "게시 내리고 편집" : "편집으로 돌아가기"}
        </Button>
        <Button size="s" disabled={published} onClick={onPublish}>
          {published ? "게시 중" : "상품에 게시하기"}
        </Button>
      </aside>
      {error && (
        <div className="pd-error" role="alert">
          {error}
        </div>
      )}
      {message && (
        <div className="pd-message" role="status">
          {message}
          <button aria-label="알림 닫기" onClick={() => setMessage("")}>
            ×
          </button>
        </div>
      )}
      <dialog
        className="pd-lightbox"
        ref={lightboxRef}
        onCancel={() => setLightbox(false)}
        aria-label="상품 이미지 크게 보기"
      >
        <button
          className="pd-dialog-close"
          aria-label="이미지 닫기"
          onClick={() => setLightbox(false)}
        >
          ×
        </button>
        {image && (
          <Image
            src={image.url}
            alt={image.alt}
            width={image.width}
            height={image.height}
            unoptimized
          />
        )}
        <div className="pd-lightbox-controls">
          <button
            disabled={selected === 0}
            onClick={() => setSelected(selected - 1)}
          >
            이전
          </button>
          <span>
            {selected + 1} / {assets.length}
          </span>
          <button
            disabled={selected >= assets.length - 1}
            onClick={() => setSelected(selected + 1)}
          >
            다음
          </button>
        </div>
      </dialog>
      <dialog
        className="pd-inquiry"
        ref={inquiryRef}
        onCancel={() => setInquiry(false)}
        aria-label="상품 문의"
      >
        <h2>상품 문의</h2>
        <p>상품 문의는 서비스 연결 후 작성할 수 있습니다.</p>
        <Button size="s" onClick={() => setInquiry(false)}>
          닫기
        </Button>
      </dialog>
    </main>
  );
}
