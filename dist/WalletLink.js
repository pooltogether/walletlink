"use strict";
// Copyright (c) 2018-2019 Coinbase, Inc. <https://coinbase.com/>
// Licensed under the Apache License, version 2.0
Object.defineProperty(exports, "__esModule", { value: true });
const WalletLinkNotification_1 = require("./WalletLinkNotification");
const WalletLinkProvider_1 = require("./WalletLinkProvider");
const WalletLinkRelay_1 = require("./WalletLinkRelay");
const WALLETLINK_URL = "https://www.walletlink.org";
const WALLETLINK_VERSION = process.env.WALLETLINK_VERSION ||
    require("../package.json").version ||
    "unknown";
class WalletLink {
    constructor(options) {
        this._appName = "";
        this._appLogoUrl = null;
        this._relay = new WalletLinkRelay_1.WalletLinkRelay({
            walletLinkUrl: WALLETLINK_URL
        });
        this.setAppInfo(options.appName, options.appLogoUrl);
        WalletLinkNotification_1.WalletLinkNotification.injectContainer();
        this._relay.injectIframe();
    }
    makeWeb3Provider(jsonRpcUrl, chainId = 1) {
        return new WalletLinkProvider_1.WalletLinkProvider({
            relay: this._relay,
            jsonRpcUrl,
            chainId
        });
    }
    setAppInfo(appName, appLogoUrl) {
        this._appName = appName || "DApp";
        this._appLogoUrl = appLogoUrl || getFavicon();
        this._relay.setAppInfo(this._appName, this._appLogoUrl);
    }
}
WalletLink.VERSION = WALLETLINK_VERSION;
exports.WalletLink = WalletLink;
function getFavicon() {
    const el = document.querySelector('link[sizes="192x192"]') ||
        document.querySelector('link[sizes="180x180"]') ||
        document.querySelector('link[rel="icon"]') ||
        document.querySelector('link[rel="shortcut icon"]');
    const { protocol, host } = document.location;
    const href = el ? el.getAttribute("href") : null;
    if (!href || href.startsWith("javascript:")) {
        return null;
    }
    if (href.startsWith("http://") ||
        href.startsWith("https://") ||
        href.startsWith("data:")) {
        return href;
    }
    if (href.startsWith("//")) {
        return protocol + href;
    }
    return `${protocol}//${host}${href}`;
}
