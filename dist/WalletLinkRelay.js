"use strict";
// Copyright (c) 2018-2019 Coinbase, Inc. <https://coinbase.com/>
// Licensed under the Apache License, version 2.0
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const bind_decorator_1 = __importDefault(require("bind-decorator"));
const crypto_1 = __importDefault(require("crypto"));
const url_1 = __importDefault(require("url"));
const ScopedLocalStorage_1 = require("./ScopedLocalStorage");
const LinkedMessage_1 = require("./types/LinkedMessage");
const LocalStorageBlockedMessage_1 = require("./types/LocalStorageBlockedMessage");
const SessionIdRequestMessage_1 = require("./types/SessionIdRequestMessage");
const SessionIdResponseMessage_1 = require("./types/SessionIdResponseMessage");
const UnlinkedMessage_1 = require("./types/UnlinkedMessage");
const Web3Method_1 = require("./types/Web3Method");
const Web3RequestCanceledMessage_1 = require("./types/Web3RequestCanceledMessage");
const Web3RequestMessage_1 = require("./types/Web3RequestMessage");
const Web3Response_1 = require("./types/Web3Response");
const Web3ResponseMessage_1 = require("./types/Web3ResponseMessage");
const util_1 = require("./util");
const walletLinkBlockedDialog = __importStar(require("./walletLinkBlockedDialog"));
const WalletLinkNotification_1 = require("./WalletLinkNotification");
const LOCAL_STORAGE_SESSION_ID_KEY = "SessionId";
const BLOCKED_LOCAL_STORAGE_ERROR_MESSAGE = "Browser is blocking third-party localStorage usage. To continue, " +
    "turn off third-party storage blocking or whitelist WalletLink.";
