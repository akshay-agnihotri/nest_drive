import Sort from "@/components/Sort";
import React from "react";
import { formatBytes } from "@/lib/utils";
import Card from "@/components/Card";
import { FileDocument } from "@/lib/types";
import { getCurrentUserFiles } from "@/lib/actions/file.action";
import ErrorState from "@/components/ErrorState";

const FilePage = async ({ params }: { params: Promise<{ type: string }> }) => {
  const { type } = await params;

  // Layout guarantees user exists, so handle errors gracefully without redirect
  const result = await getCurrentUserFiles(type);

  const { files, totalSize, error, message } = result;
  const formattedTotalSize = formatBytes(totalSize || 0);

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
        <ErrorState error={error} message={message} type={type} />
      )}
    </div>
  );
};

export default FilePage;
