/**
 * 邮票
 */
import * as schema from '../lib/schema.js'

import * as checkpoint from './checkpoint.js'




export type Method = '*' | checkpoint.Method


export type Pathname = checkpoint.Pathname


export type Symbol = `${Pathname}#${Lowercase<Method>}`


export type Default = schema.Define<
	{
		value : string
		symbol: Symbol

		expire: Date

		context: ArrayBuffer

		amber: schema.Types.Mixed

	},

	{
		lave  : number
		href  : string
		method: Method

	}


>
