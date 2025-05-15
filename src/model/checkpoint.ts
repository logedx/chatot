/**
 * 检查点模型
 */
import * as axios from 'axios'
import { Schema, Model, Types, HydratedDocument, Document } from 'mongoose'

import * as storage from '../lib/storage.js'

import * as secret from '../lib/secret.js'

import * as user_model from './user.js'
import * as scope_model from './scope.js'
import * as weapp_model from './weapp.js'





export type TRawDocType = storage.TRawDocType<
	{
		scope: number
		weapp: null | Types.ObjectId
		user: null | Types.ObjectId
		method: Uppercase<axios.Method>
		original: string
		expire: Date
		context: null | Schema.Types.Mixed

	}

>

export type TPopulatePaths = {
	weapp: null | weapp_model.THydratedDocumentType
	user: null | user_model.THydratedDocumentType

}

export type TVirtuals = {
	mode: scope_model.Mode

}


export type TQueryHelpers = object

export type TInstanceMethods = {
	hold(
		// eslint-disable-next-line no-use-before-define
		this: THydratedDocumentType,

		context: unknown,

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
		scope: {
			type: Number,
			required: true,
			default: 0,

		},

		weapp: {
			type: Schema.Types.ObjectId,
			ref: () => weapp_model.default,
			index: true,
			default: null,

		},

		user: {
			type: Schema.Types.ObjectId,
			ref: () => user_model.default,
			index: true,
			default: null,

		},

		method: {
			type: String,
			required: true,
			trim: true,
			set: (v: string) => v.toUpperCase(),

		},

		original: {
			type: String,
			required: true,
			trim: true,

		},

		expire: {
			type: Date,
			expires: 0,
			required: true,
			default: () => secret.delay(86400 * 365),

		},

		context: {
			type: Schema.Types.Mixed,
			default: null,

		},

	},

)


schema.virtual('mode').get(
	function (): TVirtuals['mode'] {
		return scope_model.vtmod(this.scope)

	},

)


schema.method(
	{
		async hold(context) {
			if (context instanceof Document) {
				context = context.toObject()

			}

			await this.updateOne(
				{ context: context as Schema.Types.Mixed },

			)

		},

	},

)


export default drive.model('Checkpoint', schema)
