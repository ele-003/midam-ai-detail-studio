# MIDAM AI Detail Studio

Jangingmall frontend를 기반으로 만든 AI 상세페이지 제작 프로토타입입니다. 공통 디자인 파운데이션과 UI 컴포넌트를 사용하며, AI 결과 JSON을 검증한 뒤 React 요소로 표시합니다.

## 시작

```bash
npm ci
npm run dev -- --port 3002 --webpack
```

- 작업실: [http://localhost:3002](http://localhost:3002)
- 작품 정보 입력: [상세페이지 제작](http://localhost:3002/seller/products/new)
- 자동차 예시 편집: [자동차 작업](http://localhost:3002/seller/products/new?project=sample-car&sample=car)
- 금속 다기 예시 편집: [금속 다기 작업](http://localhost:3002/seller/products/new?project=sample-metal&sample=metal)

## 프로토타입 범위

작품 정보 입력 → 생성 중 → 초안 확인·편집 → 최종 결과 확인 → 작업실의 게시 중 목록으로 이어집니다. 생성 버튼은 MSW에 요청하고, MSW가 입력 문구와 사진으로 구성한 JSON 응답을 검증해 편집기에 전달합니다. 실제 AI 요청·서버 저장·상품 게시 API는 아직 연결하지 않았습니다.

### 로그인 없는 MSW 생성 테스트

`POST /api/prototype/detail-studio/generations`는 이 프로토타입만의 목업 경로입니다. 요청은 `{ draft, assets }`, 응답은 공통 봉투의 `data: { document, assets }`이며 `document`는 기존 React JSON v2입니다. BE 명세의 생성 요청 DTO·202 응답·상태 조회를 구현한 것으로 간주하지 않습니다. 실제 BE 연동 시 이 어댑터를 합의된 계약으로 교체합니다.

제작 화면의 클라이언트 조합 코드가 워커 준비를 기다린 뒤 API 함수를 호출합니다. MSW가 준비되지 않으면 오류를 표시하며 기존 프론트 타이머로 결과를 대신 만들지 않습니다. 생성 요청에는 토큰과 쿠키를 보내지 않고 401 자동 갱신도 사용하지 않습니다. 공통 인증 코드는 유지하며 제작 화면에 로그인 가드를 추가하지 않습니다. Query 훅과 서버 저장 연동은 이번 범위에 포함하지 않습니다.

- 기본 `/seller/products/new`: 약 1.8초 후 정상 JSON 응답
- `/seller/products/new?mockGeneration=error`: 생성 실패(500). 사진·입력값을 유지하고 다시 요청할 수 있음
- `/seller/products/new?mockGeneration=slow`: 8초간 생성 중 화면을 확인한 뒤 정상 응답

생성 버튼은 전역 `NEXT_PUBLIC_API_MOCKING` 값과 별개로 기존 단일 MSW 워커를 명시적으로 시작하므로 로컬과 배포 모두에서 테스트할 수 있습니다. 전역 목업이 꺼져 있으면 스튜디오 생성 경로만 가로채고 회원·상품 요청은 그대로 둡니다. 워커 준비와 요청 전체에 15초 제한을 적용하고 화면을 벗어나면 취소합니다. 생성 성공 시 응답 JSON 전체를 브라우저에 저장하며, 편집·복원·최종 확인은 그 문서를 사용합니다. 업로드 사진은 MSW 응답의 에셋으로 연결하며 실제 스토리지에 업로드하지 않습니다.

편집 화면에서는 문구를 직접 클릭해 입력하고, 우클릭으로 글자색을 선택합니다. 페이지 구성에서 섹션 순서를 바꾸거나, 본문의 텍스트·이미지를 선택한 뒤 도구 모음의 핸들 또는 이동 버튼으로 같은 섹션 안의 요소 순서를 바꿀 수 있습니다. 실행 취소·다시 실행과 저장 후 복원을 지원합니다.

최종 결과의 상품 정보는 노션 시연 데이터로 채웁니다. 장인 김영수 소개와 상품 사양, 기본가 89,000원, 세트·선물 옵션, 배송 조건을 표시하며 초기 선택은 4인 세트와 보자기 포장으로 총 137,000원입니다. 옵션·수량을 바꾸면 총 상품 금액과 배송비가 다시 계산됩니다. AI JSON 본문과 시연 상품 정보는 별도로 유지합니다. 네 단계의 실제 연동에 필요한 API와 명세 보완점은 [AI 스튜디오 API 검토](docs/ai-studio-api-review.md)를 참고합니다.

입력 화면의 테스트용 버튼으로 JSON 파일 또는 텍스트를 가져올 수 있습니다. JSON 문서 단독 또는 `{ document, assets }` 묶음을 지원하며, 기존 허용 요소·스타일·이미지 참조 검증을 유지합니다. 나전 예시는 `public/studio/sample-product.json`, 최신 표·카드 검증 예시는 `src/e2e/fixtures/najeon-ai-result.json`입니다.

테스트 영역의 `연결할 이미지 ID`에 JSON의 `props.imageId` 값을 입력하고 사진을 업로드한 뒤 JSON을 불러옵니다. 기본 ID는 나전 예시의 `sample-product`이며 파일명은 자유입니다. 여러 곳에서 같은 ID를 참조하면 동일한 사진이 표시되고, 같은 ID에 다시 업로드하면 교체됩니다. 직접 연결한 사진은 JSON 묶음에 포함된 같은 ID의 에셋보다 우선합니다. 서로 다른 ID는 최대 12개까지 연결하고 개별 삭제할 수 있습니다. 사진은 장당 10MB까지 선택할 수 있으며, 브라우저 보관용 사본은 최대 1600px로 축소·압축합니다. 연결 사진 데이터는 합계 약 2MB로 제한하며, 편집 화면으로 가져온 뒤 기존 작업 저장 방식으로 보관됩니다.

작업은 `midam-project-v1:` 키로 브라우저 localStorage에 저장됩니다. 포트가 다르면 저장소도 다르므로 기존 3001 포트에 저장한 작업이 3002에 자동으로 나타나지는 않습니다. 기존 프로토타입 폴더와 데이터는 별도로 유지됩니다.

## 디자인 적용 범위

- `src/app/globals.css`: 원본 레포의 디자인 토큰과 Pretendard 폰트 기준.
- `src/components/ui/`: Button, InputField, Badge, Breadcrumb, Toast 및 아이콘 재사용. 긴 글은 동일한 입력 토큰을 사용하는 스튜디오 전용 TextareaField로 구성.
- `src/components/detail-studio/`: JSON 검증·렌더링, 입력·편집·최종 화면 및 저장 모듈. 작업실과 제작 경로가 함께 사용.
- `src/lib/detail-studio/`: 렌더러와 MSW가 공유하는 JSON·이미지 검증 및 이전 저장 데이터 복원용 builder.
- `src/api/detail-studio/`: 프로토타입 생성 API 어댑터, 입출력 검증, MSW 핸들러.
- `src/app/_components/`: 작업실 목록.

제작 도구의 색상·글꼴 크기·상태 표현에 공통 토큰을 적용합니다. 생성된 상세페이지 본문의 JSON 스타일은 그대로 사용하고, 본문의 기본 서식을 독립적으로 지정해 편집 화면과 최종 화면에서 자간·행간이 달라지지 않게 합니다. 이번 UI 적용을 위해 AI JSON 규격을 변경하지 않았습니다.

## 검증

`npm run test:e2e`는 3002 포트에서 입력·생성·편집·게시, JSON 가져오기, 표·카드, 저장 실패 시 복구, 드래그·글자색·실행 취소와 모바일 화면을 확인합니다. 별도 포트는 `STUDIO_TEST_PORT` 환경 변수로 지정합니다. 기존 3001 서버는 재사용하지 않습니다.

## 브랜치와 배포

- `main`: `Jangingmall/frontend` 원본 코드 동기화용.
- `dev`: 프로토타입 통합 및 Vercel Production 배포용.
- 작업 브랜치: 변경을 커밋·푸시하고 필수 CI를 통과한 PR을 `dev`로 병합합니다.

원본 동기화 기준은 `Jangingmall/frontend`의 `dev` 커밋 `8eb5cca`(2026-09-11)입니다. 인증·상품 API, MSW 목업, 공통 UI 업데이트를 포함합니다. `dev`에는 기존 스튜디오를 유지하고, 원본 변경 이력을 보존하는 merge 방식으로 동기화합니다. 인증 초기화가 추가되어도 현재 작업실과 제작 화면은 로그인 없이 열리며, AI 생성·저장 API 연결 여부는 위 프로토타입 범위와 같습니다.

Vercel은 이 저장소를 연결하고 Production Branch를 `dev`, Framework Preset을 Next.js, Root Directory를 저장소 루트로 설정합니다. 빌드는 `npm run build`, Node.js는 24.x를 사용합니다. `dev` 병합 시 프로덕션 배포가 갱신됩니다. 프로토타입을 배포하기 위해 `dev`를 `main`으로 병합하지 않습니다.

현재 화면은 외부 API 없이 실행됩니다. 배포 주소의 브라우저 저장소는 localhost와 별개이며, 다른 사용자와 작업 데이터가 공유되지 않습니다. 실제 API 연결 시에는 환경 변수와 서버 저장 흐름을 함께 구성해야 합니다.

## 현재 구성

- Next.js 16.3.4, TypeScript 6.0.3, Tailwind CSS 4.3.3
- shadcn/ui v4, TanStack Query 5.102.8, Zustand 5.0.15
- React Hook Form, Zod, Day.js, browser-image-compression, Sharp
- 공통 HTTP fetcher와 Zod 기반 환경 변수 검증
- MSW 브라우저·Node 설정 경계
- Vitest, Storybook, Playwright 및 GitHub Actions CI 환경

## 디렉터리 원칙

- src/app: App Router route, layout, metadata, 화면 진입점
- src/components/ui: shadcn/ui 기반 UI
- src/components/common: 도메인 비종속 공용 UI
- src/api: 도메인 REST 호출, DTO 검증·변환
- src/queries: TanStack Query hook과 query key
- src/lib: HTTP, 환경 변수, 외부 라이브러리 설정
- src/mocks: MSW 설정과 handler 등록

실제 AI·BE API 연결은 계약이 확정된 뒤 추가합니다. 현재 스튜디오는 컴포넌트 상태와 브라우저 저장소를 사용합니다. 서비스 연동 시 서버 상태는 TanStack Query, URL 상태는 Next.js search parameter를 기준으로 구성합니다.

## 명령어

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm run format
npm run format:check
npm run validate:env
npm run test
npm run storybook
npm run build-storybook
npm run test:e2e
```

CI는 pull request와 `main`·`dev` push에서 환경 변수 검증, 포맷, 린트, 타입 검사, 단위 테스트, 프로덕션 빌드, Storybook 빌드, Chromium E2E를 실행합니다.
