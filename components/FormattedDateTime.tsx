import { cn, formatDateTime } from "@/lib/utils";
import React from "react";

const FormattedDateTime = ({
  createdAt,
  className,
}: {
  createdAt: string;
  className?: string;
}) => {
  return (
    <p className={cn("body-1 text-light-200", className)}>
      {formatDateTime(createdAt)}
    </p>
  );
};

export default FormattedDateTime;
