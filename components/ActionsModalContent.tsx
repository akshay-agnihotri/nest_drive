import { FileDocument, UserDocument } from "@/lib/types";
import Thumbnail from "./Thumbnail";
import FormattedDateTime from "./FormattedDateTime";
import { formatBytes, formatDateTime } from "@/lib/utils";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { getUserByEmail } from "@/lib/actions/user.action";

const UserThumbnail = ({
  user,
  size = 32,
}: {
  user: UserDocument;
  size?: number;
}) => {
  return (
    <div
      className="rounded-full bg-brand/20 flex items-center justify-center overflow-hidden"
      style={{ width: size, height: size }}
    >
      {user.avatar ? (
        <Image
          src={user.avatar}
          alt={user.fullName}
          width={size}
          height={size}
          className="rounded-full object-cover"
        />
      ) : (
        <span
          className="text-brand font-medium"
          style={{ fontSize: `${size * 0.4}px` }}
        >
          {user.fullName.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );
};

const ImageThumbnail = ({ file }: { file: FileDocument }) => {
  return (
    <div className="file-details-thumbnail">
      <Thumbnail type={file.type} extension={file.extension} />
      <div className="flex flex-col gap-1">
        <p className="subtitle-2 mb-1">{file.name}</p>
        <FormattedDateTime createdAt={file.$createdAt} className="caption" />
      </div>
    </div>
  );
};

const DetailRow = ({ label, value }: { label: string; value: string }) => {
  return (
    <div className="flex items-center">
      <p className="file-details-label text-left">{label}</p>
      <p className="file-details-value text-left ml-2">{value}</p>
    </div>
  );
};

export const FileDetails = ({ file }: { file: FileDocument }) => {
  return (
    <>
      <ImageThumbnail file={file} />
      <div className="space-y-4 px-2 pt-2">
        <DetailRow label="Format:" value={file.extension} />
        <DetailRow label="Size:" value={formatBytes(file.size)} />
        <DetailRow
          label="Created At:"
          value={formatDateTime(file.$createdAt)}
        />
        <DetailRow
          label="Last Modified:"
          value={formatDateTime(file.$updatedAt)}
        />
      </div>
    </>
  );
};

export const ShareInput = ({
  file,
  onInputChange,
  onRemove,
}: {
  file: FileDocument;
  onInputChange: (user: UserDocument | null) => void;
  onRemove: () => void;
}) => {
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [foundUser, setFoundUser] = useState<UserDocument | null>(null);
  const [error, setError] = useState<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Debounced user fetching
  useEffect(() => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Reset states
    setError(null);
    setFoundUser(null);
    onInputChange(null);

    if (!inputValue.trim()) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Set new timer
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const email = inputValue.trim();

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          setError("Please enter a valid email address");
          setIsLoading(false);
          return;
        }

        // Fetch user
        const user = await getUserByEmail(email);

        if (user) {
          const userDoc = user as unknown as UserDocument;
          setFoundUser(userDoc);
          setError(null);
          onInputChange(userDoc);
        } else {
          setError("User not found with this email address");
          setFoundUser(null);
          onInputChange(null);
        }
      } catch (err) {
        console.error("Error fetching user:", err);
        setError("Error searching for user. Please try again.");
        setFoundUser(null);
        onInputChange(null);
      } finally {
        setIsLoading(false);
      }
    }, 500); // 500ms debounce delay
  }, [inputValue, onInputChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleRemoveUser = () => {
    setInputValue("");
    setFoundUser(null);
    setError(null);
    onInputChange(null);
    onRemove();
  };

  return (
    <>
      <ImageThumbnail file={file} />

      <div className="share-wrapper">
        <p className="subtitle-2 pl-1 text-light-100">
          Share file with other users
        </p>

        <div className="relative">
          <Input
            type="email"
            placeholder="Enter email address"
            className="share-input-field"
            value={inputValue}
            onChange={handleInputChange}
          />

          {/* Loading indicator */}
          {isLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Image
                src="/assets/icons/loader.svg"
                alt="Searching..."
                width={16}
                height={16}
                className="animate-spin"
              />
            </div>
          )}
        </div>

        {/* Error message */}
        {error && <p className="text-red-400 text-sm mt-2 pl-1">{error}</p>}

        {/* Found user display */}
        {foundUser && (
          <div className="mt-4 p-3 bg-brand/10 rounded-lg border border-brand/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserThumbnail user={foundUser} size={32} />
                <div>
                  <p className="text-light-100 font-medium">
                    {foundUser.fullName}
                  </p>
                  <p className="text-light-200 text-sm">{foundUser.email}</p>
                </div>
              </div>
              <Button
                onClick={handleRemoveUser}
                className="p-1 hover:bg-red-500/20 rounded"
                variant="ghost"
              >
                <Image
                  src="/assets/icons/remove.svg"
                  alt="Remove"
                  width={16}
                  height={16}
                  className="text-red-400"
                />
              </Button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <p className="text-light-200 text-xs mt-3 pl-1">
          {foundUser
            ? "User found! Click 'Share' to send the file."
            : "Type an email address to find a user to share with."}
        </p>
      </div>
    </>
  );
};
