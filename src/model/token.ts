/**
 * 令牌模型
 */
import { Schema, Types } from 'mongoose'


import * as reply from '../lib/reply.js'
import * as secret from '../lib/secret.js'
import * as detective from '../lib/detective.js'
import * as structure from '../lib/structure.js'

import * as database from '../store/database.js'


import * as user_model from './user.js'
import * as scope_model from './scope.js'
import * as weapp_model from './weapp.js'





export type Tm = database.Tm<
	{
		color: string
		scope: number

		weapp: null | Types.ObjectId
		user : null | Types.ObjectId

		value  : string
		refresh: string

		expire: Date

	},

	{
		is_super: boolean

		is_usable : boolean
		is_deposit: boolean
		is_survive: boolean

		mode: scope_model.Mode

	},

	{
		replenish(value: string): Promise<Tm['HydratedDocument']>

		to_user(): Promise<user_model.Tm['HydratedDocument']>

		to_weapp(): Promise<weapp_model.Tm['HydratedDocument']>

		to_usable(): TSurviveHydratedDocumentType

		to_deposit(): TSurviveHydratedDocumentType

		to_survive(): TSurviveHydratedDocumentType

	}

>

export type TPopulatePaths = {
	weapp: null | weapp_model.Tm['HydratedDocument']
	user : null | user_model.Tm['HydratedDocument']

}


export type TSurviveHydratedDocumentType = structure.Overwrite<
	Tm['HydratedDocument'],

	{ user: Types.ObjectId, weapp: Types.ObjectId }

>






const drive = await database.Mongodb.default()

export const schema: Tm['TSchema'] = new Schema
<
	Tm['DocType'],
	Tm['TModel'],
	Tm['TInstanceMethods'],
	Tm['TQueryHelpers'],
	Tm['TVirtuals'],
	Tm['TStaticMethods']

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
	function (): Tm['TVirtuals']['is_super']
	{
		return this.scope > 0

	},

)

schema.virtual('is_usable').get(
	function (): Tm['TVirtuals']['is_usable']
	{
		return this.expire > new Date()

	},

)

schema.virtual('is_deposit').get(
	function (): Tm['TVirtuals']['is_deposit']
	{
		return this.is_usable && detective.is_null(this.weapp) === false

	},

)

schema.virtual('is_survive').get(
	function (): Tm['TVirtuals']['is_survive']
	{
		return this.is_deposit && detective.is_null(this.user) === false

	},

)

schema.virtual('mode').get(
	function (): Tm['TVirtuals']['mode']
	{
		return scope_model.vtmod(this.scope)

	},

)

schema.method(
	'replenish',

	// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
	<Tm['TInstanceMethods']['replenish']>
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
	<Tm['TInstanceMethods']['to_user']>
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
	<Tm['TInstanceMethods']['to_weapp']>
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
	<Tm['TInstanceMethods']['to_usable']>
	function ()
	{
		if (this.is_usable)
		{
			return this

		}

		throw new reply.Unauthorized('authentication failed')

	},


)

schema.method(
	'to_deposit',

	// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
	<Tm['TInstanceMethods']['to_deposit']>
	function ()
	{
		if (this.is_deposit)
		{
			return this

		}

		throw new reply.Unauthorized('authentication failed')

	},


)

schema.method(
	'to_survive',

	// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
	<Tm['TInstanceMethods']['to_survive']>
	function ()
	{
		if (this.is_survive)
		{
			return this

		}

		throw new reply.Unauthorized('authentication failed')

	},


)


export default drive.model('Token', schema) as Tm['Model']
