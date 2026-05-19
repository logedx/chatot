/**
 * 关键字模型
 */
import pinyin from 'pinyin'

import { Schema } from 'mongoose'


import * as model from '../lib/model.js'

import * as database from '../store/database.js'


import * as weapp_model from './weapp.js'




// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Default
{
	export type Model = model.Define<
		{
			weapp : model.Types.Ref<weapp_model.Default.HydratedDocument>

			name  : string
			color : string
			value : model.Types.Keyword<string>
			letter: string

		},

		// eslint-disable-next-line @typescript-eslint/no-empty-object-type
		{}

	>

	export type Schema = database.Schema<
		Model,

		// eslint-disable-next-line @typescript-eslint/no-empty-object-type
		{},

		// eslint-disable-next-line @typescript-eslint/no-empty-object-type
		{}

	>

	export type HydratedDocument = database.HydratedDocument<Schema>

}


/**
 * 拼音首字母校验规则
 */
export const letter_match = /^[a-zA-Z#]{1}$/


/**
 * 首字母模型
 */
export const letter_schema = {
	type     : String,
	index    : true,
	required : true,
	uppercase: true,
	trim     : true,
	validate : letter_match,

	set (value: string): string
	{
		let p = pinyin.default(
			value,

			{
				style: 'FIRST_LETTER',

			},

		)

		let [x] = p[0]?.[0] ?? '#'

		return letter_match.test(x) ? x : '#'

	},

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

		name: {
			type     : String,
			index    : true,
			required : true,
			lowercase: true,
			trim     : true,

			validate: /^[a-z]+(\.[a-z0-9]+)*$/,

		},

		color: {
			type     : String,
			lowercase: true,
			trim     : true,
			default  : '',

		},

		value: {
			type    : String,
			required: true,
			trim    : true,

		},

		letter: letter_schema,


	},

)


schema.index(
	{ weapp: 1, name: 1, color: 1, value: 1 },

	{ unique: true, sparse: true },

)


const drive = await database.Mongodb.default()

export default drive.model('Keyword', schema)
