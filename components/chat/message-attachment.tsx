import React from "react";
import { Paperclip } from "lucide-react";
import { Message } from "ai";

interface MessageAttachmentProps {
  file: NonNullable<Message["experimental_attachments"]>[number];
}

export const MessageAttachment: React.FC<MessageAttachmentProps> = ({ file }) => {
  // Helper to create a URL from file data if it's an image
  // This is needed because the file data in messages might be base64 or other formats
  const getImageUrl = (fileData: any): string | undefined => {
    if (fileData.contentType?.startsWith("image/")) {
      // Assuming fileData.content is base64 for images, or a direct URL
      if (typeof fileData.content === "string" && fileData.content.startsWith("data:image")) {
        return fileData.content; // It's already a data URL
      }
      // If it's a Blob or File object (though less likely in Message attachments directly)
      if (fileData instanceof Blob || fileData instanceof File) {
        return URL.createObjectURL(fileData);
      }
      // If content is base64 encoded string without the data URI prefix
      if (typeof fileData.content === "string" && fileData.contentType) {
        try {
          // Attempt to create a Blob and then an Object URL
          // This part might need adjustment based on actual content format
          const byteCharacters = atob(fileData.content);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: fileData.contentType });
          return URL.createObjectURL(blob);
        } catch (e) {
          console.error("Error creating object URL from base64 content:", e);
          return undefined;
        }
      }
    }
    return undefined;
  };

  const imageUrl = getImageUrl(file);

  return (
    <div className="bg-gray-200 dark:bg-gray-700 rounded-md p-2 text-xs flex items-center gap-1">
      {imageUrl ? <img src={imageUrl} alt={file.name} className="h-16 w-16 object-cover rounded-md" /> : <Paperclip className="h-4 w-4 mr-1 flex-shrink-0" />}
      <span className="truncate" title={file.name}>
        {file.name}
      </span>
    </div>
  );
};
