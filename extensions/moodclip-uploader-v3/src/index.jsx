import React, { useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { AppProvider, Card, BlockStack, Text, Button, DropZone, Banner } from '@shopify/polaris';
import "@shopify/polaris/build/esm/styles.css";
import { v4 as uuidv4 } from 'uuid'; // CHANGE 1: Import the UUID library

// This is a placeholder function. You must replace this with your app's actual
// method for getting the logged-in customer's ID.
// If customers are not logged in, you can use a static folder name like 'public-uploads'.
const getMyCurrentUserId = () => {
  // Example: return window.Shopify.customer.id; or some other session identifier.
  // For now, we'll use a generic ID.
  return window.Shopify?.customer?.id || 'guest-user';
}


const Block = () => {
  const { title } = window.moodclip?.settings || { title: 'Upload Your Video' };

  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState({ state: 'idle', message: '' });
  const [lastUploadedFile, setLastUploadedFile] = useState(null);

  const handleDropZoneDrop = useCallback(
    (_dropFiles, acceptedFiles, _rejectedFiles) => {
      setFile(acceptedFiles[0]);
      setUploadStatus({ state: 'idle', message: '' });
    },
    [],
  );

  const handleUpload = async () => {
    if (lastUploadedFile && file && lastUploadedFile.name === file.name && lastUploadedFile.size === file.size) {
      setUploadStatus({ state: 'success', message: 'This file has already been uploaded.' });
      return;
    }

    if (!file) {
      setUploadStatus({ state: 'error', message: 'Please select a file to upload.' });
      return;
    }
    setUploadStatus({ state: 'uploading', message: 'Preparing upload...' });

    try {
      // CHANGE 2: Create the unique filename (also called a "key")
      const userId = getMyCurrentUserId();
      const uniqueKey = `${userId}/${uuidv4()}-${file.name}`;

      // CHANGE 3: Use the new uniqueKey when asking for the signed URL
      const params = new URLSearchParams({
        name: uniqueKey, // Use the unique name here
        type: file.type || 'application/octet-stream',
      });
      
      const backendUrl = `/apps/moodclip-uploader/uploads?${params}`;
      
      const response = await fetch(backendUrl);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get signed URL.');
      }

      const { signedUrl } = data;

      if (!signedUrl) {
        throw new Error("Received an invalid response from the server.");
      }

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
      setLastUploadedFile({ name: file.name, size: file.size });
      setFile(null);

    } catch (error) {
      const message = error instanceof Error ? error.message : "An unknown error occurred.";
      setUploadStatus({ state: 'error', message });
      console.error(error);
    }
  };

  const fileUpload = !file && <DropZone.FileUpload />;
  const uploadedFile = file && (
    <Text variant="bodyMd" as="p">
      Selected: {file.name} ({file.size} bytes)
    </Text>
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
