import { URL, URLSearchParams } from 'node:url'

import config from 'config'
import moment from 'moment'
import * as axios from 'axios'

import * as reply from './reply.js'
import * as secret from './secret.js'
import * as detective from './detective.js'

const host = config.get<string>('host')


export type APIv3Option = {
	appid   : string
	mchid   : string
	v3key   : string
	sign    : string | Buffer
	evidence: string | Buffer
	verify  : string | Buffer

}

export type APIv3Sign = {
	serial   : [string, string]
	nonce    : string
	timestamp: number
	stringify: string
	plain    : string
	signature: string

}

export type APIv3ResultError = {
	code   : string
	message: string
	detail: {
		field   : string
		location: string
		detail  : { issue: string }

	}

}

export type APIv3NotifyBody = {
	id           : string
	create_time  : string
	event_type   : string
	resource_type: string
	summary      : string


	resource: {
		algorithm      : string
		ciphertext     : string
		associated_data: string
		original_type  : 'transaction' | 'refund'
		nonce          : string
	}

}




export class APIv3
{
	#appid: string

	#mchid: string

	#v3key: string

	#defend: secret.RSA

	#axios: axios.AxiosInstance

	constructor (option: APIv3Option)
	{
		if (typeof option.sign === 'string')
		{
			option.sign = Buffer.from(option.sign, 'base64')

		}

		if (typeof option.evidence === 'string')
		{
			option.evidence = Buffer.from(option.evidence, 'base64')

		}

		if (typeof option.verify === 'string')
		{
			option.verify = Buffer.from(option.verify, 'base64')

		}

		this.#appid = option.appid
		this.#mchid = option.mchid
		this.#v3key = option.v3key

		this.#defend = new secret.RSA(option.sign, option.evidence, option.verify)

		this.#axios = axios.default.create(
			// eslint-disable-next-line @typescript-eslint/naming-convention
			{ baseURL: 'https://api.mch.weixin.qq.com/' },

		)

	}

	get appid (): string
	{
		return this.#appid

	}

	get mchid (): string
	{
		return this.#mchid

	}

	get v3key (): string
	{
		return this.#v3key

	}

	get defend (): secret.RSA
	{
		return this.#defend

	}

	get axios (): axios.AxiosInstance
	{
		return this.#axios

	}

	on
	(
		name: 'update',

		listener: (name: 'sign' | 'verify', ctx: string | Buffer) => void,

	)
	: void


	on
	(
		name: 'create',

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		listener: (...args: any[]) => void,

	)
	: void

	on
	(
		name: string,

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		listener:(...args: any[]) => any,

	)
	: void
	{
		this.#defend.on(name, listener)

	}

	sign
	(
		url: string,
		method: 'GET' | 'PUT' | 'POST' | 'DELETE',
		data: unknown = null,
		params: Record<string, string> = {},

	)
	: APIv3Sign
	{
		let { serial } = this.#defend
		let search = new URLSearchParams(params).toString()

		let nonce = secret.hex()
		let timestamp = Math.floor(Date.now() / 1000)
		let stringify = ''

		if (search)
		{
			url = `${url}?${search}`

		}

		if (data instanceof Object)
		{
			stringify = JSON.stringify(data)

		}


		let plain = `${method}\n${url}\n${timestamp}\n${nonce}\n${stringify}\n`

		let signature = this.#defend.sign(plain).toString('base64')

		return { serial, nonce, timestamp, stringify, plain, signature }

	}

	verify
	(
		timestamp: number | string,
		nonce: string,
		data: unknown,
		signature: string | Buffer,

	)
	: boolean
	{
		let stringify = ''

		if (data instanceof Object)
		{
			stringify = JSON.stringify(data)

		}

		let verified = `${timestamp}\n${nonce}\n${stringify}\n`

		let signature_ = Buffer.isBuffer(signature) ? signature : Buffer.from(signature, 'base64')

		return this.#defend.verify(verified, signature_)

	}

	decrypt
	(
		cipher: string | Buffer,
		iv: string | Buffer,

		aad?: string | Buffer,

	)
	: Buffer
	{
		let gcm = new secret.AES_256_GCM(this.#v3key, iv)

		if (detective.is_exist(aad) )
		{
			gcm.aad = aad

		}

		return gcm.decrypt(cipher)

	}

	format
	(
		serial: string,
		nonce: string,
		timestamp: number,
		signature: string,

	)
	: string
	{
		let value = [
			`mchid="${this.#mchid}"`,
			`serial_no="${serial}"`,
			`nonce_str="${nonce}"`,
			`timestamp="${timestamp}"`,
			`signature="${signature}"`,
		]

		return `WECHATPAY2-SHA256-RSA2048 ${value.join(',')}`

	}

	async newsletter
	<T>
	(
		url: string,
		method: 'GET' | 'PUT' | 'POST' | 'DELETE',
		data: null | Record<string, unknown> = null,
		params: Record<string, string> = {},

	)
	: Promise<T>
	{
		let sign = this.sign(url, method, data, params)
		let [sign_serial, verify_serial] = sign.serial

		let headers = {
			// eslint-disable-next-line @typescript-eslint/naming-convention
			'Accept'         : 'application/json',
			// eslint-disable-next-line @typescript-eslint/naming-convention
			'Content-Type'   : 'application/json',
			// eslint-disable-next-line @typescript-eslint/naming-convention
			'Accept-Encoding': 'zlib',
			// eslint-disable-next-line @typescript-eslint/naming-convention
			'Authorization'  : this.format(sign_serial, sign.nonce, sign.timestamp, sign.signature),

		}

		try
		{
			let result = await this.#axios.request<T>(
				{ url, method, headers, params, data: sign.stringify },

			)

			let wechatpay_serial = `${result.headers['Wechatpay-Serial'] ?? result.headers['wechatpay-serial'] ?? ''}`
			let wechatpay_timestamp = `${result.headers['Wechatpay-Timestamp'] ?? result.headers['wechatpay-timestamp'] ?? ''}`
			let wechatpay_nonce = `${result.headers['Wechatpay-Nonce'] ?? result.headers['wechatpay-nonce'] ?? ''}`
			let wechatpay_signature = `${result.headers['Wechatpay-Signature'] ?? result.headers['wechatpay-signature'] ?? ''}`

			if (verify_serial !== wechatpay_serial)
			{
				await this.download()

			}

			this.verify(wechatpay_timestamp, wechatpay_nonce, result.data, wechatpay_signature)

			return result.data

		}

		catch (e)
		{
			if (axios.default.isAxiosError(e) )
			{
				let ee = new reply.BadRequest('Wepay APIv3 Newsletter Fail')

				if (e.response)
				{
					type APIv3ResultErrorData = APIv3ResultError & {
						detail: {
							sign_information: {
								method                : string
								sign_message_length   : number
								truncated_sign_message: string
								url                   : string
							}
						}

					}

					let result = e.response.data as APIv3ResultErrorData

					ee.message = result.message

					ee.push('sign', sign)
					ee.push('headers', headers)
					ee.push('data', data)
					ee.push('result', result)

				}

				throw ee

			}

			if (e instanceof Error)
			{
				throw new reply.BadRequest(e.message)

			}

			throw e

		}


	}

	async download (): Promise<void>
	{
		type Data = {
			serial_no          : string
			effective_time     : string
			expire_time        : string
			encrypt_certificate: {

				// 加密前的对象类型
				original_type: string

				// 加密算法
				algorithm: string

				// Base64编码后的密文
				ciphertext: string

				// 加密使用的随机串初始化向量）
				nonce: string

				// 附加数据包（可能为空）
				associated_data: string

			}

		}

		type AxiosResponse = {
			data: Data[]

		}

		const url = '/v3/certificates'
		const method = 'GET'

		let sign = this.sign(url, method)
		let [sign_serial] = sign.serial

		let headers = {
			// eslint-disable-next-line @typescript-eslint/naming-convention
			Authorization: this.format(sign_serial, sign.nonce, sign.timestamp, sign.signature),

		}

		let result = await this.axios.request<AxiosResponse>(
			{ url, method, headers },

		)

		let [data] = result.data.data

		let { ciphertext, nonce, associated_data } = data.encrypt_certificate

		let ctx = Buffer.from(ciphertext, 'base64')

		let plain = this.decrypt(ctx, nonce, associated_data)

		this.#defend.update('verify', plain)

	}


}


