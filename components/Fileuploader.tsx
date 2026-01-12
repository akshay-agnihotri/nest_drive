"use client";
import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "./ui/button";
import { cn, getFileType } from "@/lib/utils";
import Image from "next/image";
import Thumbnail from "./Thumbnail";
import { uploadFile } from "@/lib/actions/file.action";
import { usePathname } from "next/navigation";
import {
  showUploadSuccessToast,
  showUploadErrorToast,
  showFileSizeErrorToast,
} from "./Toast"; // Import toast functions

// Helper function to create a delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const Fileuploader = ({
  ownerId,
  className,
}: {
  ownerId: string;
  className: string;
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const path = usePathname();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => [...prev, ...acceptedFiles]);
  }, []);

  const handleUploadAll = async () => {
    setIsUploading(true);

    await Promise.allSettled(
      files.map(async (file) => {
        // Client-side validation
        if (file.size > 50 * 1024 * 1024) {
          console.log(`File size exceeds the limit of 50 MB.`);

          // Use toast function
          showFileSizeErrorToast(file.name);

          // Remove the file from the preview list
          setFiles((prev) => prev.filter((f) => f.name !== file.name));
          return;
        }

        const maxRetries = 3;

        // Loop for retrying the upload of a single file
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            // Attempt to upload the file
            const result = await uploadFile(file, ownerId, path);

            if (!result.success) {
              throw new Error(result.error || "Upload failed.");
            }

            // If successful:
            setFiles((prev) => prev.filter((f) => f.name !== file.name));

            // Use toast function
            showUploadSuccessToast(file.name);

            return; // Exit the retry loop for this file
          } catch (error) {
            console.log(`Attempt ${attempt} failed for "${file.name}":`, error);

            // If this was the final attempt, show the error toast
            if (attempt === maxRetries) {
              // Use toast function
              showUploadErrorToast(file.name);

              // Remove the failed file from the preview list
              setFiles((prev) => prev.filter((f) => f.name !== file.name));
            } else {
              // Wait for 500 milliseconds before the next attempt
              await delay(500);
            }
          }
        }
      })
    );

    setIsUploading(false);
  };

  const handleRemoveFile = (
    e: React.MouseEvent<HTMLImageElement>,
    file: File
  ) => {
    e.stopPropagation();
    setFiles((prev) => prev.filter((f) => f.name !== file.name));
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    disabled: isUploading,
  });

  return (
    <div className="flex flex-col gap-4">
      <div {...getRootProps()} className="cursor-pointer">
        <input {...getInputProps()} />
        <Button
          type="button"
          className={cn("uploader-button", className)}
          disabled={isUploading}
        >
          <Image
            src="/assets/icons/upload.svg"
            alt="Upload Icon"
            width={24}
            height={24}
            className="mr-2"
          />
          Select Files
        </Button>
      </div>

      {files.length > 0 && (
        <>
          <ul className="uploader-preview-list">
            <h4 className="h4 text-light-100">
              {isUploading ? "Uploading..." : "Ready to Upload"}
            </h4>
            {files.map((file, index) => {
              const { type, extension } = getFileType(file.name);
              return (
                <li key={index} className="uploader-preview-item">
                  <div className="flex items-center gap-3">
                    <Thumbnail type={type} extension={extension} />
                    <div className="preview-item-name">
                      {file.name}
                      {isUploading && (
                        <Image
                          src={"/assets/icons/file-loader.gif"}
                          alt={`loader`}
                          width={80}
                          height={26}
                        />
                      )}
                    </div>
                  </div>
                  {!isUploading && (
                    <Image
                      src={"/assets/icons/remove.svg"}
                      alt={`Remove Icon`}
                      width={24}
                      height={24}
                      onClick={(e) => handleRemoveFile(e, file)}
                    />
                  )}
                </li>
              );
            })}
          </ul>
          <Button
            onClick={handleUploadAll}
            disabled={isUploading}
            className="w-full"
          >
            {isUploading ? "Uploading..." : `Upload ${files.length} File(s)`}
          </Button>
        </>
      )}
    </div>
  );
};

export default Fileuploader;
