/**
 * 媒体模型
 */
import stream from 'node:stream'

import { Schema, SchemaType } from 'mongoose'


import * as reply from '../lib/reply.js'
import * as detective from '../lib/detective.js'

import * as oss from '../store/oss.js'
import * as database from '../store/database.js'


import * as weapp_model from './weapp.js'




export type Tm = database.Tm<
	{
		store: 'alioss'

		bucket: string
		folder: string

		mime: string
		size: number
		hash: string

		src : string

	},


	{
		filename: string
		pathname: string

	},


	{
		to_image(expires?: number): oss.Image

		safe_delete(oss: oss.OSS): Promise<void>

		safe_access(oss: oss.OSS, expires?: number): URL

	},

	{
		safe_create
		(
			oss: oss.OSS,

			option: {
				src: string

				folder: string

				mime: string
				size: number
				hash: string

				filename?: string


			}

		)
		:	Promise<Tm['HydratedDocument']>

		safe_create_
		(
			oss: oss.OSS,
			data: stream.Readable,

			option: {
				folder: string

				mime     : string
				filename?: string


			}

		)
		:	Promise<Tm['HydratedDocument']>

		safe_delete
		(oss: oss.OSS, ...src: string[]): Promise< Array< PromiseSettledResult<void> > >

	}

>

export type TPopulatePaths = {
	weapp: weapp_model.Tm['HydratedDocument']

}






const drive = await database.Mongodb.default()


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

	async safe_access (o: oss.OSS, expires = 60): Promise<string>
	{
		try
		{
			let doc = await this.track()

			let uri = await doc.safe_access(o, expires)

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

	constructor (_path: string, option: object)
	{
		super(_path, option, 'SecretSchemaType')

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


	},


)


schema.index(
	{ bucket: 1, folder: 1 },

)

schema.index(
	{ bucket: 1, folder: 1, hash: 1 },

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
			return ''

		}

		return new URL(this.src).pathname.replace(/\\/g, '/')

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
	'safe_delete',

	// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
	<Tm['TInstanceMethods']['safe_delete']>
	async function (o)
	{
		await o.delete(this.pathname)

		await this.deleteOne()

	},


)

schema.method(
	'safe_access',

	// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
	<Tm['TInstanceMethods']['safe_access']>
	function (o, expires = 60)
	{
		return o.sign(this.pathname, { expires })


	},


)


schema.static<'safe_create'>(
	'safe_create',

	async function (o, option)
	{
		let count = await this.countDocuments(
			{ bucket: o.bucket, folder: option.folder, hash: option.hash },

		)

		if (count > 0)
		{
			// eslint-disable-next-line @typescript-eslint/no-floating-promises
			o.delete(option.src)

			throw new reply.BadRequest('file already exists')

		}

		return this.create(
			{
				bucket: o.bucket,
				folder: option.folder,

				mime: option.mime,
				hash: option.hash,

				src: await o.fasten(option.src, option.filename),

			},

		)

	},

)

schema.static<'safe_create_'>(
	'safe_create_',

	async function (o, data, option)
	{
		let pathname = oss.OSS.goal(option.folder, option.mime)

		let cache = await o.cache(
			pathname,

			data,

			{
				mime   : option.mime,
				headers: oss.OSS.ensure(option.filename),

			},

		)


		return this.safe_create(
			o,

			{
				...option,

				hash: cache.hash,
				size: cache.size,

				src: cache.pathname,

			},

		)

	},

)

schema.static<'safe_delete'>(
	'safe_delete',

	function (o, ...src)
	{
		let p = src.map(
			async v =>
			{
				let doc = await this.deleteOne(
					{ bucket: o.bucket, src: Secret.cast(v) },

				)

				if (doc.deletedCount > 0)
				{
					await o.delete(v)

				}

			},

		)

		return Promise.allSettled(p)

	},


)


export default drive.model('Media', schema) as Tm['Model']
