# HTML → 기존 React JSON 계약 변환

react_document.json: 기존 2.0의 tag/props/children 구조. 새 스타일 필드를 추가하지 않았습니다.
asset-manifest.json: imageId → 320/640/1280 WebP 연결. URL은 이 압축 파일 기준 상대 경로이며 배포 시 BE/CDN URL로 교체하세요. images 폴더에는 원본 이미지도 있습니다.
conversion-report.json: 노드별 변환 및 생략 내역.

14개 섹션, 154개 노드, 깊이 5, 이미지 노드 12개, 고유 이미지 5개.

원본의 40:60 열 비율, 너비/높이/최소높이, 자식 정렬/순서, 방향별 테두리, overflow, 줄바꿈 관련 CSS는 기존 계약만으로 모두 표현할 수 없습니다. 보고서에 기록했으며 원본과 픽셀 단위로 같다고 보장하지 않습니다. h1은 h2, 최상위 header/footer는 section으로 변환했습니다. br는 개행 문자로 보존했으며 FE에서 개행 처리 필요합니다. 실제 폰트는 Pretendard, "Apple SD Gothic Neo", "Noto Sans KR", Arial, sans-serif이며 JSON에는 sans 프리셋으로 매핑했습니다.

기존 문서의 필드·트리 제한과 이미지 참조를 로컬 검증했습니다. AI 서버의 실제 DTO 검증은 수행하지 않았습니다. objectPosition은 원본 CSS의 퍼센트 수치를 보존했습니다. 색상/수치의 서버 세부 허용 범위와 폰트 프리셋 연결은 연동 시 확인해야 합니다. 자산의 AI 생성 여부·충실도는 HTML만으로 확인할 수 없으므로 임의의 검증 상태를 만들지 않았습니다.
