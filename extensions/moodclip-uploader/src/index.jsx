import React, { useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { AppProvider, Card, BlockStack, Text, Button, DropZone, Thumbnail, InlineStack, Banner } from '@shopify/polaris';
import { NoteIcon } from "@shopify/polaris-icons";
import "@shopify/polaris/build/esm/styles.css";

const Block = () => {
  const { title } = window.moodclip?.settings || { title: 'Upload Your Video' };

  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState({ state: 'idle', message: '' });

  const handleDropZoneDrop = useCallback(
    (_dropFiles, acceptedFiles, _rejectedFiles) =>
      setFile(acceptedFiles[0]),
    [],
  );

  const handleUpload = async () => {
    if (!file) {
      setUploadStatus({ state: 'error', message: 'Please select a file to upload.' });
      return;
    }
    setUploadStatus({ state: 'uploading', message: 'Preparing upload...' });

    try {
      // Use the full URL to your backend API
      const backendUrl = `https://moodclip-v2.onrender.com/api/uploads?name=${encodeURIComponent(file.name)}&type=${encodeURIComponent(file.type)}`;
      
      const response = await fetch(backendUrl);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to get signed URL: ${errorData.error || response.statusText}`);
      }
      const { signedUrl } = await response.json();

      setUploadStatus({ state: 'uploading', message: 'Uploading file...' });

      const uploadResponse = await fetch(signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error('File upload failed.');
      }

      setUploadStatus({ state: 'success', message: 'File uploaded successfully!' });
      setFile(null);

    } catch (error) {
      const message = error instanceof Error ? error.message : "An unknown error occurred.";
      setUploadStatus({ state: 'error', message });
      console.error(error);
    }
  };

  const validImageTypes = ['image/gif', 'image/jpeg', 'image/png'];
  const fileUpload = !file && <DropZone.FileUpload />;
  const uploadedFile = file && (
    <InlineStack>
      <Thumbnail
        size="small"
        alt={file.name}
        source={
          validImageTypes.includes(file.type)
            ? window.URL.createObjectURL(file)
            : NoteIcon
        }
      />
      <div>
        {file.name}{' '}
        <Text variant="bodySm" as="p">{file.size} bytes</Text>
      </div>
    </InlineStack>
  );

  return (
    <AppProvider i18n={{}}>
      <Card>
        <BlockStack gap="500">
          <Text variant="headingMd" as="h2">{title}</Text>
          {uploadStatus.state === 'error' && <Banner tone="critical">{uploadStatus.message}</Banner>}
          {uploadStatus.state === 'success' && <Banner tone="success">{uploadStatus.message}</Banner>}
          <DropZone onDrop={handleDropZoneDrop}>
            {uploadedFile}
            {fileUpload}
          </DropZone>
          <Button
            onClick={handleUpload}
            disabled={!file || uploadStatus.state === 'uploading'}
            loading={uploadStatus.state === 'uploading'}
            variant="primary"
          >
            Upload file
          </Button>
        </BlockStack>
      </Card>
    </AppProvider>
  );
};

const container = document.getElementById('root');
const root = createRoot(container);
const thisScript = document.currentScript;

window.moodclip = {
  settings: {
    title: thisScript.dataset.title,
  },
};

root.render(<Block />);
