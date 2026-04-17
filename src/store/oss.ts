import crypto from 'node:crypto'
import stream from 'node:stream'

import config from 'config'
import alioss from 'ali-oss'
import mime_types from 'mime-types'

import * as reply from '../lib/reply.js'
import * as detective from '../lib/detective.js'




const aliopen_endpoint = config.get<string>('aliopen.endpoint')
const aliopen_access_key_id = config.get<string>('aliopen.access_key_id')
const aliopen_access_key_secret = config.get<string>('aliopen.secret_access_key')




export class SizeTracking extends stream.Transform implements stream.Transform
{
	#hash = crypto.createHash('md5')

	#value = 0

	get hash (): string
	{
		return this.#hash.digest('hex')

	}

	get value (): number
	{
		return this.#value

	}

	constructor (content?: Buffer | NodeJS.ReadableStream)
	{
		super()

		if (content instanceof Buffer)
		{
			this.end(content)

		}

		else if (content instanceof stream.Readable)
		{
			content.pipe(this)

		}

	}

	_transform
	(
		chunk: unknown,
		encoding: BufferEncoding,
		callback: stream.TransformCallback,

	)
	: void
	{
		if (chunk instanceof Buffer)
		{
			this.#hash.update(chunk)
			this.#value = this.#value + chunk.byteLength

		}

		else if (detective.is_array_buffer(chunk) )
		{
			this.#hash.update(chunk as unknown as Buffer)
			this.#value = this.#value + chunk.byteLength

		}

		else if (detective.is_blob(chunk) )
		{
			this.#hash.update(chunk as unknown as Buffer)
			this.#value = this.#value + chunk.size

		}

		this.push(chunk)

		callback()

	}


}

export class OSS
{
	#oss: alioss

	#bucket: string

	#temp_dir = 'temp'


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

	#route (pathname: string): string
	{
		return new URL(pathname, 'http://example.com').pathname

	}

	route (pathname: string): string
	{
		return this.#route(pathname)
			.replace(
				new RegExp(`^/${this.#temp_dir}`, 'g'),

				'',

			)


	}

	#join (pathname: string): string
	{
		let p = this.route(pathname)

		if (p.startsWith(`/${this.#temp_dir}`) )
		{
			return p

		}

		return `/${this.#temp_dir}${p}`

	}

	sign
	(
		src: string,

		option?: {
			expires?: number
			process?: string

		},

	)
	:	URL
	{
		return OSS.sign(
			this.#bucket,

			this.oss.signatureUrl(src, option),

		)


	}

	seize (mime: string): URL
	{
		let folder = this.#temp_dir

		let u = this.oss
			.signatureUrl(
				this.#join(OSS.goal(folder, mime) ),

			)

		return new URL(u)

	}

	async cache
	(
		pathname: string,
		data: Buffer | NodeJS.ReadableStream,
		option?: alioss.AppendObjectOptions,

	)
	:	Promise<{ size: number, hash: string, pathname: string }>
	{
		let temp = this.#join(pathname)

		let size = new SizeTracking(data)

		await this.oss.append(temp, size, option)

		return {
			size: size.value,
			hash: size.hash,

			pathname: temp,

		}

	}

	async fasten (pathname: string, filename?: string): Promise<string>
	{
		let p = this.route(pathname)
		let source = this.#join(pathname)

		let headers = OSS.ensure(filename)

		await this.oss.copy(p, source, { headers })
		await this.oss.delete(source)

		return this.oss.generateObjectUrl(p)

	}

	delete (pathname: string): Promise<alioss.DeleteResult>
	{
		return this.oss.delete(pathname)

	}




	static #marked = 'x-oss-bucket'

	static #cache: Record<string, OSS> = {}


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

	static goal (folder: string, mime: string): string
	{
		return [folder, `${Date.now().toString(36)}.${mime_types.extension(mime)}`].join('/')

	}

	static ensure (filename?: string): Record<string, string>
	{
		let headers: Record<string, string> = {}

		if (detective.is_required_string(filename) )
		{
			let disposition = [
				'attachment',

				`filename="${filename}"`,
				`filename*=UTF-8''${encodeURIComponent(filename)}`,

			]

			headers['Content-Disposition'] = disposition.join('; ')

		}


		return headers

	}


}


export class Image extends OSS
{
	#src: URL

	#option: Record<string, unknown> = {}

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
