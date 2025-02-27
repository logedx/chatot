/**
 * 检查点模型
 */
import { Schema, Model, Types, HydratedDocument } from 'mongoose'

import * as storage from '../lib/storage.js'

import * as user_model from './user.js'
import * as weapp_model from './weapp.js'





export type TRawDocType = storage.TRawDocType<
	{
		weapp: null | Types.ObjectId
		user: null | Types.ObjectId
		method: 'POST' | 'GET' | 'PUT' | 'DELETE'
		original: string
		expire: Date

	}

>

export type TPopulatePaths = {
	weapp: null | weapp_model.THydratedDocumentType
	user: null | user_model.THydratedDocumentType

}

export type TVirtuals = object

export type TQueryHelpers = object

export type TInstanceMethods = object

export type THydratedDocumentType = HydratedDocument<TRawDocType, TVirtuals >

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
			enum: ['POST', 'GET', 'PUT', 'DELETE'],

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
			default: () => delay(),

		},

	},

)




export default drive.model('Checkpoint', schema)


/**
 * 获取延迟时间
 */
export function delay(): Date {
	let d = new Date()

	d.setFullYear(d.getFullYear() + 1)

	return d

}