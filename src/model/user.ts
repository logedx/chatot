/**
 * 用户模型
 */
import { Schema, Model, Types, HydratedDocument } from 'mongoose'

import * as storage from '../lib/storage.js'
import * as detective from '../lib/detective.js'

import * as scope_model from './scope.js'
import * as weapp_model from './weapp.js'





export type TRawDocType = storage.TRawDocType<
	{
		weapp: Types.ObjectId

		active: boolean

		avatar  : string
		nickname: string

		phone?: string

		wxopenid? : string
		wxsession?: string

		scope?: null | scope_model.THydratedDocumentType

	}

>

export type TRawDocKeyword = 'nickname' | 'phone'

export type TPopulatePaths = {
	weapp: weapp_model.THydratedDocumentType

}

export type TVirtuals = object

export type TQueryHelpers = object

export type TInstanceMethods = storage.TInstanceMethods<
	TRawDocType,

	{
		// eslint-disable-next-line no-use-before-define
		shine(this: THydratedDocumentType): Promise<void>

		// eslint-disable-next-line no-use-before-define
		overcast(this: THydratedDocumentType): Promise<void>

	}

>

export type TStaticMethods = storage.TStaticMethods<
	TRawDocType

>

export type THydratedDocumentType = HydratedDocument<TRawDocType, TVirtuals & TInstanceMethods>

export type TModel = Model<TRawDocType, TQueryHelpers, TInstanceMethods, TVirtuals>






const drive = await storage.mongodb()

export const keyword = ['nickname', 'phone'] as const

export const schema = new Schema
<
	TRawDocType,
	TModel,
	TInstanceMethods,
	TQueryHelpers,
	TVirtuals,
	TStaticMethods

// eslint-disable-next-line func-call-spacing
>
(
	{
		weapp: {
			type    : Schema.Types.ObjectId,
			ref     : () => weapp_model.default,
			index   : true,
			required: true,

		},

		active: {
			type    : Boolean,
			required: true,
			default : false,

		},

		avatar: {
			type   : String,
			trim   : true,
			default: '',

		},

		nickname: {
			type   : String,
			trim   : true,
			default: '',

		},

		phone: {
			type     : String,
			index    : true,
			sparse   : true,
			select   : false,
			lowercase: true,
			trim     : true,

		},

		// 微信标识符
		wxopenid: {
			type    : String,
			unique  : true,
			select  : false,
			required: true,
			trim    : true,

		},

		// 微信会话
		wxsession: {
			type    : String,
			unique  : true,
			select  : false,
			required: true,
			trim    : true,

		},

		// 权限范围
		scope: {
			type   : scope_model.default,
			select : false,
			default: null,

		},

	},


)



schema.index(
	{ weapp: 1, created: -1 },

)

schema.index(
	{ weapp: 1, phone: 1 },

	{
		unique: true,

		// eslint-disable-next-line @typescript-eslint/naming-convention
		partialFilterExpression: {
			$and: [{ weapp: { $exists: true } }, { phone: { $exists: true } }],

		},

	},

)


schema.index(
	// eslint-disable-next-line @typescript-eslint/naming-convention
	{ 'scope.lock': 1, 'scope.expired': -1 },

)


schema.method(
	'shine',

	// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
	<TInstanceMethods['shine']>
	async function ()
	{
		let doc = await this.select_sensitive_fields('+phone')

		doc.active = detective.is_phone_number_string(doc.phone)

		await doc.save()

	},


)

schema.method(
	'overcast',

	// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
	<TInstanceMethods['overcast']>
	async function ()
	{
		this.active = false

		await this.save()

	},


)

export default drive.model('User', schema)
