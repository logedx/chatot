import config from 'config'
import alioss from 'ali-oss'
import mongoose, { Types, Schema, Model, HydratedDocument } from 'mongoose'

import * as reply from './reply.js'
import * as structure from './structure.js'




type Connect = {
	ali_oss: null | alioss
	mongodb: null | typeof mongoose

}

const connect: Connect = { ali_oss: null, mongodb: null }


const mongodb_uri = config.get<string>('mongodb')

const aliopen_endpoint = config.get<string>('aliopen.endpoint')
const aliopen_access_key_id = config.get<string>('aliopen.access_key_id')
const aliopen_access_key_secret = config.get<string>('aliopen.secret_access_key')





export type TDocType<T extends object = object> = T
	& {
		updated: Date
		created: Date

		updated_hex: string
		created_hex: string

	}

export type TDocTypeOverwrite<T, U extends keyof T> = structure.Overwrite<
	T,

	{ [k in U]-?: T[k] }

>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TDocTypeSensitiveSelector<T extends Record<string, any>, E extends string = 'id' | 'baseModelName' | 'errors'> = {
	[k in keyof T]: T[k] extends Types.Array<infer U>
		? U extends object
			? `+${k & string}.${keyof structure.GetPartial<Omit<U, E> > & string}`
			: never

		: T[k] extends object
			? `+${k & string}.${keyof structure.GetPartial<Omit<T[k], E> > & string}`
			: never


}




export type TInstanceMethods
<
	// eslint-disable-next-line @typescript-eslint/no-empty-object-type
	T extends {},
	// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type
	V extends Record<string, any> = {},
	// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type
	I extends Record<string, (...args: any[]) => any> = {},
	// eslint-disable-next-line @typescript-eslint/no-empty-object-type
	Q extends object = {},

>
// eslint-disable-next-line @stylistic/operator-linebreak
=
{
	[k in keyof I]: (this: THydratedDocument<T, V, I, Q>, ...args: Parameters<I[k]>) => ReturnType<I[k]>

}
& {
	select_sensitive_fields
	<F extends keyof structure.GetPartial<T> >
	(this: THydratedDocument<T, V, I, Q>, ...fields: Array<`+${F}`>):
	Promise<
		structure.Overwrite<
			THydratedDocument<T, V, I, Q>,

			Required<Pick<T, F> >

		>

	>

	select_sensitive_fields
	<U extends TDocTypeSensitiveSelector<T> = TDocTypeSensitiveSelector<T> >
	(this: THydratedDocument<T, V, I, Q>, ...fileds: Array<U[keyof U]>): Promise<THydratedDocument<T, V, I, Q>>

	select_every_fields ():
	Promise<
		Required< THydratedDocument<T, V, I, Q> >

	>

}


export type TStaticMethods
<
	// eslint-disable-next-line @typescript-eslint/no-empty-object-type
	T extends {},
	// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type
	V extends Record<string, any> = {},
	// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type
	I extends Record<string, (...args: any[]) => any> = {},
	// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type
	S extends Record<string, (...args: any[]) => any> = {},
	// eslint-disable-next-line @typescript-eslint/no-empty-object-type
	Q extends object = {},

>
// eslint-disable-next-line @stylistic/operator-linebreak
=
{
	[k in keyof S]: (this: TTModel<T, V, I, S, Q>, ...args: Parameters<S[k]>) => ReturnType<S[k]>

}
& {
	select_every_fields(this: TTModel<T, V, I, S, Q>): Array<`+${keyof T & string}`>

}



export type THydratedDocument
<
	// eslint-disable-next-line @typescript-eslint/no-empty-object-type
	T extends {},
	// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type
	V extends Record<string, any> = {},
	// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type
	I extends Record<string, (...args: any[]) => any> = {},
	// eslint-disable-next-line @typescript-eslint/no-empty-object-type
	Q extends object = {},

>
// eslint-disable-next-line @stylistic/operator-linebreak
=
HydratedDocument<
	TDocType<T>,
	V & TInstanceMethods<T, V, I, Q>,
	Q,
	V

>


export type TSchema
<
	// eslint-disable-next-line @typescript-eslint/no-empty-object-type
	T extends {},
	// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type
	V extends Record<string, any> = {},
	// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type
	I extends Record<string, (...args: any[]) => any> = {},
	// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type
	S extends Record<string, (...args: any[]) => any> = {},
	// eslint-disable-next-line @typescript-eslint/no-empty-object-type
	Q extends object = {},

>
// eslint-disable-next-line @stylistic/operator-linebreak
=
Schema<
	TDocType<T>,
	TModel<T, V, I, S, Q>,
	TInstanceMethods<T, V, I, Q>,
	Q,
	V,
	TStaticMethods<T, V, I, S, Q>

>


export type TModel
<
	// eslint-disable-next-line @typescript-eslint/no-empty-object-type
	T extends {},
	// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type
	V extends Record<string, any> = {},
	// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type
	I extends Record<string, (...args: any[]) => any> = {},
	// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type
	S extends Record<string, (...args: any[]) => any> = {},
	// eslint-disable-next-line @typescript-eslint/no-empty-object-type
	Q extends object = {},


>
// eslint-disable-next-line @stylistic/operator-linebreak
=
Model<
	TDocType<T>,
	Q,
	TInstanceMethods<T, V, I, Q>,
	V,
	THydratedDocument<T, V, I, Q>,
	TSchema<T, V, I, S, Q>

>


