/**
 * 用户模型
 */
import moment from 'moment'
import { Schema, Model, Types, HydratedDocument } from 'mongoose'

import * as storage from '../lib/storage.js'
import * as detective from '../lib/detective.js'

import * as scope_model from './scope.js'
import * as token_model from './token.js'
import * as weapp_model from './weapp.js'





export type TRawDocType = storage.TRawDocType<
	{
		weapp: Types.ObjectId

		active: boolean

		avatar  : string
		nickname: string
		color   : string

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
		shine(this: THydratedDocumentType): Promise<void>

		overcast(this: THydratedDocumentType): Promise<void>

		authorize(this: THydratedDocumentType, expire?: Date): Promise<void>

	}

>

export type TStaticMethods = storage.TStaticMethods<
	TRawDocType,

	{
		authorize(this: TModel, _id: Types.ObjectId): Promise<void>

	}

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

		color: {
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

schema.method(
	'authorize',

	// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
	<TInstanceMethods['authorize']>
	// eslint-disable-next-line @stylistic/newline-per-chained-call
	async function (expire = moment().add(1, 'w').toDate() )
	{
		let doc = await this.select_sensitive_fields('+scope')

		if (doc.scope)
		{
			doc.scope.value = scope_model.mixed(
				doc.scope.value,

				scope_model.Role.运营,

			)

		}

		else
		{
			doc.scope = { value: scope_model.Role.运营 } as scope_model.THydratedDocumentType

		}

		doc.scope.expire = expire


		await doc.save()

		await token_model.default.findOneAndUpdate(
			{ user: doc._id },

			{ scope: doc.scope.value },

		)


	},


)


export default drive.model('User', schema)
