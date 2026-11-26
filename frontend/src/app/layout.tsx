import '@mantine/core/styles.css';
import { MantineProvider, ColorSchemeScript } from "@mantine/core";

export default function RootLayout(
  {children}: {children: React.ReactNode}
){
  return(
    <html suppressHydrationWarning>
      <head>
        <ColorSchemeScript />
      </head>
      <body suppressHydrationWarning>
        <MantineProvider>
          {children}
        </MantineProvider>
      </body>
    </html>
  )
}
