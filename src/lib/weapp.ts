import * as http from 'node:http'

import mime_types from 'mime-types'
import axios, { isAxiosError } from 'axios'

import * as reply from './reply.js'
import * as detective from './detective.js'


const wxopen_api = axios.create(
	// eslint-disable-next-line @typescript-eslint/naming-convention
	{ baseURL: 'https://api.weixin.qq.com/' },

)




type WxopenAPIErrorResult = {
	errcode: number
	errmsg : string

}


function is_wxopen_api_error_result (v: unknown): v is WxopenAPIErrorResult
{
	return detective.is_object(v)
		&& detective.is_number(v.errcode)
		&& detective.is_string(v.errmsg)
		&& v.errcode > 0

}

wxopen_api.interceptors.response.use(
	res =>
	{
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		let { data } = res

		if (is_wxopen_api_error_result(data) === true)
		{
			let e = new reply.BadRequest('wxopen api request failed')

			e.push('data', data)

			throw e

		}

		return res


	},

	res =>
	{
		let e = new reply.BadRequest()

		if (res instanceof Error)
		{
			e.message = res.message

		}

		if (isAxiosError(res) )
		{
			if (res.response)
			{
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				let { data } = res.response

				if (data instanceof Error)
				{
					e.message = data.message

				}

				if (is_wxopen_api_error_result(data) )
				{
					e.message = data.errmsg

				}

			}


		}

		return Promise.reject(e)

	},

)


export type AccessToken = {
	token  : string
	expired: Date
}

/**
 * 获取授权方接口调用令牌
 */
export async function get_access_token
(appid: string, secret: string, force_refresh = false): Promise<AccessToken>
{
	type Result = {
		access_token: string
		expires_in  : string
	}


	let { data } = await wxopen_api.post<Result>(
		'/cgi-bin/stable_token ',

		{ appid, secret, force_refresh, grant_type: 'client_credential' },

	)


	let token = data.access_token
	let expired = new Date()

	expired.setSeconds(
		expired.getSeconds() + Math.max(0, Number(data.expires_in) - 300),

	)

	return { token, expired }

}


export type WxSession = {
	openid : string
	unionid: string
	value  : string
}

/**
 * 小程序登录
 */
export async function get_wx_session
(appid: string, secret: string, js_code: string): Promise<WxSession>
{
	type Params = {
		appid     : string
		secret    : string
		js_code   : string
		grant_type: string
	}

	type Result = {
		openid     : string
		unionid    : string
		session_key: string
	}

	let params: Params = { appid, secret, js_code, grant_type: 'authorization_code' }

	let { data } = await wxopen_api.get<Result>(
		'/sns/jscode2session',

		{ params },

	)


	let { openid, unionid, session_key } = data

	return { openid, unionid, value: session_key }

}

export type Unlimited = {
	body    : http.IncomingMessage
	filename: string
}

/**
 * 获取小程序码，适用于需要的码数量极多的业务场景。
 * 通过该接口生成的小程序码，永久有效，数量暂无限制。
 */
export async function get_unlimited
(
	access_token: string,
	page: string,
	scene: string,
	option?: { width: number, auto_color: boolean, line_color: object },

)
: Promise<Unlimited>
{
	if (page.startsWith('/') )
	{
		page = page.slice(1)

	}

	let request = await wxopen_api.request<http.IncomingMessage>(
		{
			method      : 'post',
			// eslint-disable-next-line @typescript-eslint/naming-convention
			responseType: 'stream',
			url         : '/wxa/getwxacodeunlimit',
			data        : { scene, page, ...option },
			params      : { access_token },

		},

	)

	let body = request.data
	let mime = `${request.headers['content-type']}`

	if (mime.includes('application/json') )
	{
		let result = await new Promise<WxopenAPIErrorResult>(
			(resolve, reject) =>
			{
				let chunks: Buffer[] = []


				body
					.on(
						'data',

						(chunk: Buffer) =>
						{
							chunks.push(chunk)

						},

					)
					.on(
						'end',

						() =>
						{
							try
							{
								let parse = Buffer.concat(chunks).toString()

								let data = JSON.parse(parse) as WxopenAPIErrorResult

								resolve(data)

							}

							catch (e)
							{
								if (e instanceof Error)
								{
									reject(e)

									return

								}

								reject(new Error('unknown error') )

							}

						},

					)

			},

		)

		throw new reply.BadRequest(result.errmsg)


	}

	let filename = Date.now().toString(36)
	let extension = mime_types.extension(mime)

	if (detective.is_required_string(extension) )
	{
		filename = `${filename}.${extension}`

	}


	return { body, filename }


}


/**
 * 换取用户手机号
 */
export async function get_phone_number
(access_token: string, code: string): Promise<string>
{
	type Result = {
		phone_info: {
			// eslint-disable-next-line @typescript-eslint/naming-convention
			phoneNumber    : string
			// eslint-disable-next-line @typescript-eslint/naming-convention
			purePhoneNumber: string
			// eslint-disable-next-line @typescript-eslint/naming-convention
			countryCode    : string

			watermark: {
				timestamp: number
				appid    : string

			}

		}

	}


	let result = await wxopen_api.post<Result>(
		'/wxa/business/getuserphonenumber',

		{ code },

		{ params: { access_token } },

	)

	let { phone_info } = result.data

	return phone_info.purePhoneNumber

}


/**
 * 发送订阅消息
 */
// eslint-disable-next-line max-params
export async function send_subscribe_message
(
	access_token: string,
	touser: string,
	template_id: string,
	page: string,
	data: Record<string, { value: string }>,

)
: Promise<void>
{
	await wxopen_api.post(
		'/cgi-bin/message/subscribe/send',

		{ touser, template_id, page, data, miniprogram_state: 'formal', lang: 'zh_CN' },

		{ params: { access_token } },

	)


}
