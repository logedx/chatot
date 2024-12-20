/**
 * 媒体模型
 */
import path from 'node:path'

import mime_types from 'mime-types'
import { Schema, Model, Types, HydratedDocument } from 'mongoose'

import * as storage from '../lib/storage.js'

import * as weapp_model from './weapp.js'




export type TRawDocType = storage.TRawDocType<
	{
		weapp: Types.ObjectId

		size: number
		mime: string

		pathname: string
		reference: number

		src: string

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

	safe_delete(
		// eslint-disable-next-line no-use-before-define
		this: THydratedDocumentType,

	): Promise<void>

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
			required: true,
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

		async safe_delete() {
			this.reference = this.reference - 1

			if (this.reference > 0) {
				await this.save()

				return

			}

			await this.deleteOne()

		},

	},

)


export default drive.model('Media', schema)



export function resolve(folder: string, mime: string): string {
	let name = Date.now().toString(36)
	let extension = mime_types.extension(mime)

	return path.join(folder, `${name}.${extension}`).replace(/\\/g, '/')

}
