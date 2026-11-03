import { ConfigProvider, App as AntApp } from 'antd';
import '@fontsource/manrope/400.css';
import '@fontsource/manrope/500.css';
import '@fontsource/manrope/600.css';
import '@fontsource/manrope/700.css';
import '@fontsource/manrope/800.css';
import 'dayjs/locale/pt-br';
import dayjs from 'dayjs';
import ptBR from 'antd/locale/pt_BR';
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import tema from './theme/tema.js';
import { StrictMode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthProvider.jsx';
dayjs.locale('pt-br');



createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ConfigProvider theme={tema} locale={ptBR}>
      <AntApp>
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  </StrictMode>
)

