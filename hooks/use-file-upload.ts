import { useState, useRef } from "react";

export interface AttachmentFile {
  file: File;
  previewUrl?: string;
}

export function useFileUpload() {
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File upload functions
  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map((file) => {
        let previewUrl: string | undefined;
        if (file.type.startsWith("image/")) {
          previewUrl = URL.createObjectURL(file);
        }
        return { file, previewUrl };
      });
      setAttachments((prev) => [...prev, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setAttachments((prev) =>
      prev.filter((_, i) => {
        if (i === index && prev[i].previewUrl) {
          URL.revokeObjectURL(prev[i].previewUrl!);
        }
        return i !== index;
      })
    );
  };

  // Reset attachments
  const resetAttachments = () => {
    attachments.forEach((attachment) => {
      if (attachment.previewUrl) {
        URL.revokeObjectURL(attachment.previewUrl);
      }
    });
    setAttachments([]);
  };

  // Get fileList for submission
  const getAttachmentFileList = () => {
    const fileList = new DataTransfer();
    attachments.forEach((attachment) => {
      fileList.items.add(attachment.file);
    });
    return fileList.files;
  };

  return {
    attachments,
    fileInputRef,
    handleFileClick,
    handleFileChange,
    handleRemoveFile,
    resetAttachments,
    getAttachmentFileList,
  };
}
