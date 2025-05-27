import { URL } from 'node:url'

import config from 'config'
import crypto from 'crypto'
import axios, { isAxiosError } from 'axios'

import * as reply from './reply.js'
import * as secret from './secret.js'
import * as detective from './detective.js'


let COMPONENT_VERIFY_TICKET: null | string = null

let PRE_AUTH_CODE: null | string = null
let PRE_AUTH_CODE_EXPIRE = new Date()

let COMPONENT_ACCESS_TOKEN: null | string = null
let COMPONENT_ACCESS_TOKEN_EXPIRE = new Date()



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



const app_id = config.get<string>('wxopen.app_id')
const app_secret = config.get<string>('wxopen.app_secret')
const aes_key = config.get<string>('wxopen.aes_key')

const aes_256_cbc = new secret.AES_256_CBC(aes_key)

const wxopen_api = axios.create(
	// eslint-disable-next-line @typescript-eslint/naming-convention
	{ baseURL: 'https://api.weixin.qq.com/' },

)

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
		let error = new reply.BadRequest()

		if (res instanceof Error)
		{
			error.message = res.message

		}

		if (isAxiosError(res) )
		{
			if (res.response)
			{
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				let { data } = res.response

				if (data instanceof Error)
				{
					error.message = data.message

				}

				if (is_wxopen_api_error_result(data) )
				{
					error.message = data.errmsg

				}

			}


		}

		return Promise.reject(error)

	},

)

/**
 * 微信第三方平台消息加解密类
 */
export class WXBizMsgCrypt
{
	/**
	 * 消息加密
	 */
	static encrypt (plain: string): string
	{
		let plain_ = Buffer.concat(
			[
				Buffer.isBuffer(plain) ? plain : Buffer.from(plain),

				Buffer.from(aes_key),

			],

		)

		let cipher = aes_256_cbc.encrypt_with_pkcs7(plain_)

		return cipher.toString('base64')

	}

	/**
	 * 消息解密
	 */
	static decrypt (plain: string | Buffer): string
	{
		if (detective.is_string(plain) )
		{
			plain = Buffer.from(plain, 'base64')

		}


		let decipher = aes_256_cbc.decrypt_with_pkcs7(plain)

		return decipher.toString()

	}

	/**
	 * 签名
	 */
	static async sign (encrypt: string, timestamp: string, nonce: string): Promise<string>
	{
		let component_access_token = await get_component_access_token()

		// 拼接待签名参数
		let encrypt_ = [encrypt, timestamp, nonce, component_access_token].sort().join('')

		// 计算签名
		let signature = crypto.createHash('sha1')
			.update(encrypt_)
			.digest('hex')

		return signature

	}

}


/**
 * 设置验证票据
 */
export function set_component_verify_ticket (value: string): void
{
	COMPONENT_VERIFY_TICKET = value

}


/**
 * 获取验证票据
 */
export function get_component_verify_ticket (): string
{
	if (detective.is_required_string(COMPONENT_VERIFY_TICKET) )
	{
		return COMPONENT_VERIFY_TICKET

	}

	throw new reply.Forbidden('Waiting For The Ticket To Be Mailed')


}

/**
 * 获取第三方平台接口令牌
 */
export async function get_component_access_token (): Promise<string>
{
	if (COMPONENT_ACCESS_TOKEN === null
		|| new Date() > COMPONENT_ACCESS_TOKEN_EXPIRE)
	{
		let component_appid = app_id
		let component_appsecret = app_secret
		let component_verify_ticket = get_component_verify_ticket()

		type Result = {
			expires_in            : string
			component_access_token: string
		}


		let { data } = await wxopen_api.post<Result>(
			'/cgi-bin/component/api_component_token',

			{ component_appid, component_appsecret, component_verify_ticket },

		)

		let expire = new Date()
		let seconds = expire.getSeconds() + ~~data.expires_in

		expire.setSeconds(seconds)

		COMPONENT_ACCESS_TOKEN = data.component_access_token
		COMPONENT_ACCESS_TOKEN_EXPIRE = expire


	}

	return COMPONENT_ACCESS_TOKEN

}


/**
 * 获取预授权码
 */
