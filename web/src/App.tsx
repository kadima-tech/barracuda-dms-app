import Theme from "./components/themes/defaultTheme";

import { BrowserRouter } from "react-router-dom";
import { AppRouter } from "./AppRouter";

export const App = () => {
  return (
    <Theme>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </Theme>
  );
};

export default App;
