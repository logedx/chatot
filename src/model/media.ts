/**
 * 媒体模型
 */
import path from 'node:path'
import crypto from 'node:crypto'
import stream from 'node:stream'

import mime_types from 'mime-types'
import { Schema, Model, Types, SchemaType, HydratedDocument } from 'mongoose'

import * as reply from '../lib/reply.js'
import * as storage from '../lib/storage.js'
import * as detective from '../lib/detective.js'

import * as weapp_model from './weapp.js'




export type TRawDocType = storage.TRawDocType<
	{
		weapp: Types.ObjectId

		mime: string
		size: number

		store : storage.Store
		bucket: string
		folder: string

		src : string
		hash: string

		linker: Types.Array<
			{
				name : string
				model: string

			}

		>


	}

>

export type TPopulatePaths = {
	weapp: weapp_model.THydratedDocumentType

}

export type TVirtuals = {
	filename: string
	pathname: string

}

export type TQueryHelpers = object

export type TInstanceMethods = {
	seize(this: THydratedDocumentType): string

	safe_push(this: THydratedDocumentType, body: stream.Readable): Promise<THydratedDocumentType>

	safe_delete(this: THydratedDocumentType): Promise<void>

	safe_access(this: THydratedDocumentType, expires?: number): Promise<URL>

}

export type TStaticMethods = {
	safe_delete
	(this: TModel, weapp: Types.ObjectId, ...src: string[])
	: Promise<
		Array<
			PromiseSettledResult<void>

		>

	>

	safe_access
	(this: TModel, weapp: Types.ObjectId, src: string, expires?: number,): Promise<URL>

	safe_to_link
	(
		this: TModel,

		name: string,
		model: string,

		query: { hash: string } | { src: string }

	)
	: Promise<null | THydratedDocumentType>

}

export type THydratedDocumentType = HydratedDocument<TRawDocType, TVirtuals & TInstanceMethods>

export type TModel = Model<TRawDocType, TQueryHelpers, TInstanceMethods, TVirtuals>





const drive = await storage.mongodb()



export class Secret extends String
{
	// eslint-disable-next-line @typescript-eslint/naming-convention
	valueOf (): string
	{
		return super.valueOf()

	}

	// eslint-disable-next-line @typescript-eslint/naming-convention
	toBSON (): string
	{
		return super.valueOf()

	}

	// eslint-disable-next-line @typescript-eslint/naming-convention
	toString (): string
	{
		return super.toString()

	}

	async track (): Promise<THydratedDocumentType>
	{
		let doc = await drive.model<typeof schema>('Media')
			.findOne(
				{ src: this.valueOf() },

			)

		reply.NotFound.asserts(doc, 'media is not found')

		return doc

	}

	async safe_access (expires = 1800): Promise<string>
	{
		try
		{
			let doc = await this.track()

			let uri = await doc.safe_access(expires)

			return uri.href

		}

		catch
		{
			// 

		}

		return ''

	}


	static cast (src: string | URL): string
	{
		if (detective.is_media_uri_string(src) )
		{
			src = new URL(src)

		}

		if (src instanceof URL)
		{
			src.search = ''

			return src.href

		}

		return ''

	}


}


class SecretSchemaType extends SchemaType
{
	/** This schema type's name, to defend against minifiers that mangle function names. */
	// eslint-disable-next-line @typescript-eslint/naming-convention
	static schemaName: 'Secret'

	constructor (_path: string, options: object)
	{
		super(_path, options, 'SecretSchemaType')

		this.select(false)

		this.default('')

		this.set(
			function (src: string | URL): string
			{
				return Secret.cast(src)

			},

		)

	}

	cast (value: string): Secret
	{
		return new Secret(value)

	}


}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
drive.Schema.Types.Secret = SecretSchemaType


export const schema = new Schema
<
	TRawDocType,
	TModel,
	TInstanceMethods,
	TQueryHelpers,
	TVirtuals,
	TStaticMethods

// eslint-disable-next-line @stylistic/function-call-spacing
>
(
	{
		weapp: {
			type    : Schema.Types.ObjectId,
			ref     : () => weapp_model.default,
			index   : true,
			required: true,

		},

		mime: {
			type     : String,
			required : true,
			lowercase: true,
			trim     : true,

		},

		size: {
			type    : Number,
			required: true,
			min     : 0,
			default : 0,

		},


		store: {
			type    : String,
			required: true,
			trim    : true,
			enum    : ['alioss'],
			default : 'alioss',

		},

		bucket: {
			type    : String,
			required: true,
			trim    : true,

		},

		folder: {
			type    : String,
			required: true,
			trim    : true,
			set     : (v: string) => v.replace(/\\/g, '/')
				.replace(/\/{2,}/g, '/')
				.replace(/^([^/])/g, '/$1'),

		},


		src: {
			type  : String,
			unique: true,
			sparse: true,
			trim  : true,

			set (v: string | URL): string
			{
				return Secret.cast(v)

			},

		},

		hash: {
			type  : String,
			unique: true,
			sparse: true,
			trim  : true,

		},

		linker: [
			{
				name: {
					type     : String,
					required : true,
					lowercase: true,
					trim     : true,

				},

				model: {
					type    : String,
					required: true,
					trim    : true,
					validate (v: string): boolean
					{
						let k = v.toLowerCase()

						let name = drive.modelNames()

						return name.some(
							vv => vv.toLowerCase() === k,

						)

					},

				},

			},

		],
	},

)


