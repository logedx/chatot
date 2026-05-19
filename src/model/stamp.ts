/**
 * 邮票模型
 */
import config from 'config'
import moment from 'moment'

import { Schema } from 'mongoose'

import * as axios from 'axios'


import * as model from '../lib/model.js'
import * as reply from '../lib/reply.js'
import * as secret from '../lib/secret.js'
import * as detective from '../lib/detective.js'

import * as oss from '../store/oss.js'
import * as database from '../store/database.js'




// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Default
{
	export type Model = model.Define<
		{
			value : string
			symbol: `/${string}#${Lowercase<axios.Method>}`

			expire: Date

			context: model.Types.Buffer

			amber: unknown

		},

		{
			lave  : number
			href  : string
			method: '*' | Uppercase<axios.Method>

		}


	>

	export type Schema = database.Schema<
		Model,

		{
			touch(pathname: oss.TossFile['pathname'], method: Lowercase<axios.Method>,): boolean

			eternal(): Promise<HydratedDocument>

		},

		{
			from(value: string): Promise<HydratedDocument>

		}

	>

	export type HydratedDocument = database.HydratedDocument<Schema>

}

// eslint-disable-next-line @stylistic/function-call-spacing
export const schema: Default.Schema = new Schema
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
						return v.toUpperCase() as Uppercase<axios.Method>

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

export default drive.model('Stamp', schema)


export type Mailer<T = null> = {
	symbol: Default.Model['D']['symbol']

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
(pathname: oss.TossFile['pathname'], method: Lowercase<axios.Method>): Default.Model['D']['symbol']
{
	return `${pathname}#${method}`

}


export function split
(symbol: string): [oss.TossFile['pathname'], Lowercase<axios.Method>]
{
	return symbol.split('#') as [oss.TossFile['pathname'], Lowercase<axios.Method>]

}


/**
 * 加密
 */
export function encrypt
(
	symbol: Default.Model['D']['symbol'],

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
