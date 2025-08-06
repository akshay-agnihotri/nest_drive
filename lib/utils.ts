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

/**
 * Converts a file size in bytes to a human-readable string (e.g., KB, MB, GB).
 * @param bytes - The file size in bytes.
 * @param decimals - The number of decimal places to include (default is 2).
 * @returns A formatted string representing the file size.
 */
export function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

/**
 * Retry utility function for handling network issues
 * @param fn - The async function to retry
 * @param retries - Number of retries (default: 1, total 2 attempts)
 * @param delay - Delay between retries in milliseconds (default: 500ms for quick retry)
 * @returns The result of the function or null if all retries fail
 */
export const withRetry = async <T>(
  fn: () => Promise<T>,
  retries: number = 1,
  delay: number = 500
): Promise<T | null> => {
  let lastError: unknown = null;

  for (let i = 0; i <= retries; i++) {
    try {
      console.log(`🔄 Attempt ${i + 1}/${retries + 1}...`);
      const result = await fn();

      if (result) {
        console.log(`✅ Success on attempt ${i + 1}`);
        return result;
      }

      if (i < retries) {
        console.log(
          `⚠️ Attempt ${i + 1}: Function returned falsy value, retrying...`
        );
        if (delay > 0) {
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    } catch (error) {
      lastError = error;
      console.log(`❌ Attempt ${i + 1}: Error occurred:`, error);

      if (i < retries) {
        console.log(`🔄 Retrying in ${delay}ms...`);
        if (delay > 0) {
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
  }

  console.log(
    `💀 All ${retries + 1} attempts failed, returning null. Last error:`,
    lastError
  );
  // NEVER THROW - Always return null
  return null;
};

/**
 * Generate file URL from bucketField ID
 */
export const generateFileURL = (bucketField: string) => {
  const { endpoint, projectId, bucketId } = appWriteConfig;
  return `${endpoint}/storage/buckets/${bucketId}/files/${bucketField}/view?project=${projectId}`;
};

