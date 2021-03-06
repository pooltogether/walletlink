import { AddressString, HexString } from "./common";
import { Web3Method } from "./Web3Method";
interface BaseWeb3Response<Result> {
    method: Web3Method;
    errorMessage?: string | null;
    result?: Result;
}
export interface ErrorResponse extends BaseWeb3Response<void> {
    errorMessage: string;
}
export declare function ErrorResponse(method: Web3Method, errorMessage: string): ErrorResponse;
export declare type RequestEthereumAccountsResponse = BaseWeb3Response<AddressString[]>;
export declare function RequestEthereumAccountsResponse(addresses: AddressString[]): RequestEthereumAccountsResponse;
export declare function isRequestEthereumAccountsResponse(res: any): res is RequestEthereumAccountsResponse;
export declare type SignEthereumMessageResponse = BaseWeb3Response<HexString>;
export declare type SignEthereumTransactionResponse = BaseWeb3Response<HexString>;
export declare type SubmitEthereumTransactionResponse = BaseWeb3Response<HexString>;
export declare type EthereumAddressFromSignedMessageResponse = BaseWeb3Response<AddressString>;
export declare type ScanQRCodeResponse = BaseWeb3Response<string>;
export declare type ArbitraryResponse = BaseWeb3Response<string>;
export declare type Web3Response = ErrorResponse | RequestEthereumAccountsResponse | SignEthereumMessageResponse | SignEthereumTransactionResponse | SubmitEthereumTransactionResponse | EthereumAddressFromSignedMessageResponse | ScanQRCodeResponse | ArbitraryResponse;
export {};
