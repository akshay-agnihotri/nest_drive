import Sort from "@/components/Sort";
// 'getFiles' ki ab zaroorat nahi hai
import { getCurrentUser } from "@/lib/actions/user.action";
import { redirect } from "next/navigation";
import React from "react";
import Image from "next/image";
import Thumbnail from "@/components/Thumbnail";
import { formatBytes } from "@/lib/utils";

// Define a type for the file documents for better type safety
interface FileDocument {
  $id: string;
  name: string;
  type: string;
  extension: string;
  size: number;
}

const FilePage = async ({ params }: { params: Promise<{ type: string }> }) => {
  const { type } = await params;

  // 1. Sirf ek baar current user ko fetch karein
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/sign-in");
  }

  let files = [];
  if (currentUser.files && currentUser.files.length > 0) {
    if (type === "all") {
      // Ek 'all' type ka case add karein
      files = currentUser.files;
    } else {
      files = currentUser.files.filter(
        (file: { type: string }) => file.type === type
      );
    }
  }

  const totalSize: number = files.reduce(
    (sum: number, file: FileDocument): number => sum + file.size,
    0
  );
  const formattedTotalSize = formatBytes(totalSize);

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

      <section className="mt-8">
        {files.length > 0 ? (
          <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {files.map((file: FileDocument) => (
              <li key={file.$id} className="file-card">
                <div className="file-card-thumbnail">
                  <Thumbnail type={file.type} extension={file.extension} />
                </div>
                <div className="file-card-details">
                  <p className="body-1 truncate">{file.name}</p>
                  <p className="caption text-light-200">
                    {formatBytes(file.size)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
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
        )}
      </section>
    </div>
  );
};

export default FilePage;