export async function get_pre_auth_code (): Promise<string>
{
	if (PRE_AUTH_CODE === null
		|| new Date() > PRE_AUTH_CODE_EXPIRE)
	{
		let component_appid = app_id
		let component_access_token = await get_component_access_token()

		type Result = {
			expires_in   : string
			pre_auth_code: string
		}


		let { data } = await wxopen_api.post<Result>(
			'/cgi-bin/component/api_create_preauthcode',

			{ component_appid },

			{ params: { component_access_token } },

		)


		let expire = new Date()
		let seconds = expire.getSeconds() + ~~data.expires_in

		expire.setSeconds(seconds)

		PRE_AUTH_CODE = data.pre_auth_code
		PRE_AUTH_CODE_EXPIRE = expire

	}

	return PRE_AUTH_CODE

}



export type AuthorizerAccessToken = {
	appid  : string
	token  : string
	refresh: string
	expire : Date

}

/**
 * 获取授权方接口调用令牌
 */
export async function get_authorizer_access_token (authorization_code: string): Promise<AuthorizerAccessToken>
{
	let component_appid = app_id
	let component_access_token = await get_component_access_token()


	type Result = {
		authorization_info: {
			authorizer_appid        : string
			authorizer_access_token : string
			authorizer_refresh_token: string
			expires_in              : string
		}
	}

	let { data } = await wxopen_api.post<Result>(
		'/cgi-bin/component/api_query_auth',

		{ component_appid, authorization_code },

		{ params: { component_access_token } },

	)

	let result = data.authorization_info

	let appid = result.authorizer_appid
	let token = result.authorizer_access_token
	let refresh = result.authorizer_refresh_token
	let expire = new Date()

	expire.setSeconds(expire.getSeconds() + ~~result.expires_in)

	return { appid, token, refresh, expire }


}

export type RefreshAuthorizerAccessToken = {
	token  : string
	refresh: string
	expired: Date

}

/**
 * 刷新授权方接口调用令牌
 */
export async function refresh_authorizer_access_token (
	authorizer_appid: string,
	authorizer_refresh_token: string,

): Promise<RefreshAuthorizerAccessToken>
{
	let component_appid = app_id
	let component_access_token = await get_component_access_token()


	type Result = {
		authorizer_access_token : string
		authorizer_refresh_token: string
		expires_in              : string

	}

	let { data } = await wxopen_api.post<Result>(
		'/cgi-bin/component/api_authorizer_token',

		{ component_appid, authorizer_appid, authorizer_refresh_token },

		{ params: { component_access_token } },

	)

	let token = data.authorizer_access_token
	let refresh = data.authorizer_refresh_token
	let expired = new Date()

	expired.setSeconds(expired.getSeconds() + ~~data.expires_in)

	return { token, refresh, expired }

}


export type AuthorizerInfo = {
	nickname : string
	avatar   : string
	principal: string
	stamp    : string

}

/**
 * 获取授权方的帐号基本信息
 */
export async function get_authorizer_info (authorizer_appid: string): Promise<AuthorizerInfo>
{
	let component_appid = app_id
	let component_access_token = await get_component_access_token()


	type Result = {
		authorizer_info: {
			nick_name     : string
			head_img      : string
			principal_name: string
			stamp_url     : string
		}

	}

	let { data } = await wxopen_api.post<Result>(
		'/cgi-bin/component/api_get_authorizer_info',

		{ component_appid, authorizer_appid },

		{ params: { component_access_token } },

	)

	let { nick_name, head_img, principal_name, stamp_url } = data.authorizer_info

	return {
		nickname : nick_name,
		avatar   : head_img,
		principal: principal_name,
		stamp    : stamp_url,
	}

}


/**
 * 获取授权注册页面地址
 */
export async function ge_component_login_page (redirect: string): Promise<string>
{
	let component_appid = app_id
	let pre_auth_code = await get_component_access_token()

	let uri = new URL(
		'/cgi-bin/componentloginpage',

		'https://mp.weixin.qq.com/',

	)

	uri.searchParams.append('component_appid', component_appid)
	uri.searchParams.append('pre_auth_code', pre_auth_code)
	uri.searchParams.append('redirect_uri', redirect)
	uri.searchParams.append('auth_type', '2')

	return uri.href

}