class WalletLinkRelay {
    constructor(options) {
        this.iframeEl = null;
        this.popupUrl = null;
        this.popupWindow = null;
        this.sessionId = null;
        this.appName = "";
        this.appLogoUrl = null;
        this.linked = false;
        this.iframeLoaded = false;
        this.localStorageBlocked = false;
        this.actionsPendingIframeLoad = [];
        this.actionsPendingSessionId = [];
        this.walletLinkUrl = options.walletLinkUrl;
        const u = url_1.default.parse(this.walletLinkUrl);
        // this.walletLinkOrigin = `${u.protocol}//${u.host}`;
        this.walletLinkOrigin = this.walletLinkUrl;
        this.storage = new ScopedLocalStorage_1.ScopedLocalStorage(`__WalletLink__:${this.walletLinkOrigin}`);
        this.sessionId = this.getStorageItem(LOCAL_STORAGE_SESSION_ID_KEY) || null;
    }
    setAppInfo(appName, appLogoUrl) {
        this.appName = appName;
        this.appLogoUrl = appLogoUrl;
    }
    injectIframe() {
        if (this.iframeEl) {
            throw new Error("iframe already injected!");
        }
        const iframeEl = document.createElement("iframe");
        iframeEl.className = "_WalletLinkBridge";
        iframeEl.width = "1";
        iframeEl.height = "1";
        iframeEl.style.opacity = "0";
        iframeEl.style.pointerEvents = "none";
        iframeEl.style.position = "absolute";
        iframeEl.style.top = "0";
        iframeEl.style.right = "0";
        iframeEl.setAttribute("sandbox", "allow-scripts allow-popups allow-same-origin");
        iframeEl.src = `${this.walletLinkUrl}/#/bridge`;
        this.iframeEl = iframeEl;
        window.addEventListener("message", this.handleMessage, false);
        window.addEventListener("beforeunload", this.handleBeforeUnload, false);
        const onIframeLoad = () => {
            this.iframeLoaded = true;
            iframeEl.removeEventListener("load", onIframeLoad, false);
            this.postIPCMessage(SessionIdRequestMessage_1.SessionIdRequestMessage());
            this.actionsPendingIframeLoad.forEach(action => action());
            this.actionsPendingIframeLoad = [];
        };
        iframeEl.addEventListener("load", onIframeLoad, false);
        document.documentElement.appendChild(iframeEl);
    }
    getStorageItem(key) {
        return this.storage.getItem(key);
    }
    setStorageItem(key, value) {
        this.storage.setItem(key, value);
    }
    requestEthereumAccounts() {
        return this.sendRequest({
            method: Web3Method_1.Web3Method.requestEthereumAccounts,
            params: {
                appName: this.appName,
                appLogoUrl: this.appLogoUrl || null
            }
        });
    }
    signEthereumMessage(message, address, addPrefix, typedDataJson) {
        return this.sendRequest({
            method: Web3Method_1.Web3Method.signEthereumMessage,
            params: {
                message: util_1.hexStringFromBuffer(message, true),
                address,
                addPrefix,
                typedDataJson: typedDataJson || null
            }
        });
    }
    ethereumAddressFromSignedMessage(message, signature, addPrefix) {
        return this.sendRequest({
            method: Web3Method_1.Web3Method.ethereumAddressFromSignedMessage,
            params: {
                message: util_1.hexStringFromBuffer(message, true),
                signature: util_1.hexStringFromBuffer(signature, true),
                addPrefix
            }
        });
    }
    signEthereumTransaction(params) {
        return this.sendRequest({
            method: Web3Method_1.Web3Method.signEthereumTransaction,
            params: {
                fromAddress: params.fromAddress,
                toAddress: params.toAddress,
                weiValue: util_1.bigIntStringFromBN(params.weiValue),
                data: util_1.hexStringFromBuffer(params.data, true),
                nonce: params.nonce,
                gasPriceInWei: params.gasPriceInWei
                    ? util_1.bigIntStringFromBN(params.gasPriceInWei)
                    : null,
                gasLimit: params.gasLimit ? util_1.bigIntStringFromBN(params.gasLimit) : null,
                chainId: params.chainId,
                shouldSubmit: false
            }
        });
    }
    signAndSubmitEthereumTransaction(params) {
        return this.sendRequest({
            method: Web3Method_1.Web3Method.signEthereumTransaction,
            params: {
                fromAddress: params.fromAddress,
                toAddress: params.toAddress,
                weiValue: util_1.bigIntStringFromBN(params.weiValue),
                data: util_1.hexStringFromBuffer(params.data, true),
                nonce: params.nonce,
                gasPriceInWei: params.gasPriceInWei
                    ? util_1.bigIntStringFromBN(params.gasPriceInWei)
                    : null,
                gasLimit: params.gasLimit ? util_1.bigIntStringFromBN(params.gasLimit) : null,
                chainId: params.chainId,
                shouldSubmit: true
            }
        });
    }
    submitEthereumTransaction(signedTransaction, chainId) {
        return this.sendRequest({
            method: Web3Method_1.Web3Method.submitEthereumTransaction,
            params: {
                signedTransaction: util_1.hexStringFromBuffer(signedTransaction, true),
                chainId
            }
        });
    }
    scanQRCode(regExp) {
        return this.sendRequest({
            method: Web3Method_1.Web3Method.scanQRCode,
            params: { regExp }
        });
    }
    arbitraryRequest(data) {
        return this.sendRequest({
            method: Web3Method_1.Web3Method.arbitrary,
            params: { data }
        });
    }
    sendRequest(request) {
        if (this.localStorageBlocked) {
            walletLinkBlockedDialog.show();
            return Promise.reject(new Error(BLOCKED_LOCAL_STORAGE_ERROR_MESSAGE));
        }
        return new Promise((resolve, reject) => {
            if (!this.iframeEl || !this.iframeEl.contentWindow) {
                return reject("iframe is not initialized");
            }
            const id = crypto_1.default.randomBytes(8).toString("hex");
            const cancel = () => {
                this.postIPCMessage(Web3RequestCanceledMessage_1.Web3RequestCanceledMessage(id));
                this.invokeCallback(Web3ResponseMessage_1.Web3ResponseMessage({
                    id,
                    response: Web3Response_1.ErrorResponse(request.method, "User rejected request")
                }));
                if (notification) {
                    notification.hide();
                }
            };
            const reset = () => {
                this.openPopupWindow("/reset");
                if (notification) {
                    notification.hide();
                }
            };
            const options = {
                showProgressBar: true,
                autoExpandAfter: 10000,
                buttonInfo2: "Made a mistake?",
                buttonLabel2: "Cancel",
                onClickButton2: cancel
            };
            const isRequestAccounts = request.method === Web3Method_1.Web3Method.requestEthereumAccounts;
            if (!this.linked && isRequestAccounts) {
                const showPopup = () => {
                    this.openPopupWindow(`/link?id=${this.sessionId}`);
                };
                showPopup();
                options.message = "Requesting to connect to your wallet...";
                options.buttonInfo1 = "Don’t see the popup?";
                options.buttonLabel1 = "Show window";
                options.onClickButton1 = showPopup;
            }
            else {
                options.message = "Pushed a request to your wallet...";
                options.buttonInfo3 = "Not receiving requests?";
                options.buttonLabel3 = "Reconnect";
                options.onClickButton3 = reset;
            }
            if (isRequestAccounts) {
                WalletLinkRelay.accountRequestCallbackIds.add(id);
            }
            WalletLinkRelay.callbacks.set(id, response => {
                this.closePopupWindow();
                if (notification) {
                    notification.hide();
                }
                if (response.errorMessage) {
                    return reject(new Error(response.errorMessage));
                }
                resolve(response);
            });
            const notification = new WalletLinkNotification_1.WalletLinkNotification(options);
            notification.show();
            this.postIPCMessage(Web3RequestMessage_1.Web3RequestMessage({ id, request }));
        });
    }
    postIPCMessage(message) {
        if (!this.iframeLoaded) {
            this.actionsPendingIframeLoad.push(() => {
                this.postIPCMessage(message);
            });
            return;
        }
        if (this.iframeEl && this.iframeEl.contentWindow) {
            this.iframeEl.contentWindow.postMessage(message, this.walletLinkOrigin);
        }
    }
    openPopupWindow(path) {
        if (!this.sessionId) {
            this.actionsPendingSessionId.push(() => {
                this.openPopupWindow(path);
            });
            return;
        }
        const popupUrl = `${this.walletLinkUrl}/#${path}`;
        if (this.popupWindow && this.popupWindow.opener) {
            if (this.popupUrl !== popupUrl) {
                this.popupWindow.location.href = popupUrl;
                this.popupUrl = popupUrl;
            }
            this.popupWindow.focus();
            return;
        }
        const width = 320;
        const height = 520;
        const left = Math.floor(window.outerWidth / 2 - width / 2 + window.screenX);
        const top = Math.floor(window.outerHeight / 2 - height / 2 + window.screenY);
        this.popupUrl = popupUrl;
        this.popupWindow = window.open(popupUrl, "_blank", [
            `width=${width}`,
            `height=${height}`,
            `left=${left}`,
            `top=${top}`,
            "location=yes",
            "menubar=no",
            "resizable=no",
            "status=no",
            "titlebar=yes",
            "toolbar=no"
        ].join(","));
    }
    closePopupWindow() {
        if (this.popupWindow) {
            this.popupWindow.close();
            this.popupUrl = null;
            this.popupWindow = null;
        }
        window.focus();
    }
    invokeCallback(message) {
        const callback = WalletLinkRelay.callbacks.get(message.id);
        if (callback) {
            callback(message.response);
            WalletLinkRelay.callbacks.delete(message.id);
        }
    }
    resetAndReload() {
        this.storage.clear();
        document.location.reload();
    }
    handleMessage(evt) {
        if (evt.origin !== this.walletLinkOrigin) {
            return;
        }
        const message = evt.data;
        if (Web3ResponseMessage_1.isWeb3ResponseMessage(message)) {
            const { response } = message;
            if (Web3Response_1.isRequestEthereumAccountsResponse(response)) {
                Array.from(WalletLinkRelay.accountRequestCallbackIds.values()).forEach(id => this.invokeCallback(Object.assign({}, message, { id })));
                WalletLinkRelay.accountRequestCallbackIds.clear();
                return;
            }
            this.invokeCallback(message);
            return;
        }
        if (SessionIdResponseMessage_1.isSessionIdResponseMessage(message)) {
            const { sessionId } = message;
            if (this.sessionId !== null && this.sessionId !== sessionId) {
                // sessionId changed, clear all local data and reload page
                this.resetAndReload();
                return;
            }
            this.sessionId = sessionId;
            this.setStorageItem(LOCAL_STORAGE_SESSION_ID_KEY, sessionId);
            this.actionsPendingSessionId.forEach(action => action());
            this.actionsPendingSessionId = [];
            return;
        }
        if (LinkedMessage_1.isLinkedMessage(message)) {
            this.linked = true;
            return;
        }
        if (UnlinkedMessage_1.isUnlinkedMessage(message)) {
            this.linked = false;
            this.resetAndReload();
            return;
        }
        if (LocalStorageBlockedMessage_1.isLocalStorageBlockedMessage(message)) {
            this.localStorageBlocked = true;
            if (WalletLinkRelay.accountRequestCallbackIds.size > 0 &&
                this.popupWindow) {
                Array.from(WalletLinkRelay.accountRequestCallbackIds.values()).forEach(id => this.invokeCallback(Web3ResponseMessage_1.Web3ResponseMessage({
                    id,
                    response: Web3Response_1.ErrorResponse(Web3Method_1.Web3Method.requestEthereumAccounts, BLOCKED_LOCAL_STORAGE_ERROR_MESSAGE)
                })));
                WalletLinkRelay.accountRequestCallbackIds.clear();
                walletLinkBlockedDialog.show();
                this.closePopupWindow();
            }
            return;
        }
    }
    handleBeforeUnload(_evt) {
        this.closePopupWindow();
    }
}
WalletLinkRelay.callbacks = new Map();
WalletLinkRelay.accountRequestCallbackIds = new Set();
__decorate([
    bind_decorator_1.default
], WalletLinkRelay.prototype, "handleMessage", null);
__decorate([
    bind_decorator_1.default
], WalletLinkRelay.prototype, "handleBeforeUnload", null);
exports.WalletLinkRelay = WalletLinkRelay;
