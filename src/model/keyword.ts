/**
 * 关键字模型
 */
import pinyin from 'pinyin'

import { Schema, Model, Types, HydratedDocument } from 'mongoose'

import * as storage from '../lib/storage.js'

import * as weapp_model from './weapp.js'





export type TRawDocType = storage.TRawDocType<
	{
		weapp : Types.ObjectId
		name  : string
		label : string
		value : string
		letter: string

	}

>

export type TPopulatePaths = {
	weapp: weapp_model.THydratedDocumentType

}

export type TVirtuals = object

export type TQueryHelpers = object

export type TInstanceMethods = object

export type TStaticMethods = object

export type THydratedDocumentType = HydratedDocument<TRawDocType, TVirtuals >

export type TModel = Model<TRawDocType, TQueryHelpers, TInstanceMethods, TVirtuals>





const drive = await storage.mongodb()

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

export const schema = new Schema
<
	TRawDocType,
	TModel,
	TInstanceMethods,
	TQueryHelpers,
	TVirtuals,
	TStaticMethods

// eslint-disable-next-line func-call-spacing
>
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

		label: {
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
	{ weapp: 1, name: 1, label: 1, value: 1 },

	{ unique: true, sparse: true },

)


export default drive.model('Keyword', schema)
