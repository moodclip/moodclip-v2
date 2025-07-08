// extensions/moodflow-dashboard/src/index.tsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Page, Banner, Button, Modal, DropZone, LegacyStack, Thumbnail, Text } from '@shopify/polaris';
import { useAppBridge } from '@shopify/app-bridge-react';
import Uppy from '@uppy/core';
import Tus from '@uppy/tus';
import { NoteMinor } from '@shopify/polaris-icons';

export default function Dashboard() {
  const app = useAppBridge();
  const [quota, setQuota] = useState<{ plan: string; used: number; limit: number } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // A ref to hold the Uppy instance so it persists between re-renders
  // We initialize it without any plugins initially.
  const uppy = useRef<Uppy | null>(null);

  if (!uppy.current) {
    uppy.current = new Uppy({
      autoProceed: true, // Automatically start uploading once a file is selected
    });
  }

  useEffect(() => {
    // This function runs when the component first loads
    const fetchQuota = async () => {
      try {
        const response = await app.authenticatedFetch('/api/quota');
        if (response.ok) {
          const data = await response.json();
          setQuota(data);
        } else {
          console.error("Failed to fetch quota");
        }
      } catch (error) {
        console.error("Error fetching quota:", error);
      }
    };

    fetchQuota();
  }, [app]);


  const handleDrop = useCallback(async (files: File[], acceptedFiles: File[], rejectedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) {
      if(rejectedFiles.length > 0) {
        setErrorMessage("File type not supported. Please upload a video file.");
      }
      return;
    }

    setUploadedFile(file);
    setErrorMessage(null); // Clear previous errors

    try {
      // 1. Ask our backend for a signed URL
      const response = await app.authenticatedFetch('/api/sign-gcs-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get signed URL');
      }

      const { url } = await response.json();

      // 2. Remove any existing Tus plugin before adding a new one
      if (uppy.current?.getPlugin('Tus')) {
        uppy.current.removePlugin(uppy.current.getPlugin('Tus') as Tus);
      }
      
      // 3. Configure Uppy to use the Tus protocol with the signed URL
      uppy.current?.use(Tus, {
        endpoint: url,
        retryDelays: [0, 1000, 3000, 5000], // How long to wait before retrying a failed chunk
        chunkSize: 5 * 1024 * 1024, // Upload in 5MB chunks
        removeFingerprintOnSuccess: true, // Recommended for signed URLs
      });

      // 4. Add the file to Uppy to start the upload
      uppy.current?.addFile({
        name: file.name,
        type: file.type,
        data: file,
      });

      setIsModalOpen(false); // Close the modal after starting the upload

    } catch (error) {
      console.error("Upload failed:", error);
      setErrorMessage("Upload failed. Please try again.");
    }
  }, [app]);

  const fileUpload = !uploadedFile && <DropZone.FileUpload />;
  const uploadedFileDisplay = uploadedFile && (
    <LegacyStack>
      <Thumbnail
        size="large"
        alt={uploadedFile.name}
        source={NoteMinor}
      />
      <div>
        {uploadedFile.name}{' '}
        <Text variant="bodySm" as="p">
          {uploadedFile.size} bytes
        </Text>
      </div>
    </LegacyStack>
  );

  const handleModalClose = () => {
    setIsModalOpen(false);
    setUploadedFile(null); // Clear the file when closing the modal
    setErrorMessage(null);
  }

  return (
    <Page title="My Projects">
      {quota && (
        <Banner title={`Plan: ${quota.plan}`} status="info">
          {quota.used}/{quota.limit} clips this month
        </Banner>
      )}
      <div style={{ marginTop: '1rem' }}>
        <Button primary onClick={() => setIsModalOpen(true)}>Upload video</Button>
      </div>

      {/* This is the Modal component for the uploader */}
      <Modal
        open={isModalOpen}
        onClose={handleModalClose}
        title="Upload a large video file"
      >
        <Modal.Section>
          <DropZone onDrop={handleDrop} allowMultiple={false} accept="video/*">
            {uploadedFileDisplay}
            {fileUpload}
          </DropZone>
          {errorMessage && <div style={{color: 'red', marginTop: '1rem'}}>{errorMessage}</div>}
        </Modal.Section>
      </Modal>
    </Page>
  );
}
