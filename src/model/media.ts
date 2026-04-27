/**
 * 媒体模型
 */
import path from 'node:path'
import stream from 'node:stream'

import { Schema, SchemaType } from 'mongoose'


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
		pathname: oss.TossFile['pathname']

	},


	{
		to_image(expires?: number): oss.Image

		safe_delete(): Promise<void>

	},

	{
		claim
		(
			oss: oss.OSS,

			option: {
				src: string

				filename?: string

			}

		)
		:	Promise<Tm['HydratedDocument']>

		insure
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

		fasten
		(
			oss: oss.OSS,

			pathname: oss.TossFile['pathname'],

			option: {
				size: number
				hash: string

				filename?: string


			}

		)
		:	Promise<Tm['HydratedDocument']>

		safe_delete
		(...src: string[]): Promise< Array< PromiseSettledResult<void> > >

	}

>

export type TPopulatePaths = {
	weapp: weapp_model.Tm['HydratedDocument']

}






const drive = await database.Mongodb.default()


export class Secret extends String
{
	get href (): string
	{
		return this.valueOf()

	}

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

	static cast (src: string | URL): string
	{
		let v = oss.OSS.deal(src)

		if (detective.is_empty(v.pathname) )
		{
			return ''

		}

		return v.href

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
			return '' as oss.TossFile['pathname']

		}

		return new URL(this.src).pathname.replace(/\\/g, '/') as oss.TossFile['pathname']

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
	async function ()
	{
		await new oss.OSS(this.bucket).delete(this.src)

		await this.deleteOne()

	},


)


schema.static<'claim'>(
	'claim',

	async function (o, option)
	{
		let claim = await o.claim(option.src)

		return this.fasten(
			o,

			claim.pathname,

			{
				size: claim.size,
				hash: claim.hash,

				filename: option.filename,

			},

		)

	},

)

schema.static<'insure'>(
	'insure',

	async function (o, data, option)
	{
		let cache = await o.cache(data, option)

		return this.fasten(
			o,

			cache.pathname,

			{
				size: cache.size,
				hash: cache.hash,

				filename: option.filename,

			},

		)

	},

)

schema.static<'fasten'>(
	'fasten',

	async function (o, pathname, option)
	{
		let folder = path.dirname(pathname)

		let doc = await this.findOne(
			{ bucket: o.bucket, folder, hash: option.hash },

		)

		if (detective.is_exist(doc) )
		{
			// eslint-disable-next-line @typescript-eslint/no-floating-promises
			o.scrap(pathname)

			return doc

		}

		return this.create(
			{
				bucket: o.bucket,
				folder,

				size: option.size,
				hash: option.hash,

				...await o.fasten(pathname, option),

			},

		)

	},

)

schema.static<'safe_delete'>(
	'safe_delete',

	async function (...src)
	{
		let doc = await this.find(
			{ src: { $in: src.map(v => Secret.cast(v) ) } },

		)

		return Promise.allSettled(
			doc.map(
				v => v.safe_delete(),

			),

		)

	},


)


export default drive.model('Media', schema) as Tm['Model']
