import axios from 'axios'
import crypto from 'crypto'


import * as reply from './reply.js'
import * as secret from './secret.js'


export type ServiceHex = {
	id: string
	sign: string
	timestamp: number
	scope: string
	client_id: string

}


export type ServiceToken = {
	token: string
	refresh: string
	expired: Date

}


const yly_api = axios.create(
	// eslint-disable-next-line @typescript-eslint/naming-convention
	{ baseURL: 'https://open-api.10ss.net/' },
)


export class Service {
	#client: string

	#secret_key: string


	constructor(client: string, secret_key: string) {
		this.#client = client
		this.#secret_key = secret_key
	}

	hex(): ServiceHex {
		let id = secret.hex()
		let timestamp = Math.floor(Date.now() / 1000)

		let sign = crypto.createHash('md5')
			.update(`${this.#client}${timestamp}${this.#secret_key}`)
			.digest('hex')

		return { id, sign, timestamp, scope: 'all', client_id: this.#client }
	}

	async post<T>(url: string, params: Record<string, unknown>): Promise<T> {
		type Result = {
			error: string
			error_description: string
			body: T
		}

		let result = await yly_api.post<Result>(
			url,

			{ ...this.hex(), ...params },
		)


		let { error, error_description, body } = result.data

		if (error === '0' && error_description === 'success') {
			return body
		}

		throw new reply.BadRequest(error_description)
	}

	async create(code: string, qr: string): Promise<ServiceToken> {
		type Result = {
			access_token: string
			refresh_token: string
			expires_in: number
		}

		let result = await this.post<Result>(
			'/oauth/scancodemodel',

			{ machine_code: code, qr_key: qr },
		)

		let timestamp = Date.now() + (result.expires_in * 1000)

		let token = result.access_token
		let refresh = result.refresh_token
		let expired = new Date(timestamp)

		return { token, refresh, expired }

	}

}


export class RpcClient extends Service {
	#code: string

	#token: string

	constructor(client: string, secret_key: string, code: string, token: string) {
		super(client, secret_key)

		this.#code = code
		this.#token = token
	}


	async refresh(value: string): Promise<ServiceToken> {
		type Result = {
			access_token: string
			refresh_token: string
			expires_in: number
		}

		let result = await this.post<Result>(
			'/oauth/oauth',

			{ grant_type: 'refresh_token', refresh_token: value },
		)

		let timestamp = Date.now() + (result.expires_in * 1000)

		let token = result.access_token
		let refresh = result.refresh_token
		let expired = new Date(timestamp)

		this.#token = result.access_token

		return { token, refresh, expired }

	}

	delete(): Promise<null> {
		return this.post<null>(
			'/printer/deleteprinter',

			{ machine_code: this.#code, access_token: this.#token },
		)

	}

	callup(sn: string, content: string): Promise<null> {
		let origin_id = sn
		let machine_code = this.#code
		let access_token = this.#token

		return this.post<null>(
			'print/index',

			{ machine_code, access_token, origin_id, content },
		)


	}

}

