import mongoose from 'mongoose'

import * as detective from './detective.js'
import * as structure from './structure.js'




// eslint-disable-next-line @typescript-eslint/no-namespace
export declare namespace Types
{
	export type ObjectId = mongoose.Types.ObjectId

	export type Buffer = mongoose.Types.Buffer

	export type Array<T> = mongoose.Types.DocumentArray<T>


	// eslint-disable-next-line @typescript-eslint/naming-convention
	export type Ref<T> = ObjectId & { __ref__: T }

	// eslint-disable-next-line @typescript-eslint/naming-convention
	export type Keyword<T> = T & { __symbol__: 'keyword' }


	export type Sensitive<T> = __Sensitive__<T>




	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	export type Document<T extends Record<string, any> > = { _id: ObjectId } & Unpack<T>

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	export type HydratedDocument<T extends Record<string, any> > = Document<T>
		& {
			updated: Date
			created: Date

		}


}



export type Define
<
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	D extends Record<string, any>,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	V extends Record<string, any>,

	H extends Types.HydratedDocument<D> = Types.HydratedDocument<D>,

>
	= {
		// eslint-disable-next-line @typescript-eslint/naming-convention
		D: D
		// eslint-disable-next-line @typescript-eslint/naming-convention
		V: {
			[K in keyof V]-?: V[K] extends Exclude<V[K], undefined>
				? V[K]
				: unknown;

		}
		// eslint-disable-next-line @typescript-eslint/naming-convention
		H: H

		// eslint-disable-next-line @typescript-eslint/naming-convention
		HydratedDocument: keyof structure.GetRequired<V> extends never
			? H
			: H & structure.GetRequired<V>


		// eslint-disable-next-line @typescript-eslint/naming-convention
		Keywords: keyof structure.Beautify<
			{
				[k in keyof D]: D[k] extends Types.Keyword<infer U>
					? U
					: never

			}

		>

		// eslint-disable-next-line @typescript-eslint/naming-convention
		PopulatePaths: structure.Beautify<
			keyof structure.GetRequired<V> extends never
				? { [k in keyof D]: Explore<D[k]> }
				: { [k in keyof D]: Explore<D[k]> } & Required< structure.GetPartial<V> >

		>


	}


export type Explore<T> = T extends Types.Ref<infer U>
	? U
	: T extends unknown[]
		? Array< Explore<T[number]> >
		: T extends Record<string, unknown>
			? { [P in keyof T]: Explore<T[P]> }
			: never


export type Unpack<T> = T extends Types.Ref<unknown>
	? Types.ObjectId
	: T extends Types.Keyword<infer U>
		? U
		: T extends unknown[]
			? Array< Unpack<T[number]> >
			: T extends Record<string, unknown>
				? { [K in keyof T]: Unpack<T[K]> }
				: T


export type Disclose<T> = T extends Sensitive<infer U>
	? U
	: T extends Types.Keyword< Sensitive<infer U> >
		? Types.Keyword<U>
		: T extends unknown[]
			? Array< Disclose<T[number]> >
			: T extends Record<string, unknown>
				? { [K in keyof T]: Disclose<T[K]> }
				: T


export type Probe<T> = structure.Beautify<
	{
		[K in keyof T]: T[K] extends Types.Sensitive<unknown>
			? T[K]
			: T[K] extends unknown[]
				? Array< Probe<T[K][number]> >
				: T[K] extends Record<string, unknown>
					? { [P in keyof T[K]]: Probe<T[K][P]> }
					: never
	}

>


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Leakage<T extends Define<any, any>, K extends keyof Probe<T['HydratedDocument']> >
	= structure.Override<
		T['HydratedDocument'],

		{ [P in K]: Disclose<T['HydratedDocument'][P]> }

	>


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Exposure<T extends Define<any, any> > = Disclose<T['HydratedDocument']>


export type Populate
<
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	T extends Define<any, any>,

	K extends keyof T['PopulatePaths'],

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	O extends Record<string, any> = Record<string, any>,

>
	= structure.Override<
		T['HydratedDocument'],

		structure.Override<
			Pick<T['PopulatePaths'], K>,

			O

		>

	>


export type PopulatePaths
<
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	T extends Define<any, any>,

	K extends keyof T['PopulatePaths'],

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	O extends Record<string, any> = Record<string, any>,

>
	= structure.Override<
		T['PopulatePaths'],

		structure.Override<
			Pick<T['PopulatePaths'], K>,

			O

		>

	>


export type Expel
<
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	T extends Define<any, any>,

	D extends keyof T['D'],
	V extends keyof T['V'],

>
	= Define<
		Omit<T['D'], D>,
		Omit<T['V'], V>

	>


export type Override
<
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	T extends Define<any, any>,

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	D extends Record<string, any>,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type
	V extends Record<string, any> = {},

>
	= Define<
		structure.Override<T['D'], D>,
		structure.Override<T['V'], V>

	>


// eslint-disable-next-line @typescript-eslint/naming-convention
export type __Sensitive__<T> = Sensitive<T>

export class Sensitive<T>
{
	#value: T

	get value (): T
	{
		return this.#value

	}

	constructor (value: T)
	{
		if (detective.is_string(value) )
		{
			value = value.trim() as T

		}

		this.#value = value

	}

	// eslint-disable-next-line @typescript-eslint/naming-convention
	valueOf (): this
	{
		return this

	}

	// eslint-disable-next-line @typescript-eslint/naming-convention
	toBSON (): T
	{
		return this.#value

	}

	// eslint-disable-next-line @typescript-eslint/naming-convention
	toJSON (): undefined
	{
		return undefined

	}

	// eslint-disable-next-line @typescript-eslint/naming-convention
	toString (): ''
	{
		return ''

	}

	[Symbol.toPrimitive] (): undefined
	{
		return undefined

	}

	[Symbol.toStringTag] ():string
	{
		return '[object Sensitive]'

	}

	unwrap (): T
	{
		return this.#value

	}

	confuse (visible_length = 4): string
	{
		if (detective.is_empty(this.#value) )
		{
			return ''

		}

		let text = String(this.#value)

		let length = Math.max(0, text.length - visible_length)

		if (length > 0)
		{
			return `${''.padStart(length, '*')}${text.slice(0 - visible_length)}`

		}

		return ''.padStart(visible_length, '*')

	}


}


