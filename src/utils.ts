import { PublicKey, PublicKeyInitData, TransactionInstruction } from "@solana/web3.js";
import { nu64 } from "buffer-layout";
import { publicKey, struct, u32, u64, u8 } from "@project-serum/borsh";

export const SYSTEM_PROGRAM_ID = new PublicKey(
    "11111111111111111111111111111111"
);
export const TOKEN_PROGRAM_ID = new PublicKey(
    "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);
export const MEMO_PROGRAM_ID = new PublicKey(
    "Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo"
);
export const RENT_PROGRAM_ID = new PublicKey(
    "SysvarRent111111111111111111111111111111111"
);
export const CLOCK_PROGRAM_ID = new PublicKey(
    "SysvarC1ock11111111111111111111111111111111"
);
export const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey(
    "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
);

export const TOKEN_ACCOUNT_LAYOUT = struct([
    publicKey("mint"),
    publicKey("owner"),
    u64("amount"),
    u32("delegateOption"),
    publicKey("delegate"),
    u8("state"),
    u32("isNativeOption"),
    u64("isNative"),
    u64("delegatedAmount"),
    u32("closeAuthorityOption"),
    publicKey("closeAuthority"),
]);

export function isValidPublicKey(key: PublicKeyInitData) {
    if (!key) {
        return false;
    }
    try {
        new PublicKey(key);
        return true;
    } catch {
        return false;
    }
}

export async function findProgramAddress(
    seeds: Array<Buffer | Uint8Array>,
    programId: PublicKey
) {
    const [publicKey, nonce] = await PublicKey.findProgramAddress(
        seeds,
        programId
    );
    return { publicKey, nonce };
}
/**
 * 查找用户spl—token账户地址
 * @param walletAddress 用户钱包地址
 * @param tokenMintAddress USDC Token 地址
 * @returns 
 */
export async function findAssociatedTokenAddress(
    walletAddress: PublicKey,
    tokenMintAddress: PublicKey
) {
    const { publicKey } = await findProgramAddress(
        [
            walletAddress.toBuffer(),
            TOKEN_PROGRAM_ID.toBuffer(),
            tokenMintAddress.toBuffer(),
        ],
        ASSOCIATED_TOKEN_PROGRAM_ID
    );
    return publicKey;
}

export async function createAssociatedTokenAccount(
    payer: PublicKey,
    tokenMintAddress: PublicKey,
    owner: PublicKey
) {
    const associatedTokenAddress = await findAssociatedTokenAddress(
        owner,
        tokenMintAddress
    );

    const keys = [
        {
            pubkey: payer,
            isSigner: true,
            isWritable: true,
        },
        {
            pubkey: associatedTokenAddress,
            isSigner: false,
            isWritable: true,
        },
        {
            pubkey: owner,
            isSigner: false,
            isWritable: false,
        },
        {
            pubkey: tokenMintAddress,
            isSigner: false,
            isWritable: false,
        },
        {
            pubkey: SYSTEM_PROGRAM_ID,
            isSigner: false,
            isWritable: false,
        },
        {
            pubkey: TOKEN_PROGRAM_ID,
            isSigner: false,
            isWritable: false,
        },
        {
            pubkey: RENT_PROGRAM_ID,
            isSigner: false,
            isWritable: false,
        },
    ];

    return new TransactionInstruction({
        keys,
        programId: ASSOCIATED_TOKEN_PROGRAM_ID,
        data: Buffer.from([]),
    });
}
/**
 * 转账交易
 * @param param
 * @returns 
 */
export function transferToken(param: ITransferTokenParams) {
    let keys = [
        { pubkey: param.source, isSigner: false, isWritable: true },
        { pubkey: param.dest, isSigner: false, isWritable: true },
        { pubkey: param.owner, isSigner: true, isWritable: false },
    ];

    const layout = struct([u8("instruction"), nu64("amount")]);

    const data = Buffer.alloc(layout.span);
    layout.encode(
        {
            instruction: 3,
            amount: param.amount,
        },
        data
    );

    return new TransactionInstruction({
        keys,
        data,
        programId: TOKEN_PROGRAM_ID,
    });
}

interface ITransferTokenParams {
    /**
     * 转账源账户
     */
    source: PublicKey;
    /**
     * 转账目标账户
     */
    dest: PublicKey;
    /**
     * 转账人公钥
     */
    owner: PublicKey;
    /**
     * 转账金额
     */
    amount: number;
}