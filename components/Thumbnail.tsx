import React from "react";
import Image from "next/image";
import { cn, getFileIcon } from "@/lib/utils";

const Thumbnail = ({
  type,
  extension,
  imageClassName,
  className,
}: {
  type: string;
  extension: string;
  imageClassName?: string;
  className?: string;
}) => {
  return (
    <figure className={cn("thumbnail", className)}>
      <Image
        src={getFileIcon(extension, type)}
        alt={`${type} ${extension} thumbnail`}
        width={100}
        height={100}
        className={cn("size-8 object-contain", imageClassName)}
      />
    </figure>
  );
};

export default Thumbnail;
