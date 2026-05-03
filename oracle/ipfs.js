// Fetch file from IPFS by CID using public gateways
async function fetchFromIPFS(cid) {
    const gateways = [
        `https://w3s.link/ipfs/${cid}`,
        `https://cloudflare-ipfs.com/ipfs/${cid}`,
        `https://ipfs.io/ipfs/${cid}`,
    ];

    for (const url of gateways) {
        try {
            const res = await fetch(url);

            if (res.ok) {
                const text = await res.text();
                console.log(`Fetched ${cid} from ${url}`);
                return text;
            }
        } catch (e) {
            console.warn(`Gateway ${url} failed:`, e.message);
        }
    }

    throw new Error(`Cannot fetch CID ${cid} from any gateway`);
}

module.exports = { fetchFromIPFS };