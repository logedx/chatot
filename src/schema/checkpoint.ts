/**
 * 检查点
 */
import * as schema from '../lib/schema.js'

import * as user from './user.js'
import * as scope from './scope.js'
import * as weapp from './weapp.js'




export type Pathname = `/${string}`


export type Method = 'OPTIONS' | 'POST' | 'PUT' | 'PATCH' | 'GET' | 'DELETE' | 'HEAD'


export type Default = schema.Define<
	{
		weapp: null | schema.Types.Ref<weapp.Default>
		user : null | schema.Types.Ref<user.Default>

		method  : Method
		original: string

		scope : number
		expire: Date

		context : schema.Types.Mixed

	},

	{
		mode: scope.Mode

	}

>
