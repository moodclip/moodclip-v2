import { reactExtension, Text } from '@shopify/ui-extensions-react/customer-account';

reactExtension('customer-account.page.render', () => <App />);

function App() {
  return <Home />;
}

function Home() {
  return <Text>MoodClip coming soon...</Text>;
}