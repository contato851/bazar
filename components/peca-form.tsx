"use client";

import { useState } from "react";
import { useCallback, useRef } from "react";
import { useFormStatus } from "react-dom";
import { compressImageFile, isHeicFile } from "@/lib/image-compression";
import { usePhotoCropQueue } from "@/lib/use-photo-crop-queue";
import { ImageCropModal } from "@/components/image-crop-modal";

type PhotoPreview = { file: File; url: string };

type Categoria = { id: string; nome: string };

type PecaFormProps = {
  action: (formData: FormData) => void;
  submitLabel: string;
  categorias: Categoria[];
  defaultValues?: {
    nome?: string;
    descricao?: string | null;
    preco?: number;
    categoria_id?: string | null;
  };
  existingFotos?: string[];
};

function SubmitButton({
  label,
  pendingLabel,
  disabled,
}: {
  label: string;
  pendingLabel?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="bg-accent px-4 py-2 text-sm font-medium text-bold-text hover:opacity-90 disabled:opacity-50"
    >
      {pending ? pendingLabel ?? "Salvando..." : label}
    </button>
  );
}

export function PecaForm({
  action,
  submitLabel,
  categorias,
  defaultValues,
  existingFotos = [],
}: PecaFormProps) {
  const hiddenFotosInputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<PhotoPreview[]>([]);
  const [removedUrls, setRemovedUrls] = useState<Set<string>>(new Set());
  const [recropUrl, setRecropUrl] = useState<string | null>(null);
  const [recropFile, setRecropFile] = useState<File | null>(null);
  const [isFetchingRecrop, setIsFetchingRecrop] = useState<string | null>(null);

  function syncInputFiles(files: File[]) {
    if (!hiddenFotosInputRef.current) return;
    const dataTransfer = new DataTransfer();
    files.forEach((file) => dataTransfer.items.add(file));
    hiddenFotosInputRef.current.files = dataTransfer.files;
  }

  const handleFileReady = useCallback((file: File) => {
    setPreviews((current) => {
      const updated = [...current, { file, url: URL.createObjectURL(file) }];
      syncInputFiles(updated.map((preview) => preview.file));
      return updated;
    });
  }, []);

  const { addFiles, isPreparing, preparingProgress, cropModal } =
    usePhotoCropQueue(handleFileReady);

  function toggleRemoveExisting(url: string) {
    setRemovedUrls((current) => {
      const updated = new Set(current);
      if (updated.has(url)) {
        updated.delete(url);
      } else {
        updated.add(url);
      }
      return updated;
    });
  }

  // Recorte de uma foto já salva: busca o arquivo de volta a partir da URL
  // pública, abre o mesmo modal de recorte usado no upload, e o resultado
  // vira uma substituição — a foto antiga entra pra lista de remoção e a
  // recortada entra como uma foto nova, reaproveitando o fluxo já existente
  // (remover + adicionar) sem precisar de uma rota de salvamento própria.
  async function handleRecropClick(url: string) {
    setIsFetchingRecrop(url);
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const fileName = url.split("/").pop() || "foto.jpg";
      const file = new File([blob], fileName, { type: blob.type || "image/jpeg" });
      setRecropUrl(url);
      setRecropFile(file);
    } finally {
      setIsFetchingRecrop(null);
    }
  }

  async function handleRecropConfirm(cropped: File) {
    const compressed = await compressImageFile(cropped);
    if (recropUrl) {
      setRemovedUrls((current) => new Set(current).add(recropUrl));
    }
    handleFileReady(compressed);
    setRecropUrl(null);
    setRecropFile(null);
  }

  function handleRecropCancel() {
    setRecropUrl(null);
    setRecropFile(null);
  }

  function handleFilesSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (selected.length > 0) addFiles(selected);
  }

  function removePreview(index: number) {
    setPreviews((current) => {
      const removed = current[index];
      if (removed) URL.revokeObjectURL(removed.url);
      const updated = current.filter((_, i) => i !== index);
      syncInputFiles(updated.map((preview) => preview.file));
      return updated;
    });
  }

  function movePreview(index: number, direction: -1 | 1) {
    setPreviews((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const updated = [...current];
      [updated[index], updated[target]] = [updated[target], updated[index]];
      syncInputFiles(updated.map((preview) => preview.file));
      return updated;
    });
  }

  return (
    <>
      <form
        action={action}
        className="max-w-2xl space-y-5 border border-neutral-200 bg-white p-6"
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700" htmlFor="nome">
            Nome *
          </label>
          <input
            id="nome"
            name="nome"
            type="text"
            required
            defaultValue={defaultValues?.nome}
            className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
        </div>

        <div>
          <label
            className="mb-1 block text-sm font-medium text-neutral-700"
            htmlFor="categoria_id"
          >
            Categoria *
          </label>
          <select
            id="categoria_id"
            name="categoria_id"
            required
            defaultValue={defaultValues?.categoria_id ?? ""}
            className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          >
            <option value="" disabled>
              Selecione
            </option>
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700" htmlFor="preco">
            Preço (R$) *
          </label>
          <input
            id="preco"
            name="preco"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={defaultValues?.preco}
            className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
        </div>

        <div>
          <label
            className="mb-1 block text-sm font-medium text-neutral-700"
            htmlFor="descricao"
          >
            Descrição
          </label>
          <textarea
            id="descricao"
            name="descricao"
            rows={3}
            defaultValue={defaultValues?.descricao ?? ""}
            className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
        </div>

        {existingFotos.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium text-neutral-700">Fotos atuais</p>
            <div className="flex flex-wrap gap-3">
              {existingFotos.map((url) => {
                const marcadaPraRemover = removedUrls.has(url);
                return (
                  <div key={url} className="w-24">
                    <img
                      src={url}
                      alt=""
                      className={`h-24 w-24 border object-cover ${
                        marcadaPraRemover ? "opacity-40" : ""
                      }`}
                    />
                    <label className="mt-1 flex items-center justify-center gap-1 text-xs text-red-600">
                      <input
                        type="checkbox"
                        name="remove_fotos"
                        value={url}
                        checked={marcadaPraRemover}
                        onChange={() => toggleRemoveExisting(url)}
                      />
                      Remover
                    </label>
                    {!marcadaPraRemover && (
                      <button
                        type="button"
                        onClick={() => handleRecropClick(url)}
                        disabled={isFetchingRecrop === url}
                        className="mt-1 w-full border border-neutral-300 py-0.5 text-xs font-medium hover:bg-neutral-50 disabled:opacity-50"
                      >
                        {isFetchingRecrop === url ? "Abrindo..." : "Recortar"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            {existingFotos.length > 0 ? "Adicionar fotos" : "Fotos"}
          </label>
          <p className="mb-2 text-xs text-neutral-500">
            Você pode escolher mais de uma foto. Use as setas para reordenar — a primeira é a
            foto de capa no catálogo.
          </p>

          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFilesSelected}
            className="w-full text-sm"
          />

          <input
            ref={hiddenFotosInputRef}
            name="fotos"
            type="file"
            accept="image/*"
            multiple
            className="hidden"
          />

          {isPreparing && (
            <p className="mt-2 text-xs text-neutral-500">
              {preparingProgress && preparingProgress.total > 1
                ? `Processando foto ${preparingProgress.current} de ${preparingProgress.total}...`
                : "Processando foto..."}
            </p>
          )}

          {previews.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-3">
              {previews.map((preview, index) => (
                <div key={preview.url} className="relative w-24">
                  {isHeicFile(preview.file) ? (
                    <div className="flex h-24 w-24 flex-col items-center justify-center border bg-neutral-50 px-1 text-center text-[10px] text-neutral-500">
                      Foto HEIC selecionada — prévia indisponível
                    </div>
                  ) : (
                    <img
                      src={preview.url}
                      alt=""
                      className="h-24 w-24 border object-cover"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => removePreview(index)}
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center bg-neutral-900 text-xs leading-none text-white hover:bg-neutral-700"
                    aria-label="Remover foto selecionada"
                  >
                    ×
                  </button>
                  <div className="mt-1 flex justify-center gap-2 text-xs text-neutral-500">
                    <button
                      type="button"
                      onClick={() => movePreview(index, -1)}
                      disabled={index === 0}
                      className="hover:text-neutral-900 disabled:opacity-30"
                      aria-label="Mover foto pra esquerda"
                    >
                      ◀
                    </button>
                    <button
                      type="button"
                      onClick={() => movePreview(index, 1)}
                      disabled={index === previews.length - 1}
                      className="hover:text-neutral-900 disabled:opacity-30"
                      aria-label="Mover foto pra direita"
                    >
                      ▶
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <SubmitButton
          label={submitLabel}
          pendingLabel={previews.length > 0 ? "Otimizando fotos..." : "Salvando..."}
          disabled={isPreparing}
        />
        {previews.length > 0 && (
          <p className="text-xs text-neutral-500">
            As fotos passam por um processo automático de padronização de fundo ao salvar —
            isso pode levar alguns segundos.
          </p>
        )}
      </form>
      {cropModal}
      {recropFile && (
        <ImageCropModal
          file={recropFile}
          onConfirm={handleRecropConfirm}
          onCancel={handleRecropCancel}
        />
      )}
    </>
  );
}