export type TransactionsTradeType = 'JSAPI' | 'NATIVE' | 'APP' | 'MICROPAY' | 'MWEB' | 'FACEPAY'

export type TransactionsTradeState = 'SUCCESS' | 'REFUND' | 'NOTPAY' | 'CLOSED' | 'REVOKED' | 'USERPAYING' | 'PAYERROR'

export type TransactionsCreateResult = {
	prepay_id: string

}

export type TransactionsRetrieveResult = {
	appid           : string
	mchid           : string
	out_trade_no    : string
	transaction_id? : string
	trade_type?     : TransactionsTradeType
	trade_state     : TransactionsTradeState
	trade_state_desc: string
	bank_type?      : string
	attach          : string
	success_time?   : string

	payer: {
		openid: string
	}

	amount: {
		total          : number
		payer_total    : number
		currency?      : string
		payer_currency?: string
	}

}

export type TransactionsCallupResult = {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	appId    : string
	// eslint-disable-next-line @typescript-eslint/naming-convention
	timeStamp: string
	// eslint-disable-next-line @typescript-eslint/naming-convention
	nonceStr : string
	package  : string
	// eslint-disable-next-line @typescript-eslint/naming-convention
	signType : 'RSA'
	// eslint-disable-next-line @typescript-eslint/naming-convention
	paySign  : string

}

