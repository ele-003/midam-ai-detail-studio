import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { TextareaField } from "./TextareaField";

const meta = {
  title: "Studio/TextareaField",
  component: TextareaField,
  parameters: { layout: "padded" },
  args: {
    label: "제작 과정 · 작품 설명",
    placeholder: "작품에 담긴 이야기와 특별한 점을 알려주세요.",
    helperText: "최대 300자",
    maxLength: 300,
    rows: 4,
  },
  decorators: [
    (Story) => (
      <div className="max-w-xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TextareaField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Filled: Story = {
  args: { defaultValue: "오랜 시간 손으로 다듬어 완성한 작품입니다." },
};
export const Error: Story = { args: { error: "작품 설명을 입력해 주세요." } };
export const Disabled: Story = {
  args: { disabled: true, defaultValue: "초안을 준비하고 있습니다." },
};
