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
	is_survive: boolean

	mode: scope_model.Mode

}

export type TQueryHelpers = object

export type TInstanceMethods = {
	// eslint-disable-next-line no-use-before-define
	replenish(this: THydratedDocumentType, value?: string): Promise<THydratedDocumentType>

	// eslint-disable-next-line no-use-before-define
	to_user(this: THydratedDocumentType): Promise<user_model.THydratedDocumentType>

	// eslint-disable-next-line no-use-before-define
	to_weapp(this: THydratedDocumentType): Promise<weapp_model.THydratedDocumentType>

	// eslint-disable-next-line no-use-before-define
	to_usable(this: THydratedDocumentType): TSurviveHydratedDocumentType

	// eslint-disable-next-line no-use-before-define
	to_survive(this: THydratedDocumentType): TSurviveHydratedDocumentType

}

export type TStaticMethods = {
	// eslint-disable-next-line no-use-before-define
	replenish(this: TModel, refresh: string): Promise<THydratedDocumentType>

}

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

// eslint-disable-next-line func-call-spacing
>
(
	{
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
			expires : 0,
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

schema.virtual('is_survive').get(
	function (): TVirtuals['is_survive']
	{
		let is_expired = this.expire > new Date()
		let is_anonymous = detective.is_null(this.user) || detective.is_null(this.weapp)

		return is_expired && !is_anonymous

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
	async function ()
	{
		if (
			this.expire > secret.delay(-3600) )
		{
			throw new reply.Unauthorized('value is expired')

		}

		this.expire = secret.delay(7200)
		this.refresh = secret.hex()

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


		reply.NotFound.asserts(doc.user, 'user is not exist')

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


		reply.NotFound.asserts(doc.weapp, 'weapp is not exist')

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


schema.static<'replenish'>(
	'replenish',

	async function (refresh)
	{
		let doc = await this.findOne(
			{ refresh },

		)

		reply.NotFound.asserts(doc, 'token')

		return doc.replenish()

	},


)


export default drive.model('Token', schema)
