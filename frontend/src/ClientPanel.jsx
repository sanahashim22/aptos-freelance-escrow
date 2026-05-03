// import { useState } from 'react';
// import { useWallet } from '@aptos-labs/wallet-adapter-react';
// import { createMilestone, getMilestoneStatus } from './aptos';

// export default function ClientPanel() {
//     const { signAndSubmitTransaction } = useWallet();
//     const [freelancer, setFreelancer] = useState('');
//     const [reward, setReward] = useState('1000000'); // in Octas (0.01 APT)
//     const [description, setDescription] = useState('');
//     const [testCID, setTestCID] = useState('');
//     const [status, setStatus] = useState('');
//     const [checkId, setCheckId] = useState('0');
//     const [milestoneStatus, setMilestoneStatus] = useState('');

//     async function handleCreate() {
//         setStatus('Creating milestone...');
//         try {
//             const txn = await createMilestone(
//                 { signAndSubmitTransaction },
//                 freelancer, parseInt(reward), description, testCID
//             );
//             setStatus('Milestone created! Txn: ' + txn.hash);
//         } catch (e) {
//             setStatus('Error: ' + e.message);
//         }
//     }

//     async function handleCheckStatus() {
//         const s = await getMilestoneStatus(parseInt(checkId));
//         setMilestoneStatus('Milestone ' + checkId + ' status: ' + s);
//     }

//     return (
//         <div style={{ background: '#f0f4ff', padding: 16, borderRadius: 8 }}>
//             <h3>Create Milestone (Client)</h3>
//             <input placeholder='Freelancer address (0x...)' value={freelancer} onChange={e=>setFreelancer(e.target.value)} style={{ width: '100%', margin: '4px 0' }} />
//             <input placeholder='Reward in Octas (1000000 = 0.01 APT)' value={reward} onChange={e=>setReward(e.target.value)} style={{ width: '100%', margin: '4px 0' }} />
//             <input placeholder='Description' value={description} onChange={e=>setDescription(e.target.value)} style={{ width: '100%', margin: '4px 0' }} />
//             <input placeholder='Test case IPFS CID (e.g. QmXXX...)' value={testCID} onChange={e=>setTestCID(e.target.value)} style={{ width: '100%', margin: '4px 0' }} />
//             <button onClick={handleCreate} style={{ marginTop: 8, padding: '8px 16px' }}>Create & Lock APT</button>
//             {status && <p>{status}</p>}
//             <hr/>
//             <h4>Check Milestone Status</h4>
//             <input placeholder='Milestone ID (0, 1, 2...)' value={checkId} onChange={e=>setCheckId(e.target.value)} />
//             <button onClick={handleCheckStatus}>Check Status</button>
//             {milestoneStatus && <p>{milestoneStatus}</p>}
//         </div>
//     );
// }

import { useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { createMilestone, getMilestoneStatus } from './aptos';

export default function ClientPanel() {
    const { signAndSubmitTransaction } = useWallet();
    const [freelancer, setFreelancer] = useState('');
    const [reward, setReward] = useState('1000000');
    const [description, setDescription] = useState('');
    const [testCID, setTestCID] = useState('');
    const [status, setStatus] = useState('');
    const [statusType, setStatusType] = useState('info');
    const [checkId, setCheckId] = useState('');
    const [milestoneStatus, setMilestoneStatus] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleCreate() {
        if (!freelancer || !reward || !description) {
            setStatusType('error');
            setStatus('❌ Please fill in all required fields');
            return;
        }

        setLoading(true);
        setStatusType('info');
        setStatus('🔄 Creating milestone and locking APT in escrow...');

        try {
            const txn = await createMilestone(
                { signAndSubmitTransaction },
                freelancer,
                parseInt(reward),
                description,
                testCID
            );
            setStatusType('success');
            setStatus(`✅ Milestone created successfully! Transaction: ${txn.hash.slice(0, 16)}...`);
            // Reset form
            setFreelancer('');
            setDescription('');
            setTestCID('');
        } catch (e) {
            setStatusType('error');
            setStatus(`❌ Error: ${e.message}`);
        } finally {
            setLoading(false);
        }
    }

    async function handleCheckStatus() {
        if (!checkId) {
            setMilestoneStatus('⚠️ Please enter a milestone ID');
            return;
        }

        try {
            const s = await getMilestoneStatus(parseInt(checkId));
            setMilestoneStatus(`📌 Milestone #${checkId} Status: ${s}`);
        } catch (e) {
            setMilestoneStatus(`❌ Failed to fetch status: ${e.message}`);
        }
    }

    return (
        <div className="panel">
            <div className="panel-title">
                <div className="panel-icon">
                    <i className="fas fa-briefcase"></i>
                </div>
                Client Panel · Create Escrow
            </div>

            <div className="form-group">
                <label className="form-label">
                    <i className="fas fa-user-astronaut"></i> Freelancer Address
                </label>
                <input
                    type="text"
                    className="form-input"
                    placeholder="0x..."
                    value={freelancer}
                    onChange={(e) => setFreelancer(e.target.value)}
                />
            </div>

            <div className="form-group">
                <label className="form-label">
                    <i className="fas fa-coins"></i> Reward (Octas)
                </label>
                <input
                    type="number"
                    className="form-input"
                    placeholder="1000000 = 0.01 APT"
                    value={reward}
                    onChange={(e) => setReward(e.target.value)}
                />
            </div>

            <div className="form-group">
                <label className="form-label">
                    <i className="fas fa-file-alt"></i> Milestone Description
                </label>
                <textarea
                    className="form-textarea"
                    rows="3"
                    placeholder="Describe the work to be done..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
            </div>

            <div className="form-group">
                <label className="form-label">
                    <i className="fas fa-vial"></i> Test Case IPFS CID
                </label>
                <input
                    type="text"
                    className="form-input"
                    placeholder="Qm..."
                    value={testCID}
                    onChange={(e) => setTestCID(e.target.value)}
                />
            </div>

            <button
                className="btn btn-primary"
                onClick={handleCreate}
                disabled={loading}
            >
                {loading ? <span className="loading"></span> : <i className="fas fa-lock"></i>}
                {loading ? ' Creating...' : ' Create & Lock APT'}
            </button>

            {status && (
                <div className={`status-box status-${statusType}`}>
                    {status}
                </div>
            )}

            <hr className="divider" />

            <h4 style={{ marginBottom: 'var(--space-md)' }}>
                <i className="fas fa-search"></i> Check Milestone Status
            </h4>
            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                <input
                    type="number"
                    className="form-input"
                    placeholder="Milestone ID (0, 1, 2...)"
                    value={checkId}
                    onChange={(e) => setCheckId(e.target.value)}
                    style={{ flex: 1 }}
                />
                <button className="btn btn-secondary" onClick={handleCheckStatus}>
                    <i className="fas fa-chart-line"></i> Check
                </button>
            </div>
            {milestoneStatus && (
                <div className="status-box status-info" style={{ marginTop: 'var(--space-md)' }}>
                    {milestoneStatus}
                </div>
            )}
        </div>
    );
}