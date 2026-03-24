"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import {
  Upload,
  Play,
  Pause,
  Scissors,
  Type,
  Trash2,
  Download,
  ChevronUp,
  ChevronDown,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  Film,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Clip {
  id: string;
  file: File;
  objectUrl: string;
  duration: number;   // seconds
  trimStart: number;  // seconds
  trimEnd: number;    // seconds
  name: string;
}

interface Caption {
  id: string;
  text: string;
  startTime: number; // seconds from start of full timeline
  endTime: number;
  x: number;         // % from left
  y: number;         // % from top
  fontSize: number;
  color: string;
}

type EditorStatus =
  | "idle"
  | "loading-ffmpeg"
  | "ready"
  | "rendering"
  | "done"
  | "error";

interface VideoEditorProps {
  onExport: (file: File) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function uid(): string {
  return Math.random().toString(36).slice(2);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function VideoEditor({ onExport }: VideoEditorProps) {
  const [clips, setClips] = useState<Clip[]>([]);
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [status, setStatus] = useState<EditorStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"clips" | "captions">("clips");
  const [previewClipId, setPreviewClipId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [newCaption, setNewCaption] = useState({ text: "", startTime: 0, endTime: 3, color: "#ffffff", fontSize: 32, x: 50, y: 80 });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const ffmpegRef = useRef<FFmpeg | null>(null);

  // Total timeline duration
  const totalDuration = clips.reduce(
    (sum, c) => sum + (c.trimEnd - c.trimStart),
    0
  );

  // Load FFmpeg on first use
  async function ensureFFmpeg() {
    if (ffmpegRef.current) return ffmpegRef.current;
    setStatus("loading-ffmpeg");
    const ffmpeg = new FFmpeg();
    ffmpeg.on("progress", ({ progress: p }) => setProgress(Math.round(p * 100)));
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
    });
    ffmpegRef.current = ffmpeg;
    setStatus("ready");
    return ffmpeg;
  }

  // ─── Add clips ────────────────────────────────────────────────────────────

  function handleFiles(files: FileList) {
    Array.from(files)
      .filter((f) => f.type.startsWith("video/"))
      .forEach((file) => {
        const objectUrl = URL.createObjectURL(file);
        const video = document.createElement("video");
        video.src = objectUrl;
        video.onloadedmetadata = () => {
          const dur = video.duration;
          const clip: Clip = {
            id: uid(),
            file,
            objectUrl,
            duration: dur,
            trimStart: 0,
            trimEnd: dur,
            name: file.name.replace(/\.[^.]+$/, ""),
          };
          setClips((prev) => [...prev, clip]);
          setSelectedClipId(clip.id);
          if (!previewClipId) setPreviewClipId(clip.id);
        };
      });
  }

  function removeClip(id: string) {
    setClips((prev) => {
      const removed = prev.find((c) => c.id === id);
      if (removed) URL.revokeObjectURL(removed.objectUrl);
      return prev.filter((c) => c.id !== id);
    });
    if (previewClipId === id) setPreviewClipId(null);
    if (selectedClipId === id) setSelectedClipId(null);
  }

  function moveClip(id: string, dir: -1 | 1) {
    setClips((prev) => {
      const idx = prev.findIndex((c) => c.id === id);
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const arr = [...prev];
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return arr;
    });
  }

  function updateTrim(id: string, field: "trimStart" | "trimEnd", value: number) {
    setClips((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const updated = { ...c, [field]: value };
        // guard
        if (updated.trimStart < 0) updated.trimStart = 0;
        if (updated.trimEnd > c.duration) updated.trimEnd = c.duration;
        if (updated.trimStart >= updated.trimEnd - 0.5) {
          if (field === "trimStart") updated.trimStart = Math.max(0, updated.trimEnd - 0.5);
          else updated.trimEnd = Math.min(c.duration, updated.trimStart + 0.5);
        }
        return updated;
      })
    );
  }

  // ─── Preview ──────────────────────────────────────────────────────────────

  const previewClip = clips.find((c) => c.id === previewClipId) ?? null;

  function handleVideoTimeUpdate() {
    if (!videoPreviewRef.current || !previewClip) return;
    if (videoPreviewRef.current.currentTime >= previewClip.trimEnd) {
      videoPreviewRef.current.pause();
      videoPreviewRef.current.currentTime = previewClip.trimStart;
      setPlaying(false);
    }
  }

  function togglePlay() {
    if (!videoPreviewRef.current || !previewClip) return;
    if (playing) {
      videoPreviewRef.current.pause();
      setPlaying(false);
    } else {
      videoPreviewRef.current.currentTime = previewClip.trimStart;
      videoPreviewRef.current.play();
      setPlaying(true);
    }
  }

