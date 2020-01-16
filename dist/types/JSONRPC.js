"use strict";
// Copyright (c) 2018-2019 Coinbase, Inc. <https://coinbase.com/>
// Licensed under the Apache License, version 2.0
Object.defineProperty(exports, "__esModule", { value: true });
var JSONRPCMethod;
(function (JSONRPCMethod) {
    // synchronous or asynchronous
    JSONRPCMethod["eth_accounts"] = "eth_accounts";
    JSONRPCMethod["eth_coinbase"] = "eth_coinbase";
    JSONRPCMethod["net_version"] = "net_version";
    JSONRPCMethod["eth_uninstallFilter"] = "eth_uninstallFilter";
    // asynchronous only
    JSONRPCMethod["eth_requestAccounts"] = "eth_requestAccounts";
    JSONRPCMethod["eth_sign"] = "eth_sign";
    JSONRPCMethod["eth_ecRecover"] = "eth_ecRecover";
    JSONRPCMethod["personal_sign"] = "personal_sign";
    JSONRPCMethod["personal_ecRecover"] = "personal_ecRecover";
    JSONRPCMethod["eth_signTransaction"] = "eth_signTransaction";
    JSONRPCMethod["eth_sendRawTransaction"] = "eth_sendRawTransaction";
    JSONRPCMethod["eth_sendTransaction"] = "eth_sendTransaction";
    JSONRPCMethod["eth_signTypedData_v1"] = "eth_signTypedData_v1";
    JSONRPCMethod["eth_signTypedData_v2"] = "eth_signTypedData_v2";
    JSONRPCMethod["eth_signTypedData_v3"] = "eth_signTypedData_v3";
    JSONRPCMethod["eth_signTypedData_v4"] = "eth_signTypedData_v4";
    JSONRPCMethod["eth_signTypedData"] = "eth_signTypedData";
    JSONRPCMethod["walletlink_arbitrary"] = "walletlink_arbitrary";
    // asynchronous filter methods
    JSONRPCMethod["eth_newFilter"] = "eth_newFilter";
    JSONRPCMethod["eth_newBlockFilter"] = "eth_newBlockFilter";
    JSONRPCMethod["eth_newPendingTransactionFilter"] = "eth_newPendingTransactionFilter";
    JSONRPCMethod["eth_getFilterChanges"] = "eth_getFilterChanges";
    JSONRPCMethod["eth_getFilterLogs"] = "eth_getFilterLogs";
})(JSONRPCMethod = exports.JSONRPCMethod || (exports.JSONRPCMethod = {}));
