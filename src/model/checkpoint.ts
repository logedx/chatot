/**
 * 检查点模型
 */
import { Schema, Document } from 'mongoose'

import * as axios from 'axios'


import * as model from '../lib/model.js'
import * as secret from '../lib/secret.js'

import * as database from '../store/database.js'


import * as user_model from './user.js'
import * as scope_model from './scope.js'
import * as weapp_model from './weapp.js'




// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Default
{
	export type Model = model.Define<
		{
			weapp: null | model.Types.Ref<weapp_model.Default.HydratedDocument>
			user : null | model.Types.Ref<user_model.Default.HydratedDocument>

			method  : Uppercase<axios.Method>
			original: string

			scope : number
			expire: Date

			context : unknown

		},

		{
			mode: scope_model.Mode

		}

	>

	export type Schema = database.Schema<
		Model,

		{
			hold(context: unknown): Promise<void>

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
			type   : Schema.Types.ObjectId,
			ref    : () => weapp_model.default,
			index  : true,
			default: null,

		},

		user: {
			type   : Schema.Types.ObjectId,
			ref    : () => user_model.default,
			index  : true,
			default: null,

		},

		method: {
			type    : String,
			required: true,
			trim    : true,
			set     : (v: string) => v.toUpperCase(),

		},

		original: {
			type    : String,
			required: true,
			trim    : true,

		},

		scope: {
			type    : Number,
			required: true,
			default : 0,

		},

		expire: {
			type    : Date,
			expires : 0,
			required: true,
			default : () => secret.delay(86400 * 365),

		},

		context: {
			type   : Schema.Types.Mixed,
			default: null,

		},

	},

	{
		virtuals: {
			mode: {
				get ()
				{
					return scope_model.vtmod(this.scope)

				},

			},


		},

		methods: {
			async hold (context)
			{
				if (context instanceof Document)
				{
					context = context.toObject()

				}

				await this.updateOne(
					{ context },

				)

			},


		},


	},


)


const drive = await database.Mongodb.default()

export default drive.model('Checkpoint', schema)
