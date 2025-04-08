import 'styled-components';
import { theme } from './components/themes/defaultTheme';

declare module 'styled-components' {
  export interface DefaultTheme {
    breakPoints: typeof theme.breakPoints;
    colors: typeof theme.colors;
    radius: typeof theme.radius;
    fonts: typeof theme.fonts;
    fontSizes: typeof theme.fontSizes;
    lineHeight: typeof theme.lineHeight;
    spacing: typeof theme.spacing;
    icons: typeof theme.icons;
    shadow: typeof theme.shadow;
  }
}
