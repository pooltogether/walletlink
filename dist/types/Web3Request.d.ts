import { AddressString, BigIntString, HexString, IntNumber, RegExpString } from "./common";
import { Web3Method } from "./Web3Method";
interface BaseWeb3Request<Method extends Web3Method, Params extends object = {}> {
    method: Method;
    params: Params;
}
export declare type RequestEthereumAccountsRequest = BaseWeb3Request<Web3Method.requestEthereumAccounts, {
    appName: string;
    appLogoUrl: string | null;
}>;
export declare type SignEthereumMessageRequest = BaseWeb3Request<Web3Method.signEthereumMessage, {
    message: HexString;
    address: AddressString;
    addPrefix: boolean;
    typedDataJson: string | null;
}>;
export declare type SignEthereumTransactionRequest = BaseWeb3Request<Web3Method.signEthereumTransaction, {
    fromAddress: AddressString;
    toAddress: AddressString | null;
    weiValue: BigIntString;
    data: HexString;
    nonce: IntNumber | null;
    gasPriceInWei: BigIntString | null;
    gasLimit: BigIntString | null;
    chainId: IntNumber;
    shouldSubmit: boolean;
}>;
export declare type SubmitEthereumTransactionRequest = BaseWeb3Request<Web3Method.submitEthereumTransaction, {
    signedTransaction: HexString;
    chainId: IntNumber;
}>;
export declare type EthereumAddressFromSignedMessageRequest = BaseWeb3Request<Web3Method.ethereumAddressFromSignedMessage, {
    message: HexString;
    signature: HexString;
    addPrefix: boolean;
}>;
export declare type ScanQRCodeRequest = BaseWeb3Request<Web3Method.scanQRCode, {
    regExp: RegExpString;
}>;
export declare type ArbitraryRequest = BaseWeb3Request<Web3Method.arbitrary, {
    data: string;
}>;
export declare type Web3Request = RequestEthereumAccountsRequest | SignEthereumMessageRequest | SignEthereumTransactionRequest | SubmitEthereumTransactionRequest | EthereumAddressFromSignedMessageRequest | ScanQRCodeRequest | ArbitraryRequest;
export {};
