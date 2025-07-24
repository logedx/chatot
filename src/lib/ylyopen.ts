import axios from 'axios'
import crypto from 'crypto'
import { HydratedDocument, Types } from 'mongoose'


import * as reply from './reply.js'
import * as secret from './secret.js'
import * as detective from './detective.js'


export type ServiceSign = {
	id       : string
	sign     : string
	timestamp: number
	scope    : string
	client_id: string

}


export type ServiceToken = {
	token  : string
	refresh: string
	expired: Date

}


const YLY_API = axios.create(
	// eslint-disable-next-line @typescript-eslint/naming-convention
	{ baseURL: 'https://open-api.10ss.net/v2' },

)


export class Service
{
	#client: string

	#secret_key: string


	constructor (client: string, secret_key: string)
	{
		this.#client = client
		this.#secret_key = secret_key

	}

	sign (): ServiceSign
	{
		let id = secret.hex()
		let timestamp = Math.floor(Date.now() / 1000)

		let sign = crypto.createHash('md5')
			.update(`${this.#client}${timestamp}${this.#secret_key}`)
			.digest('hex')

		return { id, sign, timestamp, scope: 'all', client_id: this.#client }

	}

	async post<T>(url: string, params: Record<string, unknown>): Promise<T>
	{
		type Result = {
			// eslint-disable-next-line id-denylist
			error            : string
			error_description: string
			body             : T

		}

		let result = await YLY_API.post<Result>(
			url,

			{ ...this.sign(), ...params },

		)


		let { error_description, body } = result.data

		if (error_description === 'success')
		{
			return body

		}

		throw new reply.BadRequest(error_description)

	}

	async access (): Promise<ServiceToken>
	{
		type Result = {
			access_token      : string
			refresh_token     : string
			expires_in        : number
			refresh_expires_in: number
		}


		let result = await this.post<Result>(
			'/oauth/oauth',

			{ grant_type: 'client_credentials' },

		)


		let token = result.access_token
		let refresh = result.refresh_token

		let expired = new Date()

		expired.setSeconds(
			expired.getSeconds() + result.expires_in,

		)


		return { token, refresh, expired }

	}

	async create (token: string, code: string, sign: string): Promise<void>
	{
		await this.post<null>(
			'/printer/addprinter',

			{ access_token: token, machine_code: code, msign: sign },

		)

	}


	async delete (token: string, code: string): Promise<void>
	{
		await this.post<null>(
			'/printer/deleteprinter',

			{ access_token: token, machine_code: code },

		)

	}

	async callup (token: string, code: string, sn: string, content: string): Promise<void>
	{
		await this.post<null>(
			'print/index',

			{ access_token: token, machine_code: code, origin_id: sn, content },

		)


	}

}


export type RpcClientRawDocType = {
	client : string
	secret : string
	token  : string
	refresh: string
	expired: null | Date

	machine: Types.DocumentArray<
		{
			code: string
			sign: string

		}

	>

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[key: string]: any

}

export class RpcClient<T extends RpcClientRawDocType = RpcClientRawDocType> extends Service
{
	#doc: HydratedDocument<T>

	#code: string


	constructor (doc: HydratedDocument<T>, code: string)
	{
		super(doc.client, doc.secret)

		this.#doc = doc
		this.#code = code

	}


	get token (): Promise<string>
	{
		return this.access().then(v => v.token)

	}

	async access (): Promise<ServiceToken>
	{
		let doc = this.#doc

		if (detective.is_date(doc.expired) && doc.expired > new Date() )
		{
			return { token: doc.token, refresh: doc.refresh, expired: doc.expired }

		}

		let res = await super.access()

		doc.token = res.token
		doc.expired = res.expired

		await doc.save()

		return res

	}

	async create (sign: string): Promise<void>
	{
		await super.create(
			await this.token, this.#code, sign,

		)

		await this.#doc
			.updateOne(
				// eslint-disable-next-line @typescript-eslint/naming-convention
				{ $addToSet: { machine: { code: this.#code, sign } } },

			)


	}

	async delete (): Promise<void>
	{
		await super.delete(
			await this.token, this.#code,

		)

		await this.#doc
			.updateOne(
				{ $pull: { machine: { code: this.#code } } },

			)

	}

	async callup (sn: string, content: string): Promise<void>
	{
		await super.callup(
			await this.token, this.#code, sn, content,

		)


	}


}

