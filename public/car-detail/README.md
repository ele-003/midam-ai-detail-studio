# 자동차 상세페이지 JSON 예시

제공된 세 MD 문서의 기존 계약을 사용합니다. 새 스키마 필드를 추가하지 않았습니다.

- react_document.json: schemaVersion 2.0, canvasWidth 774, 6개 section으로 구성한 렌더링 입력입니다.
- asset-manifest.json: imageId hero를 실제 이미지 파일에 연결합니다. 상대 URL은 이 폴더를 기준으로 해석하며, 서비스에서는 자산 URL로 바꿉니다.
- images/: 제공된 원본 PNG와 320/640/1280 폭의 WebP입니다. 원본은 233×143이며, 확대 파일은 실제 이미지 디테일을 추가하지 않습니다.
- validation-report.json: 기존 FE 계약 검증과 노드 수·깊이 검사 결과입니다.

색상·타이포그래피·여백·모서리는 props.style, 배치는 props.layout에 넣었습니다. 이미지 URL·Base64·HTML·CSS 문자열은 AST에 넣지 않았습니다.

이 파일은 렌더 입력 예시이며 전체 API 응답이나 편집 저장 요청이 아닙니다. 초안 응답에서는 status.draft.react_document, 최종 응답에서는 status.result.detail_page.react_document에 배치합니다. 실제 생성·저장 시에는 문서에 따라 ApprovedDraftDto에서 서버 builder가 재조립해야 합니다.

실제 제조사·모델·가격·제원은 추정하지 않았습니다. 반복된 사진은 동일한 원본이며 다른 각도나 AI 생성 사진이 아닙니다.
