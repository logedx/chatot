/**
 * 小程序模型
 */
import { Schema } from 'mongoose'


import * as model from '../lib/model.js'
import * as reply from '../lib/reply.js'
import * as weapp from '../lib/weapp.js'
import * as wepay from '../lib/wepay.js'
import * as detective from '../lib/detective.js'

import * as oss from '../store/oss.js'
import * as database from '../store/database.js'




// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Default
{
	export type Model = model.Define<
		{
			appid : string
			bucket: string

			secret  : model.Types.Sensitive<string>
			mchid   : model.Types.Sensitive<string>
			v3key   : model.Types.Sensitive<string>
			sign    : model.Types.Sensitive<string | model.Types.Buffer>
			evidence: model.Types.Sensitive<string | model.Types.Buffer>
			verify  : model.Types.Sensitive<string | model.Types.Buffer>
			token   : model.Types.Sensitive<string>
			refresh : model.Types.Sensitive<string>
			expired : model.Types.Sensitive<null | Date>

			closed: Date

		},

		{
			api_v3_option: model.Types.Sensitive<
				{
					mchid   : string
					v3key   : string
					sign    : string | model.Types.Buffer
					evidence: string | model.Types.Buffer
					verify  : string | model.Types.Buffer

				}

			>

		}

	>

	export type Schema = database.Schema<
		Model,

		{
			get_access_token(force?: true): Promise<string>

			to_wx_session(code: string): Promise<weapp.WxSession>

			to_phone_number(code: string): Promise<string>

			to_unlimited
			(path: string, scene: string): Promise<weapp.Unlimited>

			to_oss(): oss.OSS

			to_transactions_api_v3(): wepay.Transactions

			to_refund_api_v3(): wepay.Refund

			send_subscribe_message
			(wxopenid: string, template: string, page: string, data: Record<string, string>): Promise<void>


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
		// 微信小程序APPID
		appid: {
			type    : String,
			unique  : true,
			required: true,
			trim    : true,

		},

		// Object storage Service Bucket
		bucket: {
			type    : String,
			unique  : true,
			required: true,
			trim    : true,

		},

		// 微信小程序SECRET
		secret: {
			// eslint-disable-next-line @typescript-eslint/no-wrapper-object-types
			type    : model.Sensitive<String>,
			required: true,

		},

		// 微信支付MCHID
		// eslint-disable-next-line @typescript-eslint/no-wrapper-object-types
		mchid: model.Sensitive<String>,

		// API v3密钥
		// eslint-disable-next-line @typescript-eslint/no-wrapper-object-types
		v3key: model.Sensitive<String>,

		// 微信支付商户私钥
		// eslint-disable-next-line @typescript-eslint/no-wrapper-object-types
		sign: model.Sensitive<String>,

		// 微信支付商户证书
		// eslint-disable-next-line @typescript-eslint/no-wrapper-object-types
		evidence: model.Sensitive<String>,

		// 微信支付平台证书
		// eslint-disable-next-line @typescript-eslint/no-wrapper-object-types
		verify: model.Sensitive<String>,

		// 微信接口调用令牌 
		// eslint-disable-next-line @typescript-eslint/no-wrapper-object-types
		token: model.Sensitive<String>,

		// 微信接口调用令牌刷新令牌
		refresh: model.Sensitive<string>,

		// 微信接口调用令牌过期时间
		expired: model.Sensitive<null | Date>,

		// 关停日期
		closed: {
			type   : Date,
			default: null,

		},

	},

	{
		virtuals: {
			api_v3_option: {
				get ()
				{
					if (detective.is_empty(this.mchid.value)
						|| detective.is_empty(this.v3key.value)
						|| detective.is_empty(this.sign.value)
						|| detective.is_empty(this.evidence.value)
						|| detective.is_empty(this.verify.value)

					)
					{
						throw new reply.NotFound('options is missing')

					}

					return new model.Sensitive(
						{
							mchid   : this.mchid.value,
							v3key   : this.v3key.value,
							sign    : this.sign.value,
							evidence: this.evidence.value,
							verify  : this.verify.value,

						},

					)

				},

			},

		},

		methods: {
			async get_access_token (force)
			{
				if (force !== true
					&& detective.is_required_string(this.token.value)
					&& detective.is_date(this.expired.value)
					&& this.expired.value > new Date()

				)
				{
					return this.token.value

				}

				if (detective.is_empty(this.secret) )
				{
					throw new reply.NotFound('secret is empty')

				}


				let result = await weapp.get_access_token(this.appid, this.secret.value, force)

				await this.updateOne(result)

				return result.token

			},

			async to_wx_session (code)
			{
				if (detective.is_empty(this.secret) )
				{
					throw new reply.NotFound('secret is empty')

				}

				return weapp.get_wx_session(this.appid, this.secret.value, code)


			},

			async to_unlimited (path, scene)
			{
				let token = await this.get_access_token()

				try
				{
					return await weapp.get_unlimited(token, path, scene)

				}

				catch
				{
					token = await this.get_access_token(true)


				}

				return weapp.get_unlimited(token, path, scene)

			},

			async to_phone_number (code)
			{
				let token = await this.get_access_token()

				try
				{
					return await weapp.get_phone_number(token, code)

				}

				catch
				{
					token = await this.get_access_token(true)

				}

				return weapp.get_phone_number(token, code)

			},

			to_oss ()
			{
				return oss.OSS.new(this.bucket)

			},

			to_transactions_api_v3 ()
			{
				let trans = new wepay.Transactions(this.appid, this.api_v3_option.value)

				trans.on(
					'update',

					async (name, ctx) =>
					{
						if (detective.is_string(ctx) )
						{
							ctx = Buffer.from(ctx)

						}

						await this.updateOne(
							{ [name]: ctx },

						)

					},
				)

				return trans

			},

			to_refund_api_v3 ()
			{
				return new wepay.Refund(this.appid, this.api_v3_option.value)

			},

			async send_subscribe_message (wxopenid, template, page, data)
			{
				let token = await this.get_access_token()

				await weapp.send_subscribe_message(
					token,
					wxopenid,
					template,
					page,

					Object.keys(data)
						.reduce(
							// eslint-disable-next-line no-return-assign
							(a, b) => (a[b] = { value: data[b] }, a),

							{} as Record<string, { value: string }>,

						),

				)

			},


		},


	},


)


schema.index(
	{ closed: 1, created: -1 },

)


const drive = await database.Mongodb.default()

export default drive.model('Weapp', schema)
