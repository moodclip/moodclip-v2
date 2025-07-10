console.log("Uploader Code Version: July 10 @ 7:50 AM (Friend's Advice)");

import React from 'react';
import { createRoot } from 'react-dom/client';
import { AppProvider, Card, BlockStack, Text, Button } from '@shopify/polaris';
import "@shopify/polaris/build/esm/styles.css";

const Block = () => {
  const { title } = window.moodclip?.settings || { title: 'Upload Your Video' };

  const handleTestFetch = async () => {
    console.log("[Test] Button clicked. Starting fetch...");
    try {
      // Applying friend's advice: using back-ticks for the URL string.
      const response = await fetch(
        `/apps/moodclip-uploader/api/uploads?name=test.mp4&type=video/mp4`, 
        { credentials: 'include' }
      );

      console.log("[Test] Fetch response received. Status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[Test] Response not OK. Server returned error:", response.status, errorText);
        return;
      }

      const responseBody = await response.text();
      console.log("[Test] SUCCESS! Raw response body from backend:", responseBody);
      
    } catch (error) {
      console.error("[Test] CATCH BLOCK: An error occurred during fetch.", error);
    }
  };

  return (
    <AppProvider i18n={{}}>
      <Card>
        <BlockStack gap="200">
          <Text variant="headingMd" as="h2">{title}</Text>
          <Text>Click the button below to test the connection to the backend.</Text>
          <Button onClick={handleTestFetch}>Test Backend Connection</Button>
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
