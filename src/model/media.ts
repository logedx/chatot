/**
 * 媒体模型
 */
import path from 'node:path'
import crypto from 'node:crypto'
import stream from 'node:stream'

import mime_types from 'mime-types'

import { Schema, Types, SchemaType } from 'mongoose'


import * as reply from '../lib/reply.js'
import * as detective from '../lib/detective.js'

import * as oss from '../store/oss.js'
import * as database from '../store/database.js'


import * as weapp_model from './weapp.js'




export type Tm = database.Tm<
	{
		weapp: Types.ObjectId

		store : 'alioss'
		bucket: string
		folder: string

		mime: string
		size: number
		hash: string

		src : string

		linker: Types.Array<
			{
				name : string
				model: string

			}

		>


	},


	{
		filename: string
		pathname: string

	},


	{
		seize(): string

		goal(this: Tm['HydratedDocument'], expires?: number): Promise<URL>

		to_image(expires?: number): oss.Image

		safe_push(
			body: stream.Readable,

			options?: {
				filename?: string

			},

		)
		:	Promise<Tm['HydratedDocument']>

		safe_delete(): Promise<void>

		safe_access(expires?: number): Promise<URL>

	},

	{
		safe_create
		(
			weapp: weapp_model.Tm['HydratedDocument'],

			options: {
				name : string
				model: string

				folder: string

				mime : string
				hash?: string

			}

		)
		:	Promise<Tm['HydratedDocument']>

		safe_delete
		(weapp: Types.ObjectId, ...src: string[])
		: Promise<
			Array<
				PromiseSettledResult<void>

			>

		>

		safe_access(weapp: Types.ObjectId, src: string, expires?: number): Promise<URL>

		safe_to_link
		(
			name: string,
			model: string,

			query: { folder: string, hash: string } | { src: string }

		)
		: Promise<null | Tm['HydratedDocument']>

	}

>

export type TPopulatePaths = {
	weapp: weapp_model.Tm['HydratedDocument']

}






const drive = await database.Mongodb.default()


class SizeTracking extends stream.Transform implements stream.Transform
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


export class Secret extends String
{
	// eslint-disable-next-line @typescript-eslint/naming-convention
	valueOf (): string
	{
		return super.valueOf()

	}

	// eslint-disable-next-line @typescript-eslint/naming-convention
	toBSON (): string
	{
		return super.valueOf()

	}

	// eslint-disable-next-line @typescript-eslint/naming-convention
	toString (): string
	{
		return super.toString()

	}

	async track (): Promise<Tm['HydratedDocument']>
	{
		let doc = await drive.model<typeof schema>('Media')
			.findOne<Tm['HydratedDocument']>(
				{ src: this.valueOf() },

			)

		reply.NotFound.asserts(doc, 'media is not found')

		return doc

	}

	async safe_access (expires = 60): Promise<string>
	{
		try
		{
			let doc = await this.track()

			let uri = await doc.safe_access(expires)

			return uri.href

		}

		catch
		{
			// 

		}

		return ''

	}

	async to_image (expires = 60): Promise<null | oss.Image>
	{
		try
		{
			let doc = await this.track()

			return oss.Image
				.new(
					doc.bucket, doc.src, { expires },

				)

		}

		catch
		{
			// 

		}

		return null

	}

	static cast (src: string | URL): string
	{
		if (detective.is_media_uri_string(src) )
		{
			src = new URL(src)

		}

		if (src instanceof URL)
		{
			src.search = ''

			return src.href

		}

		return ''

	}


}


class SecretSchemaType extends SchemaType
{
	/** This schema type's name, to defend against minifiers that mangle function names. */
	// eslint-disable-next-line @typescript-eslint/naming-convention
	static schemaName: 'Secret'

	constructor (_path: string, options: object)
	{
		super(_path, options, 'SecretSchemaType')

		this.select(false)

		this.default('')

		this.set(
			function (src: string | URL): string
			{
				return Secret.cast(src)

			},

		)

	}

	cast (value: string): Secret
	{
		return new Secret(value)

	}


}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
drive.Schema.Types.Secret = SecretSchemaType


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
		weapp: {
			type    : Schema.Types.ObjectId,
			ref     : () => weapp_model.default,
			index   : true,
			required: true,

		},

		store: {
			type    : String,
			required: true,
			trim    : true,
			enum    : ['alioss'],
			default : 'alioss',

		},

		bucket: {
			type    : String,
			required: true,
			trim    : true,

		},

		folder: {
			type    : String,
			required: true,
			trim    : true,
			set     : (v: string) => v.replace(/\\/g, '/')
				.replace(/\/{2,}/g, '/')
				.replace(/^([^/])/g, '/$1'),

		},


		mime: {
			type     : String,
			required : true,
			lowercase: true,
			trim     : true,

		},

		size: {
			type    : Number,
			required: true,
			min     : 0,
			default : 0,

		},

		hash: {
			type : String,
			index: true,
			trim : true,

		},

		src: {
			type  : String,
			unique: true,
			sparse: true,
			trim  : true,

			set (v: string | URL): string
			{
				return Secret.cast(v)

			},

		},

		linker: [
			{
				name: {
					type     : String,
					required : true,
					lowercase: true,
					trim     : true,

				},

				model: {
					type    : String,
					required: true,
					trim    : true,
					validate (v: string): boolean
					{
						let k = v.toLowerCase()

						let name = drive.modelNames()

						return name.some(
							vv => vv.toLowerCase() === k,

						)

					},

				},

			},

		],
	},

)


