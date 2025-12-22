/**
 * 邮票模型
 */
import config from 'config'
import moment from 'moment'

import { Schema } from 'mongoose'

import * as axios from 'axios'

import * as storage from '../lib/storage.js'

import * as reply from '../lib/reply.js'
import * as secret from '../lib/secret.js'
import * as detective from '../lib/detective.js'






export type Tm = storage.Tm<
	{
		value : string
		symbol: `/${string}#${Lowercase<axios.Method>}`

		expire: Date

		src: string

		amber: unknown

	},

	{
		lave  : number
		method: '*' | Uppercase<axios.Method>

	},

	{
		touch(pathname: `/${string}`, method: Lowercase<axios.Method>,): boolean

		eternal(): Promise<Tm['HydratedDocument']>

	},

	{
		from (value: string): Promise<Tm['HydratedDocument']>

	}


>



const salt = config.get<string>('salt')

const aes = new secret.AES_256_CBC(salt)


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
		// 令牌
		value: {
			type    : String,
			unique  : true,
			required: true,
			trim    : true,

		},

		// 校验码
		symbol: {
			type    : String,
			required: true,
			trim    : true,

		},

		// 过期时间
		expire: {
			type    : Date,
			expires : 0,
			required: true,

		},

		// media uri
		src: {
			type    : String,
			required: true,
			unique  : true,
			trim    : true,

		},

		// 载荷
		amber: {
			type   : Schema.Types.Mixed,
			default: null,

		},

	},

)


schema.virtual('lave').get(
	function (): Tm['TVirtuals']['lave']
	{
		return 0 - moment().diff(this.expire, 'seconds')

	},

)


schema.virtual('method').get(
	function (): Tm['TVirtuals']['method']
	{
		let [, v] = split(this.symbol ?? '')

		if (detective.is_string(v) )
		{
			return v.toUpperCase() as Uppercase<axios.Method>

		}

		return '*'


	},

)


schema.method(
	'touch',

	// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
	<Tm['TInstanceMethods']['touch']>
	function (pathname, method)
	{
		return this.symbol === sign(pathname, method)

	},


)

schema.method(
	'eternal',

	// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
	<Tm['TInstanceMethods']['eternal']>
	function ()
	{
		this.expire = new Date(2077, 0, 1)

		return this.save()

	},


)


schema.static<'from'>(
	'from',

	async function (value)
	{
		let doc = await this.findOne(
			{ value, expire: { $gte: new Date() } },

		)

		reply.NotFound.asserts(doc, 'stamp is not found')

		return doc


	},


)


export default drive.model('Stamp', schema) as Tm['Model']

export type Mailer = {
	symbol: Tm['DocType']['symbol']

	expire: Date

	amber: unknown

	[index: number]: number

}


export function is_mailer (v: unknown): v is Mailer
{
	if (detective.is_object(v) === false)
	{
		return false

	}

	let symbol = detective.is_object_keyof(v, 'symbol')
	let expire = detective.is_object_keyof(v, 'expire')
	let amber = detective.is_object_keyof(v, 'amber')

	return symbol && expire && amber

}


export function sign
(pathname: `/${string}`, method: Lowercase<axios.Method>): Tm['DocType']['symbol']
{
	return `${pathname}#${method}`

}


export function split
(symbol: string): [`/${string}`, Lowercase<axios.Method>]
{
	return symbol.split('#') as [`/${string}`, Lowercase<axios.Method>]

}


/**
 * 加密
 */
export function encrypt
(
	symbol: Tm['DocType']['symbol'],

	expire: Date,

	amber: unknown = null,

): string
{
	let payload: Mailer = {
		symbol,

		expire,

		amber,

		[Math.random()]: Math.random(),
	}

	let plain = JSON.stringify(payload)


	return aes.encrypt_with_pkcs7(plain).toString('hex')

}


/**
 * 解密
 */
export function decrypt (cypher: string): Mailer
{
	let payload: unknown = null
	let plain = aes.decrypt_with_pkcs7(cypher)

	try
	{
		payload = JSON.parse(
			plain.toString('utf8'),

		)

	}

	catch
	{
		throw new reply.Forbidden('decryption failed')

	}

	if (is_mailer(payload) )
	{
		let d = new Date()
		let expire = new Date(payload.expire)

		if (expire > d)
		{
			return { ...payload, expire }

		}

		throw new reply.Forbidden('cypher expired')

	}

	throw new reply.Forbidden('invalid cypher')


}
