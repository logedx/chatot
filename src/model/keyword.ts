/**
 * 关键字模型
 */
import pinyin from 'pinyin'

import { Schema, Model, Types, HydratedDocument } from 'mongoose'

import * as storage from '../lib/storage.js'

import * as weapp_model from './weapp.js'





export type TRawDocType = storage.TRawDocType<
	{
		weapp: Types.ObjectId
		model: string
		name: string
		value: string
		letter: string

	}

>

export type TPopulatePaths = {
	weapp: weapp_model.THydratedDocumentType

}

export type TVirtuals = object

export type TQueryHelpers = object

export type TInstanceMethods = object

export type TStaticMethods = {
	quiet_create(
		// eslint-disable-next-line no-use-before-define
		this: TModel,

		doc: {
			weapp: Types.ObjectId
			model: string
			name: string
			value: string

		},

	// eslint-disable-next-line no-use-before-define
	): Promise<null | THydratedDocumentType>

}

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
	type: String,
	index: true,
	required: true,
	uppercase: true,
	trim: true,
	validate: letter_match,

	set(value: string): string {
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

export const schema = new Schema<
	TRawDocType,
	TModel,
	TInstanceMethods,
	TQueryHelpers,
	TVirtuals

>(
	{
		weapp: {
			type: Schema.Types.ObjectId,
			ref: () => weapp_model.default,
			index: true,
			required: true,

		},

		model: {
			type: String,
			required: true,
			trim: true,

			validate(v: string): boolean {
				let k = v.toLowerCase()

				let name = drive.modelNames()

				return name.some(
					vv => vv.toLowerCase() === k,

				)

			},

		},

		name: {
			type: String,
			required: true,
			lowercase: true,
			trim: true,

		},

		value: {
			type: String,
			required: true,
			trim: true,

		},

		letter: letter_schema,


	},

)


schema.index(
	{ weapp: 1, model: 1, name: 1, value: 1 },

	{ unique: true, sparse: true },

)


schema.static(
	{
		quiet_create(doc) {
			return this.create(doc)
				.catch(
					() => null,

				)

		},

	},

)


export default drive.model('Keyword', schema)
