"use client";

import { useCallback, useState } from "react";
import { compressImageFile, decodeForCrop } from "@/lib/image-compression";
import { ImageCropModal } from "@/components/image-crop-modal";

type QueueItem = { key: string; decoded: File };

export type PreparingProgress = { current: number; total: number };

/**
 * Orquestra o fluxo compartilhado dos 4 pontos de upload de foto do app:
 * decodificar (JPEG/PNG na hora, HEIC/HEIF via conversão no servidor) →
 * recortar (via ImageCropModal) → comprimir (já existente) → devolver o
 * arquivo pronto pro chamador (que decide onde guardar/mostrar preview).
 *
 * Quando várias fotos são selecionadas de uma vez, a decodificação roda uma
 * de cada vez (sequencial, não `Promise.all`) — decodificar HEIC em paralelo
 * sem limite (WASM no navegador + ida ao servidor pra cada uma) sobrecarrega
 * a aba e trava a interface. `preparingProgress` expõe "foto X de Y" pra dar
 * feedback durante essa etapa.
 *
 * Se a conversão no servidor falhar (HEIC que nem heic-convert nem sharp
 * entendem), a etapa de recorte é pulada e o arquivo original segue direto
 * pro pipeline de compressão — o salvamento final ainda tem sua própria rede
 * de segurança antes do fallback "Sem foto".
 */
export function usePhotoCropQueue(onFileReady: (file: File) => void) {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [preparingProgress, setPreparingProgress] = useState<PreparingProgress | null>(null);

  const addFiles = useCallback(
    async (files: File[]) => {
      const toQueue: QueueItem[] = [];

      for (let index = 0; index < files.length; index++) {
        setPreparingProgress({ current: index + 1, total: files.length });
        const file = files[index];
        const decoded = await decodeForCrop(file);

        if (decoded) {
          toQueue.push({ key: `${file.name}-${file.lastModified}-${Math.random()}`, decoded });
        } else {
          // Conversão no servidor falhou — sem recorte, segue com o arquivo
          // original (o salvamento final ainda tem sua própria rede de
          // segurança antes do fallback "Sem foto").
          const compressed = await compressImageFile(file);
          onFileReady(compressed);
        }
      }

      setPreparingProgress(null);
      if (toQueue.length > 0) {
        setQueue((current) => [...current, ...toQueue]);
      }
    },
    [onFileReady]
  );

  const current = queue[0] ?? null;

  const handleConfirm = useCallback(
    async (croppedFile: File) => {
      const compressed = await compressImageFile(croppedFile);
      onFileReady(compressed);
      setQueue((q) => q.slice(1));
    },
    [onFileReady]
  );

  const handleCancel = useCallback(() => {
    setQueue((q) => q.slice(1));
  }, []);

  // key={current.key} força o React a desmontar/remontar o modal a cada
  // foto da fila — sem isso, o mesmo componente é reaproveitado entre fotos
  // diferentes e o estado interno (imagem carregada, zoom, área de recorte)
  // fica preso na primeira foto.
  const cropModal = current ? (
    <ImageCropModal
      key={current.key}
      file={current.decoded}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  ) : null;

  return { addFiles, isPreparing: preparingProgress !== null, preparingProgress, cropModal };
}
