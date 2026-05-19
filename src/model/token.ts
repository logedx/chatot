/**
 * 令牌模型
 */
import { Schema } from 'mongoose'


import * as model from '../lib/model.js'
import * as reply from '../lib/reply.js'
import * as secret from '../lib/secret.js'
import * as detective from '../lib/detective.js'

import * as database from '../store/database.js'


import * as user_model from './user.js'
import * as scope_model from './scope.js'
import * as weapp_model from './weapp.js'





// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Default
{
	export type Model = model.Define<
		{
			color: string
			scope: number

			weapp: null | model.Types.Ref<weapp_model.Default.HydratedDocument>
			user : null | model.Types.Ref<user_model.Default.HydratedDocument>

			value  : model.Types.Sensitive<string>
			refresh: model.Types.Sensitive<string>

			expire: model.Types.Sensitive<Date>

		},

		{
			is_super: boolean

			is_usable : boolean
			is_deposit: boolean
			is_survive: boolean

			mode: scope_model.Mode

		}

	>

	export type Schema = database.Schema<
		Model,


		{
			replenish(value: string): Promise<Default.HydratedDocument>

		},

		// eslint-disable-next-line @typescript-eslint/no-empty-object-type
		{}

	>

	export type HydratedDocument = database.HydratedDocument<Schema>

}


// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Deposit
{
	export type Model = model.Override<
		Default.Model,

		{
			weapp: model.Types.Ref<weapp_model.Default.HydratedDocument>

		}


	>

	export type Schema = database.Schema<
		Model,

		Default.Schema['methods']
		& {
			to_weapp(): Promise<weapp_model.Default.HydratedDocument>

		},

		// eslint-disable-next-line @typescript-eslint/no-empty-object-type
		{}

	>

	export type HydratedDocument = database.HydratedDocument<Schema>

}


// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Survive
{
	export type Model = model.Override<
		Deposit.Model,

		{
			user : model.Types.Ref< user_model.Default.HydratedDocument >

		}


	>

	export type Schema = database.Schema<
		Model,

		Deposit.Schema['methods']
		& {
			to_user(): Promise< user_model.Default.HydratedDocument >

		},

		// eslint-disable-next-line @typescript-eslint/no-empty-object-type
		{}

	>

	export type HydratedDocument = database.HydratedDocument<Schema>

}


// eslint-disable-next-line @stylistic/function-call-spacing
export const schema: Default.Schema = new Schema
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
			// eslint-disable-next-line @typescript-eslint/no-wrapper-object-types
			type    : model.Sensitive<String>,
			unique  : true,
			required: true,
			default : () => new model.Sensitive(secret.hex() ),

		},

		// 刷新令牌
		refresh: {
			// eslint-disable-next-line @typescript-eslint/no-wrapper-object-types
			type    : model.Sensitive<String>,
			unique  : true,
			required: true,
			default : () => new model.Sensitive(secret.hex() ),

		},

		// 过期时间
		expire: {
			type    : Date,
			expires : 300,
			required: true,
			default : () => new model.Sensitive(secret.delay(7200) ),

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


				this.value = new model.Sensitive(secret.hex() )
				this.refresh = new model.Sensitive(secret.hex() )

				this.expire = new model.Sensitive(secret.delay(7200) )

				await this.save()

				return this

			},


		},


	},


)


const drive = await database.Mongodb.default()

export default drive.model('Token', schema)
