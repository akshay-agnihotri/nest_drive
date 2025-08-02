import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getFileType = (fileName: string) => {
  const extension = fileName.split(".").pop()?.toLowerCase() || "";

  const fileTypes: Record<string, { type: string; extension: string }> = {
    // Images
    jpg: { type: "image", extension: "jpg" },
    jpeg: { type: "image", extension: "jpeg" },
    png: { type: "image", extension: "png" },
    gif: { type: "image", extension: "gif" },
    webp: { type: "image", extension: "webp" },
    svg: { type: "image", extension: "svg" },

    // Documents
    pdf: { type: "document", extension: "pdf" },
    doc: { type: "document", extension: "doc" },
    docx: { type: "document", extension: "docx" },
    txt: { type: "document", extension: "txt" },
    rtf: { type: "document", extension: "rtf" },

    // Spreadsheets
    xls: { type: "spreadsheet", extension: "xls" },
    xlsx: { type: "spreadsheet", extension: "xlsx" },
    csv: { type: "spreadsheet", extension: "csv" },

    // Presentations
    ppt: { type: "presentation", extension: "ppt" },
    pptx: { type: "presentation", extension: "pptx" },

    // Videos
    mp4: { type: "video", extension: "mp4" },
    avi: { type: "video", extension: "avi" },
    mov: { type: "video", extension: "mov" },
    wmv: { type: "video", extension: "wmv" },
    flv: { type: "video", extension: "flv" },
    webm: { type: "video", extension: "webm" },

    // Audio
    mp3: { type: "audio", extension: "mp3" },
    wav: { type: "audio", extension: "wav" },
    flac: { type: "audio", extension: "flac" },
    aac: { type: "audio", extension: "aac" },

    // Archives
    zip: { type: "archive", extension: "zip" },
    rar: { type: "archive", extension: "rar" },
    "7z": { type: "archive", extension: "7z" },
    tar: { type: "archive", extension: "tar" },
    gz: { type: "archive", extension: "gz" },

    // Code files
    js: { type: "code", extension: "js" },
    ts: { type: "code", extension: "ts" },
    jsx: { type: "code", extension: "jsx" },
    tsx: { type: "code", extension: "tsx" },
    html: { type: "code", extension: "html" },
    css: { type: "code", extension: "css" },
    json: { type: "code", extension: "json" },
    xml: { type: "code", extension: "xml" },
    py: { type: "code", extension: "py" },
    java: { type: "code", extension: "java" },
    cpp: { type: "code", extension: "cpp" },
    c: { type: "code", extension: "c" },
  };

  return fileTypes[extension] || { type: "other", extension };
};

export const getFileIcon = (extension: string, type: string) => {
  return type !== "other"
    ? `/assets/icons/${type}-${extension}.png`
    : `/assets/icons/${type}.svg`;
};

export const createFileToUrl = (file: File) => URL.createObjectURL(file);
