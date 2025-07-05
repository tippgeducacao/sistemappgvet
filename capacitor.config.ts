
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.0600399cb5c34a1b98db4bc894667682',
  appName: 'PPGVet Matricula Manager',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
    url: 'https://0600399c-b5c3-4a1b-98db-4bc894667682.lovableproject.com?forceHideBadge=true'
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  }
};

export default config;
