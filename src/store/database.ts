import config from 'config'

import mongoose, { SchemaType, InferHydratedDocTypeFromSchema } from 'mongoose'


import * as model from '../lib/model.js'
import * as detective from '../lib/detective.js'




const mongodb_uri = config.get<string>('mongodb')


mongoose.plugin(
	function (schema)
	{
		schema.set(
			'toJSON',

			{
				virtuals  : true,
				minimize  : false,
				// eslint-disable-next-line @typescript-eslint/naming-convention
				versionKey: false,

			},

		)

		schema.set(
			'toObject',

			{
				virtuals  : true,
				minimize  : false,
				// eslint-disable-next-line @typescript-eslint/naming-convention
				versionKey: false,

			},

		)

		schema.set(
			'timestamps',

			{
				// eslint-disable-next-line @typescript-eslint/naming-convention
				updatedAt: 'updated',
				// eslint-disable-next-line @typescript-eslint/naming-convention
				createdAt: 'created',

			},

		)

		schema.virtual('updated_hex').get(
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

		schema.virtual('created_hex').get(
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
			return new model.Sensitive(value)

		}

		if (value instanceof model.Sensitive)
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
	castForQuery (value: unknown): any
	{
		if (value instanceof model.Sensitive)
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


export type Schema
<
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	T extends model.Define<any, any>,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	I extends Record<string, (...args: any[]) => any>,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	S extends Record<string, (...args: any[]) => any>,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type
	Q extends Record<string, (...args: any[]) => any> = {},

>
	= mongoose.Schema<
		T['H'],
		mongoose.Model<T['H'], Q, I, T['V']>,
		I,
		Q,
		T['V'],
		S

	>


export type HydratedDocument<T extends mongoose.Schema > = T extends mongoose.Schema<infer D>
	? InferHydratedDocTypeFromSchema<T> & D
	: never
