/**
 * 邮票模型
 */
import config from 'config'
import moment from 'moment'
import { Schema, Model, HydratedDocument, Mixed } from 'mongoose'

import * as axios from 'axios'

import * as storage from '../lib/storage.js'

import * as reply from '../lib/reply.js'
import * as secret from '../lib/secret.js'
import * as detective from '../lib/detective.js'






export type TRawDocType = storage.TRawDocType<
	{
		value: string
		symbol: `${string}#${Lowercase<axios.Method>}`

		expire: Date

		src: string

		amber: null | Mixed

	}

>

export type TPopulatePaths = object

export type TVirtuals = {
	lave: number
	method: '*' | Uppercase<axios.Method>

}

export type TQueryHelpers = object

export type TInstanceMethods = {
	eternal(
		// eslint-disable-next-line no-use-before-define
		this: THydratedDocumentType

	// eslint-disable-next-line no-use-before-define
	): Promise<THydratedDocumentType>

}

export type TStaticMethods = {
	from(
		// eslint-disable-next-line no-use-before-define
		this: TModel,

		value: string,
		symbol?: TRawDocType['symbol'],

		// eslint-disable-next-line no-use-before-define
	): Promise<THydratedDocumentType>

}


export type THydratedDocumentType = HydratedDocument<TRawDocType, TVirtuals & TInstanceMethods>

export type TModel = Model<TRawDocType, TQueryHelpers, TInstanceMethods, TVirtuals>


const salt = config.get<string>('salt')

const aes = new secret.AES_256_CBC(salt)


const drive = await storage.mongodb()

export const schema = new Schema<
	TRawDocType,
	TModel,
	TInstanceMethods,
	TQueryHelpers,
	TVirtuals,
	TStaticMethods

>(
	{
		// 令牌
		value: {
			type: String,
			unique: true,
			required: true,
			trim: true,

		},

		// 校验码
		symbol: {
			type: String,
			required: true,
			trim: true,

		},

		// 过期时间
		expire: {
			type: Date,
			expires: 0,
			required: true,

		},

		// media uri
		src: {
			type: String,
			required: true,
			unique: true,
			trim: true,

		},

		// 载荷
		amber: {
			type: Schema.Types.Mixed,
			default: null,

		},

	},

)


schema.virtual('lave').get(
	function (): TVirtuals['lave'] {
		return 0 - moment().diff(this.expire, 'seconds')

	},

)


schema.virtual('method').get(
	function (): TVirtuals['method'] {
		let symbol = this.symbol ?? ''

		let [, v] = symbol.split('#')

		if (detective.is_string(v)

		) {
			return v.toUpperCase() as Uppercase<axios.Method>

		}

		return '*'


	},

)


schema.method(
	{
		eternal() {
			this.expire = new Date(2077, 0, 1)

			return this.save()

		},

	},

)


schema.static(
	{
		async from(value, symbol) {
			let doc = await this.findOne(
				{ value, symbol, expire: { $gte: new Date() } },

			)

			reply.NotFound.asserts(doc, 'stamp')

			return doc


		},


	},

)


export default drive.model('Stamp', schema)

export type Mailer = {
	symbol: TRawDocType['symbol']

	expire: Date

	amber: unknown

	[index: number]: number

}


export function is_mailer(v: unknown): v is Mailer {
	if (detective.is_object(v) === false) {
		return false

	}

	let symbol = detective.is_object_keyof(v, 'symbol')
	let expire = detective.is_object_keyof(v, 'expire')
	let amber = detective.is_object_keyof(v, 'amber')

	return symbol && expire && amber

}


/**
 * 加密
 */
export function encrypt(
	symbol: TRawDocType['symbol'],

	expire: Date,

	amber: unknown = null,

): string {
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
export function decrypt(cypher: string): Mailer {
	let payload: unknown = null
	let plain = aes.decrypt_with_pkcs7(cypher)

	try {
		payload = JSON.parse(
			plain.toString('utf8'),

		)

	}

	catch {
		throw new reply.Forbidden('decryption failed')

	}

	if (is_mailer(payload)

	) {
		let d = new Date()
		let expire = new Date(payload.expire)

		if (expire > d) {
			return { ...payload, expire }

		}

		throw new reply.Forbidden('cypher expired')

	}

	throw new reply.Forbidden('invalid cypher')


}