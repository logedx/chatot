/**
 * 媒体模型
 */
import path from 'node:path'
import stream from 'node:stream'

import { Schema } from 'mongoose'


import * as detective from '../lib/detective.js'

import * as oss from '../store/oss.js'
import * as database from '../store/database.js'


import * as media from '../schema/media.js'




// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Default
{
	export type Define = media.Default

	export type Methods = {
		to_image(expires?: number): oss.Image

		safe_delete(): Promise<void>

	}

	export type Statics = {
		claim
		(
			oss: oss.OSS,

			option: {
				src: string

				filename?: string

			}

		)
		:	Promise<Default.Document>

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
		:	Promise<Default.Document>

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
		:	Promise<Default.Document>

		safe_delete
		(...src: string[]): Promise< Array<PromiseSettledResult<void> > >

	}

	export type Schema = database.Schema<Default.Define, Default.Methods, Default.Statics>

	export type Keywords = database.Probe<Default.Define>

	export type Document = database.Document<Default.Schema>


}


// eslint-disable-next-line @stylistic/function-call-spacing
export const default_schema: Default.Schema = new Schema
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


default_schema.index(
	{ bucket: 1, folder: 1 },

)

default_schema.index(
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

export default drive.model('Media', default_schema)
