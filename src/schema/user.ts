/**
 * 用户
 */
import * as schema from '../lib/schema.js'


import * as scope from './scope.js'
import * as weapp from './weapp.js'




export type Default = schema.Define<
	{
		weapp: schema.Types.Ref<weapp.Default>

		active: boolean

		avatar  : string
		nickname: schema.Types.Keyword<string>
		color   : string

		phone: schema.Types.Field<'keyword' | 'sensitive', string>

		wxopenid : schema.Types.Sensitive<string>
		wxsession: schema.Types.Sensitive<string>

		scope: schema.Types.Sensitive<null | scope.Default>

	},

	// eslint-disable-next-line @typescript-eslint/no-empty-object-type
	{}

>
