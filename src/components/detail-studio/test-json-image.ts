import type { StudioAsset } from "./studio-contract";

export async function prepareTestJsonImage(
  file: File,
  imageId: string,
): Promise<StudioAsset> {
  if (!imageId.trim() || imageId.trim().length > 80)
    throw new Error("JSON의 imageId를 1~80자로 입력해 주세요.");
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type))
    throw new Error("JPG, PNG, WebP 이미지를 선택해 주세요.");
  if (file.size > 10 * 1024 * 1024)
    throw new Error("이미지는 장당 최대 10MB까지 올릴 수 있습니다.");

  try {
    const original = await createImageBitmap(file);
    const validSize =
      original.width <= 20000 &&
      original.height <= 20000 &&
      original.width * original.height <= 40_000_000;
    original.close();
    if (!validSize) throw new Error("unsupported dimensions");

    // 브라우저 저장 공간을 고려해 테스트용 사본만 축소한다. 원본 파일은 변경하지 않는다.
    const { default: imageCompression } =
      await import("browser-image-compression");
    const compressed = await imageCompression(file, {
      maxSizeMB: 0.4,
      maxWidthOrHeight: 1600,
      useWebWorker: false,
      fileType: "image/webp",
      initialQuality: 0.85,
    });
    const bitmap = await createImageBitmap(compressed);
    const { width, height } = bitmap;
    bitmap.close();
    const url = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Unable to read image"));
      reader.readAsDataURL(compressed);
    });
    return {
      imageId: imageId.trim(),
      url,
      width,
      height,
      alt: file.name.slice(0, 1000),
      asset_mode: "source",
      product_generated: false,
      fidelity_status: "FALLBACK",
    };
  } catch {
    throw new Error(
      "이미지를 읽지 못했습니다. 파일이 손상되었거나 해상도가 너무 큰지 확인해 주세요.",
    );
  }
}
