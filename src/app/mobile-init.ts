import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard } from '@capacitor/keyboard';
import { App } from '@capacitor/app';

export class MobileInit {
    static async initialize(): Promise<void> {
        if (!Capacitor.isNativePlatform()) {
            console.log('Running in browser mode');
            return;
        }

        console.log('Initializing mobile platform');

        try {
            // Configure Status Bar
            await StatusBar.setStyle({ style: Style.Light });
            await StatusBar.setBackgroundColor({ color: '#7367F0' });

            // Hide splash screen after initialization
            await SplashScreen.hide();

            // Configure Keyboard
            if (Capacitor.getPlatform() === 'ios') {
                await Keyboard.setAccessoryBarVisible({ isVisible: true });
            }

            // Handle back button on Android
            if (Capacitor.getPlatform() === 'android') {
                App.addListener('backButton', ({ canGoBack }) => {
                    if (!canGoBack) {
                        App.exitApp();
                    } else {
                        window.history.back();
                    }
                });
            }

            // Handle app state changes
            App.addListener('appStateChange', ({ isActive }) => {
                console.log('App state changed. Is active:', isActive);
            });

            // Handle deep links
            App.addListener('appUrlOpen', (data: any) => {
                console.log('App opened with URL:', data);
                // Handle deep linking here
            });

            console.log('Mobile platform initialized successfully');
        } catch (error) {
            console.error('Error initializing mobile platform:', error);
        }
    }

    static getPlatform(): string {
        return Capacitor.getPlatform();
    }

    static isNative(): boolean {
        return Capacitor.isNativePlatform();
    }
}
