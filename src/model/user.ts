/**
 * 用户模型
 */
import moment from 'moment'

import { Schema } from 'mongoose'


import * as model from '../lib/model.js'
import * as detective from '../lib/detective.js'

import * as database from '../store/database.js'


import * as scope_model from './scope.js'
import * as token_model from './token.js'
import * as weapp_model from './weapp.js'




// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Default
{
	export type Model = model.Define<
		{
			weapp: model.Types.Ref<weapp_model.Default.HydratedDocument>

			active: boolean

			avatar  : string
			nickname: model.Types.Keyword<string>
			color   : string

			phone: model.Types.Keyword< model.Types.Sensitive<string> >

			wxopenid : model.Types.Sensitive<string>
			wxsession: model.Types.Sensitive<string>

			scope: null | model.Types.Sensitive<scope_model.Default.HydratedDocument>

		},

		// eslint-disable-next-line @typescript-eslint/no-empty-object-type
		{}

	>

	export type Schema = database.Schema<
		Model,

		{
			shine(): Promise<void>

			overcast(): Promise<void>

			authorize(expire?: Date): Promise<void>

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
			// eslint-disable-next-line @typescript-eslint/no-wrapper-object-types
			type     : model.Sensitive<String>,
			index    : true,
			sparse   : true,
			lowercase: true,
			trim     : true,

		},

		// 微信标识符
		wxopenid: {
			// eslint-disable-next-line @typescript-eslint/no-wrapper-object-types
			type     : model.Sensitive<String>,
			unique  : true,
			required: true,
			trim    : true,

		},

		// 微信会话
		wxsession: {
			// eslint-disable-next-line @typescript-eslint/no-wrapper-object-types
			type     : model.Sensitive<String>,
			unique  : true,
			required: true,
			trim    : true,

		},

		// 权限范围
		scope: {
			type   : scope_model.default,
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

			async authorize (
				// eslint-disable-next-line @stylistic/newline-per-chained-call
				expire = moment().add(1, 'w').toDate(),

			)
			{
				if (this.scope)
				{
					this.scope.value.value = scope_model.mixed(
						this.scope.value.value,

						scope_model.Role.运营,

					)

				}

				else
				{
					this.scope = new model.Sensitive(
						{ value: scope_model.Role.运营 } as scope_model.Default.HydratedDocument,

					)

				}

				this.scope.value.expire = expire


				await this.save()

				await token_model.default.findOneAndUpdate(
					{ user: this._id },

					{ scope: this.scope.value.value },

				)


			},


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


const drive = await database.Mongodb.default()

export default drive.model('User', schema)
