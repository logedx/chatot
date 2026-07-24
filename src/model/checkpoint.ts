/**
 * 检查点模型
 */
import { Schema, Document } from 'mongoose'


import * as secret from '../lib/secret.js'

import * as database from '../store/database.js'


import * as checkpoint from '../schema/checkpoint.js'


import * as user_model from './user.js'
import * as scope_model from './scope.js'
import * as weapp_model from './weapp.js'




export namespace Default
{
	export type Define = checkpoint.Default

	export type Methods = {
		hold(context: unknown): Promise<void>

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

export default drive.model('Checkpoint', default_schema)


export type { Method } from '../schema/checkpoint.js'
