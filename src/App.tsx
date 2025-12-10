import { FC, useCallback, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useNavigate,
  useParams,
} from 'react-router';
import { Footer } from './components/Footer';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import { ToastPopup } from './components/ToastPopup';
import { AppContextProvider, useAppContext } from './context/app';
import { ChatContextProvider } from './context/chat';
import {
  InferenceContextProvider,
  useInferenceContext,
} from './context/inference';
import { ModalProvider } from './context/modal';
import { useDebouncedCallback } from './hooks/useDebouncedCallback';
import { usePWAUpdatePrompt } from './hooks/usePWAUpdatePrompt';
import ChatScreen from './pages/ChatScreen';
import Settings from './pages/Settings';
import WelcomeScreen from './pages/WelcomeScreen';

// Import SidebarProvider dari shadcn
import { SidebarProvider, SidebarTrigger } from './components/ui/sidebar';

const DEBOUNCE_DELAY = 5000;
const TOAST_IDS = {
  PROVIDER_SETUP: 'provider-setup',
  PWA_UPDATE: 'pwa-update',
};

const App: FC = () => {
  return (
    <ModalProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <AppContextProvider>
          <InferenceContextProvider>
            <ChatContextProvider>
              {/* Bungkus layout utama dengan SidebarProvider */}
              <SidebarProvider>
                <Routes>
                  <Route element={<AppLayout />}>
                    <Route path="/chat/:convId" element={<Chat />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="*" element={<WelcomeScreen />} />
                  </Route>
                </Routes>
              </SidebarProvider>
            </ChatContextProvider>
          </InferenceContextProvider>
        </AppContextProvider>
      </BrowserRouter>
    </ModalProvider>
  );
};

const AppLayout: FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { config, showSettings } = useAppContext();
  const { models } = useInferenceContext();
  const { isNewVersion, handleUpdate } = usePWAUpdatePrompt();

  const checkModelsAndShowToast = useCallback(
    (showSettings: boolean, models: unknown[]) => {
      if (showSettings) return;
      if (Array.isArray(models) && models.length > 0) return;

      toast(
        (toast) => {
          const isInitialSetup = config.baseUrl === '';
          const popupConfig = isInitialSetup ? 'welcomePopup' : 'noModelsPopup';

          return (
            <ToastPopup
              t={toast}
              onSubmit={() => navigate('/settings')}
              title={t(`toast.${popupConfig}.title`)}
              description={t(`toast.${popupConfig}.description`)}
              note={t(`toast.${popupConfig}.note`)}
              submitBtn={t(`toast.${popupConfig}.submitBtnLabel`)}
              cancelBtn={t(`toast.${popupConfig}.cancelBtnLabel`)}
            />
          );
        },
        {
          id: TOAST_IDS.PROVIDER_SETUP,
          duration: config.baseUrl === '' ? Infinity : 10000,
          position: 'top-center',
        }
      );
    },
    [t, config.baseUrl, navigate]
  );

  const delayedNoModels = useDebouncedCallback(
    checkModelsAndShowToast,
    DEBOUNCE_DELAY
  );

  useEffect(() => {
    if (isNewVersion) {
      toast(
        (toast) => (
          <ToastPopup
            t={toast}
            onSubmit={handleUpdate}
            title={t('toast.newVersion.title')}
            description={t('toast.newVersion.description')}
            note={t('toast.newVersion.note')}
            submitBtn={t('toast.newVersion.submitBtnLabel')}
            cancelBtn={t('toast.newVersion.cancelBtnLabel')}
          />
        ),
        {
          id: TOAST_IDS.PWA_UPDATE,
          duration: Infinity,
          position: 'top-center',
        }
      );
    }
  }, [t, isNewVersion, handleUpdate]);

  useEffect(() => {
    delayedNoModels(showSettings, models);
  }, [showSettings, models, delayedNoModels]);

  return (
    <>
      <Sidebar />
      {/* Container utama, ganti bg-base-300 dengan bg-background/muted */}
      <div className="flex flex-col w-full h-screen px-1 md:px-2 bg-muted/20">
        <div className="flex items-center gap-2">
          {/* Tombol trigger sidebar hanya muncul di mobile (diatur otomatis oleh shadcn) */}
          <div className="md:hidden p-2">
            <SidebarTrigger />
          </div>
          <div className="grow">
            <Header />
          </div>
        </div>
        
        <main
          className="grow flex flex-col overflow-auto bg-background rounded-xl border border-border shadow-sm"
          id="main-scroll"
        >
          <Outlet />
        </main>
        <Footer />
      </div>
      <Toaster />
    </>
  );
};

const Chat: FC = () => {
  const { convId } = useParams();
  if (!convId) return <Navigate to="/" replace />;
  return <ChatScreen currConvId={convId} />;
};

export default App;