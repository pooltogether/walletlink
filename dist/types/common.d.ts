interface Tag<T extends string, RealType> {
    __tag__: T;
    __realType__: RealType;
}
export declare type OpaqueType<T extends string, U> = U & Tag<T, U>;
export declare function OpaqueType<T extends Tag<any, any>>(): (value: T extends Tag<any, infer U> ? U : never) => T;
export declare type HexString = OpaqueType<"HexString", string>;
export declare const HexString: (value: string) => OpaqueType<"HexString", string>;
export declare type AddressString = OpaqueType<"AddressString", string>;
export declare const AddressString: (value: string) => OpaqueType<"AddressString", string>;
export declare type IdNumber = OpaqueType<"IdNumber", number>;
export declare const IdNumber: (value: number) => OpaqueType<"IdNumber", number>;
export declare type BigIntString = OpaqueType<"BigIntString", string>;
export declare const BigIntString: (value: string) => OpaqueType<"BigIntString", string>;
export declare type IntNumber = OpaqueType<"IntNumber", number>;
export declare const IntNumber: (value: number) => OpaqueType<"IntNumber", number>;
export declare type RegExpString = OpaqueType<"RegExpString", string>;
export declare const RegExpString: (value: string) => OpaqueType<"RegExpString", string>;
export declare type Callback<T> = (err: Error | null, result: T | null) => void;
export {};
