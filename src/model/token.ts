/**
 * 令牌模型
 */
import { Schema, Model, Types, HydratedDocument } from 'mongoose'

import * as storage from '../lib/storage.js'

import * as reply from '../lib/reply.js'
import * as secret from '../lib/secret.js'
import * as detective from '../lib/detective.js'
import * as structure from '../lib/structure.js'

import * as user_model from './user.js'
import * as scope_model from './scope.js'
import * as weapp_model from './weapp.js'





export type TRawDocType = storage.TRawDocType<
	{
		color: string
		scope: number

		weapp: null | Types.ObjectId
		user : null | Types.ObjectId

		value  : string
		refresh: string

		expire: Date

	}

>

export type TPopulatePaths = {
	weapp: null | weapp_model.THydratedDocumentType
	user : null | user_model.THydratedDocumentType

}

export type TVirtuals = {
	is_super: boolean

	is_usable : boolean
	is_deposit: boolean
	is_survive: boolean

	mode: scope_model.Mode

}

export type TQueryHelpers = object

export type TInstanceMethods = {
	replenish(this: THydratedDocumentType, value: string): Promise<THydratedDocumentType>

	to_user(this: THydratedDocumentType): Promise<user_model.THydratedDocumentType>

	to_weapp(this: THydratedDocumentType): Promise<weapp_model.THydratedDocumentType>

	to_usable(this: THydratedDocumentType): TSurviveHydratedDocumentType

	to_deposit(this: THydratedDocumentType): TSurviveHydratedDocumentType

	to_survive(this: THydratedDocumentType): TSurviveHydratedDocumentType

}

export type TStaticMethods = object

export type THydratedDocumentType = HydratedDocument<TRawDocType, TVirtuals & TInstanceMethods>

export type TModel = Model<TRawDocType, TQueryHelpers, TInstanceMethods, TVirtuals>


export type TSurviveHydratedDocumentType = structure.Overwrite<
	THydratedDocumentType,

	{ user: Types.ObjectId, weapp: Types.ObjectId }

>






const drive = await storage.mongodb()

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
		color: {
			type   : String,
			trim   : true,
			default: '',

		},

		//  权限范围
		scope: {
			type    : Number,
			required: true,
			default : 0,

		},

		weapp: {
			type   : Schema.Types.ObjectId,
			ref    : () => weapp_model.default,
			default: null,

		},

		user: {
			type   : Schema.Types.ObjectId,
			ref    : () => user_model.default,
			default: null,

		},

		value: {
			type    : String,
			unique  : true,
			required: true,
			trim    : true,
			default : () => secret.hex(),

		},

		// 刷新令牌
		refresh: {
			type    : String,
			unique  : true,
			required: true,
			trim    : true,
			default : () => secret.hex(),

		},

		// 过期时间
		expire: {
			type    : Date,
			expires : 300,
			required: true,
			default : () => secret.delay(7200),

		},

	},

)

schema.virtual('is_super').get(
	function (): TVirtuals['is_super']
	{
		return this.scope > 0

	},

)

schema.virtual('is_usable').get(
	function (): TVirtuals['is_usable']
	{
		return this.expire > new Date()

	},

)

schema.virtual('is_deposit').get(
	function (): TVirtuals['is_deposit']
	{
		return this.is_usable && detective.is_null(this.weapp) === false

	},

)

schema.virtual('is_survive').get(
	function (): TVirtuals['is_survive']
	{
		return this.is_deposit && detective.is_null(this.user) === false

	},

)

schema.virtual('mode').get(
	function (): TVirtuals['mode']
	{
		return scope_model.vtmod(this.scope)

	},

)

schema.method(
	'replenish',

	// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
	<TInstanceMethods['replenish']>
	async function (value)
	{
		if (this.refresh !== value)
		{
			throw new reply.Unauthorized('refresh is invalid')

		}


		this.value = secret.hex()
		this.refresh = secret.hex()

		this.expire = secret.delay(7200)

		await this.save()

		return this

	},


)

schema.method(
	'to_user',

	// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
	<TInstanceMethods['to_user']>
	async function ()
	{
		let doc = await this.populate<
				Pick<TPopulatePaths, 'user'>

			>('user')


		reply.NotFound.asserts(doc.user, 'user is not found')

		return doc.user

	},


)

schema.method(
	'to_weapp',

	// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
	<TInstanceMethods['to_weapp']>
	async function ()
	{
		let doc = await this.populate<
			Pick<TPopulatePaths, 'weapp'>

		>('weapp')


		reply.NotFound.asserts(doc.weapp, 'weapp is not found')

		return doc.weapp

	},


)

schema.method(
	'to_usable',

	// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
	<TInstanceMethods['to_usable']>
	function ()
	{
		if (this.is_usable)
		{
			return this as TSurviveHydratedDocumentType

		}

		throw new reply.Unauthorized('authentication failed')

	},


)

schema.method(
	'to_deposit',

	// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
	<TInstanceMethods['to_deposit']>
	function ()
	{
		if (this.is_deposit)
		{
			return this as TSurviveHydratedDocumentType

		}

		throw new reply.Unauthorized('authentication failed')

	},


)

schema.method(
	'to_survive',

	// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
	<TInstanceMethods['to_survive']>
	function ()
	{
		if (this.is_survive)
		{
			return this as TSurviveHydratedDocumentType

		}

		throw new reply.Unauthorized('authentication failed')

	},


)


export default drive.model('Token', schema)
