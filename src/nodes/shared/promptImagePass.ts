import type { ChatImageAttachment } from '../../types';

export function promptImagePass({
  actionReplay,
  actionImages,
  inputImages,
  referenceImages,
}: {
  actionReplay: boolean;
  actionImages: ChatImageAttachment[];
  inputImages: ChatImageAttachment[];
  referenceImages: ChatImageAttachment[];
}) {
  const includedActionImages = actionReplay ? actionImages : [];
  return {
    actionImages: includedActionImages,
    inputImages,
    referenceImages,
    images: [...includedActionImages, ...inputImages, ...referenceImages],
    inputImageOffset: includedActionImages.length,
    referenceImageOffset: includedActionImages.length + inputImages.length,
  };
}
