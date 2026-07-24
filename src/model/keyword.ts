/**
 * 关键字模型
 */
import pinyin from 'pinyin'

import { Schema } from 'mongoose'


import * as database from '../store/database.js'


import * as keyword from '../schema/keyword.js'


import * as weapp_model from './weapp.js'




// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Default
{
	export type Define = keyword.Default

	// eslint-disable-next-line @typescript-eslint/no-empty-object-type
	export type Methods = {}

	// eslint-disable-next-line @typescript-eslint/no-empty-object-type
	export type Statics = {}

	export type Schema = database.Schema<Default.Define, Default.Methods, Default.Statics>

	export type Keywords = database.Probe<Default.Define>

	export type Document = database.Document<Default.Schema>


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
export const default_schema: Default.Schema = new Schema
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


default_schema.index(
	{ weapp: 1, name: 1, color: 1, value: 1 },

	{ unique: true, sparse: true },

)


const drive = await database.Mongodb.default()

export default drive.model('Keyword', default_schema)


export type { Letter } from '../schema/keyword.js'
