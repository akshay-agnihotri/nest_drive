import { FileDocument } from "@/lib/types";
import Thumbnail from "./Thumbnail";
import FormattedDateTime from "./FormattedDateTime";
import { formatBytes, formatDateTime } from "@/lib/utils";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import Image from "next/image";

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
  onInputChange: (emails: string[]) => void;
  onRemove: (email: string) => void;
}) => {
  console.log(onRemove);

  return (
    <>
      <ImageThumbnail file={file} />

      <div className="share-wrapper">
        <p className="subtitle-2 pl-1 text-light-100">
          Share file with other users
        </p>
        <Input
          type="email"
          placeholder="Enter email addresses (comma separated)"
          className="share-input-field"
          onChange={(e) => onInputChange(e.target.value.trim().split(","))}
        />
        <div className="pt-4">
          <div className="flex justify-between">
            <p className="subtitle-2 text-light-100">Shared With:</p>
            <p className="subtitle-2 text-light-200">
              {file.users.length} users
            </p>
            <ul className="pt-2">
              {file.users.map((email) => (
                <li
                  key={email}
                  className="flex items-center justify-between gap-2"
                >
                  <p className="subtitle-2">{email}</p>
                  <Button onClick={() => onRemove(email)}>
                    <Image
                      src="/assets/icons/remove.svg"
                      alt="Remove Icon"
                      width={24}
                      height={24}
                      className="remove-icon"
                    />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};