  // Reset player when clip changes
  useEffect(() => {
    if (!videoPreviewRef.current || !previewClip) return;
    videoPreviewRef.current.currentTime = previewClip.trimStart;
    setPlaying(false);
  }, [previewClipId]);

  // ─── Captions ─────────────────────────────────────────────────────────────

  function addCaption() {
    if (!newCaption.text.trim()) return;
    setCaptions((prev) => [
      ...prev,
      { id: uid(), ...newCaption },
    ]);
    setNewCaption((p) => ({ ...p, text: "" }));
  }

  function removeCaption(id: string) {
    setCaptions((prev) => prev.filter((c) => c.id !== id));
  }

  // ─── Export / Render ──────────────────────────────────────────────────────

  async function handleExport() {
    if (clips.length === 0) return;
    setErrorMsg(null);
    setProgress(0);
    try {
      const ffmpeg = await ensureFFmpeg();
      setStatus("rendering");

      // Write all clip files
      for (let i = 0; i < clips.length; i++) {
        const clip = clips[i];
        await ffmpeg.writeFile(`input${i}.mp4`, await fetchFile(clip.file));
      }

      if (clips.length === 1) {
        // Single clip: trim + captions
        const clip = clips[0];
        const duration = clip.trimEnd - clip.trimStart;

        // Build drawtext filters for captions
        const captionFilters = captions
          .filter((cap) => cap.startTime < duration && cap.endTime > 0)
          .map((cap) => {
            const start = Math.max(0, cap.startTime);
            const end = Math.min(duration, cap.endTime);
            const escaped = cap.text
              .replace(/'/g, "\\'")
              .replace(/:/g, "\\:")
              .replace(/\[/g, "\\[")
              .replace(/\]/g, "\\]");
            return `drawtext=text='${escaped}':x=(w*${cap.x / 100}):y=(h*${cap.y / 100}):fontsize=${cap.fontSize}:fontcolor=${cap.color}:enable='between(t\\,${start}\\,${end})'`;
          });

        const vf = captionFilters.length > 0 ? captionFilters.join(",") : "copy";

        if (captionFilters.length > 0) {
          await ffmpeg.exec([
            "-ss", String(clip.trimStart),
            "-i", "input0.mp4",
            "-t", String(duration),
            "-vf", vf,
            "-c:v", "libx264",
            "-c:a", "aac",
            "-preset", "ultrafast",
            "output.mp4",
          ]);
        } else {
          await ffmpeg.exec([
            "-ss", String(clip.trimStart),
            "-i", "input0.mp4",
            "-t", String(duration),
            "-c", "copy",
            "output.mp4",
          ]);
        }
      } else {
        // Multiple clips: trim each, then concat
        const concatLines: string[] = [];

        for (let i = 0; i < clips.length; i++) {
          const clip = clips[i];
          await ffmpeg.exec([
            "-ss", String(clip.trimStart),
            "-i", `input${i}.mp4`,
            "-t", String(clip.trimEnd - clip.trimStart),
            "-c:v", "libx264",
            "-c:a", "aac",
            "-preset", "ultrafast",
            `part${i}.mp4`,
          ]);
          concatLines.push(`file 'part${i}.mp4'`);
        }

        // Write concat list
        const listContent = concatLines.join("\n");
        await ffmpeg.writeFile("list.txt", listContent);

        await ffmpeg.exec([
          "-f", "concat",
          "-safe", "0",
          "-i", "list.txt",
          "-c", "copy",
          "output.mp4",
        ]);
      }

      // Read result
      const data = await ffmpeg.readFile("output.mp4");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const blob = new Blob([data as any], { type: "video/mp4" });
      const outputFile = new File([blob], "edited-video.mp4", { type: "video/mp4" });

      setStatus("done");
      onExport(outputFile);
    } catch (err) {
      console.error(err);
      setErrorMsg("שגיאה בעיבוד הוידאו. נסה קבצים קצרים יותר.");
      setStatus("error");
    }
  }

  const selectedClip = clips.find((c) => c.id === selectedClipId) ?? null;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="bg-dark-100 border border-dark-400 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-dark-400">
        <div className="flex items-center gap-2">
          <Film className="text-gold" size={18} />
          <span className="font-bold text-white text-sm">עורך וידאו</span>
          {totalDuration > 0 && (
            <span className="badge-gray text-xs">{fmtTime(totalDuration)}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {status === "loading-ffmpeg" && (
            <span className="text-gray-400 text-xs flex items-center gap-1">
              <Loader2 size={12} className="animate-spin" /> טוען מנוע עריכה...
            </span>
          )}
          {status === "rendering" && (
            <span className="text-gold text-xs flex items-center gap-1">
              <Loader2 size={12} className="animate-spin" /> מעבד... {progress}%
            </span>
          )}
          {status === "done" && (
            <span className="text-green-400 text-xs flex items-center gap-1">
              <CheckCircle2 size={12} /> מוכן להעלאה
            </span>
          )}
          {clips.length > 0 && status !== "rendering" && status !== "loading-ffmpeg" && (
            <button
              onClick={handleExport}
              className="btn-gold text-xs flex items-center gap-1.5 py-1.5 px-3"
            >
              <Download size={13} />
              {status === "done" ? "ייצוא שנית" : "ייצוא לפוסט"}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row" style={{ minHeight: 400 }}>
        {/* Left: Preview */}
        <div className="flex-1 bg-black flex flex-col items-center justify-center p-4 min-h-[240px]">
          {previewClip ? (
            <div className="w-full relative">
              <video
                ref={videoPreviewRef}
                src={previewClip.objectUrl}
                className="w-full rounded-lg max-h-[320px] object-contain"
                onTimeUpdate={handleVideoTimeUpdate}
                onLoadedMetadata={() => {
                  if (videoPreviewRef.current)
                    videoPreviewRef.current.currentTime = previewClip.trimStart;
                }}
              />
              {/* Active captions overlay */}
              {captions.map((cap) => (
                <div
                  key={cap.id}
                  className="absolute pointer-events-none font-bold drop-shadow-lg"
                  style={{
                    left: `${cap.x}%`,
                    top: `${cap.y}%`,
                    fontSize: cap.fontSize * 0.5,
                    color: cap.color,
                    textShadow: "0 1px 4px #000",
                    transform: "translateX(-50%)",
                  }}
                >
                  {cap.text}
                </div>
              ))}
              <button
                onClick={togglePlay}
                className="absolute bottom-3 left-3 bg-black/60 rounded-full p-2 text-white hover:bg-black/80 transition-colors"
              >
                {playing ? <Pause size={16} /> : <Play size={16} />}
              </button>
            </div>
          ) : (
            <div className="text-center text-gray-600">
              <Film size={48} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">הוסף קליפ לצפייה מקדימה</p>
            </div>
          )}
        </div>

        {/* Right: Controls */}
        <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-r border-dark-400 flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-dark-400">
            <button
              onClick={() => setActiveTab("clips")}
              className={cn(
                "flex-1 py-2.5 text-xs font-medium transition-colors",
                activeTab === "clips"
                  ? "text-gold border-b-2 border-gold"
                  : "text-gray-500 hover:text-white"
              )}
            >
              <Scissors size={13} className="inline ml-1" />
              קליפים ({clips.length})
            </button>
            <button
              onClick={() => setActiveTab("captions")}
              className={cn(
                "flex-1 py-2.5 text-xs font-medium transition-colors",
                activeTab === "captions"
                  ? "text-gold border-b-2 border-gold"
                  : "text-gray-500 hover:text-white"
              )}
            >
              <Type size={13} className="inline ml-1" />
              כיתובים ({captions.length})
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {/* ── Clips Tab ────────────────────────────────── */}
            {activeTab === "clips" && (
              <>
                {/* Add clip button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-dark-400 hover:border-gold/50 rounded-xl p-3 text-center text-gray-500 hover:text-white text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={15} />
                  הוסף קליפ וידאו
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  multiple
                  className="hidden"
                  onChange={(e) => e.target.files && handleFiles(e.target.files)}
                />

                {/* Clip list */}
                {clips.map((clip, idx) => (
                  <div
                    key={clip.id}
                    className={cn(
                      "rounded-xl border p-3 cursor-pointer transition-all",
                      selectedClipId === clip.id
                        ? "border-gold/50 bg-gold/5"
                        : "border-dark-400 bg-dark-200 hover:border-dark-300"
                    )}
                    onClick={() => {
                      setSelectedClipId(clip.id);
                      setPreviewClipId(clip.id);
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white text-xs font-medium truncate max-w-[120px]">
                        {idx + 1}. {clip.name}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); moveClip(clip.id, -1); }}
                          disabled={idx === 0}
                          className="text-gray-600 hover:text-white disabled:opacity-20 p-0.5"
                        >
                          <ChevronUp size={13} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); moveClip(clip.id, 1); }}
                          disabled={idx === clips.length - 1}
                          className="text-gray-600 hover:text-white disabled:opacity-20 p-0.5"
                        >
                          <ChevronDown size={13} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); removeClip(clip.id); }}
                          className="text-gray-600 hover:text-red-400 p-0.5 mr-1"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Trim controls */}
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>התחלה</span>
                          <span className="text-gold font-mono">{fmtTime(clip.trimStart)}</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={clip.duration}
                          step={0.1}
                          value={clip.trimStart}
                          onChange={(e) =>
                            updateTrim(clip.id, "trimStart", parseFloat(e.target.value))
                          }
                          onClick={(e) => e.stopPropagation()}
                          className="w-full accent-gold h-1.5"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>סוף</span>
                          <span className="text-gold font-mono">{fmtTime(clip.trimEnd)}</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={clip.duration}
                          step={0.1}
                          value={clip.trimEnd}
                          onChange={(e) =>
                            updateTrim(clip.id, "trimEnd", parseFloat(e.target.value))
                          }
                          onClick={(e) => e.stopPropagation()}
                          className="w-full accent-gold h-1.5"
                        />
                      </div>
                      <div className="text-xs text-gray-600 text-center">
                        {fmtTime(clip.trimEnd - clip.trimStart)} מתוך {fmtTime(clip.duration)}
                      </div>
                    </div>
                  </div>
                ))}

                {clips.length === 0 && (
                  <p className="text-gray-600 text-xs text-center py-4">
                    עדיין אין קליפים. לחץ להוספה.
                  </p>
                )}
              </>
            )}

            {/* ── Captions Tab ─────────────────────────────── */}
            {activeTab === "captions" && (
              <>
                {/* Add caption form */}
                <div className="bg-dark-200 rounded-xl p-3 space-y-2.5 border border-dark-400">
                  <input
                    type="text"
                    className="input text-sm py-2"
                    placeholder="טקסט הכיתוב..."
                    value={newCaption.text}
                    onChange={(e) => setNewCaption((p) => ({ ...p, text: e.target.value }))}
                    maxLength={80}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">התחלה (שניות)</label>
                      <input
                        type="number"
                        className="input text-xs py-1.5"
                        min={0}
                        max={totalDuration}
                        step={0.5}
                        value={newCaption.startTime}
                        onChange={(e) =>
                          setNewCaption((p) => ({ ...p, startTime: parseFloat(e.target.value) || 0 }))
                        }
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">סוף (שניות)</label>
                      <input
                        type="number"
                        className="input text-xs py-1.5"
                        min={0.5}
                        max={totalDuration}
                        step={0.5}
                        value={newCaption.endTime}
                        onChange={(e) =>
                          setNewCaption((p) => ({ ...p, endTime: parseFloat(e.target.value) || 3 }))
                        }
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">צבע טקסט</label>
                      <input
                        type="color"
                        className="w-full h-8 rounded-lg border border-dark-400 bg-dark-300 cursor-pointer"
                        value={newCaption.color}
                        onChange={(e) => setNewCaption((p) => ({ ...p, color: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">גודל פונט</label>
                      <input
                        type="number"
                        className="input text-xs py-1.5"
                        min={16}
                        max={80}
                        value={newCaption.fontSize}
                        onChange={(e) =>
                          setNewCaption((p) => ({ ...p, fontSize: parseInt(e.target.value) || 32 }))
                        }
                        dir="ltr"
                      />
                    </div>
                  </div>
                  <button
                    onClick={addCaption}
                    disabled={!newCaption.text.trim()}
                    className="btn-gold w-full text-xs py-2 flex items-center justify-center gap-1.5"
                  >
                    <Plus size={13} />
                    הוסף כיתוב
                  </button>
                </div>

                {/* Caption list */}
                {captions.map((cap) => (
                  <div
                    key={cap.id}
                    className="flex items-center gap-2 bg-dark-200 border border-dark-400 rounded-xl px-3 py-2"
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cap.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-medium truncate">{cap.text}</p>
                      <p className="text-gray-600 text-xs">
                        {fmtTime(cap.startTime)} — {fmtTime(cap.endTime)}
                      </p>
                    </div>
                    <button
                      onClick={() => removeCaption(cap.id)}
                      className="text-gray-600 hover:text-red-400 flex-shrink-0"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}

                {captions.length === 0 && (
                  <p className="text-gray-600 text-xs text-center py-4">
                    עדיין אין כיתובים.
                  </p>
                )}
              </>
            )}
          </div>

          {/* Error */}
          {status === "error" && errorMsg && (
            <div className="m-3 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-red-400 text-xs flex items-start gap-2">
              <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
              {errorMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
