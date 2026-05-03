import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';

export const ORACLE_ADDRESS = '0x4e2246ea3280c6f364c97b522c019650a7629d21f97f470b3bbb8e6dd29338ec'; 

// export const aptos = new Aptos(new AptosConfig({ network: Network.DEVNET }));
export const aptos = new Aptos(new AptosConfig({ network: Network.TESTNET }));

export async function createMilestone(wallet, freelancerAddr, rewardOctas, description, testCID) {
    const payload = {
        function: `${ORACLE_ADDRESS}::escrow::create_milestone`,
        functionArguments: [
            ORACLE_ADDRESS,
            freelancerAddr,
            rewardOctas,
            Array.from(new TextEncoder().encode(description)),
            Array.from(new TextEncoder().encode(testCID)),
        ],
    };
    return await wallet.signAndSubmitTransaction({ data: payload });
}

export async function submitSolution(wallet, milestoneId, codeCID) {
    const payload = {
        function: `${ORACLE_ADDRESS}::escrow::submit_solution`,
        functionArguments: [
            ORACLE_ADDRESS,
            milestoneId,
            Array.from(new TextEncoder().encode(codeCID)),
        ],
    };
    return await wallet.signAndSubmitTransaction({ data: payload });
}

export async function getMilestoneStatus(milestoneId) {
    const result = await aptos.view({
        payload: {
            function: `${ORACLE_ADDRESS}::escrow::get_status`,
            functionArguments: [ORACLE_ADDRESS, milestoneId],
        },
    });
    const statuses = ['Pending','Submitted','Passed','Failed','Completed','Refunded'];
    return statuses[result[0]] || 'Unknown';
}