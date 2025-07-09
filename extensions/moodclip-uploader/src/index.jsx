import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import Uppy from '@uppy/core';
import XHRUpload from '@uppy/xhr-upload';
import { Dashboard } from '@uppy/react';
import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';
import { AppProvider, Card, BlockStack, Text } from '@shopify/polaris';
import "@shopify/polaris/build/esm/styles.css";

const Block = () => {
  const { title } = window.moodclip?.settings || { title: 'Upload Your Video' };

  const [uppy] = useState(() => {
    const uppyInstance = new Uppy({
      autoProceed: true,
      restrictions: {
        maxNumberOfFiles: 1,
        allowedFileTypes: ['video/*'],
      },
    });

    uppyInstance.use(XHRUpload, {
      endpoint: '/apps/moodclip-uploader/api/upload',
      method: 'POST',
      fieldName: 'file',
      timeout: 0, // Allow for long uploads
    });

    return uppyInstance;
  });

  return (
    <AppProvider i18n={{}}>
      <Card>
        <BlockStack gap="200">
          <Text variant="headingMd" as="h2">{title}</Text>
          <Dashboard
            uppy={uppy}
            width="100%"
            height="400px"
            proudlyDisplayPoweredByUppy={false}
          />
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
