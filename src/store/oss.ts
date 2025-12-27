import config from 'config'
import alioss from 'ali-oss'

import * as reply from '../lib/reply.js'
import * as detective from '../lib/detective.js'




const aliopen_endpoint = config.get<string>('aliopen.endpoint')
const aliopen_access_key_id = config.get<string>('aliopen.access_key_id')
const aliopen_access_key_secret = config.get<string>('aliopen.secret_access_key')




export class OSS
{
	#oss: alioss

	#bucket: string


	get oss (): alioss
	{
		return this.#oss

	}


	get bucket (): string
	{
		return this.#bucket

	}


	constructor (bucket: string)
	{
		// eslint-disable-next-line new-cap
		this.#oss = new alioss(
			{
				bucket,
				secure: true,
				region: `oss-${aliopen_endpoint}`,

				// eslint-disable-next-line @typescript-eslint/naming-convention
				accessKeyId: aliopen_access_key_id,

				// eslint-disable-next-line @typescript-eslint/naming-convention
				accessKeySecret: aliopen_access_key_secret,

			},

		)


		this.#bucket = bucket


	}


	sign (src: string, option: { expires?: number, process?: string }): URL
	{
		return OSS.sign(
			this.#bucket,

			this.oss.signatureUrl(src, option),

		)


	}


	append
	(src: string, content: Buffer | NodeJS.ReadableStream, options?: alioss.AppendObjectOptions): Promise<alioss.AppendObjectResult>
	{
		return this.oss.append(src, content, options)

	}


	delete (src: string): Promise<alioss.DeleteResult>
	{
		return this.oss.delete(src)

	}




	static #marked = 'x-oss-bucket'

	static #cache: Record<string, OSS> = {}


	// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
	static new (bucket: string, ..._: any[]): OSS
	{
		if (detective.is_empty(this.#cache[bucket]) )
		{
			this.#cache[bucket] = new OSS(bucket)

		}

		return this.#cache[bucket]

	}


	static from (url: string | URL): OSS
	{
		if (detective.is_string(url) )
		{
			url = new URL(url)

		}


		let bucket = url.searchParams.get(this.#marked)

		if (detective.is_required_string(bucket) )
		{
			return new OSS(bucket)

		}

		throw new reply.BadRequest('invalid store url')


	}


	static sign (bucket: string, src: string): URL
	{
		let uri = new URL(src)

		uri.searchParams.set(this.#marked, bucket)

		return uri

	}





}


export class Image extends OSS
{
	#src: URL

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	#option: Record<string, any> = {}

	get src (): string
	{
		return this.#src.href

	}


	constructor (bucket: string, src: string | URL, option?: { expires: number })
	{
		if (detective.is_string(src) )
		{
			src = new URL(src)

		}

		super(bucket)

		this.#src = src

		this.#option = { ...option }

	}


	process (option: Record<string, Array<number | string> >): URL
	{
		let uri = new URL(this.#src)

		let process = [
			'image',

			'interlace,1',

			...Object.entries(option).map( ([k, v]) => [k, ...v].join(',') ),

		]

		uri.search = ''

		return this.sign(
			uri.pathname, { ...this.#option, process: process.join('/') },

		)


	}


	resize (width: number, height?: number): URL
	{
		let v = ['m_lfit', `w_${Math.floor(width)}`]

		if (detective.is_number(height) )
		{
			v.push(`h_${Math.floor(height)}`)

		}

		return this.process(
			{ 'resize': v },

		)


	}


	rotate (angle: number): URL
	{
		angle = Math.round(angle) % 360

		while (0 > angle)
		{
			angle = 360 + angle

		}


		return this.process(
			{ rotate: [angle] },

		)


	}


	static new (bucket: string, src: string | URL, option?: { expires: number }): Image
	{
		return new Image(bucket, src, option)

	}


	static from (src: string | URL, option?: { expires: number }): Image
	{
		let o = OSS.from(src)

		return this.new(o.bucket, src, option)


	}


}