export type TTModel
<
	// eslint-disable-next-line @typescript-eslint/no-empty-object-type
	T extends {},
	// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type
	V extends Record<string, any> = {},
	// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type
	I extends Record<string, (...args: any[]) => any> = {},
	// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type
	S extends Record<string, (...args: any[]) => any> = {},
	// eslint-disable-next-line @typescript-eslint/no-empty-object-type
	Q extends object = {},


>
// eslint-disable-next-line @stylistic/operator-linebreak
=
TModel<T, V, I, S, Q> & TStaticMethods<T, V, I, S, Q>


export type Tm
<
	// eslint-disable-next-line @typescript-eslint/no-empty-object-type
	T extends {},
	// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type
	V extends Record<string, any> = {},
	// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type
	I extends Record<string, (...args: any[]) => any> = {},
	// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type
	S extends Record<string, (...args: any[]) => any> = {},
	// eslint-disable-next-line @typescript-eslint/no-empty-object-type
	Q extends object = {},

>
// eslint-disable-next-line @stylistic/operator-linebreak
=
{
	// eslint-disable-next-line @typescript-eslint/naming-convention
	DocType         : TDocType<T>
	// eslint-disable-next-line @typescript-eslint/naming-convention
	HydratedDocument: THydratedDocument<T, V, I, Q>
	// eslint-disable-next-line @typescript-eslint/naming-convention
	Model           : TTModel<T, V, I, S, Q>

	// eslint-disable-next-line @typescript-eslint/naming-convention
	TVirtuals       : V
	// eslint-disable-next-line @typescript-eslint/naming-convention
	TQueryHelpers   : Q
	// eslint-disable-next-line @typescript-eslint/naming-convention
	TInstanceMethods: TInstanceMethods<T, V, I, Q>
	// eslint-disable-next-line @typescript-eslint/naming-convention
	TStaticMethods  : TStaticMethods<T, V, I, S, Q>
	// eslint-disable-next-line @typescript-eslint/naming-convention
	TSchema         : TSchema<T, V, I, S, Q>
	// eslint-disable-next-line @typescript-eslint/naming-convention
	TModel          : TModel<T, V, I, S, Q>


}


export async function mongodb (): Promise<typeof mongoose>
{
	if (connect.mongodb)
	{
		return connect.mongodb

	}


	mongoose.plugin(
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-expect-error
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		function (schema: TSchema<any>): void
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

			schema.method(
				'select_sensitive_fields',

				function (...fields: Array<`+${string}`>)
				{
					return this.model().findById(this._id)
						.select(fields)

				},

			)

			schema.method(
				'select_every_fields',

				function ()
				{
					let fields = Object.entries(this.schema.paths)
						.map(
							([k]) => `+${k}`,

						)

					// eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
					return this.select_sensitive_fields(...fields as any[])

				},

			)

			schema.static(
				'select_every_fields',

				function ()
				{
					// eslint-disable-next-line @typescript-eslint/no-unsafe-return
					return Object.entries(this.schema.paths)
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						.map<any>(
							([k]) => `+${k}`,

						)

				},

			)



		},

	)

	connect.mongodb = await mongoose.connect(mongodb_uri)


	return connect.mongodb

}


export type Store = 'alioss'

export function store (name: 'alioss'): alioss

export function store (name: Store): alioss
{
	if (name === 'alioss')
	{
		// eslint-disable-next-line new-cap
		connect.ali_oss ??= new alioss(
			{
				secure: true,
				region: `oss-${aliopen_endpoint}`,

				// eslint-disable-next-line @typescript-eslint/naming-convention
				accessKeyId: aliopen_access_key_id,

				// eslint-disable-next-line @typescript-eslint/naming-convention
				accessKeySecret: aliopen_access_key_secret,

			},

		)


		return connect.ali_oss

	}

	throw new reply.BadRequest('unknown store')

}


export class ImageStore
{
	#name: Store
	#src : string

	static #marked = 'x-image-store'


	get src (): string
	{
		return this.#src

	}


	constructor (name: Store, src: string)
	{
		this.#name = name
		this.#src = src

	}


	process (option: Record<string, number | string>): string
	{
		let uri = new URL(this.#src)

		if (this.#name === 'alioss')
		{
			let process = [
				'image',

				...Object.entries(option).map( ([k, v]) => `${k},${v}`),

			]

			if (connect.ali_oss)
			{
				uri.search = ''

				uri.href = connect.ali_oss
					.signatureUrl(
						uri.pathname, { process: process.join('/') },

					)

			}

		}

		return uri.href

	}

	resize (width: number, height: number): string
	{
		return this.process(
			{ resize: `w_${width},h_${height}` },

		)

	}

	rotate (angle: number): string
	{
		angle = Math.round(angle) % 360

		while (0 > angle)
		{
			angle = 360 + angle

		}


		return this.process(
			{ rotate: angle },

		)

	}

	static is_store (v: unknown): v is Store
	{
		return ['alioss'].includes(v as string)

	}

	// eslint-disable-next-line @typescript-eslint/no-shadow
	static signature (store: Store, src: string): URL
	{
		let uri = new URL(src)

		uri.searchParams.append(this.#marked, store)

		return uri

	}

	static from (url: URL): ImageStore
	{
		let name = url.searchParams.get(this.#marked)

		if (this.is_store(name) )
		{
			return new ImageStore(name, url.href)

		}

		throw new reply.BadRequest('invalid image store url')

	}

}
