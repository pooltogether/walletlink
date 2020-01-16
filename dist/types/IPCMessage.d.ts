export declare enum IPCMessageType {
    SESSION_ID_REQUEST = "SESSION_ID_REQUEST",
    SESSION_ID_RESPONSE = "SESSION_ID_RESPONSE",
    LINKED = "LINKED",
    UNLINKED = "UNLINKED",
    WEB3_REQUEST = "WEB3_REQUEST",
    WEB3_REQUEST_CANCELED = "WEB3_REQUEST_CANCELED",
    WEB3_RESPONSE = "WEB3_RESPONSE",
    LOCAL_STORAGE_BLOCKED = "LOCAL_STORAGE_BLOCKED"
}
export interface IPCMessage<T extends IPCMessageType = any> {
    type: T;
}
