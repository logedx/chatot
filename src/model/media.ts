/**
 * 媒体模型
 */
import path from 'node:path'
import stream from 'node:stream'

import { Schema } from 'mongoose'


import * as model from '../lib/model.js'
import * as detective from '../lib/detective.js'

import * as oss from '../store/oss.js'
import * as database from '../store/database.js'




// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Default
{
	export type Model = model.Define<
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
			pathname: `/${string}`

		}

	>

	export type Schema = database.Schema<
		Model,

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
			:	Promise<HydratedDocument>

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
			:	Promise<HydratedDocument>

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
			:	Promise<HydratedDocument>

			safe_delete
			(...src: string[]): Promise< Array< PromiseSettledResult<void> > >

		}


	>

	export type HydratedDocument = database.HydratedDocument<Schema>

}


// eslint-disable-next-line @stylistic/function-call-spacing
export const schema: Default.Schema = new Schema
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
				return oss.OSS.deal(v).href

			},

		},


	},

	{
		virtuals: {
			filename: {
				get ()
				{
					return this.pathname.split('/').pop() ?? ''

				},

			},

			pathname: {
				get ()
				{
					if (detective.is_empty(this.src) )
					{
						return '' as oss.TossFile['pathname']

					}

					return new URL(this.src).pathname.replace(/\\/g, '/') as oss.TossFile['pathname']

				},


			},


		},

		methods: {
			to_image (expires = 60)
			{
				return new oss.Image(
					this.bucket, this.pathname, { expires },

				)

			},

			async safe_delete ()
			{
				await new oss.OSS(this.bucket).delete(this.src)

				await this.deleteOne()

			},


		},

		statics: {
			async claim (o, option)
			{
				let claim = await o.claim(option.src)

				return (this as unknown as Default.Schema['statics'])
					.fasten(
						o,

						claim.pathname,

						{
							size: claim.size,
							hash: claim.hash,

							filename: option.filename,

						},

					)

			},

			async insure (o, data, option)
			{
				let cache = await o.cache(data, option)

				return (this as unknown as Default.Schema['statics'])
					.fasten(
						o,

						cache.pathname,

						{
							size: cache.size,
							hash: cache.hash,

							filename: option.filename,

						},

					)

			},

			async fasten (o, pathname, option)
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

			async safe_delete (...src)
			{
				let doc = await this.find(
					{ src: { $in: src.map(v => oss.OSS.deal(v).href) } },

				)

				return Promise.allSettled(
					doc.map(
						v => v.safe_delete(),

					),

				)

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


const drive = await database.Mongodb.default()

export default drive.model('Media', schema)
