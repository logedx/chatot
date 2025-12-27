/**
 * 小程序模型
 */
import { Schema } from 'mongoose'


import * as reply from '../lib/reply.js'
import * as weapp from '../lib/weapp.js'
import * as wepay from '../lib/wepay.js'
import * as storage from '../lib/storage.js'
import * as detective from '../lib/detective.js'

import * as oss from '../store/oss.js'




export type Tm = storage.Tm<
	{
		appid : string
		bucket: string

		secret?  : string
		mchid?   : string
		v3key?   : string
		sign?    : string
		evidence?: string
		verify?  : string
		token?   : string
		refresh? : string
		expired? : Date

		closed: Date

	},

	object,

	{
		get_access_token(force?: true): Promise<string>

		to_wx_session(code: string): Promise<weapp.WxSession>

		to_phone_number(code: string): Promise<string>

		to_unlimited
		(path: string, scene: string): Promise<weapp.Unlimited>

		to_oss(): oss.OSS

		to_api_v3_option()
		: Promise<
			storage.TDocTypeOverwrite<
				Tm['HydratedDocument'],

				'mchid' | 'v3key' | 'sign' | 'evidence' | 'verify'

			>


		>

		to_transactions_api_v3(): Promise<wepay.Transactions>

		to_refund_api_v3(): Promise<wepay.Refund>

		send_subscribe_message
		(wxopenid: string, template: string, page: string, data: Record<string, string>): Promise<void>


	}


>





const drive = await storage.mongodb()

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
			type    : String,
			select  : false,
			required: true,
			trim    : true,

		},

		// 微信支付MCHID
		mchid: {
			type   : String,
			select : false,
			trim   : true,
			default: '',

		},

		// API v3密钥
		v3key: {
			type   : String,
			select : false,
			trim   : true,
			default: '',

		},

		// 微信支付商户私钥
		sign: {
			type   : String,
			select : false,
			trim   : true,
			default: '',

		},

		// 微信支付商户证书
		evidence: {
			type   : String,
			select : false,
			trim   : true,
			default: '',

		},

		// 微信支付平台证书
		verify: {
			type   : String,
			select : false,
			trim   : true,
			default: '',

		},

		// 微信接口调用令牌 
		token: {
			type   : String,
			select : false,
			trim   : true,
			default: '',

		},

		// 微信接口调用令牌刷新令牌
		refresh: {
			type   : String,
			select : false,
			trim   : true,
			default: '',

		},

		// 微信接口调用令牌过期时间
		expired: {
			type   : Date,
			select : false,
			default: null,

		},

		// 关停日期
		closed: {
			type   : Date,
			default: null,

		},

	},

)


schema.index(
	{ closed: 1, created: -1 },

)


schema.method(
	'get_access_token',

	// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
	<Tm['TInstanceMethods']['get_access_token']>
	async function (force)
	{
		let doc = await this.select_sensitive_fields('+secret', '+token', '+refresh', '+expired')

		if (force !== true && doc.token && doc.expired > new Date() )
		{
			return doc.token

		}

		if (detective.is_empty(doc.secret) )
		{
			throw new reply.NotFound('secret is empty')

		}


		let result = await weapp.get_access_token(doc.appid, doc.secret, force)

		await doc.updateOne(result)

		return result.token


	},


)

schema.method(
	'to_wx_session',

	// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
	<Tm['TInstanceMethods']['to_wx_session']>
	async function (code)
	{
		let doc = await this.select_sensitive_fields('+secret')

		return weapp.get_wx_session(doc.appid, doc.secret, code)


	},


)

schema.method(
	'to_unlimited',

	// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
	<Tm['TInstanceMethods']['to_unlimited']>
	async function (path, scene)
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


)

schema.method(
	'to_phone_number',

	// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
	<Tm['TInstanceMethods']['to_phone_number']>
	async function (code)
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



)

schema.method(
	'to_oss',

	// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
	<Tm['TInstanceMethods']['to_oss']>
	function ()
	{
		return oss.OSS.new(this.bucket)

	},


)

schema.method(
	'to_api_v3_option',

	// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
	<Tm['TInstanceMethods']['to_api_v3_option']>
	function ()
	{
		return this.select_sensitive_fields('+mchid', '+v3key', '+sign', '+evidence', '+verify')

	},


)

schema.method(
	'to_transactions_api_v3',

	// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
	<Tm['TInstanceMethods']['to_transactions_api_v3']>
	async function ()
	{
		let option = await this.to_api_v3_option()

		let trans = new wepay.Transactions(option)

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


)

schema.method(
	'to_refund_api_v3',

	// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
	<Tm['TInstanceMethods']['to_refund_api_v3']>
	async function ()
	{
		let option = await this.to_api_v3_option()

		return new wepay.Refund(option)

	},


)

schema.method(
	'send_subscribe_message',

	// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
	<Tm['TInstanceMethods']['send_subscribe_message']>
	async function (wxopenid, template, page, data)
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


)


export default drive.model('Weapp', schema) as Tm['Model']
