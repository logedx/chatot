/**
 * 令牌
 */
import * as schema from '../lib/schema.js'
import * as structure from '../lib/structure.js'

import * as user from './user.js'
import * as scope from './scope.js'
import * as weapp from './weapp.js'




export type Default = schema.Define<
	{
		color: string
		scope: number

		weapp: null | schema.Types.Ref<weapp.Default>
		user : null | schema.Types.Ref<user.Default>

		value  : schema.Types.Sensitive<string>
		refresh: schema.Types.Sensitive<string>

		expire: schema.Types.Sensitive<Date>

	},

	{
		mode: scope.Mode

		is_super: boolean

		is_usable : boolean
		is_deposit: boolean
		is_survive: boolean

	}

>


export type Deposit = structure.Override<
	Default,

	{
		weapp: schema.Types.Ref<weapp.Default>

	}


>


export type Survive = structure.Override<
	Deposit,

	{
		user : schema.Types.Ref<user.Default>

	}


>