export class Transactions extends APIv3
{
	create
	(
		out_trade_no: string,
		description: string,
		total: number,
		openid: string,

	)
	: Promise<TransactionsCreateResult>
	{
		description = Buffer.from(description)
			.subarray(0, 127)
			.toString()

		let appid = this.appid
		let mchid = this.mchid

		let notify_url = new URL(`/defray/${out_trade_no}/notify`, host).href

		let payer = { openid }
		let amount = { total: Math.floor(total * 100) }

		return this.newsletter<TransactionsCreateResult>(
			'/v3/pay/transactions/jsapi',

			'POST',

			{ appid, mchid, description, out_trade_no, notify_url, payer, amount },

		)

	}

	retrieve
	(out_trade_no: string): Promise<TransactionsRetrieveResult>
	{
		let mchid = this.mchid

		return this.newsletter<TransactionsRetrieveResult>(
			`/v3/pay/transactions/out-trade-no/${out_trade_no}`,

			'GET',

			null,

			{ mchid },

		)


	}

	delete
	(out_trade_no: string): Promise<null>
	{
		let mchid = this.mchid

		return this.newsletter<null>(
			`/v3/pay/transactions/out-trade-no/${out_trade_no}/close`,

			'POST',

			{ mchid },

		)


	}

	callup
	(prepay_id: string): TransactionsCallupResult
	{
		// eslint-disable-next-line @typescript-eslint/naming-convention
		let appId = this.appid
		// eslint-disable-next-line @typescript-eslint/naming-convention
		let timeStamp = Math.floor(Date.now() / 1000).toString()
		// eslint-disable-next-line @typescript-eslint/naming-convention
		let nonceStr = secret.hex()
		let package_ = `prepay_id=${prepay_id}`

		// eslint-disable-next-line @typescript-eslint/naming-convention
		const signType = 'RSA'

		let sgin = this.defend.sign(
			`${appId}\n${timeStamp}\n${nonceStr}\n${package_}\n`,

		)

		// eslint-disable-next-line @typescript-eslint/naming-convention
		let paySign = sgin.toString('base64')

		// eslint-disable-next-line @typescript-eslint/naming-convention
		return { appId, timeStamp, nonceStr, package: package_, signType, paySign }

	}

}

export type RefundChannel = 'ORIGINAL' | 'BALANCE' | 'OTHER_BALANCE' | 'OTHER_BANKCARD'

export type RefundStatus = 'SUCCESS' | 'CLOSED' | 'PROCESSING' | 'ABNORMAL'

export type RefundFundsAccount = 'UNSETTLED' | 'AVAILABLE' | 'UNAVAILABLE' | 'OPERATION' | 'BASIC'

export type RefundCreateResult = {
	refund_id            : string
	out_refund_no        : string
	transaction_id       : string
	out_trade_no         : string
	channel              : RefundChannel
	user_received_account: string
	success_time         : string
	create_time          : string
	status               : RefundStatus
	funds_account        : RefundFundsAccount

	amount: {
		total            : number
		refund           : number
		payer_total      : number
		payer_refund     : number
		settlement_refund: number
		settlement_total : number
		discount_refund  : number
		currency         : string
	}

}

export type RefundRetrieveResult = RefundCreateResult

export class Refund extends APIv3
{
	create
	(out_trade_no: string, total: number, refund: number, reason: string)
	: Promise<RefundCreateResult>
	{
		let out_refund_no = moment().format('YYDDDDHHmmssS')
		let notify_url = new URL(`/defray/${out_trade_no}/notify`, host).href


		let amount = {
			currency: 'CNY',
			refund  : Math.floor(refund * 100),
			total   : Math.floor(total * 100),

		}

		let data = { out_trade_no, out_refund_no, reason, notify_url, amount }

		return this.newsletter<RefundCreateResult>(
			'/v3/refund/domestic/refunds',

			'POST',

			data,

		)

	}

	retrieve
	(out_refund_no: string): Promise<RefundCreateResult>
	{
		return this.newsletter<RefundRetrieveResult>(
			`/v3/refund/domestic/refunds/${out_refund_no}`,

			'GET',

		)


	}

}
