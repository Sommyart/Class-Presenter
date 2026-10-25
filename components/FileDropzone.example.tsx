import React from 'react';
import { FileDropzone } from './FileDropzone';
import { ImageIcon, FileText, Upload, FileArchive } from 'lucide-react';

export const BasicExample = {
  size: "sm",
  backdrop: "background",
  title: "Different File Types",
  component: () => (
    <>
      <FileDropzone 
        icon={<ImageIcon size={48} />}
        title="Drop images here"
        subtitle="PNG, JPG up to 10MB"
        accept=".jpg,.jpeg,.png"
        maxSize={10 * 1024 * 1024}
        onFilesSelected={(files) => console.log('Images selected:', files)} 
      />
      <FileDropzone 
        icon={<FileText size={48} />}
        title="Drop documents here"
        subtitle="PDF, DOC up to 25MB"
        accept=".pdf,.doc,.docx"
        maxSize={25 * 1024 * 1024}
        onFilesSelected={(files) => console.log('Documents selected:', files)} 
      />
    </>
  )
};

export const MultipleFilesExample = {
  size: "sm",
  backdrop: "background",
  title: "Multiple Files",
  component: () => (
    <FileDropzone 
      maxFiles={5}
      icon={<FileArchive size={48} />}
      title={
        <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
          <Upload size={20} />
          Bulk Upload
        </span>
      }
      subtitle="Upload up to 5 files of any type"
      onFilesSelected={(files) => console.log('Multiple files selected:', files)} 
    />
  )
};

export const StatesExample = {
  size: "sm",
  backdrop: "background",
  title: "States",
  component: () => (
    <FileDropzone 
      disabled
      title="Disabled State"
      subtitle="This upload zone is inactive"
      onFilesSelected={(files) => console.log('Files selected:', files)} 
    />
  )
};
