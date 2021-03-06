"use strict";
// Copyright (c) 2018-2019 Coinbase, Inc. <https://coinbase.com/>
// Licensed under the Apache License, version 2.0
Object.defineProperty(exports, "__esModule", { value: true });
const Web3Method_1 = require("./Web3Method");
function ErrorResponse(method, errorMessage) {
    return { method, errorMessage };
}
exports.ErrorResponse = ErrorResponse;
function RequestEthereumAccountsResponse(addresses) {
    return { method: Web3Method_1.Web3Method.requestEthereumAccounts, result: addresses };
}
exports.RequestEthereumAccountsResponse = RequestEthereumAccountsResponse;
function isRequestEthereumAccountsResponse(res) {
    return res && res.method === Web3Method_1.Web3Method.requestEthereumAccounts;
}
exports.isRequestEthereumAccountsResponse = isRequestEthereumAccountsResponse;
