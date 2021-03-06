"use strict";
// Copyright (c) 2018-2019 Coinbase, Inc. <https://coinbase.com/>
// Licensed under the Apache License, version 2.0
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bn_js_1 = __importDefault(require("bn.js"));
const eth_eip712_util_1 = __importDefault(require("eth-eip712-util"));
const events_1 = require("events");
const FilterPolyfill_1 = require("./FilterPolyfill");
const JSONRPC_1 = require("./types/JSONRPC");
const Web3Provider_1 = require("./types/Web3Provider");
const util_1 = require("./util");
const LOCAL_STORAGE_ADDRESSES_KEY = "Addresses";
class WalletLinkProvider extends events_1.EventEmitter {
    constructor(options) {
        super();
        this._filterPolyfill = new FilterPolyfill_1.FilterPolyfill(this);
        this._addresses = [];
        this._send = this.send;
        this._sendAsync = this.sendAsync;
        if (!options.relay) {
            throw new Error("realy must be provided");
        }
        if (!options.jsonRpcUrl) {
            throw new Error("jsonRpcUrl must be provided");
        }
        this._relay = options.relay;
        this._chainId = util_1.ensureIntNumber(options.chainId || 1);
        this._jsonRpcUrl = options.jsonRpcUrl;
        const cahedAddresses = this._relay.getStorageItem(LOCAL_STORAGE_ADDRESSES_KEY);
        if (cahedAddresses) {
            const addresses = cahedAddresses.split(" ");
            if (addresses[0] !== "") {
                this._addresses = addresses;
            }
        }
    }
    get selectedAddress() {
        return this._addresses[0] || undefined;
    }
    get networkVersion() {
        return this._chainId.toString(10);
    }
    get isWalletLink() {
        return true;
    }
    get host() {
        return this._jsonRpcUrl;
    }
    get connected() {
        return true;
    }
    isConnected() {
        return true;
    }
    async enable() {
        if (this._addresses.length > 0) {
            return this._addresses;
        }
        return await this._send(JSONRPC_1.JSONRPCMethod.eth_requestAccounts);
    }
    send(requestOrMethod, callbackOrParams) {
        // send<T>(method, params): Promise<T>
        if (typeof requestOrMethod === "string") {
            const method = requestOrMethod;
            const params = Array.isArray(callbackOrParams)
                ? callbackOrParams
                : callbackOrParams !== undefined
                    ? [callbackOrParams]
                    : [];
            const request = { jsonrpc: "2.0", id: 1, method, params };
            return this._sendRequestAsync(request).then(res => res.result);
        }
        // send(JSONRPCRequest | JSONRPCRequest[], callback): void
        if (typeof callbackOrParams === "function") {
            const request = requestOrMethod;
            const callback = callbackOrParams;
            return this._sendAsync(request, callback);
        }
        // send(JSONRPCRequest[]): JSONRPCResponse[]
        if (Array.isArray(requestOrMethod)) {
            const requests = requestOrMethod;
            return requests.map(r => this._sendRequest(r));
        }
        // send(JSONRPCRequest): JSONRPCResponse
        const req = requestOrMethod;
        return this._sendRequest(req);
    }
    sendAsync(request, callback) {
        if (typeof callback !== "function") {
            throw new Error("callback is required");
        }
        // send(JSONRPCRequest[], callback): void
        if (Array.isArray(request)) {
            const arrayCb = callback;
            this._sendMultipleRequestsAsync(request)
                .then(responses => arrayCb(null, responses))
                .catch(err => arrayCb(err, null));
            return;
        }
        // send(JSONRPCRequest, callback): void
        const cb = callback;
        this._sendRequestAsync(request)
            .then(response => cb(null, response))
            .catch(err => cb(err, null));
    }
    async scanQRCode(match) {
        const res = await this._relay.scanQRCode(util_1.ensureRegExpString(match));
        if (typeof res.result !== "string") {
            throw new Error("result was not a string");
        }
        return res.result;
    }
    async arbitraryRequest(data) {
        const res = await this._relay.arbitraryRequest(data);
        if (typeof res.result !== "string") {
            throw new Error("result was not a string");
        }
        return res.result;
    }
    supportsSubscriptions() {
        return false;
    }
    subscribe() {
        throw new Error("Subscriptions are not supported");
    }
    unsubscribe() {
        throw new Error("Subscriptions are not supported");
    }
    disconnect() {
        return true;
    }
    _sendRequest(request) {
        const response = {
            jsonrpc: "2.0",
            id: request.id
        };
        const { method } = request;
        response.result = this._handleSynchronousMethods(request);
        if (response.result === undefined) {
            throw new Error(`WalletLink does not support calling ${method} synchronously without ` +
                `a callback. Please provide a callback parameter to call ${method} ` +
                `asynchronously.`);
        }
        return response;
    }
    _setAddresses(addresses) {
        if (!Array.isArray(addresses)) {
            throw new Error("addresses is not an array");
        }
        this._addresses = addresses.map(address => util_1.ensureAddressString(address));
        this._relay.setStorageItem(LOCAL_STORAGE_ADDRESSES_KEY, addresses.join(" "));
        this.emit("accountsChanged", this._addresses);
    }
    _sendRequestAsync(request) {
        return new Promise((resolve, reject) => {
            try {
                const syncResult = this._handleSynchronousMethods(request);
                if (syncResult !== undefined) {
                    return resolve({
                        jsonrpc: "2.0",
                        id: request.id,
                        result: syncResult
                    });
                }
                const filterPromise = this._handleAsynchronousFilterMethods(request);
                if (filterPromise !== undefined) {
                    filterPromise
                        .then(res => resolve(Object.assign({}, res, { id: request.id })))
                        .catch(err => reject(err));
                    return;
                }
            }
            catch (err) {
                return reject(err);
            }
            this._handleAsynchronousMethods(request)
                .then(res => resolve(Object.assign({}, res, { id: request.id })))
                .catch(err => reject(err));
        });
    }
    _sendMultipleRequestsAsync(requests) {
        return Promise.all(requests.map(r => this._sendRequestAsync(r)));
    }
    _handleSynchronousMethods(request) {
        const { method } = request;
        const params = request.params || [];
        switch (method) {
            case JSONRPC_1.JSONRPCMethod.eth_accounts:
                return this._eth_accounts();
            case JSONRPC_1.JSONRPCMethod.eth_coinbase:
                return this._eth_coinbase();
            case JSONRPC_1.JSONRPCMethod.eth_uninstallFilter:
                return this._eth_uninstallFilter(params);
            case JSONRPC_1.JSONRPCMethod.net_version:
                return this._net_version();
            default:
                return undefined;
        }
    }
    _handleAsynchronousMethods(request) {
        const { method } = request;
        const params = request.params || [];
        switch (method) {
            case JSONRPC_1.JSONRPCMethod.eth_requestAccounts:
                return this._eth_requestAccounts();
            case JSONRPC_1.JSONRPCMethod.eth_sign:
                return this._eth_sign(params);
            case JSONRPC_1.JSONRPCMethod.eth_ecRecover:
                return this._eth_ecRecover(params);
            case JSONRPC_1.JSONRPCMethod.personal_sign:
                return this._personal_sign(params);
            case JSONRPC_1.JSONRPCMethod.personal_ecRecover:
                return this._personal_ecRecover(params);
            case JSONRPC_1.JSONRPCMethod.eth_signTransaction:
                return this._eth_signTransaction(params);
            case JSONRPC_1.JSONRPCMethod.eth_sendRawTransaction:
                return this._eth_sendRawTransaction(params);
            case JSONRPC_1.JSONRPCMethod.eth_sendTransaction:
                return this._eth_sendTransaction(params);
            case JSONRPC_1.JSONRPCMethod.eth_signTypedData_v1:
                return this._eth_signTypedData_v1(params);
            case JSONRPC_1.JSONRPCMethod.eth_signTypedData_v2:
                return this._throwUnsupportedMethodError();
            case JSONRPC_1.JSONRPCMethod.eth_signTypedData_v3:
                return this._eth_signTypedData_v3(params);
            case JSONRPC_1.JSONRPCMethod.eth_signTypedData_v4:
            case JSONRPC_1.JSONRPCMethod.eth_signTypedData:
                return this._eth_signTypedData_v4(params);
            case JSONRPC_1.JSONRPCMethod.walletlink_arbitrary:
                return this._walletlink_arbitrary(params);
        }
        return window
            .fetch(this._jsonRpcUrl, {
            method: "POST",
            body: JSON.stringify(request),
            mode: "cors",
            headers: { "Content-Type": "application/json" }
        })
            .then(res => res.json())
            .then(json => {
            if (!json) {
                throw new Web3Provider_1.ProviderError("unexpected response");
            }
            const response = json;
            const { error } = response;
            if (error) {
                throw new Web3Provider_1.ProviderError(error.message || "RPC Error", error.code, error.data);
            }
            return response;
        });
    }
    _handleAsynchronousFilterMethods(request) {
        const { method } = request;
        const params = request.params || [];
        switch (method) {
            case JSONRPC_1.JSONRPCMethod.eth_newFilter:
                return this._eth_newFilter(params);
            case JSONRPC_1.JSONRPCMethod.eth_newBlockFilter:
                return this._eth_newBlockFilter();
            case JSONRPC_1.JSONRPCMethod.eth_newPendingTransactionFilter:
                return this._eth_newPendingTransactionFilter();
            case JSONRPC_1.JSONRPCMethod.eth_getFilterChanges:
                return this._eth_getFilterChanges(params);
            case JSONRPC_1.JSONRPCMethod.eth_getFilterLogs:
                return this._eth_getFilterLogs(params);
        }
        return undefined;
    }
    _isKnownAddress(addressString) {
        try {
            const address = util_1.ensureAddressString(addressString);
            return this._addresses.includes(address);
        }
        catch (_a) { }
        return false;
    }
    _ensureKnownAddress(addressString) {
        if (!this._isKnownAddress(addressString)) {
            throw new Error("Unknown Ethereum address");
        }
    }
    _prepareTransactionParams(tx) {
        const fromAddress = tx.from
            ? util_1.ensureAddressString(tx.from)
            : this.selectedAddress;
        if (!fromAddress) {
            throw new Error("Ethereum address is unavailable");
        }
        this._ensureKnownAddress(fromAddress);
        const toAddress = tx.to ? util_1.ensureAddressString(tx.to) : null;
        const weiValue = tx.value != null ? util_1.ensureBN(tx.value) : new bn_js_1.default(0);
        const data = tx.data ? util_1.ensureBuffer(tx.data) : Buffer.alloc(0);
        const nonce = tx.nonce != null ? util_1.ensureIntNumber(tx.nonce) : null;
        const gasPriceInWei = tx.gasPrice != null ? util_1.ensureBN(tx.gasPrice) : null;
        const gasLimit = tx.gas != null ? util_1.ensureBN(tx.gas) : null;
        const chainId = this._chainId;
        return {
            fromAddress,
            toAddress,
            weiValue,
            data,
            nonce,
            gasPriceInWei,
            gasLimit,
            chainId
        };
    }
    _requireAuthorization() {
        if (this._addresses.length === 0) {
            throw new Web3Provider_1.ProviderError("Unauthorized", Web3Provider_1.ProviderErrorCode.UNAUTHORIZED);
        }
    }
    _throwUnsupportedMethodError() {
        throw new Web3Provider_1.ProviderError("Unsupported method", Web3Provider_1.ProviderErrorCode.UNSUPPORTED_METHOD);
    }
    async _signEthereumMessage(message, address, addPrefix, typedDataJson) {
        this._ensureKnownAddress(address);
        try {
            const res = await this._relay.signEthereumMessage(message, address, addPrefix, typedDataJson);
            return { jsonrpc: "2.0", id: 0, result: res.result };
        }
        catch (err) {
            if (typeof err.message === "string" &&
                err.message.match(/(denied|rejected)/i)) {
                throw new Web3Provider_1.ProviderError("User denied message signature", Web3Provider_1.ProviderErrorCode.USER_DENIED_REQUEST_SIGNATURE);
            }
            throw err;
        }
    }
    async _ethereumAddressFromSignedMessage(message, signature, addPrefix) {
        const res = await this._relay.ethereumAddressFromSignedMessage(message, signature, addPrefix);
        return { jsonrpc: "2.0", id: 0, result: res.result };
    }
    _eth_accounts() {
        return this._addresses;
    }
    _eth_coinbase() {
        return this.selectedAddress || null;
    }
    _net_version() {
        return this._chainId.toString(10);
    }
    async _eth_requestAccounts() {
        if (this._addresses.length > 0) {
            return Promise.resolve({ jsonrpc: "2.0", id: 0, result: this._addresses });
        }
        let res;
        try {
            res = await this._relay.requestEthereumAccounts();
        }
        catch (err) {
            if (typeof err.message === "string" &&
                err.message.match(/(denied|rejected)/i)) {
                throw new Web3Provider_1.ProviderError("User denied account authorization", Web3Provider_1.ProviderErrorCode.USER_DENIED_REQUEST_ACCOUNTS);
            }
            throw err;
        }
        if (!res.result) {
            throw new Error("accounts received is empty");
        }
        this._setAddresses(res.result);
        return { jsonrpc: "2.0", id: 0, result: this._addresses };
    }
    _eth_sign(params) {
        this._requireAuthorization();
        const address = util_1.ensureAddressString(params[0]);
        const message = util_1.ensureBuffer(params[1]);
        return this._signEthereumMessage(message, address, false);
    }
    _eth_ecRecover(params) {
        const message = util_1.ensureBuffer(params[0]);
        const signature = util_1.ensureBuffer(params[1]);
        return this._ethereumAddressFromSignedMessage(message, signature, false);
    }
    _personal_sign(params) {
        this._requireAuthorization();
        const message = util_1.ensureBuffer(params[0]);
        const address = util_1.ensureAddressString(params[1]);
        return this._signEthereumMessage(message, address, true);
    }
    _personal_ecRecover(params) {
        const message = util_1.ensureBuffer(params[0]);
        const signature = util_1.ensureBuffer(params[1]);
        return this._ethereumAddressFromSignedMessage(message, signature, true);
    }
    async _eth_signTransaction(params) {
        this._requireAuthorization();
        const tx = this._prepareTransactionParams(params[0] || {});
        try {
            const res = await this._relay.signEthereumTransaction(tx);
            return { jsonrpc: "2.0", id: 0, result: res.result };
        }
        catch (err) {
            if (typeof err.message === "string" &&
                err.message.match(/(denied|rejected)/i)) {
                throw new Web3Provider_1.ProviderError("User denied transaction signature", Web3Provider_1.ProviderErrorCode.USER_DENIED_REQUEST_SIGNATURE);
            }
            throw err;
        }
    }
    async _eth_sendRawTransaction(params) {
        const signedTransaction = util_1.ensureBuffer(params[0]);
        const res = await this._relay.submitEthereumTransaction(signedTransaction, this._chainId);
        return { jsonrpc: "2.0", id: 0, result: res.result };
    }
    async _eth_sendTransaction(params) {
        this._requireAuthorization();
        const tx = this._prepareTransactionParams(params[0] || {});
        try {
            const res = await this._relay.signAndSubmitEthereumTransaction(tx);
            return { jsonrpc: "2.0", id: 0, result: res.result };
        }
        catch (err) {
            if (typeof err.message === "string" &&
                err.message.match(/(denied|rejected)/i)) {
                throw new Web3Provider_1.ProviderError("User denied transaction signature", Web3Provider_1.ProviderErrorCode.USER_DENIED_REQUEST_SIGNATURE);
            }
            throw err;
        }
    }
    async _eth_signTypedData_v1(params) {
        this._requireAuthorization();
        const typedData = params[0];
        const address = util_1.ensureAddressString(params[1]);
        this._ensureKnownAddress(address);
        const message = eth_eip712_util_1.default.hashForSignTypedDataLegacy({ data: typedData });
        const typedDataJson = JSON.stringify(typedData, null, 2);
        return this._signEthereumMessage(message, address, false, typedDataJson);
    }
    async _eth_signTypedData_v3(params) {
        this._requireAuthorization();
        const address = util_1.ensureAddressString(params[0]);
        const typedData = params[1];
        this._ensureKnownAddress(address);
        const message = eth_eip712_util_1.default.hashForSignTypedData_v3({ data: typedData });
        const typedDataJson = JSON.stringify(typedData, null, 2);
        return this._signEthereumMessage(message, address, false, typedDataJson);
    }
    async _eth_signTypedData_v4(params) {
        this._requireAuthorization();
        const address = util_1.ensureAddressString(params[0]);
        const typedData = params[1];
        this._ensureKnownAddress(address);
        const message = eth_eip712_util_1.default.hashForSignTypedData_v4({ data: typedData });
        const typedDataJson = JSON.stringify(typedData, null, 2);
        return this._signEthereumMessage(message, address, false, typedDataJson);
    }
    async _walletlink_arbitrary(params) {
        const data = params[0];
        if (typeof data !== "string") {
            throw new Error("parameter must be a string");
        }
        const result = await this.arbitraryRequest(data);
        return { jsonrpc: "2.0", id: 0, result };
    }
    _eth_uninstallFilter(params) {
        const filterId = util_1.ensureHexString(params[0]);
        return this._filterPolyfill.uninstallFilter(filterId);
    }
    async _eth_newFilter(params) {
        const param = params[0]; // TODO: un-any this
        const filterId = await this._filterPolyfill.newFilter(param);
        return { jsonrpc: "2.0", id: 0, result: filterId };
    }
    async _eth_newBlockFilter() {
        const filterId = await this._filterPolyfill.newBlockFilter();
        return { jsonrpc: "2.0", id: 0, result: filterId };
    }
    async _eth_newPendingTransactionFilter() {
        const filterId = await this._filterPolyfill.newPendingTransactionFilter();
        return { jsonrpc: "2.0", id: 0, result: filterId };
    }
    _eth_getFilterChanges(params) {
        const filterId = util_1.ensureHexString(params[0]);
        return this._filterPolyfill.getFilterChanges(filterId);
    }
    _eth_getFilterLogs(params) {
        const filterId = util_1.ensureHexString(params[0]);
        return this._filterPolyfill.getFilterLogs(filterId);
    }
}
exports.WalletLinkProvider = WalletLinkProvider;
