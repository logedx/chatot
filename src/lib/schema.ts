import * as detective from './detective.js'




export type Builtin	= '_id'
					| 'created'
					| 'updated'
					| 'created_hex'
					| 'updated_hex'


export type Symbol
// eslint-disable-next-line @typescript-eslint/naming-convention
<S extends string, T> = { __type__: T, __symbol__: S }


// eslint-disable-next-line @typescript-eslint/no-namespace
export declare namespace Types
{
	export type Id = Symbol<'_id', string>

	// eslint-disable-next-line @typescript-eslint/no-shadow
	export type Keyword<T> = Symbol<'keyword', T>

	// eslint-disable-next-line @typescript-eslint/no-shadow
	export type Sensitive<T> = Symbol<'sensitive', T>

	export type Mixed = Symbol<'mixed', unknown>


	export type Ref<T> = Symbol<'ref', T>

	export type Quote<T> = Symbol<'quote', T>

	// eslint-disable-next-line @typescript-eslint/no-shadow
	export type Virtual<T> = Symbol<'virtual', T>

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	export type Field<S extends 'keyword' | 'sensitive' | 'quote' | 'virtual', T> = T extends Symbol<any, any>
		? Symbol<S | T['__symbol__'], T['__type__']>
		: Symbol<S, T>


	export type Range<T> = detective.Range<T>

	export type Between<T> = detective.Between<T>


	export type Document<T extends object> = T
		& {
			_id: Types.Id

			created: Date
			updated: Date

			created_hex: string
			updated_hex: string

			// eslint-disable-next-line @typescript-eslint/naming-convention
			__v: number

		}


}




export type Define<T extends object, V extends object> = Types.Document<
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	T & { [k in keyof V]: Types.Quote<any> extends V[k]
		? Types.Field<'quote' | 'virtual', V[k]>
		: Types.Virtual<V[k]> }

>


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Property<K, T> = Types.Virtual<any> extends T
	? never
	: Exclude<K, Builtin>


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Virtual<K, T> = Types.Virtual<any> extends T
	? K
	: never


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Keyword<K, T> = Types.Keyword<any> extends T
	? K
	: never


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Sensitive<K, T> = Types.Sensitive<any> extends T
	? K
	: never



// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Unpack<T> = T extends Types.Ref<any>
	? string
	: T extends Types.Mixed
		? unknown
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		: T extends Types.Quote<any>
			? { [k in keyof T['__type__']]: Unpack<T['__type__'][k]> }
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			: T extends Symbol<any, any>
				? Unpack<T['__type__']>
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				: T extends any[]
					? Array<Unpack<T[number]> >
					: T






// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Probe<T extends Define<any, any> > = keyof {
	[k in keyof T as Keyword<k, T[k]>]: k

}


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Stealthily<T extends Define<any, any> > = keyof {
	[k in keyof T as Sensitive<k, T[k]>]: k

}


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Dryness<T extends Define<any, any> > = {
	[k in keyof T as Property<k, T[k]>]: Unpack<T[k]>

}


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Explore<T extends Define<any, any> > = {
	[k in keyof T as Virtual<k, T[k]>]: Unpack<T[k]>

}


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Deliquesce<T extends Define<any, any> > = {
	[k in keyof T]: Unpack<T[k]>

}


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Leakage<T extends Define<any, any>, K extends Stealthily<T> > = {
	[k in K]: Unpack<T[k]>

}
