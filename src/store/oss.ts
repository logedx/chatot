import crypto from 'node:crypto'
import stream from 'node:stream'

import config from 'config'
import alioss from 'ali-oss'
import mime_types from 'mime-types'

import * as reply from '../lib/reply.js'
import * as detective from '../lib/detective.js'
import * as structure from '../lib/structure.js'




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


export type TossFile = {
	size: number
	hash: string

	pathname: `/${string}`

}

export type TossResource = {
	mime: string
	src : string

}

export type TossResourceOption = {
	mime     : string
	filename?: string

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


	#deal (src: string): TossFile['pathname']
	{
		return OSS.deal(src).pathname as TossFile['pathname']

	}


	#join (pathname: TossFile['pathname']): string
	{
		let p = this.#deal(pathname)

		if (p.startsWith(`/${this.#temp_dir}`) )
		{
			return p

		}

		return `/${this.#temp_dir}${p}`

	}


	#molt (src: string): TossFile['pathname']
	{
		let v = this.#deal(src)
			.replace(
				new RegExp(`^/${this.#temp_dir}`, 'g'),

				'',

			)

		return v as TossFile['pathname']

	}




	mark (src: string): URL
	{
		return OSS.mark(this.#bucket, src)

	}


	sign
	(
		src: string | URL,

		option?: {
			expires?: number
			process?: string

		},

	)
	:	URL
	{
		if (detective.is_string(src) )
		{
			src = OSS.deal(src)

		}

		if (src.pathname === '/')
		{
			throw new reply.BadRequest('invalid src')

		}

		return this.mark(
			this.oss.signatureUrl(src.pathname, { expires: 60, ...option }),

		)

	}


	preview
	(
		src: string | URL,

		option?: {
			expires?: number
			process?: string

		},

	)
	:	string
	{
		try
		{
			return this.sign(src, option).href

		}

		catch
		{
			// 

		}

		return ''

	}


	seize
	(folder: string, mime: string): { src: URL, upload: URL }
	{
		let pathname = OSS.goal(folder, mime)

		return {
			src   : OSS.deal(pathname),
			upload: this.sign(this.#join(pathname) ),

		}

	}


	async claim
	(src: string): Promise<TossFile>
	{
		let pathname = this.#molt(src)

		let { res } = await this.head(pathname)

		let size = structure.get(res, 'content-length', '0')
		let hash = structure.get(res, 'etag', '').replace(/"/g, '')

		if (detective.is_hex_string(hash) === false)
		{
			throw new reply.BadRequest('invaild hash')

		}

		return {
			size: Number(size),

			hash,

			pathname,

		}

	}


	async cache
	(
		data: Buffer | NodeJS.ReadableStream,

		option: {
			folder   : string

			mime     : string
			filename?: string

		},

	)
	:	Promise<TossFile>
	{
		let size = new SizeTracking(data)

		let pathname = OSS.goal(option.folder, option.mime)

		await this.oss.append(
			this.#join(pathname),

			size,

			{
				mime   : option.mime,
				headers: OSS.ensure(option.mime, option.filename),

			},

		)

		return {
			size: size.value,
			hash: size.hash,

			pathname,

		}

	}


	async fasten
	(
		pathname: TossFile['pathname'],

		option?: {
			filename?: string

		},

	)
	:	Promise<TossResource>
	{
		let mime = OSS.lookup(pathname)

		let temp = this.#join(pathname)
		let final = this.#molt(pathname)

		await this.move(temp, final)

		await this.meta(final, { mime, filename: option?.filename })

		return {
			mime,

			src: this.oss.generateObjectUrl(final),

		}

	}


	async scrap
	(pathname: TossFile['pathname']): Promise<void>
	{
		let temp = this.#join(pathname)

		try
		{
			await this.delete(temp)

		}

		catch
		{
			//

		}

	}


	async move
	(source: string | URL, target: string | URL): Promise<void>
	{
		await this.copy(source, target)

		// eslint-disable-next-line @typescript-eslint/no-floating-promises
		this.delete(source)


	}


	copy
	(source: string | URL, target: string | URL): Promise<alioss.CopyAndPutMetaResult>
	{
		source = OSS.deal(source)
		target = OSS.deal(target)

		return this.oss
			.copy(
				target.pathname,
				source.pathname,

				this.#bucket,

			)

	}


	delete (src: string | URL): Promise<alioss.DeleteResult>
	{
		src = OSS.deal(src)

		return this.oss.delete(src.pathname)

	}


	head (src: string | URL): Promise<alioss.HeadObjectResult>
	{
		src = OSS.deal(src)

		return this.oss.head(src.pathname)

	}


	meta
	(src: string | URL, option: TossResourceOption): Promise<alioss.CopyAndPutMetaResult>
	{
		src = OSS.deal(src)

		return this.oss
			.copy(
				src.pathname,
				src.pathname,

				this.#bucket,

				{ headers: OSS.ensure(option.mime, option.filename) },


			)

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
		url = OSS.deal(url)

		let bucket = url.searchParams.get(this.#marked)

		if (detective.is_required_string(bucket) )
		{
			return new OSS(bucket)

		}

		throw new reply.BadRequest('invalid store url')


	}


	static mark (bucket: string, src: string): URL
	{
		let uri = OSS.deal(src)

		uri.searchParams.set(this.#marked, bucket)

		return uri

	}


	static deal (src: string | URL): URL
	{
		if (detective.is_string(src) )
		{
			return new URL(src, 'http://example.com')

		}

		src.search = ''
		src.pathname = src.pathname.replace(/\/{2,}/g, '/')

		return src

	}


	static goal (folder: string, mime: string): TossFile['pathname']
	{
		let u = this.deal(
			`${folder}/${Date.now().toString(36)}.${mime_types.extension(mime)}`,

		)

		return u.pathname as TossFile['pathname']

	}


	static lookup (src: string): string
	{
		let uri = this.deal(src)

		let mime = mime_types.lookup(uri.pathname)

		if (mime === false)
		{
			throw new reply.BadRequest('invalid mime')

		}

		return mime

	}


	static ensure (mime: string, filename?: string): Record<string, string>
	{
		let headers: Record<string, string> = {
			// eslint-disable-next-line @typescript-eslint/naming-convention
			'Content-Type': mime,

		}

		if (detective.is_required_string(filename) )
		{
			let name = decodeURIComponent(filename).split('.')
				.map(
					v => v.replace(/[^a-zA-Z0-9.\u4e00-\u9fa5]/g, ''),

				)
				.filter(
					v => v.length > 0,

				)

			let ext = name.at(-1)

			let ext_ = mime_types.extension(mime)

			if (ext_ === false)
			{
				throw new reply.BadRequest('invalid mime')

			}

			if (ext?.toLowerCase() !== ext_.toLowerCase() )
			{
				name.push(ext_)

			}

			if (name.length === 1)
			{
				throw new reply.BadRequest('invalid filename')

			}


			let filename_ = encodeURIComponent(name.join('.') )

			let disposition = [
				'attachment',

				`filename="${filename_}"`,
				`filename*=UTF-8''${filename_}`,

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
			src = OSS.deal(src)

		}

		super(bucket)

		this.#src = src

		this.#option = { ...option }

	}


	process (option: Record<string, Array<number | string> >): string
	{
		let process = [
			'image',

			'interlace,1',

			...Object.entries(option).map( ([k, v]) => [k, ...v].join(',') ),

		]

		return this.preview(
			this.#src,

			{
				...this.#option,

				process: process.join('/'),

			},

		)


	}


	resize (width: number, height?: number): string
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


	rotate (angle: number): string
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


	static new
	(bucket: string, src: string | URL, option?: { expires: number }): Image
	{
		return new Image(bucket, src, option)

	}


	static from
	(src: string | URL, option?: { expires: number }): Image
	{
		let o = OSS.from(src)

		return this.new(o.bucket, src, option)


	}


}
