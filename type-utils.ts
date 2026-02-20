//#region Simple types

type Not<B extends boolean> = B extends true ? false : true
type Prettify<T extends object> = {[k in keyof T]: T[k]} & {}
type NonEmptyArrayOf<T> = [T, ...T[]]
type StringWithHints<HINTS> = HINTS | (string & {})
type Conditional<T, CHECK, YES, NO> = T extends CHECK ? YES : NO
type Flip<T extends Record<PropertyKey, PropertyKey>> = {[k in keyof T as T[k]]: k}

type RequireProperties<OBJ extends object, KEYS extends keyof OBJ> = Required<Pick<OBJ, KEYS>> & Omit<OBJ, KEYS>
type PartialProperties<OBJ extends object, KEYS extends keyof OBJ> = Partial<Pick<OBJ, KEYS>> & Omit<OBJ, KEYS>
type ReadonlyProperties<OBJ extends object, KEYS extends keyof OBJ> = Readonly<Pick<OBJ, KEYS>> & Omit<OBJ, KEYS>

//#region String utils

type JoinStrings<S extends string[], SEP extends string = ",", ACC extends string = "">
  = S extends [string, ...infer REST extends string[]] ?
    JoinStrings<REST, SEP, `${ACC}${SEP}${S[0]}`> : `${ACC}${SEP}${S[0]}` extends `,${infer JOINED extends string},undefined` ? JOINED : never

//#region Union utils

type IntersectUnion<UNION> = (UNION extends any ? (_: UNION) => never : never) extends ((_: infer INFERRED) => never) ? INFERRED : never
type IsUnion<T> = [T] extends [IntersectUnion<T>] ? false : true

type PopUnion<U> = IntersectUnion<
  U extends any ? (f: U) => void : never
> extends (a: infer A) => void ? A : never
type PopStringUnion<U> = IntersectUnion<
  U extends any ? (f: U) => void : never
> extends (a: infer A extends string) => void ? A : never

type UnionToArray<T, A extends unknown[] = []> = IsUnion<T> extends true
  ? UnionToArray<Exclude<T, PopUnion<T>>, [PopUnion<T>, ...A]>
  : [T, ...A]
type StringUnionToArray<T, A extends string[] = []> = IsUnion<T> extends true
  ? StringUnionToArray<Exclude<T, PopStringUnion<T>>, [PopStringUnion<T>, ...A]>
  : [T, ...A]

//#region Injection / Bijection

type IsInjection<T extends Record<PropertyKey, PropertyKey>> = Not<{[k in keyof Flip<T>]: IsUnion<Flip<T>[k]>}[keyof Flip<T>]>
type Bijectable<T extends Record<PropertyKey, PropertyKey>> = IsInjection<T> extends true ? T : never

const toBijection = <MAP extends Record<PropertyKey, PropertyKey>>(base: Bijectable<MAP>) => ({
  ...base,
  ...Object.fromEntries(Object.entries(base).map(([x,y]) => [y,x]))
}) as unknown as Prettify<MAP & Flip<MAP>>

//#region JSON Stringify

type __JsonQuote<S extends string> = `'${S}'`

type __JsonPrimitive = string | number | boolean | null
type __JsonValue =  __JsonPrimitive | __JsonRecord | __JsonArray
interface __JsonRecord extends Record<string | number, __JsonValue | undefined> {}
type __JsonArr = ReadonlyArray<__JsonValue>
interface __JsonArray extends __JsonArr {}

type __StringifyPrimitive<P extends __JsonPrimitive> = P extends string ? __JsonQuote<P> : `${P}`
type __StringifyUnion<U extends string, PRE extends string, POST extends string> = `${PRE}${JoinStrings<StringUnionToArray<U>>}${POST}`
type __StringifyKeyValuePair<KEY extends string | number, VALUE extends __JsonValue | undefined> = VALUE extends __JsonValue ? `${__StringifyPrimitive<KEY>}:${Stringify<VALUE>}` : ""
type __StringifyRecord<R extends __JsonRecord> = __StringifyUnion<Exclude<{[k in Exclude<keyof R, symbol>]: __StringifyKeyValuePair<k, R[k]>}[Exclude<keyof R, symbol>], "">, "{", "}">
type __StringifyArray<A extends __JsonArr> = `[${JoinStrings<[...{[v in keyof A]: `${Stringify<A[v]>}`}]>}]`

type Stringify<J extends __JsonValue> =
  J extends __JsonPrimitive ? __StringifyPrimitive<J> :
    J extends __JsonRecord ? __StringifyRecord<J> :
      J extends __JsonArr ? __StringifyArray<J> :
        never

//#endregion