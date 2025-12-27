/**
 * 检查点模型
 */
import { Schema, Types, Document } from 'mongoose'

import * as axios from 'axios'


import * as secret from '../lib/secret.js'

import * as database from '../store/database.js'


import * as user_model from './user.js'
import * as scope_model from './scope.js'
import * as weapp_model from './weapp.js'





export type Tm = database.Tm<
	{
		scope   : number
		weapp   : null | Types.ObjectId
		user    : null | Types.ObjectId
		method  : Uppercase<axios.Method>
		original: string
		expire  : Date
		context : null | Schema.Types.Mixed

	},

	{
		mode: scope_model.Mode

	},

	{
		hold(context: unknown): Promise<void>

	}

>

export type TPopulatePaths = {
	weapp: null | weapp_model.Tm['HydratedDocument']
	user : null | user_model.Tm['HydratedDocument']

}




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
		scope: {
			type    : Number,
			required: true,
			default : 0,

		},

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

)


schema.virtual('mode').get(
	function (): Tm['TVirtuals']['mode']
	{
		return scope_model.vtmod(this.scope)

	},

)


schema.method(
	'hold',

	// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
	<Tm['TInstanceMethods']['hold']>
	async function (context)
	{
		if (context instanceof Document)
		{
			context = context.toObject()

		}

		await this.updateOne(
			{ context: context as Schema.Types.Mixed },

		)

	},


)


export default drive.model('Checkpoint', schema) as Tm['Model']
