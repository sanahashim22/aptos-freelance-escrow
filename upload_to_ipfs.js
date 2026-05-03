// IPFS upload using Pinata
// Run: node upload_to_ipfs.js <filename>
const fs = require('fs');
const path = require('path');

const PINATA_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI3NTZlYThiOS00MDgzLTQwNWMtYTlhZS0zNDUyNDYwZDk4MWMiLCJlbWFpbCI6InNhbmFoYXNoaW0yMkBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGluX3BvbGljeSI6eyJyZWdpb25zIjpbeyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJGUkExIn0seyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJOWUMxIn1dLCJ2ZXJzaW9uIjoxfSwibWZhX2VuYWJsZWQiOmZhbHNlLCJzdGF0dXMiOiJBQ1RJVkUifSwiYXV0aGVudGljYXRpb25UeXBlIjoic2NvcGVkS2V5Iiwic2NvcGVkS2V5S2V5IjoiZDM0MTY4ODkzMTg5OTg2ZjZlNzIiLCJzY29wZWRLZXlTZWNyZXQiOiIwM2M0YzE2NGI3Yzg4YjYxYjRlYWFiMjc3NTk5MGYxMTQzMDgxZWE1NjdmM2M2YzUyYWQ1NzhjZTE4Mjg5MzUzIiwiZXhwIjoxODA4OTExMjY2fQ.7lNidJKgyMHGK62BndNBZqnfGD6VzP26584v_BjcXQA'; 

async function uploadFile(filepath) {
    const fetch = (await import('node-fetch')).default;
    const FormData = (await import('form-data')).default;

    const fileContent = fs.readFileSync(filepath);
    const filename = path.basename(filepath);

    const formData = new FormData();
    formData.append('file', fileContent, { filename });

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${PINATA_JWT}`,
            ...formData.getHeaders()
        },
        body: formData
    });

    const result = await response.json();
    const cid = result.IpfsHash;
    console.log('CID:', cid);
    console.log('URL:', `https://gateway.pinata.cloud/ipfs/${cid}`);
    return cid;
}

uploadFile(process.argv[2]);