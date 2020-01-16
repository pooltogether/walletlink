"use strict";
// Copyright (c) 2018-2019 Coinbase, Inc. <https://coinbase.com/>
// Licensed under the Apache License, version 2.0
Object.defineProperty(exports, "__esModule", { value: true });
const IPCMessage_1 = require("./IPCMessage");
function isSessionIdResponseMessage(msg) {
    return msg && msg.type === IPCMessage_1.IPCMessageType.SESSION_ID_RESPONSE;
}
exports.isSessionIdResponseMessage = isSessionIdResponseMessage;
