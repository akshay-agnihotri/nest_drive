"use client";
import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "./ui/button";
import { cn, getFileType } from "@/lib/utils";
import Image from "next/image";
import Thumbnail from "./Thumbnail";
import { uploadFile } from "@/lib/actions/file.action";
import { toast } from "sonner";
import { usePathname } from "next/navigation";

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
  const [isUploading, setIsUploading] = useState<boolean>(false); // This state is not used, consider removing it
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
          // 50 MB limit
          console.log(`File size exceeds the limit of 50 MB.`);
          // show error toast
          toast.error(`Could not upload "${file.name}"`, {
            description: "file size exceeds the limit of 50 MB.",
            style: {
              backgroundColor: "#FA7275",
              color: "white",
              border: "1px solid #dc2626",
              borderRadius: "0.5rem",
              boxShadow:
                "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
              padding: "1rem",
            },
          });
          // Remove the file from the preview list
          setFiles((prev) => prev.filter((f) => f.name !== file.name));
          return;
        }

        const maxRetries = 3; // Total number of attempts

        // Loop for retrying the upload of a single file
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            // Attempt to upload the file
            const result = await uploadFile(file, ownerId, path);

            if (!result.success) {
              // If the server returns a failure, treat it as an error to trigger a retry
              throw new Error(result.error || "Upload failed.");
            }

            // If successful:
            setFiles((prev) => prev.filter((f) => f.name !== file.name));
            toast.success(`"${file.name}" has been uploaded.`, {
              style: {
                backgroundColor: "#22c55e",
                color: "white",
                border: "1px solid #16a34a",
                borderRadius: "0.5rem",
                boxShadow:
                  "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
                padding: "1rem",
              },
            });
            return; // Exit the retry loop for this file
          } catch (error) {
            console.log(`Attempt ${attempt} failed for "${file.name}":`, error);

            // If this was the final attempt, show the error toast
            if (attempt === maxRetries) {
              toast.error(`Could not upload "${file.name}"`, {
                description: "Please try again.",
                style: {
                  backgroundColor: "#FA7275",
                  color: "white",
                  border: "1px solid #dc2626",
                  borderRadius: "0.5rem",
                  boxShadow:
                    "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)", // for 'shadow-lg'
                  padding: "1rem",
                },
              });
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
    disabled: isUploading, // This will disable the dropzone when uploading
  });

  return (
    // --- FIX IS HERE: Main container ab flex-col hai ---
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
