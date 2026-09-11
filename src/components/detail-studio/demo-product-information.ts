// 노션 '미담 시연용 상품 더미데이터'. AI 문서와 별도인 최종 화면의 시연 정보다.
export const DEMO_PRODUCT_INFORMATION = {
  price: 89_000,
  shippingFee: 3_000,
  freeShippingThreshold: 100_000,
  productionPeriod: "약 2주간의 제작 기간 소요",
  artisan: {
    name: "김영수",
    certification: "국가무형유산 이수자",
    field: "나전장",
    introduction:
      "30년간 전통 나전 기법을 이어오며, 자개의 섬세한 결을 살린 작품으로 전통의 아름다움을 일상에 담아냅니다.",
    makingStory:
      "장인이 직접 고른 자개를 하나씩 재단하고 배치해 국화문을 완성했습니다. 자개 특유의 은은한 빛과 결을 살려 차분하고 깊이 있는 멋을 담았습니다.",
  },
  specifications: [
    ["소재", "백자, 옻칠, 자개"],
    ["규격", "85 × 85 × H65mm"],
    ["중량", "180g"],
    ["구성", "찻잔 2점, 보관용 상자 1개, 작품 보증서 1부"],
    ["용도", "차를 마시는 다기 및 선물용"],
    ["인증", "국가무형유산 전승자 제작 작품"],
    ["제조", "대한민국"],
  ],
  optionGroups: [
    {
      id: "set",
      label: "필수 옵션 · 세트 구성",
      required: true,
      defaultChoice: "four",
      choices: [
        { id: "two", name: "2인 세트", priceDelta: 0 },
        { id: "four", name: "4인 세트", priceDelta: 40_000 },
      ],
    },
    {
      id: "gift",
      label: "선물 옵션 · 선물 포장 여부",
      required: false,
      defaultChoice: "bojagi",
      choices: [
        { id: "none", name: "선택 안 함", priceDelta: 0 },
        { id: "bojagi", name: "전통 보자기 포장", priceDelta: 8_000 },
      ],
    },
  ],
};
