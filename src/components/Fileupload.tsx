import { useState, useRef, useCallback } from "react";
import { FiUploadCloud } from "react-icons/fi";
import { IoClose } from "react-icons/io5";
import { BsCheckCircleFill } from "react-icons/bs";
import { store } from "../Redux/store";

const CLOUD_NAME = import.meta.env.VITE_APP_Cloud_name;
const PRESET_NAME = import.meta.env.VITE_APP_preset_name;
const BASE_URL = import.meta.env.VITE_APP_BASE_URL;
const API = `${BASE_URL}/api/v1`;

const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: store.getState().auth.accessToken,
});

type Stage = "idle" | "uploading" | "saving" | "done" | "error";

type UploadedFile = {
  name: string;
  size: number;
  mimeType: string;
  url: string;
  publicId: string;
};

type Props = {
  folderId?: string;
  folderPath?: string;
  onSuccess?: () => void;
  onClose?: () => void;
};

export default function FileUpload({ folderId, folderPath = "/", onSuccess, onClose }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  console.log(uploading)
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<{ name: string; size: string; type: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const formatSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${bytes} B`;
  };

  const getMimeIcon = (type: string) => {
    if (type.includes("image")) return "🖼️";
    if (type.includes("pdf")) return "📄";
    if (type.includes("video")) return "🎬";
    if (type.includes("audio")) return "🎵";
    if (type.includes("zip") || type.includes("rar")) return "🗜️";
    if (type.includes("sheet") || type.includes("excel")) return "📊";
    if (type.includes("word")) return "📝";
    return "📎";
  };

  const uploadToCloudinary = (file: File): Promise<UploadedFile> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", PRESET_NAME);
      formData.append("cloud_name", CLOUD_NAME);

      const xhr = new XMLHttpRequest();

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        const res = JSON.parse(xhr.responseText);
        if (xhr.status === 200) {
          resolve({
            name: file.name,
            size:Math.max(1, Math.round(res.bytes / 1024)),//Math.round(res.bytes / (1024 * 1024)),
            mimeType: file.type || res.format,
            url: res.secure_url,
            publicId: res.public_id,
          });
        } else {
          reject(new Error(res.error?.message || "Cloudinary upload failed"));
        }
      };

      xhr.onerror = () => reject(new Error("Network error during upload"));
      xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`);
      xhr.send(formData);
    });
  };

  const saveToBackend = async (uploaded: UploadedFile) => {
    console.log("uploaded---------->",uploaded)
    const r = await fetch(`${API}/files`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        name: uploaded.name,
        size: uploaded.size,
        mimeType: uploaded.mimeType,
        url: uploaded.url,
        publicId: uploaded.publicId,
        path: folderPath,
        folderId: folderId || undefined,
      }),
    });
    const d = await r.json();
    if (!d.success) throw new Error(d.message);
    return d.data;
  };

  const handleFile = useCallback(async (file: File) => {
    setError("");
    setStage("uploading");
    setUploading(true);
    setProgress(0);
    setPreview({ name: file.name, size: formatSize(file.size), type: file.type });

    try {
      const uploaded = await uploadToCloudinary(file);
      setStage("saving");
      await saveToBackend(uploaded);
      setStage("done");
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || "Upload failed");
      setStage("error");
    }

    setUploading(false);
  }, [folderId, folderPath]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const reset = () => {
    setStage("idle");
    setProgress(0);
    setPreview(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  // ── typed boolean flags — no TypeScript overlap error ─────────────
  const isUploading: boolean = stage === "uploading";
  const isSaving: boolean = stage === "saving";
  const isInProgress: boolean = isUploading || isSaving;

  const steps: { label: string; done: boolean; active: boolean }[] = [
    { label: "Cloudinary", done: isSaving || stage === "done", active: isUploading },
    { label: "FileVault",  done: stage === "done",             active: isSaving },
  ];

  return (
    <div className="bg-[#0d0d15] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" style={{ fontFamily: "'DM Mono', monospace" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <h3 className="text-white font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>Upload File</h3>
        {onClose && (
          <button onClick={onClose} className="text-zinc-600 hover:text-white transition-colors">
            <IoClose size={20} />
          </button>
        )}
      </div>

      <div className="p-6 space-y-4">

        {/* ── IDLE ──────────────────────────────────────────── */}
        {stage === "idle" && (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all
              ${isDragging ? "border-violet-500 bg-violet-500/10" : "border-white/10 hover:border-violet-500/50 hover:bg-violet-500/5"}`}
          >
            <div className={`w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center transition-colors ${isDragging ? "bg-violet-500/20" : "bg-white/5"}`}>
              <FiUploadCloud size={28} className={isDragging ? "text-violet-400" : "text-zinc-600"} />
            </div>
            <p className="text-white text-sm font-medium mb-1">{isDragging ? "Drop it here!" : "Drag & drop your file"}</p>
            <p className="text-zinc-600 text-xs mb-4">or click to browse</p>
            <span className="text-xs px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-zinc-500">All file types supported</span>
            <input ref={inputRef} type="file" className="hidden" onChange={handleInput} />
          </div>
        )}

        {/* ── UPLOADING / SAVING ─────────────────────────────── */}
        {isInProgress && preview && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-white/5 rounded-xl p-4">
              <span className="text-2xl">{getMimeIcon(preview.type)}</span>
              <div className="min-w-0 flex-1">
                <p className="text-white text-sm font-medium truncate">{preview.name}</p>
                <p className="text-zinc-600 text-xs">{preview.size}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">{isUploading ? "Uploading to Cloudinary..." : "Saving to FileVault..."}</span>
                <span className="text-violet-400">{isUploading ? `${progress}%` : "✓"}</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-full transition-all duration-300"
                  style={{ width: isSaving ? "100%" : `${progress}%` }}
                />
              </div>
            </div>

            <div className="flex gap-3">
              {steps.map((s) => (
                <div
                  key={s.label}
                  className={`flex-1 py-2 px-3 rounded-xl border text-xs text-center transition-all
                    ${s.done ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      : s.active ? "border-violet-500/30 bg-violet-500/10 text-violet-400"
                      : "border-white/5 text-zinc-700"}`}
                >
                  {s.done ? "✓ " : s.active ? "⟳ " : ""}{s.label}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── DONE ──────────────────────────────────────────── */}
        {stage === "done" && preview && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto">
              <BsCheckCircleFill size={32} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-white font-bold mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>Upload Complete!</p>
              <p className="text-zinc-600 text-xs truncate px-4">{preview.name}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={reset} className="flex-1 py-2.5 border border-white/10 rounded-xl text-zinc-400 text-sm hover:border-white/20 hover:text-white transition-colors">
                Upload Another
              </button>
              {onClose && (
                <button onClick={onClose} className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl text-white text-sm font-bold hover:opacity-90 transition-opacity">
                  Done
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── ERROR ─────────────────────────────────────────── */}
        {stage === "error" && (
          <div className="space-y-4">
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
              <p className="text-red-400 text-2xl mb-2">✕</p>
              <p className="text-red-400 text-sm font-medium">Upload Failed</p>
              <p className="text-red-400/70 text-xs mt-1">{error}</p>
            </div>
            <button onClick={reset} className="w-full py-2.5 bg-white/5 border border-white/10 rounded-xl text-zinc-400 text-sm hover:border-white/20 hover:text-white transition-colors">
              Try Again
            </button>
          </div>
        )}

        {folderId && stage === "idle" && (
          <p className="text-zinc-700 text-xs text-center">
            Uploading to: <span className="text-violet-400">{folderPath}</span>
          </p>
        )}
      </div>
    </div>
  );
}