schema.virtual('filename').get(
	function (): TVirtuals['filename']
	{
		return this.pathname.split('/').pop() ?? ''

	},

)

schema.virtual('pathname').get(
	function (): TVirtuals['pathname']
	{
		if (detective.is_empty(this.src) )
		{
			return ''

		}

		return new URL(this.src)
			.pathname.replace(/\\/g, '/')

	},

)


schema.method(
	'seize',

	// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
	<TInstanceMethods['seize']>
	function ()
	{
		let name = Date.now().toString(36)
		let extension = mime_types.extension(this.mime)

		return path.join(this.folder, `${name}.${extension}`).replace(/\\/g, '/')

	},

)


schema.method(
	'safe_push',

	// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
	<TInstanceMethods['safe_push']>
	async function (body)
	{
		class SizeTrackingStream extends stream.Transform implements stream.Transform
		{
			#hash = crypto.createHash('md5')

			#value = 0

			get hash (): string
			{
				return this.#hash.digest('hex')

			}

			get value (): number
			{
				return this.#value

			}

			_transform (
				chunk: unknown,
				encoding: BufferEncoding,
				callback: stream.TransformCallback,

			): void
			{
				if (chunk instanceof Buffer)
				{
					this.#hash.update(chunk)
					this.#value = this.#value + chunk.byteLength

				}

				else if (detective.is_array_buffer(chunk) )
				{
					this.#hash.update(chunk as unknown as Buffer)
					this.#value = this.#value + chunk.byteLength

				}

				else if (detective.is_blob(chunk) )
				{
					this.#hash.update(chunk as unknown as Buffer)
					this.#value = this.#value + chunk.size

				}

				this.push(chunk)

				callback()

			}

		}

		let size = new SizeTrackingStream()

		let doc = await this.populate<TPopulatePaths>('weapp')

		let store = doc.weapp.to_store(doc.store)

		let result = await store.append(
			this.seize(), body.pipe(size), { mime: this.mime },

		)

		this.size = size.value
		this.hash = size.hash

		this.src = result.url

		try
		{
			return await this.save()

		}

		catch (e)
		{
			await this.deleteOne()

			throw e

		}


	},


)

schema.method(
	'safe_delete',

	// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
	<TInstanceMethods['safe_delete']>
	async function ()
	{
		let doc = await this.populate<TPopulatePaths>('weapp')

		let store = doc.weapp.to_store(doc.store)

		await store.delete(this.pathname)

		await this.deleteOne()

	},


)

schema.method(
	'safe_access',

	// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
	<TInstanceMethods['safe_access']>
	async function (expires = 1800)
	{
		let doc = await this.populate<TPopulatePaths>('weapp')

		let store = doc.weapp.to_store(doc.store)


		return storage.ImageStore
			.signature(
				doc.store,

				store.signatureUrl(
					this.pathname,

					{
						expires,

					},

				),

			)

	},


)


schema.static<'safe_delete'>(
	'safe_delete',

	async function (weapp, ...src)
	{
		src = src.map(
			v =>
			{
				let uri = new URL(v)

				uri.search = ''

				return uri.href

			},

		)

		let doc = await this.find(
			{ weapp, src },

		)

		let p = doc.map(
			v => v.safe_delete(),

		)

		return Promise.allSettled(p)

	},


)

schema.static<'safe_access'>(
	'safe_access',

	async function (weapp, src, expires = 1800)
	{
		let doc = await this.findOne(
			{ weapp, src },

		)

		reply.NotFound.asserts(doc, 'media is not found')

		return doc.safe_access(expires)

	},


)

schema.static<'safe_to_link'>(
	'safe_to_link',

	async function (name, model, query)
	{
		let doc = await this.findOne(query)

		if (detective.is_empty(doc) )
		{
			return null

		}

		await doc.updateOne(
			{
				// eslint-disable-next-line @typescript-eslint/naming-convention
				$addToSet: {
					linker: { name: name.toLowerCase(), model: model.toLowerCase() },

				},

			},

		)

		return doc

	},


)


export default drive.model('Media', schema)
