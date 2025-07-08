import React, { useState, useEffect, useRef } from 'react';
import { reactExtension, Page, Banner, Button, Modal, DropZone, Text } from '@shopify/ui-extensions-react/customer-account';
import Uppy from '@uppy/core';
import Tus from '@uppy/tus';

// This defines the extension and points to our main component
reactExtension('customer-account.page.render', () => <Dashboard />);

// This is the main Dashboard component
function Dashboard() {
  // New state to control the modal's visibility
  const [isModalOpen, setIsModalOpen] = useState(false);

  // A ref to hold the Uppy instance so it persists between re-renders
  const uppy = useRef(new Uppy({
    autoProceed: true, // Automatically start uploading once a file is selected
  }));

  // Handler for when a file is dropped into the DropZone
  const handleDrop = React.useCallback(async (files) => {
    const file = files[0];
    if (!file) return;

    // 1. Ask our backend for a signed URL
    // Note: In a real app, you would use authenticatedFetch from App Bridge
    // For simplicity here, we use a standard fetch
    const response = await fetch('/api/sign-gcs-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type
      })
    });

    const { url } = await response.json();

    // 2. Configure Uppy to use the Tus protocol with the signed URL
    uppy.current.use(Tus, {
      endpoint: url,
      retryDelays: [0, 1000, 3000, 5000], // How long to wait before retrying a failed chunk
      chunkSize: 5 * 1024 * 1024, // Upload in 5MB chunks
    });

    // 3. Add the file to Uppy to start the upload
    uppy.current.addFile({
      name: file.name,
      type: file.type,
      data: file,
    });

    setIsModalOpen(false); // Close the modal after starting the upload
  }, []);

  return (
    <Page title="My Projects">
      <Banner title="Upload Status" status="info">
         Your upload will begin immediately after selecting a file.
      </Banner>

      <Button onClick={() => setIsModalOpen(true)}>Upload video</Button>

      {/* This is the Modal component for the uploader */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Upload a large video file"
      >
        <Modal.Section>
          <DropZone onDrop={handleDrop} accept="video/*">
             <DropZone.FileUpload actionHint="You can upload video files up to 30 GB" />
          </DropZone>
        </Modal.Section>
      </Modal>
    </Page>
  );
}