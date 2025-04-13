import Theme from './components/themes/defaultTheme';
import { BrowserRouter } from 'react-router-dom';
import { AppRouter } from './AppRouter';
import ChatBox from './components/ChatBox';
import ClientOnly from './components/common/ClientOnly';

export const App = () => {
  return (
    <Theme>
      <ClientOnly fallback={<div>Loading application...</div>}>
        <BrowserRouter>
          <AppRouter />
          <ChatBox agentName="exchange_agent" userId="user" />
        </BrowserRouter>
      </ClientOnly>
    </Theme>
  );
};

export default App;
