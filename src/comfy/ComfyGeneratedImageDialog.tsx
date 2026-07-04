import { useState } from 'react';
import type { ComfyGeneratedImage } from './api';
import { useBackdropDismiss } from '../components/useBackdropDismiss';

type ComfyGeneratedImageDialogProps = {
  promptId: string;
  images: ComfyGeneratedImage[];
  onClose: () => void;
};

export function ComfyGeneratedImageDialog({
  promptId,
  images,
  onClose,
}: ComfyGeneratedImageDialogProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const selectedImage = images[selectedImageIndex] ?? images[0];
  const backdropDismiss = useBackdropDismiss<HTMLDivElement>(onClose);

  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      {...backdropDismiss}
    >
      <section className="comfy-result-dialog" role="dialog" aria-modal="true" aria-label="Generated ComfyUI Image">
        <div className="dialog-header">
          <div>
            <h2>Generated Image</h2>
            <p>ComfyUI prompt {promptId}</p>
          </div>
          <button type="button" className="close-button" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="comfy-result-body">
          {selectedImage && (
            <>
              <img src={selectedImage.dataUrl} alt={selectedImage.filename} />
              <div className="comfy-image-meta">
                <span>{selectedImage.filename}</span>
                <span>node {selectedImage.nodeId}</span>
              </div>
              {images.length > 1 && (
                <div className="comfy-image-strip" aria-label="Generated images">
                  {images.map((image, index) => (
                    <button
                      key={`${image.nodeId}-${image.filename}-${index}`}
                      type="button"
                      className={index === selectedImageIndex ? 'active' : ''}
                      onClick={() => setSelectedImageIndex(index)}
                    >
                      <img src={image.dataUrl} alt={image.filename} />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
