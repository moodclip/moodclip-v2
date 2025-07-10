import { useEffect, useState, useCallback } from "react";
import { useFetcher } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  Box,
  List,
  Link,
  InlineStack,
  DropZone,
  Thumbnail,
  Banner,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { NoteIcon } from "@shopify/polaris-icons";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const color = ["Red", "Orange", "Yellow", "Green"][
    Math.floor(Math.random() * 4)
  ];
  const response = await admin.graphql(
    `#graphql
      mutation populateProduct($product: ProductCreateInput!) {
        productCreate(product: $product) {
          product {
            id
            title
            handle
            status
            variants(first: 10) {
              edges {
                node {
                  id
                  price
                  barcode
                  createdAt
                }
              }
            }
          }
        }
      }`,
    {
      variables: {
        product: {
          title: `${color} Snowboard`,
        },
      },
    },
  );
  const responseJson = await response.json();
  return {
    product: responseJson.data.productCreate.product,
  };
};

export default function Index() {
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  const isLoading =
    ["loading", "submitting"].includes(fetcher.state) &&
    fetcher.formMethod === "POST";
  const productId = fetcher.data?.product?.id.replace(
    "gid://shopify/Product/",
    "",
  );

  useEffect(() => {
    if (productId) {
      shopify.toast.show("Product created");
    }
  }, [productId, shopify]);
  const generateProduct = () => fetcher.submit({}, { method: "POST" });

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

    setUploadStatus({ state: 'uploading', message: 'Getting upload URL...' });

    try {
      const response = await fetch(`/api/uploads?name=${file.name}&type=${file.type}`);
      if (!response.ok) {
        throw new Error('Failed to get signed URL.');
      }
      const { signedUrl } = await response.json();

      setUploadStatus({ state: 'uploading', message: 'Uploading file...' });

      const uploadResponse = await fetch(signedUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error('File upload to GCS failed.');
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
        <Text variant="bodySm" as="p">
          {file.size} bytes
        </Text>
      </div>
    </InlineStack>
  );

  return (
    <Page>
      <TitleBar title="MoodClip v2" />
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="500">
                <Text as="h2" variant="headingMd">
                  Upload a file to Google Cloud Storage
                </Text>
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
          </Layout.Section>

          <Layout.Section>
            <Card>
              <BlockStack gap="500">
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    Product Generation Demo
                  </Text>
                  <Text as="p" variant="bodyMd">
                    Generate a product with GraphQL to test the Shopify API.
                  </Text>
                </BlockStack>
                <InlineStack gap="300">
                  <Button loading={isLoading} onClick={generateProduct}>
                    Generate a product
                  </Button>
                  {fetcher.data?.product && (
                    <Button
                      url={`shopify:admin/products/${productId}`}
                      target="_blank"
                      variant="plain"
                    >
                      View product
                    </Button>
                  )}
                </InlineStack>
                {fetcher.data?.product && (
                  <Box
                    padding="400"
                    background="bg-surface-active"
                    borderWidth="025"
                    borderRadius="200"
                    borderColor="border"
                    overflowX="scroll"
                  >
                    <pre style={{ margin: 0 }}>
                      <code>
                        {JSON.stringify(fetcher.data.product, null, 2)}
                      </code>
                    </pre>
                  </Box>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
