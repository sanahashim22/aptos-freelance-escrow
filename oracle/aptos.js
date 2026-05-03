const { Aptos, AptosConfig, Network, Account, Ed25519PrivateKey } = require('@aptos-labs/ts-sdk');

function getOracleAccount() {
    const privateKey = new Ed25519PrivateKey(
        '0x5199a78dfca6645c2157fd8c22678b07d59162b7fa1ae7c435825ca7cead1dbe'
    );
    return Account.fromPrivateKey({ privateKey });
}

// const aptosConfig = new AptosConfig({ network: Network.DEVNET });
const aptosConfig = new AptosConfig({ network: Network.TESTNET });
const aptos = new Aptos(aptosConfig);
const oracleAccount = getOracleAccount();

async function callReportResult(oracleAddress, milestoneId, passed) {
    const txn = await aptos.transaction.build.simple({
        sender: oracleAccount.accountAddress,
        data: {
            function: `${oracleAddress}::escrow::report_result`,
            functionArguments: [milestoneId, passed],
        },
    });
    const committedTxn = await aptos.signAndSubmitTransaction({
        signer: oracleAccount,
        transaction: txn,
    });
    const result = await aptos.waitForTransaction({ transactionHash: committedTxn.hash });
    console.log('report_result txn:', committedTxn.hash, '| success:', result.success);
    return result;
}

module.exports = { aptos, oracleAccount, callReportResult };