import { useState, useEffect } from "react";
import { BASE_URL } from "../App";
import { Link } from "react-router-dom";
import { CiGrid41 } from "react-icons/ci";
import { LuLayoutList } from "react-icons/lu";
import { FaFolderPlus } from "react-icons/fa";
import { FiUploadCloud } from "react-icons/fi";
import { store, type RootState } from "../Redux/store";
import { useSelector } from "react-redux";
import FileUpload from "../components/Fileupload";

const API = `${BASE_URL}/api/v1`;
const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: store.getState().auth.accessToken,
});

type Folder = {
  id: string;
  name: string;
  path: string;
  parentId: string | null;
  createdAt: string;
  children: Folder[];
  files: FileItem[];
};

type FileItem = {
  id: string;
  name: string;
  size: number; // stored in KB
  mimeType: string;
  url: string;
  path: string;
  folderId: string | null;
  createdAt: string;
};

type Modal = "createFolder" | "uploadFile" | "deleteFolder" | "deleteFile" | null;

// size is in KB
function formatSize(kb: number) {
  if (kb >= 1024 * 1024) return `${(kb / (1024 * 1024)).toFixed(1)} GB`;
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`;
  return `${kb} KB`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getMimeIcon(mime: string) {
  if (mime.includes("image")) return "🖼️";
  if (mime.includes("pdf")) return "📄";
  if (mime.includes("video")) return "🎬";
  if (mime.includes("audio")) return "🎵";
  if (mime.includes("zip") || mime.includes("rar")) return "🗜️";
  if (mime.includes("sheet") || mime.includes("excel")) return "📊";
  if (mime.includes("word") || mime.includes("document")) return "📝";
  return "📎";
}

function Toast({ msg, type, onClose }: { msg: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, []);
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-medium transition-all
      ${type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
      <span>{type === "success" ? "✓" : "✕"}</span>
      {msg}
    </div>
  );
}

function ModalWrapper({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0d0d15] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h3 className="text-white font-bold truncate pr-4" style={{ fontFamily: "'Syne', sans-serif" }}>{title}</h3>
          <button onClick={onClose} className="text-zinc-600 hover:text-white transition-colors w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/5 flex-shrink-0">✕</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export default function FileManager() {
  const auth = useSelector((state: RootState) => state.auth);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<{ id: string | null; name: string }[]>([{ id: null, name: "Root" }]);
  const [modal, setModal] = useState<Modal>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selected, setSelected] = useState<{ type: "folder" | "file"; id: string } | null>(null);
  const [folderName, setFolderName] = useState("");
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => setToast({ msg, type });
  const closeModal = () => { setModal(null); setFolderName(""); };

  const fetchFolders = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/folder`, { headers: getHeaders() });
      const d = await r.json();
      setFolders(d.data || []);
    } catch { showToast("Failed to load folders", "error"); }
    setLoading(false);
  };

  const fetchFiles = async (folderId?: string) => {
    try {
      const url = folderId ? `${API}/files?folderId=${folderId}` : `${API}/files`;
      const r = await fetch(url, { headers: getHeaders() });
      const d = await r.json();
      setFiles(d.data || []);
    } catch { showToast("Failed to load files", "error"); }
  };

  useEffect(() => { fetchFolders(); fetchFiles(); }, []);

  const openFolder = (folder: Folder) => {
    setCurrentFolder(folder);
    setBreadcrumb(prev => [...prev, { id: folder.id, name: folder.name }]);
    fetchFiles(folder.id);
  };

  const navigateBreadcrumb = (index: number) => {
    const crumb = breadcrumb[index];
    setBreadcrumb(prev => prev.slice(0, index + 1));
    if (crumb.id === null) { setCurrentFolder(null); fetchFiles(); }
    else {
      const f = folders.find(f => f.id === crumb.id) || null;
      setCurrentFolder(f);
      fetchFiles(crumb.id);
    }
  };

  const handleCreateFolder = async () => {
    if (!folderName.trim()) return;
    try {
      const r = await fetch(`${API}/folder`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          name: folderName,
          path: `/${folderName.toLowerCase()}`,
          parentId: currentFolder?.id || undefined,
        }),
      });
      const d = await r.json();
      if (!d.success) throw new Error(d.message);
      showToast("Folder created successfully");
      closeModal();
      fetchFolders();
    } catch (err: any) { showToast(err.message, "error"); }
  };

  const handleDeleteFolder = async () => {
    if (!selected || selected.type !== "folder") return;
    try {
      const r = await fetch(`${API}/folder/${selected.id}`, { method: "DELETE", headers: getHeaders() });
      const d = await r.json();
      if (!d.success) throw new Error(d.message);
      showToast("Folder deleted");
      setSelected(null);
      closeModal();
      fetchFolders();
    } catch (err: any) { showToast(err.message, "error"); }
  };

  const handleDeleteFile = async () => {
    if (!selected || selected.type !== "file") return;
    try {
      const r = await fetch(`${API}/files/${selected.id}`, { method: "DELETE", headers: getHeaders() });
      const d = await r.json();
      if (!d.success) throw new Error(d.message);
      showToast("File deleted");
      setSelected(null);
      closeModal();
      fetchFiles(currentFolder?.id);
    } catch (err: any) { showToast(err.message, "error"); }
  };

  const currentFolders = folders.filter(f =>
    f.parentId === (currentFolder?.id || null) &&
    f.name.toLowerCase().includes(search.toLowerCase())
  );
  const currentFiles = files.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#05050a] text-white" style={{ fontFamily: "'DM Mono', monospace" }}>
      <style>{`
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #222; border-radius: 2px; }
      `}</style>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#05050a]/95 backdrop-blur-sm border-b border-white/5 px-4 md:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex gap-5 items-center">
            <Link to="/">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-sm font-black">F</div>
                <span className="text-white font-black text-base hidden sm:block" style={{ fontFamily: "'Syne', sans-serif" }}>
                  File<span className="text-violet-400">Vault</span>
                </span>
              </div>
            </Link>
            {auth?.user?.role === "OWNER" && (
              <Link to="/members">
                <span className="text-white font-black text-base hidden sm:block" style={{ fontFamily: "'Syne', sans-serif" }}>Members</span>
              </Link>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setModal("createFolder")}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 text-xs font-medium px-3 py-2 rounded-xl transition-all"
            >
              <FaFolderPlus size={20} color="#fcba03" />
              <span className="hidden sm:block">New Folder</span>
            </button>
            <button
              onClick={() => setModal("uploadFile")}
              className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all"
            >
              <FiUploadCloud size={20} />
              <span className="hidden sm:block">Upload File</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1 mb-6 flex-wrap">
          {breadcrumb.map((crumb, i) => (
            <div key={i} className="flex items-center gap-1">
              {i > 0 && <span className="text-zinc-700">/</span>}
              <button
                onClick={() => navigateBreadcrumb(i)}
                className={`text-sm px-2 py-1 rounded-lg transition-colors
                  ${i === breadcrumb.length - 1 ? "text-white font-bold" : "text-zinc-600 hover:text-zinc-300 hover:bg-white/5"}`}
              >
                {crumb.name}
              </button>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search files and folders..."
            className="bg-[#0d0d15] border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-700 outline-none focus:border-violet-500/40 transition-colors w-full max-w-xs"
          />
          <div className="flex items-center gap-1 bg-[#0d0d15] border border-white/8 rounded-xl p-1">
            <button onClick={() => setView("grid")} className={`px-2 py-1 rounded-lg text-2xl transition-colors ${view === "grid" ? "bg-violet-600 text-white" : "text-zinc-600 hover:text-zinc-300"}`}><CiGrid41 /></button>
            <button onClick={() => setView("list")} className={`px-2 py-1 rounded-lg text-2xl transition-colors ${view === "list" ? "bg-violet-600 text-white" : "text-zinc-600 hover:text-zinc-300"}`}><LuLayoutList /></button>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && (
          <>
            {currentFolders.length === 0 && currentFiles.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center text-3xl mb-4">📂</div>
                <p className="text-white font-bold mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>No files yet</p>
                <p className="text-zinc-600 text-sm mb-6">Create a folder or upload your first file</p>
                <div className="flex gap-3">
                  <button onClick={() => setModal("createFolder")} className="text-sm px-4 py-2 border border-white/10 rounded-xl text-zinc-400 hover:border-white/20 hover:text-white transition-colors">New Folder</button>
                  <button onClick={() => setModal("uploadFile")} className="text-sm px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-xl text-white font-bold transition-colors">Upload File</button>
                </div>
              </div>
            )}
<div>
<p className="text-zinc-600 text-sm mb-6">
  Create a folder or upload your first file.{" "}
  <span className="text-zinc-700">Double-click folders to open, double-click files to preview.</span>
</p></div>
            {/* GRID VIEW */}
            {view === "grid" && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {currentFolders.map(folder => (
                  <div
                    key={folder.id}
                    className="group relative bg-[#0d0d15] border border-white/5 hover:border-violet-500/30 rounded-2xl p-4 cursor-pointer transition-all hover:bg-violet-500/5"
                    onDoubleClick={() => openFolder(folder)}
                    onClick={() => setSelected({ type: "folder", id: folder.id })}
                  >
                    <div className={`absolute inset-0 rounded-2xl border transition-colors ${selected?.id === folder.id && selected?.type === "folder" ? "border-violet-500/50 bg-violet-500/5" : "border-transparent"}`} />
                    <div className="text-3xl mb-3">📁</div>
                    <p className="text-white text-xs font-medium truncate">{folder.name}</p>
                    <p className="text-zinc-700 text-xs mt-0.5">{formatDate(folder.createdAt)}</p>
                    {selected?.id === folder.id && selected?.type === "folder" && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setModal("deleteFolder"); }}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >✕</button>
                    )}
                  </div>
                ))}
                {currentFiles.map(file => (
                  <div
                    key={file.id}
                    className="group relative bg-[#0d0d15] border border-white/5 hover:border-fuchsia-500/30 rounded-2xl p-4 cursor-pointer transition-all hover:bg-fuchsia-500/5"
                    onClick={() => { setSelected({ type: "file", id: file.id }); setPreviewFile(file); }}
                  >
                    <div className={`absolute inset-0 rounded-2xl border transition-colors ${selected?.id === file.id && selected?.type === "file" ? "border-fuchsia-500/50 bg-fuchsia-500/5" : "border-transparent"}`} />
                    <div className="text-3xl mb-3">{getMimeIcon(file.mimeType)}</div>
                    <p className="text-white text-xs font-medium truncate">{file.name}</p>
                    <p className="text-zinc-700 text-xs mt-0.5">{formatSize(file.size)}</p>
                    {selected?.id === file.id && selected?.type === "file" && (
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a href={file.url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="w-6 h-6 bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 rounded-lg text-xs flex items-center justify-center">↗</a>
                        <button onClick={(e) => { e.stopPropagation(); setModal("deleteFile"); }} className="w-6 h-6 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs flex items-center justify-center">✕</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* LIST VIEW */}
            {view === "list" && (
              <div className="space-y-1">
                {(currentFolders.length > 0 || currentFiles.length > 0) && (
                  <div className="grid grid-cols-12 gap-4 px-4 py-2 text-zinc-700 text-xs uppercase tracking-widest">
                    <div className="col-span-6">Name</div>
                    <div className="col-span-2 hidden sm:block">Type</div>
                    <div className="col-span-2 hidden sm:block">Size</div>
                    <div className="col-span-2">Date</div>
                  </div>
                )}
                {currentFolders.map(folder => (
                  <div
                    key={folder.id}
                    className={`grid grid-cols-12 gap-4 px-4 py-3 rounded-xl cursor-pointer transition-all group
                      ${selected?.id === folder.id && selected?.type === "folder" ? "bg-violet-500/10 border border-violet-500/20" : "hover:bg-white/3 border border-transparent"}`}
                    onDoubleClick={() => openFolder(folder)}
                    onClick={() => setSelected({ type: "folder", id: folder.id })}
                  >
                    <div className="col-span-6 flex items-center gap-3 min-w-0">
                      <span className="text-lg flex-shrink-0">📁</span>
                      <span className="text-white text-sm truncate">{folder.name}</span>
                    </div>
                    <div className="col-span-2 hidden sm:flex items-center"><span className="text-zinc-600 text-xs">Folder</span></div>
                    <div className="col-span-2 hidden sm:flex items-center"><span className="text-zinc-600 text-xs">—</span></div>
                    <div className="col-span-2 flex items-center justify-between">
                      <span className="text-zinc-600 text-xs">{formatDate(folder.createdAt)}</span>
                      <button onClick={(e) => { e.stopPropagation(); setSelected({ type: "folder", id: folder.id }); setModal("deleteFolder"); }} className="opacity-0 group-hover:opacity-100 text-red-400 text-xs hover:text-red-300 transition-all">✕</button>
                    </div>
                  </div>
                ))}
                {currentFiles.map(file => (
                  <div
                    key={file.id}
                    className={`grid grid-cols-12 gap-4 px-4 py-3 rounded-xl cursor-pointer transition-all group
                      ${selected?.id === file.id && selected?.type === "file" ? "bg-fuchsia-500/10 border border-fuchsia-500/20" : "hover:bg-white/3 border border-transparent"}`}
                    onClick={() => { setSelected({ type: "file", id: file.id }); setPreviewFile(file); }}
                  >
                    <div className="col-span-6 flex items-center gap-3 min-w-0">
                      <span className="text-lg flex-shrink-0">{getMimeIcon(file.mimeType)}</span>
                      <span className="text-white text-sm truncate">{file.name}</span>
                    </div>
                    <div className="col-span-2 hidden sm:flex items-center"><span className="text-zinc-600 text-xs truncate">{file.mimeType.split("/")[1]}</span></div>
                    <div className="col-span-2 hidden sm:flex items-center"><span className="text-zinc-600 text-xs">{formatSize(file.size)}</span></div>
                    <div className="col-span-2 flex items-center justify-between">
                      <span className="text-zinc-600 text-xs">{formatDate(file.createdAt)}</span>
                      <div className="opacity-0 group-hover:opacity-100 flex gap-2 transition-all">
                        <a href={file.url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="text-violet-400 text-xs hover:text-violet-300">↗</a>
                        <button onClick={(e) => { e.stopPropagation(); setSelected({ type: "file", id: file.id }); setModal("deleteFile"); }} className="text-red-400 text-xs hover:text-red-300">✕</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── CREATE FOLDER MODAL ─────────────────────────────── */}
      {modal === "createFolder" && (
        <ModalWrapper title="New Folder" onClose={closeModal}>
          <div className="space-y-4">
            <div>
              <label className="text-zinc-500 text-xs uppercase tracking-widest block mb-2">Folder Name</label>
              <input
                autoFocus
                value={folderName}
                onChange={e => setFolderName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleCreateFolder()}
                placeholder="e.g. Documents"
                className="w-full bg-white/5 border border-white/10 focus:border-violet-500/50 rounded-xl px-4 py-3 text-white text-sm placeholder-zinc-700 outline-none transition-colors"
              />
            </div>
            {currentFolder && (
              <p className="text-zinc-600 text-xs">Inside: <span className="text-violet-400">{currentFolder.name}</span></p>
            )}
            <button onClick={handleCreateFolder} className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90 text-white font-bold py-3 rounded-xl text-sm transition-all">
              Create Folder
            </button>
          </div>
        </ModalWrapper>
      )}

      {/* ── UPLOAD FILE MODAL ───────────────────────────────── */}
      {modal === "uploadFile" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <FileUpload
            folderId={currentFolder?.id}
            folderPath={currentFolder?.path || "/"}
            onSuccess={() => {
              fetchFiles(currentFolder?.id);
              showToast("File uploaded successfully");
            }}
            onClose={closeModal}
          />
        </div>
      )}

      {/* ── DELETE FOLDER MODAL ─────────────────────────────── */}
      {modal === "deleteFolder" && (
        <ModalWrapper title="Delete Folder" onClose={closeModal}>
          <div className="space-y-4">
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <p className="text-red-400 text-sm">⚠️ This action cannot be undone. The folder must be empty to delete.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={closeModal} className="flex-1 py-3 border border-white/10 rounded-xl text-zinc-400 text-sm hover:border-white/20 transition-colors">Cancel</button>
              <button onClick={handleDeleteFolder} className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-sm transition-colors">Delete</button>
            </div>
          </div>
        </ModalWrapper>
      )}

      {/* ── DELETE FILE MODAL ───────────────────────────────── */}
      {modal === "deleteFile" && (
        <ModalWrapper title="Delete File" onClose={closeModal}>
          <div className="space-y-4">
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <p className="text-red-400 text-sm">⚠️ This will permanently delete the file and free up storage.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={closeModal} className="flex-1 py-3 border border-white/10 rounded-xl text-zinc-400 text-sm hover:border-white/20 transition-colors">Cancel</button>
              <button onClick={handleDeleteFile} className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-sm transition-colors">Delete</button>
            </div>
          </div>
        </ModalWrapper>
      )}

      {/* ── FILE PREVIEW MODAL ──────────────────────────────── */}
      {previewFile && (
        <ModalWrapper title={previewFile.name} onClose={() => setPreviewFile(null)}>
          <div className="space-y-4">

            {/* Preview area */}
            <div className="bg-white/3 border border-white/8 rounded-xl overflow-hidden flex items-center justify-center min-h-48">
              {previewFile.mimeType.includes("image") ? (
                <img
                  src={previewFile.url}
                  alt={previewFile.name}
                  className="max-w-full max-h-72 object-contain rounded-xl"
                />
              ) : previewFile.mimeType.includes("video") ? (
                <video src={previewFile.url} controls className="max-w-full max-h-72 rounded-xl w-full" />
              ) : previewFile.mimeType.includes("audio") ? (
                <div className="w-full px-4 py-6 space-y-3">
                  <div className="text-4xl text-center">🎵</div>
                  <audio src={previewFile.url} controls className="w-full" />
                </div>
              ) : previewFile.mimeType.includes("pdf") ? (
                <div className="text-center py-8 space-y-2">
                  <div className="text-5xl">📄</div>
                  <p className="text-zinc-500 text-xs">PDF — open to view</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-5xl mb-3">{getMimeIcon(previewFile.mimeType)}</div>
                  <p className="text-zinc-500 text-xs">Preview not available</p>
                </div>
              )}
            </div>

            {/* File metadata grid */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Size",     value: formatSize(previewFile.size) },
                { label: "Type",     value: previewFile.mimeType.split("/")[1]?.toUpperCase() || "—" },
                { label: "Path",     value: previewFile.path },
                { label: "Uploaded", value: formatDate(previewFile.createdAt) },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white/3 border border-white/8 rounded-xl px-3 py-2">
                  <p className="text-zinc-600 text-xs uppercase tracking-widest mb-0.5">{label}</p>
                  <p className="text-white text-xs font-medium truncate">{value}</p>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSelected({ type: "file", id: previewFile.id });
                  setPreviewFile(null);
                  setModal("deleteFile");
                }}
                className="flex-1 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm hover:bg-red-500/20 transition-colors"
              >
                Delete
              </button>
              <a
                href={previewFile.url}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90 text-white font-bold rounded-xl text-sm text-center transition-opacity"
              >
                Open File ↗
              </a>
            </div>
          </div>
        </ModalWrapper>
      )}
    </div>
  );
}