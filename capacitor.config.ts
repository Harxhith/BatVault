import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.quantum.BatVault',
  appName: 'BatVault',
  webDir: 'dist',
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_noti',
      iconColor: '#392DF1',
      sound: 'beep.wav',
    },
    CapacitorHttp: {
      enabled: false
    },
    CapacitorCookies: {
      enabled: true
    },
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: '#121212',
      androidSplashResourceName: 'splash',
      showSpinner: true,
      androidSpinnerStyle: 'large',
      spinnerColor: '#392DF1',
    },
    App: {
      backgroundModeEnabled: true
    }
  },
  android: {
    allowMixedContent: true,
    buildOptions: {
      keystorePath: null,
      keystorePassword: null,
      keystoreAlias: null,
      keystoreAliasPassword: null,
      releaseType: null,
      signingConfig: null,
    },
    useLegacyBridge: false,
  },
  server: {
    cleartext: true,
    androidScheme: 'https',
    hostname: 'app'
  }
};

export default config;
