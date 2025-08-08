import { toast } from "sonner";

// Common toast styles
const toastStyles = {
  success: {
    backgroundColor: "#22c55e",
    color: "white",
    border: "1px solid #16a34a",
    borderRadius: "0.5rem",
    boxShadow:
      "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    padding: "1rem",
  },
  error: {
    backgroundColor: "#FA7275",
    color: "white",
    border: "1px solid #dc2626",
    borderRadius: "0.5rem",
    boxShadow:
      "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    padding: "1rem",
  },
};

// File upload specific toasts
export const showUploadSuccessToast = (fileName: string) => {
  toast.success(`"${fileName}" has been uploaded.`, {
    style: toastStyles.success,
  });
};

export const showUploadErrorToast = (
  fileName: string,
  description?: string
) => {
  toast.error(`Could not upload "${fileName}"`, {
    description: description || "Please try again.",
    style: toastStyles.error,
  });
};

export const showFileSizeErrorToast = (fileName: string) => {
  toast.error(`Could not upload "${fileName}"`, {
    description: "file size exceeds the limit of 50 MB.",
    style: toastStyles.error,
  });
};

// File action toasts
export const showRenameSuccessToast = (fileName: string) => {
  toast.success(`File renamed to "${fileName}"`, {
    style: toastStyles.success,
  });
};

export const showRenameErrorToast = (message: string) => {
  toast.error(`Failed to rename file`, {
    description: message,
    style: toastStyles.error,
  });
};

export const showDeleteSuccessToast = (fileName: string) => {
  toast.success(`"${fileName}" has been deleted.`, {
    style: toastStyles.success,
  });
};

export const showDeleteErrorToast = (message: string) => {
  toast.error(`Failed to delete file`, {
    description: message,
    style: toastStyles.error,
  });
};

export const showShareSuccessToast = (fileName: string) => {
  toast.success(`"${fileName}" has been shared successfully`, {
    style: toastStyles.success,
  });
};

export const showShareErrorToast = (message: string) => {
  toast.error(`Failed to share file`, {
    description: message,
    style: toastStyles.error,
  });
};
