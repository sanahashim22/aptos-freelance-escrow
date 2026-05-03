// import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
// import { PetraWallet } from 'petra-plugin-wallet-adapter';
// import { useWallet } from '@aptos-labs/wallet-adapter-react';
// import ClientPanel from './ClientPanel';
// import FreelancerPanel from './FreelancerPanel';

// const wallets = [new PetraWallet()];

// function AppContent() {
//     const { connect, account, connected, disconnect } = useWallet();
//     return (
//         <div style={{ fontFamily: 'Arial', maxWidth: 1200, margin: '0 auto', padding: 20 }}>
//             <h1>Freelance Escrow DApp - Aptos Devnet</h1>
            
//             {!connected ? (
//                 <button onClick={() => connect('Petra')} style={{ padding: '10px 20px', fontSize: 16 }}>
//                     Connect Petra Wallet
//                 </button>
//             ) : (
//                 <div>
//                     <p>Connected: {account?.address?.toString()}</p>
//                     <button onClick={disconnect}>Disconnect</button>
//                     <hr/>
//                     <h2>Client Panel</h2>
//                     <ClientPanel />
//                     <hr/>
//                     <h2>Freelancer Panel</h2>
//                     <FreelancerPanel />
//                 </div>
//             )}
//         </div>
//     );
// }

// export default function App() {
//     return (
//         <AptosWalletAdapterProvider plugins={wallets} autoConnect={false}>
//             <AppContent />
//         </AptosWalletAdapterProvider>
//     );
// }


import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { PetraWallet } from 'petra-plugin-wallet-adapter';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useState, useEffect } from 'react';
import ClientPanel from './ClientPanel';
import FreelancerPanel from './FreelancerPanel';
import './App.css';

const wallets = [new PetraWallet()];

function AppContent() {
    const { connect, account, connected, disconnect } = useWallet();
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    return (
        <div className="app-container">
            <header className="header">
                <div className="header-content">
                    <div className="logo-section">
                        <div className="logo">⚡</div>
                        <div className="logo-text">
                            <h2>EscrowFlow</h2>
                            <p>Decentralized Freelance Escrow on Aptos</p>
                        </div>
                    </div>
                    <div className="wallet-section">
                        <button className="btn btn-secondary" onClick={toggleTheme}>
                            <i className={`fas fa-${theme === 'dark' ? 'sun' : 'moon'}`}></i>
                            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                        </button>
                        {!connected ? (
                            <button className="btn btn-primary" onClick={() => connect('Petra')}>
                                <i className="fas fa-wallet"></i> Connect Petra Wallet
                            </button>
                        ) : (
                            <>
                                <div className="address-display">
                                    <span className="address-label">Connected:</span>
                                    <span className="address-value">
                                        {account?.address?.toString().slice(0, 6)}...{account?.address?.toString().slice(-4)}
                                    </span>
                                </div>
                                <button className="btn btn-danger" onClick={disconnect}>
                                    <i className="fas fa-sign-out-alt"></i> Disconnect
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <main className="main-content">
                {!connected ? (
                    <div className="card welcome-card">
                        <div className="welcome-content">
                            <i className="fas fa-link welcome-icon"></i>
                            <h1>Connect Your Petra Wallet</h1>
                            <p>Interact with the escrow smart contract: create milestones, submit solutions, and automate payments on Aptos Devnet.</p>
                            <button className="btn btn-primary btn-large" onClick={() => connect('Petra')}>
                                <i className="fas fa-plug"></i> Connect Wallet to Start
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="network-badge">
                            <span className="badge devnet">
                                <i className="fas fa-circle"></i> Aptos Active
                            </span>
                            <span className="badge oracle">
                                <i className="fas fa-database"></i> Oracle: 0x4e22...38ec
                            </span>
                        </div>
                        <div className="grid grid-2">
                            <ClientPanel />
                            <FreelancerPanel />
                        </div>
                        <div className="info-panel">
                            <div className="info-header">
                                <i className="fas fa-shield-alt"></i>
                                <strong>Escrow Workflow</strong>
                                <i className="fas fa-clock"></i>
                            </div>
                            <p>Pending → Submitted → Passed/Failed → Completed / Refunded</p>
                            <p className="info-note">🔒 Funds held in escrow until client approval or automated oracle verification</p>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}

export default function App() {
    return (
        <AptosWalletAdapterProvider plugins={wallets} autoConnect={false}>
            <AppContent />
        </AptosWalletAdapterProvider>
    );
}