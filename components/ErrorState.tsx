"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

interface ErrorStateProps {
  error: string | null;
  message?: string;
  type?: string;
}

const ErrorState = ({ error, message, type }: ErrorStateProps) => {
  const router = useRouter();

  const handleRefresh = () => {
    router.refresh(); // ✅ Soft refresh - revalidates server components
  };

  if (
    error === "CONNECTION_ERROR" ||
    error === "FETCH_ERROR" ||
    error === "SESSION_ERROR"
  ) {
    return (
      <div className="empty-state">
        <Image
          src="/assets/icons/empty-folder.svg"
          alt="Connection error"
          width={100}
          height={100}
          className="opacity-50"
        />
        <h3 className="h3 mt-4 text-red-500">Connection Problem</h3>
        <p className="body-1 text-light-200 mt-2">
          {message || "There seems to be a connection issue. Please try again."}
        </p>
        <div className="flex gap-4 mt-4">
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (error === "NO_FILES") {
    return (
      <div className="empty-state">
        <Image
          src="/assets/icons/empty-folder.svg"
          alt="No files found"
          width={100}
          height={100}
        />
        <h3 className="h3 mt-4">No {type === "all" ? "" : type} files yet</h3>
        <p className="body-1 text-light-200 mt-2">
          Start by uploading some {type === "all" ? "files" : `${type} files`}{" "}
          to see them here.
        </p>
      </div>
    );
  }

  // Default error state
  return (
    <div className="empty-state">
      <Image
        src="/assets/icons/empty-folder.svg"
        alt="Error"
        width={100}
        height={100}
        className="opacity-30"
      />
      <h3 className="h3 mt-4">Something went wrong</h3>
      <p className="body-1 text-light-200 mt-2">
        {message || "Please try refreshing the page."}
      </p>
      <button
        onClick={handleRefresh}
        className="mt-4 px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark"
      >
        Refresh Page
      </button>
    </div>
  );
};

export default ErrorState;
