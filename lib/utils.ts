import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import appWriteConfig from "./appwrite/config";

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


export function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}


export const withRetry = async <T>(
  fn: () => Promise<T>,
  retries: number = 1,
  delay: number = 500
): Promise<T | null> => {

  for (let i = 0; i <= retries; i++) {
    try {
      const result = await fn();

      if (result) {
        return result;
      }

      if (i < retries) {
        if (delay > 0) {
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    } catch (error) {
      console.log(error);
      
      if (i < retries) {
        if (delay > 0) {
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
  }

  return null;
};

export const generateFileURL = (bucketField: string) => {
  const { endpoint, projectId, bucketId } = appWriteConfig;
  return `${endpoint}/storage/buckets/${bucketId}/files/${bucketField}/view?project=${projectId}`;
};

export const generateFileDownloadURL = (bucketField: string) => {
  const { endpoint, projectId, bucketId } = appWriteConfig;
  return `${endpoint}/storage/buckets/${bucketId}/files/${bucketField}/download?project=${projectId}`;
};

export const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);

  // Get time in 12-hour format with a.m./p.m.
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };

  // Get date with short month
  const dateOptions: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
  };

  const time = date.toLocaleTimeString("en-US", timeOptions).toLowerCase();
  const formattedDate = date.toLocaleDateString("en-US", dateOptions);

  return `${time}, ${formattedDate}`;
};

export const actionsDropdownItems = [
  {
    label: "Rename",
    icon: "/assets/icons/edit.svg",
    value: "rename",
  },
  {
    label: "Details",
    icon: "/assets/icons/info.svg",
    value: "details",
  },
  {
    label: "Share",
    icon: "/assets/icons/share.svg",
    value: "share",
  },
  {
    label: "Download",
    icon: "/assets/icons/download.svg",
    value: "download",
  },
  {
    label: "Delete",
    icon: "/assets/icons/delete.svg",
    value: "delete",
  },
];
