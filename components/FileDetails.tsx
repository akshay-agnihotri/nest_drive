import { FileDocument } from "@/lib/types";
import Thumbnail from "./Thumbnail";
import FormattedDateTime from "./FormattedDateTime";
import { formatBytes, formatDateTime } from "@/lib/utils";

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

const FileDetails = ({ file }: { file: FileDocument }) => {
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

export default FileDetails;