/**
 * 创建小程序
 */
// eslint-disable-next-line max-params
export async function fast_register_weapp (
	name: string,
	code: string,
	code_type: string,
	legal_persona_wechat: string,
	legal_persona_name: string,
	component_phone: string,

): Promise<void>
{
	let component_access_token = await get_component_access_token()

	await wxopen_api.post(
		'/cgi-bin/component/fastregisterweapp',

		{
			name,
			code,
			code_type,
			legal_persona_wechat,
			legal_persona_name,
			component_phone,
		},

		{
			params: {
				component_access_token,
				action: 'create',
			},

		},

	)


}


export type WeappsBasic = {
	nickname : string
	avatar   : string
	principal: string

}


/**
 * 获取授权方小程序基本信息
 */
export async function get_weapps_basic (access_token: string): Promise<WeappsBasic>
{
	type Result = {
		nickname_info: {
			nickname: string
		}

		head_image_info: {
			head_image_url: string
		}

		principal_name: string
	}

	let { data } = await wxopen_api.get<Result>(
		'/cgi-bin/account/getaccountbasicinfo',

		{ params: { access_token } },

	)

	let { nickname } = data.nickname_info
	let { head_image_url } = data.head_image_info

	return {
		nickname,
		avatar   : head_image_url,
		principal: data.principal_name,
	}


}


export type WeappsUpportVersion = {
	version: string
	items  : object[]
}

/**
 * 查询当前设置的最低基础库版本及各版本用户占比
 */
export async function get_weapps_upport_version (access_token: string): Promise<WeappsUpportVersion>
{
	type Result = {
		uv_info    : object[]
		now_version: string
	}

	let { data } = await wxopen_api.post<Result>(
		'/cgi-bin/wxopen/getweappsupportversion',

		{},

		{ params: { access_token } },

	)

	let items = data.uv_info

	return { version: data.now_version, items }

}


/**
 * 设置最低基础库版本
 */
export async function set_weapps_upport_version (access_token: string, version: string): Promise<void>
{
	await wxopen_api.post(
		'/cgi-bin/wxopen/setweappsupportversion',

		{ version },

		{ params: { access_token } },

	)

}


export type DecryptEncrypted = {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	purePhoneNumber: string
}

/**
 * 解密敏感内容
 */
export function decrypt_encrypted (encrypted: string, iv: string, session: string): DecryptEncrypted
{
	try
	{
		let iv_ = Buffer.from(iv, 'base64')
		let session_ = Buffer.from(session, 'base64')

		let decipher = crypto.createDecipheriv('aes-128-cbc', session_, iv_)

		// 设置自动 padding 为 true，删除填充补位
		decipher.setAutoPadding(true)

		let decoded = decipher.update(encrypted, 'base64', 'utf8')

		decoded = decoded + decipher.final('utf8')


		return JSON.parse(decoded) as DecryptEncrypted


	}

	catch
	{
		throw new reply.Forbidden('Decryption Failed')

	}

}


export type WxSession = {
	openid : string
	unionid: string
	value  : string
}

/**
 * 小程序登录
 */
export async function get_wx_session (
	appid: string,
	js_code: string,

): Promise<WxSession>
{
	type Params = {
		appid                 : string
		js_code               : string
		grant_type            : string
		component_appid       : string
		component_access_token: string
	}

	type Result = {
		openid     : string
		unionid    : string
		session_key: string
	}

	let params: Params = {
		appid,
		js_code,
		grant_type: 'authorization_code',

		component_appid       : app_id,
		component_access_token: await get_component_access_token(),
	}

	let { data } = await wxopen_api.get<Result>(
		'/sns/jscode2session',

		{ params },

	)


	let { openid, unionid, session_key } = data

	return { openid, unionid, value: session_key }

}



/**
 * 获取授权方小程序基本信息
 */
export async function modify_domain (
	access_token: string,
	requestdomain: string[] = [],
	uploaddomain: string[] = [],
	downloaddomain: string[] = [],

): Promise<
	{ nickname: string, avatar: string, principal: string }

