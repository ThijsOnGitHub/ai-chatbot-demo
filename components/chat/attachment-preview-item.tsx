import React from "react";
import { Paperclip } from "lucide-react";
import { AttachmentFile } from "@/hooks/use-file-upload";

interface AttachmentPreviewItemProps {
  attachment: AttachmentFile;
  index: number;
  onRemove: (index: number) => void;
}

export const AttachmentPreviewItem: React.FC<AttachmentPreviewItemProps> = ({ attachment, index, onRemove }) => {
  return (
    <div className="bg-muted rounded-md px-2 py-1 text-xs flex items-center gap-1 relative">
      {attachment.previewUrl && attachment.file.type.startsWith("image/") ? (
        <img src={attachment.previewUrl} alt={attachment.file.name} className="h-10 w-10 object-cover rounded-md mr-2" />
      ) : (
        <Paperclip className="h-4 w-4 mr-2 flex-shrink-0" />
      )}
      <span className="max-w-[100px] truncate" title={attachment.file.name}>
        {attachment.file.name}
      </span>
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="text-gray-500 hover:text-gray-700 absolute -top-1 -right-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-full p-0.5 leading-none"
        title="Remove file"
      >
        <span className="block h-3 w-3">&times;</span>
      </button>
    </div>
  );
};
