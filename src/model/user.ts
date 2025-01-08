/**
 * 用户模型
 */
import { Schema, Model, Types, HydratedDocument } from 'mongoose'

import * as reply from '../lib/reply.js'
import * as storage from '../lib/storage.js'
import * as detective from '../lib/detective.js'
import * as structure from '../lib/structure.js'

import * as scope_model from './scope.js'
import * as weapp_model from './weapp.js'





export type TRawDocType = storage.TRawDocType<
	{
		weapp: Types.ObjectId

		active: boolean

		avatar: string
		nickname: string

		phone?: string

		wxopenid?: string
		wxsession?: string

		scope: null | scope_model.THydratedDocumentType

	}

>

export type TRawDocKeyword = 'nickname' | 'phone'

export type TPopulatePaths = {
	weapp: weapp_model.THydratedDocumentType

}

export type TVirtuals = object

export type TQueryHelpers = object

export type TInstanceMethods = {
	shine(
		// eslint-disable-next-line no-use-before-define
		this: THydratedDocumentType,

	): Promise<void>

	select_sensitive_fields<T extends 'phone' | 'wxopenid' | 'wxsession'>(
		// eslint-disable-next-line no-use-before-define
		this: THydratedDocumentType,

		...select: Array<`+${T}`>

	): Promise<
		// eslint-disable-next-line no-use-before-define
		structure.PropertyTypeRequired<THydratedDocumentType, T>

	>

}

export type THydratedDocumentType = HydratedDocument<TRawDocType, TVirtuals & TInstanceMethods>

export type TModel = Model<TRawDocType, TQueryHelpers, TInstanceMethods, TVirtuals>






const drive = await storage.mongodb()

export const keyword = ['nickname', 'phone'] as const

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
			required: true,

		},

		active: {
			type: Boolean,
			required: true,
			default: false,

		},

		avatar: {
			type: String,
			trim: true,
			default: '',

		},

		nickname: {
			type: String,
			trim: true,
			default: '',

		},

		phone: {
			type: String,
			index: true,
			sparse: true,
			select: false,
			lowercase: true,
			trim: true,

		},

		// 微信标识符
		wxopenid: {
			type: String,
			unique: true,
			select: false,
			required: true,
			trim: true,

		},

		// 微信会话
		wxsession: {
			type: String,
			unique: true,
			select: false,
			required: true,
			trim: true,

		},

		// 权限范围
		scope: {
			type: scope_model.default,
			select: false,
			default: null,

		},

	},


)



schema.index(
	{ weapp: 1, created: -1 },

)

schema.index(
	{ weapp: 1, phone: 1 },

	{ unique: true, sparse: true },

)


schema.index(
	// eslint-disable-next-line @typescript-eslint/naming-convention
	{ 'scope.lock': 1, 'scope.expired': -1 },

)


schema.method(
	{
		async shine() {
			let doc = await this.select_sensitive_fields('+phone')

			doc.active = detective.is_phone_number_string(doc.phone)

			await doc.save()

		},

		async select_sensitive_fields<T extends keyof TRawDocType>(
			this: THydratedDocumentType,

			...select: Array<`+${T}`>

		): Promise<
			structure.PropertyTypeRequired<THydratedDocumentType, T>

		> {
			const model = this.model()


			let doc = await model.findById(this._id).select(select)

			reply.NotFound.asserts(doc, 'user')

			return doc as unknown as structure.PropertyTypeRequired<THydratedDocumentType, T>

		},

	},

)

export default drive.model('User', schema)