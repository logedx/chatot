import config from 'config'

import mongoose, { Types, SchemaType, HydratedDocumentFromSchema } from 'mongoose'


import * as schema from '../lib/schema.js'
import * as detective from '../lib/detective.js'




const mongodb_uri = config.get<string>('mongodb')


mongoose.plugin(
	function (schema_)
	{
		schema_.set(
			'toJSON',

			{
				virtuals  : true,
				minimize  : false,
				// eslint-disable-next-line @typescript-eslint/naming-convention
				versionKey: false,

			},

		)

		schema_.set(
			'toObject',

			{
				virtuals  : true,
				minimize  : false,
				// eslint-disable-next-line @typescript-eslint/naming-convention
				versionKey: false,

			},

		)

		schema_.set(
			'timestamps',

			{
				// eslint-disable-next-line @typescript-eslint/naming-convention
				updatedAt: 'updated',
				// eslint-disable-next-line @typescript-eslint/naming-convention
				createdAt: 'created',

			},

		)

		schema_.virtual('updated_hex').get(
			function (): string
			{
				if (this.updated instanceof Date)
				{
					let value = this.updated.valueOf()

					return value.toString(16)

				}

				return ''

			},

		)

		schema_.virtual('created_hex').get(
			function (): string
			{
				if (this.created instanceof Date)
				{
					let value = this.created.valueOf()

					return value.toString(16)

				}

				return ''

			},

		)


	},

)


export class Mongodb
{
	static #cache: Record<string, typeof mongoose> = {}

	static async new (uri: string): Promise<typeof mongoose>
	{
		if (detective.is_empty(this.#cache[uri]) )
		{
			this.#cache[uri] = await mongoose.connect(mongodb_uri)

		}

		return this.#cache[uri]

	}

	static async default (): Promise<typeof mongoose>
	{
		return this.new(mongodb_uri)

	}


}




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

	update (value: T): void
	{
		this.#value = value

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


// eslint-disable-next-line @typescript-eslint/no-explicit-any
class SensitiveSchemaType<T = any, DocType = any> extends SchemaType<T, DocType>
{
	/** This schema type's name, to defend against minifiers that mangle function names. */
	// eslint-disable-next-line @typescript-eslint/naming-convention
	static schemaName: 'Sensitive'

	constructor (_path: string, option?: object)
	{
		super(_path, option, 'Sensitive')

	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	cast (value: unknown, _doc?: unknown, init?: boolean): any
	{
		if (init === true)
		{
			return new Sensitive(value)

		}

		if (value instanceof Sensitive)
		{
			return value.unwrap()

		}

		if (detective.is_string(value) )
		{
			return value.trim()

		}

		return value

	}

	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-explicit-any
	castForQuery (_: unknown, value: unknown): any
	{
		if (value instanceof Sensitive)
		{
			return value.unwrap()

		}

		if (detective.is_string(value) )
		{
			return value.trim()

		}

		return value

	}

}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
mongoose.Schema.Types.Sensitive = SensitiveSchemaType




export type ObjectId = Types.ObjectId

export type { Types, Define, Probe, Stealthily } from '../lib/schema.js'




// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Unpack<T> = T extends schema.Types.Ref<any>
	? ObjectId
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	: schema.Types.Sensitive<any> extends T
		? Sensitive<schema.Unpack<T> >
		: T extends schema.Types.Mixed
			? unknown
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			: T extends schema.Types.Quote<any>
				? { [k in keyof T['__type__']]: Unpack<T['__type__'][k]> }
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				: T extends schema.Symbol<any, any>
					? Unpack<T['__type__']>
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					: T extends any[]
						? Array<Unpack<T[number]> >
						: T


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Hollow<T> = T extends schema.Types.Ref<any>
	? ObjectId
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	: T extends schema.Symbol<any, any>
		? Hollow<T['__type__']>
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		: T extends any[]
			? Array<Hollow<T[number]> >
			: T


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Dryness<T extends schema.Define<any, any> > = {
	[k in keyof T as schema.Property<k, T[k]>]: Unpack<T[k]>

}


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Explore<T extends schema.Define<any, any> > = {
	[k in keyof T as schema.Virtual<k, T[k]>]: undefined extends T[k]
		? unknown
		: Unpack<T[k]>

}


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Deliquesce<T extends schema.Define<any, any> > = {
	[k in keyof T]: k extends '_id' ? ObjectId : Hollow<T[k]>

}


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Leakage<T extends schema.Define<any, any>, K extends schema.Stealthily<T> > = {
	[k in K]: Unpack<T[k]>

}



export type Schema
<
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	T extends schema.Define<any, any>,

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	I extends Record<string, (...args: any[]) => any>,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	S extends Record<string, (...args: any[]) => any>,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type
	Q extends Record<string, (...args: any[]) => any> = {},

>
	= mongoose.Schema<
		Dryness<T>,
		mongoose.Model<Dryness<T>, Q, I, Explore<T> >,
		I,
		Q,
		Explore<T>,
		S

	>


export type Document<S extends mongoose.Schema>	= HydratedDocumentFromSchema<S>
