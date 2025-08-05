import Sort from "@/components/Sort";
import { redirect } from "next/navigation";
import React from "react";
import Image from "next/image";
import { formatBytes } from "@/lib/utils";
import Card from "@/components/Card";
import { FileDocument } from "@/lib/types";
import { getCurrentUserFiles } from "@/lib/actions/file.action";

const FilePage = async ({ params }: { params: Promise<{ type: string }> }) => {
  const { type } = await params;

  // Get files for current user with type filtering
  const result = await getCurrentUserFiles(type);

  if (result.shouldRedirect) {
    redirect(result.redirectTo!);
  }

  const { files, totalSize, error, message } = result;
  const formattedTotalSize = formatBytes(totalSize || 0);

  // Handle different error states
  const renderEmptyState = () => {
    if (error === "CONNECTION_ERROR" || error === "FETCH_ERROR") {
      return (
        <div className="empty-state">
          <Image
            src="/assets/icons/connection-error.svg"
            alt="Connection error"
            width={100}
            height={100}
          />
          <h3 className="h3 mt-4 text-red-500">Connection Problem</h3>
          <p className="body-1 text-light-200 mt-2">{message}</p>
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
          <h3 className="h3 mt-4">No {type} files found</h3>
          <p className="body-1 text-light-200 mt-2">
            Upload some files to see them here.
          </p>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="page-container">
      <section className="w-full">
        <h1 className="h1 capitalize">{type === "all" ? "All Files" : type}</h1>

        <div className="total-size-section">
          <p className="body-1">
            Total <span className="h5">{formattedTotalSize}</span>
          </p>

          <div className="sort-container">
            <p className="body-1 hidden sm:block text-light-200">Sort by:</p>
            <Sort />
          </div>
        </div>
      </section>

      {files && files.length > 0 ? (
        <section className="file-list">
          {(files as FileDocument[]).map((file: FileDocument) => (
            <Card key={file.$id} file={file} />
          ))}
        </section>
      ) : (
        renderEmptyState()
      )}
    </div>
  );
};

export default FilePage;
