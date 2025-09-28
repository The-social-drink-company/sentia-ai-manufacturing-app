import { ThemeProvider as NextThemesProvider } from 'next-themes';

function ThemeProvider({
  attribute = 'class',
  defaultTheme = 'system',
  enableSystem = true,
  disableTransitionOnChange = true,
  storageKey = 'sentia-theme',
  children,
  ...props
}) {
  return (
    <NextThemesProvider
      attribute={attribute}
      defaultTheme={defaultTheme}
      enableSystem={enableSystem}
      disableTransitionOnChange={disableTransitionOnChange}
      storageKey={storageKey}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}

export { ThemeProvider };
