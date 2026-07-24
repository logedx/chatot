/**
 * 小程序模型
 */
import { Schema } from 'mongoose'


import * as reply from '../lib/reply.js'
import * as wxpay from '../lib/wxpay.js'
import * as wxopen from '../lib/wxopen.js'
import * as detective from '../lib/detective.js'

import * as oss from '../store/oss.js'
import * as database from '../store/database.js'

import * as weapp from '../schema/weapp.js'




export namespace Default
{
	export type Define = weapp.Default

	export type Methods = {
		to_oss(): oss.OSS

		to_transactions_api_v3(): wxpay.Transactions

		to_refund_api_v3(): wxpay.Refund

		to_weapp_session(code: string): Promise<wxopen.WeappSession>

		to_weapp_phone_number(code: string): Promise<string>

		to_weapp_unlimited
		(path: string, scene: string): Promise<wxopen.WeappUnlimited>

		send_weapp_subscribe_message
		(wxopenid: string, template: string, page: string, data: Record<string, string>): Promise<void>

		get_weapp_access_token(force?: true): Promise<string>

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
			type    : database.Sensitive,
			required: true,

		},

		// 微信支付MCHID
		mchid: database.Sensitive,

		// API v3密钥
		v3key: database.Sensitive,

		// 微信支付商户私钥
		sign: database.Sensitive,

		// 微信支付商户证书
		evidence: database.Sensitive,

		// 微信支付平台证书
		verify: database.Sensitive,

		// 微信接口调用令牌 
		token: database.Sensitive,

		// 微信接口调用令牌刷新令牌
		refresh: database.Sensitive,

		// 微信接口调用令牌过期时间
		expired: database.Sensitive,

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

					return new database.Sensitive(
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
			to_oss ()
			{
				return oss.OSS.new(this.bucket)

			},

			to_transactions_api_v3 ()
			{
				let trans = new wxpay.Transactions(this.appid, this.api_v3_option.value)

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
				return new wxpay.Refund(this.appid, this.api_v3_option.value)

			},

			async to_weapp_session (code)
			{
				if (detective.is_empty(this.secret) )
				{
					throw new reply.NotFound('secret is empty')

				}

				return wxopen.get_weapp_session(this.appid, this.secret.value, code)


			},

			async to_weapp_unlimited (path, scene)
			{
				let token = await this.get_weapp_access_token()

				try
				{
					return await wxopen.get_weapp_unlimited(token, path, scene)

				}

				catch
				{
					token = await this.get_weapp_access_token(true)


				}

				return wxopen.get_weapp_unlimited(token, path, scene)

			},

			async to_weapp_phone_number (code)
			{
				let token = await this.get_weapp_access_token()

				try
				{
					return await wxopen.get_weapp_phone_number(token, code)

				}

				catch
				{
					token = await this.get_weapp_access_token(true)

				}

				return wxopen.get_weapp_phone_number(token, code)

			},

			async send_weapp_subscribe_message (wxopenid, template, page, data)
			{
				let token = await this.get_weapp_access_token()

				await wxopen.send_weapp_subscribe_message(
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

			async get_weapp_access_token (force)
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


				let result = await wxopen.get_weapp_access_token(this.appid, this.secret.value, force)

				await this.updateOne(result)

				return result.token

			},


		},


	},


)


default_schema.index(
	{ closed: 1, created: -1 },

)


const drive = await database.Mongodb.default()

export default drive.model('Weapp', default_schema)
