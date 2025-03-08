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

		size: number
		mime: string

		folder: string
		filename: string

		store: 'alioss'
		bucket: string


		src?: string
		hash?: string

		linker: Types.Array<
			{
				name: string
				model: string

			}

		>


	}

>

export type TPopulatePaths = {
	weapp: weapp_model.THydratedDocumentType

}

export type TVirtuals = {
	pathname: string

}

export type TQueryHelpers = object

export type TInstanceMethods = {
	safe_push(
		// eslint-disable-next-line no-use-before-define
		this: THydratedDocumentType,

		body: stream.Readable,

	// eslint-disable-next-line no-use-before-define
	): Promise<THydratedDocumentType>

	safe_delete(
		// eslint-disable-next-line no-use-before-define
		this: THydratedDocumentType,

	): Promise<void>

	safe_access(
		// eslint-disable-next-line no-use-before-define
		this: THydratedDocumentType,

		expires?: number,

	): Promise<URL>

}

export type TStaticMethods = {
	safe_delete(
		// eslint-disable-next-line no-use-before-define
		this: TModel,

		weapp: Types.ObjectId,
		...src: Array<string>

	): Promise<
		Array<
			PromiseSettledResult<void>

		>

	>

	safe_access(
		// eslint-disable-next-line no-use-before-define
		this: TModel,

		weapp: Types.ObjectId,
		src: string,
		expires?: number,

	): Promise<URL>

	safe_to_link(
		// eslint-disable-next-line no-use-before-define
		this: TModel,

		name: string,
		model: string,

		query: { hash: string } | { src: string }

	// eslint-disable-next-line no-use-before-define
	): Promise<null | THydratedDocumentType>
}

export type THydratedDocumentType = HydratedDocument<TRawDocType, TVirtuals & TInstanceMethods>

export type TModel = Model<TRawDocType, TQueryHelpers, TInstanceMethods, TVirtuals>





const drive = await storage.mongodb()



export class Secret extends String {
	#weapp: Types.ObjectId

	constructor(src: string | URL, weapp: Types.ObjectId) {
		super(src)

		this.#weapp = weapp

	}

	safe_access(expires = 1800): Promise<string> {
		// eslint-disable-next-line no-use-before-define
		return drive.model<typeof schema>('Media')
			.safe_access(
				this.#weapp, this as unknown as string, expires,

			)
			.then(v => v.href)
			.catch(
				() => '',

			)

	}

}


class SecretSchemaType extends SchemaType {
	/** This schema type's name, to defend against minifiers that mangle function names. */
	// eslint-disable-next-line @typescript-eslint/naming-convention
	static schemaName: 'Secret'

	constructor(_path: string, options: object) {
		super(_path, options, 'SecretSchemaType')

		this.select(false)

		this.default('')

		this.set(
			function (src: string | URL): string {
				if (detective.is_media_uri_string(src)

				) {
					src = new URL(src)

				}

				if (src instanceof URL) {
					src.search = ''

					return src.href

				}

				return ''

			},

		)

	}

	cast(value: string, doc?: THydratedDocumentType): string | Secret {
		if (doc?.isNew === true) {
			return value

		}

		if (doc?.weapp) {
			return new Secret(value, doc.weapp)

		}

		return value

	}


}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
drive.Schema.Types.Secret = SecretSchemaType


export const schema = new Schema<
	TRawDocType,
	TModel,
	TInstanceMethods,
	TQueryHelpers,
	TVirtuals,
	TStaticMethods

>(
	{
		weapp: {
			type: Schema.Types.ObjectId,
			ref: () => weapp_model.default,
			required: true,

		},

		size: {
			type: Number,
			required: true,
			min: 0,
			default: 0,

		},

		mime: {
			type: String,
			required: true,
			lowercase: true,
			trim: true,

			set(v: string) {
				let name = Date.now().toString(36)
				let extension = mime_types.extension(v)

				this.filename = `${name}.${extension}`

				return v

			},

		},

		folder: {
			type: String,
			required: true,
			trim: true,
			set: (v: string) => v.replace(/\\/g, '/')
				.replace(/\/{2,}/g, '/')
				.replace(/^([^/])/g, '/$1'),

		},

		filename: {
			type: String,
			unique: true,
			required: true,
			trim: true,

			validate: (v: string) => (/^[0-9a-z]+\.[a-z]+$/).test(v),

		},

		store: {
			type: String,
			required: true,
			trim: true,
			enum: ['alioss'],
			default: 'alioss',

		},

		bucket: {
			type: String,
			required: true,
			trim: true,

		},


		src: {
			type: Secret,
			unique: true,
			sparse: true,
			trim: true,

		},

		hash: {
			type: String,
			unique: true,
			sparse: true,
			trim: true,

		},

		linker: [
			{
				name: {
					type: String,
					required: true,
					lowercase: true,
					trim: true,

				},

				model: {
					type: String,
					required: true,
					trim: true,
					validate(v: string): boolean {
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


schema.virtual('pathname').get(
	function (): TVirtuals['pathname'] {
		return path.join(this.folder, this.filename).replace(/\\/g, '/')

	},

)


schema.method(
	{
		async safe_push(body) {
			class SizeTrackingStream extends stream.Transform implements stream.Transform {
				#hash = crypto.createHash('md5')

				#value = 0

				get hash(): string {
					return this.#hash.digest('hex')

				}

				get value(): number {
					return this.#value

				}

				_transform(
					chunk: unknown,
					encoding: BufferEncoding,
					callback: stream.TransformCallback,

				): void {
					if (detective.is_buffer(chunk)
						|| detective.is_array_buffer(chunk)

					) {
						this.#hash.update(chunk as Buffer)
						this.#value = this.#value + chunk.byteLength

					}

					this.push(chunk)

					callback()

				}

			}

			let size = new SizeTrackingStream()

			let doc = await this.populate<TPopulatePaths>('weapp')

			let client = doc.weapp.to_ali_oss()

			let result = await client.append(
				this.pathname,

				body.pipe(size),

				{ mime: this.mime },

			)

			this.size = size.value
			this.hash = size.hash

			this.src = result.url

			try {
				return await this.save()

			}

			catch (e) {
				await this.deleteOne()

				throw e

			}


		},

		async safe_delete() {
			let doc = await this.populate<TPopulatePaths>('weapp')

			let client = doc.weapp.to_ali_oss()

			await client.delete(this.pathname)

			await this.deleteOne()

		},

		async safe_access(expires = 1800) {
			let doc = await this.populate<TPopulatePaths>('weapp')

			let client = doc.weapp.to_ali_oss()

			return new URL(
				client.signatureUrl(
					this.pathname,

					{
						expires,

					},

				),

			)

		},


	},

)


schema.static(
	{
		async safe_delete(weapp, ...src) {
			src = src.map(
				v => {
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

		async safe_access(weapp, src, expires = 1800) {
			let doc = await this.findOne(
				{ weapp, src },

			)
				.select('+src')

			reply.NotFound.asserts(doc, 'media')

			return doc.safe_access(expires)

		},


		async safe_to_link(name, model, query) {
			let doc = await this.findOne(query)

			if (detective.is_empty(doc)

			) {
				return null

			}

			name = name.toLowerCase()
			model = model.toLowerCase()

			let some = doc.linker.some(
				v => name === v.name.toLowerCase() && model === v.model.toLowerCase(),

			)

			if (some) {
				return doc

			}

			doc.linker.push(
				{ name, model },

			)

			return doc.save()


		},

	},

)


export default drive.model('Media', schema)
