import { formatBytes, generateFileURL } from "@/lib/utils";
import Thumbnail from "./Thumbnail";
import { FileDocument } from "@/lib/types";

const Card = ({ file }: { file: FileDocument }) => {
  // ✅ Generate URL on-demand from bucketField
  const fileUrl = generateFileURL(file.bucketField);

  return (
    <a
      href={fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="file-card"
    >
      <div className="flex justify-between">
        <Thumbnail
          type={file.type}
          extension={file.extension}
          className="!size-20"
          imageClassName="!size-11"
        />
      </div>
      <div className="file-card-details">
        <p className="body-1 truncate">{file.name}</p>
        <p className="caption text-light-200">{formatBytes(file.size)}</p>
      </div>
    </a>
  );
};

export default Card;
