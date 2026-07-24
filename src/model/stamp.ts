/**
 * 邮票模型
 */
import config from 'config'
import moment from 'moment'

import { Schema } from 'mongoose'


import * as reply from '../lib/reply.js'
import * as secret from '../lib/secret.js'
import * as detective from '../lib/detective.js'

import * as database from '../store/database.js'


import * as stamp from '../schema/stamp.js'




export namespace Default
{
	export type Define = stamp.Default

	export type Methods = {
		touch(pathname: stamp.Pathname, method: Lowercase<stamp.Method>): boolean

		eternal(): Promise<Default.Document>

	}

	export type Statics = {
		from(value: string): Promise<Default.Document>

	}

	export type Schema = database.Schema<Default.Define, Default.Methods, Default.Statics>

	export type Keywords = database.Probe<Default.Define>

	export type Document = database.Document<Default.Schema>


}


// eslint-disable-next-line @stylistic/function-call-spacing
export const default_schema: Default.Schema = new Schema
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

		context: {
			type    : Buffer,
			required: true,

		},

		// 载荷
		amber: {
			type   : Schema.Types.Mixed,
			default: null,

		},

	},

	{
		virtuals: {
			lave: {
				get ()
				{
					return 0 - moment().diff(this.expire, 'seconds')

				},

			},

			href: {
				get ()
				{
					return `data:image/png;base64,${Buffer.from(this.context).toString('base64')}`

				},

			},

			method: {
				get ()
				{
					let [, v] = split(this.symbol ?? '')

					if (detective.is_string(v) )
					{
						return v.toUpperCase() as stamp.Method

					}

					return '*'

				},

			},

		},

		methods: {
			touch (pathname, method)
			{
				return this.symbol === sign(pathname, method)

			},

			eternal ()
			{
				this.expire = new Date(2077, 0, 1)

				return this.save()

			},


		},

		statics: {
			async from (value)
			{
				let doc = await this.findOne(
					{ value, expire: { $gte: new Date() } },

				)

				reply.NotFound.asserts(doc, 'stamp is not found')

				return doc


			},


		},


	},


)


const salt = config.get<string>('salt')

const aes = new secret.AES_256_CBC(salt)

const drive = await database.Mongodb.default()

export default drive.model('Stamp', default_schema)


export type { Method, Pathname, Symbol } from '../schema/stamp.js'


export type Mailer<T = null> = {
	symbol: stamp.Symbol

	expire: Date

	amber: T

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
(pathname: stamp.Pathname, method: Lowercase<stamp.Method>): stamp.Symbol
{
	return `${pathname}#${method.toLowerCase()}` as stamp.Symbol

}


export function split
(symbol: stamp.Symbol): [stamp.Pathname, stamp.Method]
{
	return symbol.split('#') as [stamp.Pathname, stamp.Method]

}


/**
 * 加密
 */
export function encrypt
(
	symbol: stamp.Symbol,

	expire: Date,

	amber: unknown = null,

): string
{
	let payload: Mailer<unknown> = {
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
export function decrypt<T = null> (cypher: string): Mailer<T>
{
	// eslint-disable-next-line no-useless-assignment
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
			return { ...payload, expire } as Mailer<T>

		}

		throw new reply.Forbidden('cypher expired')

	}

	throw new reply.Forbidden('invalid cypher')


}
