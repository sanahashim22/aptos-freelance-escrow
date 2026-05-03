const { Aptos, AptosConfig, Network } = require('@aptos-labs/ts-sdk');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { callReportResult } = require('./aptos');
const { fetchFromIPFS } = require('./ipfs');

// ── CONFIGURE THIS ──────────────────────────────────
const ORACLE_ADDRESS = '0x4e2246ea3280c6f364c97b522c019650a7629d21f97f470b3bbb8e6dd29338ec';  
const POLL_INTERVAL_MS = 5000;  // Check for new events every 5 seconds
// ────────────────────────────────────────────────────

// const aptosConfig = new AptosConfig({ network: Network.DEVNET });
const aptosConfig = new AptosConfig({ network: Network.TESTNET });
const aptos = new Aptos(aptosConfig);

let lastProcessedVersion = 0;

// Execute code in Docker sandbox and return { passed, stdout, stderr }
// async function executeInDocker(code, testInput, expectedOutput) {
//     return new Promise((resolve) => {
//         // Write code to temp file
//         const tmpCode = `/tmp/solution_${Date.now()}.py`;
//         fs.writeFileSync(tmpCode, code);
        
//         const dockerCmd = [
//             'docker run --rm',
//             '--network none',
//             '--memory 128m',
//             '--cpus 0.5',
//             `-v ${tmpCode}:/solution.py:ro`,
//             'python:3.11-alpine',
//             `sh -c "echo '${testInput}' | timeout 10 python /solution.py"`
//         ].join(' ');
        
//         console.log('Running Docker:', dockerCmd);
        
//         exec(dockerCmd, { timeout: 15000 }, (error, stdout, stderr) => {
//             fs.unlinkSync(tmpCode);  // cleanup
//             const actualOutput = stdout.trim();
//             const expected = expectedOutput.trim();
//             const passed = actualOutput === expected;
//             console.log(`stdout: '${actualOutput}' | expected: '${expected}' | passed: ${passed}`);
//             resolve({ passed, stdout: actualOutput, stderr });
//         });
//     });
// }


async function executeInDocker(code, testInput, expectedOutput, language) {
    return new Promise((resolve) => {
        language = (language || 'python').toLowerCase();
        
        let ext, image, runCmd;
        if (language === 'javascript' || language === 'js') {
            ext = 'js';
            image = 'node:18-alpine';
            runCmd = `sh -c "echo '${testInput}' | timeout 10 node /solution.js"`;
        } else if (language === 'java') {
            ext = 'java';
            image = 'openjdk:17-alpine';
            runCmd = `sh -c "cd /tmp && cp /solution.java Solution.java && javac Solution.java && echo '${testInput}' | timeout 10 java Solution"`;
        } else {
            // Default: Python
            ext = 'py';
            image = 'python:3.11-alpine';
            runCmd = `sh -c "echo '${testInput}' | timeout 10 python /solution.py"`;
        }
        
        const tmpCode = `/tmp/solution_${Date.now()}.${ext}`;
        fs.writeFileSync(tmpCode, code);
        
        const dockerCmd = [
            'docker run --rm',
            '--network none',
            '--memory 128m',
            '--cpus 0.5',
            `-v ${tmpCode}:/solution.${ext}:ro`,
            image,
            runCmd
        ].join(' ');
        
        console.log(`Running Docker [${language}]:`, image);
        
        exec(dockerCmd, { timeout: 15000 }, (error, stdout, stderr) => {
            try { fs.unlinkSync(tmpCode); } catch(e) {}
            const actualOutput = stdout.trim();
            const expected = expectedOutput.trim();
            const passed = actualOutput === expected;
            console.log(`stdout: '${actualOutput}' | expected: '${expected}' | passed: ${passed}`);
            resolve({ passed, stdout: actualOutput, stderr });
        });
    });
}






// Parse test case file format: first line = input, second line = expected output
function parseTestCase(testContent) {
    const lines = testContent.trim().split('\n');
    return { input: lines[0] || '', expectedOutput: lines[1] || '' };
}


