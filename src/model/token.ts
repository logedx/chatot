/**
 * 令牌模型
 */
import { Schema, Model, Types, HydratedDocument } from 'mongoose'

import * as storage from '../lib/storage.js'
import * as detective from '../lib/detective.js'

import * as reply from '../lib/reply.js'
import * as secret from '../lib/secret.js'

import * as user_model from './user.js'
import * as weapp_model from './weapp.js'





export type TRawDocType = storage.TRawDocType<
	{
		scope: number

		weapp: null | Types.ObjectId
		user: null | Types.ObjectId

		value: string
		refresh: string

		expire: Date

	}

>

export type TPopulatePaths = {
	weapp: null | weapp_model.THydratedDocumentType
	user: null | user_model.THydratedDocumentType

}

export type TVirtuals = {
	is_super: boolean

	is_usable: boolean
	is_survive: boolean

}

export type TQueryHelpers = object

export type TInstanceMethods = {
	replenish(
		// eslint-disable-next-line no-use-before-define
		this: THydratedDocumentType,

		value?: string,

		// eslint-disable-next-line no-use-before-define
	): Promise<THydratedDocumentType>

	to_user(
		// eslint-disable-next-line no-use-before-define
		this: THydratedDocumentType,

	): Promise<user_model.THydratedDocumentType>

	to_weapp(
		// eslint-disable-next-line no-use-before-define
		this: THydratedDocumentType,

	): Promise<weapp_model.THydratedDocumentType>

	to_usable(
		// eslint-disable-next-line no-use-before-define
		this: THydratedDocumentType,

		// eslint-disable-next-line no-use-before-define
	): TSurviveHydratedDocumentType

	to_survive(
		// eslint-disable-next-line no-use-before-define
		this: THydratedDocumentType,

		// eslint-disable-next-line no-use-before-define
	): TSurviveHydratedDocumentType

}

export type THydratedDocumentType = HydratedDocument<TRawDocType, TVirtuals & TInstanceMethods>

export type TModel = Model<TRawDocType, TQueryHelpers, TInstanceMethods, TVirtuals>


export type TSurviveHydratedDocumentType = HydratedDocument<
	Omit<TRawDocType, 'user' | 'weapp'> & { user: Types.ObjectId, weapp: Types.ObjectId },

	TVirtuals & TInstanceMethods

>






const drive = await storage.mongodb()

export const schema = new Schema<
	TRawDocType,
	TModel,
	TInstanceMethods,
	TQueryHelpers,
	TVirtuals

>(
	{
		//  权限范围
		scope: {
			type: Number,
			required: true,
			default: 0,

		},

		weapp: {
			type: Schema.Types.ObjectId,
			ref: () => weapp_model.default,
			default: null,

		},

		user: {
			type: Schema.Types.ObjectId,
			ref: () => user_model.default,
			default: null,

		},

		value: {
			type: String,
			unique: true,
			required: true,
			trim: true,
			default: () => secret.hex(),

		},

		// 刷新令牌
		refresh: {
			type: String,
			unique: true,
			required: true,
			trim: true,
			default: () => secret.hex(),

		},

		// 过期时间
		expire: {
			type: Date,
			expires: 0,
			required: true,
			default: () => delay(),

		},

	},

)

schema.virtual('is_super').get(
	function (): TVirtuals['is_super'] {
		return this.scope > 0

	},

)

schema.virtual('is_usable').get(
	function (): TVirtuals['is_usable'] {
		return this.expire > new Date()

	},

)

schema.virtual('is_survive').get(
	function (): TVirtuals['is_survive'] {
		let is_expired = this.expire > new Date()
		let is_anonymous = detective.is_null(this.user) || detective.is_null(this.weapp)

		return is_expired && !is_anonymous

	},

)


schema.method(
	{
		async replenish() {
			if (
				this.expire > delay(-3600)

			) {
				throw new reply.Unauthorized('value is expired')

			}

			this.expire = delay()
			this.refresh = secret.hex()

			await this.save()

			return this
		},

		async to_user() {
			let doc = await this.populate<
				Pick<TPopulatePaths, 'user'>

			>('user')


			reply.NotFound.asserts(doc.user, 'user is not exist')

			return doc.user

		},

		async to_weapp() {
			let doc = await this.populate<
				Pick<TPopulatePaths, 'weapp'>

			>('weapp')


			reply.NotFound.asserts(doc.weapp, 'weapp is not exist')

			return doc.weapp

		},

		to_usable() {
			if (this.is_usable) {
				return this as TSurviveHydratedDocumentType

			}

			throw new reply.Unauthorized('authentication failed')

		},

		to_survive() {
			if (this.is_survive) {
				return this as TSurviveHydratedDocumentType

			}

			throw new reply.Unauthorized('authentication failed')

		},

	},


)

const model = drive.model('Token', schema)


export default model


/**
 * 获取延迟时间
 */
export function delay(second = 7200): Date {
	let d = new Date()

	d.setSeconds(d.getSeconds() + second)

	return d

}