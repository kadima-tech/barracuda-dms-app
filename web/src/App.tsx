import Theme from './components/themes/defaultTheme';

import { BrowserRouter } from 'react-router-dom';
import { AppRouter } from './AppRouter';
import ChatBox from './components/ChatBox';

export const App = () => {
  return (
    <Theme>
      <BrowserRouter>
        <AppRouter />
        <ChatBox agentName="exchange_agent" userId="user" />
      </BrowserRouter>
    </Theme>
  );
};

export default App;
