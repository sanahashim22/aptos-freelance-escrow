// import { useState } from 'react';
// import { useWallet } from '@aptos-labs/wallet-adapter-react';
// import { submitSolution, getMilestoneStatus } from './aptos';

// export default function FreelancerPanel() {
//     const { signAndSubmitTransaction } = useWallet();
//     const [milestoneId, setMilestoneId] = useState('0');
//     const [codeCID, setCodeCID] = useState('');
//     const [status, setStatus] = useState('');
//     const [pollStatus, setPollStatus] = useState('');

//     async function handleSubmit() {
//         setStatus('Submitting solution...');
//         try {
//             const txn = await submitSolution(
//                 { signAndSubmitTransaction },
//                 parseInt(milestoneId), codeCID
//             );
//             setStatus('Solution submitted! Txn: ' + txn.hash);
//         } catch (e) {
//             setStatus('Error: ' + e.message);
//         }
//     }

//     async function handlePoll() {
//         const s = await getMilestoneStatus(parseInt(milestoneId));
//         setPollStatus('Status: ' + s);
//     }

//     return (
//         <div style={{ background: '#f0fff4', padding: 16, borderRadius: 8 }}>
//             <h3>Submit Solution (Freelancer)</h3>
//             <input placeholder='Milestone ID' value={milestoneId} onChange={e=>setMilestoneId(e.target.value)} style={{ width: '100%', margin: '4px 0' }} />
//             <input placeholder='Your code IPFS CID (QmXXX...)' value={codeCID} onChange={e=>setCodeCID(e.target.value)} style={{ width: '100%', margin: '4px 0' }} />
//             <button onClick={handleSubmit} style={{ marginTop: 8, padding: '8px 16px' }}>Submit Solution CID</button>
//             {status && <p>{status}</p>}
//             <hr/>
//             <button onClick={handlePoll}>Check My Payment Status</button>
//             {pollStatus && <p>{pollStatus}</p>}
//         </div>
//     );
// }


import { useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { submitSolution, getMilestoneStatus } from './aptos';

export default function FreelancerPanel() {
    const { signAndSubmitTransaction } = useWallet();
    const [milestoneId, setMilestoneId] = useState('');
    const [codeCID, setCodeCID] = useState('');
    const [status, setStatus] = useState('');
    const [statusType, setStatusType] = useState('info');
    const [pollStatus, setPollStatus] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit() {
        if (!milestoneId || !codeCID) {
            setStatusType('error');
            setStatus('❌ Please provide milestone ID and solution CID');
            return;
        }

        setLoading(true);
        setStatusType('info');
        setStatus('🔄 Submitting solution to escrow contract...');

        try {
            const txn = await submitSolution(
                { signAndSubmitTransaction },
                parseInt(milestoneId),
                codeCID
            );
            setStatusType('success');
            setStatus(`✅ Solution submitted successfully! Transaction: ${txn.hash.slice(0, 16)}...`);
            setCodeCID('');
        } catch (e) {
            setStatusType('error');
            setStatus(`❌ Error: ${e.message}`);
        } finally {
            setLoading(false);
        }
    }

    async function handlePoll() {
        if (!milestoneId) {
            setPollStatus('⚠️ Please enter a milestone ID');
            return;
        }

        try {
            const s = await getMilestoneStatus(parseInt(milestoneId));
            setPollStatus(`📢 Milestone #${milestoneId} → ${s}`);
            if (s === 'Completed') {
                setPollStatus(`🎉 ${pollStatus} - Payment has been released!`);
            } else if (s === 'Failed') {
                setPollStatus(`⚠️ ${pollStatus} - Milestone failed, escrow may be refunded.`);
            }
        } catch (e) {
            setPollStatus(`❌ Error fetching status: ${e.message}`);
        }
    }

    return (
        <div className="panel">
            <div className="panel-title">
                <div className="panel-icon">
                    <i className="fas fa-laptop-code"></i>
                </div>
                Freelancer Panel · Submit Work
            </div>

            <div className="form-group">
                <label className="form-label">
                    <i className="fas fa-hashtag"></i> Milestone ID
                </label>
                <input
                    type="number"
                    className="form-input"
                    placeholder="Enter milestone ID (0, 1, 2...)"
                    value={milestoneId}
                    onChange={(e) => setMilestoneId(e.target.value)}
                />
            </div>

            <div className="form-group">
                <label className="form-label">
                    <i className="fas fa-cloud-upload-alt"></i> Solution IPFS CID
                </label>
                <input
                    type="text"
                    className="form-input"
                    placeholder="Qm... (Your completed work CID)"
                    value={codeCID}
                    onChange={(e) => setCodeCID(e.target.value)}
                />
                <small style={{ color: 'var(--text-muted)', marginTop: 'var(--space-xs)' }}>
                    Upload your work to IPFS and paste the CID here
                </small>
            </div>

            <button
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={loading}
                style={{ width: '100%' }}
            >
                {loading ? <span className="loading"></span> : <i className="fas fa-paper-plane"></i>}
                {loading ? ' Submitting...' : ' Submit Solution'}
            </button>

            {status && (
                <div className={`status-box status-${statusType}`}>
                    {status}
                </div>
            )}

            <hr className="divider" />

            <button
                className="btn btn-secondary"
                onClick={handlePoll}
                style={{ width: '100%' }}
            >
                <i className="fas fa-sync-alt"></i> Check Payment / Milestone Status
            </button>

            {pollStatus && (
                <div className="status-box status-info" style={{ marginTop: 'var(--space-md)' }}>
                    {pollStatus}
                </div>
            )}
        </div>
    );
}