async function pollForEvents() {
    try {
        // Use getAccountResource to read the EscrowStore and check for new submissions
        const resource = await aptos.getAccountResource({
            accountAddress: ORACLE_ADDRESS,
            resourceType: `${ORACLE_ADDRESS}::escrow::EscrowStore`,
        });

        const milestones = resource.milestones || [];
        
        for (let i = 0; i < milestones.length; i++) {
            const ms = milestones[i];
            // status 1 = Submitted (needs evaluation)
            if (ms.status === 1 && i >= lastProcessedVersion) {
                lastProcessedVersion = i + 1;
                console.log(`\n=== Found submitted milestone ${i}, code CID: ${ms.code_hash} ===`);
                await processSubmission(i, ms.code_hash);
            }
        }
    } catch (err) {
        console.error('Poll error:', err.message);
    }
}




// async function processSubmission(milestoneId, codeCID) {
//     try {
//         // 1. Fetch milestone to get test_hash
//         const resource = await aptos.getAccountResource({
//             accountAddress: ORACLE_ADDRESS,
//             resourceType: `${ORACLE_ADDRESS}::escrow::EscrowStore`,
//         });
//         const milestone = resource.milestones[milestoneId];
//         const testCID = milestone.test_hash;
//         console.log(`Test CID: ${testCID}`);
        
//         // 2. Fetch code and test case from IPFS
//         const [codeContent, testContent] = await Promise.all([
//             fetchFromIPFS(codeCID),
//             fetchFromIPFS(testCID),
//         ]);
//         console.log('Code fetched. Test case fetched.');
        
//         // 3. Parse test case
//         const { input, expectedOutput } = parseTestCase(testContent);
//         console.log(`Input: '${input}' | Expected: '${expectedOutput}'`);
        
//         // 4. Execute in Docker
//         // const { passed } = await executeInDocker(codeContent, input, expectedOutput);

//         const language = milestone.language || 'python';
//         const { passed } = await executeInDocker(codeContent, input, expectedOutput, language);

        
//         // 5. Report result on-chain
//         await callReportResult(ORACLE_ADDRESS, milestoneId, passed);
//         console.log(`Milestone ${milestoneId}: ${passed ? 'PASSED — APT released' : 'FAILED — funds held'}`);
        
//     } catch (err) {
//         console.error(`Error processing milestone ${milestoneId}:`, err.message);
//     }
// }

async function processSubmission(milestoneId, codeCID) {
    const startTime = Date.now();  // ADD THIS LINE

    try {
        // 1. Fetch milestone to get test_hash
        const resource = await aptos.getAccountResource({
            accountAddress: ORACLE_ADDRESS,
            resourceType: `${ORACLE_ADDRESS}::escrow::EscrowStore`,
        });

        const milestone = resource.milestones[milestoneId];
        const testCID = milestone.test_hash;
        console.log(`Test CID: ${testCID}`);
        
        // 2. Fetch code and test case from IPFS
        const [codeContent, testContent] = await Promise.all([
            fetchFromIPFS(codeCID),
            fetchFromIPFS(testCID),
        ]);

        console.log('Code fetched. Test case fetched.');
        
        // 3. Parse test case
        const { input, expectedOutput } = parseTestCase(testContent);
        console.log(`Input: '${input}' | Expected: '${expectedOutput}'`);
        
        // 4. Execute in Docker
        // const language = milestone.language || 'python';
        let language = 'python';
        if (codeCID.toLowerCase().includes('.js')) {
            language = 'javascript';
        } else if (
            codeContent.includes("require('fs')") ||
            codeContent.includes('require("fs")') ||
            codeContent.includes('console.log') ||
            codeContent.includes('process.stdin')
        ) {
            language = 'javascript';
        } else if (
            codeContent.includes('public class') ||
            codeContent.includes('System.out.println')
        ) {
            language = 'java';
        }
        const { passed } = await executeInDocker(codeContent, input, expectedOutput, language);

        // 5. Report result on-chain
        await callReportResult(ORACLE_ADDRESS, milestoneId, passed);

        const elapsed = Date.now() - startTime;  // ADD THIS LINE
        console.log(`Oracle round-trip time: ${elapsed}ms`);  // ADD THIS LINE

        console.log(`Milestone ${milestoneId}: ${passed ? 'PASSED — APT released' : 'FAILED — funds held'}`);
        
    } catch (err) {
        console.error(`Error processing milestone ${milestoneId}:`, err.message);
    }
}


// Start polling
console.log('Oracle server started. Listening for SolutionSubmitted events...');
console.log(`Oracle address: ${ORACLE_ADDRESS}`);
setInterval(pollForEvents, POLL_INTERVAL_MS);
pollForEvents();  // Run immediately on startup
