/**
 * 媒体模型
 */
import path from 'node:path'
import stream from 'node:stream'

import ali_oss from 'ali-oss'
import mime_types from 'mime-types'
import { Schema, Model, Types, HydratedDocument, Require_id } from 'mongoose'

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

	): Promise<Require_id<Required<TRawDocType>>>

}

export type THydratedDocumentType = HydratedDocument<TRawDocType, TVirtuals & TInstanceMethods>

export type TModel = Model<TRawDocType, TQueryHelpers, TInstanceMethods, TVirtuals>






const drive = await storage.mongodb()


export const schema = new Schema<
	TRawDocType,
	TModel,
	TInstanceMethods,
	TQueryHelpers,
	TVirtuals

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
			set: (v: string) => v.replace(/\\/g, '/'),

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
			let size = 0

			body.on(
				'data',

				v => {
					if (detective.is_buffer(v)
						|| detective.is_array_buffer(v)

					) {
						size = size + v.byteLength

					}

				},

			)

			let doc = await this.populate<TPopulatePaths>('weapp')

			let client = doc.weapp.to_ali_oss()

			let result = await client.putStream(this.pathname, body) as ali_oss.PutObjectResult

			this.size = size
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

			this.src = client.signatureUrl(
				this.pathname,

				{
					expires,

				},

			)

			return this.toObject() as Require_id<Required<TRawDocType>>

		},


	},

)


export default drive.model('Media', schema)



export function resolve(folder: string, mime: string): string {
	let name = Date.now().toString(36)
	let extension = mime_types.extension(mime)

	return path.join(folder, `${name}.${extension}`).replace(/\\/g, '/')

}
