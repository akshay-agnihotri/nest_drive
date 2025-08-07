"use client";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  // DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ActionType, FileDocument } from "@/lib/types";
import { useState } from "react";
import Image from "next/image";
import { actionsDropdownItems, generateFileDownloadURL } from "@/lib/utils";
import Link from "next/link";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { renameFile } from "@/lib/actions/file.action"; // Add this import at the top
import { showRenameSuccessToast, showRenameErrorToast } from "./Toast"; // ✅ Import toast functions
import { usePathname } from "next/navigation";
import FileDetails from "./FileDetails";

const ActionsDropdown = ({ file }: { file: FileDocument }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [action, setAction] = useState<ActionType | null>(null);
  const [fileName, setFileName] = useState(file.name);
  const [isLoading, setIsLoading] = useState(false);
  const pathName = usePathname();

  const closeAllModal = () => {
    setIsModalOpen(false);
    setIsDropdownOpen(false);
    setAction(null);
    setFileName(file.name);
    // setEmail([]);
  };

  const handleAction = async () => {
    if (!action) return;

    setIsLoading(true);
    const { value } = action;

    switch (value) {
      case "rename":
        // ✅ Implement rename functionality
        try {
          const nameWithoutExt =
            fileName.lastIndexOf(".") !== -1
              ? fileName.substring(0, fileName.lastIndexOf("."))
              : fileName;

          const result = await renameFile(
            file.$id,
            nameWithoutExt,
            file.extension,
            pathName
          );

          if (result.success) {
            // ✅ Use toast function - TypeScript safe access
            showRenameSuccessToast(result.data?.name || fileName);
          } else {
            // ✅ Use toast function
            showRenameErrorToast(result.message);
          }
        } catch (error) {
          console.error("Rename error:", error);
          showRenameErrorToast("An unexpected error occurred.");
        }
        break;
      case "share":
        // Call share function here
        break;
      case "delete":
        // Call delete function here
        break;
      case "details":
        // Show details modal or redirect to details page
        break;
      default:
        break;
    }

    setIsLoading(false);
    closeAllModal();
  };

  const renderDialogContent = () => {
    if (!action) return null;

    const { label, value } = action;

    return (
      <DialogContent className="shad-dialog button">
        <DialogHeader className="flex flex-col gap-3">
          <DialogTitle className="text-center text-light-100">
            {label}
          </DialogTitle>
          {value === "rename" && (
            <Input
              type="text"
              value={fileName}
              placeholder="Enter new name"
              className="w-full"
              onChange={(e) => setFileName(e.target.value)}
            />
          )}
          {value === "details" && <FileDetails file={file} />}
        </DialogHeader>
        {["rename", "share", "delete"].includes(value) && (
          <DialogFooter className="flex flex-col gap-3 md:flex-row">
            <Button onClick={closeAllModal} className="modal-cancel-button">
              Cancel
            </Button>
            <Button onClick={handleAction} className="modal-submit-button">
              <p className="capitalize">{value}</p>
              {isLoading && (
                <Image
                  src="/assets/icons/loader.svg"
                  alt="Loading..."
                  width={24}
                  height={24}
                  className="animate-spin"
                />
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    );
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger className="shad-no-focus">
          <Image
            src="/assets/icons/dots.svg"
            alt="menu"
            width={34}
            height={34}
            className="cursor-pointer p-1 hover:bg-[#f0ededcf] rounded-full"
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel className="max-w-[200px] truncate">
            {file.name}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {actionsDropdownItems.map((actionItem) => (
            <DropdownMenuItem
              key={actionItem.label}
              onClick={() => {
                setAction(actionItem);

                if (
                  ["rename", "share", "delete", "details"].includes(
                    actionItem.value
                  )
                ) {
                  setIsModalOpen(true);
                }
              }}
            >
              {actionItem.value === "download" ? (
                <Link
                  href={generateFileDownloadURL(file.bucketField)}
                  target="_blank"
                  className="flex items-center gap-2"
                >
                  <Image
                    src={actionItem.icon}
                    alt={actionItem.label}
                    width={30}
                    height={30}
                  />
                  {actionItem.label}
                </Link>
              ) : (
                <div className="flex items-center gap-2">
                  <Image
                    src={actionItem.icon}
                    alt={actionItem.label}
                    width={30}
                    height={30}
                  />
                  {actionItem.label}
                </div>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {isModalOpen && renderDialogContent()}
    </Dialog>
  );
};

export default ActionsDropdown;