>
{
	type Result = {
		principal_name : string
		nickname_info  : { nickname: string }
		head_image_info: { head_image_url: string }
	}

	let result = await wxopen_api.post<Result>(
		'/wxa/modify_domain',

		{
			action: 'set',
			requestdomain,
			uploaddomain,
			downloaddomain,
		},

		{ params: { access_token } },

	)

	let { principal_name, nickname_info, head_image_info } = result.data

	let principal = principal_name
	let { nickname } = nickname_info
	let { head_image_url: avatar } = head_image_info

	return { nickname, avatar, principal }

}


export type WeappDraft = {
	_id    : string
	version: string
	desc   : string
	created: string

}

/**
 * 获取代码草稿
 */
export async function get_weapps_draft (): Promise<WeappDraft[]>
{
	type TDraft = {
		draft_id    : string
		user_version: string
		user_desc   : string
		create_time : string

	}

	type DraftResult = { draft_list: TDraft[] }

	let access_token = await get_component_access_token()

	let result = await wxopen_api.get<DraftResult>(
		'/wxa/gettemplatedraftlist',

		{ params: { access_token } },

	)

	let { draft_list } = result.data

	return draft_list.map(
		v =>
		{
			let _id = v.draft_id
			let version = v.user_version
			let desc = v.user_desc
			let created = v.create_time

			return { _id, version, desc, created }

		},

	)


}


/**
 * 将草稿添加到代码模板库
 */
export async function put_weapps_draft_to_template (draft_id: string): Promise<void>
{
	let access_token = await get_component_access_token()

	await wxopen_api.post(
		'/wxa/addtotemplate',

		{ draft_id },

		{ params: { access_token } },

	)

}


export type WeappTemplate = {
	_id    : string
	version: string
	desc   : string
	created: string

}

/**
 * 获取代码模板
 */
export async function get_weapp_template (): Promise<WeappTemplate[]>
{
	type TTemplate = {
		template_id : string
		user_version: string
		user_desc   : string
		create_time : string

	}

	type DraftResult = { template_list: TTemplate[] }

	let access_token = await get_component_access_token()

	let result = await wxopen_api.get<DraftResult>(
		'/wxa/gettemplatelist',

		{ params: { access_token } },

	)

	let { template_list } = result.data

	return template_list.map<WeappTemplate>(
		v => (
			{
				_id    : v.template_id,
				version: v.user_version,
				desc   : v.user_desc,
				created: v.create_time,
			}

		),

	)


}


/**
 * 删除指定代码模板
 */
export async function delete_weapps_template (
	template_id: string,

): Promise<void>
{
	let access_token = await get_component_access_token()

	await wxopen_api.post(
		'/wxa/deletetemplate',

		{ template_id },

		{ params: { access_token } },

	)

}


/**
 * 上传小程序代码
 */
// eslint-disable-next-line max-params
export async function weapps_commit (
	access_token: string,
	template_id: string,
	ext_appid: string,
	user_version: string,
	user_desc: string,

): Promise<void>
{
	let ext_json = JSON.stringify(
		// eslint-disable-next-line @typescript-eslint/naming-convention
		{ extAppid: ext_appid },

	)

	await wxopen_api.post(
		'/wxa/commit',

		{ template_id, ext_json, user_version, user_desc },

		{ params: { access_token } },

	)

}


/**
 * 小程序提交审核
 */
export async function weapps_submit (
	access_token: string,

): Promise<void>
{
	await wxopen_api.post(
		'/wxa/submit_audit',

		{},

		{ params: { access_token } },

	)

}


/**
 * 小程序提交审核
 */
export async function weapps_undo (
	access_token: string,

): Promise<void>
{
	await wxopen_api.get(
		'/wxa/undocodeaudit',

		{ params: { access_token } },

	)

}


/**
 * 发布已通过审核的小程序
 */
export async function weapps_release (
	access_token: string,

): Promise<void>
{
	await wxopen_api.post(
		'/wxa/release',

		{},

		{ params: { access_token } },

	)

}


/**
 * 线上小程序版本进行回退
 */
export async function weapps_revert (
	access_token: string,

): Promise<void>
{
	await wxopen_api.get(
		'/wxa/revertcoderelease',

		{ params: { access_token } },

	)

}
