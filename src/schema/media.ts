/**
 * 媒体
 */
import * as schema from '../lib/schema.js'




export type Store = 'alioss'


export type Pathname = `/${string}`


export type Default = schema.Define<
	{
		store: Store

		bucket: string
		folder: string

		mime: string
		size: number
		hash: string

		src : string

	},

	{
		filename: string
		pathname: Pathname

	}

>
