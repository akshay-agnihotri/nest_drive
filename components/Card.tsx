import { formatBytes, generateFileURL } from "@/lib/utils";
import Thumbnail from "./Thumbnail";
import { FileDocument } from "@/lib/types";
import Link from "next/link";
import FormattedDateTime from "./FormattedDateTime";
import ActionsDropdown from "./ActionsDropdown";

const Card = ({ file }: { file: FileDocument }) => {
  // ✅ Generate URL on-demand from bucketField
  const fileUrl = generateFileURL(file.bucketField);

  return (
    <Link href={fileUrl} target="_blank" className="file-card">
      <div className="flex justify-between">
        <Thumbnail
          type={file.type}
          extension={file.extension}
          className="!size-20"
          imageClassName="!size-11"
        />

        <div className="flex flex-col items-end justify-between">
          <ActionsDropdown file={file} />
          <p className="body-2">{formatBytes(file.size)}</p>
        </div>
      </div>

      <div className="file-card-detail">
        <p className="subtitle-2 line-clamp-1">{file.name}</p>
        <FormattedDateTime
          createdAt={file.$createdAt}
          className="body-2 text-light-100"
        />
      </div>
    </Link>
  );
};

export default Card;
