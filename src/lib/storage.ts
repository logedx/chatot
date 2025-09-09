import config from 'config'
import alioss from 'ali-oss'
import mongoose, { HydratedDocument, Query } from 'mongoose'

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





export type TExtendRawDocType = {
	updated: Date
	created: Date

	updated_hex: string
	created_hex: string

}

export type TRawDocType<T extends object = object> = T & TExtendRawDocType

export type TRawDocTypeOverwrite<T, U extends keyof T> = structure.Overwrite<
	T, { [k in U]-?: T[k] }

>

export type TInstanceMethods<T, M = unknown> = M & {
	select_sensitive_fields
	<
		F = keyof structure.GetPartial<T>,
		O = Pick<T, F & keyof T>,
		H = HydratedDocument<T, TInstanceMethods<T, M> >,

	>
	(...fields: Array<`+${F & string}`>)
	: Promise<
		structure.Overwrite<
			H,

			Required<O>

		>

	>

	select_every_fields
	<
		H = HydratedDocument<T, TInstanceMethods<T, M> >,

	>
	()
	: Promise<
		Required<H>

	>

}

export type TStaticMethods<T, M = unknown> = M & {
	select_every_fields(): Array<`+${keyof T & string}`>

}


export async function mongodb (): Promise<typeof mongoose>
{
	if (connect.mongodb)
	{
		return connect.mongodb

	}


	mongoose.plugin(
		function (schema): void
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

				function
				(
					this: HydratedDocument<
						unknown,

						{
							select_sensitive_fields(...fields: string[]): Query<unknown, unknown>

						}

					>,

				)
				{
					let fields = Object.entries(this.schema.paths)
						.map(
							([k]) => `+${k}`,

						)

					return this.select_sensitive_fields(...fields)

				},

			)

			schema.static(
				'select_every_fields',

				function ()
				{
					return Object.entries(this.schema.paths)
						.map(
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
