import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kirangames.luckyspin',
  appName: 'Kiran Lucky Spin',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    AdMob: {
      // Setup Google AdMob App ID for Android (Real or test ID for release preparation)
      androidAdAppId: 'ca-app-pub-3940256099942544~3347511713', // Google's official Android Test App ID
    }
  }
};

export default config;
