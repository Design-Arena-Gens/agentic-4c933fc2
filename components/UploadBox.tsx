import { ChangeEvent, DragEvent, useCallback, useRef, useState } from "react";

type Props = {
  onFileAccepted: (file: File) => void;
  disabled?: boolean;
  hasFile: boolean;
};

export const UploadBox = ({ onFileAccepted, disabled, hasFile }: Props) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) {
        return;
      }

      const file = files[0];
      if (!file.type.startsWith("image/")) {
        setError("Only image files are supported right now.");
        return;
      }

      setError(null);
      onFileAccepted(file);
    },
    [onFileAccepted]
  );

  const handleDragOver = useCallback((event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    if (disabled) return;
    setIsDragging(true);
    event.dataTransfer.dropEffect = "copy";
  }, [disabled]);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (event: DragEvent<HTMLLabelElement>) => {
      event.preventDefault();
      if (disabled) return;

      setIsDragging(false);
      handleFiles(event.dataTransfer.files);
    },
    [disabled, handleFiles]
  );

  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      handleFiles(event.target.files);
    },
    [handleFiles]
  );

  return (
    <label
      className={[
        "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed p-8 text-center transition",
        isDragging ? "border-brand bg-brand/5" : "border-slate-300/80 hover:border-brand/70",
        disabled ? "pointer-events-none opacity-60" : "bg-white/70 backdrop-blur"
      ].join(" ")}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleInputChange}
        disabled={disabled}
      />
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand/10 text-brand">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5l5-5 4 4 5-5 4 4M3 4.5h18" />
        </svg>
      </div>
      <div>
        <p className="text-lg font-semibold text-slate-900">
          {hasFile ? "Replace the pantry snapshot" : "Drop an image of your leftovers"}
        </p>
        <p className="text-sm text-slate-600">
          Drag & drop or click to browse. We’ll analyze veggies, proteins, and pantry staples to craft recipes.
        </p>
      </div>
      {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
    </label>
  );
};
