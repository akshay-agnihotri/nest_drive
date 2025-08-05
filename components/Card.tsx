import { formatBytes } from "@/lib/utils";
import Thumbnail from "./Thumbnail";
import { FileDocument } from "@/lib/types";

const Card = ({ file }: { file: FileDocument }) => {
  return (
    <div className="file-card">
      <div className="file-card-thumbnail">
        <Thumbnail type={file.type} extension={file.extension} />
      </div>
      <div className="file-card-details">
        <p className="body-1 truncate">{file.name}</p>
        <p className="caption text-light-200">{formatBytes(file.size)}</p>
      </div>
    </div>
  );
};

export default Card;
