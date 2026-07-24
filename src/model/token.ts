/**
 * 令牌模型
 */
import { Schema } from 'mongoose'


import * as reply from '../lib/reply.js'
import * as secret from '../lib/secret.js'
import * as detective from '../lib/detective.js'

import * as database from '../store/database.js'


import * as token from '../schema/token.js'

import * as user_model from './user.js'
import * as scope_model from './scope.js'
import * as weapp_model from './weapp.js'




export namespace Default
{
	export type Define = token.Default

	export type Methods = {
		replenish(value: string): Promise<Default.Document>

	}

	// eslint-disable-next-line @typescript-eslint/no-empty-object-type
	export type Statics = {}

	export type Schema = database.Schema<Default.Define, Default.Methods, Default.Statics>

	export type Keywords = database.Probe<Default.Define>

	export type Document = database.Document<Default.Schema>


}


export namespace Deposit
{
	export type Define = token.Deposit

	export type Methods = Default.Methods
		& {
			to_weapp(): Promise<weapp_model.Default.Document>

		}

	// eslint-disable-next-line @typescript-eslint/no-empty-object-type
	export type Statics = {}

	export type Schema = database.Schema<Deposit.Define, Deposit.Methods, Deposit.Statics>

	export type Keywords = database.Probe<Deposit.Define>

	export type Document = database.Document<Deposit.Schema>


}


export namespace Survive
{
	export type Define = token.Survive

	export type Methods = Deposit.Methods
		& {
			to_user(): Promise< user_model.Default.Document >

		}

	// eslint-disable-next-line @typescript-eslint/no-empty-object-type
	export type Statics = {}

	export type Schema = database.Schema<Survive.Define, Survive.Methods, Survive.Statics>

	export type Keywords = database.Probe<Survive.Define>

	export type Document = database.Document<Survive.Schema>


}


// eslint-disable-next-line @stylistic/function-call-spacing
export const default_schema: Default.Schema = new Schema
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
			type    : database.Sensitive,
			unique  : true,
			required: true,
			default : () => new database.Sensitive(secret.hex() ),

		},

		// 刷新令牌
		refresh: {
			type    : database.Sensitive,
			unique  : true,
			required: true,
			default : () => new database.Sensitive(secret.hex() ),

		},

		// 过期时间
		expire: {
			type    : database.Sensitive,
			expires : 300,
			required: true,
			default : () => new database.Sensitive(secret.delay(7200) ),

		},

	},

	{
		virtuals: {
			is_super: {
				get ()
				{
					return this.scope > 0

				},

			},

			is_usable: {
				get ()
				{
					return this.expire.value > new Date()

				},

			},

			is_deposit: {
				get ()
				{
					return this.is_usable && detective.is_exist(this.weapp)

				},

			},

			is_survive: {
				get ()
				{
					return this.is_deposit && detective.is_exist(this.user)

				},

			},

			mode: {
				get ()
				{
					return scope_model.vtmod(this.scope)

				},

			},


		},

		methods: {
			async replenish (value)
			{
				if (this.refresh.value !== value)
				{
					throw new reply.Unauthorized('refresh is invalid')

				}


				this.value = new database.Sensitive(secret.hex() )
				this.refresh = new database.Sensitive(secret.hex() )

				this.expire = new database.Sensitive(secret.delay(7200) )

				await this.save()

				return this

			},

		},


	},


)

default_schema.method(
	'to_user',

	// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
	<Survive.Schema['methods']['to_user']>
	async function ()
	{
		let doc = await user_model.default.findById(this.user)

		reply.NotFound.asserts(doc, 'user is not found')


		return doc

	},


)

default_schema.method(
	'to_weapp',

	// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
	<Survive.Schema['methods']['to_weapp']>
	async function ()
	{
		let doc = await weapp_model.default.findById(this.weapp)

		reply.NotFound.asserts(doc, 'weapp is not found')


		return doc

	},


)


const drive = await database.Mongodb.default()

export default drive.model('Token', default_schema)
