"use client";

import { useCallback, useState } from "react";
import Cropper, { type Area, type MediaSize } from "react-easy-crop";
import { cropImageToFile } from "@/lib/crop-image";

const VERTICAL_ASPECT = 3 / 4;

type ImageCropModalProps = {
  file: File;
  onConfirm: (croppedFile: File) => void;
  onCancel: () => void;
};

// Modal de recorte compartilhado — usado nos 4 fluxos de upload de foto do
// app (peça de guarda-roupa, capa de look, foto de perfil, print da
// wishlist) logo depois da imagem ser decodificada com sucesso, antes da
// compressão e do envio.
export function ImageCropModal({ file, onConfirm, onCancel }: ImageCropModalProps) {
  const [imageUrl] = useState(() => URL.createObjectURL(file));
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [freeAspect, setFreeAspect] = useState(false);
  const [naturalAspect, setNaturalAspect] = useState(VERTICAL_ASPECT);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleMediaLoaded = useCallback((size: MediaSize) => {
    setNaturalAspect(size.naturalWidth / size.naturalHeight);
  }, []);

  async function handleConfirm() {
    if (!croppedAreaPixels) return;
    setIsProcessing(true);
    const cropped = await cropImageToFile(file, croppedAreaPixels, file.name);
    URL.revokeObjectURL(imageUrl);
    onConfirm(cropped);
  }

  function handleCancel() {
    URL.revokeObjectURL(imageUrl);
    onCancel();
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90">
      <div className="relative flex-1">
        <Cropper
          image={imageUrl}
          crop={crop}
          zoom={zoom}
          aspect={freeAspect ? naturalAspect : VERTICAL_ASPECT}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={handleCropComplete}
          onMediaLoaded={handleMediaLoaded}
        />
      </div>

      <div className="space-y-3 bg-white p-4">
        <div className="flex items-center gap-3">
          <label className="shrink-0 text-xs text-neutral-500" htmlFor="crop-zoom">
            Zoom
          </label>
          <input
            id="crop-zoom"
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            className="flex-1"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            checked={freeAspect}
            onChange={(event) => setFreeAspect(event.target.checked)}
            className="rounded border-neutral-300"
          />
          Recorte livre (sem proporção fixa)
        </label>

        <div className="flex justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isProcessing}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!croppedAreaPixels || isProcessing}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-bold-text hover:opacity-90 disabled:opacity-50"
          >
            {isProcessing ? "Recortando..." : "Confirmar recorte"}
          </button>
        </div>
      </div>
    </div>
  );
}
