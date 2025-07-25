// src/index.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import '@solana/wallet-adapter-react-ui/styles.css';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { Toaster } from 'sonner'; // ✅ use sonner's toaster component

const endpoint = "https://api.devnet.solana.com";
const wallets = [new PhantomWalletAdapter()];

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <App />
            <Toaster position="top-right" theme="dark" richColors />
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </AuthProvider>
  </React.StrictMode>
);
