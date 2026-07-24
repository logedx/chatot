/**
 * 用户模型
 */
import moment from 'moment'

import { Schema } from 'mongoose'


import * as detective from '../lib/detective.js'

import * as database from '../store/database.js'


import * as user from '../schema/user.js'

import * as scope_model from './scope.js'
import * as token_model from './token.js'
import * as weapp_model from './weapp.js'




// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Default
{
	export type Define = user.Default

	export type Methods = {
		shine(): Promise<void>

		overcast(): Promise<void>

		authorize(expire?: Date): Promise<void>

	}

	// eslint-disable-next-line @typescript-eslint/no-empty-object-type
	export type Statics = {}

	export type Schema = database.Schema<Default.Define, Default.Methods, Default.Statics>

	export type Keywords = database.Probe<Default.Define>

	export type Document = database.Document<Default.Schema>


}


// eslint-disable-next-line @stylistic/function-call-spacing
export const default_schema: Default.Schema = new Schema
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
			type     : database.Sensitive,
			index    : true,
			sparse   : true,
			lowercase: true,
			trim     : true,

		},

		// 微信标识符
		wxopenid: {
			type    : database.Sensitive,
			unique  : true,
			required: true,
			trim    : true,

		},

		// 微信会话
		wxsession: {
			type    : database.Sensitive,
			unique  : true,
			required: true,
			trim    : true,

		},

		// 权限范围
		scope: {
			type   : database.Sensitive,
			default: null,

		},

	},

	{
		methods: {
			async shine ()
			{
				this.active = detective.is_phone_number_string(this.phone)

				await this.save()

			},

			async overcast ()
			{
				this.active = false

				await this.save()

			},

			// eslint-disable-next-line @stylistic/newline-per-chained-call
			async authorize (expire = moment().add(1, 'w').toDate() )
			{
				if (detective.is_empty(this.scope.value) )
				{
					this.scope.update(
						{ value: scope_model.Role.运营 } as scope_model.Default.Define,

					)

				}


				this.scope.value!.value = scope_model.mixed(
					this.scope.value!.value,

					scope_model.Role.运营,

				)

				this.scope.value!.expire = expire


				await this.save()

				await token_model.default.findOneAndUpdate(
					{ user: this._id },

					{ scope: this.scope.value!.value },

				)


			},


		},


	},


)


default_schema.index(
	{ weapp: 1, created: -1 },

)

default_schema.index(
	{ weapp: 1, phone: 1 },

	{
		unique: true,

		// eslint-disable-next-line @typescript-eslint/naming-convention
		partialFilterExpression: {
			$and: [{ weapp: { $exists: true } }, { phone: { $exists: true } }],

		},

	},

)

default_schema.index(
	// eslint-disable-next-line @typescript-eslint/naming-convention
	{ 'scope.lock': 1, 'scope.expired': -1 },

)


const drive = await database.Mongodb.default()

export default drive.model('User', default_schema)