schema.index(
	{ weapp: 1, folder: 1 },

)

schema.index(
	{ weapp: 1, folder: 1, hash: 1 },

	{
		unique: true,

		// eslint-disable-next-line @typescript-eslint/naming-convention
		partialFilterExpression: {
			hash: { $exists: true },

		},

	},

)


schema.virtual('filename').get(
	function (): Tm['TVirtuals']['filename']
	{
		return this.pathname.split('/').pop() ?? ''

	},

)

schema.virtual('pathname').get(
	function (): Tm['TVirtuals']['pathname']
	{
		if (detective.is_empty(this.src) )
		{
			return this.seize()

		}

		return new URL(this.src)
			.pathname.replace(/\\/g, '/')

	},

)


schema.method(
	'seize',

	// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
	<Tm['TInstanceMethods']['seize']>
	function ()
	{
		let name = Date.now().toString(36)

		let extension = mime_types.extension(this.mime)

		return path.join(this.folder, `${name}.${extension}`).replace(/\\/g, '/')

	},

)

schema.method(
	'goal',

	// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
	<Tm['TInstanceMethods']['goal']>
	async function (expires = 300)
	{
		if (detective.is_required_string(this.src) )
		{
			throw new reply.BadRequest('src is exist')

		}

		if (detective.is_hex_string(this.hash) === false)
		{
			throw new reply.BadRequest('invalid hash')

		}


		let doc = await this.populate<TPopulatePaths>('weapp')

		let src = doc.weapp.to_oss()
			.sign(
				this.pathname, { expires },

			)

		await this.updateOne(
			{ src: src.href },

		)

		return src

	},

)

schema.method(
	'to_image',

	// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
	<Tm['TInstanceMethods']['to_image']>
	function (expires = 60)
	{
		return new oss.Image(
			this.bucket, this.pathname, { expires },

		)

	},


)

schema.method(
	'safe_push',

	// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
	<Tm['TInstanceMethods']['safe_push']>
	async function (body, options)
	{
		let size = new SizeTracking()

		let headers: Record<string, string> = {}

		if (detective.is_required_string(options?.filename) )
		{
			let disposition = [
				'attachment',

				`filename="${options.filename}"`,
				`filename*=UTF-8''${encodeURIComponent(options.filename)}`,

			]

			headers['Content-Disposition'] = disposition.join('; ')

		}

		let doc = await this.populate<TPopulatePaths>('weapp')

		let result = await doc.weapp.to_oss()
			.append(
				this.pathname,

				body.pipe(size),

				{
					headers,
					mime: this.mime,

				},

			)

		this.size = size.value
		this.hash = size.hash

		this.src = result.url

		await this.save()

		return this

	},


)

schema.method(
	'safe_delete',

	// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
	<Tm['TInstanceMethods']['safe_delete']>
	async function ()
	{
		let doc = await this.populate<TPopulatePaths>('weapp')

		let store = doc.weapp.to_oss()

		await store.delete(this.pathname)

		await this.deleteOne()

	},


)

schema.method(
	'safe_access',

	// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
	<Tm['TInstanceMethods']['safe_access']>
	async function (expires = 60)
	{
		let doc = await this.populate<TPopulatePaths>('weapp')

		return doc.weapp.to_oss()
			.sign(
				this.pathname, { expires },

			)


	},


)


schema.static<'safe_create'>(
	'safe_create',

	async function (weapp, option)
	{
		if (detective.is_required_string(option.hash) )
		{
			let doc = await this.safe_to_link(
				option.name,
				option.model,

				{ folder: option.folder, hash: option.hash },

			)

			if (detective.is_exist(doc) )
			{
				return doc

			}

		}


		return this.create(
			{
				weapp: weapp._id,

				bucket: weapp.bucket,
				folder: option.folder,

				mime: option.mime,
				hash: option.hash,

				linker: [
					{ name: option.name, model: option.model },

				],

			},

		)

	},

)

schema.static<'safe_delete'>(
	'safe_delete',

	async function (weapp, ...src)
	{
		src = src.map(
			v =>
			{
				let uri = new URL(v)

				uri.search = ''

				return uri.href

			},

		)

		let doc = await this.find(
			{ weapp, src },

		)

		let p = doc.map(
			v => v.safe_delete(),

		)

		return Promise.allSettled(p)

	},


)

schema.static<'safe_access'>(
	'safe_access',

	async function (weapp, src, expires = 60)
	{
		let doc = await this.findOne(
			{ weapp, src },

		)

		reply.NotFound.asserts(doc, 'media is not found')

		return doc.safe_access(expires)

	},


)

schema.static<'safe_to_link'>(
	'safe_to_link',

	async function (name, model, query)
	{
		let doc = await this.findOne(query)

		if (detective.is_empty(doc) )
		{
			return null

		}

		await doc.updateOne(
			{
				// eslint-disable-next-line @typescript-eslint/naming-convention
				$addToSet: {
					linker: { name: name.toLowerCase(), model: model.toLowerCase() },

				},

			},

		)

		return doc

	},


)


export default drive.model('Media', schema) as Tm['Model']
