import {
    Connection,
    PublicKey,
    Transaction,
    Keypair,
    sendAndConfirmTransaction
} from "@solana/web3.js";
import {
    transferToken,
    findAssociatedTokenAddress,
    createAssociatedTokenAccount,
    TOKEN_ACCOUNT_LAYOUT,
} from "./utils";
import * as base58 from 'bs58';
const connection = new Connection(`https://solana-api.projectserum.com`, { confirmTransactionInitialTimeout: 2 * 60 * 1000 });

const USDC = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
/**
 * 私钥
 */
const privateKey = ``;
const WALLET = Keypair.fromSecretKey(base58.decode(privateKey), { skipValidation: false });
const OWNER = WALLET.publicKey;
const secreKey = WALLET.secretKey;
console.log(`私钥还原: ${base58.encode(secreKey)}`);
console.log(`公钥: ${OWNER.toBase58()}`);

const addresses: { [addr: string]: number } = {
    "address": 1,
    "3iVeyGyBAfxyrDBApHPGmPksDAEMNqKvmF4Dd5wWjFwX": 1,
    // "4BQcjumDTD9iyznDT7RNfD1ZwcpKdepRLa7uMooSwpyi": 2,
};

async function main() {
    for (const [addr, amount] of Object.entries(addresses)) {
        console.log(`${addr}: ${amount}`);

        let destinationAddress: PublicKey;
        let destinationOwner: PublicKey;

        let address = null;
        try {
            address = new PublicKey(addr);
        } catch (error) {
            console.error(error);
        }
        if (!address) {
            continue;
        }
        const addressInfo = await connection.getAccountInfo(address);

        if (!addressInfo || addressInfo.data.length === 0) {
            destinationOwner = address;
            destinationAddress = await findAssociatedTokenAddress(
                destinationOwner,
                USDC
            );
        } else if (addressInfo.data.length === TOKEN_ACCOUNT_LAYOUT.span) {
            const { mint, owner } = TOKEN_ACCOUNT_LAYOUT.decode(addressInfo.data);

            if (!USDC.equals(mint)) {
                throw new Error(`invalid address: ${addr} is not USDC token account`);
            }

            destinationAddress = address;
            destinationOwner = owner;
        } else {
            throw new Error(`invalid address: ${addr}`);
        }

        const recentBlockhash = await connection.getLatestBlockhash();

        const transaction = new Transaction({
            recentBlockhash: recentBlockhash.blockhash,
        });

        const tokenAccountInfo = await connection.getAccountInfo(
            destinationAddress
        );
        if (!tokenAccountInfo) {
            transaction.add(
                await createAssociatedTokenAccount(OWNER, USDC, destinationOwner)
            );
        }

        const source = await findAssociatedTokenAddress(OWNER, USDC);
        transaction.add(
            transferToken({
                source,
                dest: destinationAddress,
                amount: amount * 10 ** 6,
                owner: OWNER,
            })
        );
        transaction.sign(WALLET);
        let signature = await sendAndConfirmTransaction(
            connection,
            transaction,
            [WALLET],
        );
        // const txid = await connection.sendTransaction(transaction, [WALLET], {
        //     skipPreflight: false,
        // });
        console.log(`${addr}, ${amount} USDC, txid: https://solscan.io/tx/${signature}`);
    }
}

main();