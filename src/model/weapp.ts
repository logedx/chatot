/**
 * 小程序模型
 */
import ali_oss from 'ali-oss'
import { Schema, Model, HydratedDocument } from 'mongoose'


import * as reply from '../lib/reply.js'
import * as weapp from '../lib/weapp.js'
import * as wepay from '../lib/wepay.js'
import * as storage from '../lib/storage.js'
import * as detective from '../lib/detective.js'




export type TRawDocType = storage.TRawDocType<
	{
		appid: string
		bucket: string

		secret?: string
		mchid?: string
		v3key?: string
		sign?: string
		evidence?: string
		verify?: string
		token?: string
		refresh?: string
		expired?: Date

		closed: Date

	}

>

export type TPopulatePaths = object

export type TVirtuals = object

export type TQueryHelpers = object

export type TInstanceMethods = storage.TInstanceMethods<
	TRawDocType,

	{
		get_access_token(
			// eslint-disable-next-line no-use-before-define
			this: THydratedDocumentType,

		): Promise<string>

		get_wx_session(
			// eslint-disable-next-line no-use-before-define
			this: THydratedDocumentType,

			code: string,

		): Promise<weapp.WxSession>

		to_phone_number(
			// eslint-disable-next-line no-use-before-define
			this: THydratedDocumentType,

			code: string,

		): Promise<string>

		to_unlimited(
			// eslint-disable-next-line no-use-before-define
			this: THydratedDocumentType,

			path: string,
			scene: string,

		): Promise<weapp.Unlimited>

		to_ali_oss(
			// eslint-disable-next-line no-use-before-define
			this: THydratedDocumentType,

		): ali_oss

		to_api_v3_option(
			// eslint-disable-next-line no-use-before-define
			this: THydratedDocumentType,

		): Promise<
			storage.TRawDocTypeOverwrite<
				// eslint-disable-next-line no-use-before-define
				THydratedDocumentType,

				'mchid' | 'v3key' | 'sign' | 'evidence' | 'verify'

			>


		>

		get_transactions_api_v3(
			// eslint-disable-next-line no-use-before-define
			this: THydratedDocumentType,

		): Promise<wepay.Transactions>

		get_refund_api_v3(
			// eslint-disable-next-line no-use-before-define
			this: THydratedDocumentType,

		): Promise<wepay.Refund>


	}

>

export type THydratedDocumentType = HydratedDocument<TRawDocType, TVirtuals & TInstanceMethods>

export type TModel = Model<TRawDocType, TQueryHelpers, TInstanceMethods, TVirtuals>







const drive = await storage.mongodb()

export const schema = new Schema<
	TRawDocType,
	TModel,
	TInstanceMethods,
	TQueryHelpers,
	TVirtuals

>(
	{
		// 微信小程序APPID
		appid: {
			type: String,
			unique: true,
			required: true,
			trim: true,

		},

		// Object storage Service Bucket
		bucket: {
			type: String,
			unique: true,
			required: true,
			trim: true,

		},

		// 微信小程序SECRET
		secret: {
			type: String,
			select: false,
			required: true,
			trim: true,

		},

		// 微信支付MCHID
		mchid: {
			type: String,
			select: false,
			trim: true,
			default: '',

		},

		// API v3密钥
		v3key: {
			type: String,
			select: false,
			trim: true,
			default: '',

		},

		// 微信支付商户私钥
		sign: {
			type: String,
			select: false,
			trim: true,
			default: '',

		},

		// 微信支付商户证书
		evidence: {
			type: String,
			select: false,
			trim: true,
			default: '',

		},

		// 微信支付平台证书
		verify: {
			type: String,
			select: false,
			trim: true,
			default: '',

		},

		// 微信接口调用令牌 
		token: {
			type: String,
			select: false,
			trim: true,
			default: '',

		},

		// 微信接口调用令牌刷新令牌
		refresh: {
			type: String,
			select: false,
			trim: true,
			default: '',

		},

		// 微信接口调用令牌过期时间
		expired: {
			type: Date,
			select: false,
			default: null,

		},

		// 关停日期
		closed: {
			type: Date,
			default: null,

		},

	},

)


schema.index(
	{ closed: 1, created: -1 },

)



schema.method(
	{
		async get_access_token() {
			let doc = await this.select_sensitive_fields('+secret', '+token', '+refresh', '+expired')

			if (doc.token && doc.expired > new Date()

			) {
				return doc.token

			}

			if (doc.secret) {
				let result = await weapp.get_access_token(doc.appid, doc.secret)

				await doc.updateOne(result)

				return result.token

			}

			throw new reply.NotFound('access token is not exist')

		},

		async get_wx_session(code) {
			let doc = await this.select_sensitive_fields('+secret')

			return weapp.get_wx_session(doc.appid, doc.secret, code)


		},

		async to_unlimited(path, scene) {
			let token = await this.get_access_token()

			return weapp.get_unlimited(token, path, scene)

		},

		async to_phone_number(code) {
			let token = await this.get_access_token()

			return weapp.get_phone_number(token, code)

		},

		to_ali_oss() {
			const client = storage.ali_oss()

			client.useBucket(this.bucket)

			return client

		},

		to_api_v3_option() {
			return this.select_sensitive_fields('+mchid', '+v3key', '+sign', '+evidence', '+verify')

		},

		async get_transactions_api_v3() {
			let option = await this.to_api_v3_option()

			let trans = new wepay.Transactions(option)

			trans.on(
				'update',

				async (name, ctx) => {
					if (detective.is_string(ctx)

					) {
						ctx = Buffer.from(ctx)

					}

					await this.updateOne(
						{ [name]: ctx },

					)

				},
			)

			return trans

		},

		async get_refund_api_v3() {
			let option = await this.to_api_v3_option()

			return new wepay.Refund(option)

		},

	},


)


export default drive.model('Weapp', schema)
