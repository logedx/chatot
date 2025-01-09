/**
 * 媒体模型
 */
import path from 'node:path'
import stream from 'node:stream'

import mime_types from 'mime-types'
import { Schema, Model, Types, HydratedDocument } from 'mongoose'

import * as reply from '../lib/reply.js'
import * as storage from '../lib/storage.js'
import * as detective from '../lib/detective.js'

import * as weapp_model from './weapp.js'




export type TRawDocType = storage.TRawDocType<
	{
		weapp: Types.ObjectId

		size: number
		mime: string

		pathname: string
		reference: number

		src?: string

	}

>

export type TPopulatePaths = {
	weapp: weapp_model.THydratedDocumentType

}

export type TVirtuals = object

export type TQueryHelpers = object

export type TInstanceMethods = {
	linker(
		// eslint-disable-next-line no-use-before-define
		this: THydratedDocumentType,

	): Promise<void>

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

}

export type THydratedDocumentType = HydratedDocument<TRawDocType, TVirtuals & TInstanceMethods>

export type TModel = Model<TRawDocType, TQueryHelpers, TInstanceMethods, TVirtuals>





const drive = await storage.mongodb()


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

		},

		pathname: {
			type: String,
			unique: true,
			required: true,
			trim: true,
			set: (v: string) => v.replace(/\\/g, '/')
				.replace(/\/{2,}/g, '/')
				.replace(/^([^/])/g, '/$1'),

		},

		reference: {
			type: Number,
			required: true,
			min: 0,
			default: 0,

		},

		// media uri
		src: {
			type: String,
			unique: true,
			sparse: true,
			trim: true,

		},

	},

)



schema.method(
	{
		async linker() {
			await this.updateOne(
				{ $inc: { reference: 1 } },

			)

		},

		async safe_push(body) {
			class SizeTrackingStream extends stream.Transform implements stream.Transform {
				#value = 0

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
			this.src = result.url

			return this.save()

		},

		async safe_delete() {
			this.reference = this.reference - 1

			if (this.reference > 0) {
				await this.save()

				return

			}

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

			reply.NotFound.asserts(doc, 'media')

			return doc.safe_access(expires)

		},

	},

)


export default drive.model('Media', schema)



export function resolve(folder: string, mime: string): string {
	let name = Date.now().toString(36)
	let extension = mime_types.extension(mime)

	return path.join(folder, `${name}.${extension}`).replace(/\\/g, '/')

}
